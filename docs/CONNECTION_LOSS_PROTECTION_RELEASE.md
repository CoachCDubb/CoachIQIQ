# Connection-loss protection and offline audit — 2026.10.26.7

## This is not a full offline release

The existing Apps Script app cannot currently be relied on for a complete game at a venue without internet. It has no cached offline app shell, and bootstrap, game opening, reports, period changes, corrections, scouting and finishing use Google server calls. Safari can also discard/reload a tab. Keeping an already loaded tab open is temporary connection-loss protection, not an offline game-day guarantee.

| Action | Current behavior without a connection |
| --- | --- |
| Tag and finish a possession in an already open game | Queued on this device after verified local storage succeeds |
| View Quick Stats in that open game | Uses loaded data plus queued local possessions |
| Undo the current unfinished selection | Local in-memory action |
| Open/reopen or start a game | Requires internet |
| Generate full timeout/period reports or advance periods | Requires internet; timeout offers Quick Stats as a clearly labeled fallback |
| Mark adjustments, review/correct saved possessions, change focus/objectives | Requires internet |
| Finish the game, load scouting comparison or Program Intelligence | Requires internet |
| Export emergency game JSON from the open tab | Browser download; verify that the file saved on the iPad |

Full offline use, including reopening after Safari closes, needs an offline-capable app shell, durable local game/draft storage, local period/report/finish operations, ordered reconnection sync and a physical-iPad test of the complete workflow. The current protection patch does not implement those capabilities.

## What this patch fixes

- A tap/possession is not accepted, counted, cleared or auto-switched until its queue is written to local storage and read back successfully. Storage failure stays visible and the unfinished possession is retained.
- Recovery checks full game acknowledgement IDs instead of the latest eight possessions / thirty visible events. Acknowledgements include undone records, so retries do not resurrect them.
- Both queues share one in-flight transport. Fresh server snapshots overlay unacknowledged local activity once, preserving pending totals when the other queue syncs.
- Offline/failed-server states pause retries instead of repeatedly sending every new tap. Explicit Retry sync can restart an unanswered request with the same idempotent payload IDs; late responses from its older generation are ignored. Old-game responses cannot clear a new game's queue.
- A saved-possession undo requires a connection and no pending taps, preventing it from removing the wrong already-synced server possession while a newer local one is still queued.
- The live screen distinguishes connection-loss protection from full offline readiness and provides Retry sync and Export backup. A backup includes the current tracker, pending queues and unfinished draft. It is an emergency JSON export, not automatic restore or a replacement for durable offline app storage.
- Setup wording now describes one-iPad tracking with auto-switch.

## Install

Update AnalyticsService.gs, GameService.gs, Game.html, Scripts.html, Styles.html and SystemHealthService.gs. Save and close/reopen the spreadsheet dialog; publish a new version of the existing deployment for the web app. Confirm build 2026.10.26.7. No workbook migration is required, and existing local recovery keys are retained.

## Validation and remaining release gate

15 new behavioral tests cover denied/quota/silent storage failures, preserving an unfinished possession, serial queue draining, stale replies, full-history acknowledgements, exactly-once local replay, failed/unanswered requests and explicit capability wording. The regression suite retains the existing environment-blocked Python subprocess test.

Headless Chromium simulation used the real interface/scripts with simulated Apps Script transport and storage: 30 offline possessions and one score adjustment remained queued; reconnect synced all 31 items once; displayed totals did not regress during 31 server snapshots. Injected storage failure preserved the unfinished draft, and the exported backup contained the 30 possessions and that draft. No page errors occurred. These checks do not establish persistence on physical iPad Safari or actual Google-hosted reconnect behavior.

Do not certify full offline readiness from this patch. Before relying on any replacement offline app, test on the exact iPad: prepare a game, disable Wi-Fi and cellular, record a complete multi-period game, use reports/rosters/adjustments/corrections, lock/unlock and background it, close/reopen while offline, finish locally, then reconnect. Verify saved counts, points, player credit, periods, edit history and exactly-once server sync. The current Apps Script build cannot pass that entire scenario.
