# Security checklist (frontend and API)

Status words used:

- **Verified**: built and tested in this project (how is stated).
- **Implemented**: built, but not tested beyond a code read.
- **Planned**: not built. Required before the application can be called secure.
- **N/A now**: does not apply until the backend exists.

> **The application is NOT end-to-end secure yet.** Today there is no server-side enforcement at all. The browser rules
> are a convenience, not a defense. Do not claim security beyond what the Verified rows show.

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
| A13b | Live demo data is clearly labeled and not presented as security | **Implemented** | "Live demo data" banner on Maintenance, note in Prototype tools, README and demo script. Anyone can change browser memory. |
| A14 | Copy-to-clipboard text stripped of control characters | **Verified** | Automated test. |
| A15 | Accessibility basics (labels, names, landmarks, focus ring, keyboard sign-in, skip link) | **Verified** | DOM audit of 13 views found 0 issues; keyboard-only sign-in works; contrast 23 of 23 pairs pass. Screen readers **not** tested. |
| A16 | CSRF token sent with API calls | **Planned** | Reuse the session token pattern (`X-UserToken` / `g_ck`) in the one place the data source calls the server. |
| A17 | Content security policy compatible | **Partly verified** | In the PDI the page renders with the embedded font and styles and no problem was reported (2026-11-06). The Console output was not captured; re-check for Content Security Policy messages. |

## B. Backend and API controls (all Planned)

| # | Control | Status | Required behavior |
|---|---|---|---|
| B1 | Authentication on every endpoint | **Partly verified** | The UI Page itself requires a ServiceNow sign-in (verified 2026-11-06). There are no API endpoints yet; each new one must also require sign-in. |
| B2 | Roles and role-based access | Planned | Four app roles, no role inheritance. |
| B3 | Table, row and field ACLs, deny by default | Planned | Per matrix in `ROLE_PERMISSION_MATRIX.md`. |
| B4 | Object-level authorization (IDOR/BOLA) | Planned | Opening, changing or listing another user's room, task or defect must fail. Same response for "not found" and "not allowed". |
| B5 | Server-side readiness validation | Planned | One Script Include used by business rules and REST; tested with `tests/logic.test.cjs` cases. |
| B6 | Protected status transitions | Planned | Ready, inspection and `readiness_status` writable only by server logic. |
| B7 | Block direct Table API bypass | Planned | Non-admin attempts to set protected fields via `/api/now/table/...` fail. |
| B8 | Duplicate and concurrent request handling | Planned | Conditional updates, 409 on stale state, no double confirmation. |
| B9 | Input validation on every endpoint | Planned | Repeat all rules from `features/maintenance/defectValidation.ts` and `features/auth/accountRequestValidation.ts`; reject unknown fields. |
| B10 | Injection prevention | Planned | Use `GlideRecord` with parameters (no string-built queries); validate ids. |
| B11 | Secure record access in scripts | Planned | `GlideRecordSecure` or explicit `canRead/canWrite`. |
| B12 | Limited response data | Planned | Return only needed fields; no extra personal data. |
| B13 | Safe errors | Planned | One error envelope; no stack traces, table names or script text. |
| B14 | Rate limiting | Planned | At least for the briefing (cost) and any public request endpoint. |
| B15 | CORS | Planned | Same-origin only; do not enable cross-origin access. |
| B16 | Audit trail | Planned (prototype built) | Server-written, append-only `audit_entry` rows for every task, defect, inspection, briefing and access decision, with the session user as actor. The prototype's Audit Log page and the append-only rule are built and tested in the browser (`AUDIT` test); the real log must be written by the server. |
| B17 | Secure logging | Planned | No secrets, passwords or full AI prompts in logs. |
| B18 | Account requests | Planned | Never create users or grant roles from a public form; administrator decides. See `BACKEND_HANDOFF.md` section 8. |

## C. AI controls (all Planned; see AI_DESIGN.md)

| # | Control | Status |
|---|---|---|
| C1 | API key in a ServiceNow credential, never in the browser or repo | Planned |
| C2 | Send only data the caller may see, minimized | Planned (the template already uses reason categories only, never free-text notes; tested) |
| C3 | Untrusted text delimited; model output cannot trigger actions | Planned |
| C4 | Reply validated (shape, length) and shown as plain text | Planned (display already safe) |
| C5 | Timeout, failure handling, labeled fallback | Planned (template exists) |
| C6 | AI can never approve a room or change permissions | **Verified in the prototype**: readiness depends only on data fields; hostile-text test passes. Must be re-verified server-side. |
| C7 | Per-user rate limit and cost cap | Planned |

## D. Dependencies and tooling

| Item | Status |
|---|---|
| `npm audit --omit=dev` (what ships to users) | **0 vulnerabilities** (checked 2026-11-06) |
| `npm audit` (everything) | 20 findings (10 moderate, 10 high), all reached through `@servicenow/sdk` and `@servicenow/isomorphic-rollup` build tools. Names include `glob`, `minimatch`, `joi`, `undici`, `zod`, `ts-morph`. They are denial-of-service style issues in development tools that process local, trusted files. |
| Suggested automatic fix | A **downgrade** of the SDK (to 4.12.2) and `isomorphic-rollup` (to 1.3.1). **Not applied**, because it moves off the supported version. 4.14.0 was the newest SDK when checked. |
| Residual risk | Low for a student laptop that only builds and installs to its own PDI. Recheck after SDK releases. Do not run `npm audit fix --force`. |
| New dependencies added by the frontend work | None. (The Source Sans 3 font was embedded as a file under the SIL Open Font License; `package.json` dependencies unchanged.) |

## E. Before you present or ship

- [x] Confirm the UI Page requires sign-in (verified 2026-11-06: a signed-out visit was redirected to the ServiceNow login). Repeat after roles are added.
- [ ] Run every test in `TEST_PLAN.md` section 5 with real non-admin users.
- [ ] Confirm no demo accounts or "Prototype tools" remain in the production build, or that they are behind a switch.
- [ ] Search the repo again for secrets and tokens before each push.
- [ ] Take screenshots only after removing anything sensitive.
