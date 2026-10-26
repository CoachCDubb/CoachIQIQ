# Live review, adjustments and carry-forward highlights — 2026.10.26.5

## Install

Create a **new Apps Script file named GameReviewService.gs** and copy the new service into it. Update these six existing files:

- AnalyticsService.gs
- Game.html
- GameService.gs
- Scripts.html
- Styles.html
- SystemHealthService.gs

Save all files and publish a new version of the existing web app. Confirm build 2026.10.26.5 in System Health. The optional **Live Possession Edits** sheet is created on the first correction; original possession rows and existing workbook columns are preserved. This release depends on the preceding scouting, repeat paint-touch and Quick Stats releases.

## Coach workflow

**Review possessions:** use the live header button or expand the possession list in any timeout, period or postgame report. Choose Edit possession to correct points, period, tags, repeat paint touches, rebounds or player credit. The side and original sequence cannot change. A correction reason is required. Individual rebound play rows must match the rebound count. The original row remains intact; the correction is appended with who/when/reason and full before/after values. The latest ten revisions are available in the editor; the full history remains in the ledger.

Corrections work during and after the game. Stats, kills, player totals, scouting comparisons, adjustment comparisons and reports use corrected canonical possessions. Confirmed final scores and the recorded winner do not change automatically. A postgame discrepancy note shows tracked versus confirmed scores when different. Live Paint Touches count objectives use individual touch events; historical coverage remains unknown where it was never tracked.

**Mark adjustment:** choose a name such as Switched to 2–3 zone, Started pressing or Switching ball screens, select offense/defense/both, then Mark now. No objectives are required or changed. This device's protected queues sync before the marker. There can be up to twenty tactical markers per game. Comparisons show the last ten recorded possessions on the selected side before a marker versus possessions after it, ending at the next tactical marker. The last marker compares through the current report. Empty/small samples are labeled. Late taps from another device follow recorded order; lineup/opponent changes prevent causal conclusions. Prior game-plan edits without a sequence boundary are not retrospectively treated as tactical markers.

**Player alerts:** a compact expandable live panel surfaces credited player events at thresholds of three offensive rebounds, three deflections, five paint touches or six points. Reports also show these alerts. Our and opponent jerseys remain separate. Plays without a jersey never produce player credit; these are credited totals, not a claim of complete player statistics.

**After the game:** the report highlights Keep doing and Address moving forward, with counts and possession samples behind each finding. It includes relevant target results, player concerns and tactical comparisons. This does not create practice sessions, drills or training objectives.

Quick Stats remains a local instant snapshot. Normal possession entry remains tag → points.

## Integrity and performance

Corrections require run_sessions and game-team access, reject archived/voided possessions, preserve coverage metadata and validate the same payload rules as live tracking. Revision checks reject a stale second editor. Edit IDs make retries idempotent. Original sequence numbers keep adjustment boundaries stable when points/tags are corrected or possessions are undone. Protected original-payload retries cannot overwrite an edit. Appends and stored postgame-report updates run under the shared mutation lock. If a correction commits but the report refresh fails, the UI explicitly reports that it was saved and asks the coach to reopen the report.

Normal analytics reads scan a narrow correction index and fetch only latest matching payloads; they do not load all historical before/after JSON. Game Updated At changes invalidate benchmark cache signatures. Full postgame reports rebuild from canonical data when opened, including older stored reports.

## Verification

Syntax checks and static HTML nesting/unique IDs pass. All 24 new behavioral tests pass. Full suite: 278/279 passing; only the existing source-reconciliation Python-spawn EPERM tooling failure remains environment-blocked. Live Apps Script/iPad/browser/print visual verification is pending.

Before publishing to staff, use a disposable game with two devices. Mark a zone change between recorded possessions, add more possessions, and verify before/after samples in the report. Correct points, player jersey and a repeated paint touch; refresh both devices and check player totals, kills, Quick Stats and the correction history. Try saving a stale second editor and confirm it is rejected. Finish the game, correct a saved possession, and confirm analytics update while the entered final score/winner remain unchanged. Verify iPad portrait/landscape, native dialog scrolling, Escape/close behavior, long notes, and printing without edit controls. Check an analytics-only game, objective-only game and an existing older completed report as well.
