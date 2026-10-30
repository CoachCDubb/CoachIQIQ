# GameDay game-plan objectives — 2026.10.30.1

GameDay now supports optional team/player game-plan goals independently of its six quick tracking tags. Goals can be added during an unlocked live game and appear in a collapsible game-plan section, the Game-plan objectives button, timeout/period reports and the final report. Games without goals remain valid. Existing game and drill storage are unchanged.

## Use it

1. Open or create a GameDay game and choose **Game-plan objectives**.
2. Select Points, Offensive rebounds, Paint touches, Transition points, Turnovers, Deflections, Fouls or Custom category.
3. Choose Just track it, Reach at least, Stay under, or Win the battle.
4. For individual goals, choose Our player or Opponent player under Who and enter/select the jersey number. Win the battle compares both teams, hides Who and displays an explanation.
5. Save the goal. Up to twelve total definitions are supported. Hide/Restore preserves historical definitions and manual taps.

Team points, paint touches, offensive rebounds, transition points, turnovers and deflections update from saved possessions. Player points, paint touches, offensive rebounds and deflections use explicitly credited player events. Player turnover goals, fouls, custom categories and percentage goals use manual counters. No manual tap is allowed on an automatic goal, preventing duplicate collection. Manual objective taps never change the game score.

Automatic goals use the recorded whole-game history even if added later. Incomplete credit and untracked actions limit their meaning. Draft possessions and score-only adjustments are excluded from automatic objective totals. Manual goals count only their own taps. Percentage goals show no-attempt status until there are recorded opportunities; they offer Made and Missed buttons. Undo last manual objective tap preserves a voided audit entry.

Report checkpoints preserve their objective definitions and manual event boundary. Corrections to recorded possessions remain reflected in automatic evidence, consistent with existing reports. Backup validation checks plans, event membership, side/unit, limits and report boundaries. Exported/finished games cannot change objectives.

## Transfer between CoachIQ and GameDay

Update **OfflineGameService.gs** in each CoachIQ Apps Script project that will prepare/import these games. Save, reopen the spreadsheet dialog, or publish a new web-app deployment version if using its deployment URL. No other Apps Script file changes are needed for this release.

New preparation exports include enabled objectives. Source player IDs are resolved to jersey numbers; a player goal without a numbered roster player produces an actionable error rather than silently dropping the goal. Old preparation files and games without goals still work. You may also add goals directly in GameDay after saving the setup.

Final result imports preserve the plan and use actual final targets rather than in-game pace projections to produce objective totals in CoachIQ's existing final objective report. Imported player references map to the game-only roster. Manual percentage numerators/denominators survive transfer. Objective totals do not inflate the scoreboard. The original manual tap history remains in the archived offline payload; CoachIQ receives final objective totals in its event table. Existing result hashes remain compatible when optional objective arrays are empty. Identical retries do not duplicate goals/events; changed payloads or unexpected staged events are rejected.

## Publish and update

1. Merge this PR and wait for **Publish CoachIQ GameDay** to finish successfully.
2. Copy the updated OfflineGameService.gs into the relevant CoachIQ project(s) for transfer support.
3. Between games, back up current data. Open the existing GameDay app online, tap Check again / Prepare for offline, close all GameDay windows and reopen. Confirm **2026.10.30.1** in the Games footer, and prepare again in the installed app if needed.
4. Try a disposable game: a player points goal, a team comparison, a custom counter and a made/missed percentage. Confirm automatic totals update after credited possessions, manual counters do not change score, and reports include goals.
5. Complete the airplane-mode close/reopen test on the actual tracking device, then export a test result into the updated CoachIQ project. Do not clear website data or reinstall to update.

## Validation

All 110 offline-app tests and 346 root tests pass. The new coverage includes automatic/player totals, no duplicate manual counting, goals from prep, manual percentage math, hide/restore, report boundaries, locked games, malformed imports, player ID mapping, final CoachIQ reports, unchanged legacy hashes and idempotent/conflicting result imports. Syntax/diff checks pass.

Compiled browser fixtures used the real interface and database modules with fake-indexeddb: player goal creation and automatic scoring, custom counters, percentages, Who/comparison behavior, timeout report/PDF inclusion and widths 1024/768/390. Physical Safari and Google-hosted bridge behavior still need the device/account check after deployment.
