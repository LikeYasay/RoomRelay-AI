# RoomRelay AI

**RoomRelay AI: Intelligent Hotel Room Readiness and Shift Handoff Management System**
A ServiceNow capstone application (Hospitality, use case #35: Room Readiness Handoff Assistant).

> **Status: the frontend is a complete, working prototype running on synthetic data. The ServiceNow backend
> (tables, roles, ACLs, business rules, REST APIs) and the real AI integration are not built yet.** Nothing in
> this repository has been tested with real data or real permissions. The prototype UI itself was installed into the PDI
> and renders there. See [Project status](#project-status).

## What it does

Hotel room status is scattered across housekeeping notes, task lists and maintenance reports, so blockers get missed
at shift change. RoomRelay AI puts it in one place:

- Tracks every room's readiness (Needs Cleaning, In Progress, Pending Inspection, Blocked, Ready).
- Gives housekeepers a checklist: each task is Completed, or Couldn't Complete with a reason. "Needs maintenance" sends a
  report straight to the supervisor.
- Runs defects from report to repair: supervisors triage (technician and priority: Blocking, Normal or Minor),
  technicians start and resolve, and the housekeeping task comes back to finish.
- **Never lets a room count as Ready while a mandatory task, a required inspection or a Blocking defect is open.**
- Keeps an audit log of who changed what, for the administrator.
- Produces a shift handoff briefing for the incoming shift (simulated today; real AI is planned, see
  [docs/AI_DESIGN.md](docs/AI_DESIGN.md)).
- Shows supervisors a dashboard, and shows each role only what it needs.

## Where things are

| Item | Value |
|---|---|
| ServiceNow instance (PDI) | `dev472716` (`https://dev472716.service-now.com`), Brazil release |
| Application / scope | RoomRelay AI / `x_2305075_roomrela` |
| UI Page endpoint | `x_2305075_roomrela_incident_manager.do` (name kept from the starter app; renaming has deployment effects) |
| Stack | ServiceNow Now SDK 4.14.0, React 19, TypeScript 5.5 |
| Repository | `https://github.com/LikeYasay/RoomRelay-AI` (private) |

## Run it on your computer (no ServiceNow needed)

You need Node.js 22 and `npm install` done once. Then, in the VS Code terminal:

```bash
npm run preview
```

It builds the app and serves it at `http://127.0.0.1:4173/`. Press Ctrl+C to stop. This shows the prototype with its
synthetic data. It is **not** ServiceNow: there is no real sign-in and no server-side security.

Other commands:

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds the app with the ServiceNow SDK. Local only, deploys nothing. |
| `npm run test:logic` | Runs the 26 automated tests for the readiness rules, every action rule, validation, permissions, the audit log and the handoff logic. |
| `npm run deploy` | **Installs into the PDI** (`now-sdk install`). Read [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) first. Never add `--reinstall` for normal updates. |

## Demo accounts (prototype only)

Sign-in lists these synthetic people. There is no password: the prototype never asks for one.

**The demo data is live:** changes you make (completing a task, triaging a defect...) are kept in the browser tab's memory and
seen by the next account you sign in as. Nothing is saved anywhere. Reload the page, or use **Prototype tools > Reset demo
data**, to start over. The full walkthrough is in [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md).

| Account | Role | Try this |
|---|---|---|
| Avery Collins | Housekeeping Staff | Room 102 checklist: complete a task, mark one Couldn't Complete (Needs maintenance) |
| Morgan Ellis | Housekeeping Supervisor | Maintenance > New reports: triage it; pass Room 102's inspection at the end; Shift Handoff |
| Daniel Brooks | Maintenance Staff | My queue: start and resolve the repair |
| Riley Chen | System Administrator | Audit Log, Users and Access, role-permission table |

## Project layout

The frontend uses a **vertical slice** layout: one folder per feature holds its screens, rules, validation and styles.
See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full map, the dependency rules and "where do I find...".

```
src/client/                React + TypeScript frontend
  app/                     wiring only: App, routes, menu, page layout, global styles
  features/                one folder per feature (vertical slice):
    auth/ rooms/ housekeeping/ maintenance/ dashboard/ activity/ handoff/ access/
  shared/                  used by every feature: domain types and labels, data-source contract, UI building blocks
  mock/                    all synthetic data and the mock data source (replace when the backend exists)
src/fluent/ui-pages/       ServiceNow UI Page definition (SDK)
src/fluent/generated/      SDK-generated keys (do not edit by hand)
scripts/                   local-preview.mjs, run-logic-tests.mjs
tests/                     logic.test.cjs
docs/                      all project documentation (below)
```

## Documentation

| Document | For |
|---|---|
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | **Every term in one page** (task states, defect priority, room status) with a worked example. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the frontend folders are organized (vertical slices) and how each slice maps to a backend module. |
| [docs/BACKEND_HANDOFF.md](docs/BACKEND_HANDOFF.md) | **Start here if you are building the ServiceNow backend.** Data model, ACLs, business rules, REST contract, what to change in the frontend. |
| [docs/ROLE_PERMISSION_MATRIX.md](docs/ROLE_PERMISSION_MATRIX.md) | Who can do what, per page, record and action. |
| [docs/API_SECURITY_CHECKLIST.md](docs/API_SECURITY_CHECKLIST.md) | Security controls marked implemented, verified or planned. |
| [docs/AI_DESIGN.md](docs/AI_DESIGN.md) | How AI is (and will be) used, and how it is kept safe. |
| [docs/TEST_PLAN.md](docs/TEST_PLAN.md) | Tests already run, with results, and tests still to run. |
| [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Step-by-step install into the PDI and how to verify it. |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Presentation walkthrough and likely questions. |
| [docs/licenses/](docs/licenses/) | Source Sans 3 font license (SIL OFL 1.1). |

## Project status

| Area | State |
|---|---|
| Frontend: dashboard, Rooms (three views), room details with checklist, maintenance with triage and a defect modal, shift handoff, users and access, audit log, sign-in and request-account pages | **Built.** Synthetic, live in-memory data. Responsive from 320px to wide desktops. |
| Local checks: strict TypeScript, SDK build, 26 logic tests, accessibility and contrast checks, browser walkthrough of the full scenario | **Passed** (details in the test plan). |
| Installed in the PDI and checked there | **Done once on 2026-11-06** for the earlier version of the UI: it renders and works, and signed-out visitors are sent to the ServiceNow login. Console details and `g_ck` were not itemised (see `docs/TEST_PLAN.md` section 4b). **The current version (task and defect rework) is not installed yet.** |
| ServiceNow tables, roles, ACLs, business rules, REST APIs (Phase 4) | **Not started.** Specified in the backend handoff. |
| Real AI summaries (Phase 5) | **Not started.** Designed in `docs/AI_DESIGN.md`. The handoff screen is clearly labeled "Simulated briefing (not AI)". |
| Server-enforced security | **None yet.** Every role and permission rule in the browser is cosmetic until the backend enforces it. |

## Security notes

- No passwords, API keys or tokens are in this repository. The frontend never handles a password.
- All user-written text is rendered as plain text. There is no `dangerouslySetInnerHTML`, `eval` or external script.
- The browser app makes **no network requests** today. When the backend exists, ServiceNow must enforce every rule.
- The live demo data is a stand-in for the server, **not** a security control: anyone can change browser memory.
- Dependencies: `npm audit --omit=dev` reports 0 vulnerabilities. The full audit reports 20 findings, all in
  ServiceNow SDK build tooling (development only). The suggested fix is a downgrade of the SDK, so it was not applied.

## Git rules for this project

The team lead stages, commits and pushes. Use Conventional Commit messages, for example
`feat(frontend): add room details screen`. `src/fluent/generated/keys.ts` is generated by the SDK; commit it as
generated, never edit it by hand.
