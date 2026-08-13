/**
 * ======================================
 * Session Loader Service
 * ======================================
 */

function getSessionViewData(sessionId, useEvaluationPlayers) {

  const session = getPracticeSession(sessionId);

  if (!session) {
    throw new Error("Session not found: " + sessionId);
  }

  const teams = String(session["Teams"] || "")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const scores = getEvaluationScores(sessionId);
  const players = useEvaluationPlayers
    ? getPlayersByIdsForSession_(Object.keys(scores))
    : getPlayersByTeams(teams);
  const rewards = getActiveRewards();
  const settings = getDropdownSettings();

  // Force Apps Script to return plain JSON only.
  return JSON.parse(JSON.stringify({
    session: session,
    players: players,
    rewards: rewards,
    scores: scores,
    settings: settings
  }));

}

function getPlayersByIdsForSession_(playerIds) {

  if (!playerIds.length) {
    return [];
  }

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Players");
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return [];
  }

  const headers = data.shift();
  const wantedIds = {};

  playerIds.forEach(function(playerId){
    wantedIds[String(playerId)] = true;
  });

  return data
    .filter(function(row){
      return wantedIds[String(row[0])] === true;
    })
    .map(function(row){
      return rowToObject(headers, row);
    });

}
