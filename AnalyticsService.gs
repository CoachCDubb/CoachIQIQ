/**
 * Possession-level basketball analytics for the condensed two-operator tracker.
 * One row represents one completed possession; attributes and points stay joined.
 */
const LIVE_ANALYTICS_SHEET = "Live Analytics Possessions";
const LIVE_ANALYTICS_HEADERS = [
  "Possession ID", "Game ID", "Sequence", "Timestamp", "Period", "Team Side",
  "Points", "Transition", "Paint Touch", "Right-Hand Drive", "Turnover",
  "Forced Turnover", "Offensive Rebounds", "Recorded By", "Voided", "Source"
];

function initializeLiveAnalyticsSheet_() {
  return ensureLiveGameSheet_(LIVE_ANALYTICS_SHEET, LIVE_ANALYTICS_HEADERS);
}

function recordLiveAnalyticsPossession(gameId, payload) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const gameRecord = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(gameRecord.game.Team);
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
        possession.offensiveRebounds, Session.getActiveUser().getEmail() || "", false, "Live"]);
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
  return {
    possessionId:/^LAP-[A-Za-z0-9-]{8,80}$/.test(String(payload.possessionId || ""))
      ? String(payload.possessionId) : "LAP-" + Utilities.getUuid().slice(0, 18).toUpperCase(),
    teamSide:teamSide, points:points, period:period,
    transition:payload.transition === true, paintTouch:payload.paintTouch === true,
    rightHandDrive:teamSide === "defense" && payload.rightHandDrive === true,
    turnover:turnover, forcedTurnover:forcedTurnover, offensiveRebounds:offensiveRebounds
  };
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
      turnover:row[10] === true, forcedTurnover:row[11] === true, offensiveRebounds:Number(row[12] || 0)
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