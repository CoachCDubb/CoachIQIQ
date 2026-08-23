const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function loadScript(fileName, globals = {}) {
  const context = vm.createContext(Object.assign({console}, globals));
  vm.runInContext(fs.readFileSync(path.join(ROOT, fileName), "utf8"), context, {
    filename: fileName
  });
  return context;
}

test("player trend labels account for both level and direction", () => {
  const service = loadScript("InsightService.gs");
  const cases = [
    {scores: [], average: "-", trend: "No trend yet", movement: null},
    {scores: [5], average: 5, trend: "Baseline", movement: 0},
    {scores: [5, 5], average: 5, trend: "Consistently Strong", movement: 0},
    {scores: [5, 4], average: 4.5, trend: "Strong — Trending Down", movement: -1},
    {scores: [4, 3], average: 3.5, trend: "Trending Down", movement: -1},
    {scores: [3, 2], average: 2.5, trend: "Needs Attention", movement: -1},
    {scores: [2, 2], average: 2, trend: "Needs Attention", movement: 0},
    {scores: [3, 3], average: 3, trend: "Holding Steady", movement: 0},
    {scores: [3, 4], average: 3.5, trend: "Improving", movement: 1}
  ];

  cases.forEach((expected) => {
    const actual = service.buildPlayerTrendSummary_(expected.scores);
    assert.equal(actual.average, expected.average, JSON.stringify(expected.scores));
    assert.equal(actual.trend, expected.trend, JSON.stringify(expected.scores));
    assert.equal(actual.movement, expected.movement, JSON.stringify(expected.scores));
    assert.equal(actual.sampleSize, expected.scores.length);
  });
});

test("player history uses the newest completed rows for that player", () => {
  const rows = [
    ["Session ID", "Player ID", "Complete", "Leadership", "Effort", "Attendance"],
    ["PS001", "P100", true, 2, 3, true],
    ["PS002", "P200", true, 5, 5, true],
    ["PS003", "P100", false, 1, 1, true],
    ["PS004", "P100", "TRUE", 4, 4, true],
    ["PS005", "P100", true, 5, 4, true]
  ];
  const sheet = {
    getLastColumn: () => rows[0].length,
    getRange: () => ({getValues: () => [rows[0]]}),
    getDataRange: () => ({getValues: () => rows})
  };
  const service = loadScript("InsightService.gs", {
    SpreadsheetApp: {getActive: () => ({getSheetByName: () => sheet})},
    getColumnMap: () => ({
      "Session ID": 1, "Player ID": 2, Complete: 3,
      Leadership: 4, Effort: 5, Attendance: 6
    }),
    getCoachIQSettings: () => ({cultureCategories: ["Leadership", "Effort"]})
  });

  const history = service.getPlayerHistory("P100", 2);
  assert.equal(history.length, 2);
  assert.equal(history[0].sessionId, "PS005");
  assert.equal(history[1].sessionId, "PS004");
  assert.deepEqual(Array.from(history[0].pillars && Object.values(history[0].pillars)), [5, 4]);
});

test("profile and leaderboard Panther Point totals share one contract", () => {
  const service = loadScript("CulturePointsService.gs");
  assert.deepEqual(
    JSON.parse(JSON.stringify(service.combinePlayerPointTotals_(7, 10, 3, 12))),
    {total: 19, positive: 22, negative: 3, culturePoints: 7, evaluationPoints: 12}
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(service.combinePlayerPointTotals_(-2, 1, 3, 0))),
    {total: -2, positive: 1, negative: 3, culturePoints: -2, evaluationPoints: 0}
  );
});
