const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {execFileSync, spawnSync} = require("node:child_process");
const os = require("node:os");
const path = require("node:path");

const tool = path.resolve("tools/compare_apps_script_sources.py");
const run = (args) => JSON.parse(execFileSync("python3", [tool, ...args], {encoding: "utf8"}));

test("source reconciliation comparison is read-only and reports source drift", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coachiq-source-"));
  const baseline = path.join(root, "baseline");
  const candidate = path.join(root, "candidate");
  fs.mkdirSync(baseline);
  fs.mkdirSync(candidate);
  fs.writeFileSync(path.join(baseline, "App.gs"), "function oldVersion() {}\n");
  fs.writeFileSync(path.join(baseline, "Index.html"), "<main>same</main>\n");
  fs.writeFileSync(path.join(candidate, "App.gs"), "function liveVersion() {}\n");
  fs.writeFileSync(path.join(candidate, "Index.html"), "<main>same</main>\n");
  fs.writeFileSync(path.join(candidate, "LiveOnly.gs"), "const liveOnly = true;\n");
  fs.writeFileSync(path.join(candidate, "notes.txt"), "not Apps Script source\n");

  const before = fs.readdirSync(candidate).sort();
  const report = run(["--baseline", baseline, "--candidate", candidate]);
  assert.deepEqual(report.different, ["App.gs"]);
  assert.deepEqual(report.identical, ["Index.html"]);
  assert.deepEqual(report.onlyInCandidate, ["LiveOnly.gs"]);
  assert.deepEqual(fs.readdirSync(candidate).sort(), before);
});

test("strict comparison blocks an unexplained difference", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "coachiq-source-strict-"));
  const baseline = path.join(root, "baseline");
  const candidate = path.join(root, "candidate");
  fs.mkdirSync(baseline);
  fs.mkdirSync(candidate);
  fs.writeFileSync(path.join(baseline, "App.gs"), "old\n");
  fs.writeFileSync(path.join(candidate, "App.gs"), "new\n");
  const result = spawnSync("python3", [tool, "--baseline", baseline, "--candidate", candidate, "--require-match"]);
  assert.equal(result.status, 1);
});
