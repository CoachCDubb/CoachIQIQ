/**
 * =====================================================
 * CoachIQ Application Entry Point
 * =====================================================
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("CoachIQ")
    .addItem("Launch CoachIQ", "launchCoachIQ")
    .addToUi();
}

function launchCoachIQ() {

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
