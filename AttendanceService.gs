/**
 * ======================================
 * Attendance Service
 * ======================================
 */

/**
 * Returns attendance information for one player.
 */
function getPlayerAttendance(playerId){

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName("Practice Evaluations");

  const cols = getColumnMap("Practice Evaluations");

  const data = sheet
    .getDataRange()
    .getValues();
  const headers = data[0] || [];
  const currentSeason = getCoachIQCurrentSeason_();

  let present = 0;
  let absent = 0;

  const last5 = [];

  for(let i = 1; i < data.length; i++){

    const row = data[i];

    if(!isCoachIQRowInSeason_(headers,row,currentSeason)){
      continue;
    }

    if (row[cols["Player ID"] - 1] !== playerId) {
      continue;
    }

    const attendance = row[cols["Attendance"] - 1];

    if(attendance === true){

      present++;
      last5.push(true);

    }else if(attendance === false){

      absent++;
      last5.push(false);

    }

  }

  return {

    present: present,

    absent: absent,

    seasonPercentage:
      (present + absent) === 0
        ? 0
        : Math.round((present / (present + absent)) * 100),

    last5: last5.slice(-5)

  };

}

/**
 * Test
 */
function testPlayerAttendance(){

  Logger.log(

    JSON.stringify(

      getPlayerAttendance("P001"),

      null,

      2

    )

  );

}
