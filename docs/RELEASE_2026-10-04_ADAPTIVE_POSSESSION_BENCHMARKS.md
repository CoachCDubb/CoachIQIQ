# CoachIQ Live adaptive possession benchmarks — 2026-10-04

Build **2026.10.04.7** adds adaptive, team-specific guidance to Possession Analytics while leaving the manually configured Winning Chart unchanged.

## Result integrity

Completed basketball games now require staff to confirm both final scores. The server stores those scores and an explicit `Game Result` (`Win` or `Loss`) together when it permanently locks the game. Objective success is never used as a proxy for the result. Legacy completed games without an explicit result remain visible, but are excluded from learning.

`Game Result` is appended as an optional named column. This preserves existing
workbooks where `Opponent Roster`, `Tracker Mode`, or other optional fields already
occupy columns after the fixed Games schema; no manual column insertion is needed.

Program Intelligence stays visible above the horizontally scrolling benchmark cards
in the compact desktop tracker. Opening it uses a scrollable overlay so the full
win/loss evidence cannot be clipped by the game-day viewport.

The live header now shows points scored and points allowed beside possession counts.
Program Intelligence explicitly separates the current-game value, target or maximum,
and winning/loss averages. A tracker note clarifies that possession tags update
analytics while the manually configured Winning Chart retains its own +1 taps.

Selecting Track Defense now labels transition, right-hand drive, paint touch,
offensive rebound, and points as allowed, and limits the live benchmark strip to
defensive metrics. Track Offense similarly shows only offensive metrics; Program
Intelligence continues to contain the complete program view.

Every live PPP, rate, and per-100 benchmark now includes its underlying totals—for
example, `7 turnovers · 40 possessions` or `5 offensive rebounds allowed · 32
possessions`—both on the benchmark card and in Program Intelligence.

## Benchmark method

The eleven values in `getStarterLiveAnalyticsBenchmarks_` are **coach-configurable product defaults**, not universal facts or claimed high-school norms. Targets use only current-season, completed games for the selected team that the signed-in staff member may access. Missing denominators produce `null` metrics and never produce learned guidance.

* Fewer than 3 valid metric samples: Starter benchmark.
* 3–5: Early signal (25% bounded winning-game average, 75% starter).
* 6–9: Emerging target (50% bounded winning-game average, 50% starter).
* 10+: Program target (75% bounded winning-game average, 25% starter).
* Learned inputs are limited to ±20% of the starter before blending to avoid abrupt movement.

Win and loss averages describe associations only and must not be interpreted causally.

## Release and rollback

Run `npm test`, `npm run check:syntax`, and `git diff --check`. Validate result capture, a two-device protected-queue smoke test, access isolation, the Winning Chart, and completed-game immutability in a copied Apps Script project.

**Deployment remains a separate manual release step.** This repository change does not access, modify, or deploy Google Apps Script. After approval, an authorized owner must manually create and validate a new Apps Script deployment. Roll back by selecting the previously recorded deployment version; do not edit completed game rows.
