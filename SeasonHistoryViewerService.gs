const COACHIQ_SEASON_HISTORY_DETAIL_LIMIT = 250;

/**
 * Returns read-only, display-safe season summaries and drill-down records.
 * This endpoint performs no writes and never returns notes, audit fields, or
 * opaque game-report JSON.
 */
function getCoachIQSeasonHistoryViewer(request) {
  requireStaffCapability_("manage_settings");
  request = request || {};
  const requestedSeason = String(request.season || "").trim();
  if (requestedSeason.length > 40) throw new Error("The season name must be 40 characters or fewer.");
  const spreadsheet = getCoachIQSpreadsheet_();
  const snapshots = COACHIQ_SEASON_SCOPED_SHEETS.map(function(sheetName) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 1) return {sheet: sheetName, headers: [], rows: []};
    const values = sheet.getDataRange().getDisplayValues();
    return {sheet: sheetName, headers: values.shift() || [], rows: values};
  });
  const playerSheet = spreadsheet.getSheetByName("Players");
  const playerValues = playerSheet && playerSheet.getLastRow() >= 1
    ? playerSheet.getDataRange().getDisplayValues() : [];
  const playerHeaders = playerValues.shift() || [];
  return buildCoachIQSeasonHistoryViewer_(
    snapshots,
    getCoachIQCurrentSeason_(),
    requestedSeason,
    {headers: playerHeaders, rows: playerValues}
  );
}

/** Pure summary/detail builder kept separate for regression testing. */
function buildCoachIQSeasonHistoryViewer_(snapshots, currentSeason, requestedSeason, playersSnapshot) {
  const seasons = {};
  const current = String(currentSeason || "").trim();
  if (current) seasons[current] = true;
  (snapshots || []).forEach(function(snapshot) {
    const seasonIndex = (snapshot.headers || []).indexOf("Season");
    if (seasonIndex < 0) return;
    (snapshot.rows || []).forEach(function(row) {
      const season = String(row[seasonIndex] || "").trim();
      if (season) seasons[season] = true;
    });
  });
  const availableSeasons = Object.keys(seasons).sort().reverse();
  const requested = String(requestedSeason || "").trim();
  const selectedSeason = requested && seasons[requested]
    ? requested : (current || availableSeasons[0] || "");
  const playerNames = buildCoachIQSeasonHistoryPlayerNames_(playersSnapshot);
  const sources = (snapshots || []).map(function(snapshot) {
    const headers = snapshot.headers || [];
    const seasonIndex = headers.indexOf("Season");
    const rows = (snapshot.rows || []).filter(function(row) {
      return seasonIndex < 0 ? selectedSeason === current
        : String(row[seasonIndex] || "").trim() === selectedSeason;
    });
    return {sheet: snapshot.sheet, count: rows.length, seasonTagged: seasonIndex >= 0,
      records: buildCoachIQSeasonHistoryRecords_(snapshot.sheet, headers, rows, playerNames)};
  });
  return {
    readOnly: true,
    currentSeason: current,
    selectedSeason: selectedSeason,
    availableSeasons: availableSeasons,
    totalRecords: sources.reduce(function(total, source) { return total + source.count; }, 0),
    sources: sources,
    detailLimit: COACHIQ_SEASON_HISTORY_DETAIL_LIMIT,
    message: selectedSeason ? "Historical records are read only. CoachIQ did not change production data." : "No season history is available yet."
  };
}

function buildCoachIQSeasonHistoryPlayerNames_(snapshot) {
  snapshot = snapshot || {headers: [], rows: []};
  const idIndex = snapshot.headers.indexOf("Player ID");
  const firstIndex = snapshot.headers.indexOf("First Name");
  const lastIndex = snapshot.headers.indexOf("Last Name");
  const names = {};
  (snapshot.rows || []).forEach(function(row) {
    const id = idIndex >= 0 ? String(row[idIndex] || "") : "";
    const name = [firstIndex >= 0 ? row[firstIndex] : "", lastIndex >= 0 ? row[lastIndex] : ""]
      .map(function(value) { return String(value || "").trim(); }).filter(Boolean).join(" ");
    if (id) names[id] = name || id;
  });
  return names;
}

/** Projects whitelisted display fields; raw rows and private notes never leave the server. */
function buildCoachIQSeasonHistoryRecords_(sheetName, headers, rows, playerNames) {
  const value = function(row, header) {
    const index = headers.indexOf(header);
    return index >= 0 ? String(row[index] || "") : "";
  };
  const name = function(row) {
    const id = value(row, "Player ID");
    return playerNames[id] || id || "Unknown player";
  };
  return rows.slice(0, COACHIQ_SEASON_HISTORY_DETAIL_LIMIT).map(function(row) {
    if (sheetName === "Sessions") return {
      primary: value(row, "Session Name") || value(row, "Name") || value(row, "Session ID") || "Session",
      secondary: value(row, "Date") || value(row, "Session Date") || value(row, "Created"),
      facts: [value(row, "Type") || value(row, "Session Type"), value(row, "Teams"), value(row, "Status")].filter(Boolean)
    };
    if (sheetName === "Practice Evaluations") {
      const ignored = {"Session ID":true,"Player ID":true,"Evaluator":true,"Attendance":true,"Attendance Status":true,"Created":true,"Last Updated":true,"Complete":true,"Season":true};
      const scores = row.map(function(cell, index) { return ignored[headers[index]] || String(cell).trim() === "" ? NaN : Number(cell); })
        .filter(function(score) { return isFinite(score); });
      const average = scores.length ? Math.round(scores.reduce(function(sum, score) { return sum + score; }, 0) / scores.length * 10) / 10 : "";
      return {primary: name(row), secondary: value(row, "Session ID"), facts: [value(row, "Attendance Status") || (value(row, "Attendance") === "TRUE" ? "Present" : ""), average === "" ? "" : "Average " + average, value(row, "Complete") === "TRUE" ? "Complete" : "In progress"].filter(Boolean)};
    }
    if (sheetName === "Culture Points") return {
      primary: name(row), secondary: value(row, "Reward Name") || value(row, "Category Name") || "Culture points",
      facts: [(value(row, "Points") || "0") + " points", value(row, "Date") || value(row, "Created")].filter(Boolean)
    };
    if (sheetName === "Player Season Stats") return {
      primary: name(row), secondary: value(row, "Stat") || "Season statistic", facts: [value(row, "Value")].filter(Boolean)
    };
    if (sheetName === "Games") return {
      primary: value(row, "Opponent") ? "vs " + value(row, "Opponent") : value(row, "Game ID") || "Game",
      secondary: value(row, "Game Date"), facts: [value(row, "Team"), value(row, "Location"), value(row, "Status"),
        value(row, "Our Score") || value(row, "Opponent Score") ? (value(row, "Our Score") || "0") + "–" + (value(row, "Opponent Score") || "0") : ""].filter(Boolean)
    };
    return {primary: sheetName, secondary: "", facts: []};
  });
}
