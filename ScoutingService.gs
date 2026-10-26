/** Scouting report storage and access. */
const SCOUTING_REPORTS_SHEET = "Scouting Reports";
const SCOUTING_REPORT_HEADERS = ["Report ID","Team","Opponent","Game Date","Location","Status","Opponent Identity","Keys to Victory","Sections JSON","Created By","Created At","Updated At"];

function getScoutingWorkspace() {
  requireStaffCapability_("run_sessions");
  const sheet = initializeScoutingSheet_();
  const settings = getCoachIQSettings();
  const access = getCurrentStaffAccess_();
  const rows = sheet.getLastRow() < 2 ? [] : sheet.getRange(2, 1, sheet.getLastRow() - 1, SCOUTING_REPORT_HEADERS.length).getValues();
  return {
    comparisonMetrics:scoutingComparisonMetrics_(),
    teams:(settings.teams || []).filter(function(team){return !access.configured || access.role === "Head Coach" || !access.teams.length || access.teams.indexOf(team) >= 0;}),
    schoolName:settings.schoolName || "", programName:settings.programName || "", mascotName:settings.mascotName || "",
    season:settings.currentSeason || "", logoUrl:settings.logoUrl || "", primaryColor:settings.primaryColor || "#1E3A5F", secondaryColor:settings.secondaryColor || "#F59E0B",
    reports:rows.map(scoutingRowToObject_).filter(function(report){return canAccessScoutingTeam_(report.team, access);}).sort(function(a,b){return String(b.updatedAt).localeCompare(String(a.updatedAt));})
  };
}

function saveScoutingReport(data) {
  requireStaffCapability_("run_sessions");
  data = data || {};
  const sheet = initializeScoutingSheet_();
  const team = String(data.team || "").trim();
  const opponent = safeScoutingText_(data.opponent, 80);
  const settings = getCoachIQSettings();
  if (!team || (settings.teams || []).indexOf(team) < 0) throw new Error("Choose a valid team.");
  requireScoutingTeamAccess_(team);
  if (!opponent) throw new Error("Enter an opponent.");
  const status = ["Draft","Ready","Archived"].indexOf(data.status) >= 0 ? data.status : "Draft";
  const location = ["Home","Away","Neutral"].indexOf(data.location) >= 0 ? data.location : "Home";
  const sections = cleanScoutingSections_(data.sections);
  const now = new Date();
  const reportId = String(data.reportId || "").trim() || "SCOUT-" + Utilities.getUuid().slice(0, 12).toUpperCase();
  const existing = findScoutingReportRow_(sheet, reportId);
  const createdBy = existing ? existing.values[9] : (Session.getActiveUser().getEmail() || "");
  const createdAt = existing ? existing.values[10] : now;
  const row = [reportId, safeScoutingSheetValue_(team,80), safeScoutingSheetValue_(opponent,80), safeScoutingSheetValue_(data.gameDate,20), location, status,
    safeScoutingSheetValue_(data.identity,1200), safeScoutingSheetValue_(data.keysToVictory,1200), JSON.stringify(sections), createdBy, createdAt, now];
  if (existing) {
    requireScoutingTeamAccess_(String(existing.values[1] || ""));
    sheet.getRange(existing.rowNumber, 1, 1, row.length).setValues([row]);
  } else sheet.appendRow(row);
  try { logCoachIQAudit({action:existing?"UPDATE_SCOUTING_REPORT":"CREATE_SCOUTING_REPORT",entityType:"Scouting Report",entityId:reportId,team:team,beforeValue:existing?"Existing report":"Report did not exist",afterValue:{opponent:opponent,status:status,sections:sections.length},success:true,error:""}); } catch(error) { console.error("Scouting audit failed: " + error.message); }
  return scoutingRowToObject_(row);
}

function deleteScoutingReport(reportId) {
  requireStaffCapability_("run_sessions");
  const sheet = initializeScoutingSheet_();
  const existing = findScoutingReportRow_(sheet, String(reportId || ""));
  if (!existing) throw new Error("That scouting report was not found.");
  requireScoutingTeamAccess_(String(existing.values[1] || ""));
  sheet.deleteRow(existing.rowNumber);
  try { logCoachIQAudit({action:"DELETE_SCOUTING_REPORT",entityType:"Scouting Report",entityId:String(reportId),team:String(existing.values[1]||""),beforeValue:{opponent:String(existing.values[2]||"")},afterValue:"Deleted",success:true,error:""}); } catch(error) { console.error("Scouting audit failed: " + error.message); }
  return {success:true, reportId:String(reportId)};
}

function sendScoutingReportToLiveGame(reportId) {
  requireStaffCapability_("run_sessions");
  const record=findScoutingReportRow_(initializeScoutingSheet_(),String(reportId||""));
  if(!record)throw new Error("Save the scouting report first.");
  const report=scoutingRowToObject_(record.values);requireScoutingTeamAccess_(report.team);
  const objectives=report.sections.filter(function(section){return section.tracking&&section.tracking.enabled;}).map(function(section,index){const tracking=section.tracking,safeId=String(section.id||index).toLowerCase().replace(/[^a-z0-9_]/g,"_").slice(0,45);return{id:"objective_scout_"+safeId,label:tracking.label||section.title,goalType:tracking.goalType,subject:tracking.subject,target:tracking.target,direction:tracking.direction,unit:tracking.unit,order:index};});
  if(!objectives.length)return{reportId:report.reportId,team:report.team,opponent:report.opponent,objectives:[]};
  initializeLiveGameSheets_();const cleaned=cleanLiveGameTrackingPlan_(objectives),name=("Scout: "+report.opponent).slice(0,60),sheet=SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_TEMPLATES_SHEET),rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,LIVE_GAME_TEMPLATE_HEADERS.length).getValues():[],index=rows.findIndex(function(row){return String(row[1]||"").toLowerCase()===name.toLowerCase()&&String(row[2]||"")===report.team;}),now=new Date();let templateId;
  if(index>=0){templateId=String(rows[index][0]);sheet.getRange(index+2,4).setValue(JSON.stringify(cleaned));sheet.getRange(index+2,7).setValue(now);}else{templateId="TPL-"+Utilities.getUuid().slice(0,10).toUpperCase();sheet.appendRow([templateId,safeLiveGameValue_(name),safeLiveGameValue_(report.team),JSON.stringify(cleaned),Session.getActiveUser().getEmail()||"",now,now]);}
  return{reportId:report.reportId,templateId:templateId,templateName:name,team:report.team,opponent:report.opponent,objectives:cleaned};
}

function initializeScoutingSheet_() {
  const spreadsheet = getCoachIQSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(SCOUTING_REPORTS_SHEET);
  if (!sheet) { sheet = spreadsheet.insertSheet(SCOUTING_REPORTS_SHEET); sheet.getRange(1,1,1,SCOUTING_REPORT_HEADERS.length).setValues([SCOUTING_REPORT_HEADERS]); sheet.setFrozenRows(1); }
  return sheet;
}
function cleanScoutingSections_(sections) {
  if (!Array.isArray(sections)) return [];
  if (sections.length > 20) throw new Error("A scouting report can contain up to 20 sections.");
  return sections.map(function(section,index){const raw=section&&section.tracking||{},goal=["comparison","minimum","maximum","track"].indexOf(raw.goalType)>=0?raw.goalType:"track",subject=["our_team","opponent_team","both_teams"].indexOf(raw.subject)>=0?raw.subject:"our_team",unit=["count","points","percentage"].indexOf(raw.unit)>=0?raw.unit:"count";return {id:safeScoutingText_(section.id,60)||("section-"+index),title:safeScoutingText_(section.title,80)||"Untitled section",prompt:safeScoutingText_(section.prompt,180),content:safeScoutingText_(section.content,5000),comparison:cleanScoutingComparison_(section.comparison),tracking:{enabled:raw.enabled===true,label:safeScoutingText_(raw.label,60),goalType:goal,subject:goal==="comparison"?"both_teams":subject,target:Math.max(0,Math.min(9999,Number(raw.target)||0)),direction:raw.direction==="lower"?"lower":"higher",unit:unit}};});
}
function safeScoutingText_(value,maxLength) { return String(value == null ? "" : value).trim().slice(0,maxLength); }
function safeScoutingSheetValue_(value,maxLength) { const text=safeScoutingText_(value,maxLength); return /^[=+\-@]/.test(text)?"'"+text:text; }
function findScoutingReportRow_(sheet, reportId) { if (!reportId || sheet.getLastRow() < 2) return null; const rows=sheet.getRange(2,1,sheet.getLastRow()-1,SCOUTING_REPORT_HEADERS.length).getValues(); for(let i=0;i<rows.length;i++){if(String(rows[i][0])===reportId)return{rowNumber:i+2,values:rows[i]};} return null; }
function scoutingRowToObject_(row) { let sections=[];try{sections=JSON.parse(String(row[8]||"[]"));}catch(error){sections=[];} return {reportId:String(row[0]||""),team:String(row[1]||""),opponent:String(row[2]||""),gameDate:row[3] instanceof Date?Utilities.formatDate(row[3],Session.getScriptTimeZone(),"yyyy-MM-dd"):String(row[3]||""),location:String(row[4]||"Home"),status:String(row[5]||"Draft"),identity:String(row[6]||""),keysToVictory:String(row[7]||""),sections:cleanScoutingSections_(sections),createdBy:String(row[9]||""),createdAt:row[10] instanceof Date?row[10].toISOString():String(row[10]||""),updatedAt:row[11] instanceof Date?row[11].toISOString():String(row[11]||"")}; }
function canAccessScoutingTeam_(team,access){return !access.configured || access.role === "Head Coach" || !access.teams.length || access.teams.indexOf(String(team||"")) >= 0;}
function requireScoutingTeamAccess_(team){const access=getCurrentStaffAccess_();if(!canAccessScoutingTeam_(team,access))throw new Error("You do not have access to that team's scouting reports.");}
/** Pregame scouting and large postgame reports are preserved in bounded JSON chunks. */
const GAME_REPORT_SNAPSHOTS_SHEET = "Game Report Snapshots";
const GAME_REPORT_SNAPSHOT_HEADERS = ["Snapshot ID","Game ID","Kind","Chunk","Captured At","JSON"];
function writeGameReportSnapshot_(gameId,kind,value){
  const sheet=ensureLiveGameSheet_(GAME_REPORT_SNAPSHOTS_SHEET,GAME_REPORT_SNAPSHOT_HEADERS),text=JSON.stringify(value),snapshotId="SNAP-"+Utilities.getUuid(),capturedAt=new Date(),rows=[];
  for(let offset=0;offset<text.length;){let end=Math.min(offset+40000,text.length);if(end<text.length&&text.charCodeAt(end-1)>=0xD800&&text.charCodeAt(end-1)<=0xDBFF)end--;rows.push([snapshotId,String(gameId),kind,rows.length+1,capturedAt,"json:"+text.slice(offset,end)]);offset=end;}
  sheet.getRange(sheet.getLastRow()+1,1,rows.length,GAME_REPORT_SNAPSHOT_HEADERS.length).setValues(rows);return snapshotId;
}
function readGameReportSnapshot_(gameId,kind,snapshotId){
  if(!snapshotId)return null;const sheet=SpreadsheetApp.getActive().getSheetByName(GAME_REPORT_SNAPSHOTS_SHEET);if(!sheet||sheet.getLastRow()<2)return null;
  // Read only the small index first, never every game's large report payload.
  const index=sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues();
  const matches=index.map(function(row,offset){return{row:row,number:offset+2};}).filter(function(entry){return String(entry.row[0])===String(snapshotId)&&String(entry.row[1])===String(gameId)&&String(entry.row[2])===kind;}).sort(function(a,b){return Number(a.row[3])-Number(b.row[3]);});if(!matches.length)return null;
  matches.forEach(function(entry,offset){if(Number(entry.row[3])!==offset+1)throw new Error("The saved report snapshot is incomplete.");});
  const contiguous=matches.every(function(entry,offset){return entry.number===matches[0].number+offset;});
  const chunks=contiguous?sheet.getRange(matches[0].number,6,matches.length,1).getValues().map(function(row){return row[0];}):matches.map(function(entry){return sheet.getRange(entry.number,6,1,1).getValues()[0][0];});
  const text=chunks.map(function(chunk){if(String(chunk).slice(0,5)!=="json:")throw new Error("The saved report snapshot is incomplete.");return String(chunk).slice(5);}).join('');try{return JSON.parse(text);}catch(error){throw new Error("The saved report snapshot is incomplete or unreadable.");}
}
function captureGameScoutingReport_(reportId,team,opponent){
  if(!reportId)return null;const record=findScoutingReportRow_(initializeScoutingSheet_(),String(reportId));if(!record)throw new Error("The selected scouting report no longer exists.");
  const report=scoutingRowToObject_(record.values);requireScoutingTeamAccess_(report.team);
  if(report.team!==team||report.opponent.trim().toLowerCase()!==String(opponent).trim().toLowerCase())throw new Error("Choose a scouting report for this team and opponent, or clear the scouting link.");
  if(report.status==="Archived")throw new Error("Choose an active scouting report.");
  return{reportId:report.reportId,team:report.team,opponent:report.opponent,gameDate:report.gameDate,status:report.status,identity:report.identity,keysToVictory:report.keysToVictory,sections:report.sections,updatedAt:report.updatedAt,capturedAt:new Date().toISOString()};
}
function scoutingComparisonMetrics_(){return[{id:"points",label:"Points"},{id:"paintTouch",label:"Paint-touch possessions"},{id:"offensiveRebound",label:"Offensive rebounds"},{id:"turnover",label:"Turnovers"},{id:"transition",label:"Transition possessions"},{id:"deflection",label:"Deflections"},{id:"cut",label:"Cut possessions"},{id:"driveKick",label:"Drive & kick"},{id:"setPlay",label:"Set play"},{id:"ato",label:"ATO"},{id:"putback",label:"Putback"},{id:"pickRoll",label:"Pick & roll"},{id:"postUp",label:"Post-up"},{id:"isolation",label:"Isolation"},{id:"rightHandDrive",label:"Right-hand drive"},{id:"stops",label:"Defensive stops"},{id:"kills",label:"Defensive kills"},{id:"customTag",label:"Custom tag"}];}
function cleanScoutingComparison_(raw){
  raw=raw||{};const metric=String(raw.metric||"");if(!metric)return null;
  if(!scoutingComparisonMetrics_().some(function(item){return item.id===metric;}))throw new Error("Choose a valid postgame comparison measure.");
  const label=metric==="customTag"?safeScoutingText_(raw.label,40):"";if(metric==="customTag"&&!label)throw new Error("Name the custom tag for comparison.");
  return{metric:metric,team:raw.team==="opponent"?"opponent":"us",label:label};
}
function scoutingMetricForLabel_(label){const key=String(label||"").toLowerCase().replace(/[^a-z0-9]/g,"");const map={points:"points",painttouches:"paintTouch",painttouch:"paintTouch",offensiverebounds:"offensiveRebound",oreb:"offensiveRebound",turnovers:"turnover",transition:"transition",deflections:"deflection",cuts:"cut",cut:"cut",drivekick:"driveKick",driveandkick:"driveKick",setplay:"setPlay",ato:"ato",putback:"putback",kills:"kills",stops:"stops"};return Object.prototype.hasOwnProperty.call(map,key)?map[key]:"";}
function scoutingGameEvidence_(analytics,choice,finalScore){
  const reverse=["deflection","stops","kills"].indexOf(choice.metric)>=0;
  const side=(choice.team==="us")!==reverse?"offense":"defense",metric=choice.metric;
  const entries=(analytics.possessionLog||[]).map(function(item,index){return{item:item,number:index+1};}).filter(function(entry){return entry.item.teamSide===side;});
  const automatic=["points","turnover","stops","kills"].indexOf(metric)>=0;
  let count=0,covered=0,points=0,scored=0,currentStops=0,kills=0;const numbers=[];
  entries.forEach(function(entry){
    const item=entry.item,matches=(item.playEvents||[]).filter(function(event){return event.type===metric&&(metric!=="customTag"||event.label===choice.label);});
    let present=matches.length>0;
    if(["paintTouch","transition","rightHandDrive"].indexOf(metric)>=0)present=item[metric]===true||present;
    if(metric==="offensiveRebound")present=Number(item.offensiveRebounds||0)>0;
    if(metric==="turnover")present=side==="offense"?item.turnover===true:item.forcedTurnover===true;
    if(metric==="points")present=true;
    if(metric==="stops"||metric==="kills")present=Number(item.points||0)===0;
    if(automatic||present||(metric!=="customTag"&&Array.isArray(item.trackedTags)&&item.trackedTags.indexOf(metric)>=0))covered++;
    if(Number(item.points||0)===0){currentStops++;if(currentStops%3===0)kills++;}else currentStops=0;
    if(present){
      count+=metric==="points"?Number(item.points||0):metric==="offensiveRebound"?Number(item.offensiveRebounds||0):metric==="deflection"?matches.length:1;
      points+=Number(item.points||0);if(Number(item.points||0)>0)scored++;numbers.push(entry.number);
    }
  });
  if(metric==="kills")count=kills;
  const scoreKey=choice.team==="us"?"our":"opponent",hasFinalPoints=metric==="points"&&finalScore&&typeof finalScore[scoreKey]==="number";
  if(hasFinalPoints)count=finalScore[scoreKey];
  const status=hasFinalPoints?"measured":!entries.length||!covered?"untracked":covered<entries.length?"partial":"measured";
  const catalog=scoutingComparisonMetrics_().find(function(item){return item.id===metric;}),label=metric==="customTag"?choice.label:(catalog||{}).label||metric,prefix=choice.team==="us"?"Our team":"Opponent";
  let text;
  if(hasFinalPoints)text=prefix+" final confirmed score: "+count+" points.";
  else if(status==="untracked")text="No "+label.toLowerCase()+" tracking evidence is available for "+prefix.toLowerCase()+". No result is inferred.";
  else text=prefix+" · "+count+" observed "+label.toLowerCase()+". "+(automatic?"Across "+entries.length+" recorded possessions.":"Tracking coverage "+covered+"/"+entries.length+" relevant possessions.")+(metric!=="points"?" Tagged/stopped possessions: "+points+" points, scored on "+scored+"/"+numbers.length+".":"")+(status==="partial"?" Partial evidence; untracked possessions are not assumed to be zero.":"");
  return{status:status,value:count,metric:metric,team:choice.team,label:label,covered:covered,total:entries.length,numbers:hasFinalPoints?[]:numbers,text:text};
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
function getLiveGameScoutingComparison(gameId,selectedReportId){
  requireStaffCapability_("run_sessions");const record=findLiveGameRecord_(gameId);requireLiveGameTeamAccess_(record.game.Team);if(String(record.game.Status||"")!=="Completed")throw new Error("Finish the game before opening the scouting comparison.");
  const report=getLiveGamePostgameReport(gameId),mode=parseLiveGameObject_(record.game["Tracker Mode"],{});
  report.analytics=buildLiveAnalyticsSummary_(getLiveAnalyticsPossessions_(gameId),Number(record.game["Current Period"]||1));
  let snapshot=null,sourceMode="pregame";
  if(selectedReportId){snapshot=captureGameScoutingReport_(selectedReportId,String(record.game.Team||""),String(record.game.Opponent||""));sourceMode="retrospective";}
  else if(mode.scoutingSnapshotId){snapshot=readGameReportSnapshot_(gameId,"scouting",mode.scoutingSnapshotId);if(snapshot&&(snapshot.reportId!==mode.scoutingReportId||snapshot.team!==String(record.game.Team||"")||snapshot.opponent.trim().toLowerCase()!==String(record.game.Opponent||"").trim().toLowerCase()))throw new Error("The saved scouting snapshot does not match this game.");}
  if(snapshot)report.scoutingComparison=buildGameScoutingComparison_(snapshot,report,sourceMode);
  else{const choices=getLiveGameScoutingChoices_();report.scoutingComparison={available:false,reason:mode.scoutingSnapshotId?"The original linked snapshot is unavailable. A retrospective comparison can use a report selected below.":"No scouting report was linked before this game. Select a saved report for a clearly labeled retrospective comparison.",choices:choices.filter(function(item){return item.status!=="Archived"&&item.team===String(record.game.Team||"")&&item.opponent.trim().toLowerCase()===String(record.game.Opponent||"").trim().toLowerCase();}).map(function(item){return{reportId:item.reportId,opponent:item.opponent,gameDate:item.gameDate,status:item.status};})};}
  return report;
}
function compactStoredPostgameReport_(report,gameId){
  if(JSON.stringify(report).length<=45000)return report;
  const snapshotId=writeGameReportSnapshot_(gameId,"postgame",report);
  return{checkpointType:"Postgame",headline:report.headline,game:report.game,gameId:gameId,gameDate:report.gameDate,team:report.team,opponent:report.opponent,achieved:report.achieved,scored:report.scored,objectives:report.objectives||[],recommendations:report.recommendations||[],finalScore:report.finalScore,gameResult:report.gameResult,completedAt:report.completedAt,analytics:{offense:(report.analytics||{}).offense||{},defense:(report.analytics||{}).defense||{}},snapshotId:snapshotId};
}
function getLiveGameScoutingChoices_(){
  const sheet=getCoachIQSpreadsheet_().getSheetByName(SCOUTING_REPORTS_SHEET);if(!sheet||sheet.getLastRow()<2)return[];const access=getCurrentStaffAccess_();
  return sheet.getRange(2,1,sheet.getLastRow()-1,6).getValues().filter(function(row){return String(row[5])!=="Archived"&&canAccessScoutingTeam_(String(row[1]),access);}).map(function(row){return{reportId:String(row[0]),team:String(row[1]),opponent:String(row[2]),gameDate:row[3] instanceof Date?Utilities.formatDate(row[3],Session.getScriptTimeZone(),"yyyy-MM-dd"):String(row[3]||""),status:String(row[5]||"Draft")};});
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
