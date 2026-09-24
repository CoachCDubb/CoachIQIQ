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

test("scouting storage enforces access, bounds, and spreadsheet safety", () => {
  const service = read("ScoutingService.gs");
  assert.match(service, /requireStaffCapability_\("run_sessions"\)/);
  assert.match(service, /requireScoutingTeamAccess_\(team\)/);
  assert.match(service, /sections\.length > 20/);
  assert.match(service, /content,5000/);
  assert.match(service, /\^\[=\+\\-@\]/);
});
