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

  const session = getPracticeSession(sessionId);

  return {
    session: session
  };

}