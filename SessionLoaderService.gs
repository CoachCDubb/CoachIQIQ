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
  const allowedIds = {};
  players.forEach(function(player) { allowedIds[String(player["Player ID"] || player[0])] = true; });
  Object.keys(scores).forEach(function(playerId) { if (!allowedIds[String(playerId)]) delete scores[playerId]; });
  const rewards = getSessionRewards_(scores);
  const settings = getDropdownSettings();
  settings.rewards = rewards;

  // Force Apps Script to return plain JSON only.
  return JSON.parse(JSON.stringify({
    session: session,
    players: players,
    rewards: rewards,
    scores: scores,
    settings: settings
  }));

}

function getSessionRewards_(scores) {

  const activeRewards = getActiveRewards();
  const activeIds = {};
  const selectedValues = {};

  activeRewards.forEach(function(reward){
    activeIds[String(reward["Reward ID"])] = true;
  });

  Object.keys(scores).forEach(function(playerId){
    const selectedReward = scores[playerId].Reward;

    if(selectedReward){
      selectedValues[String(selectedReward)] = true;
    }
  });

  getPointAwards().forEach(function(reward){
    const rewardId = String(reward["Reward ID"] || "");
    const rewardName = String(reward["Reward Name"] || "");

    if(!activeIds[rewardId] &&
       (selectedValues[rewardId] || selectedValues[rewardName])){
      activeRewards.push(reward);
      activeIds[rewardId] = true;
    }
  });

  return activeRewards;

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

  return filterPlayersForCurrentStaff_(data)
    .filter(function(row){
      return wantedIds[String(row[0])] === true;
    })
    .map(function(row){
      return rowToObject(headers, row);
    });

}