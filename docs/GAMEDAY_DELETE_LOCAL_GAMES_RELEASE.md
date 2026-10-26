# Delete saved games from this iPad

GameDay **2026.10.26.9** adds a Delete button on each card under **Saved on this iPad**. Deletion is individual and local to the current GameDay browser/app address. It removes that game's possessions, draft, reports and correction history from IndexedDB. Other games, linked team settings, already imported original CoachIQ records, and JSON files saved in Files remain intact.

## Use

1. Merge this PR and wait for **Publish CoachIQ GameDay** in GitHub Actions to succeed.
2. At a break while online, use **Prepare for offline / Check again**, wait for the background update, and reload/reopen the installed app. Confirm **2026.10.26.9**. No Apps Script files need updating for this feature.
3. Return to GameDay's **Games** home screen.
4. Find the matchup under **Saved on this iPad** and tap **Delete**.
5. Check the matchup, date and live/completed status in the confirmation. Use **Cancel** to keep it. **Export backup first** is optional and must be saved to Files if chosen.
6. Choose **Delete from this iPad** to remove that local game. There is no in-app undelete; restoring requires an existing exported backup.

A game changed in another tab after confirmation was opened cannot be deleted through that stale confirmation. Refresh and review its latest state. A stale open game also cannot silently recreate the removed record on its next save. Deleting a local game does not delete or archive its completed report in the original CoachIQ app.

## Verification

63 offline tests pass, including targeted deletion, preservation of other games/team settings, stale-delete rejection, stale-save rejection after deletion, and idempotent repeated deletion. Browser fixture with simulated persistence verifies Cancel preserves both games and confirmation deletes only the selected matchup. Confirmation controls remain reachable at 1024×768, 768×1024 and 390×600 with no JavaScript errors. Syntax/diff checks pass. Physical iPad/offline verification remains a user acceptance check.
