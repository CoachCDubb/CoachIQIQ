# Live Game stability audit

Audit date: 2026-08-16

## Scope

This audit reviewed the recovered Live Game setup, focused tracker, event persistence,
offline tap recovery, game-plan adjustments, checkpoints, postgame reporting, staff
authorization, and audit logging. The recovered baseline and archive were verified
before any source changes were made.

## Findings

### Resolved: concurrent event persistence

Event IDs and per-game sequence numbers were previously read before acquiring the
script lock. Two overlapping requests could therefore make decisions from the same
sheet snapshot, allowing duplicate retry IDs or duplicate sequence numbers.

Both objective-event batches and legacy stat events now perform the duplicate check,
sequence allocation, append, and game-state update under the same script lock. This
preserves idempotent retries and monotonically assigned sequences when multiple staff
devices submit at once.

### Resolved: completed-game mutation

Both event-writing entry points now reject requests for a completed game. This keeps
late device retries or direct server calls from changing the event history behind an
already-generated postgame report.

### Verified controls

- Live Game server entry points require the session-running staff capability and
  enforce team access.
- Objective taps validate the objective, side, delta, period, and player scope.
- Client-generated event IDs support retry deduplication, while unsaved taps remain
  protected in local storage and are reconciled against server events after reload.
- Spreadsheet writes use formula-safe values where user-entered text reaches cells.
- Game setup, start, plan adjustment, and completion actions emit audit records.
- The recovered feature boundary remains intact; no later unstable recommendation
  or deferred-plan state was added.

## Residual operational checks

The Apps Script deployment should still be exercised with two authorized test devices
before release: submit simultaneous taps, force one request to retry, refresh with an
unsaved local queue, finish the game, and confirm that a late retry is rejected. Also
confirm that sheet headers match the constants before testing against production data.

## Game-Day Confidence release (2026-08-27)

The follow-up audit added visible, persistent sync state (protected count and last-sync time), immediate optimistic tap feedback, same-control double-tap suppression, and warnings before leaving with pending events. Undo now requires confirmation, can void only the latest active event under the script lock, and emits its own audit record. Finish explicitly describes its irreversible effect and builds the final report while holding the same lock used by event writers, preventing a concurrent device from slipping an event behind the official report.

The setup remains objective-focused and now summarizes only the three game-day essentials: matchup, available roster, and winning objectives. Existing client event IDs, local recovery, server deduplication, team/capability checks, completed-game write rejection, and action audit records remain in place. The production acceptance procedure is documented in `docs/LIVE_GAME_TWO_DEVICE_SMOKE_TEST.md`.
