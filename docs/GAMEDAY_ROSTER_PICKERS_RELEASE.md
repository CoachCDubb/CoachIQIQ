# GameDay roster choices and names — 2026.10.30.4

- Our player and Opponent player objectives now use a native roster dropdown displaying #number · Name, rather than relying on a numeric input/datalist. Switching teams resets the player selection. A named player saves the existing jersey/name goal metadata. Enter another jersey number remains available; a team with no roster shows a clear message and the manual field.
- Objective cards resolve names from the relevant game roster, falling back to saved goal labels or the jersey when no name is available.
- Possession outcomes, play-detail labels, the last-possession bar and report player totals display names with jerseys. Own and opposing players with the same jersey resolve against their respective rosters. FT outcomes include the credited shooters. A missing name stays number-only; no name is inferred.
- Forced-turnover credit remains two steps. Step 1 asks who forced it on our team. Step 2 explicitly says Opponent and asks which opponent lost it. A missing opponent roster now explains why there are no roster buttons and points to the manual jersey field. Selecting our player only and leaving either participant unassigned remain available.
- Rosters are the copies saved in that game. This release does not add automatic roster syncing or edit the source CoachIQ workbook.

## Update

1. Merge this PR and wait for Publish CoachIQ GameDay to finish successfully.
2. In GameDay online, Check again / Prepare for offline, close all GameDay windows, and reopen the same app. Verify 2026.10.30.4.
3. No new Apps Script files are required for this UI update. Keep the AnalyticsService.gs update from PR #211 for turnover-credit imports.
4. In a practice game with rosters, select Our player and Opponent player in objective setup and check the named dropdowns. With Turnover prompt On, record a defensive turnover, select our player, then the opponent. Check named possession history. Test airplane-mode close/reopen on the actual device before courtside use.

## Validation

124 GameDay tests and 349 root tests pass, plus syntax/diff checks. Player label tests cover team-specific lookup and missing-roster fallbacks. The browser fixture uses actual app modules and fake-indexeddb to check both objective roster selectors, manual alternatives, named scorer/turnover history, opponent step with a roster, and manual opponent entry without a roster. No page errors or modal horizontal overflow at 1024, 768 and 390 pixels. Actual iPad Safari and the user's live deployment remain device checks.
