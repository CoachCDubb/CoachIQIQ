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

    overallLabel: profile.overallLabel,

    summary: profile.summary,

    trend: profile.trend,

    timeline: profile.timeline,

    history: profile.history,

    evaluations: getPlayerReportEvaluations_(playerId),

    strengths: profile.strengths,

    points: profile.points

  };

}

function getPlayerReportEvaluations_(playerId){
  const evaluations = getPracticeEvaluations().filter(function(evaluation){
    return evaluation["Player ID"] == playerId && evaluation.Complete === true;
  });
  let sessions = [];
  const sessionsById = {};
  const rewardsById = {};
  const settings = getCoachIQSettings();

  // Session and reward lookups add helpful labels, but they are optional. A
  // missing/partially configured sheet must not prevent a player's PDF from
  // being generated.
  try{
    sessions = getAllSessions() || [];
  }catch(error){
    console.warn("Player report could not load session labels: " + error);
  }

  sessions.forEach(function(session){
    sessionsById[String(session["Session ID"])] = session;
  });
  try{
    (getPointAwards() || []).forEach(function(reward){
      rewardsById[String(reward["Reward ID"])] = reward["Reward Name"];
      rewardsById[String(reward["Reward Name"])] = reward["Reward Name"];
    });
  }catch(error){
    console.warn("Player report could not load reward labels: " + error);
  }

  return evaluations.map(function(evaluation){
    const session = sessionsById[String(evaluation["Session ID"])] || {};
    const scores = {};
    (settings.cultureCategories || []).forEach(function(category){
      const score = Number(evaluation[category]);
      scores[category] = isFinite(score) && score > 0 ? score : null;
    });
    return {
      sessionId: evaluation["Session ID"],
      date: session.Date || evaluation.Created || "",
      sessionType: session["Session Type"] || "Session",
      teams: session.Teams || "",
      evaluator: evaluation.Evaluator || "",
      attendance: evaluation.Attendance === true,
      scores: scores,
      notes: evaluation.Notes || "",
      reward: rewardsById[String(evaluation.Reward || "")] || evaluation.Reward || ""
    };
  }).sort(function(a, b){
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}
function testPlayerReportData(){

  const report = getPlayerReportData("P001");

  Logger.log("Overall Grade:");
  Logger.log(report.overallGrade);

  Logger.log(JSON.stringify(report,null,2));

}
