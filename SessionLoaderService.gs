/**
 * ======================================
 * Session Loader Service
 * ======================================
 */

function getSessionViewData(sessionId) {

  const session = getPracticeSession(sessionId);

  if (!session) {
    throw new Error("Session not found: " + sessionId);
  }

  const teams = String(session["Teams"] || "")
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const players = getPlayersByTeams(teams);
  const rewards = getActiveRewards();
  const scores = getEvaluationScores(sessionId);
  const settings = getDropdownSettings();

  // Force Apps Script to return plain JSON only.
  return JSON.parse(JSON.stringify({
    session: session,
    players: players,
    rewards: rewards,
    scores: scores,
    settings: settings
  }));

}