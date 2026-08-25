const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "..", "SeasonHistoryViewerService.gs"), "utf8");
const context = vm.createContext({console});
vm.runInContext(source, context, {filename: "SeasonHistoryViewerService.gs"});

test("season history summary discovers seasons and counts only the selection", () => {
  const result = context.buildCoachIQSeasonHistoryViewer_([
    {sheet: "Sessions", headers: ["ID", "Season"], rows: [["1", "2025-26"], ["2", "2026-27"], ["3", ""]]},
    {sheet: "Games", headers: ["ID", "Season"], rows: [["g1", "2025-26"], ["g2", "2025-26"]]}
  ], "2026-27", "2025-26");
  assert.deepEqual(Array.from(result.availableSeasons), ["2026-27", "2025-26"]);
  assert.equal(result.selectedSeason, "2025-26");
  assert.equal(result.totalRecords, 3);
  assert.deepEqual(Array.from(result.sources, item => item.count), [1, 2]);
  assert.equal(result.readOnly, true);
});

test("legacy sheets are summarized only for the current season", () => {
  const snapshots = [{sheet: "Sessions", headers: ["ID"], rows: [["1"], ["2"]]}];
  assert.equal(context.buildCoachIQSeasonHistoryViewer_(snapshots, "2026-27", "2026-27").totalRecords, 2);
  assert.equal(context.buildCoachIQSeasonHistoryViewer_(snapshots, "2026-27", "missing").selectedSeason, "2026-27");
});

test("drill-down projects safe fields and resolves player names", () => {
  const result = context.buildCoachIQSeasonHistoryViewer_([
    {sheet: "Practice Evaluations", headers: ["Session ID", "Player ID", "Attendance Status", "Effort", "Execution", "Notes", "Season"], rows: [["S1", "P1", "Present", "4", "2", "private", "2025-26"]]},
    {sheet: "Games", headers: ["Game ID", "Game Date", "Team", "Opponent", "Location", "Status", "Our Score", "Opponent Score", "Final Report", "Season"], rows: [["G1", "02/01/2026", "Varsity", "Central", "Home", "Completed", "61", "55", "private json", "2025-26"]]}
  ], "2026-27", "2025-26", {headers: ["Player ID", "First Name", "Last Name"], rows: [["P1", "Avery", "Jones"]]});
  const evaluation = result.sources[0].records[0];
  const game = result.sources[1].records[0];
  assert.equal(evaluation.primary, "Avery Jones");
  assert.ok(Array.from(evaluation.facts).includes("Average 3"));
  assert.equal(JSON.stringify(result).includes("private"), false);
  assert.equal(game.primary, "vs Central");
  assert.ok(Array.from(game.facts).includes("61–55"));
});

test("drill-down caps returned records while preserving the full count", () => {
  const rows = Array.from({length: 300}, (_, index) => ["S" + index, "2025-26"]);
  const result = context.buildCoachIQSeasonHistoryViewer_([{sheet: "Sessions", headers: ["Session ID", "Season"], rows}], "2026-27", "2025-26", {headers: [], rows: []});
  assert.equal(result.sources[0].count, 300);
  assert.equal(result.sources[0].records.length, 250);
});
