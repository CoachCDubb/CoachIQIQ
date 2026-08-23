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
  requireStaffCapability_("run_sessions");
  data = preparePracticeSessionForCurrentStaff_(data);

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

  const seasonColumn = getColumnMap(SESSION_SHEET)["Season"];
  if(seasonColumn){sheet.getRange(sheet.getLastRow(),seasonColumn).setValue(getCoachIQCurrentSeason_());}

  if(data.sessionPolicy){
    const headers=sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    let policyColumn=headers.indexOf("Session Policy")+1;
    if(!policyColumn){policyColumn=sheet.getLastColumn()+1;sheet.getRange(1,policyColumn).setValue("Session Policy");}
    sheet.getRange(sheet.getLastRow(),policyColumn).setValue(JSON.stringify(data.sessionPolicy));
  }

  sessionCache = null;

  return sessionId;

}

function createPracticeSessionWithEvaluations(data){
  requireStaffCapability_("run_sessions");
  data = preparePracticeSessionForCurrentStaff_(data);
  const policy = getSessionPolicyByName_(data.sessionType);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const players = filterPlayersForCurrentStaff_(getPlayersByTeams(data.teams || []));

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
      players: players,
      policy: policy
    }));
  } finally {
    lock.releaseLock();
  }

}

/**
 * Binds a new session to the signed-in staff profile. The browser-provided
 * evaluator is never trusted when staff access has been configured.
 */
function preparePracticeSessionForCurrentStaff_(data) {
  data = data || {};
  const access = getCurrentStaffAccess_();
  const teams = Array.isArray(data.teams) ? data.teams.map(String) : [];
  if (access.configured) {
    if (!access.email || !access.name) {
      throw new Error("CoachIQ could not match your signed-in Google account to a staff profile. Ask a Head Coach to verify your staff email and web app access settings.");
    }
    if (access.teams.length && teams.some(function(team) { return access.teams.indexOf(team) === -1; })) {
      throw new Error("You cannot create a session for a team outside your staff assignment.");
    }
    data.evaluators = [access.name];
  }
  if (!Array.isArray(data.evaluators) || !String(data.evaluators[0] || "").trim()) {
    throw new Error("CoachIQ could not identify the session evaluator.");
  }
  data.teams = teams;
  data.sessionPolicy = getSessionPolicyByName_(data.sessionType);
  data.sessionType = data.sessionPolicy.name;
  return data;
}

function getSessionPolicyForSession_(session){
  try{const snapshot=JSON.parse(session["Session Policy"]||"");if(snapshot&&snapshot.name)return normalizeSessionPolicies_([snapshot])[0];}catch(error){/* Fall back for sessions created before policy snapshots. */}
  return getSessionPolicyByName_(session["Session Type"],true);
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
  requireStaffCapability_("run_sessions");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sessionSheet = SpreadsheetApp.getActive().getSheetByName("Sessions");
    const sessionCols = getColumnMap("Sessions");
    const sessionData = sessionSheet.getDataRange().getValues();
    let found = false;
    let previousStatus = "Completed";
    let sessionTeams = "";

    for(let i = 1; i < sessionData.length; i++){
      if(sessionData[i][sessionCols["Session ID"] - 1] == sessionId){
        previousStatus = sessionData[i][sessionCols["Status"] - 1] || "Completed";
        sessionTeams = sessionData[i][sessionCols["Teams"] - 1] || "";
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
    try {
      logCoachIQAudit({
        action: "REOPEN_PRACTICE_SESSION",
        entityType: "Practice Session",
        entityId: sessionId,
        team: sessionTeams,
        beforeValue: previousStatus,
        afterValue: "In Progress",
        success: true,
        error: ""
      });
    } catch (auditError) {
      console.error("Session reopened, but audit logging failed: " + auditError.message);
    }
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
