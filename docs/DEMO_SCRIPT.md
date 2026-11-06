# Capstone demo script

For the presentation (tentatively December 9 to 12, 2026). About 8 to 10 minutes plus questions. Update the "what is real"
box if the backend and AI get built before the presentation.

## Be clear about what is real

| Part | Say this |
|---|---|
| Screens, roles, validation, readiness rules | Built and tested (17 automated tests, accessibility audit, responsive checks) |
| Data | **Synthetic** demo data: 40 rooms, 9 fictional staff |
| Shift handoff briefing | A template stand-in today, **labeled "Simulated briefing (not AI)"**. Real AI is designed (see `AI_DESIGN.md`), not connected |
| ServiceNow tables, ACLs, business rules, REST | Designed in `BACKEND_HANDOFF.md`; being built by the backend teammate |
| Security | Frontend controls verified; **server enforcement is the backend's job** and is not claimed yet |

Never say "the AI decides". Say "the AI only writes the summary; fixed rules decide readiness."

## Before you start

1. Run `npm run preview`, open http://127.0.0.1:4173/ full screen, and rehearse once.
2. Have these demo accounts in mind (no passwords exist): **Morgan Ellis** (supervisor), **Avery Collins** (housekeeping),
   **Daniel Brooks** (maintenance), **Riley Chen** (admin).
3. Numbers on the supervisor dashboard (these never change): 40 rooms, 16 Ready, 9 Needs Cleaning, 6 In Progress,
   4 Pending Inspection, 5 Blocked, 72 open tasks (64 mandatory), 4 unresolved defects (3 blocking), 3 high-priority blockers.
4. Have a backup: screenshots of each step, in case the laptop or the PDI misbehaves.

## Walkthrough

| Time | What you do | What you say |
|---|---|---|
| 0:00 | Slide or voice: the problem | "Notes, tasks and repair reports live in different places, so blockers get missed at shift change." |
| 1:00 | Open the sign-in page | "Only authorized staff can use it. Four roles. In the live system ServiceNow handles the login; this prototype lets us pick a demo account." |
| 1:30 | Sign in as **Morgan Ellis** | "The supervisor sees every room." |
| 2:00 | **Dashboard**: point at the summary strip, "Rooms by status", floor bars, blockers, shift readiness | "All of these numbers come from one dataset, so they always agree." Change the floor filter. |
| 3:00 | **Room Readiness**: filter Status = Blocked | "Cleaning progress and readiness are separate: Room 306 is fully cleaned but Blocked because its inspection failed." |
| 3:45 | Open **Room 305** | Read the message: "Room 305 cannot be marked Ready because 2 mandatory tasks remain incomplete..." Point at the disabled button and its reason: "We never show an action that cannot work." |
| 4:30 | Open **Room 107**, click "Pass inspection and confirm Ready" | "Only a supervisor, only when every rule is met. It is a simulation here, and the server will re-check it." Press Escape. |
| 5:00 | **Maintenance**, "Report a defect", submit empty, then type `<b>test</b>` as a title | "Validation tells you exactly what is wrong. Anything typed is shown as plain text, never run." |
| 6:00 | **Shift Handoff**: pick Morning, Generate | "This is the AI feature. Today it is a simulated briefing and it says so on screen. The design sends only authorized, minimized data from the server to an AI provider, and falls back to a plain template if the AI fails." Show Copy. |
| 7:00 | "Demo: make generation fail" then Generate | "Failure is handled and labeled." |
| 7:30 | **Sign out** (bottom-left). Sign in as **Avery Collins** | "A housekeeper sees four pages and only their own rooms." |
| 8:15 | Type `#/rooms/305` after the page address and press Enter | "Another person's room shows 'Room unavailable', the same as a room that doesn't exist, so it cannot be probed." |
| 8:45 | Sign in as **Riley Chen**, open **Users and Access** | "The admin approves account requests and sees the role-permission table. People can ask for a role, never give themselves one." |
| 9:30 | Narrow the window | "It adapts to tablets and phones; tables turn into cards." |
| 10:00 | Close | "Next: ServiceNow tables, ACLs and business rules, then real AI." |

## Likely questions and honest answers

| Question | Answer |
|---|---|
| Is the AI real? | Not yet. The summary is a template stand-in, labeled as such. The design for the real call is in `AI_DESIGN.md`. |
| What stops the AI from marking a room Ready? | It cannot. Readiness comes only from fixed rules on task, defect and inspection data. We test this with hostile text in every field. |
| Is it secure? | The frontend controls are tested. Real security is enforced by ServiceNow roles, ACLs and server-side checks, which are the backend phase. Until then we do not claim end-to-end security. |
| Why no password on the login page? | ServiceNow handles sign-in. A password box in our own page would be fake and risky. |
| How does the AI avoid prompt injection? | Planned controls: data delimited as untrusted, structured output validated, no actions from output, fallback on any failure. |
| Why ServiceNow? | Roles, ACLs, business rules, REST and audit are built in, so security and workflow come from the platform. |
| What would you do with more time? | Build the backend, connect the AI, run the security tests with real non-admin users, and test on real devices and screen readers. |
| What went wrong during the project? | Example to mention: the keyboard test found that the skip link broke the router; it was fixed and retested. Early SDK sign-in with OAuth failed, so basic authentication was used. |
| Dependency vulnerabilities? | The production audit is clean. The 20 findings are in SDK build tools only; the suggested fix is a downgrade, so we documented it instead. |

## If something breaks

- White screen: press F5. Still broken: restart `npm run preview`.
- Wrong data or odd state: sign out and back in.
- Simulated error left on: open "Prototype tools" in the menu and set it to Normal.
- Always keep the screenshots handy.
