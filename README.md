# RoomRelay AI

**RoomRelay AI: Intelligent Hotel Room Readiness and Shift Handoff Management System**
A ServiceNow capstone application (Hospitality, use case #35: Room Readiness Handoff Assistant).

> **Status: the frontend is a complete, working prototype running on synthetic data. The ServiceNow backend
> (tables, roles, ACLs, business rules, REST APIs) and the real AI integration are not built yet.** Nothing in
> this repository has been installed into the PDI or tested there. See [Project status](#project-status).

## What it does

Hotel room status is scattered across housekeeping notes, task lists and maintenance reports, so blockers get missed
at shift change. RoomRelay AI puts it in one place:

- Tracks every room's readiness (Needs Cleaning, In Progress, Pending Inspection, Blocked, Ready).
- Manages housekeeping tasks and maintenance defects.
- **Never lets a room count as Ready while mandatory tasks, a required inspection or a blocking defect remain open.**
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
| `npm run test:logic` | Runs the 17 automated tests for the readiness rules, validation, permissions and handoff logic. |
| `npm run deploy` | **Installs into the PDI** (`now-sdk install`). Read [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) first. Never add `--reinstall` for normal updates. |

## Demo accounts (prototype only)

Sign-in lists these synthetic people. There is no password: the prototype never asks for one.

| Account | Role | Try this |
|---|---|---|
| Morgan Ellis | Housekeeping Supervisor | Everything operational, Shift Handoff |
| Avery Collins | Housekeeping Staff | Own rooms only, submit Room 104 for inspection |
| Daniel Brooks | Maintenance Staff | Own defects only, record a resolution |
| Riley Chen | System Administrator | Users and Access page, role-permission table |

## Project layout

```
src/client/                React + TypeScript frontend
  app.tsx                  routes and app shell wiring
  app/                     session, data provider, routing, route table
  domain/                  pure logic: readiness rules, validation, permissions, handoff
  data/                    synthetic data (mockData.ts, mockAccess.ts)
  services/                dataSource.ts (the interface the backend must satisfy), mockDataSource.ts
  features/                one folder per screen: dashboard, rooms, housekeeping, maintenance, handoff, access, auth
  components/              shared UI (layout, ui)
  styles/                  CSS (tokens, layout, components, responsive) and the embedded font
src/fluent/ui-pages/       ServiceNow UI Page definition (SDK)
src/fluent/generated/      SDK-generated keys (do not edit by hand)
scripts/                   local-preview.mjs, run-logic-tests.mjs
tests/                     logic.test.cjs
docs/                      all project documentation (below)
```

## Documentation

| Document | For |
|---|---|
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
| Frontend: dashboard, room board, room details, housekeeping, maintenance, shift handoff, users and access, sign-in and request-account pages | **Built.** Synthetic data. Responsive from 320px to wide desktops. |
| Local checks: strict TypeScript, SDK build, 17 logic tests, accessibility audit of 13 views, contrast check | **Passed** (details in the test plan). |
| Installed in the PDI and checked there | **Not done.** |
| ServiceNow tables, roles, ACLs, business rules, REST APIs (Phase 4) | **Not started.** Specified in the backend handoff. |
| Real AI summaries (Phase 5) | **Not started.** Designed in `docs/AI_DESIGN.md`. The handoff screen is clearly labeled "Simulated briefing (not AI)". |
| Server-enforced security | **None yet.** Every role and permission rule in the browser is cosmetic until the backend enforces it. |

## Security notes

- No passwords, API keys or tokens are in this repository. The frontend never handles a password.
- All user-written text is rendered as plain text. There is no `dangerouslySetInnerHTML`, `eval` or external script.
- The browser app makes **no network requests** today. When the backend exists, ServiceNow must enforce every rule.
- Dependencies: `npm audit --omit=dev` reports 0 vulnerabilities. The full audit reports 20 findings, all in
  ServiceNow SDK build tooling (development only). The suggested fix is a downgrade of the SDK, so it was not applied.

## Git rules for this project

The team lead stages, commits and pushes. Use Conventional Commit messages, for example
`feat(frontend): add room details screen`. `src/fluent/generated/keys.ts` is generated by the SDK; commit it as
generated, never edit it by hand.
