# Repeat paint touches — 2026.10.26.3

After merging, update these seven Apps Script files, save, and publish a new version of the existing web app deployment. The iPad uses the same deployment URL.

- AnalyticsService.gs
- Game.html
- GameService.gs
- InsightService.gs
- ScoutingService.gs
- Scripts.html
- SystemHealthService.gs

No workbook migration is needed. Repeat touches use the existing ordered Play Events JSON column and existing protected save queue.

## Coach workflow

Tap Paint touch for every new paint entry or catch; each tap adds a recorded touch and the existing button displays ×1, ×2, ×3. Do not count each dribble. Tap points once to finish the possession. Undo last tag is now visible beside Undo possession, outside detailed controls. It restores the previous selection including touch count and player credit. The detailed Paint touch button and legacy tag control also add touches.

Three touches and a made three remain one possession, three touch events and three points. Paint-touch PPP and frequency continue to use possessions with a touch as their denominator. Count-based live Paint Touches objectives now use individual recorded touches. Player credit remains optional and follows the selected player at each event.

Reports and game Intelligence show recorded touch totals separately from tagged possessions, plus outcomes on one versus two-or-more recorded-touch possessions when available. Scouting watchlist evidence includes the touch total without inflating its possession denominator. Scouting comparisons offer both Paint-touch possessions and Total recorded paint touches; the latter can also enable the same paint-touch watchlist tag. For a count target on the new total measure, use the metric label Total paint touches. Existing scouting comparisons mapped to the possession measure retain that explicit meaning.

## Historical limits

Older boolean-only rows establish at least one touch; additional historical touches cannot be reconstructed. Older single-event records may also omit repeats. Comparisons are labeled as recorded-count groups, not verified complete historical touch counts. Total-touch scouting comparisons with boolean-only positive rows are partial and cannot automatically pass/fail a target. A legacy summary without touch totals falls back to its recorded touch-possession count in display and objective derivation.

## Verification

Automated coverage checks repeated taps, undo to zero, saved payload/row round-trip, separate team/player totals, unchanged PPP denominators, optimistic/server agreement, total versus possession scouting evidence, legacy partial coverage, watchlist tag reuse and live objective counts. Existing source-reconciliation Python-spawn failure remains an environment limitation.

Before deploying for iPad, test a disposable game: tap paint three times, undo once, finish with 2; verify one possession, two touches, two points and 2.00 paint-touch PPP after refresh and in the timeout report. Repeat on defense, test optional player attribution, watchlist evidence, and one versus multiple-touch insights. Verify portrait/landscape and print output in the deployed app; live iPad/browser visual QA has not been performed here.
