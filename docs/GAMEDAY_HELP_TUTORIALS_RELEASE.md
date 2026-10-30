# GameDay offline help and tutorials — 2026.10.30.9

## Help access

The app header now has Help & tutorials. Every existing app dialog also has a Help button, allowing a second help dialog to open over a report or pending player prompt without dismissing or skipping it. Closing Help returns to the original dialog with saved state intact. Learn the tracker and How objectives work links provide contextual walkthrough entry points.

## Written question help

Coaches can type a question or feature name. Local search returns up to three matching curated explanations with the exact app location and a walkthrough link. Topics include setup, offline preparation/testing, team links, rosters, possession tags, auto-switch, scoring prompts, ordinary/technical FTs, retained fouls, turnovers, defensive responsibility, objectives, tag-player credit, recovery/gaps, missing scorers, corrections, reports, backups, final transfers, updates, drills and deletion.

This is explicitly labeled Built-in help · works offline, not a live AI chat. It uses bundled instructions, makes no model/network request, stores no questions and guesses no free-form answer when there is no matching guidance. No AI credentials or ongoing service are needed. The user selected this offline-first scope; a true online assistant would be separate work with a secure backend.

## Walkthroughs

Eight tutorials present short steps with a title, explanation and Where path. Show me where scrolls to and highlights the actual visible control, with a separate tutorial panel. No tutorial action taps a game control, records plays, navigates away from the active game, changes team settings or writes game data. Next, Back, Read step, Finish and Close are available. Highlight styles are removed on exit. Reduced-motion preferences are respected.

If a step belongs to another screen or is behind an existing app dialog, the tutorial explains where to go instead of opening it automatically. The full offline setup checklist remains available in Help. It will not overwrite a pending player-credit prompt.

## Update and practice

1. Merge the PR and wait for Publish CoachIQ GameDay to pass.
2. Open the existing app online, Check again / Prepare for offline, close all app windows and reopen. Confirm 2026.10.30.9. The two help modules are included in the verified offline cache (23 assets total).
3. No new Apps Script changes for this release. Retain previous analytics/bridge updates.
4. In a practice game, ask a question, follow a walkthrough and use Show me where. Open Help while a scorer prompt is pending and confirm closing Help leaves that prompt intact.
5. In airplane mode, reopen the same app and verify Help/search/tutorials on the actual courtside device. A new tester should complete one practice game and the offline close/reopen test before first game use.

## Validation

156 GameDay tests and 357 root tests pass, plus syntax/diff checks. New tests validate article/tour IDs and cross-links, common question ranking, FT/scorer guidance, no-match behavior and bounded deterministic search. Existing prepare/worker tests verify the enlarged offline asset set. Browser fixture uses actual app modules with fake-indexeddb to check typed questions, no-match wording, a read-only spotlight walkthrough, highlight cleanup and preserved pending scoring prompt; no page errors or help-dialog horizontal overflow at 1024/768/390 pixels. Physical iPad Safari and the deployed app still require the device check.
