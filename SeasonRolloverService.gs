/** Sheets that will receive explicit season ownership in schema version 2. */
const COACHIQ_SEASON_SCOPED_SHEETS = [
  "Sessions",
  "Practice Evaluations",
  "Culture Points",
  "Player Season Stats",
  "Games"
];

/**
 * Builds a read-only Head Coach preview. This function never writes a setting,
 * sheet, trigger, backup, player, or operational record.
 */
function getCoachIQSeasonRolloverPreview(request) {
  requireStaffCapability_("manage_settings");
  request = request || {};
  const settings = getCoachIQSettings();
  const currentSeason = String(settings.currentSeason || "").trim();
  const nextSeason = String(request.nextSeason || "").trim();
  if (!nextSeason) throw new Error("Enter the new season before building a preview.");
  if (nextSeason.length > 40) throw new Error("The season name must be 40 characters or fewer.");

  const spreadsheet = getCoachIQSpreadsheet_();
  const promoteGrades = request.promoteGrades !== false;
  const archiveSeniors = request.archiveSeniors === true;
  const players = getPlayers().filter(function(player) {
    return String(player[7] || "") !== "Archived";
  });
  const playerPlan = buildSeasonPlayerPlan_(players, {
    promoteGrades: promoteGrades,
    archiveSeniors: archiveSeniors
  });
  const schemaPlan = COACHIQ_SEASON_SCOPED_SHEETS.map(function(sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      return {sheet: sheetName, exists: false, rows: 0, hasSeasonColumn: false, action: "Create or repair before rollover"};
    }
    const lastColumn = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0]
      .map(function(header) { return String(header || "").trim(); });
    const hasSeasonColumn = headers.indexOf("Season") >= 0;
    return {
      sheet: sheetName,
      exists: true,
      rows: Math.max(sheet.getLastRow() - 1, 0),
      hasSeasonColumn: hasSeasonColumn,
      action: hasSeasonColumn ? "Ready" : "Add Season column and backfill " + currentSeason
    };
  });

  const coreErrors = evaluateCoachIQSchema_(spreadsheet, getInstalledCoachIQSchemaVersion_()).filter(function(check) {
    return check.status === "error";
  });
  const backupTriggers = typeof getCoachIQBackupTriggers_ === "function"
    ? getCoachIQBackupTriggers_() : [];
  const properties = PropertiesService.getScriptProperties();
  const blockers = [];
  if (!currentSeason) blockers.push("Current Season is not configured in Program Settings.");
  if (nextSeason === currentSeason) blockers.push("The new season must be different from the current season.");
  if (coreErrors.length) blockers.push("Repair System Health errors before rollover.");
  if (!backupTriggers.length) blockers.push("Enable daily protected backups before rollover.");
  schemaPlan.filter(function(item) { return !item.exists; }).forEach(function(item) {
    blockers.push(item.sheet + " is required for season migration.");
  });

  return {
    readOnly: true,
    currentSeason: currentSeason,
    nextSeason: nextSeason,
    currentSchemaVersion: getInstalledCoachIQSchemaVersion_(),
    targetSchemaVersion: COACHIQ_SCHEMA_VERSION,
    migrationRequired: schemaPlan.some(function(item) { return !item.hasSeasonColumn; }),
    readyForMigration: blockers.length === 0,
    blockers: blockers,
    backup: {
      enabled: backupTriggers.length > 0,
      lastBackupAt: properties.getProperty("COACHIQ_BACKUP_LAST_AT") || ""
    },
    options: {promoteGrades: promoteGrades, archiveSeniors: archiveSeniors},
    playerSummary: {
      activePlayers: players.length,
      promoted: playerPlan.filter(function(item) { return item.action === "Promote"; }).length,
      archived: playerPlan.filter(function(item) { return item.action === "Archive"; }).length,
      unchanged: playerPlan.filter(function(item) { return item.action === "Keep"; }).length
    },
    playerPlan: playerPlan,
    schemaPlan: schemaPlan,
    message: "Preview only. CoachIQ did not change production data."
  };
}

/**
 * Applies schema version 2 only. It does not change Current Season, promote or
 * archive players, reset totals, or delete historical rows.
 */
function migrateCoachIQSeasonSchema(request) {
  requireStaffCapability_("manage_settings");
  request = request || {};
  const settings = getCoachIQSettings();
  const currentSeason = String(settings.currentSeason || "").trim();
  if (!currentSeason) throw new Error("Current Season is required before migration.");
  if (String(request.expectedCurrentSeason || "").trim() !== currentSeason) {
    throw new Error("Current Season changed after the preview. Build a new preview before migrating.");
  }
  if (String(request.confirmation || "") !== "PREPARE SEASON HISTORY") {
    throw new Error("Migration confirmation was not accepted.");
  }
  if (!getCoachIQBackupTriggers_().length) {
    throw new Error("Enable daily protected backups before migration.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const installedSchemaVersion = getInstalledCoachIQSchemaVersion_();
    const spreadsheet = getCoachIQSpreadsheet_();
    const healthErrors = evaluateCoachIQSchema_(spreadsheet, installedSchemaVersion).filter(function(check) {
      return check.status === "error";
    });
    if (healthErrors.length) throw new Error("Repair System Health errors before migration.");

    const backup = createCoachIQSafetyBackup_("Before season schema migration");
    const report = [];
    COACHIQ_SEASON_SCOPED_SHEETS.forEach(function(sheetName) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) throw new Error(sheetName + " is required for season migration.");
      let headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
        .getDisplayValues()[0]
        .map(function(header) { return String(header || "").trim(); });
      let seasonColumn = headers.indexOf("Season") + 1;
      let addedColumn = false;
      if (!seasonColumn) {
        seasonColumn = sheet.getLastColumn() + 1;
        sheet.getRange(1, seasonColumn).setValue("Season");
        addedColumn = true;
      }
      const rowCount = Math.max(sheet.getLastRow() - 1, 0);
      let backfilled = 0;
      if (rowCount) {
        const range = sheet.getRange(2, seasonColumn, rowCount, 1);
        const values = range.getValues();
        values.forEach(function(row) {
          if (!String(row[0] || "").trim()) {
            row[0] = currentSeason;
            backfilled++;
          }
        });
        if (backfilled) range.setValues(values);
      }
      report.push({sheet: sheetName, addedSeasonColumn: addedColumn, rows: rowCount, backfilled: backfilled});
    });

    setSettingValues_({"CoachIQ Schema Version": String(COACHIQ_SCHEMA_VERSION)});
    try {
      logCoachIQAudit({
        action: "MIGRATE_SEASON_SCHEMA",
        entityType: "System Schema",
        entityId: "SCHEMA-" + COACHIQ_SCHEMA_VERSION,
        team: "",
        beforeValue: {schemaVersion: installedSchemaVersion, season: currentSeason},
        afterValue: {schemaVersion: COACHIQ_SCHEMA_VERSION, season: currentSeason, report: report, backupId: backup.id},
        success: true,
        error: ""
      });
    } catch (auditError) {
      console.error("Schema migrated, but audit logging failed: " + auditError.message);
    }
    return {
      migrated: true,
      schemaVersion: COACHIQ_SCHEMA_VERSION,
      currentSeason: currentSeason,
      backup: backup,
      report: report,
      message: "Season history is prepared. Current Season and player records were not changed."
    };
  } finally {
    lock.releaseLock();
  }
}

/** Pure roster projection used by preview and regression tests. */
function buildSeasonPlayerPlan_(players, options) {
  options = options || {};
  const promoteGrades = options.promoteGrades !== false;
  const archiveSeniors = options.archiveSeniors === true;
  return (players || []).map(function(player) {
    const currentGrade = String(player[4] == null ? "" : player[4]).trim();
    const numericGrade = /^\d+$/.test(currentGrade) ? Number(currentGrade) : null;
    let nextGrade = currentGrade;
    let nextStatus = String(player[7] || "Active");
    let action = "Keep";
    if (numericGrade === 12 && archiveSeniors) {
      nextStatus = "Archived";
      action = "Archive";
    } else if (promoteGrades && numericGrade >= 9 && numericGrade <= 11) {
      nextGrade = String(numericGrade + 1);
      action = "Promote";
    }
    return {
      playerId: String(player[0] || ""),
      name: (String(player[1] || "") + " " + String(player[2] || "")).trim(),
      team: String(player[5] || ""),
      currentGrade: currentGrade,
      nextGrade: nextGrade,
      currentStatus: String(player[7] || ""),
      nextStatus: nextStatus,
      action: action
    };
  });
}

function getCoachIQCurrentSeason_() {
  return String(getCoachIQSettings().currentSeason || "").trim();
}

/** Adds Current Season to a pending row only when the schema has that column. */
function setCoachIQSeasonOnRow_(headers, row, season) {
  const seasonIndex = (headers || []).indexOf("Season");
  if (seasonIndex >= 0) row[seasonIndex] = String(season || "").trim();
  return row;
}
