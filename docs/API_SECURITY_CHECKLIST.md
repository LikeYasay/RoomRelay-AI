# Security checklist (frontend and API)

Status words used:

- **Verified**: built and tested in this project (how is stated).
- **Implemented**: built, but not tested beyond a code read.
- **Planned**: not built. Required before the application can be called secure.

> **Server-side enforcement is built and verified in the PDI for the tested cases** (TEST_PLAN.md section 4b). It is not
> a full security review: concurrency, rate limiting and the items still marked Planned are open. Do not claim more than
> the Verified rows show. The browser checks are a convenience, not a defense.

Loosely based on the OWASP Top 10 and OWASP API Security Top 10, kept practical for a capstone.

## A. Frontend controls

| # | Control | Status | Evidence or note |
|---|---|---|---|
| A1 | No passwords handled in the frontend; no password fields | **Verified** | Code search: 0 password inputs. Sign-in and request pages collect no password. |
| A2 | No secrets (keys, tokens, credentials) in code or repo | **Verified** | Code search found none; `.gitignore` covers `.env*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`. |
| A3 | No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write` | **Verified** | Code search: 0 matches in `src/`. |
| A4 | User text rendered as plain text (XSS) | **Verified** | `<img src=x onerror=alert(1)>` typed into search boxes, defect and request forms: shown as text, nothing executed. |
| A5 | No third-party scripts or external requests at runtime | **Verified** | Bundle contains no `http(s)` script sources; font is embedded; 0 network requests recorded in the browser. |
| A6 | Input validation on forms (required, length, allowed values, control characters) | **Verified** | 26 automated tests, including defect report, triage, resolution, Couldn't Complete and account-request rules. **Browser checks only help usability; the server must repeat them.** |
| A7 | Room id from the URL validated before use (`^\d{3,4}$`) | **Verified** | Browser: `abc` gives "Room not found". |
| A8 | Routes whitelisted; unknown paths show "Page not found" | **Verified** | Browser: `#/<script>alert(1)</script>` shows "Page not found", nothing runs. |
| A9 | Menu shows only the pages the role may use | **Verified** | Automated test and browser (all four roles). |
| A9b | Every action re-checks role and ownership in its rule function, and "not yours" looks like "does not exist" | **Verified in the prototype** | Automated tests `COMMANDS` and `FLOW`. This is the reference for the server, **not** a defense: the rules run in the browser. |
| A10 | Access-denied screen for pages a role may not open | **Verified** | Browser. |
| A11 | Safe error messages (no server details shown) | **Verified** | `ApiError` uses fixed messages; error boundary logs only the error name. Simulated server, forbidden and expired states checked in the browser. |
| A12 | Session expiry handling | **Verified (simulated)** | "Session expired" state with sign-in-again button. Real expiry depends on ServiceNow. |
| A13 | Browser storage limited | **Verified** | Only the demo account id in `sessionStorage`, cleared on sign-out. The live demo data lives in page memory only (never in storage) and is gone on reload. Goes away with the real session. |
| A13b | The local preview is clearly labeled and not presented as security | **Implemented** | "Live demo data" banner on Maintenance, note in Prototype tools, README and demo script. Anyone can change browser memory. |
| A14 | Copy-to-clipboard text stripped of control characters | **Verified** | Automated test. |
| A15 | Accessibility basics (labels, names, landmarks, focus ring, keyboard sign-in, skip link) | **Verified** | DOM audit of 13 views found 0 issues; keyboard-only sign-in works; contrast 23 of 23 pairs pass. Screen readers **not** tested. |
| A16 | CSRF token sent with API calls | **Planned** | Reuse the session token pattern (`X-UserToken` / `g_ck`) in the one place the data source calls the server. |
| A17 | Content security policy compatible | **Partly verified** | In the PDI the page renders with the embedded font and styles and no problem was reported (2026-11-06). The Console output was not captured; re-check for Content Security Policy messages. |

## B. Backend and API controls (built 2026-11-06, tested in the PDI 2026-11-07)

| # | Control | Status | Required behavior |
|---|---|---|---|
| B1 | Authentication on every endpoint | **Verified** | The UI Page requires a ServiceNow sign-in (2026-11-06). The REST API requires one of the four roles through a `rest_endpoint` ACL set on every route; a user without a role gets 403 from ServiceNow before any code runs (2026-11-07, TEST_PLAN P22). |
| B2 | Roles and role-based access | **Implemented** | Four app roles, no role inheritance (`src/fluent/auth/roles.now.ts`). Identity and role come from the session, never from the request. |
| B3 | Table ACLs, deny by default | **Implemented** | Only the app admin can read the tables directly; nobody but the server code writes them (staff profiles: app admin). |
| B4 | Object-level authorization (IDOR/BOLA) | **Verified in the PDI** (P15, P17) | Rule functions check ownership and answer "not available" for both "not yours" and "does not exist" (tested); `scopeSnapshotForRole` sends only visible rooms (tested). |
| B5 | Server-side readiness validation | **Implemented** | The server runs the same `readiness.ts` and rule files as the frontend (`applyCommand`); 40 automated tests cover them. |
| B6 | Protected status transitions | **Implemented** | Status, inspection and priority change only through the command rules; readiness is derived, never written. |
| B7 | Block direct Table API bypass | **Verified in the PDI** (P18) | `allowWebServiceAccess: false` on every table, and read-only ACLs. To verify: call `/api/now/table/x_2318724_roomrela_room` as a non-admin. |
| B8 | Duplicate and concurrent request handling | **Partly implemented** | Every rule checks the current state (a second "complete" gets 409). No version check: two requests in the same instant could both pass. |
| B9 | Input validation on every endpoint | **Verified in the PDI** (P17) | `parseCommand` rejects unknown types, unknown fields, wrong types and over-long values (tested); then the feature validation rules apply. |
| B10 | Injection prevention | **Implemented** | Queries use `GlideRecord.addQuery` and `get` with values, never encoded queries built from user input. |
| B11 | Secure record access in scripts | **Implemented differently** | Plain `GlideRecord` behind closed tables; the handlers apply the role and ownership rules themselves (see `BACKEND_HANDOFF.md` section 0). |
| B12 | Limited response data | **Implemented** | Snapshot scoped per role; the staff list has name, role and shift only (no email). Technicians still receive the tasks of their rooms. |
| B13 | Safe errors | **Implemented** | One error envelope; rule messages only; unexpected errors are logged with `gs.error` and answered generically. |
| B14 | Rate limiting | **Partly implemented** | AI briefing only: 5 per supervisor in 10 minutes, counted from the audit log (429). **Verified in the PDI** (P26). Other routes have none. |
| B15 | CORS | **Implemented (default)** | No CORS rule is created, so the API is same-origin only. |
| B16 | Audit trail | **Verified in the PDI** (P19) | `x_2318724_roomrela_audit` rows are written in the same request as each change, with the session user as actor; no role can write the table. |
| B17 | Secure logging | **Implemented** | Logs contain the error message only; no request bodies, tokens or prompts. |
| B18 | Account requests | **Not applicable (removed)** | No self-registration or access-request form. Accounts and roles are created only by an administrator in ServiceNow. |

## C. AI controls (see AI_DESIGN.md)

"Implemented" means built and covered by local tests. In the PDI the supervisor-only check, the fallback (C5), the rate limit (C7), the live call with the server-side key (C1) and one prompt-injection attempt (C3, C6) were verified on 2026-11-07 (TEST_PLAN P24 to P29).

| # | Control | Status |
|---|---|---|
| C1 | API key server-side only, never in the browser or repo | **Implemented**: encrypted `password2` system property created by hand; read only by `src/server/handoff/groq.ts`; never logged |
| C2 | Send only data the caller may see, minimized | **Implemented and tested** (`AI:` data test): room numbers, statuses, counts, titles and reason categories; no names, notes or descriptions |
| C3 | Untrusted text delimited; model output cannot trigger actions | **Implemented and tested** (`AI + INJECTION`): JSON in `<data>` with `<` and `>` escaped; the reply is only displayed |
| C4 | Reply validated (shape, length) and shown as plain text | **Implemented and tested**: JSON only, lengths capped, control characters removed, invented rooms dropped; React renders text only |
| C5 | Timeout, failure handling, labeled fallback | **Implemented**: 15 s timeout; every failure returns the template labeled "Fallback template (not AI)" with a reason |
| C6 | AI can never approve a room or change permissions | **Verified in the prototype and by design on the server**: the AI only replaces the summary, priorities and actions; the lists, counts and readiness come from the rules (tested) |
| C7 | Per-user rate limit and cost cap | **Implemented**: 5 per supervisor in 10 minutes; Groq free tier (no billing attached), so there is no spend to cap |

## D. Dependencies and tooling

| Item | Status |
|---|---|
| `npm audit --omit=dev` (what ships to users) | **0 vulnerabilities** (checked 2026-11-06) |
| `npm audit` (everything) | 20 findings (10 moderate, 10 high), all reached through `@servicenow/sdk` and `@servicenow/isomorphic-rollup` build tools. Names include `glob`, `minimatch`, `joi`, `undici`, `zod`, `ts-morph`. They are denial-of-service style issues in development tools that process local, trusted files. |
| Suggested automatic fix | A **downgrade** of the SDK (to 4.12.2) and `isomorphic-rollup` (to 1.3.1). **Not applied**, because it moves off the supported version. 4.14.0 was the newest SDK when checked. |
| Residual risk | Low for a student laptop that only builds and installs to its own PDI. Recheck after SDK releases. Do not run `npm audit fix --force`. |
| New dependencies added by the frontend work | None. (The Source Sans 3 font was embedded as a file under the SIL Open Font License; `package.json` dependencies unchanged.) |

## E. Before you present or ship

- [x] Confirm the UI Page requires sign-in (2026-11-06, and again after the backend install on 2026-11-07).
- [x] Test each role as a non-admin user in the PDI (Impersonate User; TEST_PLAN P15 to P22).
- [ ] Run the rest of `TEST_PLAN.md` section 5 (rows marked Not run).
- [ ] Before any real use: remove the installed staff accounts (`src/fluent/auth/demo-users.now.ts`) and the Restore initial data endpoint (`POST /demo/reset`).
- [ ] Search the repo again for secrets and tokens before each push.
- [ ] Take screenshots only after removing anything sensitive.
