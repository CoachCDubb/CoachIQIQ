# Separate offense and defense tracking choices

Each game can now hold independent offense and defense tag lists (up to six per side, including an empty points-only list). Auto-switch displays the active side's tags. Paint touches, rebounds and scoring actions on defense describe the opponent's offense; defensive deflections belong to our team.

Existing games/preparation files with one shared list keep that list on both sides until edited. A focus change affects future possessions only. Every finished possession saves the tags enabled for that side at the time, so untracked paint touches remain unknown rather than being counted as no paint touch. Saved possession events, statistics and corrections remain intact.

## GameDay (hosted version 2026.10.26.7)

1. Reconnect to internet, reopen GameDay, wait for its update and reload. Confirm version **2026.10.26.7** and run Prepare for offline again.
2. Open a live practice game with no unfinished tagged possession.
3. Open **Game tools → Choose tracking tags**.
4. Choose **Our offense** and select its tags. Choose **Our defense** and select a different list. Custom choices apply to the selected side.
5. Choose **Save offense & defense**. Tab switching retains edits until you save both lists.
6. Record an offensive outcome and confirm auto-switch shows the defense tags. Record a defensive outcome and confirm offense tags return.

New GameDay setup and imported preparation dialogs also expose both tabs under **What matters tonight**. Quick Stats can offer tags from either list. Local storage, backups and completed-result exports preserve the separate choices. Finish the current possession before saving new tracking lists. Export-locked games cannot be changed.

## Original CoachIQ

After merging the PR, update six Apps Script files: `GameService.gs`, `OfflineGameService.gs`, `Scripts.html`, `Game.html`, `Styles.html`, and `SystemHealthService.gs`. Save, close/reopen the Sheets dialog, and update your existing web-app deployment to a new version if used. Source build **2026.10.26.14**.

In the live tracker, open **Change offense & defense tags**, choose **Our offense** in **Editing tags for**, and make selections. Switch to **Our defense**, choose its tags, then **Save offense & defense**. Switching the editor side preserves unsaved choices; the save writes both lists atomically. Finish the current possession first.

Original CoachIQ setup still supplies shared starting tags. You can split them in its live editor before recording any plays, then download that unused setup's preparation on the desired device. GameDay can also split them after importing. Preparation exports and completed-game imports carry side-specific choices alongside the existing compatibility list. Existing staff/team permissions and completed-game protections remain enforced. Transfers remain file-based.

## Verification

45 offline tests pass, including auto-switch coverage, legacy fallback, independent lists, points-only tracking, immutable earlier coverage, unfinished/locked guards, preparation/backup round trips, and the union of Quick Stats choices. Server tests verify atomic side saves, permissions/lock guards, imported configuration and duplicate retry hashes. Browser UI fixtures with simulated persistence verify GameDay setup/edit tabs, auto-switch, correct recorded coverage and retained edits in the original CoachIQ editor; no JavaScript errors were reported. Syntax/diff checks pass. Full original suite: 311/312 pass; the existing Python subprocess source-reconciliation test reports `spawnSync EPERM` in this environment. Physical iPad/offline acceptance testing remains required after updating.
