/**
 * ======================================
 * Session Loader Service
 * ======================================
 */

/**
 * Loads everything needed to open
 * a practice session.
 */
function getSessionViewData(sessionId){

  Logger.log("===== getSessionViewData =====");

  const session = getPracticeSession(sessionId);
  Logger.log(session);

  const teams = session["Teams"]
      .split(",")
      .map(t => t.trim());

  const players = getPlayersByTeams(teams);
  Logger.log(players);

  const rewards = getActiveRewards();
  Logger.log(rewards);

  const scores = getEvaluationScores(sessionId);
  Logger.log(scores);

  const settings = getDropdownSettings();
  Logger.log(settings);

  const result = {
    session: session,
    players: players,
    rewards: rewards,
    scores: scores,
    settings: settings
  };

  Logger.log(result);

  return result;

}