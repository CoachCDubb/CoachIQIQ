/**
 * ======================================
 * Builds the Player Report HTML
 * ======================================
 */
function buildPlayerReportHTML(playerId, report){

  report = report || getPlayerReportData(playerId);
  const player = report.player || {};
  const attendance = report.attendance || {};
  const points = report.points || {};
  const overallGrade = Number(report.overallGrade || 0);
  const escapeHtml = function(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  return `
  <html>

  <body style="
      font-family:Arial,sans-serif;
      padding:40px;
      color:#222;
  ">

  <h1 style="
      color:#1E3A5F;
      margin-bottom:0;
  ">
      CoachIQ Player Report
  </h1>

  <h2 style="margin-top:8px;">
      ${escapeHtml(player.firstName)}
      ${escapeHtml(player.lastName)}
  </h2>

  <hr>

  <h3>Overall Snapshot</h3>

  <table style="
      width:100%;
      border-collapse:collapse;
  ">

  <tr>
      <td><strong>Overall Grade</strong></td>
      <td>${overallGrade.toFixed(1)} / 5</td>
  </tr>

  <tr>
      <td><strong>Attendance</strong></td>
      <td>${Number(attendance.seasonPercentage || 0)}%</td>
  </tr>

  <tr>
      <td><strong>Panther Points</strong></td>
      <td>${Number(points.total || 0)}</td>
  </tr>

  </table>

  <br>

  <h3>CoachIQ Insight</h3>

  <p>

      ${escapeHtml(report.summary)}

  </p>

  </body>

  </html>
  `;

}

function getPlayerReportPdf(playerId){

  const report = getPlayerReportData(playerId);
  const player = report.player || {};
  const safeName = String(
    (player.firstName || "Player") + "_" + (player.lastName || "Report")
  ).replace(/[^A-Za-z0-9_-]/g, "_");
  const html = buildPlayerReportHTML(playerId, report);
  const pdf = Utilities.newBlob(html, "text/html", safeName + ".html")
    .getAs(MimeType.PDF)
    .setName(safeName + "_CoachIQ_Report.pdf");

  return {
    fileName: pdf.getName(),
    base64: Utilities.base64Encode(pdf.getBytes())
  };

}
function testPlayerReportHTML(){

Logger.log(

buildPlayerReportHTML("P001")

);

}
