const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "..", "SeasonRolloverService.gs"), "utf8");

function load(globals = {}) {
  const context = vm.createContext(Object.assign({console}, globals));
  vm.runInContext(source, context, {filename: "SeasonRolloverService.gs"});
  return context;
}

test("rollover roster plan promotes grades and archives seniors only when selected", () => {
  const service = load();
  const players = [
    ["P1", "A", "Nine", "", 9, "Varsity", "", "Active"],
    ["P2", "B", "Junior", "", "11", "Varsity", "", "Active"],
    ["P3", "C", "Senior", "", 12, "Varsity", "", "Active"],
    ["P4", "D", "Other", "", "College", "Varsity", "", "Active"]
  ];
  const plan = service.buildSeasonPlayerPlan_(players, {promoteGrades: true, archiveSeniors: true});
  assert.deepEqual(Array.from(plan, (item) => item.action), ["Promote", "Promote", "Archive", "Keep"]);
  assert.equal(plan[0].nextGrade, "10");
  assert.equal(plan[1].nextGrade, "12");
  assert.equal(plan[2].nextStatus, "Archived");
  assert.equal(plan[3].nextGrade, "College");

  const noPromotion = service.buildSeasonPlayerPlan_(players, {promoteGrades: false, archiveSeniors: false});
  assert.ok(noPromotion.every((item) => item.action === "Keep"));
});

test("rollover preview is read-only and reports schema-v2 preparation", () => {
  let writes = 0;
  const headers = {
    Sessions: ["Session ID", "Status"],
    "Practice Evaluations": ["Session ID", "Player ID", "Complete"],
    "Culture Points": ["Player ID", "Points"],
    "Player Season Stats": ["Player ID", "Stat", "Value"],
    Games: ["Game ID", "Status"]
  };
  const sheets = Object.fromEntries(Object.entries(headers).map(([name, row]) => [name, {
    getLastColumn: () => row.length,
    getLastRow: () => 4,
    getRange: () => ({getDisplayValues: () => [row], setValue: () => { writes++; }})
  }]));
  const service = load({
    COACHIQ_SCHEMA_VERSION: 1,
    COACHIQ_NEXT_SCHEMA_VERSION: 2,
    requireStaffCapability_: () => {},
    getCoachIQSettings: () => ({currentSeason: "2026-2027"}),
    getCoachIQSpreadsheet_: () => ({getSheetByName: (name) => sheets[name] || null}),
    getPlayers: () => [["P1", "Alex", "Player", "", 11, "Varsity", "", "Active"]],
    evaluateCoachIQSchema_: () => [],
    getCoachIQBackupTriggers_: () => [{}],
    PropertiesService: {getScriptProperties: () => ({getProperty: () => "2026-08-23T12:00:00.000Z"})}
  });
  const preview = service.getCoachIQSeasonRolloverPreview({nextSeason: "2027-2028", promoteGrades: true});
  assert.equal(preview.readOnly, true);
  assert.equal(preview.migrationRequired, true);
  assert.equal(preview.readyForMigration, true);
  assert.equal(preview.playerSummary.promoted, 1);
  assert.equal(preview.schemaPlan.length, 5);
  assert.equal(writes, 0);
});
