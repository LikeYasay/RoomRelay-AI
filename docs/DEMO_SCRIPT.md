# Capstone demo script

For the presentation (tentatively December 9 to 12, 2026). About 10 to 12 minutes plus questions. Update the "what is real"
box if the backend and AI get built before the presentation. Terms are explained in [GLOSSARY.md](GLOSSARY.md).

## Be clear about what is real

| Part | Say this |
|---|---|
| Screens, roles, validation, readiness rules, every action rule | Built and tested (26 automated tests, accessibility and contrast checks, responsive checks, full scenario walked through in the browser) |
| Where it runs | Built and **installed in our ServiceNow PDI** (`dev472716`), and also runnable locally with `npm run preview` as a backup. The PDI has the earlier version until the next install. |
| Data | **Synthetic** demo data (40 rooms, 9 fictional staff), **live in the browser tab**: changes are real on screen but not saved anywhere |
| Shift handoff briefing | A template stand-in today, **labeled "Simulated briefing (not AI)"**. Real AI is designed (see `AI_DESIGN.md`), not connected |
| ServiceNow tables, ACLs, business rules, REST | Designed in `BACKEND_HANDOFF.md`; being built by the backend teammate. The browser rule functions are the reference. |
| Security | Frontend controls verified; **server enforcement is the backend's job** and is not claimed yet |

Never say "the AI decides". Say "the AI only writes the summary; fixed rules decide readiness."

## Before you start

1. Run `npm run preview`, open http://127.0.0.1:4173/ full screen, and rehearse once.
2. **Reload the page right before presenting** (or use Prototype tools > Reset demo data) so the data starts clean.
   **Do not reload during the walkthrough**: a reload resets everything you changed.
3. Accounts (no passwords exist): **Avery Collins** (housekeeping, Room 102), **Morgan Ellis** (supervisor),
   **Daniel Brooks** (maintenance), **Riley Chen** (admin). Switch with **Sign out** (bottom-left), not a reload.
4. Starting numbers on the supervisor dashboard: 40 rooms, 16 Ready, 8 Needs Cleaning, 7 In Progress,
   4 Pending Inspection, 5 Blocked, 71 outstanding tasks (63 mandatory, 2 couldn't complete), 6 unresolved defects
   (1 awaiting triage), 3 Blocking defects.
5. Have a backup: screenshots of each step, in case the laptop or the PDI misbehaves.

## Walkthrough: one room, start to finish

| Time | Account | What you do | What you say |
|---|---|---|---|
| 0:00 | | Slide or voice: the problem | "Notes, tasks and repair reports live in different places, so blockers get missed at shift change." |
| 0:45 | | Sign-in page | "Only staff can use it. Four roles. In the live system ServiceNow handles the login; this prototype lets us pick a demo account." |
| 1:00 | Morgan | **Dashboard**: summary strip, rooms by status, Blocking defects, recent activity | "Every number comes from one dataset, so they always agree. Only two things stop a room: an unfinished mandatory task, or a Blocking defect or failed inspection." |
| 2:00 | Morgan | **Rooms**: switch the tabs Priorities, Cleaning and inspection, Board | "One page, three pre-built views of the same rooms." Point at Room 306: "Fully cleaned, but Blocked because its inspection failed." |
| 2:45 | Avery | Sign out, sign in as **Avery**. **Rooms > Priorities** | "A housekeeper sees only her own rooms, highest priority first." |
| 3:15 | Avery | Open **Room 102**. **Mark completed** on "Strip and remake bed" | Status changes to In Progress. "The room status is calculated. Nobody sets it by hand." |
| 3:45 | Avery | On "Clean and sanitize bathroom", **Couldn't complete...**, reason **Needs maintenance**, note "Bathroom tap is leaking." | "A task she can't finish never counts as done. Needs maintenance files a report for the supervisor." The room is still In Progress: "A new report is Normal until a supervisor decides." |
| 4:45 | Morgan | Sign in as **Morgan**. **Maintenance > New reports**, **Triage** the Room 102 report: Daniel Brooks, priority **Blocking** | "Only a supervisor sets the priority. Only Blocking stops a room." Open Room 102: **Blocked**. |
| 5:45 | Daniel | Sign in as **Daniel**. **My queue**, **Work on it**, **Start work**, then resolution notes and **Mark resolved** | "Technicians only see their own repairs. Notes are required." |
| 6:45 | Avery | Sign in as **Avery**, open Room 102 | The bathroom task is back to **Pending** with "Repair finished". "The repair doesn't complete the cleaning: Avery re-checks it." Complete the remaining tasks, then **Submit for inspection**. |
| 7:45 | Morgan | Sign in as **Morgan**, Room 102, **Pass inspection and confirm Ready** | "Only a supervisor, only when every rule is met. That is the only way a room becomes Ready." |
| 8:15 | Morgan | **Shift Handoff**: pick Morning, Generate | "This is the AI feature. Today it is a simulated briefing and it says so on screen. It lists blocked rooms, tasks that couldn't be completed and reports awaiting triage. It can never approve a room." Show Copy. |
| 9:00 | Riley | Sign in as **Riley**, **Audit Log**, search `102` | "Every step we just did is recorded: who, what, when. Nobody can edit or delete it." |
| 9:30 | Riley | **Users and Access** | "The admin approves account requests and sees the role-permission table. People can ask for a role, never give themselves one." |
| 10:00 | | Narrow the window | "It adapts to tablets and phones; tables turn into cards." |
| 10:30 | | Close | "Next: ServiceNow tables, ACLs and business rules that repeat every one of these rules on the server, then real AI." |

Optional extras if time allows: as Morgan, **Fail inspection** on Room 107 ("Blocked until it's re-cleaned and resubmitted");
as Avery, type `#/rooms/305` after the address ("Another person's room shows Room unavailable, the same as a room that
doesn't exist").

## Likely questions and honest answers

| Question | Answer |
|---|---|
| Is the AI real? | Not yet. The summary is a template stand-in, labeled as such. The design for the real call is in `AI_DESIGN.md`. |
| What stops the AI from marking a room Ready? | It cannot. Readiness comes only from fixed rules on task, defect and inspection data. We test this with hostile text in every field. |
| Is the data saved? | No. It lives in the browser tab so we can demo the flow. In the real system every change is a ServiceNow API call checked by the server. |
| Is it secure? | The frontend controls are tested. Real security is enforced by ServiceNow roles, ACLs and server-side checks, which are the backend phase. Until then we do not claim end-to-end security. |
| What if a task can't be done, like no supplies? | The housekeeper marks it Couldn't Complete with a reason. It still holds the room back; once supplies arrive, she or the supervisor sets it back to Pending. There is no "skip": if a task can be skipped, it should be optional. |
| Why doesn't the repair complete the task? | The technician fixes the problem; the housekeeper is responsible for the cleaning. "Completed" must mean the housekeeper did it, for the audit trail. |
| Why only three defect priorities? | Fewer words, one meaning: only Blocking stops a room. A supervisor can downgrade a Blocking defect, and that change is in the audit log. |
| Why no password on the login page? | ServiceNow handles sign-in. A password box in our own page would be fake and risky. |
| How does the AI avoid prompt injection? | Planned controls: data delimited as untrusted, free-text notes never sent, structured output validated, no actions from output, fallback on any failure. |
| Why ServiceNow? | Roles, ACLs, business rules, REST and audit are built in, so security and workflow come from the platform. |
| What would you do with more time? | Build the backend, connect the AI, run the security tests with real non-admin users, and test on real devices and screen readers. |
| What went wrong during the project? | Example: the keyboard test found that the skip link broke the router; it was fixed and retested. Early SDK sign-in with OAuth failed, so basic authentication was used. |
| Dependency vulnerabilities? | The production audit is clean. The 20 findings are in SDK build tools only; the suggested fix is a downgrade, so we documented it instead. |

## If something breaks

- White screen: press F5 (this resets the demo data). Still broken: restart `npm run preview`.
- Wrong data or odd state: Prototype tools > Reset demo data, then sign in again.
- Simulated error left on: open "Prototype tools" in the menu and set it to Normal.
- Always keep the screenshots handy.
