# Dashboard layout in compact CoachIQ windows

The compact app shell previously required `(pointer:coarse)` and a narrow width range. An iPad with a trackpad, a mouse-driven browser, or a short Sheets dialog could keep the large desktop sidebar/header, leaving little room for dashboard content.

Compact navigation now responds to the available viewport (width up to 1100px or height up to 640px) independently of input type. Navigation sits in a horizontally scrollable top row, content uses the full width and its own vertical scroll area, the greeting/focus areas are smaller, and dashboard cards keep readable text sizes. Larger desktop windows retain the sidebar. Live tracking and film fullscreen layouts are excluded. Report background scroll locking is preserved.

## Apply

1. Merge this release PR into `main`.
2. Replace `Styles.html` and `SystemHealthService.gs` in the existing Apps Script project. Save.
3. For the Sheets dialog shown in the screenshot: close the CoachIQ window using its X and reopen it from the spreadsheet CoachIQ menu.
4. For a deployed Apps Script web app: update the existing deployment to a new version and reopen the link.
5. Confirm compact windows show navigation across the top and scroll the dashboard to its bottom. Swipe the navigation row horizontally to reach remaining pages.

Build `2026.10.26.12`. No sheet/data migration. The separately hosted GameDay app is unchanged.

## Verification

Actual Sidebar/Header/Dashboard markup and Styles were checked in Chromium at 768×414, 1024×550, 1100×760, 1280×600 and 390×600, with both touch and mouse-like input. All ten cases had a 60px navigation row, full-width content, no horizontal page overflow, and a reachable final dashboard element. The 1600×900 desktop sidebar stayed intact. The report-scrolling fixture passed all eight prior viewport/mode combinations and print remained unclipped. Syntax/diff checks passed. Physical iPad Safari and the deployed Google Sheets iframe still require user acceptance checks.
