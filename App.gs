/**
 * =====================================================
 * CoachIQ Application Entry Point
 * =====================================================
 */

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
    PropertiesService.getScriptProperties().setProperty("COACHIQ_SPREADSHEET_ID", spreadsheet.getId());
  }
  return spreadsheet;
}

function getCoachIQSpreadsheet_() {
  const activeSpreadsheet = rememberCoachIQSpreadsheet_();
  if (activeSpreadsheet) return activeSpreadsheet;

  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("COACHIQ_SPREADSHEET_ID");
  if (!spreadsheetId) {
    throw new Error("CoachIQ is not connected to a spreadsheet. Open the CoachIQ spreadsheet on a computer, refresh it, and try again.");
  }
  return SpreadsheetApp.openById(spreadsheetId);
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
