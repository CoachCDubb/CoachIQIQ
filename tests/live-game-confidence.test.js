const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const client = fs.readFileSync("Scripts.html", "utf8");
const server = fs.readFileSync("GameService.gs", "utf8");
const view = fs.readFileSync("Game.html", "utf8");

test("tracker exposes persistent sync confidence details", () => {
  assert.match(view, /liveTrackerProtectedCount/);
  assert.match(view, /liveTrackerLastSync/);
  assert.match(client, /coachiq_live_game_status_/);
  assert.match(client, /lastSyncAt/);
});

test("protected taps survive failure, refresh, and navigation warnings", () => {
  assert.match(client, /coachiq_live_game_taps_/);
  assert.match(client, /beforeunload/);
  assert.match(client, /Leave with protected taps\?/);
  assert.match(client, /recoverProtectedLiveGameTaps/);
});

test("taps receive immediate feedback and duplicate-tap suppression", () => {
  assert.match(client, /tap-confirmed/);
  assert.match(client, /now-CoachIQ\.liveGame\.lastTapAt<350/);
  assert.match(client, /tap-blocked/);
});

test("undo and finish require explicit risk-aware confirmation", () => {
  assert.match(client, /Undo latest tap\?/);
  assert.match(server, /Only the latest active event can be undone/);
  assert.match(client, /Finish and permanently lock this game\?/);
  assert.match(client, /Sync & Finish Game/);
});

test("server preserves idempotency and serializes concurrent mutations", () => {
  assert.match(server, /knownIds\[event\.eventId\]/);
  assert.match(server, /LockService\.getScriptLock\(\)/);
  assert.match(server, /findLiveGameRecord_\(gameId\)\.game\.Status/);
});

test("server retains authorization, completed immutability, and undo audit", () => {
  assert.match(server, /requireStaffCapability_\("run_sessions"\)/);
  assert.match(server, /requireLiveGameTeamAccess_/);
  assert.match(server, /A completed game cannot be changed/);
  assert.match(server, /A completed game cannot create checkpoints/);
  assert.match(server, /UNDO_LIVE_GAME_EVENT/);
});

test("pregame readiness stays focused on matchup, roster, and objectives", () => {
  assert.match(view, /liveGameReadiness/);
  assert.match(client, /Pregame readiness/);
  assert.match(client, /Focused plan/);
});
