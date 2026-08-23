# CoachIQ deployment and system health

CoachIQ serves the spreadsheet dialog and deployed web app from the same
source-controlled `Index` template. `launchCoachIQ()` applies dialog dimensions;
`doGet()` returns the same build for the iPad/web-app URL.

## Release metadata

- `COACHIQ_BUILD_VERSION` identifies the source release installed in Apps Script.
- `COACHIQ_SCHEMA_VERSION` identifies the workbook structure expected by that
  release.
- Update the build version for every Apps Script release.
- Increment the schema version only when a release changes required workbook
  structure and includes a safe migration plan.

## Head Coach diagnostics

Staff with **Manage settings** can open **Settings → System health** to check:

- build and schema versions;
- required sheets and columns;
- the source-controlled web-app entry point;
- verified staff-email access;
- daily backup protection and the last backup error; and
- whether the signed-in administrator is assigned.

Diagnostics are read-only. They must never create sheets, rename columns, enable
triggers, or repair production automatically.

## Release procedure

1. Run `npm test` and `npm run check:syntax`.
2. Merge the reviewed pull request into `main`.
3. Replace the changed Apps Script files from `main` and save the project.
4. Close and reopen the spreadsheet dialog; run **Settings → System health**.
5. Resolve every error before production data entry. Review warnings explicitly.
6. Edit the existing web-app deployment, select **New version**, and deploy so the
   iPad URL keeps its existing address.
7. Open the existing web-app URL and repeat a focused smoke test.
8. Record the deployed build version and deployment date in the release notes.

## Current schema scope

Schema diagnostics validate the operational minimum for Players, Sessions,
Practice Evaluations, Culture Points, Settings, and Audit Log. Live Game sheets are
created lazily when an authorized coach opens Live Game, so their absence is not a
core-health failure.
