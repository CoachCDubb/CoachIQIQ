# After-game scouting comparison — build 2026.10.25.3

Add a **Scouting comparison** button to completed-game history and the postgame report footer. The report pairs each scouting section's original notes with the corresponding game evidence, measured targets and coverage. Default offense/defense scouting sections receive related tracked context. Unstructured text is never automatically graded as success/failure.

## Before a new game

Choose the saved scouting report in Live Game setup, or use **Send to Live Game** from Scouting. A report can be linked with no objectives selected. When the game is created, the authorized matching team/opponent report is snapshotted; later edits, archival or deletion of the source report do not replace that snapshot. The game date stays the date selected in game setup, allowing an explicitly selected older opponent scout to be reused.

Scouting sections have an optional **After-game comparison** setting. Link a measure and team without adding an objective. Exact custom tag names are supported. Structured scouting targets can also be compared when their measure/unit/team match and tracking coverage is complete. Partial observations are not assumed to be complete totals, and missing measures are not marked failed. Confirmed final scores are used for point targets, including score-only adjustments. Custom tags currently have positive-event evidence but no label-specific negative coverage; absent custom tags therefore remain conservative/partial.

## Existing completed games

Use Scouting comparison and select a saved report for the same team and opponent. This is labeled **Retrospective comparison** and does not claim to reproduce an original pregame version. It is a read-only comparison: completed game records and scores are not changed. Canonical possessions are loaded for comparison, including older reports whose saved summaries lacked a full log.

## Storage and access

The existing Tracker Mode field holds the source report/snapshot IDs. A new optional **Game Report Snapshots** sheet stores bounded, prefixed JSON chunks. The same chunk storage protects large postgame reports from the spreadsheet's per-cell text limit; compact, history/training-compatible summaries remain in Games and the full report is restored on read. No source notes or possessions are silently truncated. Snapshot reads remain scoped to game ID, kind and snapshot ID after current game/team access checks.

## Installation after review and merge

Replace these six existing Apps Script files from one merged commit:

- Game.html
- GameService.gs
- ScoutingService.gs
- Scripts.html
- Styles.html
- SystemHealthService.gs

The optional snapshot sheet is created automatically when first needed; do not manually rename it or its columns. No new code file or OAuth scope is required. Schema target remains 2. Save/reopen and confirm build **2026.10.25.3** in System health.

## Live verification before deployment

1. Save a scouting report for a disposable matchup. Add a paint-touch comparison to a section without enabling a Live Game objective. Link the report in setup and create the game.
2. Edit the original scout after game creation. Record several possessions and complete the game with confirmed scores. Open Scouting comparison and verify that it still shows the pregame notes, accurate data/coverage and original capture information.
3. Check an unmapped free-text section, an untracked tag and partial coverage: none should be falsely marked failed or met.
4. Open an older completed game with a matching saved scout. Select it for a retrospective comparison and verify the disclosure and game/team match.
5. Test a long scouting report, a long game, mobile layout, keyboard close/cancellation and printing. Confirm the full postgame report still opens from history and authorized Coach Training views retain their metric summaries.
6. After these pass, update the existing web-app deployment with New version and preserve its URL.

Automated syntax/logic/storage/access checks pass. Live Apps Script, browser/iPad and printing verification remain pending. The full repository suite retains its previously documented environment-only Python subprocess test restriction.
