# GameDay missed action and player-credit recovery — 2026.10.30.8

## Courtside controls

Missed something? is visible in the live tracker beside undo controls. It offers I know what happened → Add possession, I'm not sure → Mark tracking gap, and Assign missing scorers. The current unfinished draft, tags, ball side and auto-switch are preserved.

Possessions also exposes Add possession, Mark tracking gap and Assign missing scorers directly. The recovered-possession form records offense/defense, period, timeline placement, result, optional scorer, and ordinary FTs/and-one if needed. The outcome updates totals once. Unknown tags remain unknown (`trackedTags: []`). Recovered entries have an audit record and are labeled in the local history. Normal Edit possession can add remembered details later.

Insertion renumbers possessions and shifts affected coaching markers, objective tap boundaries, technical FT boundaries, tracking gaps and report checkpoint boundaries to preserve their anchors. Position must match period order. Inserting a recovered score does not remove a previous score-only correction: review any prior scoreboard adjustment to avoid counting the same points twice. Completed-game confirmed final scores stay as entered, as with existing corrections.

## Unknown gaps and analysis

A tracking gap records missing action at the current boundary without guessing count, outcome or points. It does not automatically resolve when one known possession is added. Gap history allows Mark reviewed / restored with a required explanation once the whole missing stretch has been checked. Records remain in the audit history.

Open gaps show a visible incomplete-tracking notice on the tracker and reports. PPP and totals remain calculations from recorded possessions, not estimates of missing action. Stop and no-paint runs break across unresolved gaps; already earned known kills remain. Current recent-possession analysis starts after the latest open gap rather than comparing windows across missing action. Saved reports exclude gap markers created later. Resolved gaps restore calculations over the reviewed recorded log.

Automatic objectives show Incomplete tracking while a gap is open rather than claiming a definitive achieved/missed target. Manual objective counters keep their explicit recorded-tap behavior; the general gap warning remains visible.

## Skipped / unassigned player credit

Team scoring stays intact. The tracker/report notice states, for example, Our player scoring incomplete: 8 of 42 recorded points unassigned. Opponent scoring and missing FT shooters are listed separately. Counts include technical FT makes/misses and legacy point-only possessions. Unassigned FT misses affect player FT coverage even when no points are missing.

Assign missing scorers presents individual scoring plays and FT attempts, using the proper roster or a manual jersey. Assignments update player credit only, retain correction history, and do not change score, possession count, draft or auto-switch. Ordinary, all-miss FT and technical entries can be repaired. Export-locked copies remain read-only; repair before final export.

Automatic individual Points objectives with missing credit display Incomplete tracking and No credited points / N+ credited instead of treating zero credited points as proof of zero production. Player table values say N credited while the relevant side has missing points or an open gap. Once missing credit is assigned and gaps are resolved, normal goal grading resumes.

## Transfer and compatibility

AnalyticsService handles gap boundaries for streak calculations. OfflineGameService validates optional gap metadata before staging, includes it in import conflict detection and the original archive, and stores original imported report quality/goal warnings and gap-aware analytics. No new spreadsheet columns. Existing empty gap histories preserve legacy import hashes; old local backups default to no gaps. Quality is derived from scoring events, so previously skipped player selections are detected without migrating old records.

This release's interactive notices and repair controls are in GameDay. Original CoachIQ's existing live/review screens are not redesigned here; the original offline archive retains the gap and credit/audit metadata for review.

## Update and device check

1. Merge and wait for the GameDay Pages publishing workflow.
2. Replace **AnalyticsService.gs** and **OfflineGameService.gs** in each CoachIQ Apps Script project that imports these games. Save; deploy a new web-app version if used.
3. In GameDay online, Check again / Prepare for offline, close all app windows and reopen the same app. Confirm 2026.10.30.8. Do not clear data or reinstall.
4. In a practice game, skip a scorer, begin another possession with tags, then use Missed something? to add a known outcome and mark a gap. Confirm your draft survives, numbers aren't guessed, and incomplete notices appear. Assign the scorer and explicitly review/resolve the gap; check goal status and unchanged team score.
5. Check airplane-mode close/reopen on the actual device, export a practice backup and final result, and verify import in the updated CoachIQ account/workbook.

## Validation

151 GameDay tests and 357 root tests pass, plus syntax/diff checks. Tests cover gap resets, no invented possessions/points, incomplete goal status, scorer/FT repair, period/order validation, recovered insertion and marker/report/technical/manual-goal boundaries, backup limits, locks, legacy hashes, import conflicts and gap-aware imported streaks. Browser fixture with actual app modules and fake-indexeddb verifies the live button, known recovery, unchanged draft, gap marking/resolution, player repair and goal caution at 1024/768/390 pixels with no horizontal page overflow or page errors. Physical-device and live-account checks remain required.
