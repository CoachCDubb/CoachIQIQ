/**
 * ======================================
 * Timeline Service
 * ======================================
 */

const TIMELINE_SHEET = "Player Timeline";

/**
 * Returns a player's timeline,
 * newest first.
 */
function getPlayerTimeline(playerId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(TIMELINE_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

 if(sheet.getLastRow() < 2){
  return [];
}

const data = sheet
  .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
  .getValues();

  return data

  .map(row => rowToObject(headers,row))

  .filter(event => event["Player ID"] == playerId)

  .map(function(event){

    return {
      id: event["Timeline ID"],
      playerId: event["Player ID"],
      date: formatTimelineDate_(event["Date"]),
      category: event["Category"],
      title: event["Title"],
      details: event["Details"],
      coach: event["Coach"]
    };

  })

  .sort(function(a,b){

    const bTime = b.date ? new Date(b.date).getTime() : 0;
    const aTime = a.date ? new Date(a.date).getTime() : 0;

    return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);

  });

}

function formatTimelineDate_(value){

  if(!value){
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  return isNaN(date.getTime()) ? "" : date.toISOString();

}
function testPlayerTimeline(){

  Logger.log(

    JSON.stringify(

      getPlayerTimeline("P001"),

      null,

      2

    )

  );

}
