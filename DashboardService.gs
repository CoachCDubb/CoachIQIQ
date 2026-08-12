/**
 * Returns the core dashboard statistics.
 */
function getDashboardDataCore(){

  const ss = SpreadsheetApp.getActive();

  // -----------------------------
  // Active Players
  // -----------------------------
  const playerSheet = ss.getSheetByName("Players");
  const playerData = playerSheet.getDataRange().getValues();

  const activePlayers = playerData
    .slice(1)
    .filter(row => row[7] === "Active").length;

  // -----------------------------
  // Latest Session
  // -----------------------------
  const sessionSheet = ss.getSheetByName("Sessions");
  const sessionData = sessionSheet.getDataRange().getValues();

  const latest =
    sessionData.length > 1
      ? sessionData[sessionData.length - 1]
      : null;

// -----------------------------
// Season Stats
// -----------------------------
const players = getPlayersForUI();

let totalPresent = 0;
let totalAbsent = 0;

let cultureTotal = 0;
let cultureCount = 0;

players.forEach(function(player){

  const playerId = player[0];

  const stats = getPlayerSeasonStatsByPlayer(playerId);

    const culture =
Number(stats["Culture Score"] || 0);

const attendance = getPlayerAttendance(playerId);

if ((attendance.present + attendance.absent) > 0) {

  totalPresent += attendance.present;
  totalAbsent += attendance.absent;

}

  // Only include players with a real culture score
  if(culture > 0){

    cultureTotal += culture;
    cultureCount++;

  }

});

  return {

    activePlayers,

    latest,

    attendance:
  (totalPresent + totalAbsent) > 0
    ? Math.round(
        (totalPresent / (totalPresent + totalAbsent)) * 100
      )
    : 0,

    cultureScore:
      cultureCount
      ? Math.round((cultureTotal / cultureCount) * 10) / 10
      : 0,

    totalSessions:
      Math.max(sessionData.length - 1, 0)

  };

}
/**
 * Returns dashboard statistics.
 */
function getDashboardData(){

const stats = getDashboardDataCore();

const activePlayers = stats.activePlayers;

const latest = stats.latest;

const attendance = stats.attendance;

const cultureScore = stats.cultureScore;

  return {

    activePlayers: activePlayers,

    latestSession: latest
      ? latest[1] + " • " + latest[6]
      : "No Sessions",

    attendance: attendance,

    cultureScore: cultureScore,

    pointLeader: (function(){

  const leader = getPantherPointLeader();

  if(!leader){
    return "No Panther Points yet.";
  }

  return `
    🥇 <strong>${leader.name}</strong><br>
    ${leader.points} Panther Points
  `;

})(),

    recentActivity: getRecentActivity(),

insight: getDashboardInsight(),

trends: getDashboardTrends(),

focus: getDashboardFocus()

  };

}
/**
 * Returns recent dashboard activity.
 */
function getRecentActivity(){

  const activity = [];

  const sessionSheet = SpreadsheetApp.getActive().getSheetByName("Sessions");

  if(sessionSheet.getLastRow() > 1){

    const last = sessionSheet
      .getRange(
        sessionSheet.getLastRow(),
        1,
        1,
        sessionSheet.getLastColumn()
      )
      .getValues()[0];

    activity.push(`
      <div style="margin-bottom:12px;">
        🏀 <strong>${last[1]}</strong><br>
        <span style="color:#777;">${last[6]}</span>
      </div>
    `);

  }

  const leader = getPantherPointLeader();

  if(leader){

    activity.push(`
      <div style="margin-bottom:12px;">
        🏆 <strong>${leader.name}</strong><br>
        <span style="color:#777;">${leader.points} Panther Points</span>
      </div>
    `);

  }

  return activity.join("");
}
/**
 * Returns a dashboard insight.
 */
function getDashboardInsight(){

  const stats = getDashboardDataCore();

  const attendance = stats.attendance;
  const culture = stats.cultureScore;

  const leader = getPantherPointLeader();

  let insight = "";

  // Attendance
  if(attendance >= 90){

    insight += "✅ Attendance is outstanding. ";

  }else if(attendance >= 75){

    insight += "👍 Attendance is solid but has room to improve. ";

  }else{

    insight += "⚠️ Attendance is below the program standard. ";

  }

  // Culture
  if(culture >= 4){

    insight += "Culture is becoming a strength. ";

  }else if(culture >= 3){

    insight += "Culture is trending in the right direction. ";

  }else{

    insight += "Continue emphasizing your program pillars daily. ";

  }

  // Panther Leader
  if(leader){

    insight +=
      leader.name +
      " currently leads the program with " +
      leader.points +
      " Panther Points.";

  }

  return insight;

}
/**
 * Returns dashboard trend data.
 */
function getDashboardTrends(){

  const stats = getDashboardDataCore();

  return `
  
    <div style="margin-bottom:18px;">

      <strong>📅 Attendance</strong><br>

      <div style="
        background:#eee;
        height:10px;
        border-radius:6px;
        overflow:hidden;
        margin:6px 0;
      ">
        <div style="
          width:${stats.attendance}%;
          height:100%;
          background:#22C55E;
        "></div>
      </div>

      ${stats.attendance}%

    </div>

    <div style="margin-bottom:18px;">

      <strong>⭐ Culture Score</strong><br>

      <div style="
        background:#eee;
        height:10px;
        border-radius:6px;
        overflow:hidden;
        margin:6px 0;
      ">
        <div style="
          width:${(stats.cultureScore/5)*100}%;
          height:100%;
          background:#FDB927;
        "></div>
      </div>

      ${stats.cultureScore} / 5

    </div>

    <div>

      <strong>🏀 Sessions Completed</strong><br>

      ${stats.totalSessions}

    </div>

  `;

}
/**
 * Returns today's coaching focus.
 */
function getDashboardFocus(){

  const stats = getDashboardDataCore();

  const leader = getPantherPointLeader();

  // Attendance is priority
  if(stats.attendance < 75){

    return `
      📉 Attendance is only <strong>${stats.attendance}%</strong>.
      Reach out to players who are missing sessions and reinforce accountability.
    `;

  }

  // Culture
  if(stats.cultureScore < 3){

    return `
      ⭐ Your culture score is currently
      <strong>${stats.cultureScore}</strong>.
      Spend today's practice emphasizing your program pillars.
    `;

  }

  // Panther Leader
  if(leader){

    return `
      🏆 <strong>${leader.name}</strong>
      leads the program with
      <strong>${leader.points}</strong>
      Panther Points.
      Find a way to recognize him today.
    `;

  }

  return `
    ✅ Everything looks healthy today.
    Keep stacking great practices.
  `;

}