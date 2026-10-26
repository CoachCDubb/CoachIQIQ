/**
 * Possession-level basketball analytics for the condensed two-operator tracker.
 * One row represents one completed possession; attributes and points stay joined.
 */
const LIVE_ANALYTICS_SHEET = "Live Analytics Possessions";
const LIVE_ANALYTICS_HEADERS = [
  "Possession ID", "Game ID", "Sequence", "Timestamp", "Period", "Team Side",
  "Points", "Transition", "Paint Touch", "Right-Hand Drive", "Turnover",
  "Forced Turnover", "Offensive Rebounds", "Recorded By", "Voided", "Source", "Play Events", "Tracked Tags"
];

function initializeLiveAnalyticsSheet_() {
  return ensureLiveGameSheet_(LIVE_ANALYTICS_SHEET, LIVE_ANALYTICS_HEADERS);
}

function recordLiveAnalyticsPossession(gameId, payload) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const gameRecord = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(gameRecord.game.Team);
  if (!getLiveGameTrackerMode_(gameRecord.game, parseLiveGameJson_(gameRecord.game["Active Tracking Plan"], []), []).analytics) {
    throw new Error("Possession Analytics is turned off for this game.");
  }
  if (String(gameRecord.game.Status || "") === "Completed") throw new Error("A completed game cannot accept possessions.");
  const possession = cleanLiveAnalyticsPossession_(payload, Number(gameRecord.game["Current Period"] || 1));
  const sheet = initializeLiveAnalyticsSheet_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = sheet.getLastRow() > 1
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, LIVE_ANALYTICS_HEADERS.length).getValues() : [];
    const duplicate = rows.some(function(row) { return String(row[0] || "") === possession.possessionId; });
    if (!duplicate) {
      const sequence = rows.filter(function(row) { return String(row[1] || "") === String(gameId); }).length + 1;
      sheet.appendRow([possession.possessionId, String(gameId), sequence, new Date(), possession.period,
        possession.teamSide, possession.points, possession.transition, possession.paintTouch,
        possession.rightHandDrive, possession.turnover, possession.forcedTurnover,
        possession.offensiveRebounds, Session.getActiveUser().getEmail() || "", false, "Live", JSON.stringify(possession.playEvents), JSON.stringify(possession.trackedTags)]);
    }
  } finally { lock.releaseLock(); }
  return getLiveGameTracker(gameId);
}

function cleanLiveAnalyticsPossession_(payload, currentPeriod) {
  payload = payload || {};
  const teamSide = String(payload.teamSide || "").toLowerCase();
  if (["offense", "defense"].indexOf(teamSide) < 0) throw new Error("Choose offense or defense.");
  const points = Number(payload.points);
  if (!Number.isInteger(points) || points < 0 || points > 3) throw new Error("Possession points must be 0, 1, 2, or 3.");
  const period = Number(payload.period || currentPeriod);
  if (!Number.isInteger(period) || period < 1 || period > 20) throw new Error("Choose a valid period.");
  const offensiveRebounds = Number(payload.offensiveRebounds || 0);
  if (!Number.isInteger(offensiveRebounds) || offensiveRebounds < 0 || offensiveRebounds > 10) throw new Error("Offensive rebounds must be between 0 and 10.");
  const turnover = teamSide === "offense" && payload.turnover === true;
  const forcedTurnover = teamSide === "defense" && payload.forcedTurnover === true;
  if ((turnover || forcedTurnover) && points !== 0) throw new Error("A turnover possession must end with 0 points.");
  const playEvents = cleanLiveAnalyticsPlayEvents_(payload.playEvents, teamSide);
  const reboundEvents = playEvents.filter(function(event){return event.type==="offensiveRebound";});
  if(reboundEvents.length && reboundEvents.length!==offensiveRebounds)throw new Error("Rebound events must match the possession rebound count.");
  const scores=playEvents.filter(function(event){return /^made[123]$/.test(event.type);});
  if(scores.length>1||(scores.length===1&&Number(scores[0].type.slice(-1))!==points))throw new Error("Scoring event must match total possession points.");
  return {
    playEvents:playEvents,
    trackedTags:cleanLiveAnalyticsTrackedTags_(payload.trackedTags),
    possessionId:/^LAP-[A-Za-z0-9-]{8,80}$/.test(String(payload.possessionId || ""))
      ? String(payload.possessionId) : "LAP-" + Utilities.getUuid().slice(0, 18).toUpperCase(),
    teamSide:teamSide, points:points, period:period,
    transition:payload.transition === true, paintTouch:payload.paintTouch === true || playEvents.some(function(event){return event.type==="paintTouch";}),
    rightHandDrive:teamSide === "defense" && payload.rightHandDrive === true,
    turnover:turnover, forcedTurnover:forcedTurnover, offensiveRebounds:offensiveRebounds
  };
}

// Append-only JSON column preserves the original workbook columns and old possessions.
function cleanLiveAnalyticsTrackedTags_(tags){
  if(tags==null)return null;
  const allowed=["paintTouch","offensiveRebound","transition","deflection","driveKick","cut","setPlay","ato","putback","pickRoll","postUp","isolation","rightHandDrive","customTag"];
  if(!Array.isArray(tags)||tags.length>6||tags.some(function(tag){return allowed.indexOf(tag)<0;}))throw new Error("Choose valid tracked possession tags.");
  return tags.filter(function(tag,index){return tags.indexOf(tag)===index;});
}

/** Exact patterns from completed possessions; no model-generated facts or causal claims. */
function buildLivePossessionIntelligence_(possessions){
  const kills={total:0,currentStops:0,longestStops:0,totalStops:0,progress:0},paint={},patterns={},insights=[],recommendations=[];
  ["offense","defense"].forEach(function(side){paint[side]={withTouch:{possessions:0,scored:0,points:0},withoutTouch:{possessions:0,scored:0,points:0},unknown:0,currentNoTouch:0,longestNoTouch:0};});
  const labels={paintTouch:"Paint touch",offensiveRebound:"OREB",transition:"Transition",rightHandDrive:"Right-hand drive",deflection:"Deflection",driveKick:"Drive & kick",cut:"Cut",setPlay:"Set play",ato:"ATO",putback:"Putback",pickRoll:"Pick & roll",postUp:"Post-up",isolation:"Isolation"};
  (possessions||[]).forEach(function(item,index){
    if(!paint[item.teamSide])return;const points=Number(item.points||0),side=item.teamSide,p=paint[side];
    const covered=item.paintTouch===true||(Array.isArray(item.trackedTags)&&item.trackedTags.indexOf("paintTouch")>=0);
    if(covered){const bucket=item.paintTouch?p.withTouch:p.withoutTouch;bucket.possessions++;bucket.points+=points;if(points>0)bucket.scored++;p.currentNoTouch=item.paintTouch?0:p.currentNoTouch+1;p.longestNoTouch=Math.max(p.longestNoTouch,p.currentNoTouch);}else{p.unknown++;p.currentNoTouch=0;}
    if(side==="defense"){
      if(points===0){kills.totalStops++;kills.currentStops++;kills.longestStops=Math.max(kills.longestStops,kills.currentStops);if(kills.currentStops%3===0)kills.total++;}else kills.currentStops=0;
    }
    const tags={};Object.keys(labels).forEach(function(type){if(item[type]===true||(type==="offensiveRebound"&&Number(item.offensiveRebounds||0)>0))tags[JSON.stringify([type,labels[type]])]={type:type,label:labels[type]};});
    (item.playEvents||[]).forEach(function(event){const label=event.type==="customTag"?event.label:labels[event.type];if(label)tags[JSON.stringify([event.type,label])]={type:event.type,label:label};});
    Object.keys(tags).forEach(function(key){const tag=tags[key],groupKey=JSON.stringify([side,key]),group=patterns[groupKey]||(patterns[groupKey]={side:side,type:tag.type,label:tag.label,possessions:0,scored:0,points:0,logNumbers:[]});group.possessions++;group.points+=points;if(points>0)group.scored++;group.logNumbers.push(index+1);});
  });
  kills.progress=kills.currentStops%3;
  if(kills.totalStops)insights.push({kind:"positive",title:"Defensive kills",text:kills.total+" kill"+(kills.total===1?"":"s")+" earned · "+kills.totalStops+" total stops · longest run "+kills.longestStops+". Current run: "+kills.currentStops+" consecutive stops; "+kills.progress+"/3 toward the next kill.",logNumbers:[]});
  if(kills.progress===2)recommendations.push("One more stop earns the next kill: you have 2 consecutive stops toward it.");
  ["offense","defense"].forEach(function(side){
    const p=paint[side],who=side==="defense"?"Opponent":"Your team",withTouch=p.withTouch,without=p.withoutTouch;
    if(withTouch.possessions){const all=withTouch.scored===withTouch.possessions;insights.push({kind:side==="defense"&&all?"attention":"neutral",title:who+" paint-touch scoring",text:(all?who+" scored on every recorded paint-touch possession: ":who+" scored on ")+withTouch.scored+"/"+withTouch.possessions+" · "+withTouch.points+" points · "+(withTouch.points/withTouch.possessions).toFixed(2)+" PPP."+(withTouch.possessions<3?" Small sample.":""),logNumbers:[]});}
    if(without.possessions)insights.push({kind:"neutral",title:who+" without a paint touch",text:who+" scored on "+without.scored+"/"+without.possessions+" confirmed no-paint-touch possessions · "+without.points+" points · "+(without.points/without.possessions).toFixed(2)+" PPP.",logNumbers:[]});
    if(side==="defense"&&p.currentNoTouch>=3)insights.push({kind:"positive",title:"Paint kept out",text:"No opponent paint touch on the last "+p.currentNoTouch+" defensive possessions. This is separate from stops: points allowed still determine kills.",logNumbers:[]});
    if(side==="defense"&&withTouch.possessions>=3&&withTouch.scored===withTouch.possessions&&without.possessions<3)recommendations.push("Opponent scored on all "+withTouch.possessions+" recorded paint-touch possessions. Prioritize paint containment and keep tracking the next defensive possessions.");
    if(side==="defense"&&withTouch.possessions>=3&&without.possessions>=3&&withTouch.points/withTouch.possessions>without.points/without.possessions)recommendations.push("Prioritize keeping the ball out of the paint: opponent PPP is "+(withTouch.points/withTouch.possessions).toFixed(2)+" with a paint touch versus "+(without.points/without.possessions).toFixed(2)+" without, across "+withTouch.possessions+" and "+without.possessions+" tracked possessions.");
  });
  const tagPatterns=Object.keys(patterns).map(function(key){return patterns[key];});
  tagPatterns.filter(function(group){return group.type!=="paintTouch";}).forEach(function(group){insights.push({kind:"neutral",title:(group.side==="defense"?"Opponent":"Your team")+" · "+group.label,text:"Scored on "+group.scored+"/"+group.possessions+" tagged possessions · "+group.points+" points · "+(group.points/group.possessions).toFixed(2)+" PPP."+(group.possessions<3?" Small sample.":""),logNumbers:group.logNumbers});});
  const offensivePattern=tagPatterns.filter(function(group){return group.side==="offense"&&group.type!=="paintTouch"&&group.type!=="deflection"&&group.possessions>=3&&group.scored/group.possessions>=2/3;}).sort(function(a,b){return b.points/b.possessions-a.points/a.possessions;})[0];
  if(offensivePattern)recommendations.push("Keep looking for "+offensivePattern.label+" opportunities: your team scored on "+offensivePattern.scored+"/"+offensivePattern.possessions+" tagged possessions for "+offensivePattern.points+" points.");
  if(!recommendations.length&&kills.currentStops>=3)recommendations.push("Stay with the defensive approach through this "+kills.currentStops+"-stop run; finish the next possession without allowing points.");
  return {kills:kills,paint:paint,insights:insights,tagPatterns:tagPatterns,recommendations:recommendations,definition:"A stop is a completed defensive possession with zero points allowed. Three consecutive stops earn one kill; six earn two. Offensive possessions, timeouts and period breaks do not reset the run. Any points allowed on a defensive possession reset it. Runs use recorded defensive possessions; missing possessions cannot be inferred.",coverageNote:"No-paint-touch claims use possessions where paint tracking was enabled. Untracked or older unknown tags are not treated as no paint touch. Tag groups can overlap. These are tracked associations, not proof of cause."};
}

function cleanLiveAnalyticsPlayEvents_(events, teamSide) {
  if(events==null)return [];
  if(!Array.isArray(events)||events.length>100)throw new Error("A possession can contain up to 100 play events.");
  const types=["paintTouch","offensiveRebound","deflection","driveKick","miss2","miss3","putback","andOne","made1","made2","made3","cut","setPlay","ato","pickRoll","postUp","isolation","customTag"];
  return events.map(function(event){
    if(!event||types.indexOf(event.type)<0)throw new Error("Choose a valid play event.");
    const jersey=String(event.jersey||"").trim();
    if(jersey&&!/^[0-9]{1,3}$/.test(jersey))throw new Error("Use a jersey number of 1–3 digits.");
    const label=event.type==="customTag"?String(event.label||"").trim():"";
    if(event.type==="customTag"&&(!label||label.length>40||/[\x00-\x1f]/.test(label)))throw new Error("Custom tags need a name of 1–40 characters.");
    return {type:event.type,label:label,jersey:jersey,playerSide:event.type==="deflection"?(teamSide==="defense"?"us":"opponent"):(teamSide==="offense"?"us":"opponent")};
  });
}
function buildLiveAnalyticsPlayerTotals_(possessions) {
  const totals={};
  possessions.forEach(function(item){(item.playEvents||[]).forEach(function(event){
    if(!event.jersey)return;
    const playerSide=event.playerSide||(item.teamSide==="offense"?"us":"opponent"),key=playerSide+":"+event.jersey;
    const player=totals[key]||(totals[key]={jersey:event.jersey,playerSide:playerSide,offensiveRebounds:0,paintTouches:0,deflections:0,points:0});
    if(event.type==="offensiveRebound")player.offensiveRebounds++;
    if(event.type==="paintTouch")player.paintTouches++;
    if(event.type==="deflection")player.deflections++;
    if(/^made[123]$/.test(event.type))player.points+=Number(event.type.slice(-1));
  });});
  return Object.keys(totals).sort().map(function(key){return totals[key];});
}

function buildLiveScoringTagSummary_(possessions){
  const labels={driveKick:"Drive & kick",putback:"Putback",cut:"Cut",setPlay:"Set play",ato:"ATO",pickRoll:"Pick & roll",postUp:"Post-up",isolation:"Isolation"},totals={};
  possessions.forEach(function(item){const seen={};(item.playEvents||[]).forEach(function(event){
    const label=event.type==="customTag"?event.label:labels[event.type];if(!label)return;
    const key=JSON.stringify([item.teamSide,event.type,label]);if(seen[key])return;seen[key]=true;
    const total=totals[key]||(totals[key]={teamSide:item.teamSide,label:label,possessions:0,points:0});total.possessions++;total.points+=Number(item.points||0);
  });});
  return Object.keys(totals).map(function(key){const total=totals[key];total.ppp=liveAnalyticsRate_(total.points,total.possessions);return total;});
}

function getLiveAnalyticsPossessions_(gameId) {
  const sheet = initializeLiveAnalyticsSheet_();
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, LIVE_ANALYTICS_HEADERS.length).getValues()
    .filter(function(row) { return String(row[1] || "") === String(gameId) && row[14] !== true; })
    .map(function(row) { return {
      possessionId:String(row[0] || ""), sequence:Number(row[2] || 0), timestamp:formatLiveGameTimestamp_(row[3]),
      period:Number(row[4] || 1), teamSide:String(row[5] || ""), points:Number(row[6] || 0),
      transition:row[7] === true, paintTouch:row[8] === true, rightHandDrive:row[9] === true,
      turnover:row[10] === true, forcedTurnover:row[11] === true, offensiveRebounds:Number(row[12] || 0),
      playEvents:parseLiveGameJson_(row[16], []),
      trackedTags:parseLiveGameJson_(row[17], null)
    }; });
}

function buildLiveAnalyticsSummary_(possessions, currentPeriod) {
  const sides = {offense:emptyLiveAnalyticsSide_(), defense:emptyLiveAnalyticsSide_()};
  (possessions || []).forEach(function(item) {
    const side = sides[item.teamSide]; if (!side) return;
    side.possessions++; if (Number(item.period) === Number(currentPeriod)) side.periodPossessions++;
    side.points += item.points; side.offensiveRebounds += item.offensiveRebounds;
    if (item.transition) { side.transitionPossessions++; side.transitionPoints += item.points; }
    if (item.paintTouch) { side.paintTouchPossessions++; side.paintTouchPoints += item.points; }
    if (item.rightHandDrive) { side.rightHandDrivePossessions++; side.rightHandDrivePoints += item.points; }
    if (item.turnover) side.turnovers++;
    if (item.forcedTurnover) side.forcedTurnovers++;
  });
  Object.keys(sides).forEach(function(key) { addLiveAnalyticsRates_(sides[key]); });
  return {offense:sides.offense, defense:sides.defense,
    netPpp:roundLiveAnalytics_(sides.offense.ppp - sides.defense.ppp),
    possessionDifference:Math.abs(sides.offense.possessions - sides.defense.possessions),
    possessionLog:(possessions || []).slice(),
    playerTotals:buildLiveAnalyticsPlayerTotals_(possessions || []),
    scoringTags:buildLiveScoringTagSummary_(possessions || []),
    intelligence:buildLivePossessionIntelligence_(possessions || []),
    recent:(possessions || []).slice(-8).reverse()};
}

function emptyLiveAnalyticsSide_() { return {possessions:0,periodPossessions:0,points:0,offensiveRebounds:0,transitionPossessions:0,
  transitionPoints:0,paintTouchPossessions:0,paintTouchPoints:0,rightHandDrivePossessions:0,
  rightHandDrivePoints:0,turnovers:0,forcedTurnovers:0}; }
function liveAnalyticsRate_(number, denominator) { return denominator ? roundLiveAnalytics_(number / denominator) : null; }
function roundLiveAnalytics_(value) { return Math.round(Number(value || 0) * 1000) / 1000; }
function addLiveAnalyticsRates_(side) {
  side.ppp=liveAnalyticsRate_(side.points,side.possessions);
  side.transitionFrequency=liveAnalyticsRate_(side.transitionPossessions,side.possessions);
  side.transitionPpp=liveAnalyticsRate_(side.transitionPoints,side.transitionPossessions);
  side.paintTouchFrequency=liveAnalyticsRate_(side.paintTouchPossessions,side.possessions);
  side.paintTouchPpp=liveAnalyticsRate_(side.paintTouchPoints,side.paintTouchPossessions);
  side.rightHandDriveFrequency=liveAnalyticsRate_(side.rightHandDrivePossessions,side.possessions);
  side.rightHandDrivePpp=liveAnalyticsRate_(side.rightHandDrivePoints,side.rightHandDrivePossessions);
  side.turnoverRate=liveAnalyticsRate_(side.turnovers,side.possessions);
  side.forcedTurnoverRate=liveAnalyticsRate_(side.forcedTurnovers,side.possessions);
  side.offensiveReboundsPer100=liveAnalyticsRate_(side.offensiveRebounds*100,side.possessions);
}

function voidLatestLiveAnalyticsPossession(gameId, teamSide) {
  requireStaffCapability_("run_sessions"); initializeLiveGameSheets_();
  const record=findLiveGameRecord_(gameId);requireLiveGameTeamAccess_(record.game.Team);
  if(String(record.game.Status||"")==="Completed")throw new Error("A completed game cannot be changed.");
  const side=String(teamSide||"").toLowerCase();if(["offense","defense"].indexOf(side)<0)throw new Error("Choose offense or defense.");
  const sheet=initializeLiveAnalyticsSheet_(),lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,LIVE_ANALYTICS_HEADERS.length).getValues():[];
    let rowNumber=0;rows.forEach(function(row,index){if(String(row[1]||"")===String(gameId)&&String(row[5]||"")===side&&row[14]!==true)rowNumber=index+2;});
    if(!rowNumber)throw new Error("No "+side+" possession is available to undo.");
    sheet.getRange(rowNumber,15).setValue(true);
  }finally{lock.releaseLock();}
  return getLiveGameTracker(gameId);
}

/**
 * Coach-configurable starting points, not universal high-school standards.
 * These defaults are product guidance chosen for initial setup; programs should
 * review them with their staff and replace them as their own completed-game
 * evidence develops.
 */
function getStarterLiveAnalyticsBenchmarks_() {
  return [
    {id:"offensivePpp",label:"Offensive PPP",starter:1.00,direction:"higher",side:"offense",field:"ppp",unit:"PPP",numeratorField:"points",numeratorLabel:"points",denominatorField:"possessions",denominatorLabel:"possessions"},
    {id:"defensivePppAllowed",label:"Defensive PPP allowed",starter:1.00,direction:"lower",side:"defense",field:"ppp",unit:"PPP",numeratorField:"points",numeratorLabel:"points allowed",denominatorField:"possessions",denominatorLabel:"possessions"},
    {id:"transitionPpp",label:"Transition PPP",starter:1.15,direction:"higher",side:"offense",field:"transitionPpp",unit:"PPP",numeratorField:"transitionPoints",numeratorLabel:"transition points",denominatorField:"transitionPossessions",denominatorLabel:"transition possessions"},
    {id:"transitionPppAllowed",label:"Transition PPP allowed",starter:1.00,direction:"lower",side:"defense",field:"transitionPpp",unit:"PPP",numeratorField:"transitionPoints",numeratorLabel:"transition points allowed",denominatorField:"transitionPossessions",denominatorLabel:"transition possessions"},
    {id:"paintTouchPpp",label:"Paint-touch PPP",starter:1.10,direction:"higher",side:"offense",field:"paintTouchPpp",unit:"PPP",numeratorField:"paintTouchPoints",numeratorLabel:"paint-touch points",denominatorField:"paintTouchPossessions",denominatorLabel:"paint-touch possessions"},
    {id:"paintTouchPppAllowed",label:"Paint-touch PPP allowed",starter:1.00,direction:"lower",side:"defense",field:"paintTouchPpp",unit:"PPP",numeratorField:"paintTouchPoints",numeratorLabel:"paint-touch points allowed",denominatorField:"paintTouchPossessions",denominatorLabel:"paint-touch possessions"},
    {id:"turnoverRate",label:"Turnover rate",starter:0.18,direction:"lower",side:"offense",field:"turnoverRate",unit:"rate",numeratorField:"turnovers",numeratorLabel:"turnovers",denominatorField:"possessions",denominatorLabel:"possessions"},
    {id:"forcedTurnoverRate",label:"Forced-turnover rate",starter:0.18,direction:"higher",side:"defense",field:"forcedTurnoverRate",unit:"rate",numeratorField:"forcedTurnovers",numeratorLabel:"forced turnovers",denominatorField:"possessions",denominatorLabel:"possessions"},
    {id:"offensiveReboundsPer100",label:"Offensive rebounds / 100",starter:25,direction:"higher",side:"offense",field:"offensiveReboundsPer100",unit:"per 100",numeratorField:"offensiveRebounds",numeratorLabel:"offensive rebounds",denominatorField:"possessions",denominatorLabel:"possessions"},
    {id:"offensiveReboundsAllowedPer100",label:"Offensive rebounds allowed / 100",starter:25,direction:"lower",side:"defense",field:"offensiveReboundsPer100",unit:"per 100",numeratorField:"offensiveRebounds",numeratorLabel:"offensive rebounds allowed",denominatorField:"possessions",denominatorLabel:"possessions"},
    {id:"rightHandDrivePppAllowed",label:"Right-hand-drive PPP allowed",starter:0.90,direction:"lower",side:"defense",field:"rightHandDrivePpp",unit:"PPP",numeratorField:"rightHandDrivePoints",numeratorLabel:"right-hand-drive points allowed",denominatorField:"rightHandDrivePossessions",denominatorLabel:"right-hand-drive possessions"}
  ];
}

function averageLiveAnalyticsMetric_(values){
  return values.length?roundLiveAnalytics_(values.reduce(function(sum,value){return sum+value;},0)/values.length):null;
}

/** Pure benchmark calculator. Games without an explicit final result are ignored. */
function buildLiveAnalyticsProgramBenchmark_(completedGames) {
  const games=(completedGames||[]).filter(function(game){return game&&game.completed===true&&(game.result==="Win"||game.result==="Loss");});
  const winCount=games.filter(function(game){return game.result==="Win";}).length;
  const lossCount=games.filter(function(game){return game.result==="Loss";}).length;
  const metrics=getStarterLiveAnalyticsBenchmarks_().map(function(definition){
    const valid=games.map(function(game){
      const side=(game.analytics||{})[definition.side]||{};
      const value=side[definition.field];
      return typeof value==="number"&&isFinite(value)?{value:value,result:game.result,completedAt:game.completedAt}:null;
    }).filter(Boolean);
    const wins=valid.filter(function(item){return item.result==="Win";}).map(function(item){return item.value;});
    const losses=valid.filter(function(item){return item.result==="Loss";}).map(function(item){return item.value;});
    const validCount=valid.length,winningAverage=averageLiveAnalyticsMetric_(wins),losingAverage=averageLiveAnalyticsMetric_(losses);
    let target=definition.starter,targetSource="Starter benchmark",confidence="Starter benchmark";
    if(validCount>=3&&winningAverage!=null){
      const weight=validCount<=5?0.25:validCount<=9?0.5:0.75;
      const bounded=Math.max(definition.starter*0.8,Math.min(definition.starter*1.2,winningAverage));
      target=roundLiveAnalytics_(definition.starter*(1-weight)+bounded*weight);
      confidence=validCount<=5?"Early signal":validCount<=9?"Emerging target":"Program target";
      targetSource=confidence+" · blended with coach-configurable starter benchmark";
    }
    const changedDates=valid.map(function(item){return String(item.completedAt||"");}).filter(Boolean).sort();
    return{id:definition.id,label:definition.label,direction:definition.direction,side:definition.side,field:definition.field,numeratorField:definition.numeratorField,numeratorLabel:definition.numeratorLabel,denominatorField:definition.denominatorField,denominatorLabel:definition.denominatorLabel,
      unit:definition.unit,starterBenchmark:definition.starter,recommendedTarget:target,targetSource:targetSource,
      confidenceLabel:confidence,validSampleCount:validCount,winningGameAverage:winningAverage,losingGameAverage:losingAverage,
      insufficient:validCount<3||winningAverage==null,lastChanged:confidence==="Starter benchmark"?"2026-10-04":(changedDates.pop()||"Unknown")};
  });
  return{completedGameCount:games.length,winCount:winCount,lossCount:lossCount,metrics:metrics,
    guidance:"Targets describe associations in accessible completed games; they do not establish that a metric caused a result."};
}

function getLiveAnalyticsProgramBenchmark_(team) {
  requireLiveGameTeamAccess_(team);
  const sheet=SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  if(!sheet||sheet.getLastRow()<2)return buildLiveAnalyticsProgramBenchmark_([]);
  const values=sheet.getDataRange().getValues(),headers=values.shift(),cols=liveGameHeaderMap_(headers),access=getCurrentStaffAccess_();
  const rows=filterCoachIQRowsForCurrentSeason_(headers,values).filter(function(row){
    const rowTeam=String(row[cols.Team]||"");
    const accessible=!access.configured||access.role==="Head Coach"||!access.teams.length||access.teams.indexOf(rowTeam)>=0;
    return accessible&&!isLiveGameArchived_(row,cols)&&rowTeam===String(team)&&String(row[cols.Sport]||"Basketball").toLowerCase()==="basketball"&&String(row[cols.Status]||"")==="Completed"&&
      (String(row[cols["Game Result"]]||"")==="Win"||String(row[cols["Game Result"]]||"")==="Loss");
  });
  return buildLiveAnalyticsProgramBenchmark_(rows.map(function(row){return{completed:true,result:String(row[cols["Game Result"]]||""),
    completedAt:formatLiveGameTimestamp_(row[cols["Completed At"]]),analytics:buildLiveAnalyticsSummary_(getLiveAnalyticsPossessions_(String(row[cols["Game ID"]]||"")),1)};}));
}
