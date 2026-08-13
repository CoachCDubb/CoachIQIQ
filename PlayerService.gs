/**
 * ======================================
 * Player Service
 * ======================================
 */

const PLAYER_SHEET = "Players";

/**
 * Returns every player.
 */
function getPlayers() {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SHEET);

  const values = sheet.getDataRange().getValues();

  values.shift();

  return values;

}
/**
 * Returns all players as JSON.
 */
function getPlayersForUI() {

  return getPlayers().filter(player => player[7] !== "Archived");

}
/**
 * Updates an existing player.
 */
function updatePlayer(player) {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SHEET);

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (data[i][0] == player.id) {

      sheet.getRange(i + 1, 2).setValue(player.firstName);
      sheet.getRange(i + 1, 3).setValue(player.lastName);
      sheet.getRange(i + 1, 4).setValue(player.jersey);
      sheet.getRange(i + 1, 5).setValue(player.grade);
      sheet.getRange(i + 1, 6).setValue(player.team);
      sheet.getRange(i + 1, 7).setValue(player.position);
      sheet.getRange(i + 1, 8).setValue(player.status);

      return;

    }

  }

}
/**
 * Returns the next available Player ID.
 */
function getNextPlayerId() {

  const players = getPlayers();

  if (players.length === 0) {
    return "P001";
  }

  const lastId = players[players.length - 1][0];

  const number = parseInt(lastId.replace("P", ""), 10) + 1;

  return "P" + String(number).padStart(3, "0");

}
/**
 * Adds a new player.
 */
function addPlayer(player) {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SHEET);

  sheet.appendRow([
    player.id,
    player.firstName,
    player.lastName,
    player.jersey,
    player.grade,
    player.team,
    player.position,
    player.status
  ]);

}
/**
 * Archives a player.
 */
function archivePlayer(playerId) {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SHEET);

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (data[i][0] == playerId) {

      // Column 8 = Status
      sheet.getRange(i + 1, 8).setValue("Archived");

      return;

    }

  }

}
function getPlayersByTeams(selectedTeams){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  const cols = getColumnMap("Players");

  const data = sheet
    .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
    .getValues();

  return data
    .filter(function(row){

      return selectedTeams.includes(
               row[cols["Team"] - 1]
             ) &&
             row[cols["Status"] - 1] === "Active";

    })
    .map(function(row){

      return rowToObject(headers,row);

    });

}
/**
 * Returns a player by Player ID.
 */
function getPlayer(playerId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  if (sheet.getLastRow() < 2) {
  return null;
}
  const data = sheet
    .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
    .getValues();

  for(let i = 0; i < data.length; i++){

    const player = rowToObject(headers,data[i]);

    if(player["Player ID"] == playerId){

      return player;

    }

  }

  return null;

}
function testGetPlayer(){

  Logger.log(

    JSON.stringify(

      getPlayer("P001"),

      null,

      2

    )

  );

}
/**
 * Returns complete player data for the profile.
 */
function getPlayerProfile(playerId){

  const insight = getPlayerInsight(playerId);

  const seasonStats = getPlayerSeasonStatsByPlayer(playerId);

  const trend = insight.trend;

let strongestCategory = "";
let weakestCategory = "";

let highest = -1;
let lowest = 999;

Object.keys(trend).forEach(function(category){

  const avg = Number(trend[category].average);

  if(isNaN(avg)){
    return;
  }

  if(avg > highest){
    highest = avg;
    strongestCategory = category;
  }

  if(avg < lowest){
    lowest = avg;
    weakestCategory = category;
  }

});

  const settings = getCoachIQSettings();

const maxScore =
  settings.maxCategoryScore ||
  settings.maxScore ||
  5;

const overallScore = calculateOverallPlayerGrade(playerId);

return {

  player: insight.player,

  attendance: insight.attendance,

  trend: insight.trend,

  history: insight.history,

  timeline: insight.timeline,

  summary: insight.summary,

  season: seasonStats,

strengths: {
  strongest: strongestCategory,
  weakest: weakestCategory,
  strongestScore: highest,
  weakestScore: lowest
},

  overallGrade: Number(overallScore.toFixed(1)),

  overallLabel:
overallScore >= 4.5 ? "Elite" :
overallScore >= 4.0 ? "Excellent" :
overallScore >= 3.5 ? "Very Good" :
overallScore >= 3.0 ? "Good" :
overallScore >= 2.5 ? "Developing" :
overallScore >= 2.0 ? "Needs Improvement" :
"Critical",

overallStars:
Math.round(overallScore),

maxScore: maxScore,

  points: {
    total: getPlayerPoints(playerId),
    positive: getPositivePoints(playerId),
    negative: getNegativePoints(playerId),
    breakdown: getPointBreakdown(playerId),
    history: getPointHistory(playerId)
  }

};

}
function calculateOverallPlayerGrade(playerId){

  const trend = calculatePlayerTrend(playerId, 5);

  const values = Object.values(trend)
    .filter(t => typeof t.average === "number")
    .map(t => t.average);

  if(values.length === 0){
    return 0;
  }

  return Number(
    (
      values.reduce((a,b)=>a+b,0) /
      values.length
    ).toFixed(1)
  );

}
function testPlayerProfile(){

  Logger.log(

    JSON.stringify(

      getPlayerProfile("P001"),

      null,

      2

    )

  );

}
function updatePlayerSeasonStats(sessionId){

  Logger.log("Rebuilding Player Season Stats");

  const evaluationData = getPracticeEvaluations();

  Logger.log(evaluationData);

}
function testOverallGrades(){

  Logger.log("P001: " + calculateOverallPlayerGrade("P001"));
  Logger.log("P002: " + calculateOverallPlayerGrade("P002"));
  Logger.log("P003: " + calculateOverallPlayerGrade("P003"));

}
