/********************************
 * Reward Service
 ********************************/

const REWARD_SHEET = "Point Awards";

/**
 * Returns every reward.
 */
function getPointAwards() {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(REWARD_SHEET);

  const headers = sheet
    .getRange(1,1,1,sheet.getLastColumn())
    .getValues()[0];

  if(sheet.getLastRow() < 2){
    return [];
  }

  const data = sheet
    .getRange(2,1,sheet.getLastRow()-1,sheet.getLastColumn())
    .getValues();

  return data.map(function(row){
    return rowToObject(headers,row);
  });

}

/**
 * Returns only active rewards.
 */
function getActiveRewards(){

 return getPointAwards()

.filter(function(reward){

    return reward.Active === true || reward.Active === "TRUE";

})

.sort(function(a,b){

    return Number(a["Display Order"]) - Number(b["Display Order"]);

});

}

/**
 * Test
 */
 
function testPointAwards(){

Logger.log(
JSON.stringify(
getActiveRewards(),
null,
2
)
);

}
/**
 * Saves all Point Rewards.
 */
function savePointRewards(rewards){

  const lock = LockService.getDocumentLock();
  lock.waitLock(10000);

  try {
    return savePointRewards_(rewards);
  } finally {
    lock.releaseLock();
  }

}

function savePointRewards_(rewards){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(REWARD_SHEET);

  const existing = getPointAwards();
  const existingById = {};
  let highestId = 0;

  existing.forEach(function(reward){
    const rewardId = String(reward["Reward ID"] || "");
    existingById[rewardId] = reward;
    highestId = Math.max(highestId, Number(rewardId.replace(/\D/g, "")) || 0);
  });

  const savedIds = {};
  const rows = rewards.map(function(reward, index){
    let rewardId = String(reward.id || "");

    if(!rewardId || !existingById[rewardId] || savedIds[rewardId]){
      highestId++;
      rewardId = "R" + String(highestId).padStart(3, "0");
    }

    savedIds[rewardId] = true;

    return [
      rewardId,
      reward.name,
      Number(reward.points),
      reward.active === true,
      index + 1
    ];
  });

  // Preserve removed rewards as inactive so historical IDs are never reused.
  existing.forEach(function(reward){
    const rewardId = String(reward["Reward ID"] || "");

    if(!savedIds[rewardId]){
      rows.push([
        rewardId,
        reward["Reward Name"],
        Number(reward.Points),
        false,
        rows.length + 1
      ]);
    }
  });

  if(sheet.getLastRow() > 1){
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
      .clearContent();
  }

  if(rows.length){
    sheet.getRange(2, 1, rows.length, sheet.getLastColumn())
      .setValues(rows);
  }

  return getPointAwards();

}
