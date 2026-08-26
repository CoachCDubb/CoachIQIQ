const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "..", "SeasonHistoryViewerService.gs"), "utf8");
const context = vm.createContext({console});
vm.runInContext(source, context, {filename: "SeasonHistoryViewerService.gs"});

const cases = [
  ["Sessions", ["Session ID", "Date", "Status"], ["s1", "2025-10-01", "Completed"]],
  ["Practice Evaluations", ["Session ID", "Player ID", "Attendance Status"], ["s1", "p1", "Present"]],
  ["Culture Points", ["Point ID", "Player ID", "Points"], ["c1", "p1", "5"]],
  ["Player Season Stats", ["Player ID", "Stat", "Value"], ["p1", "Effort", "4.5"]],
  ["Games", ["Game ID", "Opponent", "Our Score"], ["g1", "Tigers", "72"]]
];

for (const [sheet, fields, values] of cases) {
  test(`${sheet} returns its safe drill-down fields`, () => {
    const result = context.buildCoachIQSeasonHistoryViewer_([
      {sheet, headers: [...fields, "Season"], rows: [[...values, "2025-26"]]}
    ], "2026-27", "2025-26");
    assert.deepEqual(Array.from(result.sources[0].columns), fields);
    assert.deepEqual({...result.sources[0].records[0]}, Object.fromEntries(fields.map((field, index) => [field, values[index]])));
  });
}

test("drill-down strictly excludes rows from other seasons and blank legacy rows", () => {
  const result = context.buildCoachIQSeasonHistoryViewer_([{sheet:"Sessions", headers:["Session ID", "Season"], rows:[["old", "2025-26"], ["new", "2026-27"], ["blank", ""]]}], "2026-27", "2025-26");
  assert.deepEqual(Array.from(result.sources[0].records, record => record["Session ID"]), ["old"]);
  assert.equal(result.sources[0].count, 1);
});

test("legacy untagged sheets remain summary-only", () => {
  const result = context.buildCoachIQSeasonHistoryViewer_([{sheet:"Sessions", headers:["Session ID"], rows:[["legacy"]]}], "2026-27", "2026-27");
  assert.equal(result.sources[0].count, 1);
  assert.deepEqual(Array.from(result.sources[0].records), []);
});

test("sensitive report, note, plan, and raw fields are always omitted", () => {
  const forbidden = ["Private Notes", "Notes", "Final Report", "Tracking Plan", "Active Tracking Plan", "Plan Adjustments", "Raw Report", "Opaque Data"];
  const result = context.buildCoachIQSeasonHistoryViewer_([{sheet:"Games", headers:["Game ID", ...forbidden, "Season"], rows:[["g1", ...forbidden.map(() => "SECRET"), "2025-26"]]}], "2026-27", "2025-26");
  assert.deepEqual(Array.from(result.sources[0].columns), ["Game ID"]);
  assert.deepEqual(Object.keys(result.sources[0].records[0]), ["Game ID"]);
  assert.doesNotMatch(JSON.stringify(result.sources[0].records), /SECRET/);
});

test("unknown sheets and newly added columns are denied by default", () => {
  const result = context.buildCoachIQSeasonHistoryViewer_([
    {sheet:"Sessions", headers:["Session ID", "Surprise Column", "Season"], rows:[["s1", "hidden", "2025-26"]]},
    {sheet:"Future Data", headers:["Public Looking Field", "Season"], rows:[["hidden", "2025-26"]]}
  ], "2026-27", "2025-26");
  assert.deepEqual(Array.from(result.sources[0].columns), ["Session ID"]);
  assert.deepEqual(Array.from(result.sources[1].columns), []);
  assert.deepEqual(Object.keys(result.sources[1].records[0]), []);
});
