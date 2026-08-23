const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function load(fileName, globals) {
  const context = vm.createContext(Object.assign({console}, globals || {}));
  vm.runInContext(fs.readFileSync(path.join(ROOT, fileName), "utf8"), context, {filename: fileName});
  return context;
}

function sheet(headers) {
  return {
    getLastColumn: () => headers.length,
    getRange: () => ({getDisplayValues: () => [headers]})
  };
}

test("schema diagnostics identify missing sheets and columns", () => {
  const auditHeaders = [
    "Audit ID", "Timestamp", "User Email", "Staff Name", "Staff Role",
    "Action", "Entity Type", "Entity ID", "Program", "Team",
    "Before Value", "After Value", "Success", "Error"
  ];
  const sheets = {
    Players: sheet(["Player ID", "First Name", "Last Name", "Team", "Position", "Status"]),
    Sessions: sheet(["Session ID", "Session Type", "Date", "Teams", "Evaluators", "Status"]),
    "Practice Evaluations": sheet(["Session ID", "Player ID", "Attendance"]),
    "Culture Points": sheet(["Player ID", "Points"]),
    Settings: sheet(["Setting", "Value"])
  };
  const service = load("SystemHealthService.gs");
  const checks = service.evaluateCoachIQSchema_({getSheetByName: (name) => sheets[name] || null});
  const evaluations = checks.find((check) => check.label === "Practice Evaluations");
  const audit = checks.find((check) => check.label === "Audit Log");
  assert.equal(evaluations.status, "error");
  assert.match(evaluations.detail, /Complete/);
  assert.equal(audit.status, "error");
  assert.match(audit.detail, /sheet is missing/i);
});

test("schema diagnostics pass a valid core workbook", () => {
  const auditHeaders = [
    "Audit ID", "Timestamp", "User Email", "Staff Name", "Staff Role",
    "Action", "Entity Type", "Entity ID", "Program", "Team",
    "Before Value", "After Value", "Success", "Error"
  ];
  const sheets = {
    Players: sheet(["Player ID", "First Name", "Last Name", "Team", "Position", "Status"]),
    Sessions: sheet(["Session ID", "Session Type", "Date", "Teams", "Evaluators", "Status"]),
    "Practice Evaluations": sheet(["Session ID", "Player ID", "Attendance", "Complete"]),
    "Culture Points": sheet(["Player ID", "Points"]),
    Settings: sheet(["Setting", "Value"]),
    "Audit Log": sheet(auditHeaders)
  };
  const service = load("SystemHealthService.gs");
  const checks = service.evaluateCoachIQSchema_({getSheetByName: (name) => sheets[name] || null});
  assert.equal(checks.length, 6);
  assert.ok(checks.every((check) => check.status === "pass"));
});

test("dialog and web entry points render the same Index template", () => {
  const renders = [];
  const output = {
    setTitle(value) { this.title = value; return this; },
    setWidth(value) { this.width = value; return this; },
    setHeight(value) { this.height = value; return this; }
  };
  const context = load("App.gs", {
    HtmlService: {
      createTemplateFromFile(name) {
        renders.push(name);
        return {evaluate: () => output};
      },
      createHtmlOutputFromFile: () => ({getContent: () => ""})
    },
    SpreadsheetApp: {getUi: () => ({showModalDialog: () => {}, createMenu: () => ({addItem() { return this; }, addToUi() {}})})}
  });
  assert.equal(context.doGet(), output);
  context.launchCoachIQ();
  assert.deepEqual(renders, ["Index", "Index"]);
  assert.equal(output.title, "CoachIQ");
  assert.equal(output.width, 1600);
  assert.equal(output.height, 900);
});
