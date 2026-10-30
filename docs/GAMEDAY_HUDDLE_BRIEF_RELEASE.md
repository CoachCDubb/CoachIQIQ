# GameDay courtside report brief — 2026.10.30.5

## Report behavior

Timeout and live quarter/halftime reports now open with one expanded huddle priority: a large headline, a short statistical explanation, and a bold Next possession instruction. The tracked score and period remain visible without competing with the message. Back to tracking appears immediately beneath the brief.

Supporting information is retained in closed sections: Recent changes & other priorities; Game-plan objectives; Game totals & player stats (including player credit / breakdown coverage); Strengths, concerns & tracked patterns; Scouting plan & watchlist when available; Tracking coverage & notes.

The existing fuller postgame report remains. Print / save full report still expands all sections in the separate print document, including those closed on screen.

## Evidence and freshness

The brief uses the existing ranked recent-possession rules, not a separate network/model request. Examples: DEFENSIVE REBOUNDING NEEDS FIXING; TURNOVERS ARE WASTING POSSESSIONS; STOP SENDING THEM TO THE LINE; KEEP STACKING STOPS. The headline changes with the selected evidence-backed priority. The supporting sentence retains the exact recorded counts and window. No new causal or lost-point claims are inferred from tags.

Rebounding still requires at least three recent defensive possessions and three opponent OREB; turnover alerts require at least three offensive possessions and two turnovers. Existing paint/foul/FT/action/efficiency thresholds remain. Small or empty samples get NO CLEAR PATTERN YET / TRACK A FEW POSSESSIONS FIRST. Positive stop runs get reinforcement rather than an invented problem. Reused reports explicitly identify the same saved report; saved report boundaries and correction handling remain unchanged. Brief standard cues do not replace prepared responses for action-tag priorities.

## Update

1. Merge this PR and wait for the GameDay publishing workflow to pass.
2. In GameDay online, use Check again / Prepare for offline, close all app windows, and reopen the existing app. Confirm 2026.10.30.5.
3. No Apps Script source changes are required for this report UI update. Keep prior bridge/analytics updates.
4. In a practice game, open Timeout report, expand a supporting section, and check Print / save full report. Complete the physical-device airplane-mode smoke test before game use.

## Validation

129 GameDay tests and 349 root tests pass, plus syntax/diff checks. New brief tests cover rebounding evidence thresholds, turnovers, positive stops, empty/small samples and saved report boundaries/reuse. Browser fixture with actual app modules and fake-indexeddb checks an expanded statistical priority, initially closed supporting sections, objective/stats expansion, full PDF text, live period report, fuller postgame report and no modal horizontal overflow at 1024/768/390 pixels; no page errors. These checks do not certify physical iPad Safari or the live deployment.
