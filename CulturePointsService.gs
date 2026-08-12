/**
 * ======================================
 * Culture Points Service
 * ======================================
 */

const CULTURE_POINTS_SHEET = "Culture Points";
const POINT_AWARDS_SHEET = "Point Awards";
/**
 * Returns all enabled point categories.
 */
function getPointAwards(){

const sheet = SpreadsheetApp
.getActive()
.getSheetByName(POINT_AWARDS_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  if(sheet.getLastRow() < 2){
    return [];
  }

  const data = sheet
    .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
    .getValues();

 return data

.map(row => rowToObject(headers,row))

.filter(function(reward){

    return reward.Active === true;

})

.sort(function(a,b){

    return Number(a["Display Order"]) - Number(b["Display Order"]);

});

}
function testPointAwards(){

  Logger.log(
    JSON.stringify(
      getPointAwards(),
      null,
      2
    )
  );

}
/**
 * Returns one point category.
 */
function getPointAward(rewardId){

 const awards = getPointAwards();

return awards.find(function(award){

    return award["Reward ID"] == rewardId;

}) || null;

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

if(!reward){
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
      point.Date = point.Date
        ? new Date(point.Date).toISOString()
        : "";

      return point;

    })

    .filter(point => point["Player ID"] == playerId)

    .sort(function(a,b){

      return new Date(b.Date) - new Date(a.Date);

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

  const leaderboard = [];

  players.forEach(function(player){

    const playerId = player[0];

    const total = getPlayerPoints(playerId);

    leaderboard.push({

      playerId: playerId,

      firstName: player[1],

      lastName: player[2],

      jersey: player[3],

      grade: player[4],

      team: player[5],

      points: total,

      positive: getPositivePoints(playerId),

      negative: getNegativePoints(playerId)

    });

  });

  leaderboard.sort(function(a,b){

    return b.points - a.points;

  });

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