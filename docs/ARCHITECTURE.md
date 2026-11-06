# Frontend architecture: vertical slices

The frontend in `src/client/` is organized by **feature** (a "vertical slice"), not by technical layer. Everything one
feature needs (its screens, its rules, its validation, its stylesheet) sits in one folder. To change how defects work,
you open `features/maintenance/`.

The old layout grouped files by kind (`components/`, `domain/`, `services/`, `styles/`), so one change touched four folders.

## Folder map

```
src/client/
  main.tsx                  entry point (React starts here)
  index.html                page shell used by the ServiceNow UI Page
  app/                      wiring only: puts the features together
    App.tsx                 providers, signed-in / signed-out switch, creates the data source, stylesheet order
    AppRoutes.tsx           address (#/rooms/305) -> the screen of the feature that owns it
    DataProvider.tsx        loads the data, computes readiness, scopes it to the role, sends changes
    routes.ts               route table: menu labels and which roles may open each page
    parseHash.ts            reads the address (pure, tested); useHashRoute.ts is the React hook around it
    layout/                 AppShell, Header, Sidebar (with Sign out), PrototypeTools (incl. "Reset demo data")
    styles/                 global CSS (tokens, base, layout, components, forms, responsive) and the embedded font
  features/                 one folder per business capability
    auth/                   sign-in, request-account, demo session, account-request validation
    rooms/                  Rooms page (views), room details, readiness panel, THE READINESS RULE (readiness.ts),
                            room views and priority, inspection rules (roomCommands.ts), room scoping
    housekeeping/           the room checklist, the "Couldn't Complete" dialog, task rules and validation
    maintenance/            Maintenance page (views), defect details modal, report form, defect rules
                            (report, triage, start, resolve), what counts as blocking (blockers.ts), defect scoping
    dashboard/              operations dashboard panels and its numbers (dashboardStats.ts)
    activity/               Audit Log page, the activity feed, and how recent activity is read from the log
    handoff/                shift handoff screen, the template briefing (later: the AI call), briefing audit rule
    access/                 users and access screen, role-permission table
  shared/                   used by every feature; knows nothing about any one feature
    domain/                 the hotel vocabulary: data types (types.ts), labels (labels.ts), status badges,
                            and the helpers every rule uses (commandKit.ts: audit entries, safe failures)
    api/                    the backend contract: reads (dataSource.ts), writes (commands.ts), safe errors,
                            the loader hook (useSnapshot.ts), and DataGate / useCommands (DataContext.tsx)
    ui/                     generic building blocks: Badge, Banner, Dialog, ConfirmDialog, ViewTabs, FormFields, Icon...
    lib/                    small helpers: format.ts, validation.ts (checkText, result types)
  mock/                     ALL fake data: the seed (mockData.ts), the live in-memory demo store (mockStore.ts) and the
                            mock data source. Delete or switch off when the backend is real.
```

## Where do I find...

| I want to change... | Open |
|---|---|
| When a room counts as Ready | `features/rooms/readiness.ts` |
| Who may submit, pass or fail an inspection | `features/rooms/roomActions.ts` (buttons) and `roomCommands.ts` (rule) |
| The Rooms page and its views | `features/rooms/RoomsScreen.tsx` |
| The checklist, Couldn't Complete and its reasons | `features/housekeeping/` |
| Defect report, triage, start, resolve | `features/maintenance/defectCommands.ts`, `DefectModal.tsx` |
| Which defects block a room | `features/maintenance/blockers.ts` |
| Who sees which rooms or defects (demo scoping) | `features/rooms/scope.ts`, `features/maintenance/scope.ts` |
| Dashboard numbers | `features/dashboard/dashboardStats.ts` |
| The Audit Log | `features/activity/AuditLogScreen.tsx` |
| The shift briefing text | `features/handoff/briefing.ts` |
| Who can open which page (menu) | `app/routes.ts` |
| The permission table on Users and Access | `features/access/permissions.ts` |
| A status name, color or icon | `shared/domain/labels.ts`, `shared/domain/StatusBadges.tsx` |
| A data type (Room, Defect, Task, AuditEntry...) | `shared/domain/types.ts` |
| What the backend must provide | `shared/api/dataSource.ts` (reads) and `shared/api/commands.ts` (writes) |
| The fake data, or the live demo store | `mock/mockData.ts`, `mock/mockStore.ts` |

## How a change flows

```
Screen (e.g. ChecklistPanel)
  -> run({ type: 'task.complete', taskId })        useCommands() from shared/api/DataContext.tsx
  -> app/DataProvider.tsx                           calls source.execute(command), then quietly reloads
  -> RoomRelayDataSource.execute                    today: mock/mockDataSource.ts; Phase 4: ServiceNow REST
  -> the rule for that command                      features/housekeeping/taskCommands.ts (the server must repeat it)
  -> new data + an audit entry
```

The rule functions are pure: `(data, who and when, input) -> new data or a safe failure`. That is why they can be
tested without a browser, and why the backend teammate can port them one by one.

## The dependency rules

1. **`shared/` never imports from `features/`, `app/` or `mock/`.** It is the common ground.
2. **A feature may import from `shared/` and from other features, but never in a circle.** Today the arrows are:

   ```
   dashboard    -> rooms, maintenance, activity, auth
   rooms        -> housekeeping, maintenance, activity, auth
   housekeeping -> maintenance, auth
   maintenance  -> auth
   handoff      -> maintenance
   access, activity, auth -> (shared only)
   ```

3. **No feature imports from `app/`.** `app/` is the only place that knows every feature (routes, menu, data provider).
4. **Only `app/App.tsx` creates the data source**: `ServiceNowDataSource` inside ServiceNow, `MockDataSource` in the
   local preview (`shared/api/environment.ts` decides which).

Logic files (rules, validation, numbers) are plain TypeScript with no React, so `npm run test:logic` can test them
without a browser. Keep them that way.

## The backend (ServiceNow)

The backend lives in the same repository and uses the same feature names:

```
src/fluent/                 ServiceNow metadata (installed with the app)
  auth/                     roles, staff profile table, demo users, cross-scope read privileges
  rooms/ housekeeping/ maintenance/ activity/   one table (and its ACLs) per feature
  api/                      the RoomRelay REST API and its access rule
  ui-pages/                 the UI Page that serves the frontend
src/server/                 server code (ServiceNow server modules)
  api/handlers.ts           GET /me, GET /snapshot, POST /commands, POST /demo/reset
  data/repository.ts        tables <-> Snapshot shape; writes back only what changed
  data/demoData.ts          Load demo data (administrator only)
  shared/                   session (who is calling), HTTP helpers, time conversion, table names
```

**One copy of every rule.** The server does not re-implement the rules: `src/server/api/handlers.ts` imports
`applyCommand`, `parseCommand` and `scopeSnapshotForRole` from `src/client/`. `now.config.json` turns those plain
TypeScript files (`client/shared/**`, `client/features/**/*.ts`, `client/app/applyCommand.ts`, `client/mock/mockData.ts`)
into server modules as well, and `src/server/tsconfig.json` type-checks them. So the rule files must stay free of React
and browser APIs; the browser-only ones are listed in `serverModulesExcludePatterns`.

```
Browser                                   ServiceNow
screen -> run(command)                    POST /commands
       -> serviceNowDataSource  -------->  handlers.ts: caller from the session, parseCommand(body)
                                           repository.loadSnapshot()
                                           applyCommand(...)        <- the same rule files the demo uses
                                           repository.saveChanges() + audit rows
       <- { ok } or { error }   <--------
```

## How a slice lines up with the ServiceNow backend

**The backend is ServiceNow** (decided 2026-11-06; a separate Spring Boot backend was considered and rejected because
the capstone depends on ServiceNow tables, roles, ACLs, business rules and sign-in). Each slice becomes a set of tables,
ACLs, business rules and one Scripted REST resource, named after the slice:

| Frontend slice | Backend module | Endpoints (see BACKEND_HANDOFF.md section 7) |
|---|---|---|
| `features/rooms` | rooms (the readiness rule lives here on the server too) | `GET /snapshot`, `POST /rooms/{n}/submit-inspection`, `POST /rooms/{n}/inspection` |
| `features/housekeeping` | housekeeping (tasks) | `POST /tasks/{id}/complete`, `/couldnt-complete`, `/reopen` |
| `features/maintenance` | maintenance (defects) | `POST /defects`, `/defects/{id}/triage`, `/start`, `/resolve` |
| `features/handoff` | handoff (AI call, server-side only) | `POST /handoff/briefings` |
| `features/access` | access (users, roles, requests) | `POST /access-requests/{id}/decision` |
| `features/activity` | audit | part of `GET /snapshot` |
| `features/auth` | session | `GET /me` |

The browser's checks only explain things to the user. **The backend must repeat every rule.**

## Adding a feature

1. Create `features/<name>/` with its screen, its logic file(s) and, if needed, `<name>.css`.
2. Put new shared types in `shared/domain/types.ts` and their labels in `shared/domain/labels.ts`.
3. If it changes data, add a `Command` in `shared/api/commands.ts`, a rule function in the feature, and a `case` in
   `mock/mockStore.ts`.
4. Add the route in `app/routes.ts` and the screen in `app/AppRoutes.tsx`. If it has a stylesheet, import it in
   `app/App.tsx` before `responsive.css`.
5. Add its logic files to `scripts/run-logic-tests.mjs` and tests to `tests/logic.test.cjs`.

## Why stylesheets are imported in App.tsx

Each feature keeps its CSS file in its own folder. They are all imported from `app/App.tsx` in a fixed order, because
the order changes which rule wins. `responsive.css` must load last so the phone and tablet layouts apply.
