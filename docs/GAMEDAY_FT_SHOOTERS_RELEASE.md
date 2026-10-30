# GameDay technical fouls and FT shooter prompts — 2026.10.30.7

## Courtside flow

- Replace the standalone Free throws entry button with Technical foul. Normal shooting/bonus foul trips remain under Foul → FTs. Technical foul is also available during a normal FT trip.
- With Scorer prompt On, each ordinary FT make or miss saves the draft attempt first and asks for that attempt's shooter. Uses our roster on offense and the opponent roster on defense, with manual jersey entry and Skip. Closing the prompt keeps the attempt saved. Per-attempt prompts do not rewrite other shots, paint touches or rebounds.
- Miss-only trips receive the same prompt. Prompt Off keeps team-only tracking. A pending FT shooter survives backup and reopening, and blocks other play mutations until resolved or skipped.
- FT prompts already offered during the trip are not repeated when the possession finishes. A separate unassigned and-one basket can still ask who scored; choosing its scorer does not silently assign a skipped FT. Review / Edit possession retains detailed correction of individual saved attempts.
- Technical foul opens a dead-ball shooting panel: choose our team or opponent, tap Technical FT made/missed once per attempt, and select the shooter when prompted. The score saves first. Player selection returns to the panel for another attempt. Back to possession preserves the current draft, tags, ball side and Auto-switch state. Technical shots create no possession and do not alter possession PPP or defensive possession stop runs.
- Technical FT made creates exactly one linked +1 score adjustment. Misses create no adjustment. Undo last technical FT voids the attempt and removes only its linked point, retaining correction history. Correct a technical shooter by undoing/re-recording the attempt before export.

## Stats and transfer

Technical attempts have their own bounded, validated history (up to 200) with shooter, team, timestamp, period, possession boundary, void flag and linked score-adjustment ID for makes. Player points/FT totals and Quick Stats FT totals include technical shots. Possession points/PPP and recent-possession patterns exclude them; reports show a separate Technical free throws section and explain this difference. Team and player Points objectives include technical FT points; unrelated score-only corrections remain excluded.

Report checkpoints preserve technical-event and score boundaries; later misses refresh the report fingerprint without requiring another possession. Existing reports before technical tracking have no technical attempts. Existing backup schemas are accepted. Empty optional technical histories preserve legacy import hashes. Team-relink copies assign independent technical/adjustment IDs.

The updated OfflineGameService validates attempts against score adjustments, includes technical history in import conflict detection and the original result archive, and adds shooter FT/point totals to the stored final report analytics. It keeps technical details/totals in that report or its full snapshot. Score events remain the existing score-adjustment rows; no duplicate score events or new spreadsheet columns are added. CoachIQ's live possession analytics remain possession-based; the imported final report holds the technical summary and credited totals.

## Update

1. Merge this PR and wait for Publish CoachIQ GameDay to pass.
2. Replace the complete **OfflineGameService.gs** file in each importing CoachIQ Apps Script project and save. If using a web-app deployment, deploy a new version. Keep the previous AnalyticsService.gs update.
3. Open GameDay online, Check again / Prepare for offline, close all app windows and reopen the same app. Confirm 2026.10.30.7. No data clearing/reinstall is needed.
4. In a practice game, turn Scorer prompt On. Test Foul → FTs with a miss and a make assigned to different players. Finish once. Then record technical makes/misses for each team and check score, player totals and preserved draft tags. Test Undo and a pending-prompt close/reopen in airplane mode.
5. Export/import a practice final result to the updated CoachIQ. Verify technical points appear once and credited totals persist. Actual device and account checks remain necessary.

## Validation

141 GameDay tests and 353 root tests pass, plus syntax/diff checks. Tests cover per-attempt shooters, all-miss trips, independent technical scores, both team rosters, undo/audit, saved checkpoints, pending backup/reopening, copied-team IDs, point objectives, invalid/conflicting links and idempotent import. The browser fixture uses actual app modules with fake-indexeddb and checks made/missed shooter prompts, opponent roster selection, technical attempts on both sides, unchanged possession count/draft tags, report content and no modal horizontal overflow at 1024/768/390 pixels. No page errors. Physical iPad Safari and live deployment are not certified by these automated checks.
