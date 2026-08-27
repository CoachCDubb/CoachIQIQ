# Live Game two-device production smoke test

Use this runbook after deploying the Game-Day Confidence release. Run it against a disposable game and roster on the production deployment, using two staff accounts that are authorized for the same team. Keep the **Game Events**, **Games**, and audit sheets open in a third window.

## Preconditions

1. Confirm both staff accounts have `run_sessions` capability and team access. Confirm an unrelated-team account cannot open the game.
2. Create a focused plan with two comparison objectives and one percentage objective. Verify the pregame card reports the matchup, selected roster count, and objective count.
3. Open the same saved game on Device A and Device B. Record the game ID and each device/browser version. Do not use private browsing because recovery depends on local storage.

## Concurrent and idempotent event test

1. On a countdown, tap different objectives simultaneously on A and B. Confirm each device changes its count immediately and shows a protected-event count until sync finishes.
2. Wait for **All taps saved**. Confirm both show a last-sync time. Refresh both devices and verify both events appear once, with unique event IDs and monotonically increasing per-game sequences in **Game Events**.
3. Rapidly double-tap the exact same button on A. Confirm immediate button feedback is visible but only one tap is accepted inside the protection window. After a deliberate pause, tap again and confirm it is accepted.
4. In browser developer tools on A, replay an already-successful `recordLiveGameObjectiveEvents` payload with the same event ID. Confirm no duplicate row is created.

## Offline recovery and exit protection

1. Take A offline, make three distinct taps, and verify **3 protected** plus **Offline protection active**. Attempt Exit and browser refresh; confirm the pending-event warning appears.
2. Refresh while still offline, return online, reopen the game, and confirm the recovery banner finds the protected taps and retries them. Verify every event appears exactly once on the server and the protected count returns to zero.
3. While A is offline with one protected tap, add a newer event on B. Reconnect A. Confirm both events survive reconciliation and neither device overwrites the other.

## Undo and completion safety

1. With both devices current, press Undo on A. Confirm the modal describes the exact latest objective. Add a newer event on B before accepting A's modal, then accept it. Confirm the server rejects the stale undo and preserves B's newer event.
2. Refresh A, Undo the true latest event, and confirm an `UNDO_LIVE_GAME_EVENT` audit record exists with game/event identity and before/after void state.
3. Leave one tap syncing on A and press Finish. Confirm the irreversible-lock confirmation reports pending work and syncs before finishing. Accept it while B attempts another tap.
4. Verify completion produces one official postgame report from all events committed before the completion lock. Confirm late taps, retries, Undo, checkpoints, and plan adjustments are rejected on both devices after completion.
5. Confirm `FINISH_LIVE_GAME` is audited and an unrelated-team staff account still cannot read the tracker or postgame report.

## Release evidence

Capture screenshots of the readiness summary, protected/offline state, last-sync state, stale Undo rejection, completed report, and relevant audit rows. Attach the game ID, event IDs/sequences, device details, timestamps, tester names, and deployment version to the release ticket. Delete or clearly label the disposable production game per program policy.
