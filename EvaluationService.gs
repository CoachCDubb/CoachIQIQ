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

/**
 * Saves rapid score and attendance taps in one server request. This keeps the
 * practice screen responsive while avoiding a full sheet read for every tap.
 */
function saveEvaluationChanges(changes) {
  requireStaffCapability_("evaluate_players");
  if (!Array.isArray(changes) || !changes.length || changes.length > 100) {
    throw new Error("Send between 1 and 100 evaluation changes at a time.");
  }

  const sessionId = String(changes[0].sessionId || "").trim();
  if (!sessionId || changes.some(function(change) {
    return String(change.sessionId || "").trim() !== sessionId;
  })) {
    throw new Error("Evaluation changes must belong to one practice session.");
  }

  const allowedPlayers = {};
  filterPlayersForCurrentStaff_(getPlayers()).forEach(function(player) {
    allowedPlayers[String(player[0])] = {name: String(player[1] || "") + " " + String(player[2] || ""), team: String(player[5] || "")};
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getCoachIQSpreadsheet_().getSheetByName("Practice Evaluations");
    if (!sheet) throw new Error("The Practice Evaluations sheet was not found.");
    const cols = getColumnMap("Practice Evaluations");
    const data = sheet.getDataRange().getValues();
    const rowByPlayer = {};
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][cols["Session ID"] - 1]) === sessionId) {
        rowByPlayer[String(data[i][cols["Player ID"] - 1])] = i;
      }
    }

    const changedRows = {};
    const auditChanges = [];
    changes.forEach(function(change) {
      const playerId = String(change.playerId || "").trim();
      if (!allowedPlayers[playerId]) throw new Error("You do not have access to player " + playerId + ".");
      const rowIndex = rowByPlayer[playerId];
      if (rowIndex == null) throw new Error("Evaluation row not found for " + playerId + ".");

      let column;
      let value;
      if (change.type === "score") {
        column = cols[String(change.category || "")];
        value = Number(change.value);
        if (!column || !Number.isInteger(value) || value < 1 || value > 5) {
          throw new Error("Invalid evaluation score.");
        }
      } else if (change.type === "attendance") {
        column = cols["Attendance"];
        value = change.value === true;
      } else {
        throw new Error("Unsupported evaluation change.");
      }

      const previousValue = data[rowIndex][column - 1];
      data[rowIndex][column - 1] = value;
      data[rowIndex][cols["Last Updated"] - 1] = new Date();
      changedRows[rowIndex] = true;
      auditChanges.push({playerId: playerId, type: change.type, category: change.category || "", before: previousValue, after: value});
    });

    Object.keys(changedRows).forEach(function(rowIndex) {
      const index = Number(rowIndex);
      sheet.getRange(index + 1, 1, 1, data[index].length).setValues([data[index]]);
    });
    practiceEvaluationCache = null;

    try {
      logCoachIQAudit({
        action: "BATCH_UPDATE_EVALUATIONS",
        entityType: "Practice Evaluation",
        entityId: sessionId,
        team: "",
        beforeValue: auditChanges.map(function(change) { return {playerId: change.playerId, type: change.type, category: change.category, value: change.before}; }),
        afterValue: auditChanges.map(function(change) { return {playerId: change.playerId, type: change.type, category: change.category, value: change.after}; }),
        success: true,
        error: ""
      });
    } catch (auditError) {
      console.error("Evaluations saved, but audit logging failed: " + auditError.message);
    }
    return {saved: changes.length};
  } finally {
    lock.releaseLock();
  }
}

function createEvaluationRows(sessionId, players, evaluator){

  const sheet = getCoachIQSpreadsheet_()
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
row[cols["Created"] - 1] = new Date();
row[cols["Last Updated"] - 1] = new Date();
row[cols["Complete"] - 1] = false;

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

const sheet = getCoachIQSpreadsheet_()
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

  const sheet = getCoachIQSpreadsheet_()
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

  const sheet = getCoachIQSpreadsheet_()
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

  Attendance: data[i][cols["Attendance"] - 1]

};

    if(cols["Notes"]){
      scores[playerId].Notes = data[i][cols["Notes"] - 1] || "";
    }

for(let c = 6; c < headers.length - 2; c++){

  scores[playerId][headers[c]] = data[i][c];

}

  }

  return scores;

}
/**
 * Updates player attendance.
 */
function updateAttendance(sessionId, playerId, present){
  requirePlayerAccess_(playerId);

  const sheet = getCoachIQSpreadsheet_()
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

/**
 * Returns notes for one player in one session.
 */
function getEvaluationNotes(sessionId, playerId){
  requirePlayerAccess_(playerId);

  const sheet = getCoachIQSpreadsheet_()
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

  const sheet = getCoachIQSpreadsheet_()
    .getSheetByName("Practice Evaluations");

  const cols = getColumnMap("Practice Evaluations");

  const data = sheet.getDataRange().getValues();

  const changedIndexes = [];
  const completedAt = new Date();
  for(let i = 1; i < data.length; i++){
    if(data[i][cols["Session ID"] - 1] === sessionId){
      data[i][cols["Complete"] - 1] = true;
      data[i][cols["Last Updated"] - 1] = completedAt;
      changedIndexes.push(i);
    }
  }

  // Session evaluation rows are normally adjacent. Write each adjacent block
  // once instead of making two Sheets calls for every player.
  let blockStart = 0;
  while(blockStart < changedIndexes.length){
    let blockEnd = blockStart;
    while(blockEnd + 1 < changedIndexes.length && changedIndexes[blockEnd + 1] === changedIndexes[blockEnd] + 1){
      blockEnd++;
    }
    const firstIndex = changedIndexes[blockStart];
    const lastIndex = changedIndexes[blockEnd];
    sheet.getRange(firstIndex + 1, 1, lastIndex - firstIndex + 1, data[firstIndex].length)
      .setValues(data.slice(firstIndex, lastIndex + 1));
    blockStart = blockEnd + 1;
  }

practiceEvaluationCache = null;

}
function testCompleteEvaluations(){

  completeEvaluations("PS0018");

}
function updateReward(sessionId, playerId, reward){
  requirePlayerAccess_(playerId);

  const sheet = getCoachIQSpreadsheet_()
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

  const sheet = getCoachIQSpreadsheet_()
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
