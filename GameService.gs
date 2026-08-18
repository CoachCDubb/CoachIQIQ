/**
 * Live Game MVP: game setup, roster selection, and configurable stat packages.
 */
const LIVE_GAMES_SHEET = "Games";
const LIVE_GAME_EVENTS_SHEET = "Game Events";
const LIVE_GAME_CHECKPOINTS_SHEET = "Game Checkpoints";
const LIVE_GAME_TEMPLATES_SHEET = "Game Plan Templates";

const LIVE_GAME_HEADERS = [
  "Game ID", "Game Date", "Team", "Opponent", "Location", "Game Format",
  "Period Length", "Status", "Current Period", "Our Score", "Opponent Score",
  "Roster Player IDs", "Selected Stats", "Created By", "Created At", "Updated At",
  "Game Type", "Custom Stat Definitions", "Tracking Plan", "Final Report", "Completed At",
  "Active Tracking Plan", "Plan Adjustments", "Sport", "Guest Roster"
];

const LIVE_GAME_EVENT_HEADERS = [
  "Event ID", "Game ID", "Sequence", "Timestamp", "Period", "Game Clock",
  "Team", "Player ID", "Event Type", "Event Value", "Created By", "Voided", "Synced At"
];

const LIVE_GAME_CHECKPOINT_HEADERS = [
  "Checkpoint ID", "Game ID", "Checkpoint Type", "Period", "Game Clock",
  "Created At", "Snapshot", "Recommendations"
];

const LIVE_GAME_TEMPLATE_HEADERS = [
  "Template ID", "Template Name", "Team", "Objectives", "Created By", "Created At", "Updated At"
];

function getBasketballLiveStatCatalog_() {
  return [
    {id:"two_point_shooting", label:"2-Point Shooting", group:"Scoring", description:"Makes and misses inside the arc.", selected:true},
    {id:"three_point_shooting", label:"3-Point Shooting", group:"Scoring", description:"Makes and misses from three.", selected:true},
    {id:"free_throws", label:"Free Throws", group:"Scoring", description:"Free-throw makes and misses.", selected:true},
    {id:"rebounds", label:"Rebounds", group:"Possessions", description:"Offensive and defensive rebounds.", selected:true},
    {id:"turnovers", label:"Turnovers", group:"Possessions", description:"Player and team turnovers.", selected:true},
    {id:"assists", label:"Assists", group:"Playmaking", description:"Passes that directly create scores.", selected:true},
    {id:"steals", label:"Steals", group:"Defense", description:"Possessions won with a steal.", selected:true},
    {id:"blocks", label:"Blocks", group:"Defense", description:"Blocked field-goal attempts.", selected:true},
    {id:"fouls", label:"Fouls", group:"Discipline", description:"Player and team fouls.", selected:true},
    {id:"paint_touches", label:"Paint Touches", group:"Advanced", description:"Offensive touches inside the paint.", selected:false},
    {id:"deflections", label:"Deflections", group:"Advanced", description:"Disrupted passes and dribbles.", selected:false},
    {id:"charges", label:"Charges Taken", group:"Advanced", description:"Offensive fouls drawn.", selected:false},
    {id:"fast_break_points", label:"Fast-Break Points", group:"Advanced", description:"Points scored in transition.", selected:false}
  ];
}

function getLiveGameSportPreset_(sport){
  const key=String(sport||"Basketball").toLowerCase();
  const objective=function(id,label,goalType,subject,target,direction,unit){return{id:"objective_"+id,label:label,categoryKey:id,goalType:goalType,subject:subject,target:target,direction:direction||"higher",unit:unit||"count",playerId:"",playerLabel:"",active:true};};
  const presets={
    basketball:{formats:[{name:"Quarters",periodLength:8},{name:"Halves",periodLength:20}],objectives:[objective("transition_points","Transition Points","comparison","both_teams",1,"higher","points"),objective("field_goal_percentage","Field Goal Percentage","minimum","our_team",45,"higher","percentage"),objective("offensive_rebounds","Offensive Rebounds","minimum","our_team",10),objective("turnovers","Turnovers","maximum","our_team",12,"lower"),objective("paint_touches","Paint Touches","minimum","our_team",20)]},
    football:{formats:[{name:"Quarters",periodLength:12},{name:"Halves",periodLength:24}],objectives:[objective("explosive_plays","Explosive Plays","minimum","our_team",5),objective("completion_percentage","Completion Percentage","minimum","our_team",60,"higher","percentage"),objective("turnovers","Turnovers","maximum","our_team",1,"lower"),objective("third_down_conversions","Third Down Conversions","minimum","our_team",5),objective("penalties","Penalties","maximum","our_team",5,"lower")]},
    baseball:{formats:[{name:"7 Innings",periodLength:7},{name:"9 Innings",periodLength:9}],objectives:[objective("quality_at_bats","Quality At-Bats","minimum","our_team",12),objective("free_bases","Free Bases Allowed","maximum","our_team",3,"lower"),objective("errors","Errors","maximum","our_team",1,"lower"),objective("strikeouts","Pitcher Strikeouts","minimum","our_team",6)]},
    soccer:{formats:[{name:"Halves",periodLength:40},{name:"Quarters",periodLength:20}],objectives:[objective("shots_on_goal","Shots on Goal","comparison","both_teams",1),objective("possession_wins","Possession Wins","minimum","our_team",20),objective("set_pieces","Dangerous Set Pieces","minimum","our_team",5),objective("goals","Goals","comparison","both_teams",1,"higher","points")]},
    volleyball:{formats:[{name:"Best of 5 Sets",periodLength:25},{name:"Best of 3 Sets",periodLength:25}],objectives:[objective("serve_in_percentage","Serve-In Percentage","minimum","our_team",90,"higher","percentage"),objective("serve_aces","Serve Aces","minimum","our_team",5),objective("serve_errors","Serve Errors","maximum","our_team",5,"lower"),objective("blocks","Blocks","minimum","our_team",5),objective("first_ball_kills","First-Ball Kills","minimum","our_team",8)]},
    other:{formats:[{name:"Periods",periodLength:10},{name:"Halves",periodLength:20}],objectives:[objective("scoring_opportunities","Scoring Opportunities","minimum","our_team",10),objective("turnovers","Turnovers","maximum","our_team",5,"lower"),objective("effort_plays","Effort Plays","minimum","our_team",10)]}
  };
  return presets[key]||presets.other;
}

function getLiveGameSportPresets_(){
  const presets={};
  ["Basketball","Football","Baseball","Soccer","Volleyball","Other"].forEach(function(sport){
    presets[sport]=getLiveGameSportPreset_(sport);
  });
  return presets;
}

function getLiveGameSetupData() {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const settings = getCoachIQSettings();
  const sportPreset=getLiveGameSportPreset_(settings.sport);
  const players = filterPlayersForCurrentStaff_(getPlayers())
    .filter(function(player) { return String(player[7] || "") !== "Archived"; })
    .map(function(player) {
      return {
        id: String(player[0] || ""),
        firstName: String(player[1] || ""),
        lastName: String(player[2] || ""),
        jersey: String(player[3] || ""),
        team: String(player[5] || ""),
        position: String(player[6] || ""),
        status: String(player[7] || "")
      };
    });

  return {
    sport: settings.sport || "Basketball",
    teams: settings.teams || [],
    players: players,
    stats: getBasketballLiveStatCatalog_(),
    recentGames: getRecentLiveGames_(),
    completedGames: getCompletedLiveGames_(),
    gamePlanTemplates: getLiveGamePlanTemplates_(),
    lastGamePlans: getLastLiveGamePlans_(),
    sportPresets:getLiveGameSportPresets_(),
    sportFormats:sportPreset.formats,
    sportObjectives:sportPreset.objectives,
    defaults: {gameType:"Official Game", format:sportPreset.formats[0].name, periodLength:sportPreset.formats[0].periodLength, location:"Home"}
  };
}

function createLiveGameSetup(data) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  data = data || {};

  const settings = getCoachIQSettings();
  const team = String(data.team || "").trim();
  const gameType = ["Official Game", "Practice Scrimmage"].indexOf(data.gameType) >= 0
    ? data.gameType : "Official Game";
  const opponent = String(data.opponent || "").trim() ||
    (gameType === "Practice Scrimmage" ? "Intrasquad" : "");
  const gameDate = String(data.gameDate || "").trim();
  const location = ["Home", "Away", "Neutral"].indexOf(data.location) >= 0 ? data.location : "Home";
  const sportPresets=getLiveGameSportPresets_();
  const requestedSport=String(data.sport||"");
  const configuredSport=String(settings.sport||"Basketball");
  const sport=Object.prototype.hasOwnProperty.call(sportPresets,requestedSport)?requestedSport:
    (Object.prototype.hasOwnProperty.call(sportPresets,configuredSport)?configuredSport:"Other");
  const sportPreset=getLiveGameSportPreset_(sport);
  const allowedFormats=sportPreset.formats.map(function(item){return item.name;});
  const format = allowedFormats.indexOf(data.format) >= 0 ? data.format : sportPreset.formats[0].name;
  const periodLength = Number(data.periodLength);
  const rosterIds = Array.isArray(data.playerIds) ? data.playerIds.map(String) : [];
  const guestPlayers = cleanLiveGameGuestPlayers_(data.guestPlayers);
  const allRosterIds = rosterIds.concat(guestPlayers.map(function(player){return player.id;}));
  const selectedStats = Array.isArray(data.selectedStats) ? data.selectedStats.map(String) : [];
  const customStats = cleanLiveGameCustomStats_(data.customStats);
  const trackingPlan = cleanLiveGameTrackingPlan_(data.trackingObjectives);

  if (!gameDate) throw new Error("Choose a game date.");
  if (!team || (settings.teams || []).indexOf(team) === -1) throw new Error("Choose a valid CoachIQ team.");
  if (!opponent) throw new Error("Enter the opponent.");
  if (!Number.isInteger(periodLength) || periodLength < 1 || periodLength > 60) throw new Error("Period length must be between 1 and 60 minutes.");
  if (!allRosterIds.length) throw new Error("Select or manually add at least one available player.");
  if (!trackingPlan.length && !selectedStats.length) throw new Error("Add at least one game-plan objective.");
  trackingPlan.forEach(function(objective) {
    if (objective.subject === "our_player" && allRosterIds.indexOf(objective.playerId) < 0) {
      throw new Error(objective.playerLabel + " must be included on the available roster.");
    }
  });

  const catalogIds = getBasketballLiveStatCatalog_().map(function(stat) { return stat.id; })
    .concat(customStats.map(function(stat) { return stat.id; }));
  if (selectedStats.some(function(stat) { return catalogIds.indexOf(stat) === -1; })) {
    throw new Error("The selected stat package contains an unsupported statistic.");
  }

  const allowedPlayers = filterPlayersForCurrentStaff_(getPlayers()).filter(function(player) {
    return String(player[5] || "") === team && String(player[7] || "") !== "Archived";
  });
  const allowedIds = allowedPlayers.map(function(player) { return String(player[0] || ""); });
  if (rosterIds.some(function(playerId) { return allowedIds.indexOf(playerId) === -1; })) {
    throw new Error("The game roster contains a player outside your team or position access.");
  }

  const now = new Date();
  const gameId = "GAME-" + Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyyMMdd-HHmmss") +
    "-" + Utilities.getUuid().slice(0, 6).toUpperCase();
  const userEmail = Session.getActiveUser().getEmail() || "";
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.appendRow([
      gameId, safeLiveGameValue_(gameDate), safeLiveGameValue_(team), safeLiveGameValue_(opponent),
      location, format, periodLength, "Setup", 1, 0, 0,
      JSON.stringify(allRosterIds), JSON.stringify(selectedStats), userEmail, now, now,
      gameType, JSON.stringify(customStats), JSON.stringify(trackingPlan), "", "",
      JSON.stringify(trackingPlan), JSON.stringify([]), sport, JSON.stringify(guestPlayers)
    ]);
  } finally {
    lock.releaseLock();
  }

  try {
    logCoachIQAudit({
      action:"CREATE_LIVE_GAME",
      entityType:"Game",
      entityId:gameId,
      team:team,
      beforeValue:"Game did not exist",
      afterValue:{gameDate:gameDate, gameType:gameType, opponent:opponent, location:location, sport:sport, format:format,
        periodLength:periodLength, rosterSize:allRosterIds.length, guestRosterSize:guestPlayers.length, selectedStats:selectedStats,
        customStats:customStats, trackingObjectives:trackingPlan},
      success:true,
      error:""
    });
  } catch (auditError) {
    console.error("Live game created, but audit logging failed: " + auditError.message);
  }

  return {gameId:gameId, status:"Setup", gameType:gameType, sport:sport, opponent:opponent, message:"Game setup saved."};
}

function initializeLiveGameSheets_() {
  ensureLiveGameSheet_(LIVE_GAMES_SHEET, LIVE_GAME_HEADERS);
  ensureLiveGameSheet_(LIVE_GAME_EVENTS_SHEET, LIVE_GAME_EVENT_HEADERS);
  ensureLiveGameSheet_(LIVE_GAME_CHECKPOINTS_SHEET, LIVE_GAME_CHECKPOINT_HEADERS);
  ensureLiveGameSheet_(LIVE_GAME_TEMPLATES_SHEET, LIVE_GAME_TEMPLATE_HEADERS);
}

function cleanLiveGameGuestPlayers_(players){
  if(!Array.isArray(players)){return[];}
  if(players.length>20){throw new Error("A Live Game can include up to 20 manually added players.");}
  const seen={};
  return players.map(function(player,index){
    const name=String((player||{}).name||"").trim().slice(0,80);
    const jersey=String((player||{}).jersey||"").trim().slice(0,12);
    let id=String((player||{}).id||"").trim();
    if(!/^GUEST-[A-Z0-9-]{4,40}$/i.test(id)){id="GUEST-"+(index+1)+"-"+Utilities.getUuid().slice(0,8).toUpperCase();}
    if(!name){throw new Error("Every manually added player needs a name.");}
    if(seen[id]){throw new Error("A manually added player appears more than once.");}
    seen[id]=true;
    return{id:id,name:safeLiveGameValue_(name),jersey:safeLiveGameValue_(jersey)};
  });
}

function ensureLiveGameSheet_(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActive();
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    return sheet;
  }
  const actual = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  headers.forEach(function(header, index) {
    const currentHeader = String(actual[index] || "").trim();
    if (!currentHeader) {
      sheet.getRange(1, index + 1).setValue(header).setFontWeight("bold");
    } else if (currentHeader !== header) {
      throw new Error(sheetName + " column " + (index + 1) + " must be '" + header + "'.");
    }
  });
  return sheet;
}

function cleanLiveGameCustomStats_(stats) {
  if (!Array.isArray(stats)) return [];
  if (stats.length > 12) throw new Error("A game can include up to 12 custom tracking categories.");
  const seenIds = {};
  const seenLabels = {};
  return stats.map(function(stat) {
    const id = String((stat || {}).id || "").trim().toLowerCase();
    const label = String((stat || {}).label || "").trim();
    if (!/^custom_[a-z0-9_]{1,70}$/.test(id)) throw new Error("A custom tracking category has an invalid ID.");
    if (!label || label.length > 40) throw new Error("Custom tracking categories need a name of 40 characters or fewer.");
    const labelKey = label.toLowerCase();
    if (seenIds[id] || seenLabels[labelKey]) throw new Error("Custom tracking category names must be unique.");
    seenIds[id] = true;
    seenLabels[labelKey] = true;
    return {id:id, label:label, group:"Custom", description:"Custom game stat"};
  });
}

function cleanLiveGameTrackingPlan_(objectives) {
  if (!Array.isArray(objectives)) return [];
  if (objectives.length > 12) throw new Error("A game plan can include up to 12 objectives.");
  const validSubjects = ["our_team", "opponent_team", "our_player", "opponent_player", "both_teams"];
  const validGoals = ["track", "minimum", "maximum", "comparison"];
  const validUnits = ["count", "points", "percentage"];
  const seen = {};
  return objectives.map(function(objective, index) {
    objective = objective || {};
    const id = String(objective.id || "objective_" + (index + 1)).trim().toLowerCase();
    const label = String(objective.label || "").trim();
    const subject = validSubjects.indexOf(objective.subject) >= 0 ? objective.subject : "our_team";
    const goalType = validGoals.indexOf(objective.goalType) >= 0 ? objective.goalType : "track";
    const unit = validUnits.indexOf(objective.unit) >= 0 ? objective.unit : "count";
    const direction = objective.direction === "lower" ? "lower" : "higher";
    const target = Number(objective.target || 0);
    const playerId = String(objective.playerId || "").trim();
    const playerLabel = String(objective.playerLabel || "").trim();
    if (!/^objective_[a-z0-9_]{1,75}$/.test(id) || seen[id]) throw new Error("Every objective needs a unique valid ID.");
    if (!label || label.length > 60) throw new Error("Every objective needs a name of 60 characters or fewer.");
    if (["minimum", "maximum", "comparison"].indexOf(goalType) >= 0 && (!Number.isFinite(target) || target < 0 || target > 9999)) {
      throw new Error(label + " needs a valid target.");
    }
    if(unit === "percentage" && target > 100){throw new Error(label + " percentage target cannot exceed 100.");}
    if ((subject === "our_player" || subject === "opponent_player") && !playerId && !playerLabel) {
      throw new Error(label + " needs a player.");
    }
    seen[id] = true;
    const inferredCategory = (subject === "our_player" || subject === "opponent_player") && normalizeLiveGameCategoryKey_(label) === "points"
      ? "featured_player_points" : label;
    return {id:id, label:label, categoryKey:normalizeLiveGameCategoryKey_(objective.categoryKey || inferredCategory),
      subject:goalType === "comparison" ? "both_teams" : subject,
      goalType:goalType, unit:unit, target:target, direction:direction,
      playerId:playerId, playerLabel:playerLabel, active:objective.active !== false,
      order:Number.isInteger(Number(objective.order)) ? Number(objective.order) : index,
      addedDuringGame:objective.addedDuringGame === true};
  });
}

function normalizeLiveGameCategoryKey_(value) {
  const text = String(value || "").trim().toLowerCase();
  const compact = text.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const aliases = {
    to:"turnovers", tos:"turnovers", turnover:"turnovers", turnovers:"turnovers",
    team_turnovers:"turnovers", turnover_battle:"turnovers",
    oreb:"offensive_rebounds", orebs:"offensive_rebounds", offensive_rebound:"offensive_rebounds",
    offensive_rebounds:"offensive_rebounds", offensive_rebound_battle:"offensive_rebounds",
    transition:"transition_points", transition_points:"transition_points", fast_break_points:"transition_points",
    fastbreak_points:"transition_points", paint_touch:"paint_touches", paint_touches:"paint_touches",
    deflection:"deflections", deflections:"deflections", foul:"fouls", fouls:"fouls",
    point:"points", points:"points", featured_player_points:"featured_player_points"
  };
  return aliases[compact] || compact || "custom_objective";
}

function getLiveGamePlanTemplates_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_TEMPLATES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const access = getCurrentStaffAccess_();
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, LIVE_GAME_TEMPLATE_HEADERS.length).getValues()
    .map(function(row) { return {templateId:String(row[0] || ""), name:String(row[1] || ""), team:String(row[2] || ""), objectives:parseLiveGameJson_(row[3], [])}; })
    .filter(function(template) { return !access.configured || access.role === "Head Coach" || !access.teams.length || access.teams.indexOf(template.team) >= 0; });
}

function getLastLiveGamePlans_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return {};
  const values = sheet.getDataRange().getValues(); const headers = values.shift(); const cols = liveGameHeaderMap_(headers);
  const access = getCurrentStaffAccess_(); const plans = {};
  values.forEach(function(row) {
    const team = String(row[cols.Team] || ""); const plan = parseLiveGameJson_(row[cols["Tracking Plan"]], []);
    if (!team || !plan.length) return;
    if (access.configured && access.role !== "Head Coach" && access.teams.length && access.teams.indexOf(team) < 0) return;
    plans[team] = {gameId:String(row[cols["Game ID"]] || ""), opponent:String(row[cols.Opponent] || ""),
      gameDate:formatLiveGameDate_(row[cols["Game Date"]]), objectives:plan};
  });
  return plans;
}

function saveLiveGamePlanTemplate(data) {
  requireStaffCapability_("run_sessions"); initializeLiveGameSheets_(); data = data || {};
  const name = String(data.name || "").trim(); const team = String(data.team || "").trim();
  if (!name || name.length > 60) throw new Error("Enter a template name of 60 characters or fewer.");
  if (!team) throw new Error("Choose a team for this template.");
  requireLiveGameTeamAccess_(team);
  const objectives = cleanLiveGameTrackingPlan_(data.objectives);
  if (!objectives.length) throw new Error("Add at least one objective before saving a template.");
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_TEMPLATES_SHEET);
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, LIVE_GAME_TEMPLATE_HEADERS.length).getValues() : [];
  const duplicate = rows.some(function(row) { return String(row[1] || "").toLowerCase() === name.toLowerCase() && String(row[2] || "") === team; });
  if (duplicate) throw new Error("That team already has a template with this name.");
  const templateId = "TPL-" + Utilities.getUuid().slice(0, 10).toUpperCase(); const now = new Date();
  sheet.appendRow([templateId, safeLiveGameValue_(name), safeLiveGameValue_(team), JSON.stringify(objectives),
    Session.getActiveUser().getEmail() || "", now, now]);
  try { logCoachIQAudit({action:"CREATE_GAME_PLAN_TEMPLATE", entityType:"GamePlanTemplate", entityId:templateId,
    team:team, beforeValue:"Template did not exist", afterValue:{name:name,objectives:objectives}, success:true, error:""}); }
  catch (auditError) { console.error("Template saved, but audit logging failed: " + auditError.message); }
  return {templateId:templateId, name:name, team:team, objectives:objectives};
}

function deleteLiveGamePlanTemplate(templateId) {
  requireStaffCapability_("run_sessions"); initializeLiveGameSheets_();
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_TEMPLATES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) throw new Error("The template was not found.");
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, LIVE_GAME_TEMPLATE_HEADERS.length).getValues();
  const index = rows.findIndex(function(row) { return String(row[0] || "") === String(templateId); });
  if (index < 0) throw new Error("The template was not found.");
  requireLiveGameTeamAccess_(String(rows[index][2] || "")); sheet.deleteRow(index + 2);
  return {success:true};
}

function getRecentLiveGames_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const cols = liveGameHeaderMap_(headers);
  const access = getCurrentStaffAccess_();
  return values.map(function(row) {
    return {
      gameId:String(row[cols["Game ID"]] || ""),
      gameDate:formatLiveGameDate_(row[cols["Game Date"]]),
      team:String(row[cols.Team] || ""),
      opponent:String(row[cols.Opponent] || ""),
      status:String(row[cols.Status] || "Setup"),
      gameType:String(row[cols["Game Type"]] || "Official Game"),
      hasTrackingPlan:parseLiveGameJson_(row[cols["Tracking Plan"]], []).length > 0
    };
  }).filter(function(game) {
    if (["Setup", "Live"].indexOf(game.status) === -1 || !game.hasTrackingPlan) return false;
    return !access.configured || access.role === "Head Coach" ||
      access.capabilities.indexOf("manage_settings") >= 0 || !access.teams.length ||
      access.teams.indexOf(game.team) >= 0;
  }).slice(-8).reverse();
}

function getCompletedLiveGames_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const cols = liveGameHeaderMap_(headers);
  const access = getCurrentStaffAccess_();
  return values.map(function(row) {
    return {gameId:String(row[cols["Game ID"]] || ""), gameDate:formatLiveGameDate_(row[cols["Game Date"]]),
      team:String(row[cols.Team] || ""), opponent:String(row[cols.Opponent] || ""),
      gameType:String(row[cols["Game Type"]] || "Official Game"), status:String(row[cols.Status] || ""),
      report:parseLiveGameObject_(row[cols["Final Report"]], null)};
  }).filter(function(game) {
    if (game.status !== "Completed" || !game.report) return false;
    return !access.configured || access.role === "Head Coach" ||
      access.capabilities.indexOf("manage_settings") >= 0 || !access.teams.length || access.teams.indexOf(game.team) >= 0;
  }).slice(-12).reverse().map(function(game) {
    return {gameId:game.gameId, gameDate:game.gameDate, team:game.team, opponent:game.opponent,
      gameType:game.gameType, achieved:Number(game.report.achieved || 0), scored:Number(game.report.scored || 0)};
  });
}

function startLiveGame(gameId) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const gameRecord = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(gameRecord.game.Team);
  const sheet = gameRecord.sheet;
  if (String(gameRecord.game.Status || "") === "Setup") {
    sheet.getRange(gameRecord.rowNumber, gameRecord.cols.Status + 1).setValue("Live");
    sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Updated At"] + 1).setValue(new Date());
    try {
      logCoachIQAudit({action:"START_LIVE_GAME", entityType:"Game", entityId:String(gameId),
        team:String(gameRecord.game.Team || ""), beforeValue:"Setup", afterValue:"Live", success:true, error:""});
    } catch (auditError) {
      console.error("Live game started, but audit logging failed: " + auditError.message);
    }
  }
  return getLiveGameTracker(gameId);
}

function getLiveGameTracker(gameId) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const gameRecord = findLiveGameRecord_(gameId);
  const game = gameRecord.game;
  requireLiveGameTeamAccess_(game.Team);
  const rosterIds = parseLiveGameJson_(game["Roster Player IDs"], []);
  const guestPlayers = parseLiveGameJson_(game["Guest Roster"], []);
  const selectedStats = parseLiveGameJson_(game["Selected Stats"], []);
  const customStats = parseLiveGameJson_(game["Custom Stat Definitions"], []);
  const originalObjectives = parseLiveGameJson_(game["Tracking Plan"], []);
  const objectives = parseLiveGameJson_(game["Active Tracking Plan"], originalObjectives);
  const permittedPlayers = filterPlayersForCurrentStaff_(getPlayers());
  const players = permittedPlayers.filter(function(player) {
    return rosterIds.indexOf(String(player[0] || "")) >= 0;
  }).map(function(player) {
    return {id:String(player[0] || ""), firstName:String(player[1] || ""), lastName:String(player[2] || ""),
      jersey:String(player[3] || ""), position:String(player[6] || "")};
  }).concat(guestPlayers.map(function(player){
    const names=String(player.name||"").trim().split(/\s+/);
    return{id:String(player.id||""),firstName:names.shift()||"",lastName:names.join(" "),jersey:String(player.jersey||""),position:"Game-only player",guest:true};
  }));
  const events = getLiveGameEvents_(gameId);
  if (objectives.length) {
    return {
      game:{gameId:String(game["Game ID"] || ""), gameDate:formatLiveGameDate_(game["Game Date"]),
        team:String(game.Team || ""), opponent:String(game.Opponent || ""), location:String(game.Location || ""),
        format:String(game["Game Format"] || "Quarters"), periodLength:Number(game["Period Length"] || 8),
        status:String(game.Status || "Setup"), currentPeriod:Number(game["Current Period"] || 1),
        gameType:String(game["Game Type"] || "Official Game")},
      players:players,
      objectives:objectives.sort(function(a, b) { return Number(a.order || 0) - Number(b.order || 0); }),
      originalObjectives:originalObjectives,
      planAdjustments:parseLiveGameJson_(game["Plan Adjustments"], []),
      objectiveTotals:calculateLiveGameObjectiveTotals_(events, objectives),
      events:events.slice(-30).reverse()
    };
  }
  const totals = calculateLiveGameScore_(events);
  return {
    game:{gameId:String(game["Game ID"] || ""), gameDate:formatLiveGameDate_(game["Game Date"]),
      team:String(game.Team || ""), opponent:String(game.Opponent || ""), location:String(game.Location || ""),
      format:String(game["Game Format"] || "Quarters"), periodLength:Number(game["Period Length"] || 8),
      status:String(game.Status || "Setup"), currentPeriod:Number(game["Current Period"] || 1),
      gameType:String(game["Game Type"] || "Official Game")},
    players:players,
    selectedStats:selectedStats,
    customStats:customStats,
    actions:buildLiveGameActions_(selectedStats, customStats),
    events:events.slice(-30).reverse(),
    ourScore:totals.ourScore,
    opponentScore:totals.opponentScore
  };
}

function recordLiveGameObjectiveEvent(gameId, event) {
  return recordLiveGameObjectiveEvents(gameId, [event]);
}

function recordLiveGameObjectiveEvents(gameId, events) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  if (!Array.isArray(events) || !events.length || events.length > 50) throw new Error("Send between 1 and 50 objective taps.");
  const gameRecord = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(gameRecord.game.Team);
  if (String(gameRecord.game.Status || "") === "Completed") {
    throw new Error("A completed game cannot accept more events.");
  }
  const objectives = parseLiveGameJson_(gameRecord.game["Active Tracking Plan"], parseLiveGameJson_(gameRecord.game["Tracking Plan"], []));
  const eventSheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_EVENTS_SHEET);
  const userEmail = Session.getActiveUser().getEmail() || "";
  const normalizedEvents = events.map(function(rawEvent) {
    const event = rawEvent || {};
    const objective = objectives.find(function(item) { return item.id === String(event.objectiveId || ""); });
    if (!objective || objective.active === false) throw new Error("That game-plan objective is not currently active.");
    const delta = Number(event.delta);
    const permittedDeltas = objective.unit === "points" ? [-3, -2, -1, 1, 2, 3] : [-1, 1];
    if (permittedDeltas.indexOf(delta) < 0) throw new Error("Choose a valid adjustment.");
    let side = String(event.side || "");
    if (objective.subject === "both_teams") {
      if (["Us", "Opponent"].indexOf(side) < 0) throw new Error("Choose which team recorded the result.");
    } else {
      side = objective.subject.indexOf("opponent_") === 0 ? "Opponent" : "Us";
    }
    if(objective.unit === "percentage"){
      const component=String(event.component||"");
      if(["made","attempt"].indexOf(component)<0) throw new Error("Choose success or miss for a percentage objective.");
      side += component === "made" ? " Made" : " Attempt";
    }
    const period = Number(event.period);
    if (!Number.isInteger(period) || period < 1 || period > 20) throw new Error("Choose a valid period.");
    if (objective.subject === "our_player") requirePlayerAccess_(objective.playerId);
    return {eventId:String(event.eventId || "") || "GEVT-" + Utilities.getUuid().slice(0, 12).toUpperCase(),
      period:period, side:side, playerId:objective.playerId || "", objectiveId:objective.id, delta:delta};
  });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const rows = eventSheet.getLastRow() > 1
      ? eventSheet.getRange(2, 1, eventSheet.getLastRow() - 1, LIVE_GAME_EVENT_HEADERS.length).getValues() : [];
    const knownIds = {};
    rows.forEach(function(row) { knownIds[String(row[0] || "")] = true; });
    let sequence = rows.filter(function(row) { return String(row[1] || "") === String(gameId); }).length;
    let latestPeriod = Number(gameRecord.game["Current Period"] || 1);
    const newRows = normalizedEvents.map(function(event) {
      if (knownIds[event.eventId]) return null;
      knownIds[event.eventId] = true;
      sequence++;
      latestPeriod = event.period;
      const now = new Date();
      return [event.eventId, String(gameId), sequence, now, event.period, "", event.side, event.playerId,
        event.objectiveId, event.delta, userEmail, false, now];
    }).filter(function(row) { return row; });
    if (newRows.length) {
      eventSheet.getRange(eventSheet.getLastRow() + 1, 1, newRows.length, LIVE_GAME_EVENT_HEADERS.length).setValues(newRows);
      updateLiveGameObjectiveState_(gameRecord, latestPeriod);
    }
  } finally {
    lock.releaseLock();
  }
  return getLiveGameTracker(gameId);
}

function calculateLiveGameObjectiveTotals_(events, objectives) {
  const totals = {};
  const objectiveMap={};
  (objectives || []).forEach(function(objective) { totals[objective.id] = {our:0, opponent:0, ourMade:0, ourAttempts:0, opponentMade:0, opponentAttempts:0}; objectiveMap[objective.id]=objective; });
  (events || []).forEach(function(event) {
    if (!totals[event.eventType]) return;
    const total=totals[event.eventType],objective=objectiveMap[event.eventType],opponent=String(event.side||"").indexOf("Opponent")===0;
    if(objective&&objective.unit==="percentage"){
      const madeKey=opponent?"opponentMade":"ourMade",attemptKey=opponent?"opponentAttempts":"ourAttempts";
      if(String(event.side||"").indexOf(" Made")>0){total[madeKey]=Math.max(0,total[madeKey]+Number(event.value||0));total[attemptKey]=Math.max(total[madeKey],total[attemptKey]+Number(event.value||0));}
      else{total[attemptKey]=Math.max(total[madeKey],total[attemptKey]+Number(event.value||0));}
      total[opponent?"opponent":"our"]=total[attemptKey]?Math.round(total[madeKey]/total[attemptKey]*1000)/10:0;
    }else{
      const key = opponent ? "opponent" : "our";
      total[key] = Math.max(0, total[key] + Number(event.value || 0));
    }
  });
  return totals;
}

function updateLiveGameObjectiveState_(gameRecord, period) {
  const sheet = gameRecord.sheet;
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols.Status + 1).setValue("Live");
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Current Period"] + 1).setValue(period);
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Updated At"] + 1).setValue(new Date());
}

function recordLiveGameEvent(gameId, event) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  event = event || {};
  const gameRecord = findLiveGameRecord_(gameId);
  const game = gameRecord.game;
  requireLiveGameTeamAccess_(game.Team);
  if (String(game.Status || "") === "Completed") {
    throw new Error("A completed game cannot accept more events.");
  }
  const selectedStats = parseLiveGameJson_(game["Selected Stats"], []);
  const customStats = parseLiveGameJson_(game["Custom Stat Definitions"], []);
  const actions = buildLiveGameActions_(selectedStats, customStats);
  const allowedActions = {};
  actions.forEach(function(action) { allowedActions[action.id] = action; });
  [1, 2, 3].forEach(function(points) {
    allowedActions["opponent_" + points] = {id:"opponent_" + points, label:"Opponent +" + points,
      points:points, side:"Opponent", requiresPlayer:false};
  });

  const eventType = String(event.eventType || "");
  const action = allowedActions[eventType];
  if (!action) throw new Error("That statistic is not enabled for this game.");
  const period = Number(event.period);
  if (!Number.isInteger(period) || period < 1 || period > 20) throw new Error("Choose a valid period.");
  const gameClock = String(event.gameClock || "").trim();
  if (gameClock && !/^\d{1,2}:\d{2}$/.test(gameClock)) throw new Error("Use MM:SS for the game clock.");
  const playerId = String(event.playerId || "");
  const rosterIds = parseLiveGameJson_(game["Roster Player IDs"], []);
  const guestPlayerIds = parseLiveGameJson_(game["Guest Roster"], []).map(function(player){return String(player.id||"");});
  const permittedPlayerIds = filterPlayersForCurrentStaff_(getPlayers()).map(function(player) { return String(player[0] || ""); }).concat(guestPlayerIds);
  if (action.requiresPlayer && (rosterIds.indexOf(playerId) === -1 || permittedPlayerIds.indexOf(playerId) === -1)) {
    throw new Error("Select a player within your assigned roster scope.");
  }

  const eventSheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_EVENTS_SHEET);
  const requestedId = String(event.eventId || "");
  const eventId = requestedId || "GEVT-" + Utilities.getUuid().slice(0, 12).toUpperCase();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const existing = eventSheet.getLastRow() > 1
      ? eventSheet.getRange(2, 1, eventSheet.getLastRow() - 1, LIVE_GAME_EVENT_HEADERS.length).getValues() : [];
    const duplicate = existing.some(function(row) { return String(row[0] || "") === eventId; });
    if (!duplicate) {
      const sequence = existing.filter(function(row) { return String(row[1] || "") === String(gameId); }).length + 1;
      const now = new Date();
      eventSheet.appendRow([eventId, String(gameId), sequence, now, period, safeLiveGameValue_(gameClock),
        action.side || "Us", playerId, eventType, Number(action.points || 0),
        Session.getActiveUser().getEmail() || "", false, now]);
      updateLiveGameStateFromEvents_(gameRecord, period);
    }
  } finally {
    lock.releaseLock();
  }
  return getLiveGameTracker(gameId);
}

function voidLiveGameEvent(gameId, eventId) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const gameRecord = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(gameRecord.game.Team);
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_EVENTS_SHEET);
  if (sheet.getLastRow() < 2) throw new Error("No game events were found.");
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, LIVE_GAME_EVENT_HEADERS.length).getValues();
  const rowIndex = values.findIndex(function(row) {
    return String(row[0] || "") === String(eventId) && String(row[1] || "") === String(gameId);
  });
  if (rowIndex < 0) throw new Error("The event was not found.");
  sheet.getRange(rowIndex + 2, 12).setValue(true);
  if (parseLiveGameJson_(gameRecord.game["Tracking Plan"], []).length) {
    updateLiveGameObjectiveState_(gameRecord, Number(gameRecord.game["Current Period"] || 1));
  } else {
    updateLiveGameStateFromEvents_(gameRecord, Number(gameRecord.game["Current Period"] || 1));
  }
  return getLiveGameTracker(gameId);
}

function createLiveGameCheckpoint(gameId, checkpointType) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  if (["Timeout", "End Quarter"].indexOf(checkpointType) < 0) throw new Error("Choose a valid game checkpoint.");
  const tracker = getLiveGameTracker(gameId);
  if (!tracker.objectives || !tracker.objectives.length) throw new Error("This game does not have a tracking plan.");
  const report = buildLiveGameCheckpointReport_(tracker, checkpointType);
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_CHECKPOINTS_SHEET);
  const checkpointId = "GCHK-" + Utilities.getUuid().slice(0, 12).toUpperCase();
  sheet.appendRow([checkpointId, String(gameId), checkpointType, tracker.game.currentPeriod, "", new Date(),
    JSON.stringify(report.objectives), JSON.stringify(report.recommendations)]);
  if (checkpointType === "End Quarter") {
    const record = findLiveGameRecord_(gameId);
    updateLiveGameObjectiveState_(record, Math.min(20, tracker.game.currentPeriod + 1));
  }
  return {report:report, tracker:getLiveGameTracker(gameId)};
}

function saveLiveGamePlanAdjustment(gameId, data) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  data = data || {};
  const gameRecord = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(gameRecord.game.Team);
  if (String(gameRecord.game.Status || "") === "Completed") throw new Error("A completed game plan cannot be changed.");
  const previousPlan = parseLiveGameJson_(gameRecord.game["Active Tracking Plan"],
    parseLiveGameJson_(gameRecord.game["Tracking Plan"], []));
  const nextPlan = cleanLiveGameTrackingPlan_(data.objectives).map(function(objective, index) {
    objective.order = index;
    objective.addedDuringGame = objective.addedDuringGame === true || !previousPlan.some(function(item) { return item.id === objective.id; });
    return objective;
  });
  if (!nextPlan.some(function(objective) { return objective.active !== false; })) throw new Error("Keep at least one objective active.");
  const adjustmentType = ["Timeout", "End Quarter", "Live Adjustment"].indexOf(data.adjustmentType) >= 0
    ? data.adjustmentType : "Live Adjustment";
  const adjustments = parseLiveGameJson_(gameRecord.game["Plan Adjustments"], []);
  const adjustment = {adjustmentId:"ADJ-" + Utilities.getUuid().slice(0, 10).toUpperCase(),
    adjustmentType:adjustmentType, period:Number(gameRecord.game["Current Period"] || 1),
    reason:String(data.reason || "").trim().slice(0, 240), changedBy:Session.getActiveUser().getEmail() || "",
    changedAt:formatLiveGameTimestamp_(new Date()), before:previousPlan, after:nextPlan};
  adjustments.push(adjustment);
  gameRecord.sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Active Tracking Plan"] + 1).setValue(JSON.stringify(nextPlan));
  gameRecord.sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Plan Adjustments"] + 1).setValue(JSON.stringify(adjustments));
  gameRecord.sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Updated At"] + 1).setValue(new Date());
  try {
    logCoachIQAudit({action:"ADJUST_LIVE_GAME_PLAN", entityType:"Game", entityId:String(gameId),
      team:String(gameRecord.game.Team || ""), beforeValue:previousPlan, afterValue:adjustment, success:true, error:""});
  } catch (auditError) { console.error("Game plan adjusted, but audit logging failed: " + auditError.message); }
  return getLiveGameTracker(gameId);
}

function buildLiveGameCheckpointReport_(tracker, checkpointType) {
  const recommendations = [];
  const rows = tracker.objectives.map(function(objective) {
    const total = tracker.objectiveTotals[objective.id] || {our:0, opponent:0};
    const value = objective.subject.indexOf("opponent_") === 0 ? total.opponent : total.our;
    let margin = null;
    let status = "neutral";
    const unitSuffix=objective.unit==="percentage"?"%":"";
    let summary = objective.label + ": " + value + unitSuffix;
    let recommendation = "Keep charting " + objective.label.toLowerCase() + ".";
    if (objective.goalType === "comparison") {
      margin = objective.direction === "lower" ? total.opponent - total.our : total.our - total.opponent;
      const requiredMargin = Math.max(1, Number(objective.target || 0));
      status = margin >= requiredMargin ? "winning" : margin >= 0 ? "even" : "behind";
      summary = objective.label + ": " + tracker.game.team + " " + total.our + unitSuffix + " – " + tracker.game.opponent + " " + total.opponent + unitSuffix;
      recommendation = margin >= Number(objective.target || 0)
        ? "Protect the " + objective.label.toLowerCase() + " advantage."
        : "Prioritize " + objective.label.toLowerCase() + "; the battle is " + (margin === 0 ? "even" : "currently against us") + ".";
    } else if (objective.goalType === "minimum") {
      margin = value - Number(objective.target || 0);
      status = value >= objective.target ? "winning" : value >= objective.target * .65 ? "even" : "behind";
      summary += " of " + objective.target + unitSuffix + " minimum";
      recommendation = status === "winning" ? "Maintain the pace on " + objective.label.toLowerCase() + "." : "Create more opportunities for " + objective.label.toLowerCase() + ".";
    } else if (objective.goalType === "maximum") {
      margin = Number(objective.target || 0) - value;
      status = value <= objective.target ? "winning" : "behind";
      summary += " of " + objective.target + unitSuffix + " maximum";
      recommendation = status === "winning" ? "Keep " + objective.label.toLowerCase() + " under control." : "Immediate adjustment: reduce " + objective.label.toLowerCase() + ".";
    }
    if (status === "behind" || status === "even") recommendations.push(recommendation);
    return {id:objective.id, label:objective.label, categoryKey:normalizeLiveGameCategoryKey_(objective.categoryKey || objective.label),
      status:status, summary:summary, recommendation:recommendation, our:Number(total.our || 0),
      opponent:Number(total.opponent || 0), value:value, target:Number(objective.target || 0), margin:margin};
  });
  if (!recommendations.length) recommendations.push("The game plan is on track. Reinforce the habits creating the advantage.");
  return {checkpointType:checkpointType, period:tracker.game.currentPeriod,
    headline:checkpointType + " Game Intelligence", objectives:rows, recommendations:recommendations.slice(0, 3)};
}

function finishLiveGame(gameId) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const gameRecord = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(gameRecord.game.Team);
  if (String(gameRecord.game.Status || "") === "Completed") return getLiveGamePostgameReport(gameId);
  const tracker = getLiveGameTracker(gameId);
  if (!tracker.objectives || !tracker.objectives.length) throw new Error("This game does not have a tracking plan.");
  const report = buildLiveGamePostgameReport_(tracker, getPreviousCompletedReports_(tracker.game.team));
  const now = new Date();
  gameRecord.sheet.getRange(gameRecord.rowNumber, gameRecord.cols.Status + 1).setValue("Completed");
  gameRecord.sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Final Report"] + 1).setValue(JSON.stringify(report));
  gameRecord.sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Completed At"] + 1).setValue(now);
  gameRecord.sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Updated At"] + 1).setValue(now);
  try {
    logCoachIQAudit({action:"FINISH_LIVE_GAME", entityType:"Game", entityId:String(gameId),
      team:tracker.game.team, beforeValue:"Live", afterValue:{status:"Completed",achieved:report.achieved,scored:report.scored}, success:true, error:""});
  } catch (auditError) { console.error("Game finished, but audit logging failed: " + auditError.message); }
  return report;
}

function getLiveGamePostgameReport(gameId) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const record = findLiveGameRecord_(gameId);
  requireLiveGameTeamAccess_(record.game.Team);
  const report = parseLiveGameObject_(record.game["Final Report"], null);
  if (!report) throw new Error("This game does not have a completed postgame report.");
  return report;
}

function buildLiveGamePostgameReport_(tracker, previousReports) {
  const base = buildLiveGameCheckpointReport_(tracker, "Final");
  let achieved = 0;
  let scored = 0;
  base.objectives.forEach(function(row) {
    const objective = tracker.objectives.find(function(item) { return item.id === row.id; });
    row.outcome = row.status === "winning" ? "Achieved" : row.status === "even" ? "Even" : row.status === "behind" ? "Missed" : "Tracked";
    if (objective && objective.goalType !== "track") { scored++; if (row.status === "winning") achieved++; }
  });
  const trends = buildLiveGameTrends_(base.objectives, previousReports || []);
  return {checkpointType:"Postgame", headline:"Postgame Game-Plan Report", gameId:tracker.game.gameId,
    gameDate:tracker.game.gameDate, team:tracker.game.team, opponent:tracker.game.opponent,
    achieved:achieved, scored:scored, objectives:base.objectives, recommendations:base.recommendations,
    trends:trends, adjustments:tracker.planAdjustments || [], originalObjectives:tracker.originalObjectives || [],
    completedAt:formatLiveGameTimestamp_(new Date())};
}

function getPreviousCompletedReports_(team) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getValues(); const headers = values.shift(); const cols = liveGameHeaderMap_(headers);
  return values.filter(function(row) { return String(row[cols.Status] || "") === "Completed" && String(row[cols.Team] || "") === String(team); })
    .map(function(row) { return parseLiveGameObject_(row[cols["Final Report"]], null); }).filter(Boolean).slice(-10).reverse();
}

function buildLiveGameTrends_(currentObjectives, previousReports) {
  const trends = [];
  (currentObjectives || []).forEach(function(current) {
    const categoryKey = normalizeLiveGameCategoryKey_(current.categoryKey || current.label);
    let streak = current.status === "winning" ? 1 : current.status === "behind" ? -1 : 0;
    if (!streak) return;
    for (let index = 0; index < previousReports.length; index++) {
      const match = (previousReports[index].objectives || []).find(function(row) { return normalizeLiveGameCategoryKey_(row.categoryKey || row.label) === categoryKey; });
      if (!match || (streak > 0 && match.status !== "winning") || (streak < 0 && match.status !== "behind")) break;
      streak += streak > 0 ? 1 : -1;
    }
    if (Math.abs(streak) >= 2) trends.push(streak > 0
      ? current.label + " has been achieved in " + streak + " straight games."
      : current.label + " has been missed in " + Math.abs(streak) + " straight games.");
  });
  return trends.slice(0, 4);
}

function getLiveGameProgramTrends_(teamFilter) {
  initializeLiveGameSheets_();
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return {gamesAnalyzed:0,categories:[],alerts:[]};
  const values = sheet.getDataRange().getValues(); const headers = values.shift(); const cols = liveGameHeaderMap_(headers);
  const access = getCurrentStaffAccess_();
  const reports = values.filter(function(row) {
    const team = String(row[cols.Team] || "");
    return String(row[cols.Status] || "") === "Completed" && (!teamFilter || team === String(teamFilter)) && (!access.configured || access.role === "Head Coach" ||
      !access.teams.length || access.teams.indexOf(team) >= 0);
  }).map(function(row) { return parseLiveGameObject_(row[cols["Final Report"]], null); }).filter(Boolean).slice(-10);
  const groups = {};
  reports.forEach(function(report) {
    const reportCategories = {};
    (report.objectives || []).forEach(function(row) {
      if (row.status === "neutral") return;
      const key = normalizeLiveGameCategoryKey_(row.categoryKey || row.label);
      const item = reportCategories[key] || (reportCategories[key] = {label:String(row.label || key),won:true,margins:[]});
      item.won = item.won && row.status === "winning";
      if (typeof row.margin === "number" && isFinite(row.margin)) item.margins.push(row.margin);
    });
    Object.keys(reportCategories).forEach(function(key) {
      const item = reportCategories[key]; const group = groups[key] || (groups[key] = {categoryKey:key,label:item.label,results:[],margins:[]});
      group.label=item.label; group.results.push(item.won ? 1 : 0); group.margins=group.margins.concat(item.margins);
    });
  });
  const categories = Object.keys(groups).map(function(key) {
    const group = groups[key]; const last3 = group.results.slice(-3); const last5 = group.results.slice(-5);
    const prior = group.results.slice(Math.max(0, group.results.length - 6), Math.max(0, group.results.length - 3));
    const recentRate = last3.length ? last3.reduce(function(sum,value){return sum+value;},0) / last3.length : 0;
    const priorRate = prior.length ? prior.reduce(function(sum,value){return sum+value;},0) / prior.length : recentRate;
    const direction = recentRate > priorRate ? "improving" : recentRate < priorRate ? "declining" : "stable";
    const achieved3 = last3.reduce(function(sum,value){return sum+value;},0);
    const achieved5 = last5.reduce(function(sum,value){return sum+value;},0);
    const averageMargin = group.margins.length ? Math.round(group.margins.reduce(function(sum,value){return sum+value;},0) / group.margins.length * 10) / 10 : null;
    return {categoryKey:key,label:group.label,tracked:group.results.length,last3:{achieved:achieved3,tracked:last3.length},
      last5:{achieved:achieved5,tracked:last5.length},averageMargin:averageMargin,direction:direction,
      summary:group.label + ": achieved in " + achieved3 + " of the last " + last3.length + " tracked games" +
        (averageMargin == null ? "." : "; average margin " + (averageMargin > 0 ? "+" : "") + averageMargin + ".")};
  }).sort(function(a,b) {
    const aRate=a.last5.tracked?a.last5.achieved/a.last5.tracked:1; const bRate=b.last5.tracked?b.last5.achieved/b.last5.tracked:1;
    return aRate-bRate || b.tracked-a.tracked;
  });
  const alerts = categories.filter(function(item){return item.last3.tracked >= 2 && item.last3.achieved <= Math.floor(item.last3.tracked / 2);})
    .slice(0,3).map(function(item){return item.label + " has been achieved in only " + item.last3.achieved + " of the last " + item.last3.tracked + " tracked games.";});
  return {gamesAnalyzed:reports.length,categories:categories.slice(0,8),alerts:alerts};
}

function buildLiveGameActions_(selectedStats, customStats) {
  const definitions = {
    two_point_shooting:[{id:"two_made",label:"2PT Made",group:"Scoring",points:2},{id:"two_missed",label:"2PT Miss",group:"Scoring",points:0}],
    three_point_shooting:[{id:"three_made",label:"3PT Made",group:"Scoring",points:3},{id:"three_missed",label:"3PT Miss",group:"Scoring",points:0}],
    free_throws:[{id:"free_throw_made",label:"FT Made",group:"Scoring",points:1},{id:"free_throw_missed",label:"FT Miss",group:"Scoring",points:0}],
    rebounds:[{id:"offensive_rebound",label:"Off. Rebound",group:"Possessions",points:0},{id:"defensive_rebound",label:"Def. Rebound",group:"Possessions",points:0}],
    turnovers:[{id:"turnover",label:"Turnover",group:"Possessions",points:0}],
    assists:[{id:"assist",label:"Assist",group:"Playmaking",points:0}],
    steals:[{id:"steal",label:"Steal",group:"Defense",points:0}],
    blocks:[{id:"block",label:"Block",group:"Defense",points:0}],
    fouls:[{id:"foul",label:"Foul",group:"Discipline",points:0}],
    paint_touches:[{id:"paint_touch",label:"Paint Touch",group:"Advanced",points:0}],
    deflections:[{id:"deflection",label:"Deflection",group:"Advanced",points:0}],
    charges:[{id:"charge_taken",label:"Charge Taken",group:"Advanced",points:0}],
    fast_break_points:[{id:"fast_break_2",label:"Fast Break +2",group:"Advanced",points:2},{id:"fast_break_3",label:"Fast Break +3",group:"Advanced",points:3}]
  };
  let actions = [];
  (selectedStats || []).forEach(function(statId) {
    if (definitions[statId]) actions = actions.concat(definitions[statId]);
  });
  (customStats || []).forEach(function(stat) {
    if ((selectedStats || []).indexOf(stat.id) >= 0) {
      actions.push({id:stat.id,label:stat.label,group:"Custom",points:0});
    }
  });
  return actions.map(function(action) {
    action.side = "Us";
    action.requiresPlayer = true;
    return action;
  });
}

function getLiveGameEvents_(gameId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_EVENTS_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, LIVE_GAME_EVENT_HEADERS.length).getValues()
    .filter(function(row) { return String(row[1] || "") === String(gameId) && row[11] !== true; })
    .map(function(row) {
      return {eventId:String(row[0] || ""), sequence:Number(row[2] || 0), timestamp:formatLiveGameTimestamp_(row[3]),
        period:Number(row[4] || 1), gameClock:String(row[5] || ""), side:String(row[6] || "Us"),
        playerId:String(row[7] || ""), eventType:String(row[8] || ""), value:Number(row[9] || 0)};
    });
}

function calculateLiveGameScore_(events) {
  const scoringValues = {two_made:2, three_made:3, free_throw_made:1};
  return (events || []).reduce(function(total, event) {
    if (event.side === "Opponent") total.opponentScore += Number(event.value || 0);
    else total.ourScore += Number(scoringValues[event.eventType] || 0);
    return total;
  }, {ourScore:0, opponentScore:0});
}

function updateLiveGameStateFromEvents_(gameRecord, period) {
  const totals = calculateLiveGameScore_(getLiveGameEvents_(gameRecord.game["Game ID"]));
  const sheet = gameRecord.sheet;
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols.Status + 1).setValue("Live");
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Current Period"] + 1).setValue(period);
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Our Score"] + 1).setValue(totals.ourScore);
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Opponent Score"] + 1).setValue(totals.opponentScore);
  sheet.getRange(gameRecord.rowNumber, gameRecord.cols["Updated At"] + 1).setValue(new Date());
}

function findLiveGameRecord_(gameId) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAMES_SHEET);
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const cols = liveGameHeaderMap_(headers);
  for (let index = 1; index < values.length; index++) {
    if (String(values[index][cols["Game ID"]] || "") === String(gameId)) {
      const game = {};
      headers.forEach(function(header, column) { game[header] = values[index][column]; });
      return {sheet:sheet, rowNumber:index + 1, cols:cols, game:game};
    }
  }
  throw new Error("The selected game was not found.");
}

function liveGameHeaderMap_(headers) {
  const cols = {};
  (headers || []).forEach(function(header, index) { cols[String(header || "").trim()] = index; });
  return cols;
}

function requireLiveGameTeamAccess_(team) {
  const access = getCurrentStaffAccess_();
  if (!access.configured || access.role === "Head Coach" || access.capabilities.indexOf("manage_settings") >= 0) return;
  if (access.teams.length && access.teams.indexOf(String(team || "")) === -1) {
    throw new Error("You do not have access to this team's game.");
  }
}

function parseLiveGameJson_(value, fallback) {
  try {
    const parsed = JSON.parse(String(value || ""));
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function parseLiveGameObject_(value, fallback) {
  try {
    const parsed = JSON.parse(String(value || ""));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch (error) { return fallback; }
}

function formatLiveGameDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(value || "");
}

function formatLiveGameTimestamp_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }
  return String(value || "");
}

function safeLiveGameValue_(value) {
  const text = String(value == null ? "" : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
