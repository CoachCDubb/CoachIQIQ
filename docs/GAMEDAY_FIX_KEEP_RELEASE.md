# GameDay Fix now / Keep doing — 2026.10.30.6

Live timeout and quarter/halftime reports show two expanded boxes. Fix now contains up to two ranked concerns; Keep doing contains up to two ranked positives. Each item has a headline, exact recorded evidence and a short next-possession/reinforcement cue. The two groups are selected independently from all existing recent-possession candidates, so high-priority concerns cannot push positives out of the brief. Duplicate keys are excluded and each group is capped at two.

The underlying evidence thresholds, recent windows, saved checkpoint boundaries and correction behavior stay intact. Positive stop runs, near-kills, improving efficiency and productive offensive action patterns can populate Keep doing. Concerns retain their existing rankings. Missing evidence produces an explicit neutral empty state rather than an invented concern or strength. Existing single-priority data remains available for compatibility.

Boxes sit side by side at larger widths and stack below 620px. Supporting report sections stay collapsed initially. Full PDF printing expands them. The fuller postgame view remains unchanged.

## Update

Merge this PR and wait for the Pages publishing workflow. Open GameDay online, use Check again / Prepare for offline, close all app windows and reopen the same app. Confirm 2026.10.30.6. No new Apps Script source changes are required. Keep previous updates and run a practice report / actual-device airplane-mode test before game use.

## Validation

131 GameDay tests and 349 root tests pass, plus syntax/diff checks. Tests verify independent selection of two concerns and two positives from multiple ranked candidates, positive-only / concern-only / empty cases, and the existing saved-checkpoint and evidence thresholds. Browser fixture using actual modules and fake-indexeddb confirms both populated boxes, initially collapsed details, full PDF content, live period and fuller postgame behavior, and modal widths 1024/768/390 with no page errors. The physical iPad and live deployment remain device checks.
