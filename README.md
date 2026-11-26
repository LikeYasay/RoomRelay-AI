# RoomRelay AI

**RoomRelay AI: Intelligent Hotel Room Readiness and Shift Handoff Management System**
A ServiceNow capstone application (Hospitality, use case #35: Room Readiness Handoff Assistant).

> **Status (2026-11-07):** the frontend and a first working version of the ServiceNow backend (tables, roles, ACLs,
> REST API) are built, installed in the PDI and verified there for every role. All data is synthetic demo data.
> The AI shift briefing (Groq, called from the ServiceNow server) is installed and verified in the PDI, including the
> labeled template fallback and a prompt-injection attempt. See [Project status](#project-status).

## What it does

Hotel room status is scattered across housekeeping notes, task lists and maintenance reports, so blockers get missed
at shift change. RoomRelay AI puts it in one place:

- Tracks every room's readiness (Needs Cleaning, In Progress, Pending Inspection, Blocked, Ready).
- Gives housekeepers a checklist: each task is Completed, or Couldn't Complete with a reason. "Needs maintenance" sends a
  report straight to the supervisor.
- Runs defects from report to repair: supervisors triage (technician and priority: Blocking, Normal or Minor),
  technicians start and resolve, and the housekeeping task comes back to finish.
- **Never lets a room count as Ready while a mandatory task, a required inspection or a Blocking defect is open.**
  The ServiceNow server enforces this; the browser only explains it.
- Keeps an audit log of who changed what, for the administrator.
- Produces a shift handoff briefing for the incoming shift. Inside ServiceNow an AI model (Groq) writes the summary
  and suggested actions from minimized data; the room lists come from the rules, and a labeled template is used if the
  AI is unavailable. See [docs/AI_DESIGN.md](docs/AI_DESIGN.md).
- Shows each role only what it needs. Terms are explained in [docs/GLOSSARY.md](docs/GLOSSARY.md).

## Where things are

| Item | Value |
|---|---|
| ServiceNow instance (PDI) | `dev486421` (`https://dev486421.service-now.com`), Brazil release |
| Application / scope | RoomRelay AI / `x_2318724_roomrela` |
| App page | `https://dev486421.service-now.com/x_2318724_roomrela_incident_manager.do` (endpoint name kept from the starter app; renaming has deployment effects) |
| REST API | `/api/x_2318724_roomrela/v1/roomrelay/` (`GET /me`, `GET /snapshot`, `POST /commands`, `POST /demo/reset`) |
| Stack | ServiceNow Now SDK 4.14.0, React 19, TypeScript 5.5 |
| Repository | `https://github.com/LikeYasay/RoomRelay-AI` (private) |

## Two ways to run it

The same code runs in two modes; `src/client/shared/api/environment.ts` picks one from the page address.

### Inside ServiceNow (the real app)

1. Sign in to the PDI and choose **All > RoomRelay AI > Open RoomRelay** (or open the app page above). There is no RoomRelay sign-in page: ServiceNow has already
   signed you in, and the server decides your role.
2. First time only: open **Data management** (bottom-left, administrator only) and press **Restore initial data**.
3. To use another role, sign in as one of the staff accounts below (give them a password first, see
   [docs/TEST_CASES.md](docs/TEST_CASES.md) section 0.2), or use ServiceNow's **Impersonate User**.

Changes are saved to the RoomRelay tables and recorded in the audit log. **Restore initial data** resets everything.

### On your computer (local preview, no ServiceNow)

You need Node.js 22 and `npm install` done once. Then, in the VS Code terminal:

```bash
npm run preview
```

It builds the app and serves it at `http://127.0.0.1:4173/`. Press Ctrl+C to stop. Here a sign-in page lets you
pick a staff account, and the data lives in the browser tab's memory: changes are seen by the next account you sign in as,
and a reload (or **Preview tools > Restore initial data**) starts over. There is no server-side security in this mode.

### Staff accounts (installed with the app)

| User | Role | Try this ([docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) has the full walkthrough) |
|---|---|---|
| Avery Collins (`avery.collins`) | Housekeeping Staff | Room 102 checklist: complete a task, mark one Couldn't Complete (Needs maintenance) |
| Morgan Ellis (`morgan.ellis`) | Housekeeping Supervisor | Maintenance > New reports: triage it; pass Room 102's inspection at the end; Shift Handoff |
| Daniel Brooks (`daniel.brooks`) | Maintenance Staff | My queue: start and resolve the repair |
| Riley Chen (`riley.chen`) | System Administrator | Audit Log, Users and Roles, role-permission table, Restore initial data |

Five more housekeepers and technicians exist (Jordan Reyes, Priya Nair, Tomasz Kowalski, Lena Okafor, Sofia Marques).
They are defined in `src/fluent/auth/demo-users.now.ts` with no password. There is no self-registration: the system
administrator creates accounts and grants roles in ServiceNow. For a real hotel, remove that file and create the real staff.
The full manual test list for every role is [docs/TEST_CASES.md](docs/TEST_CASES.md).

### Commands

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds the app with the ServiceNow SDK. Local only, deploys nothing. |
| `npm run test:logic` | Runs the 40 automated tests for the readiness rules, every action rule, validation, permissions, the audit log, the handoff logic and the backend contract (request parsing, per-role data scoping) and the Service Portal overview. |
| `npm run preview` | Builds and serves the local preview. |
| `npm run deploy` | **Installs into the PDI** (`now-sdk install`). Read [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) first. Never add `--reinstall` for normal updates. |

## Project layout

Both the frontend and the backend use **vertical slices**: one folder per feature (rooms, housekeeping, maintenance,
...), with the same names in `src/client/features/`, `src/fluent/` and the REST API. The server reuses the frontend's
rule files, so there is one copy of every rule. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
src/client/                React + TypeScript frontend
  app/                     wiring only: App, routes, menu, page layout, data provider, global styles
  features/                one folder per feature: screens, rules, validation, styles
    auth/ rooms/ housekeeping/ maintenance/ dashboard/ activity/ handoff/ access/
  shared/                  used by every feature: domain types and labels, backend contract, UI building blocks
  mock/                    synthetic data and the in-memory demo store (local preview; also the demo seed)
src/fluent/                ServiceNow metadata by feature: roles, tables, ACLs, REST API, demo users, UI Page
src/server/                ServiceNow server code: REST handlers, data access, session
src/fluent/generated/      SDK-generated keys (do not edit by hand)
scripts/                   local-preview.mjs, run-logic-tests.mjs
tests/                     logic.test.cjs
docs/                      all project documentation (below)
```

## Documentation

| Document | For |
|---|---|
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | **Every term in one page** (task states, defect priority, room status) with a worked example. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the folders are organized, how a request flows, and the rules that keep the shared code working on the server. |
| [docs/BACKEND_HANDOFF.md](docs/BACKEND_HANDOFF.md) | The ServiceNow backend: what is built (section 0), data model, ACLs, REST contract, what is still open. |
| [docs/ROLE_PERMISSION_MATRIX.md](docs/ROLE_PERMISSION_MATRIX.md) | Who can do what, per page, record and action. |
| [docs/API_SECURITY_CHECKLIST.md](docs/API_SECURITY_CHECKLIST.md) | Security controls marked verified, implemented or planned. |
| [docs/AI_DESIGN.md](docs/AI_DESIGN.md) | How AI is (and will be) used, and how it is kept safe. |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | Tests already run, with results (including the PDI checks), and tests still to run. |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Step-by-step install into the PDI and how to verify it. |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Presentation walkthrough and likely questions. |
| [docs/licenses/](docs/licenses/) | Source Sans 3 font license (SIL OFL 1.1). |

## Project status

| Area | State |
|---|---|
| Frontend: dashboard, Rooms (three views), room details with checklist, maintenance with triage and a defect modal, shift handoff, users and roles, audit log | **Built.** Responsive from 320px to wide desktops. |
| ServiceNow backend: 5 tables, 4 roles, ACLs, REST API, staff accounts and Restore initial data | **Built, installed and verified in the PDI** on 2026-11-07 (`docs/TEST_PLAN.md` section 4b, P9 to P22): every role, the full Room 102 scenario, saved changes and the audit trail. |
| Server-enforced security | **Verified for the tested cases**: each role receives only its own data; other people's records, wrong roles, extra fields, users without a role and direct table access are refused. Concurrent requests, rate limiting and a full security review are still open. |
| Local checks | Strict TypeScript, SDK build, 40 logic tests, a check that every server-module import resolves, accessibility and contrast checks. All pass. |
| Accounts | No self-registration: the system administrator creates users and grants roles in ServiceNow (the hotel-staff-only model). The simulated sign-up and access-request pages were removed on 2026-11-07. |
| Service Portal (`/roomrelay`) | **Built; PDI check pending (`docs/TEST_PLAN.md` P40).** One portal page with three widgets: Readiness Overview, My Work (per role) and Report a Defect (housekeeping staff and supervisors). The widgets use the same REST API, role checks and readiness rules as the full app (`GET /portal/overview`, `POST /commands`). Defined in `src/fluent/portal/`. |
| AI shift briefing (Phase 5) | **Built and verified in the PDI (2026-11-07, `docs/TEST_PLAN.md` P23 to P29).** Server-side Groq call with a key stored in an encrypted system property, data minimization, reply checks, a 5-per-10-minutes limit and a labeled fallback. Setup: `docs/DEPLOYMENT_GUIDE.md` section 3b. |

## Security notes

- No passwords, API keys or tokens are in this repository. The frontend never handles a password; inside ServiceNow the
  server identifies the user from the session, and the browser never sends its own identity or role.
- All user-written text is rendered as plain text. There is no `dangerouslySetInnerHTML`, `eval` or external script.
- The only network calls are to the RoomRelay REST API on the same instance, with the session's `X-UserToken`.
- The local preview's in-memory demo is a stand-in for the server, **not** a security control.
- Dependencies: `npm audit --omit=dev` reports 0 vulnerabilities. The full audit reports 20 findings, all in
  ServiceNow SDK build tooling (development only). The suggested fix is a downgrade of the SDK, so it was not applied.

## Git rules for this project

The team lead stages, commits and pushes. Use Conventional Commit messages, for example
`feat(frontend): add room details screen`. `src/fluent/generated/keys.ts` is generated by the SDK; commit it as
generated, never edit it by hand.
