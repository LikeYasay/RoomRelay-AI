# Test plan and results

**Honesty rule for this document:** a result is written only if the check was actually run. "Not run" means exactly that.
Results below were observed on **2026-11-06** with the local preview (`npm run preview`) in a desktop browser, plus the
commands named, plus a first run inside the ServiceNow PDI of the **earlier** version (section 4b).
**No backend, ACL or real-data behavior has been tested yet.**

For each test: objective, preconditions, steps, expected behavior, observed behavior, pass or fail, recommended correction.
To keep the document readable, repeated preconditions are stated once per section.

## 1. How to run what exists

| What | Command | Notes |
|---|---|---|
| Type check (strict) | `npx tsc -p src/client/tsconfig.json --noEmit` | Strict mode is on in the tsconfig |
| SDK build | `npm run build` | Local only; deploys nothing |
| Logic tests (26) | `npm run test:logic` | Compiles the logic files in a temp folder and runs Node's built-in test runner |
| Look at the app | `npm run preview` | http://127.0.0.1:4173/ |

## 2. Static and automated checks

| ID | Check | Result | Observed |
|---|---|---|---|
| S1 | TypeScript strict type check | **Pass** | No errors |
| S2 | `npm run build` (Now SDK 4.14.0) | **Pass** | "Type check completed successfully", "Build completed successfully"; bundle about 0.83 MB; the same 8 ServiceNow records as before (same ids), `keys.ts` unchanged |
| S3 | Search for unsafe patterns (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `document.write`) | **Pass** | 0 matches in `src/` (checked before the task and defect rework; the new files add none, see S7) |
| S4 | Search for network calls and password fields | **Pass** | 0 `fetch`/XHR calls, 0 password inputs |
| S5 | `npm audit --omit=dev` | **Pass** | 0 vulnerabilities (no dependencies were added) |
| S6 | `npm audit` (full) | **Known findings** | 20 (10 moderate, 10 high) in SDK build tooling only; documented in `API_SECURITY_CHECKLIST.md` section D |
| S7 | Feature folders never depend on each other in a circle; `shared/` imports no feature | **Pass** | Import graph listed in `ARCHITECTURE.md` |

### Automated logic tests (`npm run test:logic`): 26 of 26 passed

| # | Test | Objective |
|---|---|---|
| 1 | READINESS: an incomplete mandatory task blocks readiness | Mandatory task open means not Ready |
| 2 | READINESS: exact spec message for Room 305 | Wording matches the requirement |
| 3 | READINESS: nothing started is Needs Cleaning, not In Progress | Status derivation |
| 4 | READINESS: Couldn't Complete never counts as done, and makes the room In Progress | New task state |
| 5 | READINESS: required inspection pending blocks readiness | Inspection rule |
| 6 | READINESS: failed inspection is Blocked | Inspection rule |
| 7 | READINESS: an unresolved Blocking defect blocks in every open state | New, Assigned, In progress |
| 8 | READINESS: Normal and Minor defects, a resolved Blocking defect and optional tasks never block | No false blocking |
| 9 | READINESS: all requirements satisfied is Ready | Happy path |
| 10 | READINESS: room with zero mandatory tasks is not Ready without inspection | Edge case |
| 11 | ROOM PRIORITY: highest priority among open tasks | Sorting rule |
| 12 | DATASET: statuses consistent and sum to total rooms | No Ready room breaks any rule; seed shows every new state |
| 13 | DATASET: the audit log matches the records | Unique ids, ordered, one entry per seeded event; activity feed reads the same log |
| 14 | ACTIONS: supervisor cannot pass while blockers exist; housekeeper only on own room | What the buttons offer |
| 15 | COMMANDS: completing a task, and who may do it | Rules never change their input; "not yours" = "does not exist"; wrong role refused |
| 16 | COMMANDS: Couldn't Complete reasons, notes and set back to Pending | Note required for Other; unknown reason rejected; no manual reopen while waiting for maintenance |
| 17 | FLOW: Room 102 from Needs Cleaning to Ready through a maintenance report | The documented scenario, with wrong-role and wrong-owner attempts at each step |
| 18 | FLOW: a failed inspection keeps the room Blocked until resubmitted | Failed path |
| 19 | COMMANDS: reporting and triage permissions | Housekeeper cannot set priority or report on others' rooms; only supervisors triage; technician must hold the maintenance role; downgrade is audited |
| 20 | AUDIT: entries are append-only | Old entries unchanged, new id unique |
| 21 | VALIDATION: defect report rules | Empty, short, long, multi-line, control characters, unknown room, old "critical" priority, non-technician; script-like text kept as plain text |
| 22 | VALIDATION: triage, resolution and Couldn't Complete rules | Required fields and lengths |
| 23 | HANDOFF: briefing grounded in data and cannot approve rooms | Counts match; new sections; labeled simulated; control characters stripped |
| 24 | HANDOFF + INJECTION: hostile text cannot change readiness; free-text notes never reach the briefing | Prompt-injection resistance and data minimization |
| 25 | ACCOUNT REQUEST: validation and no self-granted admin | `admin` role rejected; bad email and name rejected |
| 26 | PERMISSIONS + NAV: restricted pages not listed, match the matrix | Menu per role; old `#/housekeeping` address opens Rooms |

Recommended correction if any fail: fix the rule in the feature folder that owns it (for example
`src/client/features/rooms/readiness.ts`), never edit the test to match a wrong rule. **The server must pass the same
cases** (see `BACKEND_HANDOFF.md`).

## 3. Browser functional tests (prototype, synthetic live data)

Preconditions: preview running; reload first so the demo data is fresh; sign in with the account shown. Switch accounts
with Sign out (a reload resets the data). All **Pass** unless noted. Tests F1 to F6, F8, F14, F15, F20 to F22 and F25 were
run before the task and defect rework and cover screens it did not change; the rest were run (again) after it.

| ID | Objective | Steps | Expected | Observed |
|---|---|---|---|---|
| F1 | Sign in needs a choice | Open `#/login`, press Sign in with nothing chosen | Error summary "Choose a demo account to sign in." | As expected. Pass |
| F2 | Signed-out access to app pages | While signed out, open `#/rooms` | Sign-in page shown, no menu | As expected. Pass |
| F3 | Sign in as each role | Morgan, Avery, Daniel, Riley | Dashboard opens with that role's menu (see test 26) | As expected. Pass |
| F4 | Sign out | Click Sign out (bottom-left of menu) | Back to sign-in; stored demo account cleared | As expected. Pass |
| F5 | Keyboard-only sign in | Tab to the account list, arrows to choose, Tab, Enter | Signed in; visible focus ring | As expected. Pass |
| F6 | Skip link | Tab once on the dashboard, Enter | Focus moves to main content; address unchanged | Bug found and fixed earlier; retested then. Pass |
| F7 | Dashboard numbers | Sign in as Morgan | 40 rooms: 16 Ready, 8 Needs Cleaning, 7 In Progress, 4 Pending Inspection, 5 Blocked; 71 outstanding tasks (63 mandatory, 2 couldn't complete); 6 unresolved defects (1 awaiting triage); 3 Blocking defects | As expected. Pass |
| F8 | Floor filter | Choose Floor 3 | All cards and charts update | As expected. Pass |
| F9 | Rooms views | Avery: Rooms | Priorities tab first (3 rooms with open tasks), Cleaning and inspection (8 rows, no "Assigned to" column), Board (8 cards) | As expected. Pass |
| F10 | Readiness message | Morgan opens Room 305 | "...because 2 mandatory tasks remain incomplete and the required inspection has not been requested." Pass button disabled, with the same sentence as its reason | As expected. Pass (the first run after the rework showed a less useful reason; fixed and now covered by test 14) |
| F11 | Failed inspection | Room 306 or 104 | Blocked; "last inspection failed" | As expected. Pass |
| F12 | Complete a task | Avery, Room 102, Mark completed | Notice; room In Progress; timeline entry | As expected. Pass |
| F13 | Couldn't Complete | Avery, Room 102 bathroom task: submit empty, then Needs maintenance + note | Error "Choose why..."; info about the report; task shows reason, note and "Waiting for maintenance"; a New, Normal report appears; room stays In Progress | As expected. Pass |
| F14 | Other person's room | Avery opens Room 305 | "Room unavailable" (same message as a non-existent room) | As expected. Pass |
| F15 | Invalid room id | Open `#/rooms/abc` | "Room not found" | As expected. Pass |
| F16 | Triage | Morgan, Maintenance: New reports (2), Triage the Room 102 report, Daniel + Blocking, Assign | "Saved"; status Assigned, priority Blocking; Room 102 Blocked | As expected. Pass |
| F17 | Repair | Daniel, My queue (3), Work on it, Start work, Mark resolved empty then with notes | In progress; "A resolution note is required."; Resolved; source task shows Pending | As expected. Pass |
| F18 | Back to the housekeeper | Avery, Room 102 | Bathroom task Pending with "Repair finished: ..." | As expected. Pass |
| F19 | Submit and pass | Avery completes the rest, Submit for inspection; Morgan, Pass inspection and confirm Ready | Pending Inspection, then Ready with "Inspection passed. Room 102 is Ready." | As expected. Pass |
| F20 | Handoff failure | Tick "Demo: make generation fail", Generate | Error with retry | Run before the rework. Pass |
| F21 | Copy briefing | Click Copy | Text copied | **Partly tested**: in the test browser the clipboard was blocked, so only the failure message was observed. Success path **not run**. |
| F22 | Request an account | `#/signup`: empty, bad values, then valid | Specific errors; `admin` not offered; valid shows "Request checked", not saved | Run before the rework. Pass |
| F23 | Admin pages | Riley | Menu ends with Users and Access, Audit Log; 13-row permission table; Audit Log newest first, search `102` lists the scenario | As expected. Pass |
| F24 | Restricted page by address | Morgan opens `#/access` | "Access denied" | As expected. Pass |
| F25 | Simulated problems | Prototype tools: session expired, forbidden, server error | Matching screens; "Sign in again" returns to sign-in | Run before the rework. Pass |
| F26 | Shared demo data | Make changes as Avery, sign out, sign in as Morgan | Morgan sees Avery's report | As expected. Pass |
| F27 | Reset demo data | Riley: Prototype tools > Reset demo data | Message "Demo data restored"; dashboard back to the F7 numbers; audit log back to 205 entries | As expected. Pass |
| F28 | Deep link to a defect | Open `#/maintenance/D-301-1` | Maintenance page with that defect's modal open | As expected. Pass |
| F29 | Handoff | Morgan, Shift Handoff, Generate | Briefing with "Tasks that couldn't be completed" and "Reports awaiting triage" sections, labeled "Simulated briefing (not AI)" | As expected: the afternoon shift lists Room 301 under both new sections. Pass |

## 4. Accessibility and layout

| ID | Check | Result | Observed |
|---|---|---|---|
| A1 | DOM audit (accessible names, form labels, duplicate ids, broken `aria-labelledby` and `aria-controls`) | **Pass** | Run after the rework on 11 views across all four roles and 4 dialogs (Couldn't Complete, Report defect, defect modal as supervisor and as technician). Two findings were false positives: a button inside the closed Prototype tools panel (it has text), and a duplicate id caused by the test script closing a dialog outside React (with real Cancel the dialog is removed). The earlier, fuller 13-view audit (headings, landmarks, table captions) was **not re-run**. |
| A2 | Colour contrast of the palette | **Pass** | 32 of 32 text and background pairs at 4.5:1 or better, including the 9 new pairs (tabs, reason and repair boxes, link button, reset button) |
| A3 | Keyboard-only sign in and visible focus | **Pass** | See F5 |
| A4 | Screen reader (NVDA or VoiceOver) | **Not run** | Needed, especially for the stacked table cards and the view tabs |
| A5 | Keyboard: view tabs | **Pass** | Arrow keys move and select; only the selected tab is in the Tab order (roving tabindex) |
| A6 | Focus inside dialogs | **Pass** | Focus moves into the defect modal and stays there (native `<dialog>`); Escape and Cancel close it |
| A7 | Full keyboard walk of every screen | **Partly run** | Sign-in, skip link and view tabs only |
| R1 | No horizontal scrolling | **Pass** | After the rework: measured at 360 px on dashboard, Rooms, room details, Maintenance, the defect modal, Audit Log and Users and Access. Before it: 320 to 1920 px on every page. |
| R2 | Tables stack to labeled cards at 720 px and below | **Pass** | |
| R3 | Slide-out menu on narrow screens | **Pass** | Before the rework; unchanged since |
| R4 | Defect modal fits a 360 px screen | **Pass** | 322 px wide, no inner overflow |
| R5 | Real phones and tablets | **Not run** | Only simulated sizes in a desktop browser |
| R6 | Layout inside ServiceNow | **Passed on the desktop dashboard (earlier version)** | See section 4b |

## 4b. First run inside the ServiceNow PDI (2026-11-06, earlier version)

Instance `dev472716`, scope `x_2305075_roomrela`. This was the **prototype UI before the vertical-slice layout and the
task and defect rework**: no tables, roles or ACLs exist yet. **The current version has not been installed.**

| ID | Check | Result | Observed |
|---|---|---|---|
| P1 | Install into the PDI | **Pass** | `npx @servicenow/sdk install --auth roomrelay-pdi` printed "Installation completed", exit code 0; the SDK also printed a rollback link. Observed directly. |
| P2 | Signed-out visit to the UI Page | **Pass** | A browser with no ServiceNow session was redirected to the ServiceNow sign-in screen. The page is **not public**. Observed directly. |
| P3 | Page renders after signing in to the PDI | **Pass** | Team lead's screenshot of `.../x_2305075_roomrela_incident_manager.do#/dashboard`: sidebar, header, summary strip, charts, tables and Sign out drawn correctly. |
| P4 | Numbers match the local preview | **Pass** | Matched the earlier dataset (those numbers changed with the rework; see F7). |
| P5 | Hash routing inside the platform page (`#/dashboard`) | **Pass** | |
| P6 | Menu, Back and Forward, refresh, direct room address, dialogs, sign out | **Reported working by the team lead, not itemised** | |
| P7 | Console errors and Content Security Policy messages | **Not itemised** | The exact Console output was not captured |
| P8 | `typeof window.g_ck` | **Not itemised** | Needed before the backend integration |

After the next install, re-run P3 to P7 and the scenario F12 to F19 inside the PDI.

## 5. Backend and security tests (to run once the backend exists)

**Preconditions for all:** application installed in the PDI; four test users (one per role, never `admin`) with sample data
that includes the scenarios used above; a second housekeeper and a second technician to test cross-user access. Observed
and Result are **Not run** until the backend is built. Recommended correction for any failure: fix the server rule or ACL,
not the screen.

| ID | Objective | Steps | Expected |
|---|---|---|---|
| B1 | Unauthenticated access | Open the UI Page and each API in a private window | Redirect to ServiceNow login or 401; no data |
| B2 | Unauthorized page | Housekeeper opens the handoff page and its API | Page denied; API 403 |
| B3 | Insufficient permission | Maintenance user tries to pass an inspection | 403, no change |
| B4 | Another user's record (IDOR/BOLA) | Housekeeper A completes B's task; technician A resolves B's defect | 404 with the same message as a missing record |
| B5 | Invalid input | Over-long, empty, wrong-type and unknown-field payloads to each write endpoint | 400 with a safe message; nothing saved |
| B6 | XSS-safe rendering | Save `<script>`/`<img onerror>` in a defect, a task note and a resolution; view everywhere incl. the Audit Log | Shown as text |
| B7 | Unauthorized status change | Call the Table API to set `readiness_status`, a task `status` or a defect `priority` as a non-admin | Rejected by ACL |
| B8 | Mandatory task bypass | Pass inspection with one mandatory task Pending or Couldn't Complete (UI and direct API) | Rejected with the readiness message |
| B9 | Inspection bypass | Pass with inspection not `pending`; fail with inspection not `pending` | Rejected |
| B10 | Blocking defect | Pass with an open Blocking defect | Rejected; resolving or downgrading it then allows it (and the downgrade is audited) |
| B11 | Duplicate requests | Send pass-inspection twice at once; resolve twice | One succeeds, one gets 409; one audit row |
| B12 | Concurrent updates | Two supervisors triage the same defect | Stale update gets 409 |
| B13 | Session expiry | Let the session expire, then click | "Session expired" state; no data leak |
| B14 | API failure | Stop the API or force a 500 | Safe error screen with retry; no stack trace |
| B15 | Exposed secrets | Search repo, bundle, network traffic and logs | None |
| B16 | Prompt injection | See `AI_DESIGN.md` section 5 | All pass |
| B17 | Frontend and backend permission agreement | For each cell of the role matrix, compare what the UI offers with what the API allows | Identical; the API is the stricter one |
| B18 | Rate limiting | Hammer the briefing endpoint | Limited with a safe message |
| B19 | Account request abuse | Submit many requests, invalid emails, attempt `role=admin` | Limited or rejected; no user or role created |
| B20 | Housekeeper sets a priority | `POST /defects` with `priority` or `technicianId` as a housekeeper | 403 |
| B21 | Reopen while waiting for maintenance | `POST /tasks/{id}/reopen` while the linked defect is open | 409 |
| B22 | Resolve reopens the task | Resolve a defect raised from a task | Task back to `pending` with `repair_note`; not `completed` |
| B23 | Audit log integrity | Try to update or delete an `audit_entry` as every role, including app_admin | Refused; every change above produced exactly one row with the real actor |

## 6. Known gaps in testing

- Inside ServiceNow only the earlier prototype UI has run, once (section 4b). Console output and `g_ck` were not captured.
  The remaining unknowns are in `BACKEND_HANDOFF.md` section 12.
- Screen readers, real devices, and the successful clipboard path are untested.
- The browser checks were run by hand from scripts in a temporary test browser; there is no automated end-to-end suite.
