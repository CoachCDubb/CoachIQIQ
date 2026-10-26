# GameDay updates through GitHub Pages — proposed hosting change

**Not published yet. Requires the owner's approval of a public app address.** The existing private Sites app and its stored device data are unchanged by this PR until you deliberately move to the new app.

The existing private hosting source push is blocked by automatic credential-handling review. This proposal uses GitHub's built-in Pages deployment workflow and its temporary `GITHUB_TOKEN`/OIDC integration. It does not transmit the rejected Sites credential or depend on it.

## What is public

GitHub Pages publishes the generic static app at the expected address `https://coachcdubb.github.io/CoachIQIQ/`. Anyone with the link can open an empty app instance. Only `offline-app/dist` is uploaded; it does not include your spreadsheet, Apps Script server files, credentials, uploaded preparation/result files, or browser databases. GameDay records stay in each browser's IndexedDB. There is no automatic game-data synchronization or cloud upload in this deployment.

Your repository is already public and currently has no Pages site, so this setup does not replace an existing GitHub Pages website. The current owner-private ChatGPT Site remains private and unchanged.

## One-time publishing setup, after approving this proposal

1. Open the repository: https://github.com/CoachCDubb/CoachIQIQ .
2. Choose **Settings → Pages** in the left sidebar.
3. Under **Build and deployment → Source**, select **GitHub Actions**.
4. Merge this PR after it is marked ready. The workflow starts automatically when the workflow/app files reach `main`.
5. Choose **Actions → Publish CoachIQ GameDay** and wait for both build and deploy to finish successfully. If it did not start, choose **Run workflow → main → Run workflow**.
6. Open the production URL shown by the successful deploy job. The expected address above is not evidence of publication until the workflow succeeds.

The app build and all offline tests must pass before deployment. Only `main` pushes affecting GameDay or its canonical analytics sources publish automatically. Other CoachIQ-only file changes do not redeploy GameDay. You can also run the workflow manually. Future merges of GameDay changes update the same new address without a Sites write-credential handoff.

## Move existing iPad games safely

Changing web addresses changes browser storage. Games do not automatically appear at the new address, and the old data must not be cleared.

1. In the currently installed old GameDay app, export a backup for **each game** you need to retain. Confirm every JSON file is actually saved in iPad Files.
2. Export/save your CoachIQ team-link file too, or use a fresh matchup preparation file for future setups.
3. After GitHub deployment succeeds, open the **new address** in Safari while online.
4. Choose **Prepare for offline**. Add it to the Home Screen with a distinct name such as **GameDay New**, open that new icon, and prepare again there.
5. Import the team-link file and each game backup. Backups retain game IDs, rosters, possessions, drafts, corrections and final scores; existing IDs in the destination are skipped rather than overwritten.
6. Open every restored game and compare its score, possession totals, roster, and unfinished draft against the old app. Keep all backup files.
7. Run the airplane-mode close/reopen test on the new installed app, including a disposable possession, reports and a backup download. Do not rely on it for a real game until this passes.
8. Use only the new app to continue a migrated live game. Do not track the same game in both copies. Keep the old app/data until the new copy and any final CoachIQ import are verified.

## Update CoachIQ's Open GameDay button

This PR changes the original CoachIQ links to the proposed GitHub Pages address. After deployment succeeds and you verify the new app, replace `Game.html`, `OfflineGameService.gs` and `SystemHealthService.gs` in Apps Script with the merged versions. Save and update the existing Apps Script web-app deployment if used. Source build `2026.10.26.15`.

If you already installed PR #197's other files, no further changes to those files are needed. The new GameDay build includes the separate offense/defense tag lists (app version `2026.10.26.7`). Existing preparation and result JSON formats remain compatible.

## Verification and remaining limits

47 offline tests pass, including caching and offline reopening at a project subpath (`/CoachIQIQ/`). The workflow structure is verified: read-only repository contents, Pages/OIDC publishing permissions, and an artifact limited to `offline-app/dist`. Source syntax and diff checks pass. Actual GitHub Actions execution, production deployment, physical Safari installation and cross-origin backup restoration remain acceptance checks after the owner enables Pages and approves publication.
