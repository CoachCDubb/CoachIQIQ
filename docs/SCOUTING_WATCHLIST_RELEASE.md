# Scouting watchlist and next adjustment — 2026.10.26.2

Update these eight Apps Script files after merging, save, and publish a new version of the existing web app:

- AnalyticsService.gs
- Game.html
- GameService.gs
- Scouting.html
- ScoutingService.gs
- Scripts.html
- Styles.html
- SystemHealthService.gs

No sheet migration is needed. Existing scouting reports have no watchlist until a coach selects one. Previously started games retain their original snapshot and focus.

## Coach workflow

1. In a scouting report section, open **Game evidence & watchlist**. Select a possession tag for our team or the opponent. For a custom tag, enter its exact name.
2. Enable **Watch during the game** for up to three sections. Optionally enter the coaching response you want considered when that pattern appears. Save the report.
3. Send to Live Game, or select that saved scouting report during game setup. The setup preview names the watchlist. Its tags take priority in the existing six-tag maximum; duplicate tags share one button. Keep Possession Analytics on to collect evidence. Game-plan objectives remain optional.
4. Track using the existing tag → points workflow. At timeout, end of quarter, or halftime, read the **Next adjustment** card and up to three watchlist evidence rows. Postgame retains the watchlist results. No per-possession confirmation or new event type is required.

The server derives watchlist priorities from the authorized scouting snapshot at game creation; it does not trust client-provided watchlist data. Editing/deleting the source report does not change an existing game's watchlist. Changing live focus preserves the original watchlist but may leave subsequent tag coverage unknown.

## Evidence rules

Watchlist defense suggestions require at least three tagged possessions with scoring on at least half; offensive suggestions require at least three tagged and three confirmed-without possessions and higher PPP on the tagged group. These are decision-display thresholds, not tests of statistical significance. The card labels small samples, unknown coverage and overlapping tags. Coach-written responses are labeled as planned responses; other responses are suggestions. If watchlist evidence is insufficient, a recorded paint comparison or game-plan target may supply the decision; otherwise the card asks for more tracking. No-tag is inferred only when that tag's coverage was enabled. Custom labels have no label-specific negative coverage, so unmatched custom-tag possessions remain unknown. Repeated events in one possession count once in scoring comparisons; a watched OREB possession is distinct from total rebound events.

## Validation

Syntax check and behavioral tests cover priority limits, cleaning, duplicate tags, focus merging, side handling, custom-tag unknown coverage, sample thresholds, no-objective checkpoints, safe rendering, stale-row clearing and linkage preservation. The regression suite's existing source-reconciliation Python-spawn test is environment-blocked; run the underlying script directly if needed.

Manual deployed verification: save an opponent Cut / Paint touch / OREB watchlist; send to setup with objectives off; confirm the preview and tag buttons; start a disposable game; record tagged and untagged possessions; open timeout and halftime reports; confirm counts, planned response and small-sample wording. Change live focus, refresh, check saved linkage, then finish and inspect the postgame watchlist. Check iPad portrait/landscape and print output. Browser/iPad visual validation has not been performed in this workspace.
