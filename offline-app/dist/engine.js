// Generated from CoachIQ canonical analytics. Run node offline-app/tools/build.cjs.
const Utilities={getUuid:()=>crypto.randomUUID()};
function cleanOfflineTechnicalFreeThrows_(input,adjustments,period,boundary){
 if(input==null)return [];if(!Array.isArray(input)||input.length>200)throw new Error("Up to 200 technical FT attempts are supported.");const ids=Object.create(null),links=Object.create(null);
 return input.map(function(e){if(!e||!/^TECHFT-[a-f0-9-]{36}$/i.test(String(e.id))||ids[e.id]||["our","opponent"].indexOf(e.side)<0||typeof e.made!=="boolean"||!Number.isInteger(e.period)||e.period<1||e.period>period||!Number.isInteger(e.boundarySequence)||e.boundarySequence<0||e.boundarySequence>boundary||isNaN(new Date(e.at).getTime()))throw new Error("Invalid technical free throw.");const jersey=String(e.jersey||"");if(jersey&&!/^\d{1,3}$/.test(jersey))throw new Error("Invalid technical FT shooter.");const link=String(e.scoreAdjustmentId||""),adjustment=(adjustments||[]).find(function(a){return a.id===link;}),voided=e.voided===true;
 if(e.made){if(!/^SCORE-[a-f0-9-]{36}$/i.test(link)||links[link]||(!voided&&(!adjustment||adjustment.delta!==1||adjustment.side!==e.side||adjustment.period!==e.period))||(voided&&adjustment))throw new Error("Technical FT points must match their score adjustment.");links[link]=true;}else if(link)throw new Error("A missed technical FT cannot add score points.");ids[e.id]=true;return{id:String(e.id),side:e.side,made:e.made,jersey:jersey,period:e.period,boundarySequence:e.boundarySequence,at:new Date(e.at).toISOString(),scoreAdjustmentId:link,voided:voided};});
}

function addOfflineTechnicalTotals_(analytics,attempts){
 const totals={our:{made:0,attempted:0},opponent:{made:0,attempted:0}};
 (attempts||[]).filter(function(e){return !e.voided;}).forEach(function(e){totals[e.side].attempted++;if(e.made)totals[e.side].made++;if(!e.jersey)return;const side=e.side==="our"?"us":"opponent";let p=analytics.playerTotals.find(function(p){return p.jersey===e.jersey&&p.playerSide===side;});if(!p){p={jersey:e.jersey,playerSide:side,points:0,paintTouches:0,offensiveRebounds:0,deflections:0,freeThrowsMade:0,freeThrowsAttempted:0,turnovers:0,forcedTurnovers:0};analytics.playerTotals.push(p);}p.freeThrowsAttempted++;if(e.made){p.freeThrowsMade++;p.points++;}});return totals;
}

function cleanOfflineObjectives_(input) {
  if(input==null)return [];
  if(!Array.isArray(input)||input.length>12)throw new Error("Choose up to twelve game-plan objectives.");
  const seen=Object.create(null),metrics=["points","offensive_rebounds","paint_touches","transition_points","turnovers","deflections","fouls","custom"];
  return input.map(function(raw,index){
    if(!raw||typeof raw!=="object")throw new Error("Invalid objective.");
    const id=String(raw.id||""),label=String(raw.label||"").trim(),goalType=raw.goalType||"track",unit=raw.unit||"count",subject=goalType==="comparison"?"both_teams":raw.subject||"our_team",target=Number(raw.target||0);
    const key=String(raw.categoryKey||raw.metric||label).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,""),metric=raw.metric||(key==="featured_player_points"?"points":metrics.indexOf(key)>=0?key:"custom");
    if(!/^objective_[a-z0-9_]{1,75}$/.test(id)||seen[id]||!label||label.length>60||/[\x00-\x1f]/.test(label))throw new Error("Every objective needs a unique ID and a name of up to 60 characters.");
    if(metrics.indexOf(metric)<0||["track","minimum","maximum","comparison"].indexOf(goalType)<0||["our_team","opponent_team","our_player","opponent_player","both_teams"].indexOf(subject)<0||["count","points","percentage"].indexOf(unit)<0||!Number.isFinite(target)||target<0||target>(unit==="percentage"?100:9999))throw new Error("Choose a valid metric, goal, subject and target.");
    const jersey=String(raw.jersey||"").trim();if(subject.indexOf("_player")>0&&!/^\d{1,3}$/.test(jersey))throw new Error(label+" needs a player jersey number.");
    seen[id]=true;return{id:id,label:label,metric:metric,categoryKey:key||"custom",goalType:goalType,subject:subject,target:target,direction:raw.direction==="lower"?"lower":"higher",unit:unit,jersey:jersey,playerLabel:String(raw.playerLabel||"").slice(0,100),playerId:String(raw.playerId||"").slice(0,100),active:raw.active!==false,order:index};
  });
}

function offlineObjectiveAutomatic_(o){return o.unit!=="percentage"&&(["points","offensive_rebounds","paint_touches","deflections"].indexOf(o.metric)>=0||(["transition_points","turnovers"].indexOf(o.metric)>=0&&o.subject.indexOf("_player")<0));}

function cleanOfflineObjectiveEvents_(input,objectives,period,boundary){
 if(input==null)return [];if(!Array.isArray(input)||input.length>2000)throw new Error("Up to 2,000 manual objective taps are supported.");
 const ids=Object.create(null);return input.map(function(e){
  const o=objectives.find(function(o){return o.id===e.objectiveId;});
  if(!o||offlineObjectiveAutomatic_(o)||!/^OBJEV-[a-f0-9-]{36}$/i.test(String(e.id))||ids[e.id]||!Number.isInteger(e.period)||e.period<1||e.period>period||!Number.isInteger(e.boundarySequence)||e.boundarySequence<0||e.boundarySequence>boundary||["our","opponent"].indexOf(e.side)<0||!Number.isInteger(e.amount)||e.amount<1||e.amount>3||isNaN(new Date(e.at).getTime()))throw new Error("Invalid manual objective tap.");
  if((o.subject.indexOf("our_")===0&&e.side!=="our")||(o.subject.indexOf("opponent_")===0&&e.side!=="opponent"))throw new Error("Objective tap has the wrong team.");
  if(o.unit==="percentage"?(["made","miss"].indexOf(e.kind)<0||e.amount!==1):e.kind!=="count")throw new Error("Invalid objective tap unit.");
  ids[e.id]=true;return{id:String(e.id),objectiveId:o.id,period:e.period,boundarySequence:e.boundarySequence,side:e.side,amount:e.amount,kind:e.kind,at:new Date(e.at).toISOString(),voided:e.voided===true};
 });
}

function buildOfflineObjectiveRows_(objectives,events,possessions,period,technicalFreeThrows){
 const log=(possessions||[]).filter(function(p){return !p.voided;}),a=buildLiveAnalyticsSummary_(log,period||1),fields={points:"points",offensive_rebounds:"offensiveRebounds",paint_touches:"paintTouches",transition_points:"transitionPoints"};
 const technical=addOfflineTechnicalTotals_(a,technicalFreeThrows);
 return objectives.filter(function(o){return o.active!==false;}).map(function(o){
  const total={our:0,opponent:0,ourMade:0,ourAttempts:0,opponentMade:0,opponentAttempts:0},automatic=offlineObjectiveAutomatic_(o);
  if(automatic){
   if(o.subject.indexOf("_player")>0){const side=o.subject==="our_player"?"us":"opponent",player=(a.playerTotals||[]).find(function(p){return p.jersey===o.jersey&&p.playerSide===side;});total[side==="us"?"our":"opponent"]=player?Number(player[fields[o.metric]||"deflections"]||0):0;}
   else if(o.metric==="deflections"){log.forEach(function(p){(p.playEvents||[]).forEach(function(e){if(e.type==="deflection")total[p.teamSide==="defense"?"our":"opponent"]++;});});}
   else if(o.metric==="turnovers"){total.our=a.offense.turnovers;total.opponent=a.defense.forcedTurnovers;}
   else{total.our=Number(a.offense[fields[o.metric]]||0);total.opponent=Number(a.defense[fields[o.metric]]||0);if(o.metric==="points"){total.our+=technical.our.made;total.opponent+=technical.opponent.made;}}
  }else events.filter(function(e){return e.objectiveId===o.id&&!e.voided;}).forEach(function(e){if(o.unit==="percentage"){total[e.side+"Attempts"]++;if(e.kind==="made")total[e.side+"Made"]++;}else total[e.side]+=e.amount;});
  if(o.unit==="percentage")["our","opponent"].forEach(function(side){total[side]=total[side+"Attempts"]?Math.round(total[side+"Made"]/total[side+"Attempts"]*1000)/10:0;});
  const side=o.subject.indexOf("opponent_")===0?"opponent":"our",value=total[side],margin=o.direction==="lower"?total.opponent-total.our:total.our-total.opponent;
  const measured=o.unit!=="percentage"||(o.goalType==="comparison"?total.ourAttempts>0&&total.opponentAttempts>0:total[side+"Attempts"]>0);
  const met=o.goalType==="comparison"?margin>=o.target:o.goalType==="minimum"?value>=o.target:o.goalType==="maximum"?value<=o.target:null;
  return Object.assign({},o,total,{automatic:automatic,value:value,margin:margin,measured:measured,status:!measured?"No attempts":o.goalType==="track"?"Tracking":met?"On target":"Needs attention"});
 });
}

function liveAnalyticsPlayPoints_(event){return event.type==="ftMade"?1:/^made[123]$/.test(event.type)?Number(event.type.slice(-1)):0;}

function livePaintTouchCount_(item){const count=(item.playEvents||[]).filter(function(event){return event.type==="paintTouch";}).length;return count||(item.paintTouch===true?1:0);}

function cleanLiveAnalyticsPossession_(payload, currentPeriod) {
  payload = payload || {};
  const teamSide = String(payload.teamSide || "").toLowerCase();
  if (["offense", "defense"].indexOf(teamSide) < 0) throw new Error("Choose offense or defense.");
  const points = Number(payload.points);
  if (!Number.isInteger(points) || points < 0 || points > 20) throw new Error("Possession points must be a whole number from 0 to 20.");
  const period = Number(payload.period || currentPeriod);
  if (!Number.isInteger(period) || period < 1 || period > 20) throw new Error("Choose a valid period.");
  const offensiveRebounds = Number(payload.offensiveRebounds || 0);
  if (!Number.isInteger(offensiveRebounds) || offensiveRebounds < 0 || offensiveRebounds > 10) throw new Error("Offensive rebounds must be between 0 and 10.");
  const turnover = teamSide === "offense" && payload.turnover === true;
  const forcedTurnover = teamSide === "defense" && payload.forcedTurnover === true;
  if ((turnover || forcedTurnover) && points !== 0) throw new Error("A turnover possession must end with 0 points.");
  const playEvents = cleanLiveAnalyticsPlayEvents_(payload.playEvents, teamSide);
  const breakdowns=playEvents.filter(function(event){return event.type==="defenseBreakdown";});
  if(breakdowns.length>1||(breakdowns.length&&!playEvents.some(function(event){return /^made[23]$/.test(event.type);})))throw new Error("Record one defensive breakdown only on a possession with a made basket.");
  const turnoverCredits=playEvents.filter(function(e){return e.type==="turnoverCommitted"||e.type==="turnoverForced";});
  if(turnoverCredits.length>2||(turnoverCredits.length&&!(turnover||forcedTurnover))||turnoverCredits.filter(function(e){return e.type==="turnoverCommitted";}).length>1||turnoverCredits.filter(function(e){return e.type==="turnoverForced";}).length>1||(teamSide==="offense"&&turnoverCredits.some(function(e){return e.type!=="turnoverCommitted";})))throw new Error("Turnover player credit must match the possession turnover outcome.");
  const reboundEvents = playEvents.filter(function(event){return event.type==="offensiveRebound";});
  if(reboundEvents.length && reboundEvents.length!==offensiveRebounds)throw new Error("Rebound events must match the possession rebound count.");
  const scores=playEvents.filter(function(event){return /^made[123]$/.test(event.type)||event.type==="ftMade";}),hasFreeThrows=playEvents.some(function(event){return ["freeThrows","ftMade","ftMiss"].indexOf(event.type)>=0;});
  if(hasFreeThrows){if(!playEvents.some(function(event){return event.type==="ftMade"||event.type==="ftMiss";}))throw new Error("Record an FT make or miss for a free-throw possession.");const total=scores.reduce(function(sum,event){return sum+liveAnalyticsPlayPoints_(event);},0);if(total!==points)throw new Error("Scoring events must match total possession points.");}
  else{if(points>3)throw new Error("Possession points above 3 need the individual basket/free-throw events.");if(scores.length>1||(scores.length===1&&Number(scores[0].type.slice(-1))!==points))throw new Error("Scoring event must match total possession points.");}

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

function cleanLiveAnalyticsTrackedTags_(tags){
  if(tags==null)return null;
  const allowed=["paintTouch","offensiveRebound","transition","deflection","driveKick","cut","setPlay","ato","putback","pickRoll","postUp","isolation","rightHandDrive","customTag"];
  if(!Array.isArray(tags)||tags.length>6||tags.some(function(tag){return allowed.indexOf(tag)<0;}))throw new Error("Choose valid tracked possession tags.");
  return tags.filter(function(tag,index){return tags.indexOf(tag)===index;});
}

function cleanLiveAnalyticsPlayEvents_(events, teamSide) {
  if(events==null)return [];
  if(!Array.isArray(events)||events.length>100)throw new Error("A possession can contain up to 100 play events.");
  const types=["paintTouch","offensiveRebound","deflection","driveKick","miss2","miss3","putback","andOne","made1","made2","made3","cut","setPlay","ato","pickRoll","postUp","isolation","customTag","freeThrows","ftMade","ftMiss","foulRetained","foulFreeThrows","defenseBreakdown","turnoverCommitted","turnoverForced"];
  return events.map(function(event){
    if(!event||types.indexOf(event.type)<0)throw new Error("Choose a valid play event.");
    const jersey=String(event.jersey||"").trim();
    if(jersey&&!/^[0-9]{1,3}$/.test(jersey))throw new Error("Use a jersey number of 1–3 digits.");
    if(event.type==="defenseBreakdown"&&teamSide!=="defense")throw new Error("Defensive responsibility belongs to a defensive possession.");
    const label=["customTag","defenseBreakdown"].indexOf(event.type)>=0?String(event.label||"").trim():"";
    if(["customTag","defenseBreakdown"].indexOf(event.type)>=0&&(!label||label.length>40||/[\x00-\x1f]/.test(label)))throw new Error("Custom tags need a name of 1–40 characters.");
    return {type:event.type,label:label,jersey:jersey,playerSide:["deflection","foulRetained","foulFreeThrows","defenseBreakdown","turnoverForced"].indexOf(event.type)>=0?(teamSide==="defense"?"us":"opponent"):(teamSide==="offense"?"us":"opponent")};
  });
}

function buildLiveAnalyticsPlayerTotals_(possessions) {
  const totals={};
  possessions.forEach(function(item){(item.playEvents||[]).forEach(function(event){
    if(!event.jersey||event.type==="defenseBreakdown")return;
    const playerSide=event.playerSide||(item.teamSide==="offense"?"us":"opponent"),key=playerSide+":"+event.jersey;
    const player=totals[key]||(totals[key]={jersey:event.jersey,playerSide:playerSide,offensiveRebounds:0,paintTouches:0,deflections:0,points:0,freeThrowsMade:0,freeThrowsAttempted:0,turnovers:0,forcedTurnovers:0});
    if(event.type==="offensiveRebound")player.offensiveRebounds++;
    if(event.type==="paintTouch")player.paintTouches++;
    if(event.type==="deflection")player.deflections++;
    if(event.type==="turnoverCommitted")player.turnovers++;
    if(event.type==="turnoverForced")player.forcedTurnovers++;
    player.points+=liveAnalyticsPlayPoints_(event);if(event.type==="ftMade")player.freeThrowsMade++;if(event.type==="ftMade"||event.type==="ftMiss")player.freeThrowsAttempted++;
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

function buildLivePossessionIntelligence_(possessions){
  const kills={total:0,currentStops:0,longestStops:0,totalStops:0,progress:0},paint={},patterns={},insights=[],recommendations=[];
  ["offense","defense"].forEach(function(side){paint[side]={withTouch:{possessions:0,scored:0,points:0},withoutTouch:{possessions:0,scored:0,points:0},unknown:0,currentNoTouch:0,longestNoTouch:0,recordedTouches:0,singleTouch:{possessions:0,scored:0,points:0},multipleTouches:{possessions:0,scored:0,points:0}};});
  const labels={freeThrows:"Free throws",foulRetained:"Foul · retained ball",foulFreeThrows:"Foul → FTs",paintTouch:"Paint touch",offensiveRebound:"OREB",transition:"Transition",rightHandDrive:"Right-hand drive",deflection:"Deflection",driveKick:"Drive & kick",cut:"Cut",setPlay:"Set play",ato:"ATO",putback:"Putback",pickRoll:"Pick & roll",postUp:"Post-up",isolation:"Isolation"};
  (possessions||[]).forEach(function(item,index){
    if(!paint[item.teamSide])return;const points=Number(item.points||0),side=item.teamSide,p=paint[side];
    const touchCount=livePaintTouchCount_(item);p.recordedTouches+=touchCount;if(touchCount){const group=touchCount>=2?p.multipleTouches:p.singleTouch;group.possessions++;group.points+=points;if(points>0)group.scored++;}
    const covered=item.paintTouch===true||(Array.isArray(item.trackedTags)&&item.trackedTags.indexOf("paintTouch")>=0);
    if(covered){const bucket=item.paintTouch?p.withTouch:p.withoutTouch;bucket.possessions++;bucket.points+=points;if(points>0)bucket.scored++;p.currentNoTouch=item.paintTouch?0:p.currentNoTouch+1;p.longestNoTouch=Math.max(p.longestNoTouch,p.currentNoTouch);}else{p.unknown++;p.currentNoTouch=0;}
    if(side==="defense"){
      if(points===0){kills.totalStops++;kills.currentStops++;kills.longestStops=Math.max(kills.longestStops,kills.currentStops);if(kills.currentStops%3===0)kills.total++;}else kills.currentStops=0;
    }
    const tags={};Object.keys(labels).forEach(function(type){if(item[type]===true||(type==="offensiveRebound"&&Number(item.offensiveRebounds||0)>0))tags[JSON.stringify([type,labels[type]])]={type:type,label:labels[type]};});
    (item.playEvents||[]).forEach(function(event){const label=event.type==="customTag"?event.label:labels[event.type];if(label)tags[JSON.stringify([event.type,label])]={type:event.type,label:label};});
    Object.keys(tags).forEach(function(key){const tag=tags[key],groupKey=JSON.stringify([side,key]),group=patterns[groupKey]||(patterns[groupKey]={side:side,type:tag.type,label:tag.label,possessions:0,scored:0,points:0,logNumbers:[]});group.possessions++;group.points+=points;if(points>0)group.scored++;group.logNumbers.push(index+1);});
  });
  const breakdownCounts=Object.create(null);let taggedBuckets=0,totalBuckets=0;
  (possessions||[]).filter(function(p){return p.teamSide==="defense";}).forEach(function(p){if((p.playEvents||[]).some(function(e){return /^made[23]$/.test(e.type);}))totalBuckets++;(p.playEvents||[]).filter(function(e){return e.type==="defenseBreakdown";}).forEach(function(e){taggedBuckets++;breakdownCounts[e.label]=(breakdownCounts[e.label]||0)+1;});});
  if(taggedBuckets)insights.push({kind:"attention",title:"Recorded defensive breakdowns",text:Object.keys(breakdownCounts).map(function(label){return label+": "+breakdownCounts[label];}).join(" · ")+". Reasons recorded on "+taggedBuckets+"/"+totalBuckets+" defensive possessions with a made basket. Coach-entered observations; untagged possessions are unknown.",logNumbers:[]});
  kills.progress=kills.currentStops%3;
  if(kills.totalStops)insights.push({kind:"positive",title:"Defensive kills",text:kills.total+" kill"+(kills.total===1?"":"s")+" earned · "+kills.totalStops+" total stops · longest run "+kills.longestStops+". Current run: "+kills.currentStops+" consecutive stops; "+kills.progress+"/3 toward the next kill.",logNumbers:[]});
  if(kills.progress===2)recommendations.push("One more stop earns the next kill: you have 2 consecutive stops toward it.");
  ["offense","defense"].forEach(function(side){
    const p=paint[side],who=side==="defense"?"Opponent":"Your team",withTouch=p.withTouch,without=p.withoutTouch;
    let ftMade=0,ftAttempted=0;(possessions||[]).filter(function(item){return item.teamSide===side;}).forEach(function(item){(item.playEvents||[]).forEach(function(event){if(event.type==="ftMade")ftMade++;if(event.type==="ftMade"||event.type==="ftMiss")ftAttempted++;});});
    if(ftAttempted)insights.push({kind:"neutral",title:who+" free throws",text:who+" made "+ftMade+"/"+ftAttempted+" recorded free throws ("+Math.round(100*ftMade/ftAttempted)+"%). Free-throw points remain part of the recorded possessions."+(ftAttempted<10?" Small sample.":""),logNumbers:[]});
    if(withTouch.possessions){const all=withTouch.scored===withTouch.possessions;insights.push({kind:side==="defense"&&all?"attention":"neutral",title:who+" paint-touch scoring",text:(all?who+" scored on every recorded paint-touch possession: ":who+" scored on ")+withTouch.scored+"/"+withTouch.possessions+" · "+withTouch.points+" points · "+(withTouch.points/withTouch.possessions).toFixed(2)+" PPP."+(withTouch.possessions<3?" Small sample.":""),logNumbers:[]});}
    if(p.multipleTouches.possessions){const multi=p.multipleTouches,single=p.singleTouch;insights.push({kind:"neutral",title:who+" repeated paint touches",text:p.recordedTouches+" recorded paint touches. On possessions with 2+ recorded touches: scored on "+multi.scored+"/"+multi.possessions+" for "+multi.points+" points ("+(multi.points/multi.possessions).toFixed(2)+" PPP)."+(single.possessions?" With one recorded touch: "+single.points+" points on "+single.possessions+" possessions ("+(single.points/single.possessions).toFixed(2)+" PPP).":"")+" Recorded counts only; older single-touch records may omit repeat touches."+(multi.possessions<10||(single.possessions>0&&single.possessions<10)?" Small sample.":""),logNumbers:[]});}
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

function buildLiveAnalyticsSummary_(possessions, currentPeriod, options) {
  const sides = {offense:emptyLiveAnalyticsSide_(), defense:emptyLiveAnalyticsSide_()};
  (possessions || []).forEach(function(item) {
    const side = sides[item.teamSide]; if (!side) return;
    side.possessions++;
    (item.playEvents||[]).forEach(function(event){if(event.type==="foulRetained")side.foulsRetained++;if(event.type==="foulFreeThrows")side.foulsToFreeThrows++;if(event.type==="ftMade")side.freeThrowsMade++;if(event.type==="ftMade"||event.type==="ftMiss")side.freeThrowsAttempted++;}); if (Number(item.period) === Number(currentPeriod)) side.periodPossessions++;
    side.points += item.points; side.offensiveRebounds += item.offensiveRebounds; side.paintTouches += livePaintTouchCount_(item);
    if (item.transition) { side.transitionPossessions++; side.transitionPoints += item.points; }
    if (item.paintTouch) { side.paintTouchPossessions++; side.paintTouchPoints += item.points; }
    if (item.rightHandDrive) { side.rightHandDrivePossessions++; side.rightHandDrivePoints += item.points; }
    if (item.turnover) side.turnovers++;
    if (item.forcedTurnover) side.forcedTurnovers++;
  });
  Object.keys(sides).forEach(function(key) { addLiveAnalyticsRates_(sides[key]); });
  const result={offense:sides.offense, defense:sides.defense,
    netPpp:roundLiveAnalytics_(sides.offense.ppp - sides.defense.ppp),
    possessionDifference:Math.abs(sides.offense.possessions - sides.defense.possessions)};
  if(options&&options.metricsOnly)return result;
  return Object.assign(result,{
    possessionLog:(possessions || []).slice(),
    playerTotals:buildLiveAnalyticsPlayerTotals_(possessions || []),
    scoringTags:buildLiveScoringTagSummary_(possessions || []),
    intelligence:buildLivePossessionIntelligence_(possessions || []),
    recent:(possessions || []).slice(-8).reverse()});
}

function emptyLiveAnalyticsSide_() { return {possessions:0,periodPossessions:0,points:0,offensiveRebounds:0,paintTouches:0,transitionPossessions:0,
  transitionPoints:0,paintTouchPossessions:0,paintTouchPoints:0,rightHandDrivePossessions:0,
  rightHandDrivePoints:0,turnovers:0,forcedTurnovers:0,freeThrowsMade:0,freeThrowsAttempted:0,foulsRetained:0,foulsToFreeThrows:0}; }

function liveAnalyticsRate_(number, denominator) { return denominator ? roundLiveAnalytics_(number / denominator) : null; }

function roundLiveAnalytics_(value) { return Math.round(Number(value || 0) * 1000) / 1000; }

function addLiveAnalyticsRates_(side) {
  side.freeThrowPercentage=side.freeThrowsAttempted?roundLiveAnalytics_(100*side.freeThrowsMade/side.freeThrowsAttempted):null;
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

function buildLiveNextAdjustment_(analytics,watchlist,recommendations,objectives){
  analytics=analytics||{};const log=analytics.possessionLog||[],candidates=[];
  const defaults={paintTouch:"Emphasize containing the ball before it reaches the paint and review where help arrives.",offensiveRebound:"Assign a body at the shot and finish the possession with a secured rebound.",transition:"Prioritize floor balance and identify the ball early in transition.",cut:"Review cutter communication and the help position behind the ball.",driveKick:"Contain penetration and review the next closeout after the kick-out.",setPlay:"Review the opponent's entry and communicate the first action.",ato:"Reinforce matchups and communicate the first action after the timeout.",putback:"Finish the initial stop with a box-out and secured rebound.",pickRoll:"Clarify the ball-screen coverage and the weak-side help responsibility.",postUp:"Review post positioning and the agreed help coverage.",isolation:"Review the primary matchup and where help is available.",rightHandDrive:"Review the plan for containing the opponent's right-hand drive."};
  const watches=(watchlist||[]).slice(0,3).map(function(watch){
    const entries=log.filter(function(p){return p.teamSide===watch.side;}),positive=[],negative=[];let unknown=0;
    entries.forEach(function(p){const present=p[watch.type]===true||(watch.type==="offensiveRebound"&&Number(p.offensiveRebounds||0)>0)||(p.playEvents||[]).some(function(event){return event.type===watch.type&&(watch.type!=="customTag"||event.label===watch.label);});
      if(present)positive.push(p);else if(watch.type!=="customTag"&&Array.isArray(p.trackedTags)&&p.trackedTags.indexOf(watch.type)>=0)negative.push(p);else unknown++;
    });
    const n=positive.length,points=positive.reduce(function(sum,p){return sum+Number(p.points||0);},0),scored=positive.filter(function(p){return Number(p.points)>0;}).length,withoutPoints=negative.reduce(function(sum,p){return sum+Number(p.points||0);},0);
    const totalTouches=watch.type==="paintTouch"?positive.reduce(function(sum,p){return sum+livePaintTouchCount_(p);},0):null;
    const evidence=(totalTouches!=null?totalTouches+" recorded paint touches across "+n+" tagged possessions. ":"")+(watch.side==="defense"?"Opponent":"Our team")+" · "+watch.label+": "+(n?"scored on "+scored+"/"+n+" tagged possessions for "+points+" points ("+(points/n).toFixed(2)+" PPP).":"no tagged occurrences recorded.")+(negative.length?" Confirmed without this tag: "+withoutPoints+" points on "+negative.length+" possessions ("+(withoutPoints/negative.length).toFixed(2)+" PPP).":"");
    const sample=n+" tagged · "+negative.length+" confirmed without · "+unknown+" unknown of "+entries.length+" relevant possessions. "+(n<10?"Small sample. ":"")+(unknown?"Partial tracking; absence is not inferred. ":"")+"Tags can overlap; results do not establish cause.";
    if(n>=3&&watch.side==="defense"&&scored/n>=0.5)candidates.push({rank:3+scored/n,title:"Address "+watch.label,action:watch.response||defaults[watch.type]||"Review the matchup and the agreed coverage for "+watch.label+".",evidence:evidence,sample:sample,basis:"Scouting watchlist · "+(watch.response?"coach's planned response":"suggested response")});
    if(n>=3&&watch.side==="offense"&&negative.length>=3&&points/n>withoutPoints/negative.length)candidates.push({rank:2,title:"Keep creating "+watch.label,action:watch.response||"Look for suitable "+watch.label+" opportunities against the current coverage; confirm the pattern over the next possessions.",evidence:evidence,sample:sample,basis:"Scouting watchlist · "+(watch.response?"coach's planned response":"suggested response")});
    return{title:watch.title,label:watch.label,side:watch.side,evidence:evidence,sample:sample,tagged:n,unknown:unknown,response:watch.response||""};
  });
  // A factual paint comparison can support the decision even without a linked scout.
  const intelligence=analytics.intelligence||{},paint=intelligence.paint||{};
  ["defense","offense"].forEach(function(side){const p=paint[side];if(!p)return;const yes=p.withTouch||{},no=p.withoutTouch||{};
    if(side==="defense"&&yes.possessions>=3&&yes.scored===yes.possessions&&no.possessions<3)candidates.push({rank:3,title:"Review paint containment",action:"Opponent scored on all "+yes.possessions+" recorded paint-touch possessions. "+defaults.paintTouch,evidence:yes.scored+"/"+yes.possessions+" recorded paint-touch possessions produced "+yes.points+" points.",sample:"Small or incomplete comparison sample. "+Number(p.unknown||0)+" possessions have unknown paint coverage; this does not establish cause.",basis:"Recorded paint-touch scoring"});
    if(yes.possessions>=3&&no.possessions>=3&&yes.points/yes.possessions>no.points/no.possessions)candidates.push({rank:side==="defense"?3:1,title:side==="defense"?"Protect the paint":"Keep creating paint touches",action:side==="defense"?defaults.paintTouch:"Look for paint-touch opportunities against this coverage and confirm the pattern over the next possessions.",evidence:(side==="defense"?"Opponent":"Our team")+" PPP: "+(yes.points/yes.possessions).toFixed(2)+" with a paint touch (n="+yes.possessions+") versus "+(no.points/no.possessions).toFixed(2)+" without (n="+no.possessions+").",sample:(yes.possessions<10||no.possessions<10?"Small sample. ":"")+Number(p.unknown||0)+" possessions have unknown paint coverage. Tracked association; opponent and lineup context may differ.",basis:"Recorded paint-touch comparison"});
  });
  let next=candidates.sort(function(a,b){return b.rank-a.rank;})[0];
  if(!next){const behind=(objectives||[]).find(function(item){return item.status==="behind";});if(behind)next={title:"Review "+behind.label,action:behind.recommendation||"Review the recorded target with your staff.",evidence:behind.summary||"A tracked objective is behind its target.",sample:"Objective pace is an estimate based on the current period, not elapsed game time.",basis:"Game-plan target"};}
  if(!next){const offense=log.filter(function(p){return p.teamSide==="offense";}),defense=log.filter(function(p){return p.teamSide==="defense";});next={title:log.length?"Confirm the next pattern":"Keep tracking the game",action:log.length>=6&&(recommendations||[]).length?recommendations[0]:"Stay with your planned approach and record the next possessions before making a data-based adjustment.",evidence:offense.length+" offensive and "+defense.length+" defensive possessions recorded. No watchlist or paint comparison meets the decision thresholds yet.",sample:"Limited evidence. Missing possessions and untracked tags cannot be inferred.",basis:"Recorded game context"};}
  return{watchlist:watches,nextAdjustment:next};
}

function buildLiveReviewInsights_(log,markers){
  log=log||[];const analytics=buildLiveAnalyticsSummary_(log,1),intel=analytics.intelligence||{},keep=[],address=[],players=[];
  if((intel.kills||{}).total)keep.push(intel.kills.total+" defensive kills from "+intel.kills.totalStops+" recorded stops; longest stop run "+intel.kills.longestStops+". Reinforce the communication and execution seen in those possessions.");
  ["offense","defense"].forEach(function(side){const paint=(intel.paint||{})[side]||{},yes=paint.withTouch||{},no=paint.withoutTouch||{};
    if(yes.possessions>=3&&no.possessions>=3&&yes.points/yes.possessions>no.points/no.possessions){const text=(side==="offense"?"Your team":"Opponent")+" scored "+(yes.points/yes.possessions).toFixed(2)+" PPP with paint touches (n="+yes.possessions+") versus "+(no.points/no.possessions).toFixed(2)+" without (n="+no.possessions+"). "+(side==="offense"?"Keep creating suitable paint-entry opportunities.":"Address paint containment and help positioning.")+" Tracked association; review matchup context.";(side==="offense"?keep:address).push(text);}
  });
  const off=analytics.offense||{};if(off.possessions>=3&&off.turnovers>=3&&off.turnovers/off.possessions>=0.2)address.push(off.turnovers+" turnovers on "+off.possessions+" recorded offensive possessions ("+(100*off.turnovers/off.possessions).toFixed(1)+"%). Review the decisions and pressure that preceded them.");
  (intel.tagPatterns||[]).filter(function(t){return t.type!=="paintTouch"&&t.type!=="deflection"&&t.possessions>=3&&t.scored/t.possessions>=2/3;}).sort(function(a,b){return b.possessions-a.possessions;}).slice(0,4).forEach(function(t){(t.side==="offense"?keep:address).push((t.side==="offense"?"Your team":"Opponent")+" · "+t.label+": scored on "+t.scored+"/"+t.possessions+" tagged possessions for "+t.points+" points. "+(t.side==="offense"?"Keep looking for these opportunities against suitable coverage.":"Review the coverage for this action.")+" Tags can overlap; this does not isolate cause.");});
  (analytics.playerTotals||[]).forEach(function(p){const who=(p.playerSide==="opponent"?"Opponent":"Our")+" #"+p.jersey,items=[];if(p.offensiveRebounds>=3)items.push(p.offensiveRebounds+" offensive rebounds");if(p.deflections>=3)items.push(p.deflections+" deflections");if(p.paintTouches>=5)items.push(p.paintTouches+" paint touches");if(p.points>=6)items.push(p.points+" points");if(items.length)players.push({side:p.playerSide,jersey:p.jersey,text:who+" credited with "+items.join(", ")+". Credited events only; unassigned plays are excluded.",priority:p.offensiveRebounds*3+p.points});});
  players.sort(function(a,b){return b.priority-a.priority;});players.slice(0,4).forEach(function(p){if(p.side==="opponent"&&p.text.indexOf("offensive rebounds")>=0)address.push(p.text+" Review box-out assignments.");});
  const tactical=(markers||[]).filter(function(m){return m.kind==="tactical"&&Number.isFinite(Number(m.boundarySequence));});
  const comparisons=tactical.map(function(m,index){const next=tactical[index+1],end=next?Number(next.boundarySequence):Infinity,rows=[];["offense","defense"].forEach(function(side){if(m.side!=="both"&&m.side!==side)return;const before=log.filter(function(p){return p.teamSide===side&&Number(p.sequence)<=Number(m.boundarySequence);}).slice(-10),after=log.filter(function(p){return p.teamSide===side&&Number(p.sequence)>Number(m.boundarySequence)&&Number(p.sequence)<=end;});
      const total=function(items){return items.reduce(function(n,p){return n+Number(p.points||0);},0);},a=total(before),b=total(after);rows.push({side:side,before:{possessions:before.length,points:a,ppp:before.length?a/before.length:null},after:{possessions:after.length,points:b,ppp:after.length?b/after.length:null},text:(side==="defense"?"Points allowed":"Points scored")+": before "+(before.length?(a/before.length).toFixed(2):"—")+" PPP ("+a+" pts / "+before.length+" poss), "+(next?"until next marker":"since marker")+" "+(after.length?(b/after.length).toFixed(2):"—")+" PPP ("+b+" pts / "+after.length+" poss)."+(before.length<10||after.length<10?" Small sample.":"")});});
    return{label:m.label,period:m.period,changedAt:m.changedAt,rows:rows,note:"Last 10 recorded possessions per side before the marker versus recorded possessions after it, ending at the next marker. Recorded order includes late-arriving taps. Opponents, lineups and other changes can affect results; this does not prove the adjustment caused the change."};});
  return{keepDoing:keep.slice(0,4),address:address.slice(0,4),playerAlerts:players.slice(0,4),adjustments:comparisons,coverage:"Highlights use completed recorded possessions. Small samples, missing possessions, untracked tags and incomplete player attribution limit conclusions. Use these as film-review priorities going forward."};
}

function scoutingComparisonMetrics_(){return[{id:"points",label:"Points"},{id:"paintTouch",label:"Paint-touch possessions"},{id:"paintTouches",label:"Total recorded paint touches"},{id:"offensiveRebound",label:"Offensive rebounds"},{id:"turnover",label:"Turnovers"},{id:"transition",label:"Transition possessions"},{id:"deflection",label:"Deflections"},{id:"cut",label:"Cut possessions"},{id:"driveKick",label:"Drive & kick"},{id:"setPlay",label:"Set play"},{id:"ato",label:"ATO"},{id:"putback",label:"Putback"},{id:"pickRoll",label:"Pick & roll"},{id:"postUp",label:"Post-up"},{id:"isolation",label:"Isolation"},{id:"rightHandDrive",label:"Right-hand drive"},{id:"stops",label:"Defensive stops"},{id:"kills",label:"Defensive kills"},{id:"customTag",label:"Custom tag"}];}

function scoutingMetricForLabel_(label){const key=String(label||"").toLowerCase().replace(/[^a-z0-9]/g,"");const map={totalpainttouches:"paintTouches",recordedpainttouches:"paintTouches",points:"points",painttouches:"paintTouch",painttouch:"paintTouch",offensiverebounds:"offensiveRebound",oreb:"offensiveRebound",turnovers:"turnover",transition:"transition",deflections:"deflection",cuts:"cut",cut:"cut",drivekick:"driveKick",driveandkick:"driveKick",setplay:"setPlay",ato:"ato",putback:"putback",kills:"kills",stops:"stops"};return Object.prototype.hasOwnProperty.call(map,key)?map[key]:"";}

function scoutingGameEvidence_(analytics,choice,finalScore){
  const reverse=["deflection","stops","kills"].indexOf(choice.metric)>=0;
  const side=(choice.team==="us")!==reverse?"offense":"defense",metric=choice.metric;
  const entries=(analytics.possessionLog||[]).map(function(item,index){return{item:item,number:index+1};}).filter(function(entry){return entry.item.teamSide===side;});
  const automatic=["points","turnover","stops","kills"].indexOf(metric)>=0;
  let count=0,covered=0,points=0,scored=0,currentStops=0,kills=0,legacyPaintCounts=0;const numbers=[];
  entries.forEach(function(entry){
    const item=entry.item,matches=(item.playEvents||[]).filter(function(event){return event.type===metric&&(metric!=="customTag"||event.label===choice.label);});
    let present=matches.length>0;
    if(metric==="paintTouches"){present=livePaintTouchCount_(item)>0;if(present&&!(item.playEvents||[]).some(function(event){return event.type==="paintTouch";}))legacyPaintCounts++;}
    if(["paintTouch","transition","rightHandDrive"].indexOf(metric)>=0)present=item[metric]===true||present;
    if(metric==="offensiveRebound")present=Number(item.offensiveRebounds||0)>0;
    if(metric==="turnover")present=side==="offense"?item.turnover===true:item.forcedTurnover===true;
    if(metric==="points")present=true;
    if(metric==="stops"||metric==="kills")present=Number(item.points||0)===0;
    if(automatic||present||(metric!=="customTag"&&Array.isArray(item.trackedTags)&&item.trackedTags.indexOf(metric==="paintTouches"?"paintTouch":metric)>=0))covered++;
    if(Number(item.points||0)===0){currentStops++;if(currentStops%3===0)kills++;}else currentStops=0;
    if(present){
      count+=metric==="paintTouches"?livePaintTouchCount_(item):metric==="points"?Number(item.points||0):metric==="offensiveRebound"?Number(item.offensiveRebounds||0):metric==="deflection"?matches.length:1;
      points+=Number(item.points||0);if(Number(item.points||0)>0)scored++;numbers.push(entry.number);
    }
  });
  if(metric==="kills")count=kills;
  const scoreKey=choice.team==="us"?"our":"opponent",hasFinalPoints=metric==="points"&&finalScore&&typeof finalScore[scoreKey]==="number";
  if(hasFinalPoints)count=finalScore[scoreKey];
  let status=hasFinalPoints?"measured":!entries.length||!covered?"untracked":covered<entries.length?"partial":"measured";
  if(metric==="paintTouches"&&legacyPaintCounts)status="partial";
  const catalog=scoutingComparisonMetrics_().find(function(item){return item.id===metric;}),label=metric==="customTag"?choice.label:(catalog||{}).label||metric,prefix=choice.team==="us"?"Our team":"Opponent";
  let text;
  if(hasFinalPoints)text=prefix+" final confirmed score: "+count+" points.";
  else if(status==="untracked")text="No "+label.toLowerCase()+" tracking evidence is available for "+prefix.toLowerCase()+". No result is inferred.";
  else text=prefix+" · "+count+" observed "+label.toLowerCase()+". "+(automatic?"Across "+entries.length+" recorded possessions.":"Tracking coverage "+covered+"/"+entries.length+" relevant possessions.")+(metric!=="points"?" Tagged/stopped possessions: "+points+" points, scored on "+scored+"/"+numbers.length+".":"")+(status==="partial"?" Partial evidence; untracked possessions are not assumed to be zero.":"");
  if(metric==="paintTouches")text+=" Counts use recorded touch events; older boolean-only rows establish at least one touch, and additional historical touches cannot be reconstructed.";
  return{status:status,value:count,metric:metric,team:choice.team,label:label,covered:covered,total:entries.length,numbers:hasFinalPoints?[]:numbers,text:text};
}

function scoutingSectionGameContext_(section,analytics){
  const side=["our-offense","opponent-defense"].indexOf(section.id)>=0?"offense":["our-defense","opponent-offense","opponent-tendencies"].indexOf(section.id)>=0?"defense":"";
  if(side){
    const entries=(analytics.possessionLog||[]).filter(function(item){return item.teamSide===side;});if(!entries.length)return "No possession evidence was recorded for this side. This note requires coach review.";
    const points=entries.reduce(function(sum,item){return sum+Number(item.points||0);},0),who=side==="offense"?"Our offense":"Opponent offense";
    let text="Related evidence — coach review required: "+who+" recorded "+points+" points on "+entries.length+" possessions ("+(points/entries.length).toFixed(2)+" PPP). ";
    text+=scoutingGameEvidence_(analytics,{metric:"paintTouch",team:side==="offense"?"us":"opponent"}).text;
    const kills=(analytics.intelligence||{}).kills;if(side==="defense"&&kills)text+=" Our defense earned "+Number(kills.total||0)+" kills; longest stop run "+Number(kills.longestStops||0)+".";
    const patterns=((analytics.intelligence||{}).tagPatterns||[]).filter(function(item){return item.side===side&&item.type!=="paintTouch";}).slice(0,2);patterns.forEach(function(item){text+=" "+item.label+": scored on "+item.scored+"/"+item.possessions+" tagged possessions for "+item.points+" points.";});return text;
  }
  if(section.id==="special-situations")return "Related evidence — coach review required: "+scoutingGameEvidence_(analytics,{metric:"ato",team:"us"}).text+" "+scoutingGameEvidence_(analytics,{metric:"ato",team:"opponent"}).text;
  return "No explicit tracked measure linked. Review this scouting note against the game evidence; it is not automatically graded.";
}

function buildGameScoutingComparison_(snapshot,report,sourceMode){
  const analytics=report.analytics||{},objectives=report.objectives||[];
  const rows=(snapshot.sections||[]).map(function(section,index){
    const tracking=section.tracking||{},fallbackMetric=tracking.enabled?scoutingMetricForLabel_(tracking.label):"";
    const choice=section.comparison||(fallbackMetric?{metric:fallbackMetric,team:tracking.subject==="opponent_team"?"opponent":"us",label:""}:null);
    const id="objective_scout_"+String(section.id||index).toLowerCase().replace(/[^a-z0-9_]/g,"_").slice(0,45),objective=objectives.find(function(item){return item.id===id;});
    let status="review",actual=scoutingSectionGameContext_(section,analytics),numbers=[];
    if(choice){
      const evidence=scoutingGameEvidence_(analytics,choice,report.finalScore);status=evidence.status;actual=evidence.text;numbers=evidence.numbers;
      const matchingUnit=(tracking.unit==="points"&&choice.metric==="points")||(tracking.unit==="count"&&choice.metric!=="points");
      if(status==="measured"&&tracking.enabled&&fallbackMetric===choice.metric&&choice.team===(tracking.subject==="opponent_team"?"opponent":"us")&&matchingUnit&&["minimum","maximum"].indexOf(tracking.goalType)>=0){
        const target=Number(tracking.target||0),met=tracking.goalType==="minimum"?evidence.value>=target:evidence.value<=target;status=met?"met":"not_met";actual+=" Target: "+(tracking.goalType==="minimum"?"at least ":"at most ")+target+".";
      }
      if(!section.comparison&&tracking.subject==="both_teams"){
        const opponent=scoutingGameEvidence_(analytics,{metric:choice.metric,team:"opponent",label:choice.label},report.finalScore);actual+=" "+opponent.text;numbers=Array.from(new Set(numbers.concat(opponent.numbers))).sort(function(a,b){return a-b;});
        status=evidence.status==="untracked"||opponent.status==="untracked"?"untracked":evidence.status==="partial"||opponent.status==="partial"?"partial":"measured";
        if(status==="measured"&&tracking.goalType==="comparison"&&matchingUnit){const margin=tracking.direction==="lower"?opponent.value-evidence.value:evidence.value-opponent.value;status=margin>=Math.max(1,Number(tracking.target||0))?"met":"not_met";actual+=" Required margin: "+Math.max(1,Number(tracking.target||0))+".";}
      }
    }else if(objective){status=objective.status==="winning"?"met":objective.status==="behind"?"not_met":"review";actual=objective.summary||"See the recorded game-plan result.";}
    const goal=tracking.goalType==="minimum"?"At least "+Number(tracking.target||0):tracking.goalType==="maximum"?"At most "+Number(tracking.target||0):tracking.goalType==="comparison"?"Win by "+Math.max(1,Number(tracking.target||0))+" ("+(tracking.direction==="lower"?"fewer":"more")+")":"Track only";
    return{title:section.title,planned:section.content||"",expected:tracking.enabled?(tracking.label||section.title)+" · "+goal+(tracking.goalType!=="track"?" "+(tracking.unit||"count"):""):"",status:status,actual:actual,numbers:numbers};
  });
  const summary={};[["measured","measured"],["met","met"],["notMet","not_met"],["partial","partial"]].forEach(function(pair){summary[pair[0]]=rows.filter(function(row){return row.status===pair[1];}).length;});summary.review=rows.filter(function(row){return row.status==="review"||row.status==="untracked";}).length;
  return{available:true,sourceMode:sourceMode,source:snapshot,rows:rows,summary:summary};
}
export {cleanOfflineTechnicalFreeThrows_,addOfflineTechnicalTotals_,cleanOfflineObjectives_,offlineObjectiveAutomatic_,cleanOfflineObjectiveEvents_,buildOfflineObjectiveRows_,liveAnalyticsPlayPoints_,livePaintTouchCount_,cleanLiveAnalyticsPossession_,cleanLiveAnalyticsTrackedTags_,cleanLiveAnalyticsPlayEvents_,buildLiveAnalyticsPlayerTotals_,buildLiveScoringTagSummary_,buildLivePossessionIntelligence_,buildLiveAnalyticsSummary_,emptyLiveAnalyticsSide_,liveAnalyticsRate_,roundLiveAnalytics_,addLiveAnalyticsRates_,buildLiveNextAdjustment_,buildLiveReviewInsights_,scoutingComparisonMetrics_,scoutingMetricForLabel_,scoutingGameEvidence_,scoutingSectionGameContext_,buildGameScoutingComparison_};
