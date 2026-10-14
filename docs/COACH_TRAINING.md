# Coach Training

Coach Training is a shared general-basketball curriculum: 18 fictional decision challenges across offense, defense, analytics, game management, practice design, and coach communication. Each track includes foundation, applied, and advanced challenges. No film library, external AI service, API key, or dependency installation is required.

## Coach workflow

Open **Coach Training** in the navigation. Continue learning selects the first unreviewed challenge in the selected track, then prioritizes the lowest latest score and oldest review. Random challenge selects within the chosen track. Choose a response, explain the decision in 20–1200 characters, and submit.

Feedback compares all four choices, explains the tradeoffs, identifies what to measure, provides a practice application, and offers a staff discussion prompt. Reasoning is saved for self-reflection and is not automatically graded. Choice scores describe fit to the stated scenario; they are not certification, a universal ranking of coaching strategies, or a measure of staff competence. Competition rules and player context must be checked before using a scenario in real games.

The home screen tracks reviewed challenges and strong latest decisions (80% or higher). A previous best does not hide a weaker latest decision. Retrying supports learning; it is not a proctored assessment. Answer order is randomized and answer explanations are returned only after a valid submission.

## Access and persistence

Configured programs allow registered staff, including assistants without session-management privileges. Unassigned users are rejected by server endpoints. A signed-in Google identity is required for progress storage, including in legacy unconfigured programs. If Apps Script cannot expose the active identity, the page asks the coach to sign in instead of creating a shared progress record.

Progress is held in Apps Script User Properties, with keys scoped to the active workbook and curriculum version. Each lesson has its own bounded record, containing the latest choice, reasoning, latest/best score, attempt count, and timestamp. The app exposes only the current user's progress, with no staff leaderboard or student-data access. A user lock serializes writes. The most recent attempt ID is retained to prevent immediate request retries from inflating attempts.

## Installation and validation

Deploy the reviewed source through the repository's normal Apps Script workflow. Include the new **CoachTrainingService.gs** and **CoachTraining.html**, and updated **App.gs**, **Scripts.html**, **Sidebar.html**, and **Styles.html**. There are no new workbook sheets, Google scopes, triggers, or credentials to configure. Reopen CoachIQ after saving the source. Source changes in GitHub do not update an existing Apps Script project automatically.

Run `npm test` and `npm run check:syntax`. Server regression tests cover the curriculum, grading, validation, replay behavior, access restrictions, private workbook/user storage, and lock release on failure. Local Chromium browser validation exercises loading, answering, feedback, persistence, track filtering, and random challenges at 600, 1024, and 1366 CSS pixels. These checks use mocked Google services; they do not establish live Apps Script authorization or Safari behavior.

Before live use, verify in a safety copy:

1. Registered head coach and assistant can open the tab; an unassigned account cannot use its endpoints.
2. Submit a challenge and reopen the app; the account sees its saved reflection and latest progress.
3. A different coach sees separate progress. A different workbook does not inherit progress.
4. A failed save leaves the answer available for retry, and a successful immediate retry does not duplicate an attempt.
5. Tablet users can scroll through all options, feedback, and next-challenge controls.

At implementation, the existing `adaptive-analytics-benchmarks.test.js` Game Result header assertion still fails on main. It is unrelated to training and was left unchanged.

## Game decision lab

**Start game simulation** creates a three-decision session. Opening score margin and clock vary, and an offensive response routes the coach to a different tactical problem before a final-possession decision. These are explicit teaching branches, not predictions that a coaching choice guarantees a basket or a stop. The reviewed scenario engine has finite templates and variations; it does not promise unlimited unique questions. The final decision intentionally jumps to a new late-game state.

The latest simulation is stored privately in User Properties for this workbook and can be resumed with **Resume last simulation**, including its completed debrief. Starting another simulation replaces that session. Simulation reflections accept 20–600 characters to keep the bounded three-decision record within Apps Script's per-property limit. Replay of the immediately preceding round returns the saved decision rather than advancing twice. The debrief averages choice-fit scores and preserves the three reflections; written reasoning is not automatically graded.

**Review a recorded game** requires the existing `run_sessions` capability and uses accessible, current-season, non-archived completed reports. Only basketball reports can become cases. Report evidence includes saved objective summaries and, when present, positive charted possession counts with recorded PPP. It never infers a missing clock, foul situation, lineup, film event, or possession sequence. Reports with insufficient evidence display an actionable message instead of a fictional reconstruction. The activity asks the coach to choose an evidence-review approach and reflect on a testable adjustment; it is not automatic diagnosis of the actual game.

The latest game case and its reflection are retained as a bounded private record, separate from the 18 curriculum lessons and simulation session. Opening a new case replaces the previous case; these activities do not inflate curriculum completion. Access is rechecked on case submission. Reading cases does not initialize or repair game sheets.

Additional validation covers branching, stale-round rejection, replay, three-step completion, cross-account isolation, and case evidence/access handling. Local browser checks run the complete three-round simulation and debrief at 600, 1024, and 1366 CSS pixels. Actual Google authorization, saved report compatibility, and iPad Safari still require a safety-copy smoke test.
