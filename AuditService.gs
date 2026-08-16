/**
 * Writes append-only CoachIQ audit events to the Audit Log sheet.
 */
const AUDIT_SHEET = "Audit Log";
const AUDIT_HEADERS = [
  "Audit ID", "Timestamp", "User Email", "Staff Name", "Staff Role",
  "Action", "Entity Type", "Entity ID", "Program", "Team",
  "Before Value", "After Value", "Success", "Error"
];

function logCoachIQAudit(event) {
  event = event || {};
  const sheet = SpreadsheetApp.getActive().getSheetByName(AUDIT_SHEET);
  if (!sheet) {
    throw new Error("The Audit Log sheet was not found.");
  }

  validateAuditHeaders_(sheet);

  const access = typeof getCurrentStaffAccess_ === "function"
    ? getCurrentStaffAccess_()
    : {};
  const settings = typeof getCoachIQSettings === "function"
    ? getCoachIQSettings()
    : {};
  const now = new Date();
  const auditId = "AUD-" + Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    "yyyyMMdd-HHmmss"
  ) + "-" + Utilities.getUuid().slice(0, 8).toUpperCase();

  const row = [
    auditId,
    now,
    Session.getActiveUser().getEmail() || access.email || "",
    access.name || "",
    access.role || "",
    auditValue_(event.action),
    auditValue_(event.entityType),
    auditValue_(event.entityId),
    auditValue_(settings.programName),
    auditValue_(event.team),
    auditValue_(event.beforeValue),
    auditValue_(event.afterValue),
    event.success !== false,
    auditValue_(event.error)
  ];

  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);
  try {
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }

  return auditId;
}

function validateAuditHeaders_(sheet) {
  const actual = sheet.getRange(1, 1, 1, AUDIT_HEADERS.length)
    .getDisplayValues()[0]
    .map(function(header) { return String(header || "").trim(); });

  AUDIT_HEADERS.forEach(function(expected, index) {
    if (actual[index] !== expected) {
      throw new Error(
        "Audit Log column " + (index + 1) + " must be '" + expected +
        "' but is '" + actual[index] + "'."
      );
    }
  });
}

function auditValue_(value) {
  if (value === null || value === undefined) {
    return "";
  }
  let text;
  if (typeof value === "object") {
    try {
      text = JSON.stringify(value);
    } catch (error) {
      text = String(value);
    }
  } else {
    text = String(value);
  }
  text = text.slice(0, 5000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

/**
 * Run this manually once. It should append exactly one TEST_AUDIT row.
 */
function testCoachIQAudit() {
  return logCoachIQAudit({
    action: "TEST_AUDIT",
    entityType: "System",
    entityId: "AUDIT-TEST",
    team: "",
    beforeValue: "",
    afterValue: "Audit service connected",
    success: true,
    error: ""
  });
}
