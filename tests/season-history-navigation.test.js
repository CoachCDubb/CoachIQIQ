const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");

const read = file => fs.readFileSync(new URL(`../${file}`, `file://${__filename}`), "utf8");

test("season history is a dedicated protected page rather than a settings section", () => {
  const app = read("App.gs");
  const sidebar = read("Sidebar.html");
  const settings = read("Settings.html");
  const page = read("SeasonHistory.html");
  assert.match(app, /pageName === "SeasonHistory"/);
  assert.match(app, /SeasonHistory:capabilities\.indexOf\("manage_settings"\) >= 0/);
  assert.match(sidebar, /data-page="SeasonHistory"/);
  assert.doesNotMatch(settings, /id="seasonHistoryViewer"/);
  assert.match(page, /id="seasonHistoryViewer"/);
});

test("dedicated history page uses one active source and paginated records", () => {
  const scripts = read("Scripts.html");
  assert.match(scripts, /SeasonHistory:loadCoachIQSeasonHistoryPage/);
  assert.match(scripts, /pageSize:10/);
  assert.match(scripts, /records\.slice\(start,start\+size\)/);
  assert.match(scripts, /Page \$\{CoachIQSeasonHistoryView\.page\} of \$\{totalPages\}/);
});
