# Opponent roster library

CoachIQ keeps opponent scouting rosters separate from registered CoachIQ athletes. A saved opponent is keyed by sport and may include a level and season. The same school can therefore have distinct basketball, football, baseball, soccer, volleyball, and other-sport rosters without leaking opponent athletes into attendance, evaluations, culture points, or leaderboards.

## Coach workflow

1. In Live Game setup, choose the sport first.
2. Expand **Opponent roster** and select an existing roster, or enter the opponent name, level, and season.
3. Paste one player per line using CSV, tab-separated spreadsheet cells, or `#jersey Player Name`.
4. Select **Use pasted roster** to validate it for this game. Select **Save for future games** only when the library should be updated.
5. Build opponent-player objectives from the resulting player dropdown and save the game plan.

The game stores its own opponent-roster snapshot. Future edits to the saved library do not rewrite existing or completed games.

## Supported fields and limits

Each opponent player supports jersey, name, position, and grade/year. Name is required. Jersey and name pairs must be unique within the roster, and a roster may contain up to 100 athletes. All user text is length-limited and formula-safe before it reaches a sheet.

## External sources

The first release intentionally supports coach-reviewed paste and does not scrape MaxPreps or another website. An automated provider connection should be added only through an approved API/export agreement, with source attribution, rate-limit handling, and a manual review step before CoachIQ changes a saved roster.

## Authorization and audit

Opponent roster read/write entry points require the existing `run_sessions` staff capability. Saves are serialized with the script lock and produce a `SAVE_OPPONENT_ROSTER` audit entry containing sport, level, season, and roster size. Live Game continues to enforce the coach's authorization for the selected CoachIQ team separately.
