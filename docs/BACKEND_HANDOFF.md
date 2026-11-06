# Backend handoff (Phase 4 and Phase 5)

For whoever builds the ServiceNow backend. The frontend is finished as a prototype and talks to a single interface
(`RoomRelayDataSource`). Your job is to build the server side and replace the mock data source behind that interface.

**Read this first, then [ROLE_PERMISSION_MATRIX.md](ROLE_PERMISSION_MATRIX.md), [API_SECURITY_CHECKLIST.md](API_SECURITY_CHECKLIST.md)
and [AI_DESIGN.md](AI_DESIGN.md).**

> Everything below is a **design proposal** based on the working prototype. Nothing here has been created in
> the PDI or tested against it. Where this document says "verify", the author could not confirm it without access to
> the instance. Use your judgement and adjust.

## 1. Ground rules

1. **The server is the only place that decides anything.** The browser hides buttons and filters lists, but anyone can
   call your APIs directly. Every rule in the frontend must be repeated on the server.
2. **Room readiness is deterministic.** A room is Ready only when all three are true:
   (a) every mandatory task is done, (b) no blocking defect is unresolved, (c) the required inspection has passed.
   AI text never influences this.
3. Keep the existing application scope `x_2305075_roomrela`, the package name and the UI Page endpoint
   `x_2305075_roomrela_incident_manager.do`. Do not recreate the app and never install with `--reinstall` for normal updates.
4. Use the SDK's Fluent API for metadata where it covers it. The installed SDK 4.14.0 docs
   (`node_modules/@servicenow/sdk/docs/api/`) list: `Table`, `Role`, `Acl`, `BusinessRule`, `RestApi`,
   `ScriptInclude`, `RestMessage`, `Property`, `CrossScopePrivilege`, `UiPage` and more. Verify each against the Brazil
   release before relying on it.
5. Do not touch the `incident` table. The starter's incident code was deleted on purpose.
6. Test with real non-admin users, never only as `admin`.

## 2. Readiness rules (the source of truth)

The reference implementation is `src/client/domain/readiness.ts`. Port it to a server Script Include and test it with
the same cases as `tests/logic.test.cjs`.

Inputs for one room: its tasks, its defects, and its inspection state.

| Condition | Result |
|---|---|
| Any **mandatory** task not `done` | Not ready |
| Any defect with `blocking = true` and status not `resolved` | Not ready, status **Blocked** |
| Inspection not `passed` | Not ready |
| Inspection `failed` | Status **Blocked** |
| Optional tasks open, non-blocking defects open, resolved defects | **Do not** block |
| All three satisfied | **Ready** |

Status derivation, in this order:

1. Open blocking defect, or inspection `failed` -> `blocked`
2. Any mandatory task not done -> `in_progress` if any task has started (status not `todo`), else `needs_cleaning`
3. Inspection not `passed` -> `pending_inspection`
4. Otherwise -> `ready`

Edge case covered by a test: a room with **zero** mandatory tasks and no passed inspection is not Ready.

User-facing sentence (keep exact wording, the frontend and tests expect it):
`Room 305 cannot be marked Ready because 2 mandatory tasks remain incomplete.` Multiple reasons are joined with
", " and " and ".

## 3. Proposed data model

Table names use the scope prefix `x_2305075_roomrela_`. Fields marked **server** must be written only by server code and be
read-only to clients through ACLs.

### 3.1 `room`

| Field | Type | Notes |
|---|---|---|
| `number` | String, 3 to 4 digits, **unique**, display value | Frontend uses it as the id. Validate `^\d{3,4}$`. |
| `floor` | Integer | |
| `room_type` | String or choice | e.g. Standard Queen, Deluxe King |
| `assigned_to` | Reference to `sys_user` | The housekeeper |
| `inspection_status` | Choice: `not_requested`, `pending`, `passed`, `failed` | Changed only by server logic |
| `inspection_at` | Date/time | |
| `readiness_status` | Choice: `needs_cleaning`, `in_progress`, `pending_inspection`, `blocked`, `ready` | **server**. Derived by the evaluator. Stored so lists can filter fast. |
| `ready_confirmed_by`, `ready_confirmed_at` | Reference, date/time | **server**, audit |

### 3.2 `housekeeping_task`

`room` (reference, mandatory), `title`, `description`, `mandatory` (boolean), `priority` (`low`, `normal`, `high`, `urgent`),
`status` (`todo`, `in_progress`, `done`), `assigned_to` (reference to `sys_user`), `supervisor_review`
(`not_required`, `pending`, `approved`; **server**), `completed_at` (**server**).

### 3.3 `defect`

`room` (reference, mandatory), `title`, `description`, `severity` (`low`, `medium`, `high`, `critical`),
`blocking` (boolean), `status` (`open`, `in_progress`, `resolved`), `technician` (reference to `sys_user`),
`resolution_notes`, `resolved_at` (**server**). Use `sys_created_on` and `sys_created_by` for reported-at and reported-by.

### 3.4 `staff_profile`

`user` (reference to `sys_user`, unique), `shift` (`morning`, `afternoon`, `night`). Shift is needed for the dashboard and
handoff. Alternatively extend `sys_user`; a separate table avoids changing a platform table.

### 3.5 `access_request` (for the "Request an account" page)

`full_name`, `email`, `requested_role`, `shift`, `reason`, `status` (`pending`, `approved`, `declined`),
`decided_by`, `decided_at`. The requester can never set `status` or any role. See section 8 for the sign-in caveat.

### 3.6 `activity` (audit and the room timeline)

`room`, `actor` (reference to `sys_user`), `event` (task completed, defect reported, defect resolved, inspection
passed or failed, ready confirmed, briefing generated), `text`, `at`. Written by business rules. The frontend currently
derives the timeline from timestamps; either approach works, but a real audit table is better for the capstone's
"audit important changes" requirement.

### 3.7 `handoff_briefing` (Phase 5)

`shift`, `generated_by`, `generated_at`, `source` (`ai` or `fallback`), `text`/`json`, `model`, `input_counts`.
Store enough to audit, not the raw confidential data.

## 4. Roles

Create four application roles (suggested names, scoped):

| Role | Suggested name |
|---|---|
| Housekeeping Staff | `x_2305075_roomrela.housekeeper` |
| Maintenance Staff | `x_2305075_roomrela.maintenance` |
| Housekeeping Supervisor | `x_2305075_roomrela.supervisor` |
| System Administrator (app) | `x_2305075_roomrela.app_admin` |

Do **not** make roles contain each other. The prototype assumes one role per person; if a person can hold several,
decide how the frontend picks a view and update `Role` handling (see section 7).

## 5. Access control (ACLs)

Deny by default. "Own" means the record's `assigned_to` (or `technician`) equals the signed-in user. Use row-level
conditions or scripts; test each cell with a non-admin user.

| Table | Operation | housekeeper | maintenance | supervisor | app_admin |
|---|---|---|---|---|---|
| room | read | own rooms | rooms that have a defect assigned to them | all | all (read only) |
| room | write | no | no | only through the server logic (inspection, confirm) | no |
| room fields `readiness_status`, `ready_confirmed_*`, `inspection_*` | write | no | no | no direct write; server code only | no |
| housekeeping_task | read | tasks of own rooms | no | all | all |
| housekeeping_task | write | `status` of own tasks only | no | `supervisor_review`, reassign | no |
| defect | read | defects in own rooms | assigned to them | all | all |
| defect | create | yes, own rooms | no | yes | no |
| defect | write | no | assigned only: `status`, `resolution_notes` | `technician`, `blocking`, `severity` | no |
| access_request | read | no | no | no | all |
| access_request | create | see section 8 | | | |
| access_request | write | no | no | no | `status` (approve or decline) |
| activity, handoff_briefing | read | no | no | all | all |
| activity, handoff_briefing | write | server only | server only | server only | server only |

Also protect the **UI Page**: confirm in the PDI whether the page is reachable without sign-in and restrict it to
authenticated users with one of the four roles. The SDK `UiPage` docs show no roles property, so restricting to the four
roles probably has to be set on the instance record. **Signed-out access is already refused** (verified 2026-11-06:
redirected to the ServiceNow login); role-level restriction still needs to be set and tested.

Use `GlideRecordSecure` (or explicit `canRead()`/`canWrite()`) in scripts so the caller's ACLs apply, and never return
fields the caller should not see.

## 6. Business rules and server logic

Put the rules in one **Script Include** (`ReadinessEvaluator`) used by every rule and REST endpoint, so there is a single
implementation.

| # | Trigger | What it must do |
|---|---|---|
| 1 | `room` before update | If `readiness_status` or inspection moves toward Ready, run the evaluator. If it fails, **abort** with a safe message (the "cannot be marked Ready because..." sentence). |
| 2 | Confirm-ready action | Only role `supervisor`. Re-run the evaluator **inside the same transaction** that sets the status. Require `inspection_status = pending` before pass. |
| 3 | `housekeeping_task` after insert/update/delete | Recompute and store the room's `readiness_status`. Set `completed_at` and `supervisor_review = pending` when a task becomes `done`. Prevent changing a task that belongs to someone else's room. |
| 4 | `defect` after insert/update | Recompute the room's status. Resolving requires non-empty `resolution_notes`. Only the assigned technician or a supervisor may resolve. |
| 5 | Submit-for-inspection action | Only the room's assigned housekeeper. Requires all mandatory tasks done and no open blocking defect. Sets `inspection_status = pending`. |
| 6 | All of the above | Write an `activity` row. |

**Duplicate and concurrent requests.** Make state changes conditional on the current state ("only if still `pending`"). A second
identical request should find the state already changed and return HTTP 409, not apply twice. Compare a version
(for example `sys_mod_count` or `sys_updated_on`) sent by the client for edits.

**Protect against direct API bypass.** Table API writes to protected fields must be blocked by ACLs, not by hoping
nobody calls them. Test by calling `/api/now/table/<your table>` as a non-admin and trying to set `readiness_status`.

## 7. REST API contract the frontend expects

Recommended: one **Scripted REST API** (`/api/x_2305075_roomrela/v1/...`) instead of letting the browser call the Table API
directly. It returns only the fields needed, applies the caller's access, and gives one place for validation. Verify the
exact base path when you create it.

The browser must send the session CSRF token with every request (the starter app used `window.g_ck` in the
`X-UserToken` header; reuse that pattern, in one place only).

### 7.1 Read

`GET /me` -> `{ id, name, role, shift }` where `role` is one of `housekeeping`, `maintenance`, `supervisor`, `admin`.
The server decides the role; the client never sends it.

`GET /snapshot` -> exactly the `Snapshot` shape in `src/client/types/domain.ts`:

```ts
{
  rooms:   Room[]                // id (room number), floor, type, assigneeId, inspection, inspectionAt?
  tasks:   HousekeepingTask[]    // id, roomId, title, description, mandatory, priority, status, assigneeId, supervisorReview, completedAt?
  defects: Defect[]              // id, roomId, title, description, severity, blocking, status, technicianId?, reportedAt, resolvedAt?, resolutionNotes?
  staff:   Staff[]               // id, name, role, shift  (only people the caller may see; avoid extra personal data)
  generatedAt: string            // ISO time
  source: 'servicenow'
}
```

The server must return **only records the caller may see** (the frontend's `scope.ts` only simulates this). The
frontend computes readiness from this data for display; consider also returning `readinessStatus` from the server and
having the UI show the server value, so the two can never disagree.

### 7.2 Write

| Method and path | Who | Body | Success | Notes |
|---|---|---|---|---|
| `PATCH /tasks/{id}` | housekeeper (own) | `{ status }` | updated task | Allowed transitions only |
| `POST /rooms/{number}/submit-inspection` | housekeeper (own) | none | updated room | Rule 5 |
| `POST /rooms/{number}/confirm-ready` | supervisor | `{ version }` | updated room | Rules 1 and 2. 409 if state changed. |
| `POST /defects` | housekeeper, supervisor | `{ roomId, title, description, severity, blocking }` | new defect | Validate with the limits in `domain/validation.ts` |
| `POST /defects/{id}/resolve` | maintenance (assigned), supervisor | `{ notes }` | updated defect | Rule 4 |
| `POST /handoff/briefings` | supervisor | `{ shift }` | briefing | See `AI_DESIGN.md`; returns `source: 'ai'` or `'fallback'` |
| `POST /access-requests` | see section 8 | the request form | `{ received: true }` | |
| `POST /access-requests/{id}/decision` | app_admin | `{ decision }` | updated request | Approving also needs a person to grant roles in ServiceNow |

### 7.3 Errors

Return the same envelope for every failure and **never** include stack traces, table names or script text:

```json
{ "error": { "code": "forbidden", "message": "You do not have permission to view this information." } }
```

Map status codes to the frontend's `ApiError` kinds (`src/client/services/dataSource.ts`):

| HTTP | `ApiErrorKind` |
|---|---|
| 401 | `unauthenticated` (or `expired` when the session timed out) |
| 403 | `forbidden` |
| 404 | `not_found` (also use 404 for records the caller may not know exist) |
| 409 | conflict: add a kind, show "this changed, reload" |
| 5xx | `server` |
| network failure | `network` |

## 8. Sign-in and account requests: what changes in production

In the prototype, `#/login` lets you choose a demo account, and `#/signup` is a form anyone can reach. **In ServiceNow:**

- ServiceNow signs people in and out. Users reach the UI Page only after logging in (unless the page is public, which it
  must not be). So the React sign-in page will normally never appear, and **there must be no password handling in React.**
  Sign out should send the user to ServiceNow's logout (the usual path is `/logout.do`; verify on the instance).
- The "Request an account" form assumes a signed-out visitor, which a protected UI Page cannot serve. Pick one:
  (a) remove the page and rely on IT creating users, (b) use ServiceNow's own self-registration or SSO onboarding,
  (c) a separate, deliberately public, heavily limited endpoint. Option (c) needs input validation, rate limiting, spam
  and abuse controls and must never create a user or grant a role by itself. **Roles are always granted by an administrator.**
- Keep demo mode for presentations behind a build or configuration switch, and make sure the production build does not
  contain the demo accounts.

## 9. What to change in the frontend

All change points are small because components use interfaces, not `fetch`.

1. **Data source.** Add `src/client/services/serviceNowDataSource.ts` implementing `RoomRelayDataSource` (`getSnapshot`).
   In `src/client/app.tsx` replace `new MockDataSource()`. Map API errors to `ApiError` (never show raw server text).
2. **Mutations.** The interface has only `getSnapshot` today. Add methods (`submitInspection`, `confirmReady`,
   `reportDefect`, `resolveDefect`, `updateTask`, `generateBriefing`, `requestAccess`, `decideAccessRequest`) and call them from
   the places that currently only simulate:

   | Screen | File | Simulated today |
   |---|---|---|
   | Room details actions | `features/rooms/ReadinessPanel.tsx` | `SimulationDialog` |
   | Report defect | `features/maintenance/ReportDefectDialog.tsx` | validates, shows preview |
   | Record resolution | `features/maintenance/ResolutionDialog.tsx` | validates, shows preview |
   | Shift handoff | `features/handoff/HandoffScreen.tsx` | `buildSimulatedBriefing` |
   | Approve or decline | `features/access/AccessScreen.tsx` | `SimulationDialog` |
   | Request account | `features/auth/CreateAccountScreen.tsx` | validates only |

   After a successful write, reload the snapshot (`useSnapshot` already supports `reload`). Show the server's decision;
   do not assume success.
3. **Session.** Replace the demo accounts in `app/session.tsx` with `GET /me`. Remove `PrototypeTools`, `LoginScreen`
   and `data/mockAccess.ts` from the production path (or hide them behind the demo switch).
4. **Scope filtering.** `domain/scope.ts` can stay as a convenience, but the server must already have filtered the data.
5. **Remove prototype labels** ("Prototype: synthetic data" banners, "Simulation only" dialogs) only for flows that are
   really connected and tested. Leave them on anything still simulated.
6. **Keep** `domain/readiness.ts`, `domain/validation.ts` and the logic tests: they now document the rules the server must match.

## 10. Phase 5: real AI

See [AI_DESIGN.md](AI_DESIGN.md). In short: the call to the AI provider is made by ServiceNow server code with the key held in
a credential, never in the browser; only authorized, minimized data is sent; the reply is validated and shown as plain text;
if anything fails, return the deterministic template briefing labeled as non-AI. The template logic to port is
`src/client/domain/handoff.ts`.

## 11. Suggested build order

1. Tables, roles, `staff_profile`, sample data matching the prototype's scenarios (see `src/client/data/mockData.ts`).
2. `ReadinessEvaluator` Script Include with the same tests as `tests/logic.test.cjs`.
3. ACLs, then **test as non-admin users** for each role in the matrix.
4. Business rules and the write endpoints with 403, 409 and validation tests.
5. `GET /me` and `GET /snapshot`; connect the frontend's data source (reads first).
6. Mutations one at a time, each followed by its tests from `TEST_PLAN.md` section 5.
7. Install into the PDI, then run `DEPLOYMENT_GUIDE.md` checks and the security tests.
8. AI integration last.

## 12. Known unknowns (verify early)

Resolved on 2026-11-06 (prototype installed in `dev472716`):

- **UI Page needs sign-in: verified.** A signed-out visit was redirected to ServiceNow's login. Still confirm it again after adding roles, and decide whether to restrict it to the four app roles.
- **Hash routing works** inside the platform page (`#/dashboard` rendered; other routes reported working).
- **The embedded font and inline styles render**; the team lead reported no problems. The Console output was not captured, so re-check for Content Security Policy messages.

Still open:

- How `window.g_ck` behaves on this direct UI Page (run `typeof window.g_ck` in the Console; do not print the token).
- Fluent API support for each metadata type on the Brazil release (tables, ACLs with scripts, business rules, scripted REST).
- Exact logout path and how the signed-in user's roles are best read on the server.
- How the prototype's own sign-in page should behave now that ServiceNow already signed the user in (it currently shows a second, demo sign-in).
