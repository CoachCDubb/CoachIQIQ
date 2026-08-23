/** Complete spreadsheet backups. Restore is deliberately manual. */
const COACHIQ_BACKUP_FOLDER = "CoachIQ Backups";
const COACHIQ_BACKUP_RETENTION = 10;
const COACHIQ_BACKUP_HANDLER = "runAutomaticCoachIQBackup";

function getCoachIQBackupStatus() {
  requireStaffCapability_("manage_settings");
  const p = PropertiesService.getScriptProperties();
  return {enabled: getCoachIQBackupTriggers_().length > 0, lastBackupAt: p.getProperty("COACHIQ_BACKUP_LAST_AT") || "", lastBackupReason: p.getProperty("COACHIQ_BACKUP_LAST_REASON") || "", lastError: p.getProperty("COACHIQ_BACKUP_LAST_ERROR") || "", retentionLimit: COACHIQ_BACKUP_RETENTION, folderName: COACHIQ_BACKUP_FOLDER};
}

function enableAutomaticCoachIQBackups() {
  requireStaffCapability_("manage_settings");
  PropertiesService.getScriptProperties().setProperty("COACHIQ_SPREADSHEET_ID", SpreadsheetApp.getActive().getId());
  const triggers = getCoachIQBackupTriggers_();
  if (!triggers.length) ScriptApp.newTrigger(COACHIQ_BACKUP_HANDLER).timeBased().everyDays(1).atHour(3).create();
  triggers.slice(1).forEach(function(trigger) { ScriptApp.deleteTrigger(trigger); });
  return createCoachIQBackup_("Automatic backups enabled");
}

function createCoachIQBackup() {
  requireStaffCapability_("manage_settings");
  return createCoachIQBackup_("Manual settings backup");
}

function runAutomaticCoachIQBackup() { return createCoachIQBackup_("Daily automatic backup"); }
function createCoachIQSafetyBackup_(reason) { return createCoachIQBackup_(String(reason || "Safety backup")); }

function createCoachIQBackup_(reason) {
  const properties = PropertiesService.getScriptProperties();
  try {
    const spreadsheetId = properties.getProperty("COACHIQ_SPREADSHEET_ID") || SpreadsheetApp.getActive().getId();
    properties.setProperty("COACHIQ_SPREADSHEET_ID", spreadsheetId);
    const folder = getCoachIQBackupFolder_();
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HHmmss");
    const safeReason = String(reason).replace(/[^a-z0-9 _-]/gi, "").trim().slice(0, 50) || "Backup";
    const copy = DriveApp.getFileById(spreadsheetId).makeCopy("CoachIQ Backup - " + stamp + " - " + safeReason, folder);
    copy.setDescription("CoachIQ protected spreadsheet backup. Reason: " + reason);
    properties.setProperties({COACHIQ_BACKUP_LAST_ID: copy.getId(), COACHIQ_BACKUP_LAST_AT: new Date().toISOString(), COACHIQ_BACKUP_LAST_REASON: reason, COACHIQ_BACKUP_LAST_ERROR: ""});
    pruneCoachIQBackups_(folder);
    try { logCoachIQAudit({action: "CREATE_SPREADSHEET_BACKUP", entityType: "Backup", entityId: copy.getId(), team: "", beforeValue: "", afterValue: {reason: reason, name: copy.getName()}, success: true, error: ""}); } catch (auditError) { console.error("Backup created, but audit logging failed: " + auditError.message); }
    return {created: true, id: copy.getId(), name: copy.getName(), createdAt: new Date().toISOString(), reason: reason, retentionLimit: COACHIQ_BACKUP_RETENTION};
  } catch (error) {
    properties.setProperty("COACHIQ_BACKUP_LAST_ERROR", String(error.message || error));
    throw new Error("CoachIQ could not create a safety backup. No protected operation was started. " + error.message);
  }
}

function getCoachIQBackupFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const id = properties.getProperty("COACHIQ_BACKUP_FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (error) { /* Recreate an unavailable folder. */ } }
  const folders = DriveApp.getFoldersByName(COACHIQ_BACKUP_FOLDER);
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(COACHIQ_BACKUP_FOLDER);
  properties.setProperty("COACHIQ_BACKUP_FOLDER_ID", folder.getId());
  return folder;
}

function pruneCoachIQBackups_(folder) {
  const files = [], iterator = folder.getFiles();
  while (iterator.hasNext()) {
    const file = iterator.next();
    if (file.getName().indexOf("CoachIQ Backup - ") === 0) files.push(file);
  }
  files.sort(function(a, b) { return b.getDateCreated().getTime() - a.getDateCreated().getTime(); });
  files.slice(COACHIQ_BACKUP_RETENTION).forEach(function(file) { file.setTrashed(true); });
}

function getCoachIQBackupTriggers_() {
  return ScriptApp.getProjectTriggers().filter(function(trigger) { return trigger.getHandlerFunction() === COACHIQ_BACKUP_HANDLER; });
}