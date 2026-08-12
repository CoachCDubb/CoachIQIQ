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

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(REWARD_SHEET);

  // Delete existing rewards
  if(sheet.getLastRow() > 1){

    sheet
      .getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      )
      .clearContent();

  }

  // Add updated rewards
  rewards.forEach(function(reward){

    sheet.appendRow([

      reward.id,
      reward.name,
      reward.points,
      reward.active,
      reward.order

    ]);

  });

}