# Midlo Analytics Blueprint

Status: **requirements approved for planning; implementation blocked by source
reconciliation in issue #144.** This document intentionally changes no Apps Script
application source.

## Product rule

Do not collect a number unless it can change a coaching decision. Live tracking is
the small, repeatable layer. Film and external box-score/Hudl data supply the detail
that is too subjective or burdensome to tag during a game.

The intended loop is:

> CoachIQ live capture → possession database → automatic calculations → one or two
> coaching decisions → targeted film review and practice planning

## Questions the system must answer

### During the game

1. How efficient are we and the opponent per possession?
2. Is transition or non-transition offense driving the result?
3. Are paint touches creating better offense?
4. Are transition, paint touches, or right-hand drives hurting our defense?
5. Are turnovers and offensive rebounds changing the possession battle?
6. What is the one adjustment worth communicating now?

### After the game and across the season

1. Why did we win or lose, stated as evidence rather than a narrative guess?
2. What changed over the last game, last 3, last 5, season, and district games?
3. Which live signal deserves a deeper film study?
4. Are team identity standards—run, attack, value it, crash, pressure, no right hand,
   and protect the paint—improving?
5. Which findings are based on enough possessions to influence a decision?

## Two-person live workflow

Each operator owns only one side of the ball. A possession is saved once with one
outcome and any applicable attributes. Points are therefore attached to transition,
paint-touch, and right-hand-drive possessions automatically; they are not stored as
disconnected counters.

### Tracker 1 — Midlo offense

| Control | Exact purpose |
| --- | --- |
| Transition | Toggle when the possession creates an advantage before the defense is set. |
| Paint Touch | Toggle after a controlled touch or penetration in the paint that engages the defense. |
| OREB | Increment each Midlo offensive rebound; it does **not** create another possession. |
| End: 0 / 1 / 2 / 3 | Finish the possession and attach its points to every active attribute. |
| End: Turnover | Finish with zero points and mark a turnover. |

The possession itself is created by the end-result action, so the operator does not
need a separate possession button on every trip.

### Tracker 2 — Midlo defense

| Control | Exact purpose |
| --- | --- |
| Transition | Toggle when the opponent creates an advantage before Midlo's defense is set. |
| Right-Hand Drive | Toggle when a right-hand drive creates penetration or forces help/rotation. |
| Paint Touch Allowed | Toggle for a controlled opponent touch or penetration in the paint that engages the defense. |
| OREB Allowed | Increment each opponent offensive rebound; it remains the same possession. |
| End: 0 / 1 / 2 / 3 | Finish the opponent possession and attach points allowed to every active attribute. |
| End: Forced Turnover | Finish with zero points and mark a Midlo-forced turnover. |

### Why this is condensed

- Offense has two judgment toggles, one repeatable event, and one final outcome.
- Defense has three judgment toggles, one repeatable event, and one final outcome.
- Non-transition and no-paint-touch results are derived; they require no buttons.
- Half-court is initially derived as non-transition rather than separately tagged.
- Man/zone, press type, ball-screen coverage, BLOB/SLOB, lineup, shot quality, and
  detailed action type are deferred to film or later validated integrations.

## Definition of a possession

A possession ends when the other team gains control, points complete the trip and
control changes, a turnover gives up control, or the period ends. The following do
not independently create a new possession:

- an offensive rebound;
- a foul when the same team retains the ball;
- an inbound after a defensive foul;
- a held ball when the possession arrow keeps the ball with the same team; or
- a reset from transition into organized offense.

### Edge-case protocol

| Situation | Tracking rule |
| --- | --- |
| Offensive rebound | Increment OREB and keep the possession open. |
| And-one | Save all points from the basket and made free throw as the possession outcome after the free throw sequence. |
| Shooting foul | Finalize after the last free throw or the rebound that determines control; record total points earned on the trip. |
| Technical free throw | Attribute according to the agreed stat protocol and flag for later review if it is not part of a normal possession. |
| Transition becomes a reset | Transition remains true only if the early attack created an advantage; otherwise treat it as non-transition. |
| End of period | Finalize the possession, including zero points when appropriate. |
| Accidental result | Undo the complete possession, including its points and tags, as one atomic action. |
| Possession-count mismatch | The offense and defense operators compare counts at each quarter; investigate immediately, allowing only a legitimate final-possession difference. |

The tracking manual must include video examples for each judgment tag before staff
use the system in a real game.

## Canonical possession record

The analytics engine should store one immutable record per completed possession,
plus an amendment/void record for corrections. Proposed logical fields:

| Field | Notes |
| --- | --- |
| possessionId / gameId / sequence | Stable identity and game order. |
| teamSide | `Offense` for Midlo possessions or `Defense` for opponent possessions. |
| period / recordedAt / recordedBy | Audit and synchronization context. |
| points | Integer 0–3 for MVP; exceptional values require review. |
| transition | Boolean. Non-transition is derived. |
| paintTouch | Boolean on offense; paint touch allowed on defense. |
| rightHandDrive | Boolean, defense only. |
| turnover | Boolean, offense only. |
| forcedTurnover | Boolean, defense only. |
| offensiveRebounds | Zero or positive integer inside this possession. |
| source | Live, film-reviewed, or imported. |
| voided / supersedesId | Corrections without silently rewriting history. |

Do not model Transition Score, Paint Touch Score, and Right-Hand Drive Score as
separate counters. They are queries over the same possession outcome.

## MVP calculations

All divisions return `—` when the denominator is zero.

### Core efficiency

- Offensive PPP = Midlo points / Midlo offensive possessions
- Defensive PPP = opponent points / opponent possessions
- Net PPP = offensive PPP − defensive PPP
- Turnover rate = Midlo turnovers / Midlo offensive possessions
- Forced-turnover rate = forced turnovers / opponent possessions

### Offense

- Transition frequency = transition possessions / offensive possessions
- Transition PPP = points on transition possessions / transition possessions
- Non-transition PPP = points on non-transition possessions / non-transition possessions
- Paint-touch rate = paint-touch possessions / offensive possessions
- Paint-touch PPP = points on paint-touch possessions / paint-touch possessions
- No-paint-touch PPP = points without a paint touch / no-paint-touch possessions
- OREB per 100 possessions = offensive rebounds / offensive possessions × 100

### Defense

- Transition frequency allowed = opponent transition possessions / opponent possessions
- Transition PPP allowed = transition points allowed / opponent transition possessions
- Non-transition PPP allowed = non-transition points allowed / non-transition possessions
- Paint-touch frequency allowed = paint-touch possessions allowed / opponent possessions
- Paint-touch PPP allowed = points allowed on those possessions / those possessions
- Right-hand-drive frequency = right-hand-drive possessions / opponent possessions
- Right-hand-drive PPP allowed = points allowed on those possessions / those possessions
- OREB allowed per 100 possessions = opponent offensive rebounds / opponent possessions × 100

The MVP must label rebound metrics as counts or rebounds per 100 possessions—not
ORB%/DRB%. True rebound percentages require rebound opportunities or both teams'
offensive and defensive rebound totals from a trusted box-score/Hudl import.

## Dashboard and reports

### Coach-facing game report

The first view contains:

1. Score, estimated/tracked possession counts, offensive PPP, defensive PPP, net PPP.
2. At most three evidence-backed reasons for the result.
3. One recommended coaching emphasis.
4. Links to the possessions/film that support the finding.

The report must distinguish association from causation. For example, “paint-touch
possessions produced 0.31 more PPP” is permitted; “paint touches caused the win” is
not established by this dataset alone.

### Identity dashboard

| Identity | Metrics |
| --- | --- |
| Run | Transition frequency and PPP |
| Attack | Paint-touch frequency, paint-touch PPP, no-paint-touch PPP |
| Value It | Turnover rate and live-ball turnover rate when later available |
| Crash | OREB count/rate initially; ORB% and second-chance PPP after richer data |
| Pressure | Forced-turnover rate; press-specific study later |
| No Right Hand | Right-drive frequency and PPP allowed |
| Protect Paint | Paint-touch frequency and PPP allowed |

### Time filters

- Last game
- Last 3 games
- Last 5 games
- Season
- District

Every metric must show its possession/sample count. Small samples should display as
“insufficient” or “early signal” rather than producing an authoritative coaching
recommendation. Thresholds remain configurable until tested on real games.

## Data-quality controls

1. Operators are assigned to offense or defense and cannot accidentally tag the
   other side.
2. An outcome finalizes exactly one possession and clears the next possession form.
3. Undo reverses the entire possession atomically.
4. Each quarter shows offense and defense counts side by side.
5. A discrepancy warning appears when counts differ by more than one.
6. Tags have one written owner/definition and practice video examples.
7. Reports expose sample sizes and never divide by zero.
8. Imported Hudl/box-score data is labeled by source and never silently mixed with
   live estimates when definitions differ.

## Phased roadmap

### Phase 0 — now, while reconciliation is deferred

- Approve this tracking dictionary and edge-case rules.
- Create tracker training examples and one-page offense/defense cheat sheets.
- Define the desired game report and identity-dashboard mockups.
- Select one previously charted showcase game as the acceptance dataset.
- Do not implement against the known-stale Apps Script source.

### Phase 1 — after live source is reconciled

- Implement the two role-specific possession capture screens.
- Persist canonical possession records with offline protection and atomic undo.
- Build live quarter/halftime summaries from possession records.
- Build automatic game report and Last Game/3/5/Season/District views.
- Validate results against one showcase game and film.

### Phase 2 — trusted external data

- Add an explicit import/mapping workflow for available Hudl or box-score exports.
- Calculate Four Factors, true ORB%/DRB%, shot profile, and lineup measures only
  when their required source fields are present and definitions are verified.
- Never duplicate live entry for data already supplied reliably by an integration.

### Phase 3 — Film Lab

- Tag selected studies rather than every possible category every game.
- Add defense, press, action, ball-screen coverage, drive direction, shot location,
  shot quality, advantage creation, BLOB/SLOB, and lineup attributes.
- Connect every aggregate to its underlying possessions and clips.

### Phase 4 — decision support

- Compare team baselines and opponent-specific samples.
- Surface trends with sample-size warnings.
- Suggest film questions and practice priorities, not unquestionable conclusions.
- Test coaching beliefs such as pressure, run-and-jump, coverage, zone, crash rules,
  and lineup roles using team evidence plus film review.

## Acceptance criteria for the first build

1. One offense operator and one defense operator can chart a full test game without
   scrolling through a large stat catalog.
2. Most possessions require only applicable tag taps plus one outcome tap.
3. Offensive rebounds never inflate possession totals.
4. Points automatically attach to every active possession attribute.
5. The two possession counts remain reconcilable by quarter.
6. The game report reproduces hand-checked PPP and rates for the showcase game.
7. Every recommendation displays the supporting numerator, denominator, sample
   size, and linked possessions.
8. No advanced live tag is added unless a coach names the decision it will change.

## Decisions still needed before implementation

1. Approve the exact definition of “transition created an advantage.”
2. Approve the exact definition of a meaningful paint touch.
3. Decide how technical/free-throw-only events affect possession points.
4. Decide whether a forced turnover includes every opponent turnover or only those
   credited to Midlo pressure/action.
5. Identify which Hudl/box-score export products are actually available to the
   program and obtain sample files before designing an importer.
6. Choose the showcase game and its hand-verified possession totals for acceptance.
