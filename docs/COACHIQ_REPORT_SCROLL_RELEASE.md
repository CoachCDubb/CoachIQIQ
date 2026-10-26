# CoachIQ report scrolling fix

The completed-game report could not scroll far enough to reach its final sections and buttons. The filled page-entry animation made `#page-content` a containing block for the fixed report overlay. On a long page, the overlay inherited the full page height rather than the visible iframe height.

The fix disables that animation while a report is open, bounds the report to the visible viewport, preserves touch scrolling, and adds bottom padding. Background content stays locked while the report is open. Print rules remain separate. This changes the original CoachIQ app, not the offline GameDay site or stored game data.

## Apply

1. Merge this PR into `main`.
2. Replace `Styles.html` and `SystemHealthService.gs` in the existing Apps Script project with the merged files. Save.
3. Close and reopen CoachIQ. If using its deployed web app, update the deployment to a new version first.
4. Open the completed practice game's report, expand its sections, and scroll down to the final buttons. Repeat in iPad portrait and landscape.

Build: `2026.10.26.10`.

## Verification

A browser fixture using the real CoachIQ stylesheet and a long report reproduced the footer below the viewport: its bottom was 1567px in a 640px-high window. After the fix, the footer was reachable at 581px. Checks passed at 1024×400, 1024×768, 768×1024 and 390×600 in both live-game and completed-report modes; the final button was visible and clickable in all eight cases. Print media retained unrestricted report height and visible overflow. Apps Script/browser syntax and diff checks passed. Physical Safari verification remains a user acceptance check.
