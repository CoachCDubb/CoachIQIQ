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

  const html = buildCoachIQHtml_()
    .setWidth(1600)
    .setHeight(900);

  SpreadsheetApp.getUi().showModalDialog(html, "CoachIQ");

}

/** Serves the same CoachIQ build to the deployed iPad/web-app URL. */
function doGet() {
  return buildCoachIQHtml_();
}

/** Keeps dialog and web deployments on one source-controlled entry point. */
function buildCoachIQHtml_() {
  return HtmlService
    .createTemplateFromFile("Index")
    .evaluate()
    .setTitle("CoachIQ");
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

/** Returns authorized, static page templates in one request for fast navigation. */
function getCoachIQPageBundle() {
  const access = getCurrentStaffAccess_();
  const capabilities = access.capabilities || [];
  const allowed = {
    Dashboard:true, Players:true, Leaderboard:true, GettingStarted:true, PlayerProfile:true,
    Sessions:capabilities.indexOf("run_sessions") >= 0,
    Game:capabilities.indexOf("run_sessions") >= 0,
    Evaluations:capabilities.indexOf("evaluate_players") >= 0,
    Staff:capabilities.indexOf("manage_settings") >= 0,
    Settings:capabilities.indexOf("manage_settings") >= 0,
    AI:capabilities.indexOf("view_intelligence") >= 0
  };
  const pages = {};
  Object.keys(allowed).forEach(function(pageName) {
    if (allowed[pageName]) pages[pageName] = HtmlService.createHtmlOutputFromFile(pageName).getContent();
  });
  return pages;
}
function testHtml() {

  const html = HtmlService
    .createTemplateFromFile("Index")
    .evaluate()
    .getContent();

  Logger.log(html);

}