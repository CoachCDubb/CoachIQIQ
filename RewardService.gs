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

  return data
    .map(function(row){
      return rowToObject(headers,row);
    })
    .filter(function(reward){
      return String(reward["Reward ID"] || "").trim() !== "";
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

  const lock = LockService.getScriptLock();
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
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
  const requiredHeaders = [
    "Reward ID",
    "Reward Name",
    "Points",
    "Active",
    "Display Order"
  ];

  requiredHeaders.forEach(function(header){
    if(headers.indexOf(header) < 0){
      throw new Error("Point Awards sheet is missing column: " + header);
    }
  });

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

    return buildRewardRow_(headers, {
      "Reward ID": rewardId,
      "Reward Name": reward.name,
      "Points": Number(reward.points),
      "Active": reward.active === true,
      "Display Order": index + 1
    });
  });

  // Preserve removed rewards as inactive so historical IDs are never reused.
  existing.forEach(function(reward){
    const rewardId = String(reward["Reward ID"] || "");

    if(!savedIds[rewardId]){
      const preservedReward = {};

      headers.forEach(function(header){
        preservedReward[header] = reward[header];
      });

      preservedReward.Active = false;
      preservedReward["Display Order"] = rows.length + 1;
      rows.push(buildRewardRow_(headers, preservedReward));
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

function buildRewardRow_(headers, reward) {

  return headers.map(function(header){
    return Object.prototype.hasOwnProperty.call(reward, header)
      ? reward[header]
      : "";
  });

}
