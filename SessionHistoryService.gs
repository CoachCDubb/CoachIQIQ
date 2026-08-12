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

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Sessions");

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    sessionCache = [];
    return sessionCache;
  }

  const headers = data.shift();

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

    return obj;

  });

  return sessionCache;

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

  // Clear caches
  sessionCache = null;
  practiceEvaluationCache = null;

}