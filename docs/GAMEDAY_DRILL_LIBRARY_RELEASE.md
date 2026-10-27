# GameDay drill library — 2026.10.27.1

GameDay now has Games and Drills & history workspaces. The drill library groups templates and saved sessions into named folders. Filters find sessions by folder, team and drill, with paginated history. This is local device storage, not an automatically synced Drive/Files folder.

## Track a drill

1. Open Drills & history. Save Shooting, Defensive stops or 3-on-3 advantage from Starter drills, or choose New drill.
2. Enter a name, folder, success label and other outcome label. Add up to four optional tags. Enable defensive-stop kills only when success represents a stop.
3. Choose Run drill. Confirm team and optional roster. When available, the roster is copied from the latest locally saved game for that exact team; verify it before tracking. Linking a team alone does not download its roster.
4. Choose a player or leave team credit selected. Tap tags for the current rep, then one outcome. Each outcome saves one opportunity. Tags may repeat within a rep; pending tags do not enter completed statistics.
5. Undo reverses the latest tag or restores the latest completed rep for correction. Finish after recording the current rep’s outcome. The saved session appears in its folder; use Resume for unfinished sessions and Open report for finished ones.

Results show successes/opportunities, percentages, tag event and tagged-rep counts, individually credited results, best run, and defensive kills when enabled. Progress compares the latest five completed sessions with the previous five for the same drill ID and exact team, weighted by recorded opportunities. Small samples, overlapping tags and changed drill conditions limit interpretation. These are offline statistical summaries, not cloud AI calls.

## Keep the data

- The library saves automatically on this device/browser after each change. Wait for the saved message before closing.
- Export all drill data, a selected folder, or one session to a JSON backup. Confirm the download in Files / Downloads. Session backups include the drill-definition and roster snapshot.
- Import drill backup restores missing IDs. Existing IDs are kept unchanged; repeat imports cannot overwrite newer local sessions. This is backup/restore rather than automatic device synchronization.
- Backups support up to 2,000 records and 8 MB each. Export individual folders/sessions if a library is larger.
- Deleting a template retains its saved session snapshots. Deleting a session requires confirmation. Export a backup first if it needs retaining.
- Drill storage and backups are separate from games. Drill JSON is not accepted by CoachIQ's game-result importer. No automatic transfer into CoachIQ or Google Drive is claimed in this release.

The new coachiq-gameday-drills-v1 IndexedDB database is independent of the existing game database, which is unchanged. Live-game reads do not load the practice history. Drill writes use revision checks; failed writes retain the previous committed state, and a conflicting session must be reopened. Imports validate the entire archive and commit atomically.

## Publish and update

1. Merge this PR. Wait for Publish CoachIQ GameDay to finish with a green check.
2. Update between games while online. Back up any current game first.
3. Open the existing GameDay address/icon, choose Check again / Prepare for offline, then close all GameDay windows and reopen to activate the update. Confirm 2026.10.27.1 in the Games footer. Prepare again in the installed app if needed.
4. In a practice drill, turn on Airplane Mode and turn Wi-Fi off. Record reps, leave one tagged rep unfinished, close completely and reopen. Confirm the session and pending tags, finish the rep, and open the report. Export and restore a disposable session backup.
5. Continue using the same address/icon; do not clear website data or uninstall while it holds the only records.

No Apps Script files need copying for this GameDay release. Other teams update GameDay on their own devices; their CoachIQ workbook copies are unaffected.

## Verification

98 offline-app tests pass, including 21 new drill model/storage tests. Existing game, free-throw, report, storage, cache and preparation checks remain passing. Browser testing uses the compiled interface and real database modules with fake-indexeddb: rapid taps, optional player credit, pending-rep reopening, undo, finish validation, export/delete/restore, game isolation and no overflow at 1024, 768 and 390 pixels. The browser fixture does not certify physical Safari/iPad storage; complete the device airplane-mode test after deployment.
