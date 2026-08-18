/**
 * Returns the core dashboard statistics.
 */
function getDashboardDataCore(){

  const ss = getCoachIQSpreadsheet_();

  // -----------------------------
  // Active Players
  // -----------------------------
  const playerSheet = ss.getSheetByName("Players");
const playerData = playerSheet.getDataRange().getValues();
const activePlayerRows = playerData
  .slice(1)
  .filter(row => row[7] === "Active");
const activePlayerIds = {};

activePlayerRows.forEach(function(row){
  activePlayerIds[String(row[0])] = true;
});

  const activePlayers = activePlayerRows.length;

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
let totalPresent = 0;
let totalAbsent = 0;
let cultureTotal = 0;
let cultureCount = 0;
const evaluationSheet = ss.getSheetByName("Practice Evaluations");
const evaluationData = evaluationSheet.getDataRange().getValues();
const evaluationHeaders = evaluationData[0] || [];
const evaluationPlayerIndex = evaluationHeaders.indexOf("Player ID");
const attendanceIndex = evaluationHeaders.indexOf("Attendance");
const completeIndex = evaluationHeaders.indexOf("Complete");
const evaluationPointTotals = {};
const categoryIndexes = getSettingList("Culture Categories").map(function(category){
  return evaluationHeaders.indexOf(category);
}).filter(function(index){ return index >= 0; });

evaluationData.slice(1).forEach(function(row){
  if(evaluationPlayerIndex < 0 || attendanceIndex < 0){
    return;
  }
  if(!activePlayerIds[String(row[evaluationPlayerIndex])]){
    return;
  }

  if(row[attendanceIndex] === true){
    totalPresent++;
  }else if(row[attendanceIndex] === false){
    totalAbsent++;
  }
  const complete = completeIndex < 0 || row[completeIndex] === true || String(row[completeIndex]).toUpperCase() === "TRUE";
  if(complete){
    const playerId=String(row[evaluationPlayerIndex]||"");
    categoryIndexes.forEach(function(index){
      const score=Number(row[index]);
      if(Number.isFinite(score)&&score>=1&&score<=5){evaluationPointTotals[playerId]=(evaluationPointTotals[playerId]||0)+score;}
    });
  }
});

getPlayerSeasonStats().forEach(function(stat){
  if(activePlayerIds[String(stat["Player ID"])] &&
     stat["Stat"] === "Culture Score"){
    const culture = Number(stat["Value"] || 0);

    if(culture > 0){
      cultureTotal += culture;
      cultureCount++;
    }
  }
});

const culturePointTotals={};
const culturePointSheet=ss.getSheetByName("Culture Points");
if(culturePointSheet&&culturePointSheet.getLastRow()>1){
  const cultureRows=culturePointSheet.getDataRange().getValues(),cultureHeaders=cultureRows.shift();
  const culturePlayerIndex=cultureHeaders.indexOf("Player ID"),pointsIndex=cultureHeaders.indexOf("Points");
  if(culturePlayerIndex>=0&&pointsIndex>=0){cultureRows.forEach(function(row){const playerId=String(row[culturePlayerIndex]||"");culturePointTotals[playerId]=(culturePointTotals[playerId]||0)+(Number(row[pointsIndex])||0);});}
}
let leader=null;
activePlayerRows.forEach(function(row){
  const playerId=String(row[0]||""),points=(culturePointTotals[playerId]||0)+(evaluationPointTotals[playerId]||0);
  if(!leader||points>leader.points){leader={name:String(row[1]||"")+" "+String(row[2]||""),points:points};}
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
      Math.max(sessionData.length - 1, 0),

    leader: leader

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
const leader = stats.leader;

  return {

    activePlayers: activePlayers,

    latestSession: latest
      ? latest[1] + " • " + latest[6]
      : "No Sessions",

    attendance: attendance,

    cultureScore: cultureScore,

    pointLeader: (function(){

  if(!leader){
    return "No Panther Points yet.";
  }

  return `
    🥇 <strong>${leader.name}</strong><br>
    ${leader.points} Panther Points
  `;

})(),

    recentActivity: getRecentActivity(latest, leader),

insight: getDashboardInsight(stats, leader),

trends: getDashboardTrends(stats),

focus: getDashboardFocus(stats, leader)

  };

}
/**
 * Returns recent dashboard activity.
 */
function getRecentActivity(latest, leader){

  const activity = [];

  if(latest){

    activity.push(`
      <div style="margin-bottom:12px;">
        🏀 <strong>${latest[1]}</strong><br>
        <span style="color:#777;">${latest[6]}</span>
      </div>
    `);

  }

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
function getDashboardInsight(stats, leader){

  stats = stats || getDashboardDataCore();

  const attendance = stats.attendance;
  const culture = stats.cultureScore;

  leader = leader || stats.leader;

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
function getDashboardTrends(stats){

  stats = stats || getDashboardDataCore();

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
function getDashboardFocus(stats, leader){

  stats = stats || getDashboardDataCore();
  leader = leader || stats.leader;

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
