/************************************************
 * Player Season Stats Service
 ************************************************/

const PLAYER_SEASON_STATS_SHEET = "Player Season Stats";

/**
 * Returns every season stat.
 */
function getPlayerSeasonStats() {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SEASON_STATS_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  if(sheet.getLastRow() < 2){
    return [];
  }

  const data = sheet
    .getRange(
      2,
      1,
      sheet.getLastRow()-1,
      sheet.getLastColumn()
    )
    .getValues();

  return data.map(function(row){
    return rowToObject(headers,row);
  });

}
function getPlayerSeasonStatsByPlayer(playerId){

  const stats = getPlayerSeasonStats();

  const result = {};

  stats.forEach(function(stat){

    if(stat["Player ID"] == playerId){

      result[stat["Stat"]] = stat["Value"];

    }

  });

  return result;

}
function setPlayerStat(playerId, stat, value){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SEASON_STATS_SHEET);

  const data = sheet.getDataRange().getValues();

  for(let i = 1; i < data.length; i++){

    if(
      data[i][0] == playerId &&
      data[i][1] == stat
    ){

      sheet
        .getRange(i+1,3)
        .setValue(value);

      return;

    }

  }

  sheet.appendRow([
    playerId,
    stat,
    value
  ]);

}
/**
 * Rebuilds ALL player season stats.
 */
function rebuildPlayerSeasonStats(){
  const evaluations = getPracticeEvaluations();
  const players = getPlayers();
  const settings = getCoachIQSettings();
  const recentSessionIds = getRecentSessionIds(5);
  const recentSessionMap = {};
  recentSessionIds.forEach(function(sessionId){ recentSessionMap[String(sessionId)] = true; });
  const evaluationsByPlayer = {};
  evaluations.forEach(function(evaluation){
    const playerId = String(evaluation["Player ID"] || "");
    if(!evaluationsByPlayer[playerId]) evaluationsByPlayer[playerId] = [];
    evaluationsByPlayer[playerId].push(evaluation);
  });

  const averageFor_ = function(playerEvaluations, category){
    const values = playerEvaluations.map(function(evaluation){ return evaluation[category]; })
      .filter(function(value){ return value !== "" && value !== null && value !== undefined && isFinite(Number(value)); })
      .map(Number);
    return values.length ? Math.round(values.reduce(function(total,value){ return total + value; },0) / values.length * 10) / 10 : 0;
  };
  const rows = [];
  players.forEach(function(player){
    const playerId = String(player[0]);
    const playerEvaluations = evaluationsByPlayer[playerId] || [];
    const attendanceRecords = playerEvaluations.filter(function(evaluation){ return evaluation["Attendance"] === true || evaluation["Attendance"] === false; });
    const attended = attendanceRecords.filter(function(evaluation){ return evaluation["Attendance"] === true; }).length;
    const recentEvaluations = playerEvaluations.filter(function(evaluation){
      return evaluation["Complete"] === true && recentSessionMap[String(evaluation["Session ID"] || "")];
    });
    const categoryAverages = (settings.cultureCategories || []).map(function(category){ return averageFor_(recentEvaluations, category); })
      .filter(function(value){ return value > 0; });
    const cultureScore = categoryAverages.length
      ? Math.round(categoryAverages.reduce(function(total,value){ return total + value; },0) / categoryAverages.length * 10) / 10
      : 0;

    rows.push([playerId, "Practice Count", playerEvaluations.length]);
    rows.push([playerId, "Attendance %", attendanceRecords.length ? Math.round(attended / attendanceRecords.length * 100) : 0]);
    rows.push([playerId, "Effort Avg", averageFor_(playerEvaluations, "Effort")]);
    rows.push([playerId, "Toughness Avg", averageFor_(playerEvaluations, "Toughness")]);
    rows.push([playerId, "Accountability Avg", averageFor_(playerEvaluations, "Accountability")]);
    rows.push([playerId, "Leadership Avg", averageFor_(playerEvaluations, "Leadership")]);
    rows.push([playerId, "Culture Score", cultureScore]);
  });

  const sheet = getCoachIQSpreadsheet_().getSheetByName(PLAYER_SEASON_STATS_SHEET);
  if(!sheet) throw new Error("The Player Season Stats sheet was not found.");
  const previousDataRows = Math.max(0, sheet.getLastRow() - 1);
  if(rows.length){
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
  if(previousDataRows > rows.length){
    sheet.getRange(rows.length + 2, 1, previousDataRows - rows.length, 3).clearContent();
  }

}
function getPlayersForSession(sessionId){

  const evaluations = getSessionEvaluations(sessionId);

  const players = [];

  evaluations.forEach(function(e){

    Logger.log("Evaluation:");
    Logger.log(e);

    const player = getPlayer(e["Player ID"]);

    Logger.log("Player:");
    Logger.log(player);

    if(player){
      players.push(player);
    }

  });

  Logger.log(players);

  return players;

}
