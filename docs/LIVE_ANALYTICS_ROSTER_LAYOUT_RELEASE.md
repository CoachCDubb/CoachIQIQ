# Possession roster access and Live Game layout

CoachIQ already saves and returns the selected roster independently of game-plan objectives. However, its possession player selectors were hidden inside Detailed plays, and the setup text incorrectly said players were only attached to objectives.

The possession tracker now shows Our player, Opponent player, manual jersey, and Clear player credit above its focus tags. Detailed play buttons remain collapsed until requested. Closing Detailed plays no longer disables the visible selected player. Leave both player selectors and the manual jersey blank for team-only events. Choose the appropriate player before each credited play; changing a selection does not retroactively change saved plays.

On offense, our player receives shot/paint/rebound credit and the opponent receives deflection credit. On defense, the opponent receives shot/paint/rebound credit and our player receives deflection credit. A numbered roster selection takes priority over the manual jersey. Clear player credit resets all three inputs for future events.

Roster dropdowns accept trimmed numbered jerseys and a leading #, including jersey 0. Unnumbered players remain listed as disabled choices with a prompt to add their jersey rather than disappearing silently. Only the roster selected for that game is used; later roster edits do not automatically add new players to an existing game's selected roster.

Possession controls now flow in one column, with responsive player selectors and tag buttons. They do not depend on objective grid rows. This release updates the original CoachIQ app, not the separate GameDay site or game data.

## Apply

1. Merge the PR and replace four existing Apps Script files: `Game.html`, `Scripts.html`, `Styles.html`, and `SystemHealthService.gs`.
2. Save and reopen CoachIQ. Update an existing Apps Script web-app deployment to a new version if applicable.
3. Create a practice setup with a selected numbered roster, Possession Analytics on, and Game-Plan Objectives off.
4. Open tracking. Confirm the visible Our player/Opponent player selectors. Choose a player, record a paint touch and outcome, and check player totals in the report.
5. Repeat for opponent offense and our defensive deflections. Use Clear player credit for team-only events. Check portrait and landscape scrolling with Detailed plays both open and closed.

Build: `2026.10.26.11`.

## Verification

29 focused possession, roster and repeat-touch tests pass. Browser fixture using actual CoachIQ markup, stylesheet and roster/credit functions verified selected-player attribution with objectives disabled and details closed. At 1024×768, 768×1024, 1024×400 and 390×600, with details open and closed, scoring buttons stayed reachable and no horizontal overflow occurred. No browser JavaScript errors were reported. Syntax/diff checks pass. Full suite: 304/305 pass; the existing source-reconciliation Python subprocess test reports `spawnSync EPERM` in this environment. Physical iPad/Safari verification remains pending.
