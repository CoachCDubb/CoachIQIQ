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

  const sessions = filterCoachIQRowsForCurrentSeason_(headers,data)
    .map(row => rowToObject(headers, row))
    .filter(session => session.Status === "Completed")
    .sort(function(a, b){

      return new Date(b.Created) - new Date(a.Created);

    });

  return sessions.slice(0, limit);

}

function getProgramIntelligence(mode, teamFilter) {
  requireStaffCapability_("view_intelligence");
  if(mode === "games") return getGamePerformanceIntelligence_(teamFilter);
  const settings = getCoachIQSettings();
  const players = filterPlayersForCurrentStaff_(getPlayers()).filter(function(player) { return player[7] === "Active"; });
  const playerMap = {};
  players.forEach(function(player) { playerMap[String(player[0])] = {id:String(player[0]),name:String(player[1])+" "+String(player[2]),team:String(player[5]||""),position:String(player[6]||"Unassigned")}; });
  const recentSessions = getRecentSessions(Number.MAX_SAFE_INTEGER);
  const sheet = SpreadsheetApp.getActive().getSheetByName("Practice Evaluations");
  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const columns = {}; headers.forEach(function(header,index){columns[header]=index;});
  const visibleSessionIds = new Set(filterCoachIQRowsForCurrentSeason_(headers,data.slice(1)).filter(function(row){return playerMap[String(row[columns["Player ID"]])]&&(row[columns["Complete"]]===true||String(row[columns["Complete"]]).toUpperCase()==="TRUE");}).map(function(row){return String(row[columns["Session ID"]]);}));
  const recentIds = recentSessions.filter(function(session){return visibleSessionIds.has(String(session["Session ID"]));}).slice(0,8).map(function(session){return String(session["Session ID"]);});
  const categories = settings.cultureCategories || [];
  const summaries = {}, categoryTotals = {};
  categories.forEach(function(category){categoryTotals[category]={sum:0,count:0};});
  const sessionEvidence = [];
  let present=0,absent=0;
  filterCoachIQRowsForCurrentSeason_(headers,data.slice(1)).forEach(function(row){
    const player=playerMap[String(row[columns["Player ID"]])];
    const completeValue=row[columns["Complete"]];
    const complete=completeValue===true||String(completeValue).toUpperCase()==="TRUE";
    if(!player || recentIds.indexOf(String(row[columns["Session ID"]]))<0 || !complete)return;
    sessionEvidence.push({sessionId:String(row[columns["Session ID"]]),attendance:row[columns["Attendance"]],scores:categories.map(function(category){return Number(row[columns[category]]);}).filter(function(value){return isFinite(value)&&value>0;})});
    const summary=summaries[player.id]||(summaries[player.id]={player:player,sum:0,count:0,sessions:0}); summary.sessions++;
    if(row[columns["Attendance"]]===true)present++; else if(row[columns["Attendance"]]===false)absent++;
    categories.forEach(function(category){const value=Number(row[columns[category]]);if(isFinite(value)&&value>0){summary.sum+=value;summary.count++;categoryTotals[category].sum+=value;categoryTotals[category].count++;}});
  });
  const ranked=Object.keys(summaries).map(function(id){const item=summaries[id];return {name:item.player.name,position:item.player.position,team:item.player.team,average:item.count?Math.round(item.sum/item.count*10)/10:0,sessions:item.sessions,ratings:item.count};}).filter(function(item){return item.ratings>0;}).sort(function(a,b){return b.average-a.average;});
  const positionMap={}; ranked.forEach(function(item){const group=positionMap[item.position]||(positionMap[item.position]={position:item.position,sum:0,count:0});group.sum+=item.average;group.count++;});
  const positions=Object.keys(positionMap).map(function(key){const group=positionMap[key];return {position:key,average:Math.round(group.sum/group.count*10)/10,players:group.count};}).sort(function(a,b){return b.average-a.average;});
  const pillars=categories.map(function(category){const total=categoryTotals[category];return {name:category,average:total.count?Math.round(total.sum/total.count*10)/10:null,ratings:total.count};}).sort(function(a,b){return (a.average==null?Infinity:a.average)-(b.average==null?Infinity:b.average);});
  const attendance=(present+absent)?Math.round(present/(present+absent)*100):0;
  const actions=[];
  const gameIntelligence = {gamesAnalyzed:0,categories:[],alerts:[]};
  (gameIntelligence.alerts || []).forEach(function(alert){ actions.push(alert); });
  if((present+absent)>0&&attendance<90)actions.push("Attendance is "+attendance+"%. Identify repeat absences before the next practice block.");
  if(pillars.length&&pillars[0].average)actions.push("Make "+pillars[0].name+" a coaching emphasis; it is the lowest-scoring program pillar at "+pillars[0].average+".");
  if(positions.length>1)actions.push("Review the "+positions[positions.length-1].position+" group; its recent average trails other position groups.");
  if(!actions.length)actions.push(ranked.length?"No clear priority from these evaluations. Compare the next completed sessions before changing the plan.":"Complete session evaluations to build performance recommendations.");
  return {scope:getCurrentStaffAccess_(),sessionAnalysis:buildSessionPerformanceAnalysis_(recentIds,sessionEvidence),sampleSessions:recentIds.length,activePlayers:players.length,attendance:(present+absent)?attendance:null,pillars:pillars,positions:positions,topPerformers:ranked.slice(0,5),needsAttention:ranked.slice().reverse().slice(0,5),actions:actions,gameIntelligence:gameIntelligence};
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
  const currentSeason = getCoachIQCurrentSeason_();

  const history = [];

  // Evaluation rows are appended when sessions are created. Reading from the
  // bottom keeps the newest completed evaluations first without depending on
  // a matching Sessions row, which may be missing for imported/legacy data.
  for(let i = data.length - 1; i >= 1 && history.length < limit; i--){

    const row = data[i];

    if(!isCoachIQRowInSeason_(headers,row,currentSeason)){
      continue;
    }

    if(row[cols["Player ID"] - 1] != playerId){
      continue;
    }

// Ignore evaluations that aren't complete
const completeValue = row[cols["Complete"] - 1];
if(completeValue !== true && String(completeValue).toUpperCase() !== "TRUE"){
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

    result[category] = buildPlayerTrendSummary_(scores);

  });

  return result;

}

/**
 * Builds the display contract for one pillar from scores ordered oldest to
 * newest. Kept pure so profile language and thresholds can be regression
 * tested without a spreadsheet runtime.
 */
function buildPlayerTrendSummary_(scores) {
  scores = Array.isArray(scores) ? scores : [];
  if (!scores.length) {
    return {
      average: "-",
      trend: "No trend yet",
      icon: "➖",
      color: "#6B7280",
      movement: null,
      sampleSize: 0,
      history: []
    };
  }

const average = scores.reduce((a,b)=>a+b,0) / scores.length;

// Compare the oldest and newest scores in the displayed window. Scores use a
// five-point scale, so a one-point change is meaningful; the previous
// two-point threshold mislabeled ordinary improvement or decline as Stable.
const movement = scores.length > 1
  ? scores[scores.length - 1] - scores[0]
  : 0;

let trend = scores.length === 1
  ? "Baseline"
  : average >= 4
    ? "Consistently Strong"
    : average < 3
      ? "Needs Attention"
      : "Holding Steady";
let icon = scores.length === 1 ? "●" : "→";
let color = scores.length === 1
  ? "#3B82F6"
  : average < 3
    ? "#EF4444"
    : "#F59E0B";

if(scores.length > 1 && movement >= 0.5){

  trend = "Improving";
  icon = "↗";
  color = "#22C55E";

}else if(scores.length > 1 && movement <= -0.5){

  // A strong current average should not be presented as a problem merely
  // because its latest score dipped. Preserve the level and describe the
  // direction separately; reserve Needs Attention for lower performance.
  trend = average >= 4
    ? "Strong — Trending Down"
    : average >= 3
      ? "Trending Down"
      : "Needs Attention";
  icon = "↘";
  color = average >= 3 ? "#F59E0B" : "#EF4444";

}

return {
  average: Number(average.toFixed(2)),
  trend: trend,
  icon: icon,
  color: color,
  movement: Number(movement.toFixed(2)),
  sampleSize: scores.length,
  history: scores.slice()
};
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
/** Disjoint recent/prior windows; every reported average retains its denominator. */
function buildSessionPerformanceAnalysis_(ids,evidence){
  function windowStats(window){const rows=evidence.filter(function(row){return window.indexOf(row.sessionId)>=0;}),scores=[];let present=0,marked=0;rows.forEach(function(row){Array.prototype.push.apply(scores,row.scores);if(row.attendance===true||row.attendance===false){marked++;if(row.attendance)present++;}});return{sessions:window.length,ratings:scores.length,average:scores.length?scores.reduce(function(a,b){return a+b;},0)/scores.length:null,present:present,marked:marked};}
  const current=windowStats(ids.slice(0,4)),prior=windowStats(ids.slice(4,8)),lines=[];
  [current,prior].forEach(function(item,index){if(item.sessions)lines.push((index?"Previous ":"Latest ")+item.sessions+" sessions: "+(item.average==null?"no scored ratings":item.average.toFixed(2)+" average across "+item.ratings+" recorded category ratings")+"; attendance "+item.present+"/"+item.marked+" marked evaluations.");});
  if(current.average!=null&&prior.average!=null)lines.push("Rating change: "+(current.average-prior.average>=0?"+":"")+(current.average-prior.average).toFixed(2)+". Different athletes, evaluators and session content can affect this comparison.");
  if(!evidence.length)lines.push("No completed evaluations in this session sample yet.");
  return{current:current,prior:prior,lines:lines};
}

function getGamePerformanceIntelligence_(teamFilter){
  const access=getCurrentStaffAccess_(),snapshot=getLiveGameSheetSnapshot_(),cols=liveGameHeaderMap_(snapshot.headers);
  const accessible=filterCoachIQRowsForCurrentSeason_(snapshot.headers,snapshot.values).filter(function(row){const team=String(row[cols.Team]||"");return !isLiveGameArchived_(row,cols)&&String(row[cols.Status])==="Completed"&&String(row[cols.Sport]||"Basketball").toLowerCase()==="basketball"&&(!access.configured||access.role==="Head Coach"||!access.teams.length||access.teams.indexOf(team)>=0);});
  const teams=Array.from(new Set(accessible.map(function(row){return String(row[cols.Team]||"");}))).sort();
  const selected=String(teamFilter||"");if(selected&&teams.indexOf(selected)<0)throw new Error("No accessible completed games for that team.");
  const rows=accessible.filter(function(row){return !selected||String(row[cols.Team])===selected;}).sort(function(a,b){return new Date(b[cols["Game Date"]]||b[cols["Completed At"]]||0)-new Date(a[cols["Game Date"]]||a[cols["Completed At"]]||0);}).slice(0,10);
  const groups=getLiveAnalyticsPossessionsByGames_(rows.map(function(row){return String(row[cols["Game ID"]]);}));
  const games=rows.map(function(row){const id=String(row[cols["Game ID"]]),log=groups[id]||[],stored=parseLiveGameObject_(row[cols["Final Report"]],{}),mode=parseLiveGameObject_(row[cols["Tracker Mode"]],{});let scouting=null,scoutUnavailable=false;
    if(mode.scoutingSnapshotId){try{const scout=readGameReportSnapshot_(id,"scouting",mode.scoutingSnapshotId);if(scout&&scout.reportId===mode.scoutingReportId&&scout.team===String(row[cols.Team])&&String(scout.opponent||"").trim().toLowerCase()===String(row[cols.Opponent]||"").trim().toLowerCase())scouting=buildGameScoutingComparison_(scout,{analytics:buildLiveAnalyticsSummary_(log,1),objectives:stored.objectives||[],finalScore:stored.finalScore},"pregame");else scoutUnavailable=true;}catch(error){scoutUnavailable=true;}}
    return{gameId:id,team:String(row[cols.Team]),opponent:String(row[cols.Opponent]||""),date:formatLiveGameDate_(row[cols["Game Date"]]),log:log,scouting:scouting,scoutUnavailable:scoutUnavailable};});
  const result=buildGamePerformanceAnalysis_(games);result.teams=teams;result.team=selected;result.mode="games";result.scope=access;result.objectives=getLiveGameProgramTrends_(selected);return result;
}

function buildGamePerformanceAnalysis_(games){
  const lines=[],patterns=[],actions=[],scouting=[],totals={offense:{n:0,points:0,turnovers:0},defense:{n:0,points:0,stops:0}},paint={offense:{yes:{n:0,points:0,scored:0},no:{n:0,points:0,scored:0},unknown:0},defense:{yes:{n:0,points:0,scored:0},no:{n:0,points:0,scored:0},unknown:0}},tags=Object.create(null);
  let kills=0,longest=0,trackedGames=0,linked=0,unavailable=0;const targetGroups=Object.create(null),scouts={met:0,notMet:0,partial:0,review:0,measured:0};
  (games||[]).forEach(function(game){if(game.log.length)trackedGames++;const intel=buildLivePossessionIntelligence_(game.log);kills+=intel.kills.total;longest=Math.max(longest,intel.kills.longestStops);
    game.log.forEach(function(p){const total=totals[p.teamSide];if(!total)return;total.n++;total.points+=Number(p.points||0);if(p.turnover)total.turnovers++;if(p.teamSide==="defense"&&Number(p.points)===0)total.stops++;});
    ["offense","defense"].forEach(function(side){const from=intel.paint[side],to=paint[side];[["withTouch","yes"],["withoutTouch","no"]].forEach(function(pair){const a=from[pair[0]],b=to[pair[1]];b.n+=a.possessions;b.points+=a.points;b.scored+=a.scored;});to.unknown+=from.unknown;});
    intel.tagPatterns.filter(function(tag){return tag.type!=="paintTouch";}).forEach(function(tag){const key=JSON.stringify([tag.side,tag.type,tag.label]),group=tags[key]||(tags[key]={side:tag.side,label:tag.label,n:0,points:0,scored:0});group.n+=tag.possessions;group.points+=tag.points;group.scored+=tag.scored;});
    if(game.scouting){linked++;(game.scouting.rows||[]).forEach(function(row){if(row.status!=="met"&&row.status!=="not_met")return;const key=JSON.stringify([game.team,row.title,row.expected]),group=targetGroups[key]||(targetGroups[key]={team:game.team,title:row.title,expected:row.expected,met:0,n:0,latest:row.actual});group.n++;if(row.status==="met")group.met++;});Object.keys(scouts).forEach(function(key){scouts[key]+=Number(game.scouting.summary[key]||0);});scouting.push(game.date+" · "+game.team+" vs "+game.opponent+": "+game.scouting.summary.met+" targets met, "+game.scouting.summary.notMet+" missed; "+game.scouting.summary.partial+" partial and "+game.scouting.summary.review+" needing coach review.");}if(game.scoutUnavailable)unavailable++;
  });
  const fmt=function(points,n){return n?(points/n).toFixed(2):"—";};
  ["offense","defense"].forEach(function(side){const total=totals[side],label=side==="offense"?"Offense":"Defense";if(total.n)lines.push(label+": "+total.points+" points "+(side==="defense"?"allowed ":"")+"on "+total.n+" recorded possessions · "+fmt(total.points,total.n)+" PPP"+(side==="offense"?" · "+total.turnovers+" turnovers":" · "+total.stops+" stops ("+(100*total.stops/total.n).toFixed(1)+"%)")+".");
    const p=paint[side];["yes","no"].forEach(function(key){const b=p[key];if(b.n)patterns.push(label+(key==="yes"?" with a paint touch":" with confirmed no paint touch")+": scored on "+b.scored+"/"+b.n+" possessions · "+b.points+" points · "+fmt(b.points,b.n)+" PPP."+(b.n<10?" Small sample.":""));});
    if(p.yes.n>=10&&p.no.n>=10&&p.yes.points/p.yes.n>p.no.points/p.no.n)actions.push((side==="offense"?"Test more paint-touch opportunities in your next game plan":"Emphasize paint containment in your next scouting plan")+": "+label.toLowerCase()+" PPP is "+fmt(p.yes.points,p.yes.n)+" with a touch (n="+p.yes.n+") versus "+fmt(p.no.points,p.no.n)+" without (n="+p.no.n+"). Check opponent and lineup context before changing strategy.");
  });
  // Calculate streaks independently per game. No kills cross a game boundary.
  if(totals.defense.n)lines.push("Defense earned "+kills+" kills across "+trackedGames+" games with possession data; longest recorded stop run in one game: "+longest+". A kill is three consecutive recorded stops.");
  function windowPpp(window,side){let n=0,points=0;window.forEach(function(game){game.log.forEach(function(p){if(p.teamSide===side){n++;points+=Number(p.points||0);}});});return{n:n,points:points};}
  if(games.length>3)["offense","defense"].forEach(function(side){const recent=windowPpp(games.slice(0,3),side),prior=windowPpp(games.slice(3,6),side);if(recent.n&&prior.n)lines.push((side==="offense"?"Offensive":"Defensive")+" PPP: latest 3 games "+fmt(recent.points,recent.n)+" (n="+recent.n+") versus previous "+Math.min(3,games.length-3)+" games "+fmt(prior.points,prior.n)+" (n="+prior.n+"). "+(recent.n<20||prior.n<20?"Small sample; ":"")+"Opponent strength and tracking coverage may differ.");});
  Object.keys(tags).map(function(key){return tags[key];}).sort(function(a,b){return b.n-a.n;}).slice(0,12).forEach(function(t){patterns.push((t.side==="offense"?"Your team":"Opponent")+" · "+t.label+": "+t.scored+"/"+t.n+" scoring possessions · "+t.points+" points · "+fmt(t.points,t.n)+" PPP."+(t.n<10?" Small sample.":""));});
  const reliableTags=Object.keys(tags).map(function(key){return tags[key];}).filter(function(t){return t.side==="offense"&&t.n>=10;}).sort(function(a,b){return b.points/b.n-a.points/a.n;});
  if(reliableTags.length){const tag=reliableTags[0];actions.push("Review "+tag.label+" opportunities when preparing your next plan: "+tag.scored+"/"+tag.n+" tagged possessions produced points ("+fmt(tag.points,tag.n)+" PPP). Check film and opponent context; overlapping tags do not isolate this action's effect.");}
  Object.keys(targetGroups).map(function(key){return targetGroups[key];}).sort(function(a,b){return a.met/a.n-b.met/b.n;}).slice(0,8).forEach(function(group){scouting.unshift(group.team+" · "+group.title+" ("+group.expected+"): met in "+group.met+"/"+group.n+" comparable scouting targets. Most recent evidence: "+group.latest);});
  if(scouts.notMet)actions.push("Review the "+scouts.notMet+" missed measurable scouting targets in completed-game comparisons. Separate execution issues from changes in the opponent's approach.");
  if(!actions.length)actions.push(trackedGames?"Continue recording the same focus tags over several games to test repeatable patterns. Current evidence does not support a strong tactical recommendation yet.":"Finish a game with possession tracking to begin game-performance analysis.");
  if(linked)scouting.unshift(linked+" original pregame plans compared: "+scouts.met+" measurable targets met, "+scouts.notMet+" missed, "+scouts.measured+" measured without a graded target, "+scouts.partial+" partial, "+scouts.review+" coach review/untracked.");
  if(!linked)scouting.push("No original linked scouting plans available in this sample. Link a scouting report before the next game to compare preparation with execution.");
  if(unavailable)scouting.push(unavailable+" linked scouting snapshots unavailable; excluded from target totals.");
  return{games:games.length,trackedGames:trackedGames,offense:totals.offense,defense:totals.defense,kills:kills,lines:lines,patterns:patterns,actions:actions,scouting:scouting,coverage:"Latest "+games.length+" completed basketball games by game date, current season. "+trackedGames+" have possession data. PPP uses recorded possessions and their points, excluding score-only adjustments. Paint coverage unknown: offense "+paint.offense.unknown+", defense "+paint.defense.unknown+" possessions. Untracked tags are not counted as absent. Tag groups overlap; associations do not establish cause. Small samples, changing opponents and lineups limit conclusions. All-team totals may mix teams; select a team for coaching decisions."};
}
