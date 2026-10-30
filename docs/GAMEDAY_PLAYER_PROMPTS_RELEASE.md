# GameDay optional player prompts — 2026.10.30.2

## Behavior

- Scorer prompt and Defense prompt are independent per-game switches, default Off. They appear beside Auto-switch. Existing games and backups remain usable.
- With Scorer prompt On, an offensive scoring outcome saves first, then asks who scored if any scoring play lacks a jersey. One roster tap credits the unassigned scoring plays. Already credited shots, paint touches, and rebounds retain their credit. FT misses without a jersey receive the selected shooter's jersey too. FT-only offensive possessions prompt only when at least one FT was made and uncredited.
- With Defense prompt On, a defensive possession containing a made 2 or 3 saves first, then asks for our defender or Team / shared, followed by one primary breakdown reason. The opponent scorer's jersey is separate. FT-only possessions and stops do not trigger this defensive prompt; an and-one basket does.
- Close, Escape, or Skip keeps the already saved basket and leaves attribution unassigned. If the app closes mid-prompt, Resume game restores the prompt. Attribution must be resolved or skipped before another possession can finish. Auto-switch remains independent and applies before the prompt.
- Game tools → Player prompt settings edits the two switches and 1–12 breakdown labels (40 characters each). Saved labels retain their original wording. Defaults include Beat off dribble, No help, Bad closeout, Missed rotation, Lost cutter, Transition breakdown, and No box out.
- Review possessions → Player / breakdown can add or correct attribution during a live game. Reassigning an offensive possession there applies the chosen player to all scoring plays; use Edit possession for different individual FT shooters. Finished games use the existing detailed correction editor; exported games remain locked.
- Reports include credited offensive points / recorded offensive points and tagged defensive basket possessions / all defensive basket possessions, grouped by reason and our player or Team / shared. These are coach-entered observations on tagged possessions, not a defensive rating or inferred fault. One reason describes the possession, including possessions with both a basket and FTs.
- Player attribution uses the same serialized IndexedDB save queue. Score, possession count, PPP, and other play credits are unaffected. Changes have before/after correction history. Backups retain prompt settings and pending state.

## CoachIQ transfer

`defenseBreakdown` is a canonical play event with a validated label, our defender jersey (optional), and `playerSide: us` on defensive possessions only. Maximum one per possession; a made basket is required. This event never awards points or other player stats. It travels through the existing OfflineGameService import and stored play-event JSON, with retry/conflict checks unchanged. CoachIQ's tracked-pattern intelligence includes the recorded reasons and coverage. No new spreadsheet columns are needed.

Update **AnalyticsService.gs** in each CoachIQ Apps Script project that will import new breakdown events, before importing these games. OfflineGameService.gs must already include the PR #209 objective support if those goals are used. Do not revert that file. A copied program has its own Apps Script project and needs its own update. If accessing CoachIQ through a deployed web-app URL, save and deploy a new version.

## Install and device check

1. Merge this PR and wait for Publish CoachIQ GameDay to turn green.
2. Copy the complete updated AnalyticsService.gs into the matching Apps Script file and save. Update the web-app deployment version if applicable.
3. In the existing GameDay app while online, use Check again / Prepare for offline. Close all GameDay windows and reopen the same app. Confirm version 2026.10.30.2 on the Games screen. No data clearing or reinstall is needed.
4. Use a practice game with a roster. Turn both prompts On. Score 2, select a scorer, then allow 3, select our defender and a reason. Check Player totals and the new report section. Skip another prompt and confirm its score remains. Customize reasons through Game tools.
5. Run the airplane-mode close/reopen test on the actual courtside device, including reopening a pending player prompt. Export a practice backup and a final result; import into the updated CoachIQ to verify that program's account and workbook.

## Validation

- 120 GameDay tests, including scorer/FT credit, pending recovery, skip, custom reasons, locks, report boundaries, and backup validation.
- 348 root tests, including canonical defensive-credit transfer, retry, and rejection before staging of invalid breakdowns.
- Browser fixture uses actual app modules and fake-indexeddb. Checks roster taps, switches, shared responsibility, custom reason replacement, skip, report/PDF content, and no modal horizontal overflow at 1024, 768, and 390 pixels. No page errors.
- These automated checks do not certify physical iPad Safari, actual Google permissions, or a live deployment. The device/account smoke test above is still required.
