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
    .addItem("Check iPad Web App", "showCoachIQWebAppLink")
    .addToUi();
}

/**
 * Serves CoachIQ as a private web app for tablets and phones.
 */
function doGet() {
  try {
    getCoachIQSpreadsheet_();
    return HtmlService
      .createTemplateFromFile("Index")
      .evaluate()
      .setTitle("CoachIQ")
      .addMetaTag("viewport", "width=device-width, initial-scale=1, viewport-fit=cover");
  } catch (error) {
    return renderCoachIQConnectionError_(error);
  }
}

/**
 * Shows the currently deployed /exec link from inside the bound spreadsheet.
 * This prevents coaches from bookmarking an editor-only /dev URL or an older
 * deployment URL on an iPad.
 */
function showCoachIQWebAppLink() {
  const spreadsheet = rememberCoachIQSpreadsheet_();
  const url = String(ScriptApp.getService().getUrl() || "");
  const deployed = /\/exec(?:\?|$)/.test(url);
  const safeUrl = escapeCoachIQHtml_(url);
  const safeSheet = escapeCoachIQHtml_(spreadsheet ? spreadsheet.getName() : "Not connected");
  const linkMarkup = deployed
    ? '<a href="' + safeUrl + '" target="_blank" style="word-break:break-all">' + safeUrl + '</a>'
    : '<strong>No active web-app deployment was found.</strong>';
  const instructions = deployed
    ? "Open this exact link in Safari. If an old CoachIQ icon exists, delete it and add this link to the Home Screen again."
    : "In Apps Script, select Deploy → New deployment → Web app, complete the deployment, then run this check again.";
  const html = HtmlService.createHtmlOutput(
    '<div style="font-family:Arial,sans-serif;padding:22px;line-height:1.5">' +
      '<h2 style="margin-top:0">CoachIQ iPad Link</h2>' +
      '<p><strong>Spreadsheet:</strong> ' + safeSheet + '</p>' +
      '<p><strong>Web app:</strong><br>' + linkMarkup + '</p>' +
      '<p>' + escapeCoachIQHtml_(instructions) + '</p>' +
    '</div>'
  ).setWidth(560).setHeight(310);
  SpreadsheetApp.getUi().showModalDialog(html, "CoachIQ iPad Link");
}

function renderCoachIQConnectionError_(error) {
  const message = escapeCoachIQHtml_(error && error.message ? error.message : "CoachIQ could not open its spreadsheet.");
  return HtmlService.createHtmlOutput(
    '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>CoachIQ connection help</title></head><body style="margin:0;background:#f4f7fb;font-family:Arial,sans-serif;color:#172033">' +
    '<main style="max-width:680px;margin:50px auto;padding:28px;background:white;border-top:6px solid #2563eb;box-shadow:0 15px 40px rgba(15,23,42,.12)">' +
    '<h1 style="margin-top:0">CoachIQ needs to reconnect</h1><p>' + message + '</p>' +
    '<ol><li>Open the CoachIQ spreadsheet on a computer.</li><li>Refresh the spreadsheet.</li>' +
    '<li>Select CoachIQ → Check iPad Web App.</li><li>Open the exact /exec link shown there.</li>' +
    '<li>Make sure this Google account has access to the spreadsheet.</li></ol>' +
    '<p>If an old Home Screen icon exists, delete it and add the verified link again.</p></main></body></html>'
  ).setTitle("CoachIQ connection help");
}

function escapeCoachIQHtml_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
