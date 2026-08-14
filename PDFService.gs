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
  const themeSettings = getCoachIQSettings();
  const pointLabels = getProgramPointLabels_();
  const primaryColor = normalizeThemeColor_(themeSettings.primaryColor, "#1E3A5F");
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
      color:${primaryColor};
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
      <td><strong>${escapeHtml(pointLabels.points)}</strong></td>
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

function getLeaderboardPdf(options){

  options = options || {};
  const players = getLeaderboard(options);
  const themeSettings = getCoachIQSettings();
  const pointLabels = getProgramPointLabels_();
  const primaryColor = normalizeThemeColor_(themeSettings.primaryColor, "#1E3A5F");
  const escapeHtml = function(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };
  const rows = players.map(function(player){
    return `<tr>
      <td>${player.rank}</td>
      <td>${escapeHtml(player.firstName + " " + player.lastName)}</td>
      <td>${escapeHtml(player.team)}</td>
      <td>${player.positive}</td>
      <td>${player.negative}</td>
      <td><strong>${player.points}</strong></td>
    </tr>`;
  }).join("");
  const html = `<html><body style="font-family:Arial;padding:36px;color:#1f2937;">
    <h1 style="color:${primaryColor};">CoachIQ ${escapeHtml(pointLabels.leaderboard)}</h1>
    <p>${options.team ? "Team: " + escapeHtml(options.team) : "All Teams"}</p>
    <table style="width:100%;border-collapse:collapse;" border="1" cellpadding="9">
      <thead><tr><th>Rank</th><th>Player</th><th>Team</th><th>Positive</th><th>Negative</th><th>Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></body></html>`;
  const pdf = Utilities.newBlob(html, "text/html", "Leaderboard.html")
    .getAs(MimeType.PDF)
    .setName("CoachIQ_" + pointLabels.leaderboard.replace(/[^A-Za-z0-9_-]/g, "_") + ".pdf");

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
