# Live source reconciliation — 2026-10-01

## Safety record and decision

- **Raw evidence branch:** `reconcile/live-raw-2026-10-01-clasp`
- **Raw evidence commit:** `b697371a5d9f10c83407550c231d97d3c0c11847`
- **Reviewed baseline (`main`) commit:** `cc5e38b133fbcfdad4bd0f85a61fd6714d156651`
- **Reviewed branch:** `reconcile/live-reviewed-2026-10-01`
- **Result:** retain the current reviewed `main` source and add this audit record. The raw
  snapshot contains no snapshot-only production implementation. Its six differences are
  either the absence of reviewed GitHub features, equivalent JSON formatting, or final
  newline formatting.

PR #149 remains immutable raw evidence and must never be merged. It was not modified,
rebased, resolved, closed, or merged during this review. No command that writes to Apps
Script was run. **Nothing was deployed to Google Apps Script.** Any production deployment
requires a separate reviewed release step.

## Inventory completeness

The source comparison tool considers top-level `.gs` and `.html` files plus
`appsscript.json`. The inventory recorded in the copied-project snapshot commit contains
exactly **60 source files**: 31 `.gs`, 28 `.html`, and one manifest. The isolated checkout
of current `main` contains the same 60 names. There are no names only in the snapshot and
no names only in `main`. This confirms that the full snapshot inventory matches the
recorded copied-project inventory; repository documentation, tests, tools, backups, and
the extensionless `Read me` are intentionally outside the Apps Script source inventory.

Complete matching inventory:

```text
AI.html
AnalyticsService.gs
App.gs
AttendanceService.gs
AuditService.gs
BackupService.gs
BrandAssets.html
CategoryService.gs
CoachService.gs
CulturePointsService.gs
Dashboard.html
DashboardJS.html
DashboardService.gs
EvaluationService.gs
Evaluations.html
FilmService.gs
Game.html
GameService.gs
GettingStarted.html
Header.html
Index.html
InsightService.gs
Insights.html
Leaderboard.html
Onboarding.html
OnboardingService.gs
PDFService.gs
PlayerModal.html
PlayerModule.html
PlayerProfile.html
PlayerSeasonService.gs
PlayerService.gs
Players.html
PlayersJS.html
PracticeSessionService.gs
ReportService.gs
RewardService.gs
Scouting.html
ScoutingService.gs
Scripts.html
SeasonHistory.html
SeasonHistoryViewerService.gs
SeasonRolloverService.gs
SessionHistoryService.gs
SessionLoaderService.gs
SessionPolicyService.gs
Sessions.html
SessionsJS.html
Settings.html
SettingsJS.html
SettingsService.gs
SharedJS.html
SheetService.gs
Sidebar.html
Staff.html
Styles.html
SystemHealthService.gs
TimelineService.gs
UtilityService.gs
appsscript.json
```

The comparison found 54 byte-identical files and six different files. In particular,
the high-risk review areas `App.gs`, `BackupService.gs`, `Settings.html`,
`SettingsJS.html`, `SettingsService.gs`, and `SheetService.gs` are byte-identical.
Authentication/access helpers in `App.gs`, `UtilityService.gs`, and the service files are
also identical except for the explicitly reviewed Live Game authorization-adjacent guard
in `AnalyticsService.gs`. No file is missing on either side, and no file was removed merely
because it was absent from one side.

## Classification of every difference

Each meaningful difference has exactly one classification below. “Retain” means keep the
version already reviewed and merged into current `main`; it does not authorize changing
the live Apps Script project.

| File and meaningful difference | Classification | Decision and rationale |
| --- | --- | --- |
| `AnalyticsService.gs`: `main` rejects possession writes when analytics is disabled; the raw snapshot lacks this guard. | **Reviewed GitHub-only change to retain** | The guard is the server-side half of the reviewed optional-tracker feature. Retaining it prevents a disabled tracker from accepting writes. The remaining byte difference is only a final newline. |
| `GameService.gs`: `main` stores `Tracker Mode`, gates objective validation, returns mode flags, supports period advancement without objectives, and builds a valid postgame report when optional trackers are off; the raw snapshot requires objectives and lacks these paths. | **Reviewed GitHub-only change to retain** | These changes form the reviewed optional analytics/objectives contract and preserve compatibility for legacy games through `getLiveGameTrackerMode_`. Taking the raw file would silently remove reviewed behavior. The remaining byte difference is only a final newline. |
| `Game.html`: the raw snapshot has the always-on objective setup and older tracker controls; `main` adds independent tool choices, objective-aware controls, clearer possession tags and rebound correction, and the PR #152 winning-target chart markup. | **Reviewed GitHub-only change to retain** | The optional-tool UI is paired with the retained server contract. The clarity/rebound work and winning chart were reviewed after the snapshot branch point. The raw markup contains no additional element or behavior absent from `main`. |
| `Scripts.html`: the raw snapshot has the earlier always-on setup and synchronous possession save flow; `main` retains optional-tool rendering, analytics recovery/background queueing, corrected tags/rebounds, queue flushing before checkpoints/finish, and PR #152 chart calculation/rendering. | **Reviewed GitHub-only change to retain** | This is the semantic resolution of the PR #149 conflict: keep the reviewed client state machine rather than textually accepting either side. It preserves protected offline writes and the complete optional-mode server/UI contract. The raw script contains no snapshot-only function. |
| `Styles.html`: the raw snapshot lacks optional-tool styles and the chart, and uses the earlier possession layout; `main` contains optional-state visibility rules, corrected rebound controls, explanatory live text, and PR #152 chart/layout rules. | **Reviewed GitHub-only change to retain** | This is the semantic resolution of the PR #149 conflict. The retained rules correspond to retained markup and scripts; blindly taking the raw stylesheet would break or hide reviewed UI behavior. The remaining byte difference is only a final newline. |
| `appsscript.json`: empty `dependencies` formatting, `webapp` key order, and final newline differ; all values are identical. | **Production source to preserve** | Preserve the snapshot's effective manifest semantics: Chicago time zone, no dependencies, `USER_ACCESSING`, `ANYONE`, Stackdriver logging, and V8. Keep `main`'s normalized formatting because JSON key order/empty-object layout has no runtime effect. |
| `SourceExport.gs`: absent from both complete inventories. | **Temporary API-test material to omit from the reviewed branch** | Issue #144 records it as a temporary source-export/API test. Its absence from the copied-project snapshot proves it is not production source that must be introduced into the reviewed tree. This decision changes neither the raw evidence nor the live project. |
| Temporary `script.projects` OAuth authorization: absent from both manifests. | **Temporary API-test material to omit from the reviewed branch** | Issue #144 records that scope as temporary and that the API request still failed with 403. The complete raw manifest confirms it was not a legitimate copied-project scope. |

There are **no unresolved differences** and therefore no reconciliation blocker.

## Manifest scope review

Neither manifest has an explicit `oauthScopes` array. The snapshot and `main` have the
same effective manifest values. Consequently:

- no legitimate explicit scope is lost;
- `https://www.googleapis.com/auth/script.projects` is not added because it was temporary
  API-test material and is absent from the complete raw snapshot;
- no inferred runtime scope is narrowed or otherwise changed by this reconciliation; and
- the reviewed result keeps `main`'s formatting-only representation of the same manifest.

## PR #152 preservation

PR #152, **Add live winning targets chart**, remains preserved. The reviewed result keeps:

- chart markup in `Game.html`;
- calculation, rendering, initial rendering, and optimistic-tap refresh logic in
  `Scripts.html`;
- chart and dense desktop layout styles in `Styles.html`; and
- the regression coverage in `tests/live-game-confidence.test.js`.

The test suite reports `live tracker shows a tap-updated winning targets chart` as passing.

## Read-only comparisons and verification

Isolated detached worktrees were used at `/tmp/coachiq-main` and `/tmp/coachiq-raw`.
Neither was an Apps Script upload target.

| Command | Result |
| --- | --- |
| `python3 tools/compare_apps_script_sources.py --baseline /tmp/coachiq-main --candidate /tmp/coachiq-raw` | Passed as an audit: 60 vs. 60; no one-sided files; six explained differences; 54 identical files. |
| `npm test` | Passed: 81 tests, 81 passed, 0 failed. npm emitted only its environment warning about the deprecated `http-proxy` config. |
| `npm run check:syntax` | Passed: Apps Script and browser JavaScript syntax OK. npm emitted the same environment warning. |
| `python3 tools/compare_apps_script_sources.py --baseline /tmp/coachiq-raw --candidate .` | Passed as the reviewed-result audit: 60 vs. 60; no one-sided files; the same six classified differences; 54 identical files. |
| `git diff --check` | Passed with no whitespace errors. |
| `rg -n '^(<<<<<<< .+\|=======\|>>>>>>> .+)$' --glob '!backups/**' .` | Passed with no conflict markers. |
| `rg -n 'liveWinningTargets\|renderLiveWinningTargets\|live-winning-target' Game.html Scripts.html Styles.html tests/live-game-confidence.test.js` | Passed; confirms all four required PR #152 files retain the chart implementation/test. |

The complete raw-to-reviewed source diff was inspected, including both historically
conflicted files (`Scripts.html` and `Styles.html`). There is no snapshot-only production
behavior silently removed, no reviewed `main` functionality silently removed, no temporary
export code, and no unnecessary explicit OAuth scope in the reviewed result.

## Deployment restriction

This reconciliation was repository-only. It did not edit the live or copied Apps Script
project, and it ran no `clasp push`, `clasp deploy`, Apps Script write API, or other
deployment command. **This reconciliation does not deploy anything to Apps Script.**
Production deployment requires a separate reviewed release step.
