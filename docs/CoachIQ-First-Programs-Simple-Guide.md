# CoachIQ: Your First Two Programs

## The simple system

You will keep three things: one clean template, one spreadsheet for each program, and one private tracker. Never use your live program as the template.

### The three files you need

1. CoachIQ - CLEAN TEMPLATE. This has no real athletes. Keep Setup Complete set to FALSE.
2. CoachIQ - PROGRAM NAME. Each school or team gets its own copy. After signup, Setup Complete becomes TRUE.
3. CoachIQ - PROGRAM TRACKER. This is private and tells you which app version every program has.

## Part 1: Prepare your clean template one time

1. Open the spreadsheet you want to use as the clean template.
2. Rename it `CoachIQ - CLEAN TEMPLATE - DO NOT USE`.
3. Open Players. Keep row 1. Delete all athlete information in row 2 and below.
4. Open Sessions. Keep row 1. Delete all session information in row 2 and below.
5. Open Practice Evaluations. Keep row 1. Delete all information in row 2 and below.
6. Open Culture Points. Keep row 1. Delete all information in row 2 and below.
7. Confirm Culture Points row 1 reads: Point ID, Player ID, Category ID, Category Name, Points, Coach, Date, Notes, Session ID.
8. Open Player Timeline and Player Season Stats. Keep row 1 and clear row 2 and below.
9. Open Settings. Find Setup Complete. Set its value in column B to FALSE.
10. If Setup Complete is missing, add it to the first empty row: column A `Setup Complete`, column B `FALSE`, column C `Controls first-run onboarding`.
11. In Settings, find CoachIQ Version. Enter `1.0.0`. If it is missing, add it to the first empty row.
12. Select File > Make a copy. Name the backup `CoachIQ - CLEAN TEMPLATE - BACKUP`.

Stop and check: the clean template has no real athletes or sessions, Setup Complete is FALSE, and CoachIQ Version is 1.0.0.

## Part 2: Create Program Number 1

1. Open `CoachIQ - CLEAN TEMPLATE - DO NOT USE`.
2. Select File > Make a copy.
3. Name the copy `CoachIQ - School Name - Sport - Season`.
4. Open the new copy. Do not work in the clean template.
5. Confirm Settings says Setup Complete = FALSE.
6. Refresh the spreadsheet and wait for the CoachIQ menu.
7. Select CoachIQ > Launch CoachIQ.
8. Complete the signup screen with the program owner.
9. Enter Program Name, School, Mascot, Season, Sport, colors, teams, positions, statuses, categories, staff, and rewards.
10. Selecting the sport suggests positions. Edit those suggestions if the program uses different names.
11. Select Finish Setup.
12. Run the Getting Started tour.
13. Return to Settings and confirm Setup Complete = TRUE.
14. Confirm CoachIQ Version still says 1.0.0.

## Part 3: Add Program Number 1 roster

1. Open Players.
2. Select Upload Roster CSV.
3. Select Download CSV Template.
4. Add athletes without changing the header row.
5. Make Team, Position, and Status match CoachIQ Settings exactly.
6. Save the file as CSV.
7. Upload it to CoachIQ and review the preview.
8. Select Import Players.
9. Open one player profile. A new athlete should show Not Yet Evaluated.
10. Edit one athlete and save to confirm editing works.

## Part 4: Test Program Number 1 before real use

1. Open Sessions and select New Session.
2. Select a date, evaluator, and team.
3. Start the session.
4. Mark attendance and enter a few ratings.
5. Add one note and one reward.
6. Wait for All changes saved.
7. Leave the page, return, and resume the session.
8. Confirm everything is still there.
9. Finish the session.
10. Reopen the completed session, change one item, wait for it to save, and finish it again.
11. Open Dashboard, Leaderboard, and one player profile.
12. Download one player PDF and the leaderboard PDF.
13. Share the spreadsheet with one trusted staff Google account as Editor.
14. Have that coach launch CoachIQ and make one test change.
15. Confirm you can see the change.

If every step passes, Program Number 1 is ready.

## Part 5: Add Program Number 1 to your private tracker

Create a private Google Sheet named `CoachIQ - PROGRAM TRACKER`. Use these columns:

Program | Owner | Email | Spreadsheet Link | Installed Version | Last Backup | Last Update | Status | Notes

Add Program Number 1. Set Installed Version to 1.0.0 and Status to Current.

## Part 6: Create Program Number 2

Repeat the same process from the clean template, not from Program Number 1.

1. Open the CLEAN TEMPLATE.
2. Make a new copy.
3. Rename it for Program Number 2.
4. Confirm Setup Complete = FALSE.
5. Complete signup for Program Number 2.
6. Upload Program Number 2 roster.
7. Run the complete test session.
8. Test with a second staff account.
9. Add Program Number 2 to your private tracker.

Never copy Program Number 1 to create Program Number 2. That could copy private athlete information.

## Part 7: How to release an update

GitHub updates do not automatically update program spreadsheets. For your first few programs, update each program one at a time.

1. Finish and test the change in your development copy.
2. Choose a new version number. Bug fix example: 1.0.0 becomes 1.0.1. New feature example: 1.0.1 becomes 1.1.0.
3. Write down exactly which Apps Script files changed or were added.
4. Open your PROGRAM TRACKER and mark each program Update Needed.
5. Contact Program Number 1 and ask staff to stop using CoachIQ for 10 to 15 minutes.
6. Open Program Number 1 spreadsheet and select File > Make a copy.
7. Name it `CoachIQ - Program Name - Backup Before Version 1.1.0`.
8. Open Extensions > Apps Script in Program Number 1.
9. Replace only the files listed in your release notes. Create any listed new files.
10. Save Apps Script, close CoachIQ, refresh the spreadsheet, and launch it again.
11. Test Dashboard, Players, one profile, Sessions, one evaluation, rewards, Leaderboard, and one PDF.
12. If the tests pass, change CoachIQ Version in Settings to the new version.
13. In your tracker, update Installed Version, Last Backup, Last Update, and Status = Current.
14. Repeat steps 5 through 13 for Program Number 2.

## Part 8: If an update fails

1. Stop. Do not delete any data.
2. Record the error message and take a screenshot.
3. Keep staff out of CoachIQ until you decide what to do.
4. Open the backup made before the update.
5. Use the backup as the temporary working copy, or restore the previous Apps Script files.
6. Mark the program Failed or Paused in your tracker.
7. Fix and test the update in development before trying again.

## Your rule every time

BACK UP. UPDATE ONLY THE LISTED CODE FILES. TEST. CHANGE THE VERSION. UPDATE THE TRACKER.

Do not overwrite live data sheets with blank template sheets. Do not rename headers unless the update instructions specifically require it. Do not give players or parents Editor access.
