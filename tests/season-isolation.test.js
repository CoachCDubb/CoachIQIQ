const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("current-season isolation is wired into every current operational view", () => {
  const contracts = {
    "DashboardService.gs": ["currentSessionRows", "filterCoachIQRowsForCurrentSeason_(evaluationHeaders", "filterCoachIQRowsForCurrentSeason_(cultureHeaders"],
    "CulturePointsService.gs": ["filterCoachIQRowsForCurrentSeason_(headers,data)", "filterCoachIQRowsForCurrentSeason_(pointHeaders,pointValues)"],
    "AttendanceService.gs": ["isCoachIQRowInSeason_(headers,row,currentSeason)"],
    "SessionHistoryService.gs": ["filterCoachIQRowsForCurrentSeason_(headers,data)", "filterCoachIQRowsForCurrentSeason_(evaluationHeaders,evaluationData)"],
    "PracticeSessionService.gs": ["isCoachIQRowInSeason_(headers,data[i],currentSeason)"],
    "EvaluationService.gs": ["filterCoachIQRowsForCurrentSeason_(headers,data)"],
    "InsightService.gs": ["filterCoachIQRowsForCurrentSeason_(headers,data)", "isCoachIQRowInSeason_(headers,row,currentSeason)"],
    "GameService.gs": ["filterCoachIQRowsForCurrentSeason_(headers,values)"]
  };
  Object.entries(contracts).forEach(([file, required]) => {
    const source = read(file);
    required.forEach((fragment) => assert.ok(source.includes(fragment), `${file} is missing ${fragment}`));
  });
});

test("the season helper treats a migrated blank or prior-season row as non-current", () => {
  const source = read("SeasonRolloverService.gs");
  assert.match(source, /function isCoachIQRowInSeason_/);
  assert.match(source, /seasonIndex < 0 \|\| String/);
  assert.match(source, /function filterCoachIQRowsForCurrentSeason_/);
});
