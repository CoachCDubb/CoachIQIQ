/**
 * Live Game MVP: game setup, roster selection, and configurable stat packages.
 */
const LIVE_GAMES_SHEET = "Games";
const LIVE_GAME_EVENTS_SHEET = "Game Events";
const LIVE_GAME_CHECKPOINTS_SHEET = "Game Checkpoints";

const LIVE_GAME_HEADERS = [
  "Game ID", "Game Date", "Team", "Opponent", "Location", "Game Format",
  "Period Length", "Status", "Current Period", "Our Score", "Opponent Score",
  "Roster Player IDs", "Selected Stats", "Created By", "Created At", "Updated At",
  "Game Type", "Custom Stat Definitions", "Tracking Plan"
];

const LIVE_GAME_EVENT_HEADERS = [
  "Event ID", "Game ID", "Sequence", "Timestamp", "Period", "Game Clock",
  "Team", "Player ID", "Event Type", "Event Value", "Created By", "Voided", "Synced At"
];

const LIVE_GAME_CHECKPOINT_HEADERS = [
  "Checkpoint ID", "Game ID", "Checkpoint Type", "Period", "Game Clock",
  "Created At", "Snapshot", "Recommendations"
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

function getLiveGameSetupData() {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  const settings = getCoachIQSettings();
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
    defaults: {gameType:"Official Game", format:"Quarters", periodLength:8, location:"Home"}
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
  const format = ["Quarters", "Halves"].indexOf(data.format) >= 0 ? data.format : "Quarters";
  const periodLength = Number(data.periodLength);
  const rosterIds = Array.isArray(data.playerIds) ? data.playerIds.map(String) : [];
  const selectedStats = Array.isArray(data.selectedStats) ? data.selectedStats.map(String) : [];
  const customStats = cleanLiveGameCustomStats_(data.customStats);
  const trackingPlan = cleanLiveGameTrackingPlan_(data.trackingObjectives);

  if (!gameDate) throw new Error("Choose a game date.");
  if (!team || (settings.teams || []).indexOf(team) === -1) throw new Error("Choose a valid CoachIQ team.");
  if (!opponent) throw new Error("Enter the opponent.");
  if (!Number.isInteger(periodLength) || periodLength < 1 || periodLength > 60) throw new Error("Period length must be between 1 and 60 minutes.");
  if (!rosterIds.length) throw new Error("Select at least one available player.");
  if (!trackingPlan.length && !selectedStats.length) throw new Error("Add at least one game-plan objective.");
  trackingPlan.forEach(function(objective) {
    if (objective.subject === "our_player" && rosterIds.indexOf(objective.playerId) < 0) {
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
      JSON.stringify(rosterIds), JSON.stringify(selectedStats), userEmail, now, now,
      gameType, JSON.stringify(customStats), JSON.stringify(trackingPlan)
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
      afterValue:{gameDate:gameDate, gameType:gameType, opponent:opponent, location:location, format:format,
        periodLength:periodLength, rosterSize:rosterIds.length, selectedStats:selectedStats,
        customStats:customStats, trackingObjectives:trackingPlan},
      success:true,
      error:""
    });
  } catch (auditError) {
    console.error("Live game created, but audit logging failed: " + auditError.message);
  }

  return {gameId:gameId, status:"Setup", gameType:gameType, opponent:opponent, message:"Game setup saved."};
}

function initializeLiveGameSheets_() {
  ensureLiveGameSheet_(LIVE_GAMES_SHEET, LIVE_GAME_HEADERS);
  ensureLiveGameSheet_(LIVE_GAME_EVENTS_SHEET, LIVE_GAME_EVENT_HEADERS);
  ensureLiveGameSheet_(LIVE_GAME_CHECKPOINTS_SHEET, LIVE_GAME_CHECKPOINT_HEADERS);
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
  const validUnits = ["count", "points"];
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
    if ((subject === "our_player" || subject === "opponent_player") && !playerId && !playerLabel) {
      throw new Error(label + " needs a player.");
    }
    seen[id] = true;
    return {id:id, label:label, subject:goalType === "comparison" ? "both_teams" : subject,
      goalType:goalType, unit:unit, target:target, direction:direction,
      playerId:playerId, playerLabel:playerLabel};
  });
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
  const selectedStats = parseLiveGameJson_(game["Selected Stats"], []);
  const customStats = parseLiveGameJson_(game["Custom Stat Definitions"], []);
  const objectives = parseLiveGameJson_(game["Tracking Plan"], []);
  const permittedPlayers = filterPlayersForCurrentStaff_(getPlayers());
  const players = permittedPlayers.filter(function(player) {
    return rosterIds.indexOf(String(player[0] || "")) >= 0;
  }).map(function(player) {
    return {id:String(player[0] || ""), firstName:String(player[1] || ""), lastName:String(player[2] || ""),
      jersey:String(player[3] || ""), position:String(player[6] || "")};
  });
  const events = getLiveGameEvents_(gameId);
  if (objectives.length) {
    return {
      game:{gameId:String(game["Game ID"] || ""), gameDate:formatLiveGameDate_(game["Game Date"]),
        team:String(game.Team || ""), opponent:String(game.Opponent || ""), location:String(game.Location || ""),
        format:String(game["Game Format"] || "Quarters"), periodLength:Number(game["Period Length"] || 8),
        status:String(game.Status || "Setup"), currentPeriod:Number(game["Current Period"] || 1),
        gameType:String(game["Game Type"] || "Official Game")},
      players:players,
      objectives:objectives,
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
  const objectives = parseLiveGameJson_(gameRecord.game["Tracking Plan"], []);
  const eventSheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_EVENTS_SHEET);
  const rows = eventSheet.getLastRow() > 1
    ? eventSheet.getRange(2, 1, eventSheet.getLastRow() - 1, LIVE_GAME_EVENT_HEADERS.length).getValues() : [];
  const knownIds = {};
  rows.forEach(function(row) { knownIds[String(row[0] || "")] = true; });
  let sequence = rows.filter(function(row) { return String(row[1] || "") === String(gameId); }).length;
  let latestPeriod = Number(gameRecord.game["Current Period"] || 1);
  const userEmail = Session.getActiveUser().getEmail() || "";
  const newRows = events.map(function(rawEvent) {
    const event = rawEvent || {};
    const objective = objectives.find(function(item) { return item.id === String(event.objectiveId || ""); });
    if (!objective) throw new Error("That game-plan objective is not enabled.");
    const delta = Number(event.delta);
    const permittedDeltas = objective.unit === "points" ? [-3, -2, -1, 1, 2, 3] : [-1, 1];
    if (permittedDeltas.indexOf(delta) < 0) throw new Error("Choose a valid adjustment.");
    let side = String(event.side || "");
    if (objective.subject === "both_teams") {
      if (["Us", "Opponent"].indexOf(side) < 0) throw new Error("Choose which team recorded the result.");
    } else {
      side = objective.subject.indexOf("opponent_") === 0 ? "Opponent" : "Us";
    }
    const period = Number(event.period);
    if (!Number.isInteger(period) || period < 1 || period > 20) throw new Error("Choose a valid period.");
    if (objective.subject === "our_player") requirePlayerAccess_(objective.playerId);
    const requestedId = String(event.eventId || "");
    if (requestedId && knownIds[requestedId]) return null;
    const eventId = requestedId || "GEVT-" + Utilities.getUuid().slice(0, 12).toUpperCase();
    knownIds[eventId] = true;
    sequence++;
    const now = new Date();
    latestPeriod = period;
    return [eventId, String(gameId), sequence, now, period, "", side, objective.playerId || "",
      objective.id, delta, userEmail, false, now];
  }).filter(function(row) { return row; });
  if (newRows.length) {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      eventSheet.getRange(eventSheet.getLastRow() + 1, 1, newRows.length, LIVE_GAME_EVENT_HEADERS.length).setValues(newRows);
    } finally {
      lock.releaseLock();
    }
  }
  updateLiveGameObjectiveState_(gameRecord, latestPeriod);
  return getLiveGameTracker(gameId);
}

function calculateLiveGameObjectiveTotals_(events, objectives) {
  const totals = {};
  (objectives || []).forEach(function(objective) { totals[objective.id] = {our:0, opponent:0}; });
  (events || []).forEach(function(event) {
    if (!totals[event.eventType]) return;
    const key = event.side === "Opponent" ? "opponent" : "our";
    totals[event.eventType][key] = Math.max(0, totals[event.eventType][key] + Number(event.value || 0));
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
  const permittedPlayerIds = filterPlayersForCurrentStaff_(getPlayers()).map(function(player) { return String(player[0] || ""); });
  if (action.requiresPlayer && (rosterIds.indexOf(playerId) === -1 || permittedPlayerIds.indexOf(playerId) === -1)) {
    throw new Error("Select a player within your assigned roster scope.");
  }

  const eventSheet = SpreadsheetApp.getActive().getSheetByName(LIVE_GAME_EVENTS_SHEET);
  const existing = eventSheet.getLastRow() > 1
    ? eventSheet.getRange(2, 1, eventSheet.getLastRow() - 1, LIVE_GAME_EVENT_HEADERS.length).getValues() : [];
  const requestedId = String(event.eventId || "");
  const duplicate = existing.some(function(row) { return String(row[0] || "") === requestedId; });
  if (!duplicate) {
    const sequence = existing.filter(function(row) { return String(row[1] || "") === String(gameId); }).length + 1;
    const eventId = requestedId || "GEVT-" + Utilities.getUuid().slice(0, 12).toUpperCase();
    const now = new Date();
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      eventSheet.appendRow([eventId, String(gameId), sequence, now, period, safeLiveGameValue_(gameClock),
        action.side || "Us", playerId, eventType, Number(action.points || 0),
        Session.getActiveUser().getEmail() || "", false, now]);
    } finally {
      lock.releaseLock();
    }
  }
  updateLiveGameStateFromEvents_(gameRecord, period);
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

function buildLiveGameCheckpointReport_(tracker, checkpointType) {
  const recommendations = [];
  const rows = tracker.objectives.map(function(objective) {
    const total = tracker.objectiveTotals[objective.id] || {our:0, opponent:0};
    const value = objective.subject.indexOf("opponent_") === 0 ? total.opponent : total.our;
    let status = "neutral";
    let summary = objective.label + ": " + value;
    let recommendation = "Keep charting " + objective.label.toLowerCase() + ".";
    if (objective.goalType === "comparison") {
      const margin = objective.direction === "lower" ? total.opponent - total.our : total.our - total.opponent;
      status = margin > 0 ? "winning" : margin === 0 ? "even" : "behind";
      summary = objective.label + ": " + tracker.game.team + " " + total.our + " – " + tracker.game.opponent + " " + total.opponent;
      recommendation = margin >= Number(objective.target || 0)
        ? "Protect the " + objective.label.toLowerCase() + " advantage."
        : "Prioritize " + objective.label.toLowerCase() + "; the battle is " + (margin === 0 ? "even" : "currently against us") + ".";
    } else if (objective.goalType === "minimum") {
      status = value >= objective.target ? "winning" : value >= objective.target * .65 ? "even" : "behind";
      summary += " of " + objective.target + " minimum";
      recommendation = status === "winning" ? "Maintain the pace on " + objective.label.toLowerCase() + "." : "Create more opportunities for " + objective.label.toLowerCase() + ".";
    } else if (objective.goalType === "maximum") {
      status = value <= objective.target ? "winning" : "behind";
      summary += " of " + objective.target + " maximum";
      recommendation = status === "winning" ? "Keep " + objective.label.toLowerCase() + " under control." : "Immediate adjustment: reduce " + objective.label.toLowerCase() + ".";
    }
    if (status === "behind" || status === "even") recommendations.push(recommendation);
    return {id:objective.id, label:objective.label, status:status, summary:summary, recommendation:recommendation};
  });
  if (!recommendations.length) recommendations.push("The game plan is on track. Reinforce the habits creating the advantage.");
  return {checkpointType:checkpointType, period:tracker.game.currentPeriod,
    headline:checkpointType + " Game Intelligence", objectives:rows, recommendations:recommendations.slice(0, 3)};
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
