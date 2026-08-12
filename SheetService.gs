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