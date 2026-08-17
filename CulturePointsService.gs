/**
 * ======================================
 * Culture Points Service
 * ======================================
 */

const CULTURE_POINTS_SHEET = "Culture Points";
/**
 * Returns one point category.
 */
function getPointAward(rewardId){

 const awards = getPointAwards();

return awards.find(function(award){

    return award["Reward ID"] == rewardId;

}) || null;

}

/**
 * Creates, replaces, or removes the Culture Points entry associated with one
 * player's session evaluation. There can be at most one such entry.
 */
function setSessionRewardPoints(sessionId, playerId, rewardId, coach, previousRewardId){

  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);

  try {
    return setSessionRewardPoints_(
      sessionId,
      playerId,
      rewardId,
      coach,
      previousRewardId
    );
  } finally {
    lock.releaseLock();
  }

}

function setSessionRewardPoints_(sessionId, playerId, rewardId, coach, previousRewardId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(CULTURE_POINTS_SHEET);
  const data = sheet.getDataRange().getValues();
  const headers = data[0] || [];
  const sessionColumn = headers.indexOf("Session ID");
  const playerColumn = headers.indexOf("Player ID");
  const rewardColumn = headers.indexOf("Category ID") >= 0
    ? headers.indexOf("Category ID")
    : headers.indexOf("Reward ID");
  const matchingRows = [];

  if(sessionColumn < 0 || playerColumn < 0 || rewardColumn < 0){
    throw new Error(
      "Culture Points sheet is missing Session ID, Player ID, or reward ID column."
    );
  }

  for(let i = 1; i < data.length; i++){
    const isSameEvaluation =
      data[i][sessionColumn] == sessionId &&
      data[i][playerColumn] == playerId;
    // Some existing Culture Points sheets use a different header for the
    // description column, so locate our marker by value instead of header.
    const hasGeneratedMarker = data[i].some(function(value){
      return value === "Session evaluation reward";
    });
    const hasPreviousReward = previousRewardId &&
      data[i][rewardColumn] == previousRewardId;

    if(isSameEvaluation && (hasGeneratedMarker || hasPreviousReward)){
      matchingRows.push(i + 1);
    }
  }

  const existingRow = matchingRows.length ? matchingRows[0] : -1;

  if(!rewardId){
    matchingRows.reverse().forEach(function(rowNumber){
      sheet.deleteRow(rowNumber);
    });
    return "";
  }

  const reward = getPointAward(rewardId);

  if(!reward || !(reward.Active === true || reward.Active === "TRUE")){
    throw new Error("Active point reward not found: " + rewardId);
  }

  const pointId = existingRow > 0
    ? sheet.getRange(existingRow, 1).getValue()
    : getNextPointId();
  const row = new Array(sheet.getLastColumn()).fill("");

  row[0] = pointId;
  row[1] = playerId;
  row[2] = reward["Reward ID"];
  row[3] = reward["Reward Name"];
  row[4] = Number(reward.Points);
  row[5] = coach || "";
  row[6] = new Date();
  row[7] = "Session evaluation reward";
  row[8] = sessionId;

  if(existingRow > 0){
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);

    matchingRows.slice(1).reverse().forEach(function(rowNumber){
      sheet.deleteRow(rowNumber);
    });
  }else{
    sheet.appendRow(row);
  }

  return reward["Reward ID"];

}
function testPointCategory(){

  Logger.log(

    JSON.stringify(

      getPointCategory("PC001"),

      null,

      2

    )

  );

}
/**
 * Awards culture points to a player.
 */
function awardPoints(data){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(CULTURE_POINTS_SHEET);

const reward = getPointAward(data.rewardId);

if(!reward || !(reward.Active === true || reward.Active === "TRUE")){
  throw new Error("Point reward not found.");
}

const pointId = getNextPointId();

sheet.appendRow([

  pointId,

  data.playerId,

  reward["Reward ID"],

  reward["Reward Name"],

  reward.Points,

  data.coach,

  new Date(),

  data.notes || "",

  data.sessionId || ""

]);

}
/**
 * Returns the next Point ID.
 */
function getNextPointId(){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(CULTURE_POINTS_SHEET);

  if(sheet.getLastRow() < 2){
    return "CP0001";
  }

  const lastId = sheet
    .getRange(sheet.getLastRow(),1)
    .getValue();

  const number =
    Number(lastId.replace("CP","")) + 1;

  return "CP" + String(number).padStart(4,"0");

}
function testAwardPoints(){

 awardPoints({

    playerId:"P001",

    categoryId:"PC002",

    coach:"Washington",

    notes:"Test",

    sessionId:""

});

}
/**
 * Returns a player's total culture points.
 */
function getPlayerPoints(playerId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(CULTURE_POINTS_SHEET);

  if(sheet.getLastRow() < 2){
    return 0;
  }

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  const data = sheet
    .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
    .getValues();

  return data

    .map(row => rowToObject(headers,row))

    .filter(point => point["Player ID"] == playerId)

    .reduce(function(total,point){

      return total + Number(point.Points);

    },0);

}
/**
 * Returns the player with the most Panther Points.
 */
function getPantherPointLeader(){

  const players = getPlayers();

  let leader = null;
  let highest = -9999;

  players.forEach(function(player){

    const playerId = player[0];
    const firstName = player[1];
    const lastName = player[2];

    const total = getPlayerPoints(playerId);

    if(total > highest){

      highest = total;

      leader = {
        name: firstName + " " + lastName,
        points: total
      };

    }

  });

  return leader;

}

function testPlayerPoints(){

  Logger.log(getPlayerPoints("P001"));

}
/**
 * Returns every point transaction for one player.
 */
function getPointHistory(playerId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(CULTURE_POINTS_SHEET);

  if(sheet.getLastRow() < 2){
    return [];
  }

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  const data = sheet
    .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
    .getValues();

  return data

    .map(row => {

      const point = rowToObject(headers, row);

      // Convert Date to a string before returning to the browser
      if(point.Date){
        const date = point.Date instanceof Date
          ? point.Date
          : new Date(point.Date);

        point.Date = isNaN(date.getTime())
          ? ""
          : date.toISOString();
      }else{
        point.Date = "";
      }

      return point;

    })

    .filter(point => point["Player ID"] == playerId)

    .sort(function(a,b){

      const bTime = b.Date ? new Date(b.Date).getTime() : 0;
      const aTime = a.Date ? new Date(a.Date).getTime() : 0;

      return (isNaN(bTime) ? 0 : bTime) - (isNaN(aTime) ? 0 : aTime);

    });

}
function testPointHistory(){

  Logger.log(

    JSON.stringify(

      getPointHistory("P001"),

      null,

      2

    )

  );

}
/**
 * Returns total positive points.
 */
function getPositivePoints(playerId){

  return getPointHistory(playerId)

    .filter(point => Number(point.Points) > 0)

    .reduce(function(total,point){

      return total + Number(point.Points);

    },0);

}
/**
 * Returns total negative points.
 */
function getNegativePoints(playerId){

  return Math.abs(

    getPointHistory(playerId)

      .filter(point => Number(point.Points) < 0)

      .reduce(function(total,point){

        return total + Number(point.Points);

      },0)

  );

}
/**
 * Returns point totals by category.
 */
function getPointBreakdown(playerId){

  const history = getPointHistory(playerId);

  const breakdown = {};

  history.forEach(function(point){

    if(!breakdown[point["Category Name"]]){

      breakdown[point["Category Name"]] = 0;

    }

    breakdown[point["Category Name"]] += Number(point.Points);

  });

  return breakdown;

}
function testPointBreakdown(){

  Logger.log(

    JSON.stringify(

      getPointBreakdown("P001"),

      null,

      2

    )

  );

}
function testPositivePoints(){

  Logger.log(

    getPositivePoints("P001")

  );

}

function testNegativePoints(){

  Logger.log(

    getNegativePoints("P001")

  );

}
function testAwardAndTotal(){

  awardPoints({

    playerId:"P001",

    categoryId:"PC002",

    coach:"Washington",

    notes:"Test",

    sessionId:""

  });

  Logger.log(getPlayerPoints("P001"));

}
/**
 * Returns the Panther Leaderboard.
 */
function getLeaderboard(options){

  options = options || {};

  const players = getPlayersForUI();
  const pointTotals = {};
  const pointSheet = getCoachIQSpreadsheet_()
    .getSheetByName(CULTURE_POINTS_SHEET);

  if(pointSheet && pointSheet.getLastRow() > 1){
    const pointValues = pointSheet.getDataRange().getValues();
    const pointHeaders = pointValues.shift();
    const playerIdIndex = pointHeaders.indexOf("Player ID");
    const pointsIndex = pointHeaders.indexOf("Points");

    pointValues.forEach(function(row){
      const playerId = row[playerIdIndex];
      const points = Number(row[pointsIndex]) || 0;
      if(!pointTotals[playerId]){
        pointTotals[playerId] = {total:0, positive:0, negative:0};
      }
      pointTotals[playerId].total += points;
      if(points > 0){
        pointTotals[playerId].positive += points;
      }else if(points < 0){
        pointTotals[playerId].negative += Math.abs(points);
      }
    });
  }

  let leaderboard = [];

  players.forEach(function(player){

    const playerId = player[0];

    const totals = pointTotals[playerId] || {
      total:0,
      positive:0,
      negative:0
    };

    leaderboard.push({

      playerId: playerId,

      firstName: player[1],

      lastName: player[2],

      jersey: player[3],

      grade: player[4],

      team: player[5],

      points: totals.total,

      positive: totals.positive,

      negative: totals.negative

    });

  });

  leaderboard.sort(function(a,b){

    return b.points - a.points;

  });

  if(options.team){
    leaderboard = leaderboard.filter(function(player){
      return player.team === options.team;
    });
  }

  if(options.search){
    const search = String(options.search).toLowerCase();
    leaderboard = leaderboard.filter(function(player){
      return (player.firstName + " " + player.lastName)
        .toLowerCase()
        .includes(search);
    });
  }

  leaderboard.forEach(function(player,index){

    player.rank = index + 1;

  });

  return leaderboard;

}
function testLeaderboard(){

  Logger.log(

    JSON.stringify(

      getLeaderboard(),

      null,

      2

    )

  );

}
/**
 * Returns all Panther Point information for one player.
 */
function getPlayerCulturePoints(playerId){

  return {

    total: getPlayerPoints(playerId),

    positive: getPositivePoints(playerId),

    negative: getNegativePoints(playerId),

    breakdown: getPointBreakdown(playerId),

    history: getPointHistory(playerId)

  };

}
function testPlayerCulturePoints(){

  Logger.log(

    JSON.stringify(

      getPlayerCulturePoints("P001"),

      null,

      2

    )

  );

}