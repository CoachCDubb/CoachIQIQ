/**
 * ======================================
 * CoachIQ Insight Engine
 * ======================================
 *
 * Calculates player trends,
 * team trends,
 * and dashboard recommendations.
 */

function getRecentSessions(limit){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Sessions");

  const data = sheet.getDataRange().getValues();

  const headers = data.shift();

  const sessions = data
    .map(row => rowToObject(headers, row))
    .filter(session => session.Status === "Completed")
    .sort(function(a, b){

      return new Date(b.Created) - new Date(a.Created);

    });

  return sessions.slice(0, limit);

}

function getProgramIntelligence() {
  requireStaffCapability_("view_intelligence");
  const settings = getCoachIQSettings();
  const players = filterPlayersForCurrentStaff_(getPlayers()).filter(function(player) { return player[7] === "Active"; });
  const playerMap = {};
  players.forEach(function(player) { playerMap[String(player[0])] = {id:String(player[0]),name:String(player[1])+" "+String(player[2]),team:String(player[5]||""),position:String(player[6]||"Unassigned")}; });
  const recentIds = getRecentSessionIds(8);
  const sheet = SpreadsheetApp.getActive().getSheetByName("Practice Evaluations");
  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const columns = {}; headers.forEach(function(header,index){columns[header]=index;});
  const categories = settings.cultureCategories || [];
  const summaries = {}, categoryTotals = {};
  categories.forEach(function(category){categoryTotals[category]={sum:0,count:0};});
  let present=0,absent=0;
  data.slice(1).forEach(function(row){
    const player=playerMap[String(row[columns["Player ID"]])];
    if(!player || recentIds.indexOf(row[columns["Session ID"]])<0 || row[columns["Complete"]]!==true)return;
    const summary=summaries[player.id]||(summaries[player.id]={player:player,sum:0,count:0,sessions:0}); summary.sessions++;
    if(row[columns["Attendance"]]===true)present++; else if(row[columns["Attendance"]]===false)absent++;
    categories.forEach(function(category){const value=Number(row[columns[category]]);if(isFinite(value)&&value>0){summary.sum+=value;summary.count++;categoryTotals[category].sum+=value;categoryTotals[category].count++;}});
  });
  const ranked=Object.keys(summaries).map(function(id){const item=summaries[id];return {name:item.player.name,position:item.player.position,team:item.player.team,average:item.count?Math.round(item.sum/item.count*10)/10:0,sessions:item.sessions};}).filter(function(item){return item.sessions>0;}).sort(function(a,b){return b.average-a.average;});
  const positionMap={}; ranked.forEach(function(item){const group=positionMap[item.position]||(positionMap[item.position]={position:item.position,sum:0,count:0});group.sum+=item.average;group.count++;});
  const positions=Object.keys(positionMap).map(function(key){const group=positionMap[key];return {position:key,average:Math.round(group.sum/group.count*10)/10,players:group.count};}).sort(function(a,b){return b.average-a.average;});
  const pillars=categories.map(function(category){const total=categoryTotals[category];return {name:category,average:total.count?Math.round(total.sum/total.count*10)/10:0};}).sort(function(a,b){return a.average-b.average;});
  const attendance=(present+absent)?Math.round(present/(present+absent)*100):0;
  const actions=[];
  const gameIntelligence = getLiveGameProgramTrends_();
  (gameIntelligence.alerts || []).forEach(function(alert){ actions.push(alert); });
  if(attendance<90)actions.push("Attendance is "+attendance+"%. Identify repeat absences before the next practice block.");
  if(pillars.length&&pillars[0].average)actions.push("Make "+pillars[0].name+" a coaching emphasis; it is the lowest-scoring program pillar at "+pillars[0].average+".");
  if(positions.length>1)actions.push("Review the "+positions[positions.length-1].position+" group; its recent average trails other position groups.");
  if(!actions.length)actions.push("Data is stable. Continue the current plan and watch for changes over the next three sessions.");
  return {scope:getCurrentStaffAccess_(),sampleSessions:recentIds.length,activePlayers:players.length,attendance:attendance,pillars:pillars,positions:positions,topPerformers:ranked.slice(0,5),needsAttention:ranked.slice().reverse().slice(0,5),actions:actions,gameIntelligence:gameIntelligence};
}
/**
 * Returns the Session IDs for the most
 * recent completed sessions.
 */
function getRecentSessionIds(limit){

  const sessions = getRecentSessions(limit);

  return sessions.map(function(session){

    return session["Session ID"];

  });

}
/**
 * Returns a player's evaluation history
 * from the most recent completed sessions.
 */
function getPlayerHistory(playerId, limit){

  const sessionIds = getRecentSessionIds(limit);

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const cols = getColumnMap("Practice Evaluations");

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  const data = sheet
    .getDataRange()
    .getValues();

  const settings = getCoachIQSettings();

const categories = settings.cultureCategories;

  const history = [];

  for(let i = 1; i < data.length; i++){

    const row = data[i];

    if(row[cols["Player ID"] - 1] != playerId){
      continue;
    }

   if(!sessionIds.includes(row[cols["Session ID"] - 1])){
  continue;
}

// Ignore evaluations that aren't complete
if(row[cols["Complete"] - 1] !== true){
  continue;
}

    const pillars = {};

    categories.forEach(function(category){

      pillars[category] = row[cols[category] - 1];

    });

 history.push({

  sessionId: row[cols["Session ID"] - 1],

  attendance: row[cols["Attendance"] - 1],

  pillars: pillars

});

  }

  return history;

}
function testPlayerTrend(){

  Logger.log(

    JSON.stringify(

      calculatePlayerTrend("P001",5),

      null,

      2

    )

  );

}
/**
 * Calculates trends for a player's program pillars.
 */
function calculatePlayerTrend(playerId, limit){

  const history = getPlayerHistory(playerId, limit);

  const settings = getCoachIQSettings();

const categories = settings.cultureCategories;

 const result = {};

  categories.forEach(function(category){

    // Oldest -> Newest
   const scores = history
  .slice()
  .reverse()
  .map(function(h){

      const value = h.pillars[category];

      if(
          value === "" ||
          value === null ||
          value === undefined
      ){
          return null;
      }

      return Number(value);

  })
  .filter(function(score){

      return score !== null && !isNaN(score);

  });

  if(scores.length === 0){

  result[category] = {

    average: "-",

    trend: "Stable",

    icon: "➖",

    history: []

  };

  return;

}

    // Average
    const average =
      scores.reduce((a,b)=>a+b,0) / scores.length;

 // Calculate movement
let movement = 0;

for(let i = 1; i < scores.length; i++){

  movement += scores[i] - scores[i-1];

}

let trend = "Stable";
let icon = "→";
let color = "#F59E0B";

if(movement >= 2){

  trend = "Improving";
  icon = "↗";
  color = "#22C55E";

}else if(movement <= -2){

  trend = "Needs Attention";
  icon = "↘";
  color = "#EF4444";

}

result[category] = {

  average: Number(average.toFixed(2)),

  trend: trend,

  icon: icon,

  color: color,

  history: scores

};

  });

  return result;

}
/**
 * Returns complete player intelligence.
 */
function getPlayerInsight(playerId){

  const player = getPlayer(playerId);

  if (!player) {
    throw new Error("Player not found: " + playerId);
  }

  const trend = calculatePlayerTrend(playerId, 5);
const history = getPlayerHistory(playerId, 5);

const result = {

  player: {
    id: player["Player ID"],
    firstName: player["First Name"],
    lastName: player["Last Name"],
    team: player.Team,
    jersey: player["Jersey Number"],
    grade: player.Grade,
    position: player.Position,
    status: player.Status
  },

  attendance: getPlayerAttendance(playerId),

  trend: trend,

  history: history,

  timeline: getPlayerTimeline(playerId),

 summary: generateCoachIQSummary({
    player: {
        firstName: player["First Name"]
    },
    attendance: getPlayerAttendance(playerId),
    trend: trend
})

};

Logger.log(JSON.stringify(result, null, 2));

return result;

}
function testPlayerInsight(){

  Logger.log(

    JSON.stringify(

      getPlayerInsight("P001"),

      null,

      2

    )

  );

}
function testPlayerHistory(){

  Logger.log(

    JSON.stringify(

      getPlayerHistory("P001",5),

      null,

      2

    )

  );

}

function testCategories(){

  Logger.log(

    getCoachIQSettings().cultureCategories

  );

}

/**
 * Returns everything needed for the Dashboard.
 */
function getDashboardInsights(){

  const settings = getCoachIQSettings();

  const dashboard = {};

  settings.teams.forEach(function(team){

    dashboard[team] = {

      attention: getTeamAttention(team),

      recognition: [],

      teamFocus: null

    };

  });

  return dashboard;

}
/**
 * Returns players needing attention
 * for one team.
 */
function getTeamAttention(team){

  return [];

}
function testDashboardInsights(){

  Logger.log(

    JSON.stringify(

      getDashboardInsights(),

      null,

      2

    )

  );

}
/**
 * Returns a coaching insight for one player.
 */
function generateCoachIQSummary(playerInsight){

  const name = playerInsight.player.firstName;

  const attendance =
    playerInsight.attendance.seasonPercentage;

  const improving = [];
  const stable = [];
  const attention = [];

  Object.entries(playerInsight.trend).forEach(function([pillar,data]){

    if(data.trend === "Improving"){

      improving.push(pillar);

    }else if(data.trend === "Needs Attention"){

      attention.push(pillar);

    }else{

      stable.push(pillar);

    }

  });

  let summary = `${name} `;

  // Improving
  if(improving.length){

    summary += `has shown improvement in ${improving.join(", ")} `;

    if(stable.length){

      summary += `while maintaining ${stable.join(", ")}. `;

    }else{

      summary += ". ";

    }

  }else{

    summary += "has maintained steady performance across recent practices. ";

  }

  // Needs Attention
  if(attention.length){

    summary += `${attention.join(", ")} should be an emphasis during individual coaching. `;

  }

  // Attendance
  if(attendance >= 95){

    summary += `Attendance is excellent at ${attendance}%.`;

  }else if(attendance >= 90){

    summary += `Attendance is solid at ${attendance}%.`;

  }else{

    summary += `Attendance is currently ${attendance}% and is below the program standard.`;

  }

  return summary;

}
function testUIPlayer(){

  Logger.log(

    JSON.stringify(

      getPlayerInsight("P001"),

      null,

      2

    )

  );

}
function testPlayerTrend() {

  Logger.log("P001");
  Logger.log(JSON.stringify(calculatePlayerTrend("P001", 5), null, 2));

  Logger.log("P002");
  Logger.log(JSON.stringify(calculatePlayerTrend("P002", 5), null, 2));

  Logger.log("P003");
  Logger.log(JSON.stringify(calculatePlayerTrend("P003", 5), null, 2));

}
function testPlayerHistory(){

  Logger.log("P001");
  Logger.log(JSON.stringify(getPlayerHistory("P001",5), null, 2));

  Logger.log("P002");
  Logger.log(JSON.stringify(getPlayerHistory("P002",5), null, 2));

  Logger.log("P003");
  Logger.log(JSON.stringify(getPlayerHistory("P003",5), null, 2));

}
