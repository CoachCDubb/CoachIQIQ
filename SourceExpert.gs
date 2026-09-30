/**
 * TEMPORARY TEST:
 * Checks whether this Apps Script project can read its own source
 * through the Apps Script API.
 *
 * This function DOES NOT modify the project.
 */
function testCoachIQSourceAccess() {
  const scriptId = ScriptApp.getScriptId();
  const token = ScriptApp.getOAuthToken();

  const url =
    "https://script.googleapis.com/v1/projects/" +
    encodeURIComponent(scriptId) +
    "/content";

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: "Bearer " + token
    },
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const body = response.getContentText();

  console.log("HTTP STATUS: " + status);

  if (status !== 200) {
    console.log("API RESPONSE:");
    console.log(body);

    throw new Error(
      "Apps Script API source test failed. HTTP status: " + status +
      ". Open the execution log to see Google's response."
    );
  }

  const data = JSON.parse(body);
  const files = data.files || [];

  console.log("SUCCESS!");
  console.log("Source files found: " + files.length);
  console.log("================================");

  files.forEach(function(file, index) {
    console.log(
      (index + 1) +
      ". " +
      file.name +
      " [" +
      file.type +
      "]"
    );
  });

  console.log("================================");
  console.log("READ-ONLY TEST COMPLETE.");

  return {
    success: true,
    fileCount: files.length,
    files: files.map(function(file) {
      return {
        name: file.name,
        type: file.type
      };
    })
  };
}