# Glossary: every term in RoomRelay AI

One page, so everyone (team, instructor, backend teammate) uses the same words. The code uses the same terms:
`src/client/shared/domain/labels.ts` holds every label shown on screen.

## The one rule to remember

Only two things can stop a room from being Ready:

1. **An incomplete mandatory task.** The room is held back as Needs Cleaning or In Progress.
2. **A Blocking defect or a failed inspection.** The room is **Blocked**.

Everything else (task priority, Normal and Minor defects, optional tasks) only changes the **order** things are shown in.
A room becomes Ready only when a supervisor passes its inspection, and only if every rule is met.

## Terms

| Term | Belongs to | Values | Who sets it | What it does |
|---|---|---|---|---|
| **Mandatory** | Task | Yes / No | Task setup | Yes: the task must be Completed before the room can be Ready. No (optional): never holds the room back. |
| **Task state** | Task | Pending / Completed / Couldn't Complete | Housekeeper | Progress. Couldn't Complete never counts as done. |
| **Reason** | Task (Couldn't Complete) | Supplies missing / Needs maintenance / Other | Housekeeper | "Needs maintenance" also sends a report to the supervisor. "Other" needs a short note. |
| **Task priority** | Task | High / Normal / Low | Task setup | Order only. |
| **Room priority** | Room | The highest priority of its open tasks | Calculated | Order only (the Rooms page "Priorities" view). Not stored. |
| **Defect priority** | Defect | **Blocking** / Normal / Minor | Supervisor | Blocking makes the room Blocked. Normal and Minor never affect readiness. |
| **Defect state** | Defect | New / Assigned / In progress / Resolved | Supervisor, then the technician | New = waiting for a supervisor. Assigned = a technician owns it. |
| **Inspection** | Room | Not requested / Pending / Passed / Failed | Housekeeper requests, supervisor records | Passed is required for Ready. Failed makes the room Blocked until it is resubmitted. |
| **Room status** | Room | Needs Cleaning / In Progress / Pending Inspection / Blocked / Ready | **Calculated**, never by hand | See below. |
| **Triage** | Defect | | Supervisor | Assigning a technician and setting the priority of a New report. |
| **Audit log** | Everything | | Written by the system | Who did what, when. Read-only; nobody can edit or delete an entry. |

## Room status, step by step

| Status | When |
|---|---|
| Blocked | An unresolved Blocking defect, or the last inspection failed |
| Needs Cleaning | No mandatory task has been acted on yet |
| In Progress | At least one mandatory task is Completed or Couldn't Complete, but not all are Completed |
| Pending Inspection | All mandatory tasks Completed; inspection not passed yet |
| Ready | All mandatory tasks Completed, no open Blocking defect, inspection passed |

## Example: Room 102, start to finish

| Step | Who | What happens | Room 102 |
|---|---|---|---|
| 1 | | Shift starts, all tasks Pending | Needs Cleaning |
| 2 | Avery (housekeeper) | Completes "Strip and remake bed" | In Progress |
| 3 | Avery | Marks "Clean and sanitize bathroom" Couldn't Complete, reason Needs maintenance. A New, Normal report is created. | In Progress (Normal does not block) |
| 4 | Morgan (supervisor) | Triage: assigns Daniel, priority Blocking | Blocked |
| 5 | Daniel (technician) | Starts work, then records the repair. The report is Resolved; the bathroom task goes back to **Pending** with the repair note. | In Progress |
| 6 | Avery | Re-checks and completes the rest, submits for inspection | Pending Inspection |
| 7 | Morgan | Passes the inspection | **Ready** |

If Morgan fails the inspection at step 7 instead, the room is Blocked until Avery re-cleans and resubmits it.

## Words we no longer use

| Old | Now |
|---|---|
| Severity (Low, Medium, High, Critical) and a separate "blocks readiness" flag | One **defect priority**: Blocking, Normal, Minor |
| Readiness impact (column) | Removed: the priority says it |
| High-priority blockers | **Blocking defects** |
| To do / In progress / Done (tasks) | Pending / Completed / Couldn't Complete |
| Urgent (task priority) | Removed: High / Normal / Low |
| Supervisor review (on tasks) | Removed: the room inspection is the supervisor's check |
| Housekeeping page, Room Readiness page | One **Rooms** page with views |
