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

## Coach convenience follow-up (2026-08-27)

The tracker now asks supported mobile browsers to keep the screen awake, provides subtle haptic confirmation, shows online/offline state, retries protected activity when connectivity returns, and refreshes the shared server view when a coach returns to the app. A manual **Refresh shared view** action gives staff a simple way to reconcile two-device activity without leaving the focused tracker. These are progressive enhancements: unsupported wake-lock or vibration APIs do not block tracking.

### Recommended next validation and product work

1. Run the production two-device test across the actual iOS Safari, Android Chrome, and managed-tablet versions used by staff, including screen lock, app switching, low-power mode, and captive-portal Wi-Fi.
2. Add an Apps Script integration harness backed by a disposable spreadsheet. Current Node coverage verifies client decisions and source contracts, but cannot prove Google lock timing, sheet writes, or active-user authorization.
3. Measure real game tap cadence before changing the 350 ms accidental-tap window. Rapid scoring workflows may need a coach-configurable threshold or a per-objective exception.
4. Observe sync latency and Apps Script quota/error rates during a full game. If batches regularly exceed the current interaction window, add exponential retry backoff and lightweight operational telemetry without adding tracker clutter.
5. Conduct an accessibility pass with VoiceOver/TalkBack and an outdoor/bright-gym usability check, especially for status colors, touch targets, and confirmation language.

## Game-day visual refinement (2026-08-28)

The desktop tracker hierarchy was tightened after an in-dialog review: routine game tools and session-ending actions are now visually grouped, healthy connection and wake-lock labels stay out of the way, sync information reads as one calm status line, and comparison-card tap buttons use bounded equal-width grids so they cannot overlap the neighboring objective. Mobile layouts stack these groups deliberately rather than squeezing every action into one row.

## Final concurrency closure (2026-08-28)

Plan adjustment was the last mutation path that checked completed status before, rather than inside, the shared script lock. It now re-reads the game, re-validates team access and completed status, derives the next plan from the latest adjustment history, and appends the change while holding the same lock as event writes and Finish. This prevents a second device from losing an adjustment or changing the active plan while another device completes the game.
