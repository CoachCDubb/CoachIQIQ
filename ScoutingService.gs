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
  if(!objectives.length)throw new Error("Choose at least one scouting section to track.");
  initializeLiveGameSheets_();const cleaned=cleanLiveGameTrackingPlan_(objectives),name=("Scout: "+report.opponent).slice(0,60),sheet=SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_TEMPLATES_SHEET),rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,LIVE_GAME_TEMPLATE_HEADERS.length).getValues():[],index=rows.findIndex(function(row){return String(row[1]||"").toLowerCase()===name.toLowerCase()&&String(row[2]||"")===report.team;}),now=new Date();let templateId;
  if(index>=0){templateId=String(rows[index][0]);sheet.getRange(index+2,4).setValue(JSON.stringify(cleaned));sheet.getRange(index+2,7).setValue(now);}else{templateId="TPL-"+Utilities.getUuid().slice(0,10).toUpperCase();sheet.appendRow([templateId,safeLiveGameValue_(name),safeLiveGameValue_(report.team),JSON.stringify(cleaned),Session.getActiveUser().getEmail()||"",now,now]);}
  return{templateId:templateId,templateName:name,team:report.team,opponent:report.opponent,objectives:cleaned};
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
  return sections.map(function(section,index){const raw=section&&section.tracking||{},goal=["comparison","minimum","maximum","track"].indexOf(raw.goalType)>=0?raw.goalType:"track",subject=["our_team","opponent_team","both_teams"].indexOf(raw.subject)>=0?raw.subject:"our_team",unit=["count","points","percentage"].indexOf(raw.unit)>=0?raw.unit:"count";return {id:safeScoutingText_(section.id,60)||("section-"+index),title:safeScoutingText_(section.title,80)||"Untitled section",prompt:safeScoutingText_(section.prompt,180),content:safeScoutingText_(section.content,5000),tracking:{enabled:raw.enabled===true,label:safeScoutingText_(raw.label,60),goalType:goal,subject:goal==="comparison"?"both_teams":subject,target:Math.max(0,Math.min(9999,Number(raw.target)||0)),direction:raw.direction==="lower"?"lower":"higher",unit:unit}};});
}
function safeScoutingText_(value,maxLength) { return String(value == null ? "" : value).trim().slice(0,maxLength); }
function safeScoutingSheetValue_(value,maxLength) { const text=safeScoutingText_(value,maxLength); return /^[=+\-@]/.test(text)?"'"+text:text; }
function findScoutingReportRow_(sheet, reportId) { if (!reportId || sheet.getLastRow() < 2) return null; const rows=sheet.getRange(2,1,sheet.getLastRow()-1,SCOUTING_REPORT_HEADERS.length).getValues(); for(let i=0;i<rows.length;i++){if(String(rows[i][0])===reportId)return{rowNumber:i+2,values:rows[i]};} return null; }
function scoutingRowToObject_(row) { let sections=[];try{sections=JSON.parse(String(row[8]||"[]"));}catch(error){sections=[];} return {reportId:String(row[0]||""),team:String(row[1]||""),opponent:String(row[2]||""),gameDate:row[3] instanceof Date?Utilities.formatDate(row[3],Session.getScriptTimeZone(),"yyyy-MM-dd"):String(row[3]||""),location:String(row[4]||"Home"),status:String(row[5]||"Draft"),identity:String(row[6]||""),keysToVictory:String(row[7]||""),sections:cleanScoutingSections_(sections),createdBy:String(row[9]||""),createdAt:row[10] instanceof Date?row[10].toISOString():String(row[10]||""),updatedAt:row[11] instanceof Date?row[11].toISOString():String(row[11]||"")}; }
function canAccessScoutingTeam_(team,access){return !access.configured || access.role === "Head Coach" || !access.teams.length || access.teams.indexOf(String(team||"")) >= 0;}
function requireScoutingTeamAccess_(team){const access=getCurrentStaffAccess_();if(!canAccessScoutingTeam_(team,access))throw new Error("You do not have access to that team's scouting reports.");}
