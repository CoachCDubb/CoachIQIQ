/**
 * ======================================
 * Practice Session Service
 * ======================================
 */

const SESSION_SHEET = "Sessions";

/**
 * Creates a new Practice Session.
 */
function createPracticeSession(data){

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    return createPracticeSession_(data);
  } finally {
    lock.releaseLock();
  }

}

function createPracticeSession_(data){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SESSION_SHEET);

  const sessionId = generatePracticeSessionId();

  sheet.appendRow([

  sessionId,
  data.sessionType,
  data.date,
  data.phase,
  data.teams.join(", "),
  data.evaluators.join(", "),
  "In Progress",
  new Date(),
  "",
  data.sessionNotes,
  ""

  ]);

  sessionCache = null;

  return sessionId;

}

function createPracticeSessionWithEvaluations(data){

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const players = getPlayersByTeams(data.teams || []);

    if(!players.length){
      throw new Error("No active players were found for the selected team(s).");
    }

    const sessionId = createPracticeSession_(data);

    try {
      createEvaluationRows(sessionId, players, (data.evaluators || [""])[0]);
    } catch(error){
      deleteSession(sessionId);
      throw error;
    }

    return JSON.parse(JSON.stringify({
      sessionId: sessionId,
      players: players
    }));
  } finally {
    lock.releaseLock();
  }

}
/**
 * Generates the next Practice Session ID.
 */
function generatePracticeSessionId(){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SESSION_SHEET);

  const lastRow = sheet.getLastRow();

  if(lastRow <= 1){
    return "PS0001";
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const number = ids.reduce(function(highest, row){
    const value = Number(String(row[0] || "").replace(/^PS/, ""));
    return isNaN(value) ? highest : Math.max(highest, value);
  }, 0) + 1;

  return "PS" + number.toString().padStart(4,"0");

}
/**
 * Marks a session as completed.
 */
function finishSession(sessionId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Sessions");

  const data = sheet.getDataRange().getValues();

  for(let i = 1; i < data.length; i++){

    if(data[i][0] === sessionId){

     // Status (Column G)
sheet.getRange(i + 1, 7).setValue("Completed");

// Completed Time (Column I)
sheet.getRange(i + 1, 9).setValue(new Date());

      sessionCache = null;

      return;

    }

  }

}

function reopenSession(sessionId){

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sessionSheet = SpreadsheetApp.getActive().getSheetByName("Sessions");
    const sessionCols = getColumnMap("Sessions");
    const sessionData = sessionSheet.getDataRange().getValues();
    let found = false;

    for(let i = 1; i < sessionData.length; i++){
      if(sessionData[i][sessionCols["Session ID"] - 1] == sessionId){
        sessionSheet.getRange(i + 1, sessionCols["Status"]).setValue("In Progress");
        sessionSheet.getRange(i + 1, sessionCols["Completed Time"] || 9)
          .clearContent();
        found = true;
        break;
      }
    }

    if(!found){
      throw new Error("Session not found: " + sessionId);
    }

    const evaluationSheet = SpreadsheetApp.getActive()
      .getSheetByName("Practice Evaluations");
    const evaluationCols = getColumnMap("Practice Evaluations");
    const evaluationData = evaluationSheet.getDataRange().getValues();

    for(let i = 1; i < evaluationData.length; i++){
      if(evaluationData[i][evaluationCols["Session ID"] - 1] == sessionId){
        evaluationSheet.getRange(i + 1, evaluationCols["Complete"])
          .setValue(false);
        evaluationSheet.getRange(i + 1, evaluationCols["Last Updated"])
          .setValue(new Date());
      }
    }

    sessionCache = null;
    practiceEvaluationCache = null;
    return sessionId;
  } finally {
    lock.releaseLock();
  }

}
/**
 * Returns the most recent In Progress session.
 */
function getActiveSession(){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Sessions");

  const cols = getColumnMap("Sessions");

  const data = sheet.getDataRange().getValues();

  for(let i = data.length - 1; i >= 1; i--){

    if(data[i][cols["Status"] - 1] === "In Progress"){

      return {

        sessionId: data[i][cols["Session ID"] - 1],
        sessionType: data[i][cols["Session Type"] - 1],
        date: data[i][cols["Date"] - 1],
        teams: data[i][cols["Teams"] - 1],
        evaluator: data[i][cols["Evaluators"] - 1],
        notes: data[i][cols["Session Notes"] - 1]

      };

    }

  }

  return null;

}

function getSessionEvaluations(sessionId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

  const headers = data.shift();

  return data
    .map(function(row){

      return rowToObject(headers, row);

    })
    .filter(function(row){

      return row["Session ID"] === sessionId;

    });

}
function testSessionEvaluations(){

  Logger.log(
    getSessionEvaluations("PS0018")
  );

}
function finishEntireSession(sessionId){
  requireStaffCapability_("run_sessions");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const session = getPracticeSession(sessionId);

    if(!session){
      throw new Error("Session not found: " + sessionId);
    }

    if(session["Status"] === "Completed"){
      return sessionId;
    }

  finishSession(sessionId);

  completeEvaluations(sessionId);

  rebuildPlayerSeasonStats();

    try {
      logCoachIQAudit({
        action: "COMPLETE_PRACTICE_SESSION",
        entityType: "Practice Session",
        entityId: sessionId,
        team: session["Teams"] || "",
        beforeValue: session["Status"] || "In Progress",
        afterValue: "Completed",
        success: true,
        error: ""
      });
    } catch (auditError) {
      console.error("Session completed, but audit logging failed: " + auditError.message);
    }

    return sessionId;
  } finally {
    lock.releaseLock();
  }

}
/**
 * Returns one practice session by Session ID.
 */
function getPracticeSession(sessionId){

 const sheet = SpreadsheetApp
.getActive()
.getSheetByName(SESSION_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  if(sheet.getLastRow() < 2){
    return null;
  }

  const data = sheet
    .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
    .getValues();

    Logger.log("Looking for Session ID: " + sessionId);
Logger.log(data);
    

  for(let i = 0; i < data.length; i++){

    const session = rowToObject(headers, data[i]);

    if(session["Session ID"] == sessionId){
      return session;
    }

  }

  return null;

}
function testGetPracticeSession(){

  const result = getPracticeSession("PS0029");

  Logger.log(result);

}
function getSessionPlayerCount(sessionId){

  const evaluations = getSessionEvaluations(sessionId);

  return evaluations.length;

}
function getCompletedEvaluationCount(sessionId){

  const evaluations = getSessionEvaluations(sessionId);

  return evaluations.filter(function(e){

    return e["Complete"] === true;

  }).length;

}
