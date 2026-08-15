/**
 * Live Game MVP: game setup, roster selection, and configurable stat packages.
 */
const LIVE_GAMES_SHEET = "Games";
const LIVE_GAME_EVENTS_SHEET = "Game Events";
const LIVE_GAME_CHECKPOINTS_SHEET = "Game Checkpoints";

const LIVE_GAME_HEADERS = [
  "Game ID", "Game Date", "Team", "Opponent", "Location", "Game Format",
  "Period Length", "Status", "Current Period", "Our Score", "Opponent Score",
  "Roster Player IDs", "Selected Stats", "Created By", "Created At", "Updated At"
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
    defaults: {format:"Quarters", periodLength:8, location:"Home"}
  };
}

function createLiveGameSetup(data) {
  requireStaffCapability_("run_sessions");
  initializeLiveGameSheets_();
  data = data || {};

  const settings = getCoachIQSettings();
  const team = String(data.team || "").trim();
  const opponent = String(data.opponent || "").trim();
  const gameDate = String(data.gameDate || "").trim();
  const location = ["Home", "Away", "Neutral"].indexOf(data.location) >= 0 ? data.location : "Home";
  const format = ["Quarters", "Halves"].indexOf(data.format) >= 0 ? data.format : "Quarters";
  const periodLength = Number(data.periodLength);
  const rosterIds = Array.isArray(data.playerIds) ? data.playerIds.map(String) : [];
  const selectedStats = Array.isArray(data.selectedStats) ? data.selectedStats.map(String) : [];

  if (!gameDate) throw new Error("Choose a game date.");
  if (!team || (settings.teams || []).indexOf(team) === -1) throw new Error("Choose a valid CoachIQ team.");
  if (!opponent) throw new Error("Enter the opponent.");
  if (!Number.isInteger(periodLength) || periodLength < 1 || periodLength > 60) throw new Error("Period length must be between 1 and 60 minutes.");
  if (!rosterIds.length) throw new Error("Select at least one available player.");
  if (!selectedStats.length) throw new Error("Select at least one statistic to track.");

  const catalogIds = getBasketballLiveStatCatalog_().map(function(stat) { return stat.id; });
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
      JSON.stringify(rosterIds), JSON.stringify(selectedStats), userEmail, now, now
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
      afterValue:{gameDate:gameDate, opponent:opponent, location:location, format:format,
        periodLength:periodLength, rosterSize:rosterIds.length, selectedStats:selectedStats},
      success:true,
      error:""
    });
  } catch (auditError) {
    console.error("Live game created, but audit logging failed: " + auditError.message);
  }

  return {gameId:gameId, status:"Setup", message:"Game setup saved."};
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
    if (String(actual[index] || "").trim() !== header) {
      throw new Error(sheetName + " column " + (index + 1) + " must be '" + header + "'.");
    }
  });
  return sheet;
}

function safeLiveGameValue_(value) {
  const text = String(value == null ? "" : value).trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
