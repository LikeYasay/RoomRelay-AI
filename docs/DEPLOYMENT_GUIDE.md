# Deployment guide: installing into the PDI and checking it

**Status (2026-11-06):** an earlier, frontend-only version was installed once into `dev486421` and rendered correctly
(`TEST_PLAN.md` section 4b). **The current version, with the ServiceNow backend, has been built locally but not
tested in the PDI yet.** It was **installed on 2026-11-06** (SDK exit code 0, "Installation completed", rollback link printed);
the first call failed (server module paths, fixed and reinstalled), and after the fix the checks in sections 3 to 5 passed
on 2026-11-07 (`TEST_PLAN.md` section 4b, P11 to P22, including a REST API ACL fix).

**Installing writes to the PDI.** The team lead decides when. Do not use a different instance, and never add `--reinstall`.

Keep these four things separate when you report progress. They are not the same:

1. Code finished on a laptop
2. Local build succeeded
3. Install into the PDI succeeded
4. Verified working inside the PDI

## What the install now creates

| Item | Details |
|---|---|
| UI Page | `x_2318724_roomrela_incident_manager.do` (unchanged endpoint) and its built JavaScript |
| 4 roles | `x_2318724_roomrela.housekeeper`, `.maintenance`, `.supervisor`, `.app_admin` |
| 5 tables | `x_2318724_roomrela_room`, `_task`, `_defect`, `_audit`, `_staff` |
| 7 ACLs | Read-only table access for the app admin; app admin can edit staff profiles; the REST API needs one of the four roles |
| REST API | `/api/x_2318724_roomrela/v1/roomrelay/` with `GET /me`, `GET /snapshot`, `POST /commands`, `POST /demo/reset`, `POST /handoff/briefing`, `GET /portal/overview` |
| Service Portal | `https://<instance>.service-now.com/roomrelay`: portal **RoomRelay AI**, page `roomrelay_home`, widgets **RoomRelay Readiness Overview**, **RoomRelay My Work**, **RoomRelay Report a Defect** and the Angular provider `roomRelayApi`. Signed-in RoomRelay staff only |
| Menu | **All > RoomRelay AI** with **Open RoomRelay** and **RoomRelay Portal** (every RoomRelay role) and **Staff Profiles** (RoomRelay administrator). New menus can need the menu's refresh button (circular arrow next to the filter) before they appear |
| REST Message | `RoomRelay Groq`: the outbound call to `https://api.groq.com/openai/v1/chat/completions` (no key inside; the key is added by server code from the property in section 3b) |
| Server modules | `src/server/**` plus the shared rule files from `src/client/` (listed in `now.config.json`) |
| 2 cross-scope privileges | Read `sys_user` and `sys_user_has_role` (names and role assignments) |
| **Demo users** | 9 users (avery.collins, morgan.ellis, daniel.brooks, riley.chen, ...) with **no password**, each with one RoomRelay role and a staff profile. Defined in `src/fluent/auth/demo-users.now.ts`. |

The tables start **empty**. Demo rooms, tasks and defects are loaded by the administrator after install (section 3).

## 1. Before you install

Run these in the VS Code terminal, in the project folder.

```bash
npm install
```
```bash
npm run build
```
```bash
npm run test:logic
```

All three should finish without errors (build: "Build completed successfully"; tests: "pass 35, fail 0").
Run the build from the project folder: if a terminal is sitting inside `dist/`, the build cannot replace that folder
and fails with "EBUSY". **Only install after a successful build**; an install of a half-built package is rejected.

Check which instance the SDK will use. This only lists saved logins and does not show passwords:

```bash
npx @servicenow/sdk auth --list
```

You should see alias `roomrelay-pdi`, host `https://dev486421.service-now.com`, type `basic`, default `Yes`. If not,
stop and ask the team lead. **Never type, paste or share a password in chat, screenshots or commits.**

Run `git status` so you know exactly what code is being installed. Commit first.

## 2. Install

```bash
npx @servicenow/sdk install --auth roomrelay-pdi
```

If it fails, copy the error text (not any secret) and see section 6.

## 3. First run: restore the initial data

1. Sign in to `https://dev486421.service-now.com` as your admin user.
2. Open `https://dev486421.service-now.com/x_2318724_roomrela_incident_manager.do`.
   There is no RoomRelay sign-in page: ServiceNow has already signed you in, and a platform admin is treated as the
   RoomRelay administrator.
3. The dashboard is empty. In the menu, open **Data management** (bottom-left) and press **Restore initial data**, then confirm.
4. The dashboard should show the same numbers as the local preview: 40 rooms, 16 Ready, 8 Needs Cleaning, 7 In Progress,
   4 Pending Inspection, 5 Blocked.

## 3b. Turn on the AI briefing (one time, by hand)

The app works without this step: the Shift Handoff screen then shows the template, labeled "Fallback template (not AI)".
To let the server call Groq:

**Get a free Groq API key**

1. Open `https://console.groq.com` and sign up (free, no credit card).
2. Go to **API Keys** and choose **Create API Key**. Name it `RoomRelay PDI`.
3. Copy the key. It is shown only once. **Do not paste it into chat, code, a commit, a document or a screenshot.**

**Store it in the PDI**

1. Sign in to the PDI as admin. In the application picker (globe icon, top right), choose **RoomRelay AI**, so the
   property is created inside the app's scope.
2. In the filter navigator type `sys_properties.list` and press Enter. Choose **New**.
3. Fill in:

   | Field | Value |
   |---|---|
   | Name | `x_2318724_roomrela.groq_api_key` |
   | Application | RoomRelay AI (filled in by step 1) |
   | Type | `password2` (stored encrypted, shown as dots) |
   | Value | paste the key here, and only here |
   | Private | ticked (keeps it out of update sets) |
   | Description | Groq API key for the RoomRelay shift briefing |

4. **Submit.** Switch the application picker back if you like.
5. Check: impersonate **Morgan Ellis**, open Shift Handoff and choose **Generate briefing**. Expect the badge
   "AI briefing" and a note naming the model. If you see "Fallback template (not AI)", the reason is shown next to it;
   see section 6.

To turn the AI off again, clear the property's value. To replace a leaked key, delete it in the Groq console, create a
new one and paste it into the same property.

## 4. Test each role with Impersonate User

The demo users have no password, so nobody can sign in as them directly. As admin:

1. Click your name or avatar (top right of ServiceNow) and choose **Impersonate User**.
2. Pick **Avery Collins**, then open the UI Page address again.
3. Avery should see 3 menu items and only her 8 rooms. Run the Room 102 scenario from `DEMO_SCRIPT.md`, switching to
   Morgan Ellis, Daniel Brooks and back the same way.
4. End impersonation from the same menu.

## 5. Check list (write the result next to each)

| # | Check | How | Result |
|---|---|---|---|
| 1 | Page is not blank | Something visible within a few seconds | |
| 2 | Look and font | Same navy sidebar, Source Sans 3 text, no overlapping elements | |
| 3 | Signed-in user | Header shows your name and role, no demo sign-in page | |
| 4 | Restore initial data | Section 3 | |
| 5 | Roles | Section 4, for Avery, Daniel, Morgan and Riley: menu and visible rooms match `ROLE_PERMISSION_MATRIX.md` | |
| 6 | Changes are saved | Complete a task as Avery, reload the page: it is still Completed; the Audit Log (as admin) shows it | |
| 7 | The server sends only what a role may see | As Avery, open Room 305 by address: "Room unavailable" (the server never sent it). In F12 > Network, the `snapshot` response contains only her 8 rooms | |
| 8 | Menu and routes | Click every menu item; browser Back and Forward | |
| 9 | Console errors | F12, Console, reload; note any red errors | |
| 10 | CSP or font problems | Console messages about "Content Security Policy" or fonts | |
| 11 | CSRF token present | In the Console type `typeof window.g_ck`: expect `"string"`. **Do not type or paste the token itself anywhere.** | |
| 12 | Signed-out access | Open the page address in a private window with no ServiceNow login: expect the ServiceNow login | |
| 13 | User without a role | Impersonate a PDI user with no RoomRelay role and open the page: "No access to RoomRelay" | |
| 14 | Direct table access is closed | As Avery, open `x_2318724_roomrela_room.list`: no records (only the app admin can read the tables directly) | |
| 15 | AI briefing | Section 3b step 5: badge "AI briefing"; the room lists match the Rooms page; the Audit Log (as admin) shows "written by AI" | |
| 16 | AI fallback | Before the key is set (or with its value cleared): badge "Fallback template (not AI)" with the reason | |

Then run the backend and security tests in `TEST_PLAN.md` section 5 and record the results.

## 5b. Moving to a new instance

The first PDI (dev472716) was reclaimed by ServiceNow on 2026-11-17 after 10 days without use. The app now runs on
**dev486421**. To move again:

1. **Keep the instance alive.** A PDI is reclaimed after about 10 days without activity *in the instance* (signing in to
   developer.servicenow.com does not count). Open the app at least every few days, and always the day before a demo.
2. **Scope prefix must match the instance.** The scope `x_<number>_roomrela` must use the instance's company code
   (`glide.appcreator.company.code`, read-only on a PDI). Otherwise the install fails with "Unable to install third party
   application". If it differs, replace the prefix in every file (it was changed from `x_2305075` to `x_2318724` on
   2026-11-18), then build and test.
3. **Save the install login:** `npx @servicenow/sdk auth --add https://<instance>.service-now.com --type basic --alias roomrelay-pdi`.
4. **Install twice on a brand-new instance.** The first install creates the roles; the staff role assignments are only
   created by the second install (on dev486421 the first install left all 9 staff without a role).
5. **By hand:** create the Groq key property again (section 3b), restore the initial data (section 3), and set staff
   passwords if needed.

## 6. If something goes wrong

| Symptom | What to try |
|---|---|
| Install says not authorized or cannot connect | The PDI may be asleep, or the saved login is wrong. Ask the team lead; never share the password. |
| Install error about the application or scope | Stop. Do not create a new application. Share the error text with the team lead. |
| "No access to RoomRelay" for admin | Check the admin user has the `admin` role, or give it `x_2318724_roomrela.app_admin` |
| "Something went wrong" on every page | System Logs > All, filter on "RoomRelay API error"; the message says what failed |
| A REST call answers 500 "No module with path ..." | An import between server-module files is missing its `.ts` extension (see `ARCHITECTURE.md`); add it, rebuild and reinstall |
| Users without a RoomRelay role get past the API | Check every route in `src/fluent/api/roomrelay-api.now.ts` has `enforceAcl: [apiAccess]` |
| Restore initial data says staff accounts are missing | Check `x_2318724_roomrela_staff.list` has 9 rows with initial data keys h1 to a1 |
| Requests fail with 401 | `typeof window.g_ck` is not `"string"`: the page did not get a session token; record this in `BACKEND_HANDOFF.md` section 12 |
| Blank page | F12, Console tab for red errors; Network tab for a failed request to `.../uxasset/externals/x_2318724_roomrela/main.jsdbx` |
| Briefing says "the AI is not set up on this instance yet" | The property is missing, empty, or was created in the wrong application scope (section 3b step 1) |
| Briefing says "the AI key was rejected" | The key was mistyped or deleted in the Groq console; create a new one |
| Briefing says "the free AI quota is used up for now" | Groq's free limit was reached; wait and try again (the fallback still works) |
| Briefing says "the AI service could not be reached in time" | The PDI could not reach `api.groq.com` within 15 seconds. System Logs > All, filter on "RoomRelay AI" |
| "Too many briefings in a short time" | The limit is 5 per supervisor in 10 minutes; wait a few minutes |
| Works locally but not here | Record the difference in this document and in `BACKEND_HANDOFF.md` section 12 |

## 7. Going back

Installing is not destructive, but a bad build can be replaced. Check out the last good commit yourself with Git, run the
build, and install again with the same command. Do not use `--reinstall`, delete the application, or edit records by hand
without asking the team lead. Before any real use, delete `src/fluent/auth/demo-users.now.ts` and reinstall so the demo
users are removed.
