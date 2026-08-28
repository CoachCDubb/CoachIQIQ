const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const client = fs.readFileSync("Scripts.html", "utf8");
const server = fs.readFileSync("GameService.gs", "utf8");
const view = fs.readFileSync("Game.html", "utf8");
const styles = fs.readFileSync("Styles.html", "utf8");

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
  assert.match(client, /shouldBlockLiveGameTap_/);
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

test("plan adjustments re-read status and append history inside the shared mutation lock", () => {
  const adjustmentPath = server.slice(server.indexOf("function saveLiveGamePlanAdjustment"), server.indexOf("function buildLiveGameCheckpointReport_"));
  assert.match(adjustmentPath, /LockService\.getScriptLock\(\)/);
  assert.match(adjustmentPath, /const current=findLiveGameRecord_\(gameId\)/);
  assert.match(adjustmentPath, /current\.game\.Status/);
  assert.match(adjustmentPath, /adjustments\.push\(adjustment\)/);
  assert.ok(adjustmentPath.indexOf("current.game.Status") < adjustmentPath.indexOf("adjustments.push(adjustment)"));
});

test("pregame readiness stays focused on matchup, roster, and objectives", () => {
  assert.match(view, /liveGameReadiness/);
  assert.match(client, /Pregame readiness/);
  assert.match(client, /Focused plan/);
});

test("game-day layout keeps controls compact and tap targets inside each card", () => {
  assert.match(view, /objective-tracker-game-tools/);
  assert.match(view, /objective-tracker-session-tools/);
  assert.match(view, /↻ Refresh/);
  assert.match(styles, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.objective-comparison \.objective-tap-buttons button\{min-width:0;width:100%/);
  assert.match(styles, /#liveTrackerWakeState:not\(\.attention\)\{display:none\}/);
});
