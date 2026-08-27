/**
 * Returns a read-only inventory of season-owned CoachIQ records. The viewer
 * exposes only allowlisted display fields; it never mutates or returns raw rows.
 */
function getCoachIQSeasonHistoryViewer(request) {
  requireStaffCapability_("manage_settings");
  request = request || {};
  const currentSeason = getCoachIQCurrentSeason_();
  const snapshots = COACHIQ_SEASON_SCOPED_SHEETS.map(function(sheetName) {
    const sheet = getCoachIQSpreadsheet_().getSheetByName(sheetName);
    if (!sheet || sheet.getLastRow() < 1) return {sheet: sheetName, headers: [], rows: []};
    const values = sheet.getDataRange().getDisplayValues();
    return {sheet: sheetName, headers: values.shift() || [], rows: values};
  });
  return buildCoachIQSeasonHistoryViewer_(snapshots, currentSeason, request.season);
}

/**
 * Public, display-safe columns for each historical source. This is intentionally
 * an allowlist: adding a sheet column never makes it visible automatically.
 */
const COACHIQ_SEASON_HISTORY_FIELDS = {
  "Sessions": ["Session ID", "Date", "Session Type", "Type", "Teams", "Status", "Created By", "Created", "Completed"],
  "Practice Evaluations": ["Session ID", "Player ID", "Evaluator", "Attendance", "Attendance Status", "Complete", "Created", "Last Updated"],
  "Culture Points": ["Point ID", "Player ID", "Category ID", "Reward ID", "Category Name", "Reward Name", "Points", "Awarded By", "Date", "Session ID"],
  "Player Season Stats": ["Player ID", "Stat", "Value"],
  "Games": ["Game ID", "Game Date", "Team", "Opponent", "Location", "Game Format", "Period Length", "Status", "Current Period", "Our Score", "Opponent Score", "Created By", "Created At", "Updated At", "Game Type", "Completed At", "Sport"]
};

/** Pure summary builder kept separate so read-only behavior is regression tested. */
function buildCoachIQSeasonHistoryViewer_(snapshots, currentSeason, requestedSeason) {
  const seasons = {};
  String(currentSeason || "").trim() && (seasons[String(currentSeason).trim()] = true);
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
    ? requested : (String(currentSeason || "").trim() || availableSeasons[0] || "");
  const sources = (snapshots || []).map(function(snapshot) {
    const headers = snapshot.headers || [];
    const seasonIndex = headers.indexOf("Season");
    const matchingRows = (snapshot.rows || []).filter(function(row) {
      // Schema-1 data belongs to the then-current season; migrated blank rows do not.
      return seasonIndex < 0
        ? selectedSeason === String(currentSeason || "").trim()
        : String(row[seasonIndex] || "").trim() === selectedSeason;
    });
    const allowed = COACHIQ_SEASON_HISTORY_FIELDS[snapshot.sheet] || [];
    const columns = allowed.filter(function(field) { return headers.indexOf(field) >= 0; });
    // Details require explicit row ownership. Untagged schemas and blank Season
    // values remain summary-only and can never leak into a historical season.
    const records = seasonIndex < 0 ? [] : matchingRows.map(function(row) {
      const record = {};
      columns.forEach(function(field) { record[field] = row[headers.indexOf(field)]; });
      return record;
    });
    return {
      sheet: snapshot.sheet,
      count: matchingRows.length,
      seasonTagged: seasonIndex >= 0,
      columns: columns,
      records: records
    };
  });
  return {
    readOnly: true,
    currentSeason: String(currentSeason || "").trim(),
    selectedSeason: selectedSeason,
    availableSeasons: availableSeasons,
    totalRecords: sources.reduce(function(total, source) { return total + source.count; }, 0),
    sources: sources,
    message: selectedSeason ? "Historical records are read only. Only explicitly approved fields are shown." : "No season history is available yet."
  };
}
