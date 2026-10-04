# 2026-10-04 winning-targets release checklist

This is the reviewed release plan for the Live Game winning-targets chart from
PR #152. It prepares build `2026.10.04.1` for a later manual Apps Script update;
it does **not** authorize an API write, `clasp push`, `clasp deploy`, or any other
deployment from this repository.

The plan is based on the completed 2026-10-01 reconciliation. The copied-project
snapshot and reviewed `main` both contained the same 60 Apps Script source names.
Of the seven release candidates reviewed below, five contain meaningful reviewed
source differences, one contains release metadata, and the manifest differs only
in formatting. Consequently, the exact files to copy from GitHub `main` are:

```text
AnalyticsService.gs
GameService.gs
Game.html
Scripts.html
Styles.html
SystemHealthService.gs
```

Do not copy only the three chart UI files: the two service files are part of the
reviewed Live Game contract and must be aligned at the same time. Do not replace
`appsscript.json`; its effective values already match the reviewed manifest.

## Pre-update safety gates

- [ ] Confirm the release source is the latest reviewed GitHub `main`, including
      the merged reconciliation report and PR #152.
- [ ] Open the **separate safety copy**, not the raw snapshot branch, as the
      rollback source. Confirm that it is available before changing production.
- [ ] Record the currently active Apps Script deployment ID/version, deployed
      build version, existing web-app URL, and the date/time of this update.
- [ ] Compare the Apps Script editor inventory with the complete 60-file inventory
      in `LIVE_SOURCE_RECONCILIATION_2026-10-01.md`. **Stop without updating or
      deploying if any file name is missing, added, or renamed.** Reconcile and
      review the discrepancy first.
- [ ] Preserve PR #149 and raw commit
      `b697371a5d9f10c83407550c231d97d3c0c11847` as immutable snapshot evidence.
      Never edit, rebase, resolve, merge, or overwrite that raw evidence.
- [ ] Confirm `COACHIQ_BUILD_VERSION` on `main` is `2026.10.04.1` and
      `COACHIQ_SCHEMA_VERSION` remains `2`. This release has no spreadsheet schema
      change or migration.

## Reviewed file decisions

Copy each required file in full from the same GitHub `main` commit. Do not combine
content from the raw snapshot, a feature branch, or an older local checkout.

| File | Update Apps Script? | Source and reason | Verification after update |
| --- | --- | --- | --- |
| `AnalyticsService.gs` | **Yes** | **Source reconciliation.** Reviewed `main` adds the server-side guard that rejects possession writes when analytics is disabled. The raw snapshot lacked it; omitting this file would leave the optional-tracker client/server contract inconsistent. | With analytics disabled in a disposable game, confirm no analytics possession can be written; then enable analytics and confirm a normal possession can be recorded. System health must report no error. |
| `GameService.gs` | **Yes** | **Source reconciliation.** Reviewed `main` preserves Tracker Mode, objective-validation gating, returned mode flags, period advancement without objectives, legacy-game compatibility, and valid postgame reports when optional trackers are off. These server behaviors support the reconciled Live Game UI. | Create disposable games with optional tools both off and on; confirm setup, load, period advancement, and finish/report behavior succeed in each applicable mode. |
| `Game.html` | **Yes** | **Source reconciliation and PR #152.** The reconciled optional-tool/objective-aware markup must stay paired with the services, and PR #152 adds the winning-target chart markup. | Open the disposable Live Game and confirm the optional controls match the selected mode and the winning-target chart is visible for configured objectives. |
| `Scripts.html` | **Yes** | **Source reconciliation and PR #152.** This is the reviewed client state machine: optional-tool rendering, protected background possession queue and recovery, corrected tags/rebounds, checkpoint flushing, plus chart calculation, rendering, initial render, and optimistic tap refresh. | Exercise minimum, maximum, percentage, and comparison objectives; confirm each target/progress display is correct and that the chart updates immediately after every relevant tap, without waiting for a server round trip. |
| `Styles.html` | **Yes** | **Source reconciliation and PR #152.** The retained optional-state/rebound rules correspond to the reconciled markup, while PR #152 supplies the chart and dense desktop layout styling. | Inspect the dialog and deployed web app at their intended sizes; confirm chart labels/bars are readable, controls are not hidden or overlapping, and optional sections hide/show correctly. |
| `SystemHealthService.gs` | **Yes** | **Release metadata.** This release changes `COACHIQ_BUILD_VERSION` to `2026.10.04.1` and intentionally leaves `COACHIQ_SCHEMA_VERSION` at `2`. | Open **Settings → System health** and confirm build `2026.10.04.1`, target schema `2`, and no errors. Resolve every error before proceeding. |
| `appsscript.json` | **No** | **Source reconciliation.** The raw and reviewed manifests have identical effective values; only key order, empty-object layout, and final-newline formatting differ. Replacing it creates risk without a runtime change. No PR #152 or release-metadata change applies to it. | Compare the editor manifest semantically with GitHub `main`: Chicago time zone, empty dependencies, `USER_ACCESSING`, `ANYONE`, Stackdriver logging, V8, and no explicit `oauthScopes`. Stop if any value differs. |

## Manual update and pre-deployment verification

- [ ] In the Apps Script editor, update exactly the six files listed above from
      one immutable GitHub `main` commit. Do not add, delete, or rename a file.
- [ ] Save the Apps Script project and confirm there are no editor syntax errors.
- [ ] Close the spreadsheet dialog completely, then reopen it so it loads the
      saved source rather than an already-open client.
- [ ] Open **Settings → System health**. Confirm build `2026.10.04.1` and schema
      version `2`; resolve **every error** before continuing and explicitly review
      any warning.
- [ ] Create a disposable Live Game and test all four objective types: minimum,
      maximum, percentage, and comparison.
- [ ] For each objective, record relevant events and verify its winning chart
      target/progress updates **immediately** on each tap. Also verify corrected
      rebound controls, period transitions, and applicable optional-tool states.
- [ ] Finish or discard the disposable game according to normal test-data cleanup
      practice. Do not use a real game for release validation.

## Deploy the verified saved source

- [ ] Only after all pre-deployment checks pass, edit the **existing** web-app
      deployment; do not create a replacement deployment.
- [ ] Select **New version** and deploy that version.
- [ ] Confirm the existing web-app URL is preserved exactly.
- [ ] Open that deployed URL in a fresh session and repeat the complete disposable
      Live Game smoke test for minimum, maximum, percentage, and comparison
      objectives, including immediate chart updates.
- [ ] Reopen **Settings → System health** through the deployed build and resolve
      every error. Confirm build `2026.10.04.1` and schema `2`.
- [ ] Record the new Apps Script version, deployment date/time, GitHub commit, and
      successful smoke-test result without modifying the raw snapshot evidence.

## Rollback / stop procedure

1. Stop immediately if the editor inventory differs from the reviewed 60-file
   inventory, a source copy is incomplete, System health has any unresolved error,
   or a smoke test fails. Do not publish another version while investigating.
2. Retain the recorded current deployment/version and web-app URL. If a new version
   was already deployed, edit the existing deployment back to the recorded known-
   good version so the URL remains unchanged.
3. Use the **separate safety copy** to recover the prior source only after comparing
   its inventory and the affected files. Never use or alter the raw evidence branch
   as a working rollback copy, and never overwrite the raw snapshot evidence.
4. Record the failure, files involved, and rollback version. Reconcile any source
   or inventory difference in a new reviewed repository change before retrying.
