/**
 * ======================================
 * Session History Service
 * ======================================
 */

let sessionCache = null;

/**
 * Returns every session.
 */
function getAllSessions() {

  if (sessionCache) {
    return sessionCache;
  }

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName("Sessions");

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    sessionCache = [];
    return sessionCache;
  }

  const headers = data.shift();
  const playerSheet = ss.getSheetByName("Players");
  const evaluationSheet = ss.getSheetByName("Practice Evaluations");
  const playerData = playerSheet.getDataRange().getValues();
  const evaluationData = evaluationSheet.getDataRange().getValues();
  const playerHeaders = playerData.shift() || [];
  const evaluationHeaders = evaluationData.shift() || [];
  const playerTeamIndex = playerHeaders.indexOf("Team");
  const playerStatusIndex = playerHeaders.indexOf("Status");
  const evaluationAttendanceIndex = evaluationHeaders.indexOf("Attendance");
  const activePlayersByTeam = {};
  const evaluationRowsBySession = {};

  playerData.forEach(function(row){
    if(row[playerStatusIndex] !== "Active"){
      return;
    }

    const team = String(row[playerTeamIndex] || "").trim();
    activePlayersByTeam[team] = (activePlayersByTeam[team] || 0) + 1;
  });

  evaluationData.forEach(function(row){
    const sessionId = row[0];
    const playerId = row[1];

    if(!evaluationRowsBySession[sessionId]){
      evaluationRowsBySession[sessionId] = {};
    }

    // Match getEvaluationScores(): the last row for a player wins.
    evaluationRowsBySession[sessionId][playerId] = row;
  });

sessionCache = data.map(function(row){

  const obj = rowToObject(headers, row);

  Object.keys(obj).forEach(function(key){

    if(obj[key] instanceof Date){

      obj[key] = Utilities.formatDate(
        obj[key],
        Session.getScriptTimeZone(),
        "MM/dd/yyyy HH:mm"
      );

    }

  });

  const teams = String(obj["Teams"] || "")
    .split(",")
    .map(function(team){ return team.trim(); })
    .filter(Boolean);

  obj["Players"] = teams.reduce(function(total, team){
    return total + (activePlayersByTeam[team] || 0);
  }, 0);

  const sessionEvaluations =
    evaluationRowsBySession[obj["Session ID"]] || {};

  obj["Completed Evaluations"] = Object.keys(sessionEvaluations)
    .reduce(function(total, playerId){
      const row = sessionEvaluations[playerId];
      let populated = evaluationAttendanceIndex >= 0 &&
        row[evaluationAttendanceIndex] !== "" ? 1 : 0;

      for(let c = 6; c < evaluationHeaders.length - 2; c++){
        if(row[c] !== ""){
          populated++;
        }
      }

      return total + populated;
    }, 0);

  return obj;

});

return sessionCache;

}
function getPlayerCountForSession(sessionId){

  const session = getPracticeSession(sessionId);

  if(!session){
    return 0;
  }

  const teams = session["Teams"]
    .split(",")
    .map(t => t.trim());

  return getPlayersByTeams(teams).length;

}
function getEvaluationCountForSession(sessionId){

  const scores = getEvaluationScores(sessionId);

  if(!scores){
    return 0;
  }

  let total = 0;

  Object.keys(scores).forEach(function(playerId){

    Object.keys(scores[playerId]).forEach(function(category){

      if(scores[playerId][category] !== ""){
        total++;
      }

    });

  });

  return total;

}

/**
 * Returns one session.
 */
function getSession(sessionId){

  const sessions = getAllSessions();

  return sessions.find(function(session){
    return session["Session ID"] == sessionId;
  }) || null;

}

function testGetAllSessions(){

  Logger.log(getAllSessions());

}

/**
 * Deletes a session and all associated evaluations.
 */
function deleteSession(sessionId){

  const ss = SpreadsheetApp.getActive();

  // -----------------------------
  // Delete Session
  // -----------------------------
  const sessionSheet = ss.getSheetByName("Sessions");
  const sessionData = sessionSheet.getDataRange().getValues();

  for(let i = sessionData.length - 1; i >= 1; i--){

    if(sessionData[i][0] === sessionId){

      sessionSheet.deleteRow(i + 1);
      break;

    }

  }

  // -----------------------------
  // Delete Practice Evaluations
  // -----------------------------
  const evalSheet = ss.getSheetByName("Practice Evaluations");
  const evalData = evalSheet.getDataRange().getValues();

  for(let i = evalData.length - 1; i >= 1; i--){

    if(evalData[i][0] === sessionId){

      evalSheet.deleteRow(i + 1);

    }

  }

  // Remove any points awarded through this session's reward selections.
  const pointsSheet = ss.getSheetByName("Culture Points");
  const pointsData = pointsSheet.getDataRange().getValues();
  const pointsHeaders = pointsData[0] || [];
  const pointsSessionIndex = pointsHeaders.indexOf("Session ID");
  const pointsNotesIndex = pointsHeaders.indexOf("Notes");

  if(pointsSessionIndex >= 0){
    for(let i = pointsData.length - 1; i >= 1; i--){
      if(pointsData[i][pointsSessionIndex] === sessionId &&
         pointsData[i][pointsNotesIndex] === "Session evaluation reward"){
        pointsSheet.deleteRow(i + 1);
      }
    }
  }

  // Clear caches
  sessionCache = null;
  practiceEvaluationCache = null;

}
