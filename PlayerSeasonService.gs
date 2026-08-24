/************************************************
 * Player Season Stats Service
 ************************************************/

const PLAYER_SEASON_STATS_SHEET = "Player Season Stats";

/**
 * Returns every season stat.
 */
function getPlayerSeasonStats() {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SEASON_STATS_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  if(sheet.getLastRow() < 2){
    return [];
  }

  const data = sheet
    .getRange(
      2,
      1,
      sheet.getLastRow()-1,
      sheet.getLastColumn()
    )
    .getValues();

  const seasonIndex = headers.indexOf("Season");
  const currentSeason = getCoachIQCurrentSeason_();

  return data.filter(function(row){
    return seasonIndex < 0 || String(row[seasonIndex] || "") === currentSeason;
  }).map(function(row){
    return rowToObject(headers,row);
  });

}
function getPlayerSeasonStatsByPlayer(playerId){

  const stats = getPlayerSeasonStats();

  const result = {};

  stats.forEach(function(stat){

    if(stat["Player ID"] == playerId){

      result[stat["Stat"]] = stat["Value"];

    }

  });

  return result;

}
function setPlayerStat(playerId, stat, value){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(PLAYER_SEASON_STATS_SHEET);

  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const seasonIndex = headers.indexOf("Season");
  const currentSeason = getCoachIQCurrentSeason_();

  for(let i = 1; i < data.length; i++){

    if(
      data[i][0] == playerId &&
      data[i][1] == stat &&
      (seasonIndex < 0 || String(data[i][seasonIndex] || "") === currentSeason)
    ){

      sheet
        .getRange(i+1,3)
        .setValue(value);

      return;

    }

  }

  const row=new Array(sheet.getLastColumn()).fill("");
  row[0]=playerId;row[1]=stat;row[2]=value;
  setCoachIQSeasonOnRow_(headers,row,currentSeason);
  sheet.appendRow(row);

}
/**
 * Rebuilds ALL player season stats.
 */
function rebuildPlayerSeasonStats(){

  Logger.log("Rebuilding Player Season Stats");

  const evaluations = getPracticeEvaluations();

  const players = getPlayers();

  players.forEach(function(player){

    const playerId = player[0];

    const playerEvaluations = evaluations.filter(function(evaluation){

      return evaluation["Player ID"] == playerId;

    });
    if (playerId === "P001") {
  Logger.log("Total evaluations: " + playerEvaluations.length);

  const attended = playerEvaluations.filter(e => e["Attendance"] === true).length;

  Logger.log("Present: " + attended);

  Logger.log(
    JSON.stringify(
      playerEvaluations.map(e => ({
        session: e["Session ID"],
        attendance: e["Attendance"]
      })),
      null,
      2
    )
  );
}

    // ==========================
    // Practice Count
    // ==========================
    setPlayerStat(
      playerId,
      "Practice Count",
      playerEvaluations.length
    );

  // ==========================
// Attendance %
// ==========================

// Only count practices where attendance was actually recorded
const attendanceRecords = playerEvaluations.filter(function(evaluation){

  return (
    evaluation["Attendance"] === true ||
    evaluation["Attendance"] === false
  );

});

const attended = attendanceRecords.filter(function(evaluation){

  return evaluation["Attendance"] === true;

}).length;

const attendancePercent =
  attendanceRecords.length === 0
    ? 0
    : Math.round((attended / attendanceRecords.length) * 100);

setPlayerStat(
  playerId,
  "Attendance %",
  attendancePercent
);

    // ==========================
    // Effort Average
    // ==========================
    const effortScores = playerEvaluations.filter(function(evaluation){

      return evaluation["Effort"] !== "";

    });

    const effortAverage =
      effortScores.length === 0
        ? 0
        : effortScores.reduce(function(total, evaluation){

            return total + Number(evaluation["Effort"]);

          }, 0) / effortScores.length;

    setPlayerStat(
      playerId,
      "Effort Avg",
      Math.round(effortAverage * 10) / 10
    );

  // ==========================
// Toughness Average
// ==========================
const toughnessScores = playerEvaluations.filter(function(evaluation){

  return evaluation["Toughness"] !== "";

});

const toughnessAverage =
  toughnessScores.length === 0
    ? 0
    : toughnessScores.reduce(function(total, evaluation){

        return total + Number(evaluation["Toughness"]);

      }, 0) / toughnessScores.length;

setPlayerStat(
  playerId,
  "Toughness Avg",
  Math.round(toughnessAverage * 10) / 10
);
// ==========================
// Accountability Average
// ==========================
const accountabilityScores = playerEvaluations.filter(function(evaluation){

  return evaluation["Accountability"] !== "";

});

const accountabilityAverage =
  accountabilityScores.length === 0
    ? 0
    : accountabilityScores.reduce(function(total, evaluation){

        return total + Number(evaluation["Accountability"]);

      }, 0) / accountabilityScores.length;

setPlayerStat(
  playerId,
  "Accountability Avg",
  Math.round(accountabilityAverage * 10) / 10
);
// ==========================
// Leadership Average
// ==========================
const leadershipScores = playerEvaluations.filter(function(evaluation){

  return evaluation["Leadership"] !== "";

});

const leadershipAverage =
  leadershipScores.length === 0
    ? 0
    : leadershipScores.reduce(function(total, evaluation){

        return total + Number(evaluation["Leadership"]);

      }, 0) / leadershipScores.length;

setPlayerStat(
  playerId,
  "Leadership Avg",
  Math.round(leadershipAverage * 10) / 10
);
// ==========================
// Culture Score
// ==========================

const cultureScore = calculateOverallPlayerGrade(playerId);

setPlayerStat(
  playerId,
  "Culture Score",
  cultureScore
);

});

}
function getPlayersForSession(sessionId){

  const evaluations = getSessionEvaluations(sessionId);

  const players = [];

  evaluations.forEach(function(e){

    Logger.log("Evaluation:");
    Logger.log(e);

    const player = getPlayer(e["Player ID"]);

    Logger.log("Player:");
    Logger.log(player);

    if(player){
      players.push(player);
    }

  });

  Logger.log(players);

  return players;

}
