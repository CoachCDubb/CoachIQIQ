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

test("new schema-v2 rows receive Current Season without shifting existing columns", () => {
  const service = load();
  const row = ["ID-1", "Existing value", ""];
  const result = service.setCoachIQSeasonOnRow_(["ID", "Value", "Season"], row, "2027-2028");
  assert.equal(result, row);
  assert.deepEqual(Array.from(result), ["ID-1", "Existing value", "2027-2028"]);
  const legacy = ["ID-2", "Existing value"];
  service.setCoachIQSeasonOnRow_(["ID", "Value"], legacy, "2027-2028");
  assert.deepEqual(Array.from(legacy), ["ID-2", "Existing value"]);
});

test("season filtering isolates current records and remains legacy compatible", () => {
  const service = load({getCoachIQSettings: () => ({currentSeason: "2027-2028"})});
  const headers = ["ID", "Season"];
  const rows = [["current", "2027-2028"], ["old", "2026-2027"], ["blank", ""]];
  assert.deepEqual(
    Array.from(service.filterCoachIQRowsForCurrentSeason_(headers, rows), (row) => row[0]),
    ["current"]
  );
  assert.equal(service.isCoachIQRowInSeason_(["ID"], ["legacy"], "2027-2028"), true);
  assert.equal(service.isCoachIQRowInSeason_(headers, rows[1], "2027-2028"), false);
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
    getInstalledCoachIQSchemaVersion_: () => 1,
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

function migrationSheet(initialHeaders, initialSeasonValues) {
  const state = {headers: initialHeaders.slice(), seasons: initialSeasonValues.slice()};
  return {
    state,
    getLastColumn: () => state.headers.length,
    getLastRow: () => state.seasons.length + 1,
    getRange(row, column, rowCount) {
      return {
        getDisplayValues: () => row === 1 ? [state.headers.slice()] : [],
        setValue(value) {
          if (row === 1) state.headers[column - 1] = value;
        },
        getValues: () => Array.from({length: rowCount}, (_, index) => [state.seasons[index] || ""]),
        setValues(values) {
          values.forEach((value, index) => { state.seasons[index] = value[0]; });
        }
      };
    }
  };
}

test("protected schema migration is blank-only and idempotent", () => {
  const sheetNames = ["Sessions", "Practice Evaluations", "Culture Points", "Player Season Stats", "Games"];
  const sheets = Object.fromEntries(sheetNames.map((name) => [name, migrationSheet(["ID"], ["", "2025-2026"])]));
  let backups = 0;
  let schemaSetting = "1";
  const service = load({
    COACHIQ_SCHEMA_VERSION: 2,
    requireStaffCapability_: () => {},
    getCoachIQSettings: () => ({currentSeason: "2026-2027"}),
    getCoachIQBackupTriggers_: () => [{}],
    LockService: {getScriptLock: () => ({waitLock: () => {}, releaseLock: () => {}})},
    getInstalledCoachIQSchemaVersion_: () => Number(schemaSetting),
    getCoachIQSpreadsheet_: () => ({getSheetByName: (name) => sheets[name] || null}),
    evaluateCoachIQSchema_: () => [],
    createCoachIQSafetyBackup_: () => ({id: "backup-" + (++backups)}),
    setSettingValues_: (updates) => { schemaSetting = updates["CoachIQ Schema Version"]; },
    logCoachIQAudit: () => "AUD-1"
  });
  const request = {expectedCurrentSeason: "2026-2027", confirmation: "PREPARE SEASON HISTORY"};
  const first = service.migrateCoachIQSeasonSchema(request);
  assert.equal(first.schemaVersion, 2);
  assert.ok(first.report.every((item) => item.addedSeasonColumn && item.backfilled === 1));
  sheetNames.forEach((name) => {
    assert.deepEqual(sheets[name].state.headers, ["ID", "Season"]);
    assert.deepEqual(sheets[name].state.seasons, ["2026-2027", "2025-2026"]);
  });

  const second = service.migrateCoachIQSeasonSchema(request);
  assert.ok(second.report.every((item) => !item.addedSeasonColumn && item.backfilled === 0));
  assert.equal(backups, 2);
  assert.equal(schemaSetting, "2");
});
