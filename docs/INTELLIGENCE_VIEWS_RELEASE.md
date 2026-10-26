# Intelligence performance views — 2026.10.26.1

Update these five Apps Script files after merging this PR, then save and publish a new version of the existing web app deployment:

- AI.html
- InsightService.gs
- Scripts.html
- Styles.html
- SystemHealthService.gs

No workbook migration or extra live-game taps are required. Requires the previously merged scouting comparison release.

Intelligence now has Sessions and Scouting & Live Game buttons. Sessions shows up to eight recent completed sessions with completed evaluations for accessible active athletes. It compares the latest four with the previous four, reports recorded rating/attendance denominators, and excludes athletes with no scored ratings from performance rankings. Missing attendance is shown as unavailable.

Scouting & Live Game loads on demand, offers an accessible-team filter, and analyzes up to ten completed basketball games in the current season by game date. Archived games are excluded. One batched possession read feeds weighted offensive/defensive PPP, stops, kills, latest-three versus previous-three comparisons, paint-touch/confirmed-no-touch scoring and scoring tags. Kills reset between games. Score-only adjustments are excluded from possession PPP. Original pregame snapshots provide measurable target results, comparable target trends and recent evidence; missing snapshots and untracked targets remain qualified. Free-text scouting notes are not automatically graded.

Suggestions use recorded evidence. Paint comparisons need at least ten possessions in each group; tag suggestions need ten tagged offensive possessions. These are presentation thresholds, not statistical significance tests. Overlapping tags, opponent strength, incomplete possession recording and lineup changes limit conclusions. Select a single team before making tactical decisions from pooled totals. Switching views or refreshing invalidates older responses.

Validation: syntax check and regression suite; browser/iPad verification remains manual. Check both views, team switching, empty data, refreshing during a pending load, long custom tags, and original scouting snapshots in the deployed web app. The source-reconciliation subprocess test is blocked by this environment's Python-spawn restriction; its underlying script can be run directly.
