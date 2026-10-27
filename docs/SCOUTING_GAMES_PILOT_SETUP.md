# Scouting & Games pilot

This release adds a reversible program-wide workspace preference. Existing installations remain in Full program mode. Scouting & Games hides practice navigation and practice settings, uses a game-preparation checklist for Dashboard and Getting Started, opens Intelligence to games, and adds a GameDay link. Players, Staff and Settings remain available as appropriate for the signed-in staff member. This preference is presentation, not a replacement for staff authorization.

## Update your current CoachIQ

1. Merge this PR.
2. In the Apps Script project attached to your existing spreadsheet, replace these eight files with the GitHub versions: `SettingsService.gs`, `OnboardingService.gs`, `SystemHealthService.gs`, `Scripts.html`, `Settings.html`, `Onboarding.html`, `Sidebar.html`, `Styles.html`.
3. Save, close CoachIQ, and reopen it from the spreadsheet. If using its deployed web-app URL, publish a new version through Deploy → Manage deployments → Edit → New version → Deploy.
4. Your own app stays in Full program mode. To try the focused experience, open Settings → Workspace → Scouting & Games → Save workspace. Switch back at any time. Neither choice removes data.

No GameDay update is required by this PR. Its existing website continues to serve every tester, with local records kept on each device.

## Create the other team's clean workbook

1. In your updated CoachIQ, open Settings → Workspace → Create clean pilot workbook.
2. Open the returned workbook link. This creates a separate spreadsheet owned by the account running the action. It copies only header rows from the five core data sheets, creates empty Point Awards, and seeds fresh Settings in Scouting & Games mode. No players, staff accounts, scouting reports, games, source sharing permissions, film links, triggers or script properties are copied. Your original workbook is unchanged.
3. The new spreadsheet does **not** yet contain an Apps Script project with CoachIQ installed. Open Extensions → Apps Script in the **new** workbook. Add the current repository's root `.gs` and `.html` files with matching names, replacing any default Code.gs. Include the entire root Apps Script app; do not install only the eight update files and do not paste `offline-app`, tests or docs into Apps Script.
4. Save. Reload the new spreadsheet and use CoachIQ → Launch CoachIQ. Authorize the new project with the appropriate owner account. Its first launch binds that project's spreadsheet reference to this new workbook.
5. Complete onboarding with the tester's school, season, teams, sport and staff. Confirm Scouting & Games is selected. Generic practice defaults remain internal for compatibility; the focused experience does not require the tester to use Sessions.
6. Configure staff email access and share **only this pilot workbook/project** with the tester's Google account. Transfer ownership if appropriate and supported by the organizations involved. Do not share your production spreadsheet. Deploy any web-app copy separately with access restricted to the intended testers; avoid an anonymous deployment that runs with owner privileges.
7. Add their active roster with jersey numbers. Create their scouting report and matchup. Download their team-link and GameDay preparation files; move them to their iPad using Files/iCloud Drive or AirDrop and import them into GameDay.
8. Follow the in-app checklist, including offline preparation, airplane mode with Wi-Fi off, and closing/reopening the installed Home Screen app. Confirm both rosters, possessions and reports before using it for a real game.
9. After tracking, export the final locked result from their iPad and import it into **their pilot CoachIQ**, not yours. File transfer is manual; there is no cross-device automatic sync or per-coach sign-in in GameDay.

Use a dedicated iPad/browser profile for each tester where possible. Anyone using the same device/browser GameDay storage can see the games saved there. A different spreadsheet does not create a separate GameDay browser database on a shared device.

## Verification

Nine focused tests cover navigation, restoring Full program mode, retained staff restrictions, unchanged legacy defaults, preference validation, game handoff/offline guidance, header-only pilot creation, and rejecting invalid structure or missing administrator permissions before creating a workbook. Browser layout checks used the real stylesheet/sidebar and game-home markup at 1280, 768 and 390 pixels. Syntax checks pass. The root regression suite has 324 passing tests and one existing Python subprocess `spawnSync EPERM` failure in this sandbox. Actual Google authorization, workbook creation, sharing and the iPad offline test still require validation in the tester's accounts/devices.
