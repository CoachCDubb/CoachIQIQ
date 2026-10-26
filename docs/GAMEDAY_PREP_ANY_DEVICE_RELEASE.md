# Download a saved GameDay setup on either device

CoachIQ already stores game setups in the shared spreadsheet, but preparation downloads were only exposed in the immediate setup confirmation. Reopening CoachIQ on the iPad did not show that button.

Each game in **Live Game → Resume a Saved Game** now has **Download GameDay prep**. It downloads by that saved game's ID, independently of which game was last created on the current device. Saved game actions appear below the matchup to preserve readable card widths.

This uses the original CoachIQ app's authenticated server export. It does not change file sharing, create a Drive folder, automatically sync local GameDay games, or publish roster/scouting data to another service. Existing team/staff checks and the fresh-unused-game restriction remain in place.

## Install

1. Merge this PR into `main`.
2. Replace four existing Apps Script files: `Scripts.html`, `Game.html`, `Styles.html`, and `SystemHealthService.gs`. Save.
3. If using the CoachIQ web-app link on the iPad, update the existing deployment via **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Close and reopen CoachIQ on both devices.

Build `2026.10.26.13`. The separately hosted GameDay app needs no update.

## Laptop → iPad workflow

1. On the laptop, save a fresh CoachIQ matchup with your selected roster, opponent roster, scouting link, and focus tags.
2. Leave that setup unused in the original tracker.
3. On the iPad, open the same original CoachIQ web app in Safari with the same Google account and spreadsheet access.
4. Open **Live Game → Resume a Saved Game** and locate the matchup.
5. Tap **Download GameDay prep** on that card, then save the JSON in Files.
6. Open the installed GameDay app → **Import file**, select that preparation JSON, review its details/rosters, and save the game locally.
7. Complete offline preparation before leaving internet access. Track the matchup in GameDay and import its locked result back into CoachIQ after the game.

If the saved setup is not listed, verify that both devices opened the same CoachIQ spreadsheet/deployment and reload Live Game. If the export says the game already has tracking activity, create a fresh unused setup rather than copying an in-progress tracker.

## Verification

Three new tests pass: downloads target the selected saved game's ID, callbacks restore button state, and the original confirmation download remains compatible. Browser checks with actual saved-game rendering and styles passed at 1500×900, 1024×768, 768×1024 and 390×600; actions stay below the matchup and retain 44px touch targets. The clicked card targeted its own game ID. Syntax/diff checks pass. Full suite: 307/308 pass; the existing source-reconciliation Python subprocess test reports `spawnSync EPERM` in this environment. Actual cross-device Google login/download verification remains a user acceptance check.
