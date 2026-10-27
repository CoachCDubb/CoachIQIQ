# Scouting & Games pilot

This release adds a reversible program-wide workspace preference. Existing installations remain in Full program mode. Scouting & Games hides practice navigation and practice settings, uses a game-preparation checklist for Dashboard and Getting Started, opens Intelligence to games, and adds a GameDay link. Players, Staff and Settings remain available as appropriate for the signed-in staff member. This preference is presentation, not a replacement for staff authorization.

## Update your current CoachIQ

1. Merge this PR.
2. In the Apps Script project attached to your existing spreadsheet, replace these eight files with the GitHub versions: `SettingsService.gs`, `OnboardingService.gs`, `SystemHealthService.gs`, `Scripts.html`, `Settings.html`, `Onboarding.html`, `Sidebar.html`, `Styles.html`.
3. Save, close CoachIQ, and reopen it from the spreadsheet. If using its deployed web-app URL, publish a new version through Deploy → Manage deployments → Edit → New version → Deploy.
4. Your own app stays in Full program mode. To try the focused experience, open Settings → Workspace → Scouting & Games → Save workspace. Switch back at any time. Neither choice removes data.

No GameDay update is required by this PR. Its existing website continues to serve every tester, with local records kept on each device.

## Prepare another program

Use a clean CoachIQ template with its bound Apps Script project already attached. Make a full workbook copy for each program, authorize that program's Google account, complete onboarding in Scouting & Games mode, configure staff access, and add its roster. Workbook copying carries its bound code; the new owner still needs first-time authorization.

The old Settings → Create clean pilot workbook button and its server endpoint have been retired. That workflow created a header-only spreadsheet without installing the app. Existing blank workbooks are not modified or deleted by this change.

Before using a template for another program, verify it is a clean master: no players, staff email profiles, scouting reports, games, film references or operational notes. Do not distribute a populated production workbook. Keep the master blank and create a separate copy for each program. Do not use a copy already filled out for one team as the next team's template.

Each program imports its own preparation file into GameDay and returns its locked result to its own CoachIQ workbook. Transfers are manual. A shared iPad/browser shares the locally saved GameDay records.

## Removing the retired workflow from an installed app

After merging this cleanup, replace Settings.html, Scripts.html and SettingsService.gs in that Apps Script project, save, close and reopen CoachIQ. Redeploy only for a web-app URL. The Scouting & Games workspace setting remains. Existing program copies, data, staff permissions and GameDay storage are unchanged. Installed program copies have independent code and do not update automatically from GitHub.
