/**
 * Persists Live Game state in a dedicated sheet. The UI is embedded in
 * Scripts.html; these functions are deliberately limited to data access.
 */
const LIVE_GAME_SHEET = "Live Games";
const LIVE_GAME_HEADERS = [
  "Game ID", "Date", "Team", "Opponent", "Location", "Status",
  "Our Score", "Opponent Score", "Period", "Clock Seconds",
  "Updated", "Completed", "Game Data"
];

function getLiveGameBootstrap(){
  const activeId = PropertiesService.getUserProperties().getProperty("COACHIQ_ACTIVE_GAME");
  const activeGame = activeId ? getLiveGameById_(activeId) : null;
  const settings = getDropdownSettings();
  const team = activeGame ? activeGame.team : "";
  const players = team ? getPlayersByTeams([team]) : [];
  return jsonSafeLiveGame_({settings: settings, activeGame: activeGame, players: players});
}

function createLiveGame(setup){
  if(!setup || !String(setup.team || "").trim() || !String(setup.opponent || "").trim()){
    throw new Error("A team and opponent are required.");
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const now = new Date();
    const game = {
      gameId: "GAME-" + Utilities.getUuid(),
      date: String(setup.date || Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd")),
      team: String(setup.team).trim(),
      opponent: String(setup.opponent).trim(),
      location: String(setup.location || "Home"),
      status: "In Progress",
      totalPeriods: Number(setup.totalPeriods) === 2 ? 2 : 4,
      periodMinutes: Math.max(1, Math.min(60, Number(setup.periodMinutes) || 8)),
      period: 1,
      clockSeconds: Math.max(1, Math.min(60, Number(setup.periodMinutes) || 8)) * 60,
      ourScore: 0,
      opponentScore: 0,
      timeouts: 0,
      pregameNotes: String(setup.pregameNotes || ""),
      postgameNotes: "",
      playerImpact: {},
      events: [],
      created: now.toISOString(),
      updated: now.toISOString()
    };
    writeLiveGame_(game);
    PropertiesService.getUserProperties().setProperty("COACHIQ_ACTIVE_GAME", game.gameId);
    return jsonSafeLiveGame_({game: game, players: getPlayersByTeams([game.team])});
  } finally {
    lock.releaseLock();
  }
}

function saveLiveGame(game){
  validateLiveGame_(game);
  game.status = "In Progress";
  game.updated = new Date().toISOString();
  writeLiveGame_(game);
  PropertiesService.getUserProperties().setProperty("COACHIQ_ACTIVE_GAME", game.gameId);
  return game.gameId;
}

function completeLiveGame(game){
  validateLiveGame_(game);
  game.status = "Completed";
  game.updated = new Date().toISOString();
  game.completed = game.updated;
  writeLiveGame_(game);
  PropertiesService.getUserProperties().deleteProperty("COACHIQ_ACTIVE_GAME");
  return game.gameId;
}

function discardLiveGame(gameId){
  const sheet = getLiveGameSheet_();
  const values = sheet.getDataRange().getValues();
  for(let row = values.length - 1; row >= 1; row--){
    if(String(values[row][0]) === String(gameId)){
      sheet.deleteRow(row + 1);
      break;
    }
  }
  PropertiesService.getUserProperties().deleteProperty("COACHIQ_ACTIVE_GAME");
  return true;
}

function validateLiveGame_(game){
  if(!game || !String(game.gameId || "").trim()){
    throw new Error("The game could not be identified.");
  }
  game.ourScore = Math.max(0, Number(game.ourScore) || 0);
  game.opponentScore = Math.max(0, Number(game.opponentScore) || 0);
  game.period = Math.max(1, Number(game.period) || 1);
  game.clockSeconds = Math.max(0, Number(game.clockSeconds) || 0);
  game.events = Array.isArray(game.events) ? game.events.slice(0, 100) : [];
}

function writeLiveGame_(game){
  const sheet = getLiveGameSheet_();
  const values = sheet.getDataRange().getValues();
  let row = values.length + 1;
  for(let index = 1; index < values.length; index++){
    if(String(values[index][0]) === String(game.gameId)){ row = index + 1; break; }
  }
  const record = [[
    game.gameId, game.date, game.team, game.opponent, game.location,
    game.status, game.ourScore, game.opponentScore, game.period,
    game.clockSeconds, new Date(game.updated || new Date()),
    game.completed ? new Date(game.completed) : "", JSON.stringify(game)
  ]];
  sheet.getRange(row, 1, 1, LIVE_GAME_HEADERS.length).setValues(record);
}

function getLiveGameById_(gameId){
  const sheet = getLiveGameSheet_();
  const values = sheet.getDataRange().getValues();
  for(let row = values.length - 1; row >= 1; row--){
    if(String(values[row][0]) === String(gameId)){
      try { return JSON.parse(values[row][LIVE_GAME_HEADERS.length - 1]); }
      catch(error){ return null; }
    }
  }
  return null;
}

function getLiveGameSheet_(){
  const spreadsheet = SpreadsheetApp.getActive();
  let sheet = spreadsheet.getSheetByName(LIVE_GAME_SHEET);
  if(!sheet){ sheet = spreadsheet.insertSheet(LIVE_GAME_SHEET); }
  if(sheet.getLastRow() === 0){
    sheet.getRange(1, 1, 1, LIVE_GAME_HEADERS.length).setValues([LIVE_GAME_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonSafeLiveGame_(value){
  return JSON.parse(JSON.stringify(value));
}
