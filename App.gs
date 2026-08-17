/**
 * =====================================================
 * CoachIQ Application Entry Point
 * =====================================================
 */

// Apps Script service calls are comparatively expensive. Keep the spreadsheet
// handle for the lifetime of a server execution instead of reopening it (and
// rewriting Script Properties) every time a service needs a sheet.
let COACHIQ_SPREADSHEET_CACHE_ = null;

function onOpen() {
  rememberCoachIQSpreadsheet_();
  SpreadsheetApp.getUi()
    .createMenu("CoachIQ")
    .addItem("Launch CoachIQ", "launchCoachIQ")
    .addToUi();
}

/**
 * Serves CoachIQ as a private web app for tablets and phones.
 */
function doGet() {
  getCoachIQSpreadsheet_();
  return HtmlService
    .createTemplateFromFile("Index")
    .evaluate()
    .setTitle("CoachIQ")
    .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
}

/**
 * Remembers the container spreadsheet so web-app requests can open it without
 * relying on a spreadsheet being active in the browser.
 */
function rememberCoachIQSpreadsheet_() {
  const spreadsheet = SpreadsheetApp.getActive();
  if (spreadsheet) {
    COACHIQ_SPREADSHEET_CACHE_ = spreadsheet;
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = spreadsheet.getId();
    if (properties.getProperty("COACHIQ_SPREADSHEET_ID") !== spreadsheetId) {
      properties.setProperty("COACHIQ_SPREADSHEET_ID", spreadsheetId);
    }
  }
  return spreadsheet;
}

function getCoachIQSpreadsheet_() {
  if (COACHIQ_SPREADSHEET_CACHE_) return COACHIQ_SPREADSHEET_CACHE_;

  const activeSpreadsheet = rememberCoachIQSpreadsheet_();
  if (activeSpreadsheet) return activeSpreadsheet;

  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("COACHIQ_SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw new Error("CoachIQ is not connected to a spreadsheet. Open the CoachIQ spreadsheet on a computer, refresh it, and try again.");
  }
  COACHIQ_SPREADSHEET_CACHE_ = SpreadsheetApp.openById(spreadsheetId);
  return COACHIQ_SPREADSHEET_CACHE_;
}

function launchCoachIQ() {

  rememberCoachIQSpreadsheet_();
  const html = HtmlService
    .createTemplateFromFile("Index")
    .evaluate()
    .setTitle("CoachIQ")
    .setWidth(1600)
    .setHeight(900);

  SpreadsheetApp.getUi().showModalDialog(html, "CoachIQ");

}

/**
 * Allows HTML files to include other HTML files.
 */
function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}
function getPage(pageName) {
  const pageCapabilities = {
    Dashboard: "view_intelligence",
    Sessions: "run_sessions",
    Evaluations: "evaluate_players",
    Game: "run_sessions",
    Players: "evaluate_players",
    Leaderboard: "view_intelligence",
    Staff: "manage_settings",
    AI: "view_intelligence",
    Settings: "manage_settings",
    GettingStarted: ""
  };
  if (!Object.prototype.hasOwnProperty.call(pageCapabilities, pageName)) {
    throw new Error("That CoachIQ page is not available.");
  }
  if (pageCapabilities[pageName]) requireStaffCapability_(pageCapabilities[pageName]);
  return HtmlService
    .createHtmlOutputFromFile(pageName)
    .getContent();
}
function testHtml() {

  const html = HtmlService
    .createTemplateFromFile("Index")
    .evaluate()
    .getContent();

  Logger.log(html);

}
