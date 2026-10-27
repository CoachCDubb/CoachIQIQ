# Recover from a blank CoachIQ dialog

A blank, styled dialog means the application has not reached visible startup content. The screenshot alone does not establish the underlying error. The complete PR #202 build opened in a browser fixture; actual installed Apps Script contents and account errors were not available for inspection.

This update makes initialization compatible with older Onboarding.html markup that lacks the new workspace selector. It also adds a loading/error monitor in Index.html, independent of Scripts.html, so a missing or invalid client bundle, failed bootstrap request, asynchronous exception or unresponsive request produces an actionable message. It preserves the actual bootstrap error. Successful startup hides the monitor; unrelated later page errors do not reopen it.

## Install

1. Merge this pull request.
2. In Extensions → Apps Script for the spreadsheet that will not open, replace **all contents** of `Index.html` with the updated `Index.html`, and **all contents** of `Scripts.html` with the updated `Scripts.html`. Keep the existing file names. Do not append the code or create a second Scripts file.
3. Save both files. Confirm all other PR #202 files were saved too if installing that release.
4. Close the blank dialog. Reload the spreadsheet and launch CoachIQ again from its menu.
5. For a deployed web-app URL, publish a new deployment version before reopening that URL. The spreadsheet menu dialog uses saved source directly.
6. If it still cannot open, copy the exact error shown in the new startup panel. For a timed-out request, also inspect the Apps Script Executions entry for `getCoachIQBootstrap`.

No spreadsheet data or GameDay storage changes are part of this update. Clearing browser data, recreating the spreadsheet, or deleting games is unnecessary.

## Validation

All 333 root tests pass when subprocess execution is allowed, including eight new startup tests. Syntax and diff checks pass. Browser fixtures assembled the real Index and all included files and verified Full program startup, Scouting & Games startup, older onboarding markup, invalid client code diagnostics and bootstrap server-error diagnostics. Google services were simulated in these browser fixtures; the actual installed project/account still needs the user-side reopen check.
