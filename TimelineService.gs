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
      date: String(event["Date"]),
      category: event["Category"],
      title: event["Title"],
      details: event["Details"],
      coach: event["Coach"]
    };

  })

  .sort(function(a,b){

    return new Date(b.date) - new Date(a.date);

  });

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