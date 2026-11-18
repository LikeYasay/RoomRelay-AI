# Capstone demo script

For the presentation (tentatively December 9 to 12, 2026). About 10 to 12 minutes plus questions. Terms are explained in
[GLOSSARY.md](GLOSSARY.md).

## Be clear about what is real

| Part | Say this |
|---|---|
| Screens, roles, readiness rules, every action rule | Built and tested: 35 automated tests, accessibility and contrast checks, the full scenario walked through in the browser |
| ServiceNow backend | **Built and running in our PDI** (`dev486421`): 5 tables, 4 roles, ACLs and a REST API. Verified for every role on 2026-11-07. |
| One copy of every rule | The server runs the same rule files as the browser, so they cannot disagree |
| Data | Fictional hotel data (40 rooms, 9 staff), stored in ServiceNow and reset with Data management > Restore initial data |
| Shift handoff briefing | Inside ServiceNow: written by an AI model (Groq) and labeled "AI briefing", with a labeled template fallback. Verified in the PDI on 2026-11-07. Before the demo, generate one briefing to make sure the key and the free quota still work. Local preview: always "Template briefing (no AI)" |
| Accounts | No self-registration: hotel staff only, created by the system administrator in ServiceNow |
| Security | Server enforcement is verified for the cases we tested (see "Likely questions"). Not claimed: concurrency, rate limiting, a full security review |

Never say "the AI decides". Say "the AI only writes the summary; fixed rules decide readiness."

## Before you start

1. **Main option: the PDI.** Wake the PDI if it is asleep, sign in as admin, and open
   `https://dev486421.service-now.com/x_2318724_roomrela_incident_manager.do`.
2. Open **Data management** (bottom-left) and press **Restore initial data**, so the data starts clean.
3. Practise switching people with **Impersonate User** (your name, top right). Have the four names ready:
   **Avery Collins** (housekeeping, Room 102), **Morgan Ellis** (supervisor), **Daniel Brooks** (maintenance),
   **Riley Chen** (admin). After switching, reload the app page.
4. **Backup: the local preview.** Run `npm run preview` and open http://127.0.0.1:4173/. It has a sign-in page with the staff accounts
   instead of impersonation (use **Sign out** to switch), and a reload resets its data.
5. Starting numbers on the dashboard: 40 rooms, 16 Ready, 8 Needs Cleaning, 7 In Progress, 4 Pending Inspection,
   5 Blocked, 71 outstanding tasks (63 mandatory, 2 couldn't complete), 6 unresolved defects (1 awaiting triage),
   3 Blocking defects.
6. Keep screenshots of each step in case the PDI or the network misbehaves.

## Walkthrough: one room, start to finish

"Switch to X" means Impersonate User (PDI) or Sign out and sign in (local preview).

| Time | Who | What you do | What you say |
|---|---|---|---|
| 0:00 | | Slide or voice: the problem | "Notes, tasks and repair reports live in different places, so blockers get missed at shift change." |
| 0:45 | Admin | The app inside ServiceNow | "It is a ServiceNow app: ServiceNow signs people in, and the server decides each person's role. There is no password in our code." |
| 1:00 | Morgan | **Dashboard**: summary strip, rooms by status, Blocking defects, recent activity | "Every number comes from the RoomRelay tables. Only two things stop a room: an unfinished mandatory task, or a Blocking defect or failed inspection." |
| 2:00 | Morgan | **Rooms**: switch the tabs Priorities, Cleaning and inspection, Board | "One page, three pre-built views." Point at Room 306: "Fully cleaned, but Blocked because its inspection failed." |
| 2:45 | Avery | Switch to **Avery**. **Rooms > Priorities** | "A housekeeper sees only her own 8 rooms. The server never even sends her the others." |
| 3:15 | Avery | Open **Room 102**. **Mark completed** on "Strip and remake bed" | Status changes to In Progress. "The room status is calculated, never set by hand." |
| 3:45 | Avery | On "Clean and sanitize bathroom", **Couldn't complete...**, reason **Needs maintenance**, note "Bathroom tap is leaking." | "A task she can't finish never counts as done. Needs maintenance files a report for the supervisor." Still In Progress: "A new report is Normal until a supervisor decides." |
| 4:45 | Morgan | Switch to **Morgan**. **Maintenance > New reports**, **Triage** the Room 102 report: Daniel Brooks, priority **Blocking** | "Only a supervisor sets the priority. Only Blocking stops a room." Open Room 102: **Blocked**. |
| 5:45 | Daniel | Switch to **Daniel**. **My queue**, **Work on it**, **Start work**, then resolution notes and **Mark resolved** | "Technicians only see their own repairs. Notes are required." |
| 6:45 | Avery | Switch to **Avery**, open Room 102 | The bathroom task is back to **Pending** with "Repair finished". "The repair doesn't complete the cleaning: Avery re-checks it." Complete the rest, then **Submit for inspection**. |
| 7:45 | Morgan | Switch to **Morgan**, Room 102, **Pass inspection and confirm Ready** | "Only a supervisor, only when every rule is met, and the server checks it again. That is the only way a room becomes Ready." |
| 8:15 | Morgan | **Shift Handoff**: pick Morning, Generate | "This is the AI feature. The server sends Groq only room numbers, statuses and titles, never names or notes. The AI writes the summary and suggested actions; the lists come from the rules. If the AI is down it says 'Fallback template'. It can never approve a room." Show Copy. |
| 9:00 | Riley | Switch to **Riley**, **Audit Log**, search `102` | "Every step we just did is recorded by the server: who, what, when. Nobody can edit or delete it." |
| 9:30 | Riley | **Users and Roles** | "Only hotel staff use this, so there is no sign-up. The administrator creates accounts and grants exactly one role in ServiceNow. This table shows what each role can do, and the server enforces it." |
| 10:00 | | Narrow the window | "It adapts to tablets and phones; tables turn into cards." |
| 10:30 | | Close | "Next: connecting the hotel's staff directory, and a version check for two people editing the same record at once." |

Optional extras: as Morgan, **Fail inspection** on Room 107 ("Blocked until it's re-cleaned and resubmitted"); as Avery,
add `#/rooms/305` to the address ("Room unavailable": the server never sent it).

## Likely questions and honest answers

| Question | Answer |
|---|---|
| Is the AI real? | Yes, inside ServiceNow (once the key is set): Groq's `openai/gpt-oss-120b`, called from the server with an encrypted key. The badge says whether AI or the template wrote it. |
| What does the AI see? | Room numbers, statuses, counts, task and defect titles and reason categories. No names, notes or descriptions. |
| What stops the AI from marking a room Ready? | It cannot. Readiness comes only from fixed rules on task, defect and inspection data, enforced on the server. We test this with hostile text in every field. |
| Is it really server-side? | Yes. The browser sends one small "command" (for example "complete task T-102-1"); the ServiceNow server checks who is calling, applies the rule and saves the change with an audit row. |
| Can a housekeeper cheat by calling the API directly? | We tried in the PDI: completing someone else's task (404), claiming to be a supervisor (400), setting a defect's priority (403), passing her own room (403), and reading the tables directly (403). All refused. |
| What about someone without a RoomRelay role? | ServiceNow refuses the request before our code runs (403), and the page says "No access to RoomRelay". |
| Is it secure? | For the cases we tested, yes, and they are listed in `TEST_PLAN.md`. Not yet covered: two requests at the same instant, rate limiting, and a full security review. |
| What if a task can't be done, like no supplies? | The housekeeper marks it Couldn't Complete with a reason. It still holds the room back; once supplies arrive, she or the supervisor sets it back to Pending. There is no "skip": if a task can be skipped, it should be optional. |
| Why doesn't the repair complete the task? | The technician fixes the problem; the housekeeper is responsible for the cleaning. "Completed" must mean the housekeeper did it, for the audit trail. |
| Why only three defect priorities? | Fewer words, one meaning: only Blocking stops a room. A supervisor can downgrade a Blocking defect, and that change is in the audit log. |
| Why no password on the login page? | ServiceNow handles sign-in. The demo users have no password at all; we test them with Impersonate User. |
| How does the AI avoid prompt injection? | Planned controls: data delimited as untrusted, free-text notes never sent, structured output validated, no actions from output, fallback on any failure. |
| Why ServiceNow? | Roles, ACLs, REST, sign-in and audit are built in, so security and workflow come from the platform. |
| What went wrong during the project? | Two real examples: the first install failed because ServiceNow finds server modules only by their exact file name (imports needed `.ts`); and the API's role check wasn't applied because each route kept a default ACL. Both were found in the PDI, fixed and retested. |
| Dependency vulnerabilities? | The production audit is clean. The 20 findings are in SDK build tools only; the suggested fix is a downgrade, so we documented it instead. |

## If something breaks

- "No access to RoomRelay": you may still be impersonating someone without a role; end impersonation.
- Empty dashboard: press **Restore initial data** (as admin).
- "Something went wrong": in ServiceNow, System Logs > All, filter on "RoomRelay API error".
- White screen: press F5. Still broken: switch to the local preview backup.
- Always keep the screenshots handy.
