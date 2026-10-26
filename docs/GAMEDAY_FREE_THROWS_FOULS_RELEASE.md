# GameDay free throws, fouls and possession bar

GameDay version **2026.10.26.8** adds individual free-throw attempts within a possession, two foul outcomes, and a visible possession bar. Saved games and IndexedDB schema stay in place; no reset or migration is needed.

## Update safely during a game

1. Wait for a break, resolve the current possession, and export a backup. Confirm it is saved in iPad Files.
2. Merge this PR. In GitHub Actions, wait for **Publish CoachIQ GameDay** to finish successfully.
3. On the iPad, stay online. In GameDay, use **Prepare for offline / Check again**, wait about 20 seconds, then close/reopen or reload the app. Confirm **2026.10.26.8** at the bottom. If the old version remains, check again and reload after the background update finishes.
4. Prepare/check offline files again in the installed Home Screen app. Resume the same saved game. Do not clear website data or create a replacement game.
5. Try the new actions in a disposable practice game when possible, including airplane-mode reopening of an unfinished FT sequence. Do not put test possessions in the real matchup.

## Fouls without free throws

Use **Foul → keeps ball** for a foul where the offense retains possession. It adds a retained-ball foul to the bar, keeps the same draft and side, and does not add a possession or a stop. Continue tracking the inbound play; choose the actual scoring/turnover outcome only when possession really ends. Multiple retained fouls can belong to one possession. Foul markers are team events; they do not assign a personal foul to the selected shooter.

## Fouls with free throws

1. Tap **Foul → FTs**. This records the foul and opens the FT panel without ending the possession. **Free throws** also opens the panel if you do not want to classify a foul.
2. Choose the shooter's optional jersey in Player credit, then tap **FT made** or **FT missed** once per recorded attempt. Each click adds a point only for a make. Makes/misses stay in the same possession; the scoreboard includes them once the possession is saved.
3. For an and-one, expand **Include a made basket / putback** and choose **+ Made 2** or **+ Made 3** to include the basket once, plus the FT attempts. A three-point basket plus a made FT saves four points in one possession.
4. If a missed FT is rebounded by the offense, tap OREB and continue the same possession. A made putback can be added through **Include a made basket / putback**; select the rebounder/scorer's jersey before the relevant event. Do not start another possession for the rebound.
5. Choose **End possession · N points** only when possession is actually over. It saves the counted total and auto-switches once. You must record at least one FT attempt before using this FT finisher. Turnover remains available only when the counted possession has zero points.
6. **Undo tag** removes the last FT, basket, foul or tag selection. A foul-to-FT choice is undone as one selection. Every make/miss and the undo history save with the unfinished draft.

For standalone technical free throws that do not consume a possession, use the existing **Score-only adjustment** with a reason rather than creating an extra possession. The FT panel is for attempts that belong to the tracked possession. It cannot infer shooting-foul rules, remaining attempts, lane violations or the last rebound; the coach chooses the correct end.

## Possession bar and reports

The bar shows selected tags, retained-ball fouls, foul-to-FT events, each FT make/miss, baskets, and optional jerseys. It updates after local saving, displays the pending counted total, and confirms the last saved possession after auto-switch. Long event sequences scroll within the bar so controls remain accessible.

Quick Stats offers **Free throws · made / attempted** and **Fouls drawn · keeps ball / FTs**. Offense refers to our team; defense refers to the opponent's offense. Reports show FT counts and player-level FT totals. Only explicitly recorded FT attempts count toward FT%; older aggregate one-point outcomes remain unknown FT attempts rather than being converted into invented makes. Fouls and FT attempts do not add possession denominators. Defensive points from FTs reset the stop streak when that possession finishes; a missed attempt alone is not a stop.

## CoachIQ import compatibility

Before importing a result containing the new FT/foul events into the original CoachIQ app, replace these four Apps Script files with this PR's merged versions:

- `AnalyticsService.gs`
- `Scripts.html`
- `Game.html`
- `SystemHealthService.gs`

Save and reopen CoachIQ; update the existing web-app deployment to a new version if applicable. Source build **2026.10.26.16**. No sheet columns are removed. The new event types are preserved in Play Events JSON. Result imports remain idempotent.

Ordinary legacy possessions retain the 0–3 aggregate-point check. FT possessions use individual scoring events, must match their sum, and allow extended totals up to 20 for and-ones/rebounds/continued play. Corrections preserve FT attempt rows; Points must match the edited made FTs and made baskets. Recorded events and correction history remain auditable.

## Verification

59 offline tests pass, including FT makes/misses, and-ones, multiple scorers after a rebound, retained-ball fouls, one-possession denominators, undo, restartable drafts/storage, corrections, defensive stop runs and counted-score validation. Root analytics/import tests verify attempt totals, player attribution, four-point imports and duplicate retries. Actual UI fixture with simulated persistence verified retained-ball → foul/FT → make/miss → rebound/putback → one three-point possession, visible bar feedback, and FT report totals; scoring controls were reachable at 1024×768, 768×1024 and 390×600 with no JavaScript errors. Full original suite: 315/316 pass, with the existing source-reconciliation Python subprocess `spawnSync EPERM` environment failure. Syntax/diff checks pass. Physical iPad verification remains pending.
