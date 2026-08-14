# CoachIQ New Program Launch Guide

## Morning launch checklist

Use one private CoachIQ spreadsheet copy per program. Complete the first launch with the program owner before inviting the full staff.

### Before the meeting

- Create a clean copy named `CoachIQ - School - Sport - Season`.
- Confirm these sheets exist and retain their header rows: Players, Sessions, Practice Evaluations, Culture Points, Point Awards, Player Timeline, Player Season Stats, and Settings.
- Confirm Culture Points row 1 is: Point ID, Player ID, Category ID, Category Name, Points, Coach, Date, Notes, Session ID.
- Clear test records from row 2 downward only. Never clear header rows.
- In Settings, set `Setup Complete` to `FALSE` for a true first-run test. If that setting is missing, add it in the first empty row with `Setup Complete` in column A and `FALSE` in column B; current CoachIQ versions also treat a missing marker as a new installation.
- Make a backup copy before entering real athlete information.
- Prepare the school name, program name, mascot, season, teams, positions, statuses, staff names, colors, logo URL, evaluation categories, and rewards.
- Prepare the roster as a CSV using the CoachIQ template.

### Launch and onboarding

1. Open the program spreadsheet as its owner.
2. Wait for the CoachIQ menu, then select CoachIQ > Launch CoachIQ.
3. Complete Program Name, School / Organization, Mascot / Team Name, Current Season, and Sport. Selecting a sport automatically suggests matching positions; you can edit that list before finishing.
4. Select primary and secondary colors. Use a public HTTPS logo URL or leave it blank.
5. Enter teams, positions, statuses, evaluation categories, and coaching staff.
6. Review starter rewards and point values.
7. Select Finish Setup.
8. CoachIQ should open Getting Started. Run the guided tour.

### Add the roster

1. Open Players.
2. Select Upload Roster CSV.
3. Download the CSV template.
4. Keep the headers: First Name, Last Name, Jersey Number, Grade, Team, Position, Status.
5. Ensure Team, Position, and Status values exactly match CoachIQ Settings.
6. Upload the completed CSV and review the preview.
7. Select Import Players.
8. Open one newly imported profile. It should say Not Yet Evaluated and must not show an error.
9. Edit one test player and confirm the change persists.

### Create the first session

1. Open Sessions and select New Session.
2. Choose session type, date, evaluator, and one or more teams.
3. Enter optional session notes and select Start Session.
4. Confirm each active selected athlete appears once.
5. Enter attendance and several pillar ratings.
6. Add a note and reward to at least one player.
7. Wait until CoachIQ displays All changes saved.
8. Navigate away, resume the session, and confirm values remain.
9. Finish the session only when there are no pending or failed saves.
10. View the completed session, reopen it, make a correction, save, and finish again.

### Verify reports and totals

- Dashboard player count, sessions, attendance, culture score, and point leader load.
- Leaderboard search and team filter work.
- A player PDF downloads and opens.
- The leaderboard PDF downloads and opens.
- Changing a reward creates only one Culture Points row for that player/session.
- Removing a reward removes its session reward row.

### Add staff

1. Share the spreadsheet only with trusted staff Google accounts as Editors.
2. Do not use Anyone with the link.
3. Have one second staff member open the spreadsheet in a separate browser profile.
4. Let that account authorize and launch CoachIQ.
5. It should open the configured Dashboard, not onboarding.
6. Have the second coach update a fictional evaluation and verify the owner sees the change.
7. Send PDFs, not spreadsheet access, to players or parents.

### Go-live decision

Go live only if onboarding, roster import, player profiles, player editing, session save/resume/finish/reopen, rewards, Dashboard, leaderboard, PDFs, and second-user access all pass without red CoachIQ console errors.

## Troubleshooting

- Old page after code update: close CoachIQ, refresh the spreadsheet, and relaunch.
- Upload button missing: update Players.html.
- Profile fails for new athlete: update InsightService.gs, PlayerService.gs, and PlayerModule.html.
- Onboarding appears again: confirm Settings has `Setup Complete` = `TRUE`.
- Import rejects Team/Position/Status: make CSV spelling match Settings exactly.
- Save failed: do not finish; retry the field and wait for All changes saved.

## Safe operating rules

- Back up before every code update or schema change.
- Replace code files only; never replace a live data sheet with a blank template.
- Never rename required headers without a documented migration.
- Keep each program in its own spreadsheet.
- Restrict spreadsheet access to trusted staff.
