/**
 * ======================================
 * Sheet Service
 * ======================================
 */

/**
 * Returns the CoachIQ spreadsheet.
 *
 * Spreadsheet dialogs normally have an active spreadsheet. Web-app and
 * background executions can use the spreadsheet ID saved in Script Properties.
 */
function getCoachIQSpreadsheet_() {

  const properties =
    PropertiesService.getScriptProperties();

  const activeSpreadsheet =
    SpreadsheetApp.getActive();

  if (activeSpreadsheet) {

    properties.setProperty(
      "COACHIQ_SPREADSHEET_ID",
      activeSpreadsheet.getId()
    );

    return activeSpreadsheet;

  }

  const spreadsheetId =
    properties.getProperty(
      "COACHIQ_SPREADSHEET_ID"
    );

  if (!spreadsheetId) {

    throw new Error(
      "CoachIQ could not identify its spreadsheet. " +
      "Open CoachIQ from the spreadsheet once, then retry."
    );

  }

  return SpreadsheetApp.openById(
    spreadsheetId
  );

}

/**
 * Returns a map of column names to column numbers.
 *
 * Example:
 * cols["Player ID"] = 2
 */
function getColumnMap(sheetName) {

  const spreadsheet =
    getCoachIQSpreadsheet_();

  const sheet =
    spreadsheet.getSheetByName(
      sheetName
    );

  if (!sheet) {

    throw new Error(
      "The " + sheetName +
      " sheet was not found."
    );

  }

  const lastColumn =
    sheet.getLastColumn();

  if (lastColumn < 1) {

    throw new Error(
      "The " + sheetName +
      " sheet does not contain headers."
    );

  }

  const headers =
    sheet
      .getRange(
        1,
        1,
        1,
        lastColumn
      )
      .getValues()[0];

  const cols = {};

  headers.forEach(
    function(header, index) {

      cols[header] =
        index + 1;

    }
  );

  return cols;

}

/**
 * Logs the Practice Evaluations column map for testing.
 */
function testColumnMap() {

  Logger.log(
    getColumnMap(
      "Practice Evaluations"
    )
  );

}

/**
 * Converts a sheet row into an object using the header row.
 */
function rowToObject(headers, row) {

  const obj = {};

  headers.forEach(
    function(header, index) {

      obj[header] =
        row[index];

    }
  );

  return obj;

}

/**
 * Public test wrapper for the private spreadsheet helper.
 */
function testCoachIQSpreadsheet() {

  const spreadsheet =
    getCoachIQSpreadsheet_();

  Logger.log(
    spreadsheet.getName()
  );

  return spreadsheet.getName();

}