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

      // Update the score
      sheet
  .getRange(i + 1, categoryColumn)
  .setValue(score);

      // Update Last Updated
     sheet
    .getRange(i + 1, cols["Last Updated"])
    .setValue(new Date());

practiceEvaluationCache = null;
      return score;

    }

  }

  throw new Error("Evaluation row not found for score update.");

}
/**
 * Updates player evaluation notes.
 */
function updateEvaluationNotes(sessionId, playerId, notes){

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

      // Notes
      sheet
    .getRange(i + 1, cols["Notes"])
    .setValue(notes);

      // Last Updated
      sheet
    .getRange(i + 1, cols["Last Updated"])
    .setValue(new Date());

practiceEvaluationCache = null;
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

  for(let i = 1; i < data.length; i++){

    if(data[i][0] !== sessionId){
      continue;
    }

    const playerId = data[i][1];

    scores[playerId] = {

  Attendance: data[i][cols["Attendance"] - 1]

};

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

      sheet
        .getRange(i + 1, cols["Attendance"])
        .setValue(present);

      sheet
        .getRange(i + 1, cols["Last Updated"])
        .setValue(new Date());

practiceEvaluationCache = null;
      return present;

    }

  }

  throw new Error("Evaluation row not found for attendance update.");

}

/**
 * Returns notes for one player in one session.
 */
function getEvaluationNotes(sessionId, playerId){

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

      return reward || "";

    }

  }

  throw new Error("Evaluation row not found for reward update.");

}
function getPracticeEvaluations(){

  if(practiceEvaluationCache){
    return practiceEvaluationCache;
  }

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

  practiceEvaluationCache = data.map(function(row){
    return rowToObject(headers,row);
  });

  return practiceEvaluationCache;

}
