# CoachIQ GameDay: iPad setup and acceptance test

This release is a separate, single-iPad game-day pilot. Your existing CoachIQ app and recorded games remain in place. It is not a migration of the entire scouting, sessions, staff, or AI workspace.

GameDay saves possessions, unfinished drafts, rosters, scouting notes, repeated paint touches and offensive rebounds, corrections, markers, and reports locally. Reports use the same statistical calculations as CoachIQ. Cloud AI generation requires internet; local statistical insights do not. Finished-game transfer is manual, not automatic background synchronization.

## 1. Update your existing CoachIQ project

1. Open the release PR on GitHub, review it, and click **Merge pull request**, then **Confirm merge**.
2. Open the repository's `main` branch after merging.
3. In your existing Apps Script project, add a **Script** named `OfflineGameService`, then paste the contents of `OfflineGameService.gs` into it.
4. Replace the contents of these existing files with their updated versions from GitHub: `AnalyticsService.gs`, `GameReviewService.gs`, `GameService.gs`, `ScoutingService.gs`, `SystemHealthService.gs`, `Game.html`, `Scripts.html`, and `Styles.html`.
5. Save all files. Do not replace your spreadsheet or delete existing sheets/data.
6. Close and reopen CoachIQ from your spreadsheet. If you use an Apps Script web-app deployment, choose **Deploy → Manage deployments → Edit → New version → Deploy**, then reopen its link. This updates CoachIQ's file transfer buttons; the separate GameDay site is hosted independently.

Do not paste the `offline-app` directory into Apps Script. It contains the separate web app's source and built assets.

## 2. Install GameDay on the iPad while online

1. In **Safari** on your iPad, open https://coachiq-gameday-offline.chummychick11.chatgpt.site/ . The site is private; sign in with the owning ChatGPT account if prompted.
2. Tap **Prepare for offline**. Wait for the app to confirm that the offline files are saved. If it reports an error, stop and keep using the existing workflow until that error is resolved.
3. Tap Safari's **Share** button → **Add to Home Screen** → **Add**.
4. Open the new **CoachIQ GameDay** Home Screen icon while still online. Tap **Prepare for offline** / **Check again** inside this installed copy as well. Safari and Home Screen storage can differ.
5. Create a disposable practice game. No game-plan objective, roster, or player selection is required.

Use the same installed Home Screen app for the entire game. Avoid private browsing, clearing website data, or uninstalling the app while it holds the only copy of a game. Device storage is not a cloud backup.

## 3. Required airplane-mode test before a real game

1. In the installed app, create a test game and save it.
2. Turn on **Airplane Mode**, and explicitly turn **Wi-Fi and cellular data off**.
3. Record several offense and defense possessions. Include two paint touches in one possession, an offensive rebound, a turnover, and three consecutive defensive stops. Check totals and kills in Quick Stats/reports.
4. Leave one tagged possession unfinished. Close the app completely, reopen it from the Home Screen, select **Resume game**, and confirm both saved possessions and the unfinished draft remain.
5. Finish that possession. Open the timeout report, add a tactical marker, end a period, and correct a saved possession with a reason. Confirm reports update and the correction history remains.
6. Export a backup. Verify that the JSON file actually appears in the iPad **Files** app. A download prompt alone does not establish that the file was saved.
7. Finish the test game, enter its final score, and reopen its final report while still offline.
8. Export its final result and verify the file in Files. This locks play editing in GameDay so that the transferred result stays stable.
9. Reconnect to the internet. In the original CoachIQ Live Game page, choose **Import GameDay result**, select the file, and confirm. Check the new completed game and its report. Import the identical file again and confirm no duplicate appears.

**Do not rely on GameDay at a real game until this exact iPad passes this test.** Automated tests cover the model, storage transactions, worker cache behavior, and import retries; they do not certify Safari, private-site authentication, iPad storage retention, or installation behavior on your hardware.

If Home Screen reopening fails offline, retain exported files, reconnect, and report the exact message. The existing Sheets dialog cannot substitute for an offline install.

## 4. Prepare a real matchup

1. Online in CoachIQ, save a **fresh, unused** game setup with your team, opponent, optional rosters, scouting report, and focus tags.
2. Use **Download GameDay preparation** on the setup confirmation. Preparation export rejects games that already have tracked activity.
3. In installed GameDay, tap **Import file** and choose that preparation JSON. Confirm the setup and save it on this iPad. Open the rosters/scouting view and verify the information before leaving internet access.
4. Alternatively, create a game directly in GameDay. Rosters use one player per line, for example `12, Jordan Smith`; up to 20 per team. Custom focus tags are available. A preparation export carries saved scouting notes, not the entire scouting workspace.
5. Use GameDay to track that matchup. The original CoachIQ setup remains unused; it is not a synchronized second scorekeeper.

## 5. During and after the game

1. Tap the events that matter, then points or turnover to end each possession. Repeated paint touches and offensive rebounds are counts within the same possession.
2. Use **Quick Stats** for immediate local numbers; timeout/period reports and tactical comparisons also work offline. These are statistical observations, not proof that a tag caused scoring.
3. Export a backup each period and confirm it is in Files. Backups include the unfinished draft and can restore a missing local game through **Import file**; existing local IDs are skipped rather than overwritten.
4. Finish the game, confirm the final score, review corrections, and export the final result. Export locks further play editing in GameDay; later game corrections belong in CoachIQ after import.
5. When internet returns, open the original CoachIQ app, choose **Import GameDay result**, select the locked result file, and confirm.
6. The result becomes a **separate completed game**, preserving the original setup and existing games. Imported scouting notes are explicitly labeled as offline captures. Duplicate retries return the same import; a changed file cannot overwrite it.
7. If an import fails midway, retain the identical file and retry. Incomplete imports are staged outside ordinary game lists until completed. Keep the local game and backup until you have verified the completed CoachIQ report.

## Developer validation

Build: `node offline-app/tools/build.cjs`. This copies the local assets and generates `engine.js` from CoachIQ's pure analytics functions.

Offline tests: `npm ci --prefix offline-app` then `npm --prefix offline-app test`.

Bridge tests: `node --test --test-isolation=none tests/offline-gameday-bridge.test.js`.

Syntax: `npm run check:syntax` plus `node --check offline-app/src/app.js`.

For subsequent static releases, bump the worker cache/build version together. The initial release does not force an update over an active game. Export backups before installing updates.
