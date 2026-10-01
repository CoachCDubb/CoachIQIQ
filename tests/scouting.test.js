const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("scouting is a protected, preloaded workspace", () => {
  const app = read("App.gs");
  const sidebar = read("Sidebar.html");
  const scripts = read("Scripts.html");
  assert.match(app, /pageName === "Scouting"\) requireStaffCapability_\("run_sessions"\)/);
  assert.match(app, /Scouting:capabilities\.indexOf\("run_sessions"\) >= 0/);
  assert.match(sidebar, /data-page="Scouting" data-capability="run_sessions"/);
  assert.match(scripts, /Scouting:loadScouting/);
});

test("scouting provides requested defaults and customizable sections", () => {
  const html = read("Scouting.html");
  const scripts = read("Scripts.html");
  ["Our Offense", "Our Defense", "Opponent Offense", "Opponent Defense", "Opponent Tendencies", "Matchups", "Special Situations"].forEach(label => assert.match(scripts, new RegExp(label)));
  assert.match(html, /Keys to victory/);
  assert.match(html, /\+ Custom section/);
  assert.match(scripts, /function moveScoutingSection/);
  assert.match(scripts, /function removeScoutingSection/);
});

test("scouting uses program identity for team labels and branded printing", () => {
  const html = read("Scouting.html");
  const service = read("ScoutingService.gs");
  const scripts = read("Scripts.html");
  const styles = read("Styles.html");
  assert.match(html, /scoutingPrintLogo/);
  assert.match(html, /scoutingPrintProgram/);
  assert.match(service, /logoUrl:settings\.logoUrl/);
  assert.match(service, /primaryColor:settings\.primaryColor/);
  assert.match(scripts, /school\+" — "\+team/);
  assert.match(scripts, /function updateScoutingPrintHeader_/);
  assert.match(styles, /\.scouting-print-masthead\{display:flex/);
  assert.match(styles, /print-color-adjust:exact/);
});

test("school identity qualifies squad-only team names in scouting and Live Game", () => {
  const gameService = read("GameService.gs");
  const scripts = read("Scripts.html");
  assert.match(gameService, /schoolName:settings\.schoolName/);
  assert.match(scripts, /function liveGameTeamDisplayName_/);
  assert.match(scripts, /function scoutingTeamDisplayName_/);
  assert.match(scripts, /school\+" — "\+team/);
  assert.match(scripts, /liveTrackerTeam"\)\.textContent=liveGameTeamDisplayName_/);
});

test("scouting storage enforces access, bounds, and spreadsheet safety", () => {
  const service = read("ScoutingService.gs");
  assert.match(service, /requireStaffCapability_\("run_sessions"\)/);
  assert.match(service, /requireScoutingTeamAccess_\(team\)/);
  assert.match(service, /sections\.length > 20/);
  assert.match(service, /content,5000/);
  assert.match(service, /\^\[=\+\\-@\]/);
});

test("selected scouting priorities become focused Live Game objectives", () => {
  const html = read("Scouting.html");
  const service = read("ScoutingService.gs");
  const scripts = read("Scripts.html");
  assert.match(html, /Send to Live Game/);
  assert.match(scripts, /Track this in Live Game/);
  assert.match(scripts, /function sendScoutingPlanToLiveGame/);
  assert.match(scripts, /pendingScoutingPlan/);
  assert.match(service, /function sendScoutingReportToLiveGame/);
  assert.match(service, /section\.tracking&&section\.tracking\.enabled/);
  assert.match(service, /cleanLiveGameTrackingPlan_\(objectives\)/);
  assert.match(service, /Scout: /);
});

test("scouting export creates IDs accepted by Live Game validation", () => {
  const scoutingService = read("ScoutingService.gs");
  const gameService = read("GameService.gs");
  assert.match(gameService, /\^objective_\[a-z0-9_\]\{1,75\}\$/);
  assert.match(scoutingService, /id:"objective_scout_"\+safeId/);
  assert.ok(scoutingService.includes('replace(/[^a-z0-9_]/g,"_")'));
  assert.doesNotMatch(scoutingService, /id:"scout_"/);
});

test("send to Live Game applies returned objectives without waiting for template reload", () => {
  const scripts = read("Scripts.html");
  assert.match(scripts, /function applyPendingScoutingPlan_/);
  assert.match(scripts, /pending\.objectives&&pending\.objectives\.length/);
  assert.match(scripts, /CoachIQ\.liveGame\.objectives=cloneLiveGamePlan/);
  assert.match(scripts, /templates\.push\(template\)/);
  assert.match(scripts, /liveGameTemplateSelect/);
  assert.match(scripts, /Scouting game plan loaded with/);
});
