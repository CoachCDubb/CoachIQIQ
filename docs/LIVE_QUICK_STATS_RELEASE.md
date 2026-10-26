# Live Quick Stats — 2026.10.26.4

Update these four Apps Script files after merging, save, and publish a new version of the existing web app:

- Game.html
- Scripts.html
- Styles.html
- SystemHealthService.gs

No workbook changes or new server endpoint is required.

## Coach workflow

Tap **Quick Stats** in the live game header. The compact card opens immediately from the current loaded tracker, without flushing the save queue, creating a checkpoint, generating intelligence or calling Apps Script. The default six tiles show tracked score, possessions, PPP, recorded paint touches, offensive rebounds and stops/kills.

Open **Choose my stats** to select one to eight tiles. Additional choices include turnovers, transition scoring, outcomes for tonight's selected tags (including custom tags), and active game-plan objectives. Preferences are remembered for that team and season on this browser/device; they do not sync to other devices. If browser storage is blocked, choices continue for this visit. Back to tracking, the close button, Escape or the backdrop dismisses the card. The native modal dialog contains keyboard focus while open and the close handler returns focus to the launch button.

## Data meaning

The card shows game-to-date completed recorded possessions, including optimistic queued possessions on this device. The current unfinished draft is excluded. It updates when the existing shared tracker view updates; opening the card does not request fresh activity from other devices. The status explains this and reports pending taps. Use the existing shared-view Refresh button after closing when you need the latest other-device activity.

Score includes score-only adjustments; possession PPP excludes them. Paint-touch totals count recorded events, while tagged possessions remain separate. Historical repeat touches cannot be reconstructed. Scoring-tag rows count a matching possession once, display points/possessions and disclose observed coverage; custom tag absence remains unknown. Stops/kills use our defense in the Us column and the opponent's defense in the Opponent column. Three consecutive recorded zero-point possessions earn a kill. Analytics-dependent values show unavailable when tracking is off; percentage objectives without attempts also show unavailable.

No stat selections, player credits, possessions, objectives or report data are changed by opening the card. Navigating away, opening a checkpoint, exiting the game or changing game ID closes it.

## Verification

Syntax check and 13 behavioral tests pass. Full regression: 254/255 passing; the existing source-reconciliation Python-spawn test remains environment-blocked. HTML nesting and unique IDs pass static validation. Live Apps Script/iPad visual verification remains pending.

Manual checks: open Quick Stats during a disposable game; customize a tag and objective tile; close and reopen; check choices after refreshing on the same device. Record queued possessions, repeat paint touches and score-only corrections, and confirm accurate counts/PPP after reopening. Test empty/analytics-off games, other-device freshness wording, Escape/backdrop/close focus, iPad portrait/landscape, scrolling the chooser and exiting to a different game. No full timeout report should be requested when opening Quick Stats.
