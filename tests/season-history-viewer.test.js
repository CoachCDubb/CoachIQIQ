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
