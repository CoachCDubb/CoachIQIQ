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