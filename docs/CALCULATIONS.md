# CoachIQ calculation contract

This document defines the production calculations that must remain consistent
across the Dashboard, player profile, Leaderboard, PDFs, and Intelligence.
Changes to these rules require matching regression-test changes and a user-facing
release note.

## Completed practice evaluations

- A practice evaluation is complete when its `Complete` value is Boolean `true`
  or the case-insensitive text `TRUE`.
- Player profile history uses that player's newest completed evaluation rows,
  newest first. It does not require a matching row in `Sessions`, preserving
  imported and legacy evaluation history.
- The player profile currently displays and averages at most five completed
  evaluations per pillar.
- Blank, null, undefined, and non-numeric pillar values do not participate in an
  average.

## Pillar averages and trends

- A pillar average is the arithmetic mean of its included scores, rounded to two
  decimal places by the server and shown to one decimal place in the profile.
- Movement is `newest score - oldest score` within the included player window.
- No scores: `No trend yet`.
- One score: `Baseline`.
- Movement of at least `+0.5`: `Improving`.
- Movement of at most `-0.5`:
  - average at least `4.0`: `Strong — Trending Down`;
  - average from `3.0` through `3.99`: `Trending Down`;
  - average below `3.0`: `Needs Attention`.
- With no meaningful movement:
  - average at least `4.0`: `Consistently Strong`;
  - average from `3.0` through `3.99`: `Holding Steady`;
  - average below `3.0`: `Needs Attention`.

The trend describes recent direction and context; it is not a rank against other
players.

## Overall player grade

- The overall grade is the arithmetic mean of the available pillar averages in
  the five-evaluation profile window.
- Pillars without a numeric average are excluded rather than treated as zero.
- If no pillar has a numeric average, the overall grade is `0.0`.

## Panther Points

- Culture points are the signed total of entries in `Culture Points` for a player.
- Each valid pillar score from `1` through `5` on a completed practice evaluation
  contributes that many evaluation points. One evaluation star equals one point.
- Total Panther Points are `culture points + evaluation points`.
- Positive points are `positive culture points + evaluation points`.
- Negative points remain the absolute magnitude of negative culture-point entries.
- Dashboard, player profile, and Leaderboard totals must use
  `combinePlayerPointTotals_` so the same inputs always produce the same displayed
  total and breakdown.

## Required regression gate

Run both checks before an Apps Script release:

```bash
npm test
npm run check:syntax
```

The regression suite must cover missing scores, single-score baselines, strong and
low steady performance, upward and downward movement, legacy completion markers,
player-specific history limits, and evaluation-inclusive point totals.
