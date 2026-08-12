/**
 * ======================================
 * Player Report Data
 * ======================================
 * Returns everything needed for a player
 * report in one object.
 */
function getPlayerReportData(playerId){

  const profile = getPlayerProfile(playerId);

  return {

    generated: new Date(),

    player: profile.player,

    attendance: profile.attendance,

    season: profile.season,

    overallGrade: profile.overallGrade,

    summary: profile.summary,

    trend: profile.trend,

    timeline: profile.timeline,

    strengths: profile.strengths,

    points: profile.points

  };

}
function testPlayerReportData(){

  const report = getPlayerReportData("P001");

  Logger.log("Overall Grade:");
  Logger.log(report.overallGrade);

  Logger.log(JSON.stringify(report,null,2));

}