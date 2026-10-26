# Compact possession reports — 2026.10.25.2

The coaching brief stays short as games grow. Offense and defense have separate game-to-date summary cards. The play-by-play is collapsed by default and created only when opened. Review Offense or Defense independently, filter by period, or choose Timeline to see chronological alternation. Render ten possessions per page; retain every saved possession and stable side/game numbering. Higher-priority insights are shown first, with up to four expanded highlights and remaining patterns available on demand. Player contributions and extended tag tables are expandable.

Printing defaults to no possession appendix. Select **Include every possession in printout** to append all offensive and all defensive possessions, regardless of screen filters/pagination. Closing print restores the prior view and expansions.

After review/merge, replace these three existing Apps Script files from the same merged commit:

- Scripts.html
- Styles.html
- SystemHealthService.gs

Save, reopen CoachIQ and confirm build **2026.10.25.2** in Settings → System health. Test a long disposable game: open a timeout report, expand the log, switch sides and periods, navigate pages and verify numbering/counts. Print once without the appendix and once with it. Confirm the full appendix includes all possessions and the screen returns to its previous filter/page. Check a narrow/mobile viewport before updating the existing web-app deployment. This update does not alter stored possession records or require reentering games.

Syntax checks and focused pagination/printing tests pass. Live browser/device verification remains pending. The repository suite retains the previously documented environment-only Python subprocess restriction in source-reconciliation.test.js.
