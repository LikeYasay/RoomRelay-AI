# Deployment guide: installing into the PDI and checking it

**Status: this has not been done yet.** Everything so far was tested locally. Installing is the first time the app runs
inside real ServiceNow, and it can reveal problems the local preview cannot.

**Installing writes to the PDI.** The team lead decides when. Do not use a different instance, and never add `--reinstall`.

Keep these four things separate when you report progress. They are not the same:

1. Code finished on a laptop
2. Local build succeeded
3. Install into the PDI succeeded
4. Verified working inside the PDI

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

All three should finish without errors (build: "Build completed successfully"; tests: "pass 17, fail 0").

Check which instance the SDK will use. This only lists saved logins and does not show passwords:

```bash
npx @servicenow/sdk auth --list
```

You should see alias `roomrelay-pdi`, host `https://dev472716.service-now.com`, type `basic`, default `Yes`. If not,
stop and ask the team lead. **Never type, paste or share a password in chat, screenshots or commits.**

Also confirm in `now.config.json` that the scope is `x_2305075_roomrela`, and run `git status` so you know exactly what
code is being installed. Commit or note any uncommitted change first.

## 2. Install

```bash
npx @servicenow/sdk install --auth roomrelay-pdi
```

(`npm run deploy` is the same command without naming the login, so it uses the default one.)

What this changes: it creates or updates the application's files in the PDI, which today means the UI Page
`x_2305075_roomrela_incident_manager.do` and its built JavaScript. It does **not** create tables, roles or ACLs yet.

If it fails, copy the error text (not any secret) and see section 5.

## 3. Open it and look

1. If your PDI has been unused for a while it may be asleep. Wake it from your ServiceNow Developer account and wait a
   few minutes. (PDIs usually hibernate when unused; confirm in your account.)
2. Sign in to `https://dev472716.service-now.com` the normal way.
3. In the same browser, open:

   `https://dev472716.service-now.com/x_2305075_roomrela_incident_manager.do`

4. **Expected today:** the page loads and shows the app's *prototype* sign-in page (a list of demo accounts). That is
   correct for now: the live version will rely on ServiceNow's own login (see `BACKEND_HANDOFF.md` section 8).
5. Choose "Morgan Ellis" and sign in.

## 4. Check list (write the result next to each)

| # | Check | How | Result |
|---|---|---|---|
| 1 | Page is not blank | Something visible within a few seconds | |
| 2 | Look and font | Same navy sidebar, Source Sans 3 text, no overlapping elements | |
| 3 | Menu and routes | Click all five menu items; use browser Back and Forward | |
| 4 | Room details by address | Open `.../x_2305075_roomrela_incident_manager.do#/rooms/305` directly | |
| 5 | Refresh keeps you signed in | Press F5 on the dashboard | |
| 6 | Sign out and back in | Bottom-left Sign out | |
| 7 | Dialogs | Open "Report a defect" and press Escape | |
| 8 | Narrow window | Make the window narrow, or press F12 and use the device toolbar | |
| 9 | Console errors | Press F12, open Console, reload; note any red errors | |
| 10 | CSP or font problems | Console messages that mention "Content Security Policy" or fonts | |
| 11 | CSRF token present | In the Console type `typeof window.g_ck` and press Enter: it should say `"string"`. **Do not type or paste the token itself anywhere.** | |
| 12 | Signed-out access | Open the page address in a private window with no ServiceNow login | |

Check 12 matters for security: expected is a redirect to ServiceNow's login. If the app shows without any login, the UI
Page is public and must be restricted before anything real is added.

Rerun a few items from `TEST_PLAN.md` section 3 (F7, F10, F13, F19) and record the results in `TEST_PLAN.md` section 4, row R6.

## 5. If something goes wrong

| Symptom | What to try |
|---|---|
| Install says not authorized or cannot connect | The PDI may be asleep, or the saved login is wrong. Ask the team lead; never share the password. |
| Install error about the application or scope | Stop. Do not create a new application. Share the error text with the team lead. |
| Blank page | F12, Console tab for red errors; Network tab for a failed request to `.../uxasset/externals/x_2305075_roomrela/main.jsdbx` |
| Page not found (404) | Type `sys_ui_page.list` in the filter box at the top-left of ServiceNow and check the page record and its endpoint exist and are active |
| Looks unstyled | Check the Console for Content Security Policy messages |
| Works locally but not here | Record the difference in this document and in `BACKEND_HANDOFF.md` section 12 |

## 6. Going back

Installing is not destructive, but a bad build can be replaced. Check out the last good commit yourself with Git, run the
build, and install again with the same command. Do not use `--reinstall`, delete the application, or edit records by hand
without asking the team lead.

## 7. After the backend exists

Repeat sections 1 to 4, then run the backend and security tests in `TEST_PLAN.md` section 5 with non-admin users.
