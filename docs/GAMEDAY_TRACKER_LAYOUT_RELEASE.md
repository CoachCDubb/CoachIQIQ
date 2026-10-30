# GameDay tracker cleanup — 2026.10.30.3

## Main tracking screen

- Tonight's game plan is always visible below the scoreboard, with compact objective cards showing values and target/status. Manual objectives have their tap controls directly on the cards. Automatic goals update from completed possessions. Add/Edit objectives manages the plan; Undo last objective tap works without opening a modal. Creating a game remains possible with no objectives.
- The old Player credit section is removed from the tracker bottom. Scoring and turnover prompts handle outcome credit. Tracking settings → Tag player retains optional pre-tag jersey assignment for paint touches, rebounds and deflections. It is not required for team tracking or prompted scorer credit.
- Replaces the large Game tools disclosure with four actions: Possessions, Scouting & rosters, Tracking settings, More. End period is in the top action row. More contains adjustments, scoreboard corrections, Finish game, backup, team correction and Back to games.
- Possession history leads with its result (Made 2 / Made 3, No score / Stop, Free throws, Turnover / Forced turnover). Scoring details and tags follow beneath. The last-possession bar also leads with the result. Player attribution appears beside the result when recorded; pagination and offense/defense filters remain.

## Turnover player prompts

- Independent Turnover prompt switch, default Off (also in Tracking settings → Player & turnover prompts).
- On offense: choose our player who committed the turnover, or skip.
- On defense: choose our player who forced it, then the opponent who lost it. Either player can be independently left unassigned. Opponent roster buttons or a manual jersey are supported. Save our player only / Leave both unassigned is available in the second step. Closing the entire prompt leaves both unassigned.
- The possession saves with 0 points before the prompt, and Auto-switch remains independent. Pending prompts survive reopening. Reopening partway through the two-player selection restarts selection; the saved possession remains intact.
- Review possessions → Player / breakdown also corrects turnover attribution. Player totals include TO and Forced TO, separately for Us and Opp. Credits do not add team turnovers: one possession is still one team turnover.
- Canonical turnoverCommitted and turnoverForced play events travel with existing backups and result imports. The committed player belongs to the offense; the forcing player belongs to our defense. Validation rejects duplicate credits or credits on a non-turnover possession. No new spreadsheet columns.
- Existing player-turnover game-plan objectives retain their existing manual-count behavior. Player turnover totals in the report come from the optional outcome attribution; adding a manual objective tap does not add a turnover to those totals.

## Update

1. Merge the PR and wait for the GitHub Pages publish workflow to pass.
2. Replace the complete **AnalyticsService.gs** file in each importing CoachIQ Apps Script project and save. If using a deployed web app, deploy a new version. Keep previous OfflineGameService.gs objective support.
3. In GameDay online, Check again / Prepare for offline, close all GameDay windows, and reopen the same app. Verify **2026.10.30.3**. Do not clear website data or reinstall.
4. Practice adding an automatic and a manual objective, tapping the visible manual card, and turning Turnover prompt On. Record one offensive turnover and one defensive turnover with both players, then check Possessions and report Player totals.
5. Run the actual-device airplane-mode close/reopen test and export/import a practice result to verify the particular CoachIQ workbook/account.

## Validation

123 GameDay tests and 349 root tests pass, plus syntax and diff checks. New tests cover both turnover participants, partial attribution, pending backup/reopening, correction/skip/void behavior, invalid events, idempotent CoachIQ transfer and no duplicate team counts. A browser fixture using actual app modules with fake-indexeddb verifies visible objective taps, optional tag-player access, both turnover steps, outcome-first possession history, report totals and no horizontal page overflow at 1024/768/390 pixels. Actual iPad Safari and live Google permissions/deployment still require the device test.
