# Backend handoff (Phase 4 and Phase 5)

For whoever works on the ServiceNow backend. The frontend talks to a single interface (`RoomRelayDataSource`:
`getSnapshot` to read, `execute(command)` to change), implemented by the RoomRelay REST API inside ServiceNow and by an
in-memory demo in the local preview. Section 0 describes what is built; sections 1 to 10 are the design it follows.

**Read this first, then [GLOSSARY.md](GLOSSARY.md), [ROLE_PERMISSION_MATRIX.md](ROLE_PERMISSION_MATRIX.md),
[API_SECURITY_CHECKLIST.md](API_SECURITY_CHECKLIST.md) and [AI_DESIGN.md](AI_DESIGN.md).**

> **Status (2026-11-07): a first working version of the backend is built, installed in `dev486421` and verified there**
> for every role and the full Room 102 scenario (`TEST_PLAN.md` section 4b, P11 to P21). Sections 1 to 12 are the
> design it follows; where something differs from the design, section 0 says so. Where this document says "verify",
> it could not be confirmed without the instance.

## 0. What is built

| Piece | Where | Notes |
|---|---|---|
| Roles | `src/fluent/auth/roles.now.ts` | The four roles in section 4 |
| Tables | `src/fluent/<slice>/*-table.now.ts` | `x_2318724_roomrela_room`, `_task`, `_defect`, `_audit`, `_staff` (names are short because table names are limited to 30 characters) |
| ACLs | same files, plus `src/fluent/api/roomrelay-api.now.ts` | Tables: read-only for `app_admin` (staff profiles also editable by `app_admin`); everyone else is denied direct access. REST API: any of the four roles. |
| REST API | `src/fluent/api/roomrelay-api.now.ts`, handlers in `src/server/api/handlers.ts` | `GET /me`, `GET /snapshot`, `POST /commands`, `POST /demo/reset` under `/api/x_2318724_roomrela/v1/roomrelay` |
| Data access | `src/server/data/repository.ts` | Reads the tables into the `Snapshot` shape and writes back only what a rule changed |
| Identity | `src/server/shared/session.ts` | Caller from `gs.getUserID()`, role from `sys_user_has_role`; a platform admin without an app role counts as `admin` |
| Rules | **the same files the frontend uses** (section 2) | `now.config.json` turns them into server modules too, so the browser demo and the server can never disagree |
| Staff accounts and initial data | `src/fluent/auth/demo-users.now.ts`, `src/server/data/demoData.ts` | 9 users installed without passwords (the administrator sets passwords in ServiceNow, or uses Impersonate User); "Restore initial data" fills the tables from `src/client/mock/mockData.ts` |
| Frontend connection | `src/client/shared/api/serviceNowDataSource.ts`, `environment.ts`, `features/auth/session.tsx` | Inside ServiceNow the app uses the real user and the REST API; the local preview keeps the demo |

How a request is handled: the handler resolves the caller from the session, parses the body with `parseCommand`
(unknown types and unknown fields are rejected), loads the current data, runs the shared rule through `applyCommand`,
and saves the difference with one audit row per change. Reads go through `scopeSnapshotForRole` so a user only ever
receives what their role may see.

Differences from the design below:

- **One write endpoint**, `POST /commands`, instead of one path per action (section 7.2). The body is the `Command`.
- **Readiness is not stored**; it is calculated on every read, so it cannot go stale. Add a stored copy only if lists in
  the platform need to filter by it.
- **Plain `GlideRecord`** in the handlers rather than `GlideRecordSecure`: the tables are closed to direct access, and the
  handlers apply the role and ownership rules themselves.
- **Concurrency** relies on the rules' state checks ("only if still pending"), not on a version number. Two requests in the
  same instant could both pass; acceptable for the capstone, noted for later.
- **Technicians receive the full data of the rooms they work in** (tasks included), as in the prototype. Trim later if needed.
- **No access requests or self-registration.** RoomRelay is for hotel staff only; the administrator creates users and grants roles in ServiceNow. The simulated pages were removed on 2026-11-07.

## 1. Ground rules

1. **The server is the only place that decides anything.** The browser hides buttons and filters lists, but anyone can
   call your APIs directly. Every rule in the frontend must be repeated on the server.
2. **Room readiness is deterministic.** A room is Ready only when all three are true:
   (a) every mandatory task is **Completed**, (b) no defect with priority **Blocking** is unresolved, (c) the required
   inspection has passed. AI text never influences this.
3. Keep the existing application scope `x_2318724_roomrela`, the package name and the UI Page endpoint
   `x_2318724_roomrela_incident_manager.do`. Do not recreate the app and never install with `--reinstall` for normal updates.
4. Use the SDK's Fluent API for metadata where it covers it. The installed SDK 4.14.0 docs
   (`node_modules/@servicenow/sdk/docs/api/`) list: `Table`, `Role`, `Acl`, `BusinessRule`, `RestApi`,
   `ScriptInclude`, `RestMessage`, `Property`, `CrossScopePrivilege`, `UiPage` and more. Verify each against the Brazil
   release before relying on it.
5. Do not touch the `incident` table. The starter's incident code was deleted on purpose.
6. Test with real non-admin users, never only as `admin`.
7. **One backend module per frontend feature folder** (rooms, housekeeping, maintenance, handoff, access, activity, auth).
   See [ARCHITECTURE.md](ARCHITECTURE.md).

## 2. The rules (the source of truth)

Every rule has a reference implementation in TypeScript, written as a pure function and covered by
`tests/logic.test.cjs`. Port each one to a server Script Include and test it with the same cases.

| Rule | Reference file |
|---|---|
| Readiness (status, blockers, the user-facing sentence) | `src/client/features/rooms/readiness.ts` |
| What counts as a blocking defect | `src/client/features/maintenance/blockers.ts` (`isBlockingOpen`) |
| Inspections: submit, pass, fail | `src/client/features/rooms/roomCommands.ts`, `roomActions.ts` |
| Tasks: complete, Couldn't Complete, set back to Pending | `src/client/features/housekeeping/taskCommands.ts` |
| Defects: report, triage, start, resolve | `src/client/features/maintenance/defectCommands.ts` |
| Audit entries | `src/client/shared/domain/commandKit.ts` (`withAudit`) |
| Form validation | `features/maintenance/defectValidation.ts`, `features/housekeeping/taskValidation.ts` |

### 2.1 Readiness

| Condition | Result |
|---|---|
| Any **mandatory** task not `completed` (`pending` or `couldnt_complete`) | Not ready |
| Any defect with `priority = blocking` and status not `resolved` | Not ready, status **Blocked** |
| Inspection not `passed` | Not ready |
| Inspection `failed` | Status **Blocked** |
| Optional tasks open, `normal` or `minor` defects open, resolved defects | **Do not** block |
| All three satisfied | **Ready** |

Status derivation, in this order:

1. Open Blocking defect, or inspection `failed` -> `blocked`
2. Any mandatory task not completed -> `in_progress` if any mandatory task is `completed` or `couldnt_complete`, else `needs_cleaning`
3. Inspection not `passed` -> `pending_inspection`
4. Otherwise -> `ready`

Edge case covered by a test: a room with **zero** mandatory tasks and no passed inspection is not Ready.

User-facing sentence (keep exact wording, the frontend and tests expect it):
`Room 305 cannot be marked Ready because 2 mandatory tasks remain incomplete.` Multiple reasons are joined with
", " and " and ".

**Room priority** is not stored: it is the highest `priority` among the room's tasks that are not `completed`, used only
for sorting (`features/rooms/roomViews.ts`, `roomPriority`).

### 2.2 Task and defect life cycles

```
Task:    pending --complete--> completed            (assigned housekeeper only; final)
         pending --couldn't complete (reason)--> couldnt_complete
         couldnt_complete --set back--> pending      (housekeeper or supervisor; NOT while waiting for maintenance)

Defect:  new --triage (technician + priority)--> assigned --start--> in_progress --resolve (notes)--> resolved
         assigned/in_progress --resolve--> resolved
         any open state --triage again--> new technician resets to assigned; priority change is recorded
```

- **Couldn't Complete with reason "Needs maintenance"** creates a defect: status `new`, priority `normal`, no technician,
  `source_task` = the task. The task stores the defect in `linked_defect`.
- **Resolving that defect** puts the task back to `pending` and copies the resolution note into the task's `repair_note`.
  It does not complete the task: the housekeeper re-checks the area and completes it.
- There is **no waiver**: a mandatory task holds the room back until it is Completed.
- A **housekeeper's** report always starts as `new`/`normal`; only a **supervisor** may set priority or a technician
  (at report time or by triage). A supervisor can lower a Blocking defect to Normal or Minor; that change is audited.

## 3. Proposed data model

Table names use the scope prefix `x_2318724_roomrela_`. Fields marked **server** must be written only by server code and be
read-only to clients through ACLs. The exact JSON shapes are in `src/client/shared/domain/types.ts`.

### 3.1 `room`

| Field | Type | Notes |
|---|---|---|
| `number` | String, 3 to 4 digits, **unique**, display value | Frontend uses it as the id. Validate `^\d{3,4}$`. |
| `floor` | Integer | |
| `room_type` | String or choice | e.g. Standard Queen, Deluxe King |
| `assigned_to` | Reference to `sys_user` | The housekeeper |
| `inspection_status` | Choice: `not_requested`, `pending`, `passed`, `failed` | **server**: changed only by the inspection actions |
| `inspection_at` | Date/time | **server** |
| `readiness_status` | Choice: `needs_cleaning`, `in_progress`, `pending_inspection`, `blocked`, `ready` | **server**. Derived by the evaluator. Stored so lists can filter fast. |

### 3.2 `housekeeping_task`

| Field | Type | Notes |
|---|---|---|
| `room` | Reference, mandatory | |
| `title`, `description` | String | |
| `mandatory` | Boolean | |
| `priority` | Choice: `high`, `normal`, `low` | Sort order only |
| `status` | Choice: `pending`, `completed`, `couldnt_complete` | Changed only through the task actions |
| `assigned_to` | Reference to `sys_user` | |
| `completed_at` | Date/time | **server** |
| `incomplete_reason` | Choice: `supplies_missing`, `needs_maintenance`, `other` | Set with `couldnt_complete` |
| `incomplete_note` | String (300) | Required for `other`. Untrusted free text. **Never send to the AI.** |
| `incomplete_at` | Date/time | **server** |
| `linked_defect` | Reference to `defect` | **server** |
| `repair_note` | String (500) | **server**, copied from the resolved defect |

### 3.3 `defect`

| Field | Type | Notes |
|---|---|---|
| `room` | Reference, mandatory | |
| `title`, `description` | String (100), String (1000) | Untrusted free text |
| `priority` | Choice: `blocking`, `normal`, `minor` | Supervisor only. Only `blocking` affects readiness. |
| `status` | Choice: `new`, `assigned`, `in_progress`, `resolved` | Changed only through the defect actions |
| `technician` | Reference to `sys_user` (maintenance role) | Supervisor only |
| `assigned_by`, `assigned_at` | Reference, date/time | **server** |
| `started_at`, `resolved_at` | Date/time | **server** |
| `resolution_notes` | String (500) | Assigned technician, required to resolve |
| `source_task` | Reference to `housekeeping_task` | **server** |

Use `sys_created_on` and `sys_created_by` for reported-at and reported-by (the frontend calls them `reportedAt` and
`reportedById`).

### 3.4 `staff_profile`

`user` (reference to `sys_user`, unique), `shift` (`morning`, `afternoon`, `night`). Shift is needed for the dashboard and
handoff. Alternatively extend `sys_user`; a separate table avoids changing a platform table.

### 3.5 Access requests (not built, by decision)

There is no access-request table. Accounts are created by the administrator in ServiceNow (section 8).

### 3.6 `audit_entry` (the Audit Log page and every activity feed)

| Field | Type | Notes |
|---|---|---|
| `at` | Date/time | **server** |
| `actor` | Reference to `sys_user` | **server**: the session user, never a value from the client |
| `action` | Choice | The `AuditAction` list in `types.ts`: task completed, couldn't complete, reopened, defect reported, assigned, priority changed, started, resolved, inspection requested, passed, failed, briefing generated |
| `room` | Reference, optional | |
| `target` | String (sys_id or record number) | The task, defect, room or request |
| `summary` | String (300) | Built by the server; may quote titles typed by staff (render as text) |

Written **only** by business rules, in the same transaction as the change. Nobody (including `app_admin`) can update or
delete rows. ServiceNow's own `sys_audit` and login history still record field changes and sign-ins; this table is the
readable business log the admin page shows.

### 3.7 Briefings (no table)

Briefings are not stored. Each generation writes one audit row (`briefing_generated`: who, which shift, when, and
whether AI or the template wrote it). The same rows are counted for the rate limit. Add a table later only if past
briefings must be re-read.

## 4. Roles

Create four application roles (suggested names, scoped):

| Role | Suggested name |
|---|---|
| Housekeeping Staff | `x_2318724_roomrela.housekeeper` |
| Maintenance Staff | `x_2318724_roomrela.maintenance` |
| Housekeeping Supervisor | `x_2318724_roomrela.supervisor` |
| System Administrator (app) | `x_2318724_roomrela.app_admin` |

Do **not** make roles contain each other. The prototype assumes one role per person; if a person can hold several,
decide how the frontend picks a view and update `Role` handling.

## 5. Access control (ACLs)

Deny by default. "Own" means the record's `assigned_to` (or `technician`) equals the signed-in user. Use row-level
conditions or scripts; test each cell with a non-admin user. Writes go through the actions in section 7.2, so most direct
table writes can stay denied.

| Table | Operation | housekeeper | maintenance | supervisor | app_admin |
|---|---|---|---|---|---|
| room | read | own rooms | rooms that have a defect assigned to them | all | all (read only) |
| room | write | no (submit action only) | no | no (inspection actions only) | no |
| room fields `readiness_status`, `inspection_*` | write | no | no | no direct write; server code only | no |
| housekeeping_task | read | tasks of own rooms | no | all | all |
| housekeeping_task | write | own tasks: `status`, `incomplete_reason`, `incomplete_note` (through the task actions) | no | set `couldnt_complete` back to `pending` | no |
| defect | read | defects in own rooms | assigned to them | all | all |
| defect | create | yes, own rooms, priority forced to `normal`, no technician | no | yes, any room | no |
| defect | write | no | assigned only: `status` (start, resolve), `resolution_notes` | `technician`, `priority` | no |
| access_request | read | no | no | no | all |
| access_request | create | see section 8 | | | |
| access_request | write | no | no | no | `status` (approve or decline) |
| audit_entry | read | no | no | no (activity feeds come through `GET /snapshot`, scoped to visible rooms) | all |
| audit_entry, handoff_briefing | write | server only | server only | server only | server only |

Also protect the **UI Page**: confirm in the PDI whether the page is reachable without sign-in and restrict it to
authenticated users with one of the four roles. The SDK `UiPage` docs show no roles property, so restricting to the four
roles probably has to be set on the instance record. **Signed-out access is already refused** (verified 2026-11-06:
redirected to the ServiceNow login); role-level restriction still needs to be set and tested.

Use `GlideRecordSecure` (or explicit `canRead()`/`canWrite()`) in scripts so the caller's ACLs apply, and never return
fields the caller should not see.

## 6. Business rules and server logic

Put the rules in Script Includes (`ReadinessEvaluator`, and one per module for the actions) used by every rule and REST
endpoint, so there is a single implementation of each.

| # | Trigger | What it must do |
|---|---|---|
| 1 | Any change to a task, defect or room inspection | Recompute and store the room's `readiness_status` with the evaluator. |
| 2 | Pass inspection | Only `supervisor`. Requires `inspection_status = pending`, all mandatory tasks `completed` and no open Blocking defect, checked **inside the same transaction** that sets `passed`. |
| 3 | Fail inspection | Only `supervisor`. Requires `inspection_status = pending`. |
| 4 | Submit for inspection | Only the room's assigned housekeeper. Requires all mandatory tasks completed, no open Blocking defect, inspection not already pending. Allowed again after a failed inspection. |
| 5 | Task actions | Only the task's housekeeper may complete or mark Couldn't Complete (from `pending` only; not while the room awaits inspection). "Needs maintenance" creates the defect in the same transaction. Set back to `pending` is refused while the linked defect is unresolved. |
| 6 | Defect actions | Report: housekeeper (own rooms) or supervisor. Triage: supervisor; technician must hold the maintenance role. Start and resolve: only the assigned technician; resolve needs notes and reopens the source task (rule in section 2.2). |
| 7 | All of the above | Write an `audit_entry` row in the same transaction. |

**Same answer for "not found" and "not yours".** A housekeeper completing someone else's task, or a technician opening a
defect assigned to someone else, must get the same 404 as for a record that does not exist (the frontend rules already
behave this way and the tests check it).

**Duplicate and concurrent requests.** Make state changes conditional on the current state ("only if still `pending`"). A second
identical request should find the state already changed and return HTTP 409, not apply twice. Compare a version
(for example `sys_mod_count` or `sys_updated_on`) sent by the client for edits.

**Protect against direct API bypass.** Table API writes to protected fields must be blocked by ACLs, not by hoping
nobody calls them. Test by calling `/api/now/table/<your table>` as a non-admin and trying to set `readiness_status`,
`priority` or `status`.

## 7. REST API contract the frontend expects

Built as one **Scripted REST API** (`/api/x_2318724_roomrela/v1/roomrelay/...`) instead of letting the browser call the Table API
directly. It returns only the fields needed, applies the caller's access, and gives one place for validation. Verify the
exact base path when you create it.

The browser must send the session CSRF token with every request (the starter app used `window.g_ck` in the
`X-UserToken` header; reuse that pattern, in one place only).

### 7.1 Read

`GET /me` -> `{ id, name, role, shift }` where `role` is one of `housekeeping`, `maintenance`, `supervisor`, `admin`.
The server decides the role; the client never sends it.

`GET /snapshot` -> exactly the `Snapshot` shape in `src/client/shared/domain/types.ts`:

```ts
{
  rooms:   Room[]              // id (room number), floor, type, assigneeId, inspection, inspectionAt?
  tasks:   HousekeepingTask[]  // id, roomId, title, description, mandatory, priority, status, assigneeId, completedAt?,
                               // incompleteReason?, incompleteNote?, incompleteAt?, linkedDefectId?, repairNote?
  defects: Defect[]            // id, roomId, title, description, priority, status, reportedById, reportedAt, technicianId?,
                               // assignedById?, assignedAt?, startedAt?, resolvedAt?, resolutionNotes?, sourceTaskId?
  staff:   Staff[]             // id, name, role, shift (only people the caller may see; avoid extra personal data)
  audit:   AuditEntry[]        // admin: everything; others: entries for rooms they may see (or none)
  generatedAt: string          // ISO time
  source: 'servicenow'
}
```

The server must return **only records the caller may see** (the frontend's `scope.ts` files only simulate this). The
frontend computes readiness from this data for display; consider also returning `readinessStatus` from the server and
having the UI show the server value, so the two can never disagree.

### 7.2 Write: one command endpoint

Every change in the app is one `Command` (`src/client/shared/api/commands.ts`), sent as the JSON body of
**`POST /commands`**. The frontend sends it through `RoomRelayDataSource.execute(command)`, which resolves to
`{ ok: true }` or `{ ok: false, kind, message, fieldErrors? }`. Commands never carry the actor or role (the parser
rejects them if they try). The table below is the original per-path design, kept as the mapping of command to rule:

| Command | Method and path | Who | Body | Rule |
|---|---|---|---|---|
| `task.complete` | `POST /tasks/{id}/complete` | housekeeper (own) | none | 5 |
| `task.couldntComplete` | `POST /tasks/{id}/couldnt-complete` | housekeeper (own) | `{ reason, note? }` | 5 |
| `task.reopen` | `POST /tasks/{id}/reopen` | housekeeper (own), supervisor | none | 5 |
| `defect.report` | `POST /defects` | housekeeper (own rooms), supervisor | `{ roomId, title, description, priority?, technicianId? }` | 6 |
| `defect.triage` | `POST /defects/{id}/triage` | supervisor | `{ technicianId, priority }` | 6 |
| `defect.start` | `POST /defects/{id}/start` | maintenance (assigned) | none | 6 |
| `defect.resolve` | `POST /defects/{id}/resolve` | maintenance (assigned) | `{ notes }` | 6 |
| `room.submitInspection` | `POST /rooms/{number}/submit-inspection` | housekeeper (own) | none | 4 |
| `room.recordInspection` | `POST /rooms/{number}/inspection` | supervisor | `{ result: 'passed' or 'failed', version }` | 2, 3 |
| (own route, not a command) | `POST /handoff/briefing` | supervisor | `{ shift }` | Built. Returns `{ briefing }` with `source: 'ai'` or `'fallback'`; 429 after 5 in 10 minutes. See `AI_DESIGN.md` |
| (not yet a command) | `POST /access-requests` | see section 8 | the request form | |
| (not yet a command) | `POST /access-requests/{id}/decision` | app_admin | `{ decision }` | Approving also needs a person to grant roles in ServiceNow |

Validate with the limits in the validation files listed in section 2. Reject unknown fields.

### 7.3 Errors

Return the same envelope for every failure and **never** include stack traces, table names or script text:

```json
{ "error": { "code": "forbidden", "message": "You do not have permission to view this information." } }
```

Map status codes to the frontend's kinds (`ApiErrorKind` in `src/client/shared/api/dataSource.ts` for reads,
`CommandFailureKind` in `commands.ts` for writes):

| HTTP | Kind |
|---|---|
| 401 | `unauthenticated` (or `expired` when the session timed out) |
| 403 | `forbidden` |
| 404 | `not_found` (also use 404 for records the caller may not know exist) |
| 400 / 422 | `invalid`, with `fieldErrors` keyed by field name |
| 409 | `conflict` ("this changed, reload") |
| 5xx | `server` |
| network failure | `network` |

## 8. Sign-in and accounts

In the local preview, `#/login` lets you choose a staff account. **In ServiceNow:**

- ServiceNow signs people in and out. Users reach the UI Page only after logging in (unless the page is public, which it
  must not be). So the React sign-in page will normally never appear, and **there must be no password handling in React.**
  Sign out should send the user to ServiceNow's logout (the usual path is `/logout.do`; verify on the instance).
- **Decision (2026-11-07): option (a).** There is no sign-up or access-request page. The system administrator creates
  each staff member as a ServiceNow user, grants one RoomRelay role and adds a staff profile (shift). A real hotel would
  usually connect ServiceNow to its staff directory (SSO or LDAP) instead of typing users in. **Roles are always granted by
  an administrator.**
- Before real use, remove the installed staff accounts (`demo-users.now.ts`) and the Restore initial data endpoint.

## 9. What to change in the frontend

**Done for the working version:** `serviceNowDataSource.ts` implements `RoomRelayDataSource`, `App.tsx` picks it inside
ServiceNow, and `ServerSessionProvider` gets the user from `GET /me`. The points below remain for later.

1. **Data source.** Done (`src/client/shared/api/serviceNowDataSource.ts`).
2. **Writes already go through one place.** Every screen calls `run(command)` (`shared/api/DataContext.tsx`), which calls
   `execute` and then quietly reloads the snapshot. Nothing else in the UI needs to change. No simulated flows remain.

3. **Session.** Done inside ServiceNow (`GET /me`). The preview sign-in, Preview tools and the in-memory store are only used
   by the local preview. Before real use, remove the installed staff accounts and the Restore initial data endpoint.
4. **Scope filtering.** Done on the server (`scopeSnapshotForRole`). The browser reuses `features/rooms/scope.ts` and
   `features/maintenance/scope.ts` only to word the "Showing ..." notes and to narrow the Maintenance views.
5. **Prototype labels removed** (2026-11-07). Inside ServiceNow the screens carry no test or demo wording; the local
   preview shows a single "Local preview" label.
6. **Keep** the rule files listed in section 2 and the logic tests: they document the rules the server must match.

## 10. Phase 5: AI briefing (verified in the PDI on 2026-11-07)

See [AI_DESIGN.md](AI_DESIGN.md). In short: `POST /handoff/briefing` (`src/server/handoff/briefingHandler.ts`) checks the
caller is a supervisor and the rate limit, builds the template from the data the caller may see, sends a minimized version
to Groq (`src/server/handoff/groq.ts`, REST Message `RoomRelay Groq`, 15-second timeout), checks the reply, and returns
either the AI narrative merged into the template (`source: 'ai'`) or the template labeled `'fallback'` with a reason.
The key is read from the `password2` system property `x_2318724_roomrela.groq_api_key`, created by hand
(`DEPLOYMENT_GUIDE.md` section 3b); it is never in the code, the browser or the logs.

## 11. Build order (steps 1 to 7 are done and verified in the PDI)

1. Tables, roles, staff profiles and demo data matching the prototype's scenarios. **Done.**
2. The rules, shared with the frontend and covered by `tests/logic.test.cjs`. **Done.**
3. ACLs, tested as non-admin users for each role. **Done** (TEST_PLAN P15 to P22).
4. Audit rows and the command endpoint with 400, 403, 404 and 409 answers. **Done** (P17, P19).
5. `GET /me` and `GET /snapshot`, connected to the frontend. **Done** (P13).
6. Every command, exercised by the Room 102 scenario. **Done** (P16).
7. Installed into the PDI and checked with `DEPLOYMENT_GUIDE.md`. **Done** (P9 to P22).
8. AI briefing: built, installed and verified (section 10; P23 to P29). **Done.**
9. Remaining: the open items in section 12 and the rest of `TEST_PLAN.md` section 5.

## 12. Known unknowns

Resolved:

- **The UI Page needs a sign-in** (signed-out visits go to the ServiceNow login; P2, P10).
- **Hash routing, the embedded font and the styles work** inside the platform page, with no Content Security Policy messages (P21).
- **`window.g_ck` is a string** on the UI Page, so API calls can send `X-UserToken` (P8).
- **Fluent API support on Brazil**: tables, roles, ACLs, cross-scope privileges, `Record` data (users, role assignments), the Scripted REST API and server modules all installed and work.
- **Server modules built from `src/client/` load**, once every import between module files ends in `.ts`: ServiceNow finds a module by its exact path (P11).
- **The REST API's role check applies** once the RoomRelay ACL is set on every route as well as on the API; otherwise each route keeps ServiceNow's default "Scripted REST External Default" ACL, which overrides the API-level one (P20, P22).
- **Demo users and their roles install with the app**, and the cross-scope reads of `sys_user` and `sys_user_has_role` need no extra approval (P13).
- **The scoped app can read its `password2` property and the PDI can call `api.groq.com`** (P28).
- **No second sign-in inside ServiceNow**: the app takes the signed-in user from `GET /me`; the demo sign-in page exists only in the local preview.

Still open:

- Whether `/logout.do` is the right sign-out path (Sign out was not clicked during the PDI checks, to keep the admin session).
- Concurrency: two requests in the same instant could both pass the state checks (no version check yet).
- Rate limiting exists only for the AI briefing (5 per supervisor in 10 minutes); the other routes have none.
