# GameDay useful observations before alert thresholds — 2026.10.30.10

## What changed

Reports no longer leave both brief panels empty when recorded information exists but no strong rule-based pattern qualifies. Existing ranked concerns and positives still take precedence. If either group has no qualifying item, it receives one short observation from the available data, with counts and a next-possession cue.

Examples: one turnover prompts a ball-security review; an opponent OREB prompts a rebounding observation; an empty offensive trip prompts a review; a recorded score or stop can provide early reinforcement. Technical FTs are described separately from possession PPP. Manual objective taps, score-only adjustments and an unfinished first-report draft explain what was recorded without pretending to be completed live-play evidence.

Neutral left panels are labeled Look at instead of Fix now. When no positive outcome is recorded, the other panel is Build next with an honest next-action suggestion. The app does not fabricate a strength. Fallback items say Recorded observation · not an established trend. Stronger alerts retain their existing evidence thresholds and headings.

Recent observations use the latest recorded window. If an open tracking gap leaves no subsequent completed possessions, earlier facts are explicitly labeled as data before the gap, not a current streak or a new trend. Missing-player-credit and gap warnings remain visible. Existing saved-report and no-new-completed-play reuse rules remain; older saved reports do not pull in later technical or draft observations.

## Update

Merge this PR, wait for Publish CoachIQ GameDay to succeed, then open the same GameDay app online and use Check again / Prepare for offline. Close all app windows and reopen. Confirm 2026.10.30.10. No new Apps Script changes.

Test a practice game with one completed scoring possession and open Timeout report: both panels should have content. Also check a missed/empty trip, FTs and an open gap. The fuller postgame view is unchanged.

## Validation

162 GameDay tests and 357 root tests pass, plus syntax/diff checks. Added tests cover one scoring trip, one empty trip, a single OREB allowed, normal/technical FT-only data, counters/draft explanations and saved-report boundaries. Updated tests assert honest neutral fallback rather than empty panels and explicit pre-gap evidence rather than a fabricated kill. Browser fixture with actual modules and fake-indexeddb checks populated panels after one possession, early-observation labels, data from both sides, initially collapsed details and no modal horizontal overflow at 1024/768/390 pixels; no page errors. Actual-device/deployment smoke test remains necessary.
