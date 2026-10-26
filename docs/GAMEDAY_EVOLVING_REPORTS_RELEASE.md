# GameDay 2026.10.26.10: reports that follow the game

GameDay reports now distinguish the interval since the previous report, the current period or halftime, recent possessions, and game-to-date totals. The headline uses the latest recorded evidence instead of repeatedly choosing the same cumulative finding.

## What changes

- Compare the latest five completed possessions per side with the previous five, with exact points, possession counts, PPP and small-sample context.
- Surface current turnover runs, paint entries, offensive rebounds allowed, foul/free-throw patterns, credited player impact and tracked scoring tags. Prepared scouting responses appear when their tracked evidence applies.
- Identify supported priorities, new concerns and alerts that have eased. Reopening without new data explicitly says the evidence is unchanged; it does not invent a fresh recommendation.
- Save report checkpoints locally and in backups. Corrections and score-only adjustments are distinguished from new possessions. Draft possessions are excluded.
- Keep final reports grounded in the whole game, while timeout reports prioritize current evidence.

These are offline statistical insights, not calls to a cloud AI model. Associations do not prove that a tag caused scoring. Unknown or untracked events are not treated as absent. Player summaries require credited events.

## Publish and update the iPad

1. Merge this pull request on GitHub.
2. Wait for **Publish CoachIQ GameDay** in Actions to finish with a green check.
3. At a break, save a backup of any real game to Files.
4. While online, open the existing GameDay app at its current address and choose **Check again** (or **Prepare for offline**). Allow the update to finish, then close and reopen. A waiting service worker may require closing all GameDay windows before reopening.
5. Confirm the footer says **2026.10.26.10**. If it still shows the older version, leave it online briefly and close/reopen again.
6. Run **Check again** in the installed app. Try a practice timeout report and an airplane-mode close/reopen test before the next game.

No Apps Script files need copying for this release. Keep the existing app address and website data; do not reinstall or clear storage. Existing games remain saved locally.

## Validation

All 77 offline-app tests pass. Browser fixtures using the compiled interface and simulated persistence verified changing report priorities, an easing turnover alert, unchanged-report deduplication, period scope, responsive widths and complete two-page PDF output. Storage behavior is covered separately with IndexedDB tests. Physical Safari/iPad testing remains a device check after deployment.
