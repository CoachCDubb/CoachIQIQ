/**
 * Returns a read-only inventory of season-owned CoachIQ records. The viewer
 * deliberately exposes summaries only; it never mutates or returns sheet rows.
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
    const count = (snapshot.rows || []).filter(function(row) {
      // Schema-1 data belongs to the then-current season; migrated blank rows do not.
      return seasonIndex < 0
        ? selectedSeason === String(currentSeason || "").trim()
        : String(row[seasonIndex] || "").trim() === selectedSeason;
    }).length;
    return {sheet: snapshot.sheet, count: count, seasonTagged: seasonIndex >= 0};
  });
  return {
    readOnly: true,
    currentSeason: String(currentSeason || "").trim(),
    selectedSeason: selectedSeason,
    availableSeasons: availableSeasons,
    totalRecords: sources.reduce(function(total, source) { return total + source.count; }, 0),
    sources: sources,
    message: selectedSeason ? "Historical records are shown as a read-only summary." : "No season history is available yet."
  };
}
