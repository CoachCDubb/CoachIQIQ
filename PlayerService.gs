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
 * Validates and imports a roster in one batch without overwriting players.
 */
function importPlayers(roster) {

  if (!Array.isArray(roster) || roster.length === 0) {
    throw new Error("No players were provided for import.");
  }

  if (roster.length > 500) {
    throw new Error("A roster import is limited to 500 players at a time.");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(PLAYER_SHEET);

    if (!sheet) {
      throw new Error("The Players sheet was not found.");
    }

    const cols = getColumnMap(PLAYER_SHEET);
    ["Player ID", "First Name", "Last Name", "Jersey Number", "Grade",
      "Team", "Position", "Status"].forEach(function(header) {
      if (!cols[header]) {
        throw new Error("The Players sheet is missing the " + header + " column.");
      }
    });

    const lastColumn = sheet.getLastColumn();
    const existing = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, lastColumn).getValues()
      : [];
    const existingNames = {};
    let highestId = 0;

    existing.forEach(function(row) {
      const id = String(row[cols["Player ID"] - 1] || "");
      const idNumber = Number(id.replace(/^P/i, ""));
      if (!isNaN(idNumber)) {
        highestId = Math.max(highestId, idNumber);
      }

      const key = buildPlayerImportKey_(
        row[cols["First Name"] - 1],
        row[cols["Last Name"] - 1],
        row[cols["Team"] - 1]
      );
      if (key) {
        existingNames[key] = true;
      }
    });

    const settings = getCoachIQSettings();
    const validTeams = settings.teams || [];
    const validPositions = settings.positions || [];
    const validStatuses = settings.statuses || [];
    const importNames = {};
    const errors = [];
    const normalized = [];

    roster.forEach(function(player, index) {
      const rowNumber = index + 2;
      const firstName = cleanRosterValue_(player.firstName);
      const lastName = cleanRosterValue_(player.lastName);
      const team = cleanRosterValue_(player.team);
      const position = cleanRosterValue_(player.position);
      const status = cleanRosterValue_(player.status) || "Active";

      if (!firstName || !lastName) {
        errors.push("Row " + rowNumber + ": First Name and Last Name are required.");
      }
      if (team && validTeams.length && validTeams.indexOf(team) === -1) {
        errors.push("Row " + rowNumber + ": Team '" + team + "' is not in CoachIQ Settings.");
      }
      if (position && validPositions.length && validPositions.indexOf(position) === -1) {
        errors.push("Row " + rowNumber + ": Position '" + position + "' is not in CoachIQ Settings.");
      }
      if (status && validStatuses.length && validStatuses.indexOf(status) === -1) {
        errors.push("Row " + rowNumber + ": Status '" + status + "' is not in CoachIQ Settings.");
      }

      const key = buildPlayerImportKey_(firstName, lastName, team);
      if (key && (existingNames[key] || importNames[key])) {
        errors.push("Row " + rowNumber + ": " + firstName + " " + lastName +
          " already exists for " + (team || "this roster") + ".");
      }
      if (key) {
        importNames[key] = true;
      }

      normalized.push({
        firstName: firstName,
        lastName: lastName,
        jersey: cleanRosterValue_(player.jersey),
        grade: cleanRosterValue_(player.grade),
        team: team,
        position: position,
        status: status
      });
    });

    if (errors.length) {
      throw new Error(errors.slice(0, 20).join("\n") +
        (errors.length > 20 ? "\nAdditional errors were omitted." : ""));
    }

    const rows = normalized.map(function(player) {
      highestId += 1;
      const row = new Array(lastColumn).fill("");
      row[cols["Player ID"] - 1] = "P" + String(highestId).padStart(3, "0");
      row[cols["First Name"] - 1] = safeRosterSheetValue_(player.firstName);
      row[cols["Last Name"] - 1] = safeRosterSheetValue_(player.lastName);
      row[cols["Jersey Number"] - 1] = safeRosterSheetValue_(player.jersey);
      row[cols["Grade"] - 1] = safeRosterSheetValue_(player.grade);
      row[cols["Team"] - 1] = safeRosterSheetValue_(player.team);
      row[cols["Position"] - 1] = safeRosterSheetValue_(player.position);
      row[cols["Status"] - 1] = safeRosterSheetValue_(player.status);
      return row;
    });

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, lastColumn)
      .setValues(rows);

    return {
      imported: rows.length,
      firstPlayerId: rows[0][cols["Player ID"] - 1],
      lastPlayerId: rows[rows.length - 1][cols["Player ID"] - 1]
    };
  } finally {
    lock.releaseLock();
  }
}

function cleanRosterValue_(value) {
  return String(value == null ? "" : value).trim();
}

function safeRosterSheetValue_(value) {
  const cleaned = cleanRosterValue_(value);
  return /^[=+\-@]/.test(cleaned) ? "'" + cleaned : cleaned;
}

function buildPlayerImportKey_(firstName, lastName, team) {
  const name = (cleanRosterValue_(firstName) + "|" +
    cleanRosterValue_(lastName) + "|" + cleanRosterValue_(team))
    .toLowerCase();
  return name === "||" ? "" : name;
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

/**
 * Browser-safe player profile endpoint. The response wrapper prevents an
 * empty Apps Script response from being mistaken for a valid profile.
 */
function getPlayerProfileForUI(playerId){

  if(!playerId){
    throw new Error("Player ID is required.");
  }

  const profile = getPlayerProfile(playerId);

  if(!profile || !profile.player){
    throw new Error("No player profile data was returned for " + playerId + ".");
  }

  const serialized = JSON.stringify(profile, function(key, value){
    if(typeof value === "number" && !isFinite(value)){
      return null;
    }

    return value;
  });

  if(!serialized){
    throw new Error("Player profile could not be serialized for " + playerId + ".");
  }

  return {
    ok: true,
    profile: JSON.parse(serialized)
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
