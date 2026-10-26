# Completed Game Reports spacing — 2026.10.26.6

Update these three Apps Script files:

- Scripts.html
- Styles.html
- SystemHealthService.gs

Save, close the current CoachIQ spreadsheet dialog, and reopen it from the CoachIQ menu to load the new scripts/styles. If using the deployed web app, publish a new version of the existing deployment and reload its /exec URL.

Completed-game cards previously put the report button, Scouting comparison, Film and Archive into four columns inside a three-card-wide grid. The action columns consumed the available width, squeezed the game identity toward zero width and stretched buttons vertically.

Each completed game now shows its matchup/date/report button across the top, with a separate row of three compact action buttons underneath. The card grid responds to its available content width, including space taken by the sidebar. Long opponent names wrap within the card. Action controls retain at least 44px touch height and existing behavior. Saved/live-game resume rows and tracking/report calculations are unchanged. No workbook migration is needed.

Validation: syntax and existing regression checks completed, with 278/279 passing and only the known source-reconciliation Python subprocess environment failure. Headless Chromium layout checks passed at 1600, 1024, 820, 768 and 390 CSS-pixel widths, verifying readable title width, actions below the main report, touch target height and no button overflow. Inspected the 1024px screenshot. These are local fixtures using the real sidebar, styles and completed-game renderer; deployed Apps Script and physical iPad Safari verification remain pending.
