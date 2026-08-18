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
  if (pageName === "Staff" || pageName === "Settings") {
    requireStaffCapability_("manage_settings");
  }
  if (pageName === "AI") requireStaffCapability_("view_intelligence");
  if (pageName === "Game") requireStaffCapability_("run_sessions");
  if (pageName === "Sessions") requireStaffCapability_("run_sessions");
  if (pageName === "Evaluations") requireStaffCapability_("evaluate_players");
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
