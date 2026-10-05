const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const client = fs.readFileSync("Scripts.html", "utf8");
const server = fs.readFileSync("GameService.gs", "utf8");
const analytics = fs.readFileSync("AnalyticsService.gs", "utf8");
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

test("pregame readiness stays focused on matchup, roster, and optional tools", () => {
  assert.match(view, /liveGameReadiness/);
  assert.match(client, /Pregame readiness/);
  assert.match(client, /Tonight's tools/);
});

test("game-day layout keeps controls compact and tap targets inside each card", () => {
  assert.match(view, /objective-tracker-game-tools/);
  assert.match(view, /objective-tracker-session-tools/);
  assert.match(view, /↻ Refresh/);
  assert.match(styles, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles, /\.objective-comparison \.objective-tap-buttons button\{min-width:0;width:100%/);
  assert.match(styles, /#liveTrackerWakeState:not\(\.attention\)\{display:none\}/);
});

test("live tracker shows a tap-updated winning targets chart", () => {
  assert.match(view, /liveWinningTargets/);
  assert.match(view, /Targets to hit/);
  assert.match(client, /function renderLiveWinningTargets/);
  assert.match(client, /role="progressbar"/);
  assert.match(client, /liveWinningTargetData_/);
  assert.match(styles, /\.live-winning-target-track/);
});

test("sport-aware opponent rosters are persistent, audited, and snapshotted", () => {
  assert.match(server, /LIVE_GAME_OPPONENTS_SHEET/);
  assert.match(server, /saveLiveGameOpponentRoster/);
  assert.match(server, /SAVE_OPPONENT_ROSTER/);
  assert.match(server, /Object\.prototype\.hasOwnProperty\.call\(presets/);
  assert.match(server, /Opponent Roster/);
  assert.match(client, /renderLiveGameOpponentRosterOptions/);
  assert.match(client, /opponentRoster:CoachIQ\.liveGame\.opponentRoster/);
  assert.match(view, /Paste roster/);
  ["Basketball","Football","Baseball","Soccer","Volleyball","Other"].forEach((sport) => assert.match(server, new RegExp(`"${sport}"`)));
});

test("timeout and halftime checkpoints provide a focused Coach Mode", () => {
  assert.match(view, /checkpointCoachMode/);
  assert.match(view, /checkpointKeepDoing/);
  assert.match(view, /checkpointFixNow/);
  assert.match(view, /checkpointRecentPulse/);
  assert.match(view, /checkpointTopAdjustment/);
  assert.match(server, /Timeout Coach Mode/);
  assert.match(server, /Halftime Coach Mode/);
  assert.match(server, /keepDoing:/);
  assert.match(server, /fixNow:/);
  assert.match(server, /recentPulse:/);
  assert.match(client, /Use for Second Half/);
  assert.match(styles, /checkpoint-coach-columns/);
});

test("possession tracking is always available and feeds pace-aware Coach Mode", () => {
  assert.match(view, /live-analytics/);
  assert.match(view, /Track Offense/);
  assert.match(view, /Track Defense/);
  assert.match(client, /finishLiveAnalyticsPossession/);
  assert.match(client, /recordLiveAnalyticsPossession/);
  assert.match(analytics, /buildLiveAnalyticsSummary_/);
  assert.match(server, /analytics\.offense\.possessions/);
  assert.match(server, /gameProgress/);
  assert.match(server, /paceTarget/);
  assert.match(view, /checkpointPossessionContext/);
  assert.match(styles, /\.live-analytics/);
});

test("Coach Mode ignores possession taps when describing recent priority events", () => {
  assert.match(server, /event\.eventType!==LIVE_GAME_POSSESSION_EVENT/);
  assert.match(server, /fixNow:rows\.filter\(function\(item\)\{return item\.status==="behind";/);
  assert.match(server, /Improve shot quality/);
});

test("Coach Mode describes recent tracked activity without implying a vague game pulse", () => {
  assert.match(view, /Recent tracked activity/);
  assert.doesNotMatch(view, /Recent game pulse/);
  assert.match(server, /Most common recent tag:/);
  assert.match(server, /at least 3 priority taps are needed/);
  assert.match(server, /there is not a clear recent trend yet/);
  assert.match(view, /checkpointRecommendationsWrap/);
  assert.match(client, /recommendationsWrap\.hidden=isCoachMode/);
});

test("desktop objective cards resize to keep up to twelve categories on one screen", () => {
  assert.match(client, /trackerElement\.dataset\.objectiveCount/);
  assert.match(client, /dense-objectives/);
  assert.match(styles, /height:calc\(100vh - 28px\)/);
  assert.match(styles, /data-objective-count="6"/);
  assert.match(styles, /data-objective-count="12"/);
  assert.match(styles, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles, /grid-template-rows:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(styles, /dense-objectives\{grid-template-rows:auto auto auto auto minmax\(0,1fr\) minmax\(66px,90px\)/);
  assert.match(styles, /dense-objectives \.objective-recent\{display:grid!important\}/);
});
