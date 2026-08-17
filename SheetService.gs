/**
 * ======================================
 * Sheet Service
 * ======================================
 */

/**
 * Returns a map of column names to column numbers.
 *
 * Example:
 * cols["Player ID"] = 2
 */
function getColumnMap(sheetName){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(sheetName);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  const cols = {};

  headers.forEach(function(header,index){

    cols[header] = index + 1;

  });

  return cols;

}
function testColumnMap(){

  Logger.log(
    getColumnMap("Practice Evaluations")
  );

}
/**
 * Converts a sheet row into an object using the header row.
 */
function rowToObject(headers, row){

  const obj = {};

  headers.forEach(function(header, index){

    obj[header] = row[index];

  });

  return obj;

}

/**
 * Returns the CoachIQ workbook in both spreadsheet-dialog and web-app runs.
 * Some deployed services use this helper because a web-app request may not
 * expose an active spreadsheet even though the script is container-bound.
 */
function getCoachIQSpreadsheet_() {
  const properties = PropertiesService.getScriptProperties();
  const active = SpreadsheetApp.getActive();
  if (active) {
    properties.setProperty("COACHIQ_SPREADSHEET_ID", active.getId());
    return active;
  }

  const spreadsheetId = properties.getProperty("COACHIQ_SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw new Error("CoachIQ could not identify its spreadsheet. Open CoachIQ from the spreadsheet once, then retry.");
  }
  return SpreadsheetApp.openById(spreadsheetId);
}
