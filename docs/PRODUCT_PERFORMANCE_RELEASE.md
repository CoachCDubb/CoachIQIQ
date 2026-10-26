# CoachIQ performance and product finish — build 2026.10.25.1

This release preserves the approved tag → points possession flow, automatic counts, kills, roster credit, tracking queues and access checks. The implementation is ready for review; it has not been installed in Apps Script or verified visually in the live dialog.

## Demonstrated performance improvements

These are regression-tested service-call counts, not claims about production latency:

| Path | Before | After |
| --- | --- | --- |
| Historical benchmarks for 40 completed games | 40 full possession-sheet reads | 1 batch read; 0 for a matching user-cache hit |
| Four game-setup lists | Four independent Games-sheet reads | One shared snapshot |
| Completed-game history | Decode all completed report JSON | Decode the latest 12 visible valid reports |
| Player edit | 7 individual field writes | 1 contiguous row write |
| Complete 40 session evaluations | 80 individual writes | 2 range-list writes |
| Game/analytics schema checks within a request | Repeated by nested services | Once per invocation; failed initialization remains retryable |
| Repeated unchanged objective/benchmark markup | Replace DOM and lose focus | Preserve DOM when the rendered source is unchanged |

Benchmark cache lookups follow current access, season, archive and result filtering. Keys incorporate completed-game identity/result/update metadata; cache failures fall back to fresh calculations. Only immutable completed-game benchmarks are cached, not live possession state. Existing record locks, idempotency and protected/offline queues remain in place.

Dashboard, roster, session/evaluation, scouting, film, training, settings and season-history routes remain covered by the repository regression suite. Shared navigation uses an accessible opening indicator, and background template preloading yields to initial page work. This does not establish that every device/network/storage path is maximally fast.

## Professional presentation

Shared typography, headings, controls, focus indicators, table readability and reduced-motion behavior are aligned without replacing school colors or logos. The mobile viewport is declared explicitly.

Timeout, period and halftime reports use one hierarchy: report identity and matchup, tracked score, next-possession recommendation, keep/fix priorities, evidence, selected-tag totals, player contributions and full possession log. Detailed context and program benchmarks are expandable. Reports support Escape, focus containment/return, persistent footer actions and print expansion/restoration. Postgame reports use the final confirmed score.

## Installation after review and merge

Back up the current Apps Script source and record the existing deployment version/URL. Replace these **10 existing files in full from the same merged commit**:

- AnalyticsService.gs
- EvaluationService.gs
- Game.html
- GameService.gs
- Index.html
- PlayerService.gs
- Scripts.html
- SheetService.gs
- Styles.html
- SystemHealthService.gs

Do not copy tests or tools into Apps Script. This release changes no OAuth scopes, external services or schema-version target. Schema target stays 2. Analytics columns introduced by the earlier possession release remain append-only.

Save, close/reopen CoachIQ, and check Settings → System health for build **2026.10.25.1**. Resolve errors before using a real game. Once the following checks pass, edit the **existing** web-app deployment, choose New version and deploy; preserve the existing URL.

## Live release checks still required

Use disposable data and test both the Sheets dialog and deployed web-app URL:

1. Open Dashboard, Players, Sessions, Evaluations, Scouting, Game, film review, Coach Training, Settings and Season History within each tester's allowed scope. Check page opening, readable controls and absence of horizontal clipping.
2. Edit a disposable player, evaluate a session and finish it. Check values, timestamps, audit entries and unaffected rows.
3. Create an analytics-only game. Record Paint Touch → 2, OREB → 3, three defensive stops, a scored defensive possession, a custom tag and a score-only correction.
4. Check immediate feedback, automatic side switching, queued/recovered taps, undo and an authorized second device. Verify counts and saved state after refresh.
5. Open Timeout, End Quarter and Halftime reports. Check current score, evidence, kills, matchup names, priorities, all possessions and expanded sections.
6. Use a keyboard to open/close a report, cycle focus and return to the tracker. Print/export a report and verify all details, pagination and restored on-screen expansion states.
7. Repeat the reports at a narrow phone width and on the intended iPad, including a short landscape dialog. Verify scrolling, footer actions, long names and school colors.

## Verification limits

JavaScript syntax checks run in process without spawning one Node subprocess per file. Performance regressions exercise cache invalidation/authorization/fallbacks, service-call counts, write boundaries, DOM reuse, report scoring, focus and print behavior. An outdated optional-header assertion was replaced with a workbook-layout behavior test.

The full suite has one environment-only failure: Node's Python subprocess call in source-reconciliation.test.js reports EPERM. The same comparison tool was executed directly against equivalent fixtures and returned the expected changed/identical/added-file result. Live Apps Script timing and browser/device visual verification remain pending.

Rollback: select the previously recorded web-app deployment version and restore the matching Apps Script source. Do not modify completed game records to roll back this release.
