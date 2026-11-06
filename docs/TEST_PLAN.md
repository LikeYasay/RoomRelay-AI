# Test plan and results

**Honesty rule for this document:** a result is written only if the check was actually run. "Not run" means exactly that.
Results below were observed on **2026-11-06** with the local preview (`npm run preview`) in a desktop browser, plus the
commands named, plus a first run inside the ServiceNow PDI (section 4b). **No backend, ACL or real-data behavior has been tested yet.**

For each test: objective, preconditions, steps, expected behavior, observed behavior, pass or fail, recommended correction.
To keep the document readable, repeated preconditions are stated once per section.

## 1. How to run what exists

| What | Command | Notes |
|---|---|---|
| Type check (strict) | `npx tsc -p src/client/tsconfig.json --noEmit` | Strict mode is on in the tsconfig |
| SDK build | `npm run build` | Local only; deploys nothing |
| Logic tests (17) | `npm run test:logic` | Compiles the logic files in a temp folder and runs Node's built-in test runner |
| Look at the app | `npm run preview` | http://127.0.0.1:4173/ |

## 2. Static and automated checks

| ID | Check | Result | Observed |
|---|---|---|---|
| S1 | TypeScript strict type check | **Pass** | No errors |
| S2 | `npm run build` (Now SDK 4.14.0) | **Pass** | "Type check completed successfully", "Build completed successfully"; bundle about 0.78 MB |
| S3 | Search for unsafe patterns (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, `document.write`) | **Pass** | 0 matches in `src/` |
| S4 | Search for network calls and password fields | **Pass** | 0 `fetch`/XHR calls (one comment mention), 0 password inputs |
| S5 | `npm audit --omit=dev` | **Pass** | 0 vulnerabilities |
| S6 | `npm audit` (full) | **Known findings** | 20 (10 moderate, 10 high) in SDK build tooling only; documented in `API_SECURITY_CHECKLIST.md` section D |

### Automated logic tests (`npm run test:logic`): 17 of 17 passed

| # | Test | Objective |
|---|---|---|
| 1 | READINESS: cleaning task incomplete blocks readiness | Mandatory task open means not Ready |
| 2 | READINESS: exact spec message for Room 305 | Wording matches the requirement |
| 3 | READINESS: nothing started is Needs Cleaning, not In Progress | Status derivation |
| 4 | READINESS: required inspection pending blocks readiness | Inspection rule |
| 5 | READINESS: failed inspection is Blocked | Inspection rule |
| 6 | READINESS: unresolved blocking defect blocks even when everything else is done | Defect rule (open and in progress) |
| 7 | READINESS: resolved blocking defect, open non-blocking defect and optional task do not block | No false blocking |
| 8 | READINESS: all requirements satisfied is Ready | Happy path |
| 9 | READINESS: room with zero mandatory tasks is not Ready without inspection | Edge case |
| 10 | DATASET: statuses consistent and sum to total rooms | No Ready room breaks any rule; floor and shift totals agree |
| 11 | ACTIONS: supervisor cannot confirm while blockers exist; housekeeper only on own room | Action availability |
| 12 | VALIDATION: defect report rules | Empty, short, long, multi-line, control characters, unknown room, bad severity; script-like text kept as plain text |
| 13 | VALIDATION: resolution notes rules | Required, min and max length |
| 14 | HANDOFF: briefing grounded in data and cannot approve rooms | Counts match; labeled simulated; control characters stripped |
| 15 | HANDOFF + INJECTION: hostile text is only text and cannot change readiness | Prompt-injection resistance of the rules |
| 16 | ACCOUNT REQUEST: validation and no self-granted admin | `admin` role rejected; bad email and name rejected |
| 17 | PERMISSIONS + NAV: restricted pages not listed, match the matrix | Menu per role |

Recommended correction if any fail: fix the rule in `src/client/domain/`, never edit the test to match a wrong rule. **The
server must pass the same cases** (see `BACKEND_HANDOFF.md`).

## 3. Browser functional tests (prototype, synthetic data)

Preconditions: preview running; sign in with the account shown. All **Pass** unless noted.

| ID | Objective | Steps | Expected | Observed |
|---|---|---|---|---|
| F1 | Sign in needs a choice | Open `#/login`, press Sign in with nothing chosen | Error summary "Choose a demo account to sign in." | As expected. Pass |
| F2 | Signed-out access to app pages | While signed out, open `#/rooms` | Sign-in page shown, no menu | As expected. Pass |
| F3 | Sign in as each role | Morgan, Avery, Daniel, Riley | Dashboard opens with that role's menu | As expected. Pass |
| F4 | Sign out | Click Sign out (bottom-left of menu) | Back to sign-in; stored demo account cleared | As expected. Pass |
| F5 | Keyboard-only sign in | Tab to the account list, arrows to choose, Tab, Enter | Signed in; visible focus ring | As expected. Pass |
| F6 | Skip link | Tab once on the dashboard, Enter | Focus moves to main content; address unchanged | **Found a bug** (the link changed the address and showed "Page not found"); fixed; retested. Pass |
| F7 | Dashboard numbers | Sign in as Morgan | 40 rooms: 16 Ready, 9 Needs Cleaning, 6 In Progress, 4 Pending Inspection, 5 Blocked; 72 open tasks (64 mandatory); 4 unresolved defects (3 blocking); 3 high-priority blockers | As expected. Pass |
| F8 | Floor filter | Choose Floor 3 | All cards and charts update | As expected. Pass |
| F9 | Role scoping | Sign in as Avery; as Daniel | Avery sees 8 rooms; Daniel sees only rooms with his defects | As expected. Pass |
| F10 | Readiness message | Morgan opens Room 305 | "Room 305 cannot be marked Ready because 2 mandatory tasks remain incomplete and the required inspection has not been requested." Confirm button disabled with reason | As expected. Pass |
| F11 | Failed inspection | Room 306 or 104 | Blocked; "last inspection failed" | As expected. Pass |
| F12 | Eligible action | Morgan opens Room 107; click "Pass inspection and confirm Ready" | Simulation dialog; Escape closes it and focus returns to the button | As expected. Pass |
| F13 | Housekeeper action | Avery opens Room 104 | "Submit for inspection" enabled (simulation). Rooms 105 and 107: disabled with reason | As expected. Pass |
| F14 | Other person's room | Avery opens Room 305 | "Room unavailable" (same message as a non-existent room, `999`) | As expected. Pass |
| F15 | Invalid room id | Open `#/rooms/abc` | "Room not found" | As expected. Pass |
| F16 | Report defect validation | Morgan, Maintenance, "Report a defect", submit empty | Three specific errors linked to fields, `aria-invalid` set | As expected. Pass |
| F17 | Report defect with hostile text | Title `<img src=x onerror=alert(1)> Leaking tap` | Preview shows the text; nothing executes | As expected. Pass |
| F18 | Record resolution | Daniel, "Record resolution", submit empty then valid | Error, then "Validation passed", marked NOT saved | As expected. Pass |
| F19 | Handoff | Morgan, Shift Handoff, Generate | Loading, then 7 sections labeled "Simulated briefing (not AI)"; double click ignored | As expected. Pass |
| F20 | Handoff failure | Tick "Demo: make generation fail", Generate | Error with retry | As expected. Pass |
| F21 | Copy briefing | Click Copy | Text copied | **Partly tested**: in the test browser the clipboard was blocked, so only the failure message ("copy it manually") was observed. Success path **not run**. |
| F22 | Request an account | `#/signup`: empty, bad values, then valid | Specific errors; `admin` not offered; valid shows "Request checked", not saved | As expected. Pass |
| F23 | Admin page | Riley, Users and Access | 2 requests, 9 accounts, 10-row permission table; Approve opens simulation | As expected. Pass |
| F24 | Restricted page by address | Morgan opens `#/access` | "Access denied" | As expected. Pass |
| F25 | Simulated problems | Prototype tools: session expired, forbidden, server error | Matching screens; "Sign in again" returns to sign-in with a message | As expected. Pass |

## 4. Accessibility and layout

| ID | Check | Result | Observed |
|---|---|---|---|
| A1 | Automated DOM audit of 13 views (sign-in, request with and without errors, all supervisor pages, admin, maintenance, housekeeper) | **Pass** | 0 issues: labels, names, one h1, no skipped heading levels, landmarks, table captions and scopes, unique ids, `lang="en"`. The audit was shown to catch deliberate faults. |
| A2 | Colour contrast of the palette | **Pass** | 23 of 23 text and background pairs at 4.5:1 or better (lowest 5.20:1) |
| A3 | Keyboard-only sign in and visible focus | **Pass** | See F5 |
| A4 | Screen reader (NVDA or VoiceOver) | **Not run** | Needed, especially for the stacked table cards on phones |
| A5 | Full keyboard walk of every screen | **Partly run** | Only sign-in and skip link by real keystrokes |
| R1 | No horizontal scrolling at 320, 375, 480, 768, 900, 1024, 1366 and 1920 px | **Pass** | Measured on sign-in, request, and every signed-in page for several roles |
| R2 | Tables stack to labeled cards at 720 px and below | **Pass** | |
| R3 | Slide-out menu on narrow screens (open, Escape, outside click, Sign out reachable) | **Pass** | |
| R4 | Defect dialog fits a 375 px screen | **Pass** | |
| R5 | Real phones and tablets | **Not run** | Only simulated sizes in a desktop browser |
| R6 | Layout inside ServiceNow | **Passed on the desktop dashboard**; narrow-window and other pages reported working, not itemised | See section 4b |

## 4b. First run inside the ServiceNow PDI (2026-11-06)

Instance `dev472716`, scope `x_2305075_roomrela`. This is the **prototype UI only**: no tables, roles or ACLs exist yet.

| ID | Check | Result | Observed |
|---|---|---|---|
| P1 | Install into the PDI | **Pass** | `npx @servicenow/sdk install --auth roomrelay-pdi` printed "Installation completed", exit code 0; the SDK also printed a rollback link. Observed directly. |
| P2 | Signed-out visit to the UI Page | **Pass** | A browser with no ServiceNow session was redirected to "You are not logged in... Redirecting to the login page", then the ServiceNow sign-in screen. The page is **not public**. Observed directly. |
| P3 | Page renders after signing in to the PDI | **Pass** | Team lead's own browser, screenshot of `.../x_2305075_roomrela_incident_manager.do#/dashboard` signed in as Morgan Ellis: sidebar, header, summary strip, charts, tables and Sign out all drawn correctly. Source Sans 3 appears to render. |
| P4 | Numbers match the local preview | **Pass** | Screenshot shows 40 rooms, 16 Ready, 9, 6, 4 and 5 in the other statuses, 72 open tasks (64 mandatory), 4 unresolved defects, 3 high-priority blockers. |
| P5 | Hash routing inside the platform page (`#/dashboard`) | **Pass** | The route in the address bar rendered the Operations Dashboard. |
| P6 | Menu, Back and Forward, refresh, direct room address, dialogs, sign out | **Reported working by the team lead, not itemised** | Re-run these one by one when convenient |
| P7 | Console errors and Content Security Policy messages | **Not itemised** | Team lead reported no problems; the exact Console output was not captured |
| P8 | `typeof window.g_ck` | **Not itemised** | Needed before the backend integration; record the answer (`"string"` or `"undefined"`) |

Caveat: P3 to P5 show the prototype running on its own synthetic data. They say nothing yet about real data, ACLs or
server-side security.

## 5. Backend and security tests (to run once the backend exists)

**Preconditions for all:** application installed in the PDI; four test users (one per role, never `admin`) with sample data
that includes the scenarios used above; a second housekeeper to test cross-user access. Observed and Result are **Not run**
until the backend is built. Recommended correction for any failure: fix the server rule or ACL, not the screen.

| ID | Objective | Steps | Expected |
|---|---|---|---|
| B1 | Unauthenticated access | Open the UI Page and each API in a private window | Redirect to ServiceNow login or 401; no data |
| B2 | Unauthorized page | Housekeeper opens the handoff page and its API | Page denied; API 403 |
| B3 | Insufficient permission | Maintenance user tries to confirm a room | 403, no change |
| B4 | Another user's record (IDOR/BOLA) | Housekeeper A requests housekeeper B's room, task and defects by id | 404/403 with the same message as a missing record |
| B5 | Invalid input | Send over-long, empty, wrong-type and unknown-field payloads to each write endpoint | 400 with a safe message; nothing saved |
| B6 | XSS-safe rendering | Save `<script>`/`<img onerror>` in a defect and a task; view everywhere | Shown as text |
| B7 | Unauthorized status change | Call the Table API to set a room's `readiness_status` as a non-admin | Rejected by ACL |
| B8 | Mandatory task bypass | Confirm Ready with one mandatory task open (UI and direct API) | Rejected with the readiness message |
| B9 | Inspection bypass | Confirm Ready with inspection `pending` or `failed` | Rejected |
| B10 | Blocking defect | Confirm Ready with an open blocking defect | Rejected; resolving it then allows it |
| B11 | Duplicate requests | Send confirm-ready twice at once | One succeeds, one gets 409; one audit row |
| B12 | Concurrent updates | Two users change the same defect | Stale update gets 409 |
| B13 | Session expiry | Let the session expire, then click | "Session expired" state; no data leak |
| B14 | API failure | Stop the API or force a 500 | Safe error screen with retry; no stack trace |
| B15 | Exposed secrets | Search repo, bundle, network traffic and logs | None |
| B16 | Prompt injection | See `AI_DESIGN.md` section 5 | All pass |
| B17 | Frontend and backend permission agreement | For each cell of the role matrix, compare what the UI offers with what the API allows | Identical; the API is the stricter one |
| B18 | Rate limiting | Hammer the briefing endpoint | Limited with a safe message |
| B19 | Account request abuse | Submit many requests, invalid emails, attempt `role=admin` | Limited or rejected; no user or role created |

## 6. Known gaps in testing

- Inside ServiceNow only the prototype UI has run, once (section 4b). Console output and `g_ck` were not captured. The remaining unknowns are in `BACKEND_HANDOFF.md` section 12.
- Screen readers, real devices, and the successful clipboard path are untested.
- The browser checks were run by hand from scripts in a temporary test browser; there is no automated end-to-end suite.
