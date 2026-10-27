# CoachIQ web-app startup and roster access

Bootstrap reads getCoachIQSettings → getPointAwards. The reward reader used SpreadsheetApp.getActive(), which can be null outside the spreadsheet dialog, causing the web entry to fail even though the menu dialog works. Reward, settings-write and player-service operations now use the existing getCoachIQSpreadsheet_ resolver, preserving the bound workbook or saved program workbook ID. The resolver still refuses to guess when there is no binding. Staff checks remain in place.

App.gs also supplies the mobile viewport through HtmlOutput.addMetaTag, the supported Apps Script path; viewport tags inside the HTML source alone can be ignored by HtmlService.

## Install and deploy

1. Merge this PR and update App.gs, SettingsService.gs, RewardService.gs and PlayerService.gs in the Apps Script project attached to the relevant program workbook. Program copies have independent Apps Script projects: update the one whose web-app link you are using.
2. Save. Open CoachIQ once through the spreadsheet menu to establish that project's workbook binding.
3. In Apps Script, Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.
4. Retain execution as the user accessing the app. The accessing Google account needs permission to the program workbook and must authorize the app. Do not switch to anonymous owner-executed access as a sign-in workaround.
5. Open the deployment Web app URL ending in /exec directly in Safari or Chrome on the phone. Use the Google account authorized for that program. A /dev test URL is restricted to project editors and is not the production handoff URL.
6. Verify startup, roster and scouting/game setup. If it still fails, capture its exact startup or Google error. A stale deployment, wrong account, organizational policy or in-app browser can also cause failures; the user's exact phone symptom was not yet available when this fix was prepared.

All 338 root tests pass, including web bootstrap with getActive() returning null, web roster reads, writes to the resolved program workbook and rejection of an unbound project. Syntax and diff checks pass. This does not certify every CoachIQ module on a physical phone or change the separate GameDay app.
