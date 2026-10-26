# Exact CoachIQ team names in GameDay

This update prevents manually typed team names from blocking completed-game imports. Team links are a saved copy of settings, not an automatic connection or synchronization service. CoachIQ still checks permissions and exact configured team names on import.

## Install the CoachIQ buttons

1. Merge this release PR into `main`.
2. In the existing Apps Script project, replace `OfflineGameService.gs`, `Game.html`, `Scripts.html`, and `SystemHealthService.gs` with the merged versions. Save.
3. Close and reopen CoachIQ. If using the deployed Apps Script web app, publish a new version through Manage deployments.

The hosted GameDay app is updated separately. Reconnect the iPad, reopen GameDay while online, wait for its update, and reload. Confirm version **2026.10.26.6** and run Prepare for offline again. Keep existing website data.

## Link the teams once on the iPad

1. In original CoachIQ, open **Live Game → Download team link**.
2. Save **CoachIQ-team-link.json** to Files.
3. Open the installed GameDay app, choose **Import file**, and select that JSON file.
4. Confirm the team names and season displayed on the Games page. New game setup now offers an exact-name dropdown.

Refresh this link file when team settings or seasons change. A fresh CoachIQ preparation file also links its team automatically. A team link does not include rosters or scouting; use a matchup preparation file for those.

## Fix the existing rejected practice game

1. In GameDay, open the practice game. Close its report if it opens automatically.
2. Expand **Game tools**, then choose **Correct team for import**.
3. Select the exact linked CoachIQ team and choose **Save corrected team copy**.
4. The original game remains untouched. The corrected copy preserves all possessions, final score, repeated touch/rebound counts, and correction history. Its game, import, possession, marker, and adjustment IDs are new to avoid colliding with the original.
5. For an already finished and export-locked game, choose **Download result again** from the corrected copy, then save the new JSON to Files. If the copy is not locked, use **Export final result & lock**.
6. In CoachIQ, use **Import GameDay result** and select this newly downloaded file. Keep the original backup until verified.

Only use the correction-copy workflow for a game that has not been successfully imported. If it is already in CoachIQ, correct it there rather than importing another copy.

## Validation

39 offline tests and 9 bridge tests pass. Syntax checks pass. Browser UI smoke with simulated persistence verifies the linked dropdown, correction of an exported game, JSON download with the exact name, and preservation of the original game. Existing iPad offline acceptance testing still applies after updates.
