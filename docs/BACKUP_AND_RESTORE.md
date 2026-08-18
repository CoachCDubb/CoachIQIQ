# CoachIQ backups and manual restore

CoachIQ creates complete Google Drive copies of its spreadsheet. An authorized Head
Coach or staff member with **Manage settings** can enable the daily trigger or create
an immediate backup from Settings. Roster imports also require a successful safety
backup before any player rows are written. Future season-rollover code should call
`createCoachIQSafetyBackup_("Before season rollover")` before its first mutation.

Backups are stored in the script owner's `CoachIQ Backups` Drive folder. The newest
10 copies are retained; older files in that dedicated folder are moved to trash.

## Manual restore procedure

There is intentionally no restore button in CoachIQ.

1. Stop data entry and record the production spreadsheet URL.
2. Open `CoachIQ Backups` in Google Drive and select a copy by timestamp and reason.
3. Open it read-only first and verify the expected sheets, headers, season, roster,
   and a sample of recent records.
4. Have the spreadsheet owner make a separate working copy of that backup.
5. Compare the working copy with production. Move only verified sheets or rows into
   production, or repoint a test deployment to the working copy for validation.
6. Have a second authorized coach review the result before resuming data entry.
7. Keep the original production spreadsheet and selected backup unchanged until the
   restored data has been validated.
