/** CoachIQ release and schema metadata shown in Settings and diagnostics. */
const COACHIQ_BUILD_VERSION = "2026.08.24.1";
const COACHIQ_SCHEMA_VERSION = 2;
const COACHIQ_AUDIT_REQUIRED_HEADERS = [
  "Audit ID", "Timestamp", "User Email", "Staff Name", "Staff Role",
  "Action", "Entity Type", "Entity ID", "Program", "Team",
  "Before Value", "After Value", "Success", "Error"
];

const COACHIQ_REQUIRED_SCHEMA = {
  "Players": ["Player ID", "First Name", "Last Name", "Team", "Position", "Status"],
  "Sessions": ["Session ID", "Session Type", "Date", "Teams", "Evaluators", "Status"],
  "Practice Evaluations": ["Session ID", "Player ID", "Attendance", "Complete"],
  "Culture Points": ["Player ID", "Points"],
  "Settings": [],
  "Audit Log": COACHIQ_AUDIT_REQUIRED_HEADERS
};

/** Returns Head Coach diagnostics without mutating production data. */
function getCoachIQSystemHealth() {
  requireStaffCapability_("manage_settings");
  const spreadsheet = getCoachIQSpreadsheet_();
  const installedSchemaVersion = getInstalledCoachIQSchemaVersion_();
  const checks = evaluateCoachIQSchema_(spreadsheet, installedSchemaVersion);
  const properties = PropertiesService.getScriptProperties();
  const access = getCurrentStaffAccess_();
  let profiles = [];
  try { profiles = JSON.parse(getSetting("Staff Profiles") || "[]"); } catch (error) { profiles = []; }
  const verifiedStaff = Array.isArray(profiles)
    ? profiles.filter(function(profile) { return String(profile.email || "").trim(); })
    : [];

  checks.unshift({
    id: "release",
    label: "Application release",
    status: "pass",
    detail: "Build " + COACHIQ_BUILD_VERSION + " · Installed schema " + installedSchemaVersion + " · Target " + COACHIQ_SCHEMA_VERSION
  });
  checks.push({
    id: "schema-version",
    label: "Season schema version",
    status: installedSchemaVersion >= COACHIQ_SCHEMA_VERSION ? "pass" : "warning",
    detail: installedSchemaVersion >= COACHIQ_SCHEMA_VERSION
      ? "Season-aware schema is installed."
      : "Protected migration to schema " + COACHIQ_SCHEMA_VERSION + " is available in Season rollover preview."
  });
  checks.push({
    id: "web-entry",
    label: "Web-app entry point",
    status: typeof doGet === "function" ? "pass" : "error",
    detail: typeof doGet === "function"
      ? "Dialog and web app share the Index build."
      : "The deployed iPad/web app has no source-controlled doGet entry point."
  });
  checks.push({
    id: "staff-access",
    label: "Staff access control",
    status: verifiedStaff.length ? "pass" : "warning",
    detail: verifiedStaff.length
      ? verifiedStaff.length + " staff account(s) have verified email access."
      : "Setup mode is active. Add staff emails before broader program use."
  });

  const backupTriggers = typeof getCoachIQBackupTriggers_ === "function"
    ? getCoachIQBackupTriggers_() : [];
  const backupError = properties.getProperty("COACHIQ_BACKUP_LAST_ERROR") || "";
  checks.push({
    id: "backups",
    label: "Protected backups",
    status: backupError ? "error" : backupTriggers.length ? "pass" : "warning",
    detail: backupError || (backupTriggers.length
      ? "Daily backup trigger is enabled."
      : "Daily backup protection is not enabled.")
  });
  checks.push({
    id: "signed-in-user",
    label: "Current administrator",
    status: access.name || !access.configured ? "pass" : "warning",
    detail: access.name
      ? access.name + " · " + access.role
      : access.configured ? "The signed-in account is not assigned to staff." : "Owner setup mode"
  });

  const counts = checks.reduce(function(result, check) {
    result[check.status] = (result[check.status] || 0) + 1;
    return result;
  }, {pass: 0, warning: 0, error: 0});

  return {
    status: counts.error ? "error" : counts.warning ? "warning" : "healthy",
    buildVersion: COACHIQ_BUILD_VERSION,
    schemaVersion: installedSchemaVersion,
    targetSchemaVersion: COACHIQ_SCHEMA_VERSION,
    checkedAt: new Date().toISOString(),
    spreadsheetName: spreadsheet.getName(),
    counts: counts,
    checks: checks
  };
}

function getInstalledCoachIQSchemaVersion_() {
  const value = Number(getSetting("CoachIQ Schema Version") || 1);
  return Number.isInteger(value) && value > 0 ? value : 1;
}

/** Pure schema inspection helper used by production diagnostics and tests. */
function evaluateCoachIQSchema_(spreadsheet, schemaVersion) {
  const checks = [];
  schemaVersion = Number(schemaVersion || 1);
  const requiredSchema = {};
  Object.keys(COACHIQ_REQUIRED_SCHEMA).forEach(function(sheetName) {
    requiredSchema[sheetName] = COACHIQ_REQUIRED_SCHEMA[sheetName].slice();
  });
  if (schemaVersion >= 2) {
    requiredSchema["Player Season Stats"] = ["Player ID", "Stat", "Value"];
    requiredSchema["Games"] = ["Game ID"];
  }
  const seasonScoped = ["Sessions", "Practice Evaluations", "Culture Points", "Player Season Stats", "Games"];
  Object.keys(requiredSchema).forEach(function(sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      checks.push({id: "sheet-" + sheetName, label: sheetName, status: "error", detail: "Required sheet is missing."});
      return;
    }
    const requiredHeaders = requiredSchema[sheetName].slice();
    if (schemaVersion >= 2 && seasonScoped.indexOf(sheetName) >= 0) requiredHeaders.push("Season");
    if (!requiredHeaders.length) {
      checks.push({id: "sheet-" + sheetName, label: sheetName, status: "pass", detail: "Required sheet is available."});
      return;
    }
    const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
      .getDisplayValues()[0]
      .map(function(header) { return String(header || "").trim(); });
    const missing = requiredHeaders.filter(function(header) { return headers.indexOf(header) === -1; });
    checks.push({
      id: "sheet-" + sheetName,
      label: sheetName,
      status: missing.length ? "error" : "pass",
      detail: missing.length ? "Missing column(s): " + missing.join(", ") : "Required columns are valid."
    });
  });
  return checks;
}
