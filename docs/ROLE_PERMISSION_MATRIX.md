# Role-permission matrix

Who can see which page, which records, and which actions. This is the **design**. The prototype screens and its rule
functions follow it (and automated tests check the menu, the permission table and every action rule), but the browser
cannot enforce anything. **ServiceNow roles, ACLs and server-side validation must enforce every row** (see
[BACKEND_HANDOFF.md](BACKEND_HANDOFF.md)). Terms are defined in [GLOSSARY.md](GLOSSARY.md).

A user should have exactly one of these four roles. Access is least privilege: anything not listed is denied.
Guests and anonymous visitors have no access at all.

## Roles

| Role | Who | Core job |
|---|---|---|
| Housekeeping Staff | Room attendants ("workers") | Work through the checklist of assigned rooms (Completed, or Couldn't Complete with a reason), report defects, submit rooms for inspection |
| Maintenance Staff | Technicians ("workers") | Work through the repairs assigned to them and record each resolution |
| Housekeeping Supervisor | Floor or shift managers | Triage defect reports, inspect rooms and confirm them Ready, run shift handoffs |
| System Administrator | IT or app owner | Manage accounts, roles and access requests; review the audit log; view operations read-only |

## 1. Pages

"Own" means only the user's own rooms or assigned work. A page not listed for a role is **not shown in the menu**, and opening
its address shows "Access denied".

| Page | Housekeeping | Maintenance | Supervisor | Admin |
|---|---|---|---|---|
| Operations Dashboard | Own rooms | Rooms with defects assigned to them | All rooms | All (view only) |
| Rooms (views: Priorities, Cleaning and inspection, Board) and Room Details with the checklist | Own rooms | No | All rooms | All (view only) |
| Maintenance and defects (role-based views, defect details modal) | Defects in own rooms | Assigned defects | All | All (view only) |
| Shift Handoff (AI briefing) | No | No | Yes | No |
| Users and Access | No | No | No | Yes |
| Audit Log | No | No | No | Yes (read only) |

Menu items per role (verified by an automated test):

- Housekeeping: Dashboard, Rooms, Maintenance
- Maintenance: Dashboard, Maintenance
- Supervisor: Dashboard, Rooms, Maintenance, Shift Handoff
- Admin: Dashboard, Rooms, Maintenance, Users and Access, Audit Log

The old `#/housekeeping` address opens Rooms.

Maintenance page views per role: Supervisor: **New reports**, All open, Resolved. Technician: **My queue**, In progress,
Resolved. Housekeeper: Open, Resolved. Admin: All open, New reports, Resolved.

## 2. Actions

| Action | Housekeeping | Maintenance | Supervisor | Admin | Server must also check |
|---|---|---|---|---|---|
| View operations dashboard | Own | Own | Yes | View only | Row-level ACL |
| View rooms, details and checklists | Own | No | Yes | View only | Row-level ACL, IDOR protection |
| Complete a task | Own | No | No | No | Task is Pending and belongs to the caller |
| Mark a task Couldn't Complete (with a reason) | Own | No | No | No | Task is Pending; reason valid; note required for "Other"; room not awaiting inspection |
| Set a Couldn't Complete task back to Pending | Own | No | Yes | No | Not while its maintenance report is unresolved |
| View maintenance defects | Own rooms | Assigned | Yes | View only | Row-level ACL |
| Report a defect | Own rooms (starts New, Normal) | No | Yes (may set priority and technician) | No | Room is one the user may access; validation; housekeepers cannot set priority or technician |
| Triage a defect (assign technician, set priority) | No | No | **Yes** | No | Technician holds the maintenance role; defect not resolved |
| Start a repair, record the resolution | No | Assigned only | No | No | Caller is the assigned technician; notes required; source task goes back to Pending |
| Submit a room for inspection | Own rooms | No | No | No | All mandatory tasks Completed; no open Blocking defect; not already pending |
| **Pass or fail an inspection** (pass = Ready) | No | No | **Yes** | No | **Pass only when all three readiness rules hold; atomic; no duplicates** |
| Generate a shift handoff briefing | No | No | Yes | No | Data filtered to the caller; AI never decides readiness; generation is audited |
| Approve or decline access requests | No | No | No | Yes | Admin grants roles in ServiceNow; requester cannot self-grant |
| Manage accounts, roles, settings | No | No | No | Yes | Platform admin controls |
| View the audit log | No | No | No | View only | Nobody can edit or delete entries |

## 3. Records and fields (proposed ACLs)

Full table in [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md) section 5. Key points:

- `readiness_status` and `inspection_*` on a room are written **only by server logic**, never directly by any role.
- A housekeeper can change only the state (and reason) of tasks in their own rooms, through the task actions.
- A technician can change only `status` and `resolution_notes` on defects assigned to them.
- A defect's `priority` and `technician` can be changed by a supervisor only.
- Access requests: the requester can never set `status` or a role.
- Audit entries are written by the server only and can never be updated or deleted.

## 4. Rules that apply to everyone

1. A room is never Ready while a mandatory task is not Completed, an inspection is not passed, or a Blocking defect is unresolved.
2. AI-generated text is informational. It cannot approve a room, change a permission or bypass a rule.
3. The browser never sends or is trusted with its own role. Commands never carry the actor.
4. Every change to readiness, defects and tasks is recorded (who, what, when) in the audit log.
5. Error messages never reveal other users' records or internal details. A record you may not see looks the same as one that does not exist.
6. There is no waiver: a mandatory task cannot be skipped. If it can sometimes be skipped, make it optional instead.

## 5. How this was checked so far

| Check | Result |
|---|---|
| Menu for each role matches this matrix | Passed (automated test, `PERMISSIONS + NAV`) |
| Every action rule refuses the wrong role and the wrong owner | Passed (automated tests `COMMANDS` and `FLOW`), in the browser-side rule functions |
| "Not yours" gives the same answer as "does not exist" | Passed (automated test, task and defect rules) |
| A role's blocked page address shows "Access denied" | Passed (browser) |
| A housekeeper opening another housekeeper's room gets "Room unavailable" | Passed in the prototype (browser) |
| Server enforcement of any of the above | **Not built, not tested** |
