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
  const secondaryColor = normalizeThemeColor_(themeSettings.secondaryColor, "#F59E0B");
  const escapeHtml = function(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };
  const formatDate = function(value){
    if(!value){ return "—"; }
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime())
      ? escapeHtml(value)
      : Utilities.formatDate(date, Session.getScriptTimeZone(), "MMM d, yyyy");
  };
  const formatScore = function(value){
    const score = Number(value);
    return isFinite(score) && score > 0 ? score.toFixed(1) + " / 5.0" : "Not rated";
  };
  const trendRows = Object.keys(report.trend || {}).map(function(category){
    const trend = report.trend[category] || {};
    return `<tr><td><strong>${escapeHtml(category)}</strong></td><td>${formatScore(trend.average)}</td><td>${escapeHtml(trend.trend || "Not Yet Rated")}</td><td>${escapeHtml((trend.history || []).join(", ") || "—")}</td></tr>`;
  }).join("");
  const seasonRows = Object.keys(report.season || {}).map(function(stat){
    return `<tr><td>${escapeHtml(stat)}</td><td>${escapeHtml(report.season[stat])}</td></tr>`;
  }).join("");
  const pointBreakdownRows = Object.keys(points.breakdown || {}).map(function(category){
    return `<tr><td>${escapeHtml(category)}</td><td>${Number(points.breakdown[category] || 0)}</td></tr>`;
  }).join("");
  const pointHistoryRows = (points.history || []).map(function(point){
    return `<tr><td>${formatDate(point.Date)}</td><td>${escapeHtml(point["Category Name"] || "Program points")}</td><td>${Number(point.Points || 0)}</td><td>${escapeHtml(point.Notes || "")}</td><td>${escapeHtml(point.Coach || "")}</td></tr>`;
  }).join("");
  const evaluationCards = (report.evaluations || []).map(function(evaluation){
    const scoreCells = Object.keys(evaluation.scores || {}).map(function(category){
      return `<td><strong>${escapeHtml(category)}</strong><br>${formatScore(evaluation.scores[category])}</td>`;
    }).join("");
    return `<div class="evaluation">
      <div class="evaluation-title"><strong>${formatDate(evaluation.date)} · ${escapeHtml(evaluation.sessionType)}</strong><span>${escapeHtml(evaluation.sessionId)}</span></div>
      <div class="meta">Team: ${escapeHtml(evaluation.teams || "—")} · Evaluator: ${escapeHtml(evaluation.evaluator || "—")} · Attendance: ${evaluation.attendance ? "Present" : "Absent"}</div>
      <table class="score-grid"><tr>${scoreCells || "<td>No scores recorded.</td>"}</tr></table>
      <p><strong>Reward:</strong> ${escapeHtml(evaluation.reward || "None")}</p>
      <p><strong>Coach notes:</strong> ${escapeHtml(evaluation.notes || "No notes recorded.")}</p>
    </div>`;
  }).join("");
  const timelineRows = (report.timeline || []).map(function(event){
    return `<tr><td>${formatDate(event.date)}</td><td>${escapeHtml(event.category || "Activity")}</td><td><strong>${escapeHtml(event.title || "")}</strong><br>${escapeHtml(event.details || "")}</td></tr>`;
  }).join("");
  const totalPractices = Number(attendance.present || 0) + Number(attendance.absent || 0);
  const overallDisplay = overallGrade > 0 ? overallGrade.toFixed(1) + " / 5.0" : "Not yet evaluated";

  return `
  <html><head><style>
    @page{margin:34px 38px;} body{font-family:Arial,sans-serif;color:#1f2937;font-size:10px;line-height:1.45;} h1,h2,h3{color:${primaryColor};margin:0;} h1{font-size:25px;} h2{font-size:18px;margin-bottom:8px;} h3{font-size:14px;margin:18px 0 8px;border-bottom:2px solid ${secondaryColor};padding-bottom:5px;} p{margin:5px 0;} table{width:100%;border-collapse:collapse;} th{background:${primaryColor};color:white;text-align:left;padding:7px;} td{border:1px solid #dfe4ea;padding:7px;vertical-align:top;} .header{border-bottom:5px solid ${secondaryColor};padding-bottom:15px;margin-bottom:16px;} .program{color:#6b7280;font-size:11px;margin-bottom:4px;} .confidential{float:right;color:#991b1b;font-size:9px;font-weight:bold;text-transform:uppercase;} .identity{background:#f3f6f9;border-left:5px solid ${primaryColor};padding:12px;margin:10px 0 14px;} .snapshot{width:100%;margin:8px 0;} .snapshot td{text-align:center;width:25%;background:#f8fafc;} .big{display:block;font-size:18px;font-weight:bold;color:${primaryColor};} .insight{background:#fff8e8;border:1px solid #f5d992;padding:12px;border-radius:7px;} .evaluation{page-break-inside:avoid;border:1px solid #dfe4ea;margin:10px 0;padding:10px;} .evaluation-title{display:flex;justify-content:space-between;color:${primaryColor};font-size:11px;} .meta{color:#6b7280;margin:5px 0 8px;} .score-grid td{text-align:center;background:#f8fafc;} .section{page-break-inside:auto;} .page-break{page-break-before:always;} .footer{margin-top:22px;padding-top:8px;border-top:1px solid #dfe4ea;color:#6b7280;font-size:8px;}
  </style></head><body>
    <div class="header"><span class="confidential">Confidential player report</span><div class="program">${escapeHtml(themeSettings.programName || "CoachIQ")} · ${escapeHtml(themeSettings.currentSeason || "Current Season")}</div><h1>CoachIQ Player Development Report</h1><p>Generated ${formatDate(report.generated)}</p></div>
    <h2>${escapeHtml(player.firstName)} ${escapeHtml(player.lastName)}</h2>
    <div class="identity"><strong>Player ID:</strong> ${escapeHtml(player.id || playerId)} &nbsp; | &nbsp; <strong>Team:</strong> ${escapeHtml(player.team || "—")} &nbsp; | &nbsp; <strong>Jersey:</strong> ${escapeHtml(player.jersey || "—")} &nbsp; | &nbsp; <strong>Grade:</strong> ${escapeHtml(player.grade || "—")} &nbsp; | &nbsp; <strong>Position:</strong> ${escapeHtml(player.position || "—")} &nbsp; | &nbsp; <strong>Status:</strong> ${escapeHtml(player.status || "—")}</div>
    <table class="snapshot"><tr><td><span class="big">${overallDisplay}</span>${escapeHtml(report.overallLabel || "Overall Grade")}</td><td><span class="big">${Number(attendance.seasonPercentage || 0)}%</span>Attendance</td><td><span class="big">${totalPractices}</span>Evaluated Sessions</td><td><span class="big">${Number(points.total || 0)}</span>${escapeHtml(pointLabels.points)}</td></tr></table>
    <h3>CoachIQ Development Insight</h3><div class="insight">${escapeHtml(report.summary || "More completed evaluations are needed before CoachIQ can provide a development insight.")}</div>
    <h3>Attendance Detail</h3><table><tr><th>Present</th><th>Absent</th><th>Total</th><th>Season Percentage</th><th>Last Five</th></tr><tr><td>${Number(attendance.present || 0)}</td><td>${Number(attendance.absent || 0)}</td><td>${totalPractices}</td><td>${Number(attendance.seasonPercentage || 0)}%</td><td>${escapeHtml((attendance.last5 || []).map(function(value){ return value ? "Present" : "Absent"; }).join(", ") || "No attendance yet")}</td></tr></table>
    <h3>Program Pillar Development</h3><table><tr><th>Pillar</th><th>Average</th><th>Trend</th><th>Recent Scores</th></tr>${trendRows || "<tr><td colspan='4'>No pillar evaluations recorded.</td></tr>"}</table>
    <h3>Strengths and Growth Areas</h3><table><tr><th>Strongest Current Pillar</th><th>Primary Growth Area</th></tr><tr><td>${escapeHtml((report.strengths || {}).strongest || "Not enough data")}</td><td>${escapeHtml((report.strengths || {}).weakest || "Not enough data")}</td></tr></table>
    <h3>Season Statistics</h3><table><tr><th>Statistic</th><th>Value</th></tr>${seasonRows || "<tr><td colspan='2'>No additional season statistics recorded.</td></tr>"}</table>
    <div class="page-break"></div><h2>Session-by-Session Evaluations</h2><p>Completed evaluations, most recent first.</p>${evaluationCards || "<p>No completed session evaluations are available.</p>"}
    <h3>${escapeHtml(pointLabels.points)} Summary</h3><table><tr><th>Positive</th><th>Negative</th><th>Net Total</th></tr><tr><td>${Number(points.positive || 0)}</td><td>${Number(points.negative || 0)}</td><td>${Number(points.total || 0)}</td></tr></table>
    <h3>${escapeHtml(pointLabels.points)} by Category</h3><table><tr><th>Category</th><th>Points</th></tr>${pointBreakdownRows || "<tr><td colspan='2'>No points awarded.</td></tr>"}</table>
    <h3>Recognition and Reward History</h3><table><tr><th>Date</th><th>Category</th><th>Points</th><th>Reason / Notes</th><th>Coach</th></tr>${pointHistoryRows || "<tr><td colspan='5'>No reward history recorded.</td></tr>"}</table>
    <h3>Player Timeline</h3><table><tr><th>Date</th><th>Category</th><th>Activity</th></tr>${timelineRows || "<tr><td colspan='3'>No timeline activity recorded.</td></tr>"}</table>
    <div class="footer">This report summarizes information entered by authorized coaching staff. Use it as a conversation guide for athlete development. Protect it as confidential student information.</div>
  </body></html>
  `;

}

function getPlayerReportPdf(playerId){
  if(!playerId){
    throw new Error("A player is required to build the report.");
  }

  try{
    const report = getPlayerReportData(playerId);
    const player = report.player || {};
    const safeName = String(
      (player.firstName || "Player") + "_" + (player.lastName || "Report")
    ).replace(/[^A-Za-z0-9_-]/g, "_");
    const fileName = safeName + "_CoachIQ_Report.pdf";
    let pdf;

    try{
      pdf = convertPlayerReportHtmlToPdf_(
        buildPlayerReportHTML(playerId, report),
        safeName,
        fileName
      );
    }catch(richReportError){
      console.warn("Rich player PDF conversion failed; using compatible layout: " + richReportError);
      pdf = convertPlayerReportHtmlToPdf_(
        buildCompatiblePlayerReportHTML_(playerId, report),
        safeName + "_compatible",
        fileName
      );
    }
    const bytes = pdf.getBytes();

    if(!bytes || !bytes.length){
      throw new Error("Google returned an empty PDF file.");
    }

    return {
      fileName: pdf.getName(),
      base64: Utilities.base64Encode(bytes)
    };
  }catch(error){
    console.error("Player PDF generation failed for " + playerId + ": " + error);
    throw new Error("Unable to generate this player PDF. " + (error.message || error));
  }

}

function convertPlayerReportHtmlToPdf_(html, sourceName, fileName){
  return Utilities.newBlob(html, "text/html", sourceName + ".html")
    .getAs(MimeType.PDF)
    .setName(fileName);
}

/**
 * Conservative fallback for Google's HTML-to-PDF converter. It deliberately
 * avoids flexbox, floats, CSS variables, page rules, and nested layout tables.
 * The content remains detailed even when the richer presentation is rejected.
 */
function buildCompatiblePlayerReportHTML_(playerId, report){
  const player = report.player || {};
  const attendance = report.attendance || {};
  const points = report.points || {};
  const escapeHtml = function(value){
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };
  const rows = function(items){
    return items.join("") || "<p>No information recorded.</p>";
  };
  const evaluationRows = rows((report.evaluations || []).map(function(evaluation){
    const scoreText = Object.keys(evaluation.scores || {}).map(function(category){
      const score = Number(evaluation.scores[category]);
      return category + ": " + (isFinite(score) && score > 0 ? score.toFixed(1) + "/5" : "Not rated");
    }).join("; ");
    return "<h3>" + escapeHtml(evaluation.date || "Undated session") + " - " + escapeHtml(evaluation.sessionType || "Session") + "</h3>" +
      "<p><b>Session:</b> " + escapeHtml(evaluation.sessionId || "") + " | <b>Team:</b> " + escapeHtml(evaluation.teams || "") +
      " | <b>Evaluator:</b> " + escapeHtml(evaluation.evaluator || "") + " | <b>Attendance:</b> " + (evaluation.attendance ? "Present" : "Absent") + "</p>" +
      "<p><b>Scores:</b> " + escapeHtml(scoreText || "No scores recorded") + "</p>" +
      "<p><b>Reward:</b> " + escapeHtml(evaluation.reward || "None") + "</p>" +
      "<p><b>Coach notes:</b> " + escapeHtml(evaluation.notes || "No notes recorded") + "</p>";
  }));
  const pointRows = (points.history || []).map(function(point){
    return "<tr><td>" + escapeHtml(point.Date || "") + "</td><td>" + escapeHtml(point["Category Name"] || "") +
      "</td><td>" + escapeHtml(point.Points || 0) + "</td><td>" + escapeHtml(point.Notes || "") + "</td></tr>";
  }).join("") || "<tr><td colspan='4'>No points recorded.</td></tr>";
  const timelineRows = (report.timeline || []).map(function(event){
    return "<tr><td>" + escapeHtml(event.date || "") + "</td><td>" + escapeHtml(event.category || "") +
      "</td><td>" + escapeHtml(event.title || "") + " - " + escapeHtml(event.details || "") + "</td></tr>";
  }).join("") || "<tr><td colspan='3'>No timeline activity recorded.</td></tr>";

  return "<html><head><style>body{font-family:Arial,sans-serif;font-size:10px;color:#222}h1{font-size:22px}h2{font-size:16px;border-bottom:2px solid #333;padding-bottom:4px}h3{font-size:12px;margin-bottom:3px}p{margin:4px 0 8px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th,td{border:1px solid #bbb;padding:5px;text-align:left;vertical-align:top}th{background:#e8e8e8}</style></head><body>" +
    "<h1>CoachIQ Player Development Report</h1>" +
    "<h2>Player</h2><p><b>Name:</b> " + escapeHtml((player.firstName || "") + " " + (player.lastName || "")) +
    " | <b>Player ID:</b> " + escapeHtml(player.id || playerId) + " | <b>Team:</b> " + escapeHtml(player.team || "") +
    " | <b>Jersey:</b> " + escapeHtml(player.jersey || "") + " | <b>Grade:</b> " + escapeHtml(player.grade || "") +
    " | <b>Position:</b> " + escapeHtml(player.position || "") + " | <b>Status:</b> " + escapeHtml(player.status || "") + "</p>" +
    "<h2>Development Summary</h2><p><b>Overall grade:</b> " + escapeHtml(report.overallGrade || "Not yet evaluated") +
    "</p><p>" + escapeHtml(report.summary || "No summary available") + "</p>" +
    "<h2>Attendance</h2><p><b>Present:</b> " + escapeHtml(attendance.present || 0) + " | <b>Absent:</b> " + escapeHtml(attendance.absent || 0) +
    " | <b>Percentage:</b> " + escapeHtml(attendance.seasonPercentage || 0) + "%</p>" +
    "<h2>Session-by-Session Evaluations</h2>" + evaluationRows +
    "<h2>Points and Recognition</h2><p><b>Positive:</b> " + escapeHtml(points.positive || 0) + " | <b>Negative:</b> " + escapeHtml(points.negative || 0) +
    " | <b>Net:</b> " + escapeHtml(points.total || 0) + "</p><table><tr><th>Date</th><th>Category</th><th>Points</th><th>Notes</th></tr>" + pointRows + "</table>" +
    "<h2>Player Timeline</h2><table><tr><th>Date</th><th>Category</th><th>Activity</th></tr>" + timelineRows + "</table>" +
    "<p><i>Confidential student information. Generated by CoachIQ.</i></p></body></html>";
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
