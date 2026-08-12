/**
 * ======================================
 * Builds the Player Report HTML
 * ======================================
 */
function buildPlayerReportHTML(playerId){

  const report = getPlayerReportData(playerId);

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
      ${report.player.firstName}
      ${report.player.lastName}
  </h2>

  <hr>

  <h3>Overall Snapshot</h3>

  <table style="
      width:100%;
      border-collapse:collapse;
  ">

  <tr>
      <td><strong>Overall Grade</strong></td>
      <td>${report.overallGrade.toFixed(1)} / 5</td>
  </tr>

  <tr>
      <td><strong>Attendance</strong></td>
      <td>${report.attendance.seasonPercentage}%</td>
  </tr>

  <tr>
      <td><strong>Panther Points</strong></td>
      <td>${report.points.total}</td>
  </tr>

  </table>

  <br>

  <h3>CoachIQ Insight</h3>

  <p>

      ${report.summary}

  </p>

  </body>

  </html>
  `;

}
function testPlayerReportHTML(){

Logger.log(

buildPlayerReportHTML("P001")

);

}