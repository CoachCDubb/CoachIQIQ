# CoachIQ Live adaptive possession benchmarks — 2026-10-04

Build **2026.10.04.11** adds adaptive, team-specific guidance to Possession Analytics while leaving the manually configured Winning Chart unchanged.

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

Exact team-level game-plan objectives for paint-touch possessions, turnovers,
offensive rebounds, transition points, and points now derive from the same canonical
possessions. Linked cards are labeled `Auto from Possession Analytics` and omit
manual +/- controls, preventing duplicate entry and double counting. Percentage,
player-specific, custom, and unsupported objectives remain manual. No outcome preset
buttons were added.

As an additional compatibility guard, sheet validation removes `Opponent Roster`,
`Tracker Mode`, and `Game Result` from positional header checks even if a future
merge accidentally places one in the fixed header list. These fields are always
located or appended by name, so an existing column 26 cannot block Live Game.

The live helper text now accurately tells operators that compatible objectives update
automatically and that +1 is only needed on objective cards that retain manual buttons.

Recent Activity now combines saved possession outcomes with manual objective taps.
Possession rows identify offense or defense, points or turnover outcome, selected
context tags, rebounds, and period; the newest possession can be undone from the same
activity list without changing the device's offense/defense assignment.
On desktop, Recent Activity stays in a compact horizontal strip so a full activity
history cannot collapse Possession Analytics or the game-plan cards.

Live and completed game lists now include a protected Archive action for test and
showcase games. Archiving appends and sets the named `Archive Status` field, hides the
game from normal Live Game lists, excludes it from adaptive benchmarks and prior-game
objective intelligence, and records an audit event. Linked possessions, events,
reports, scores, and completed-game fields are preserved rather than deleted.

Selecting Track Offense or Track Defense now opens a live `Tracking this possession`
summary. It names the active side, defaults to half court, and immediately reflects
transition, paint-touch, right-hand-drive, and rebound selections before the operator
chooses the possession outcome.

During game setup, the Possession Analytics tool now lists every category it already
collects so coaches do not add duplicate objectives merely to capture the same data.
Compatible team-level objectives are visibly labeled as automatic and explain that
they should remain in the plan only when the coach wants a Winning Chart target card.

The live possession tracker now auto-switches to the other side after an outcome is
saved. The setting is local to each device and can be turned off for two-operator
workflows. An Undo selection control reverses the most recent unsaved tag or rebound
change, while Undo possession continues to reverse an already saved possession.

Analytics-only games now remain in Resume a Saved Game after Exit. The resume list
recognizes either enabled tracker instead of requiring a non-empty Winning Objectives
plan, so exiting an analytics-only game no longer makes the saved game appear missing.

Postgame reports now show the authoritative final score plus a full offense/defense
possession breakdown: points, possessions, PPP, transition and paint-touch totals and
PPP, turnovers or forced turnovers and their rates, offensive rebounds and per-100
rates, and right-hand-drive results allowed. Analytics-only games no longer display a
misleading `0 of 0 objectives` scorecard. Existing completed reports are enriched at
read time from their preserved possession rows and final-score fields.

Dead-ball and score-adjustment tools now cover live-game exceptions without corrupting
PPP. Retain ball keeps the unsaved possession and its tags active; Change possession
ends it at zero points without labeling it a turnover. Score-only +1/−1 adjustments
handle technical free throws and corrections in the displayed score while remaining
outside possession PPP. Those adjustments use the protected tap queue and Recent
Activity undo. On iPad-sized landscape layouts, Recent Activity remains visible even
when the Winning Chart contains a dense objective plan.

Recent Activity is now controlled by either active tracker, rather than only by
Game-Plan Objectives. Analytics-only games therefore show saved possessions on iPad
and desktop, and dense plans reserve a compact Recent Activity row at every desktop
viewport width instead of relying on an iPad width guess.

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
