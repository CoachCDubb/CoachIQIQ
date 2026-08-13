/**
 * ======================================
 * Session Loader Service
 * ======================================
 */

/**
 * Loads everything needed to open
 * a practice session.
 */
function getSessionViewData(sessionId) {

  Logger.log("========== getSessionViewData ==========");
  Logger.log("Session ID: " + sessionId);

  try {

    const session = getPracticeSession(sessionId);
    Logger.log("SESSION:");
    Logger.log(session);

    if (!session) {
      throw new Error("getPracticeSession returned null.");
    }

    const teams = session["Teams"]
      .split(",")
      .map(t => t.trim());

    Logger.log("TEAMS:");
    Logger.log(teams);

    const players = getPlayersByTeams(teams);
    Logger.log("PLAYERS:");
    Logger.log(players.length);

    const rewards = getActiveRewards();
    Logger.log("REWARDS:");
    Logger.log(rewards.length);

    const scores = getEvaluationScores(sessionId);
    Logger.log("SCORES:");
    Logger.log(Object.keys(scores).length);

    const settings = getDropdownSettings();
    Logger.log("SETTINGS:");
    Logger.log(settings);

    const result = {
      session: session,
      players: players,
      rewards: rewards,
      scores: scores,
      settings: settings
    };

    Logger.log("RETURNING:");
    Logger.log(JSON.stringify(result));

    return result;

  } catch(err) {

    Logger.log("ERROR:");
    Logger.log(err);

    throw err;

  }

}