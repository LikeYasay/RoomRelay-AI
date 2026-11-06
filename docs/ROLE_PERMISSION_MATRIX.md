# Role-permission matrix

Who can see which page, which records, and which actions. This is the **design**. The prototype screens follow it
(and a test checks the menu against it), but the browser cannot enforce anything. **ServiceNow roles, ACLs and
server-side validation must enforce every row** (see [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md)).

A user should have exactly one of these four roles. Access is least privilege: anything not listed is denied.
Guests and anonymous visitors have no access at all.

## Roles

| Role | Who | Core job |
|---|---|---|
| Housekeeping Staff | Room attendants ("workers") | Clean assigned rooms, tick tasks, report defects, submit rooms for inspection |
| Maintenance Staff | Technicians ("workers") | Fix assigned defects and record the resolution |
| Housekeeping Supervisor | Floor or shift managers | See all rooms, inspect, confirm Ready, run shift handoffs |
| System Administrator | IT or app owner | Manage accounts, roles and access requests; view operations read-only |

## 1. Pages

"Own" means only the user's own rooms or assigned work. A page not listed for a role is **not shown in the menu**, and opening
its address shows "Access denied".

| Page | Housekeeping | Maintenance | Supervisor | Admin |
|---|---|---|---|---|
| Operations Dashboard | Own rooms | Rooms with defects assigned to them | All rooms | All (view only) |
| Room Readiness board and Room Details | Own rooms | No | All rooms | All (view only) |
| Housekeeping tasks | Own tasks | No | All | All (view only) |
| Maintenance and defects | Defects in own rooms | Assigned defects | All | All (view only) |
| Shift Handoff (AI briefing) | No | No | Yes | No |
| Users and Access | No | No | No | Yes |

Menu items per role (verified by an automated test):

- Housekeeping: Dashboard, Room Readiness, Housekeeping, Maintenance
- Maintenance: Dashboard, Maintenance
- Supervisor: Dashboard, Room Readiness, Housekeeping, Maintenance, Shift Handoff
- Admin: Dashboard, Room Readiness, Housekeeping, Maintenance, Users and Access

## 2. Actions

| Action | Housekeeping | Maintenance | Supervisor | Admin | Server must also check |
|---|---|---|---|---|---|
| View operations dashboard | Own | Own | Yes | View only | Row-level ACL |
| View room board and details | Own | No | Yes | View only | Row-level ACL, IDOR protection |
| View housekeeping tasks | Own | No | Yes | View only | Row-level ACL |
| View maintenance defects | Own rooms | Assigned | Yes | View only | Row-level ACL |
| Report a defect | Own rooms | No | Yes | No | Room is one the user may access; validation |
| Record a defect resolution | No | Assigned only | No | No | User is the assigned technician; notes required |
| Submit a room for inspection | Own rooms | No | No | No | All mandatory tasks done; no open blocking defect |
| **Confirm a room Ready** | No | No | **Yes** | No | **All three readiness rules; atomic; no duplicates** |
| Generate a shift handoff briefing | No | No | Yes | No | Data filtered to the caller; AI never decides readiness |
| Approve or decline access requests | No | No | No | Yes | Admin grants roles in ServiceNow; requester cannot self-grant |
| Manage accounts, roles, settings | No | No | No | Yes | Platform admin controls |

## 3. Records and fields (proposed ACLs)

Full table in [BACKEND_HANDOFF.md](BACKEND_HANDOFF.md) section 5. Key points:

- `readiness_status`, `ready_confirmed_by/at` and `inspection_*` on a room are written **only by server logic**, never directly by any role.
- A housekeeper can change only the `status` of tasks in their own rooms.
- A technician can change only `status` and `resolution_notes` on defects assigned to them.
- A defect's `blocking` and `severity` can be changed by a supervisor only.
- Access requests: the requester can never set `status` or a role.

## 4. Rules that apply to everyone

1. A room is never Ready while a mandatory task is open, an inspection is pending or failed, or a blocking defect is unresolved.
2. AI-generated text is informational. It cannot approve a room, change a permission or bypass a rule.
3. The browser never sends or is trusted with its own role.
4. Every change to readiness, defects and tasks is recorded (who, what, when).
5. Error messages never reveal other users' records or internal details. A record you may not see looks the same as one that does not exist.

## 5. How this was checked so far

| Check | Result |
|---|---|
| Menu for each role matches this matrix | Passed (automated test, `PERMISSIONS + NAV`) |
| A role's blocked page address shows "Access denied" | Passed (browser, supervisor opening `#/access`) |
| A housekeeper opening another housekeeper's room gets "Room unavailable" | Passed in the prototype (browser) |
| Server enforcement of any of the above | **Not built, not tested** |
