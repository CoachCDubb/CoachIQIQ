/**
 * ======================================
 * Evaluation Service
 * ======================================
 */

/**
 * Creates blank evaluations for every player
 * in the current session.
 */

let practiceEvaluationCache = null;

function createEvaluationRows(sessionId, players, evaluator){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

    const cols = getColumnMap("Practice Evaluations");

  const playerIds = players.map(function(player){
    return player && !Array.isArray(player)
      ? player["Player ID"]
      : player && player[0];
  });

  if(playerIds.some(function(playerId){ return !playerId; })){
    throw new Error("Cannot create evaluations: a player is missing Player ID.");
  }

  const rows = [];

  playerIds.forEach(function(playerId){

 const row = new Array(sheet.getLastColumn()).fill("");

row[cols["Session ID"] - 1] = sessionId;
row[cols["Player ID"] - 1] = playerId;
row[cols["Evaluator"] - 1] = evaluator;
row[cols["Attendance"] - 1] = true;
if(cols["Attendance Status"]) row[cols["Attendance Status"] - 1] = "Present";
row[cols["Created"] - 1] = new Date();
row[cols["Last Updated"] - 1] = new Date();
row[cols["Complete"] - 1] = false;
if(cols["Season"]) row[cols["Season"] - 1] = getCoachIQCurrentSeason_();

rows.push(row);

  });

  if(rows.length){

    sheet
      .getRange(
        sheet.getLastRow()+1,
        1,
        rows.length,
        rows[0].length
      )
      .setValues(rows);
      practiceEvaluationCache = null;

  }

}
/**
 * Updates a single evaluation score.
 */
function updateEvaluationScore(sessionId, playerId, category, score){
requirePlayerAccess_(playerId);

const sheet = SpreadsheetApp
.getActive()
.getSheetByName("Practice Evaluations");

const cols = getColumnMap("Practice Evaluations");

const data = sheet.getDataRange().getValues();

const categoryColumn = cols[category];

// Find the category column
if (!categoryColumn) {
  throw new Error("Category not found: " + category);
}

  // Find the player's evaluation row
  for(let i = 1; i < data.length; i++){

    if(
      data[i][0] === sessionId &&
      data[i][1] === playerId
    ){

      const previousScore = data[i][categoryColumn - 1];

      // Update the score
      sheet
  .getRange(i + 1, categoryColumn)
  .setValue(score);

      // Update Last Updated
     sheet
    .getRange(i + 1, cols["Last Updated"])
    .setValue(new Date());

practiceEvaluationCache = null;
      try {
        const player = getPlayer(playerId) || {};
        logCoachIQAudit({
          action: "UPDATE_EVALUATION_SCORE",
          entityType: "Player Evaluation",
          entityId: sessionId + ":" + playerId + ":" + category,
          team: player.Team || "",
          beforeValue: previousScore,
          afterValue: score,
          success: true,
          error: ""
        });
      } catch (auditError) {
        console.error("Evaluation saved, but audit logging failed: " + auditError.message);
      }
      return score;

    }

  }

  throw new Error("Evaluation row not found for score update.");

}
/**
 * Updates player evaluation notes.
 */
function updateEvaluationNotes(sessionId, playerId, notes){
  requirePlayerAccess_(playerId);

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

    const cols = getColumnMap("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

  for(let i = 1; i < data.length; i++){

    if(
      data[i][0] === sessionId &&
      data[i][1] === playerId
    ){

      const previousNotes = String(data[i][cols["Notes"] - 1] || "");

      // Notes
      sheet
    .getRange(i + 1, cols["Notes"])
    .setValue(notes);

      // Last Updated
      sheet
    .getRange(i + 1, cols["Last Updated"])
    .setValue(new Date());

practiceEvaluationCache = null;
      try {
        const player = getPlayer(playerId) || {};
        logCoachIQAudit({
          action: "UPDATE_EVALUATION_NOTES",
          entityType: "Player Evaluation",
          entityId: sessionId + ":" + playerId + ":Notes",
          team: player.Team || "",
          beforeValue: previousNotes ? "Note present (" + previousNotes.length + " characters)" : "No note",
          afterValue: notes ? "Note present (" + String(notes).length + " characters)" : "No note",
          success: true,
          error: ""
        });
      } catch (auditError) {
        console.error("Evaluation notes saved, but audit logging failed: " + auditError.message);
      }
      return notes;

    }

  }

  throw new Error("Evaluation row not found for notes update.");

}
/**
 * Returns all saved evaluation scores
 * for a session.
 */
function getEvaluationScores(sessionId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

    const cols = getColumnMap("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

  const headers = data[0];

  const scores = {};
  const allowedPlayers = {};
  filterPlayersForCurrentStaff_(getPlayers()).forEach(function(player){ allowedPlayers[String(player[0])] = true; });

  for(let i = 1; i < data.length; i++){

    if(data[i][0] !== sessionId){
      continue;
    }

    const playerId = data[i][1];
    if(!allowedPlayers[String(playerId)]){ continue; }

    scores[playerId] = {

  Attendance: data[i][cols["Attendance"] - 1],
  AttendanceStatus: cols["Attendance Status"] ? (data[i][cols["Attendance Status"] - 1] || "Present") : (data[i][cols["Attendance"] - 1] === false ? "Unexcused" : "Present")

};

    if(cols["Notes"]){
      scores[playerId].Notes = data[i][cols["Notes"] - 1] || "";
    }

(getCoachIQSettings().cultureCategories||[]).forEach(function(category){
  if(cols[category]) scores[playerId][category]=data[i][cols[category]-1];
});

  }

  return scores;

}
/**
 * Updates player attendance.
 */
function updateAttendance(sessionId, playerId, present){
  requirePlayerAccess_(playerId);

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const cols = getColumnMap("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

  for(let i = 1; i < data.length; i++){

    if(
      data[i][cols["Session ID"] - 1] === sessionId &&
      data[i][cols["Player ID"] - 1] === playerId
    ){

      const previousAttendance = data[i][cols["Attendance"] - 1];

      sheet
        .getRange(i + 1, cols["Attendance"])
        .setValue(present);

      sheet
        .getRange(i + 1, cols["Last Updated"])
        .setValue(new Date());

practiceEvaluationCache = null;
      try {
        const player = getPlayer(playerId) || {};
        logCoachIQAudit({
          action: "UPDATE_ATTENDANCE",
          entityType: "Player Evaluation",
          entityId: sessionId + ":" + playerId + ":Attendance",
          team: player.Team || "",
          beforeValue: previousAttendance,
          afterValue: present,
          success: true,
          error: ""
        });
      } catch (auditError) {
        console.error("Attendance saved, but audit logging failed: " + auditError.message);
      }
      return present;

    }

  }

  throw new Error("Evaluation row not found for attendance update.");

}

function updateAttendanceStatus(sessionId, playerId, status){
  requirePlayerAccess_(playerId);
  const allowed=["Present","Excused","Unexcused","Not Marked"];
  status=String(status||"");if(allowed.indexOf(status)<0)throw new Error("Choose a valid attendance status.");
  const session=getPracticeSession(sessionId);if(!session)throw new Error("Session not found.");
  const policy=getSessionPolicyForSession_(session);
  if(!policy.trackAttendance)throw new Error("This session type does not track attendance.");
  const sheet=getCoachIQSpreadsheet_().getSheetByName("Practice Evaluations"),cols=getColumnMap("Practice Evaluations");
  let statusColumn=cols["Attendance Status"];
  if(!statusColumn){statusColumn=sheet.getLastColumn()+1;sheet.getRange(1,statusColumn).setValue("Attendance Status");}
  const data=sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(data[i][cols["Session ID"]-1]===sessionId&&data[i][cols["Player ID"]-1]===playerId){
      const booleanValue=status==="Present"?true:status==="Unexcused"?false:policy.excusedTreatment==="present"&&status==="Excused"?true:policy.excusedTreatment==="absent"&&status==="Excused"?false:"";
      sheet.getRange(i+1,cols["Attendance"]).setValue(booleanValue);sheet.getRange(i+1,statusColumn).setValue(status);sheet.getRange(i+1,cols["Last Updated"]).setValue(new Date());practiceEvaluationCache=null;
      syncUnexcusedAttendancePoints_(sessionId,playerId,status,policy);
      try{logCoachIQAudit({action:"UPDATE_ATTENDANCE_STATUS",entityType:"Player Evaluation",entityId:sessionId+":"+playerId+":Attendance",team:session["Teams"]||"",beforeValue:"",afterValue:{status:status,points:status==="Unexcused"?policy.unexcusedPoints:0},success:true,error:""});}catch(error){console.error("Attendance saved, but audit logging failed: "+error.message);}
      return {status:status,points:status==="Unexcused"?policy.unexcusedPoints:0};
    }
  }
  throw new Error("Evaluation row not found for attendance update.");
}

/**
 * Returns notes for one player in one session.
 */
function getEvaluationNotes(sessionId, playerId){
  requirePlayerAccess_(playerId);

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const cols = getColumnMap("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

  for(let i = 1; i < data.length; i++){

    if(
      data[i][cols["Session ID"] - 1] === sessionId &&
      data[i][cols["Player ID"] - 1] === playerId
    ){

      return data[i][cols["Notes"] - 1] || "";

    }

  }

  return "";

  }

/**
 * Marks all evaluations in a session as complete.
 */
function completeEvaluations(sessionId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const cols = getColumnMap("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

 for(let i = 1; i < data.length; i++){

  if(data[i][cols["Session ID"] - 1] === sessionId){

    sheet
      .getRange(i + 1, cols["Complete"])
      .setValue(true);

    sheet
      .getRange(i + 1, cols["Last Updated"])
      .setValue(new Date());

  }

}

practiceEvaluationCache = null;

}
function testCompleteEvaluations(){

  completeEvaluations("PS0018");

}
function updateReward(sessionId, playerId, reward){
  requirePlayerAccess_(playerId);

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const cols = getColumnMap("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

  for(let i = 1; i < data.length; i++){

    if(
      data[i][cols["Session ID"] - 1] === sessionId &&
      data[i][cols["Player ID"] - 1] === playerId
    ){

      const evaluator = data[i][cols["Evaluator"] - 1] || "";
      const previousReward = data[i][cols["Reward"] - 1] || "";

      setSessionRewardPoints(
        sessionId,
        playerId,
        reward,
        evaluator,
        previousReward
      );

      sheet
        .getRange(i + 1, cols["Reward"])
        .setValue(reward || "");

      sheet
        .getRange(i + 1, cols["Last Updated"])
        .setValue(new Date());

practiceEvaluationCache = null;

      try {
        const player = getPlayer(playerId) || {};
        logCoachIQAudit({
          action: "UPDATE_EVALUATION_REWARD",
          entityType: "Player Evaluation",
          entityId: sessionId + ":" + playerId + ":Reward",
          team: player.Team || "",
          beforeValue: previousReward || "No reward",
          afterValue: reward || "No reward",
          success: true,
          error: ""
        });
      } catch (auditError) {
        console.error("Reward saved, but audit logging failed: " + auditError.message);
      }

      return reward || "";

    }

  }

  throw new Error("Evaluation row not found for reward update.");

}
function getPracticeEvaluations(){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  if(sheet.getLastRow() < 2){
    practiceEvaluationCache = [];
    return practiceEvaluationCache;
  }

  const data = sheet
    .getRange(
      2,
      1,
      sheet.getLastRow()-1,
      sheet.getLastColumn()
    )
    .getValues();

  const allowedPlayers = {};
  filterPlayersForCurrentStaff_(getPlayers()).forEach(function(player){ allowedPlayers[String(player[0])] = true; });
  practiceEvaluationCache = data.filter(function(row){
    return allowedPlayers[String(row[1])];
  }).map(function(row){
    return rowToObject(headers,row);
  });

  return practiceEvaluationCache;

}
