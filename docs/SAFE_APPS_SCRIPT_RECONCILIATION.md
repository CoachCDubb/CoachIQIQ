# Safe Apps Script source reconciliation (issue #144)

## Stop condition

The live Apps Script project is the source of truth. Do not deploy, import, delete,
rename, or overwrite anything in that project while this reconciliation is open.
Do not use the repository root as an upload target until a complete live snapshot
has been captured and reviewed.

This runbook deliberately does **not** use `clasp`, enable a Google Cloud API,
change the default Google Cloud project, add OAuth scopes, or call an Apps Script
write endpoint.

## Repository audit — 2026-09-30

The audit was performed against GitHub `main` at
`59ddf7993306adb7e364061e0f1a4c13846c8127` and the isolated working branch at
`e9d4ad3`. The important findings are:

1. GitHub `main` was last updated on 2026-08-30. It cannot be treated as the
   production source described in issue #144.
2. The working branch contains later, unmerged changes. Those changes are also not
   proof of what is installed in production.
3. The repository currently has 30 top-level `.gs` files, 28 top-level `.html`
   files, and `appsscript.json`. A complete live capture must account for every
   live editor file, not only files that differ by name.
4. The tracked manifest is semantically the same as the pre-test manifest recorded
   in issue #144. It has no `oauthScopes` block.
5. `SourceExport.gs`, `script.projects`, `script.googleapis.com`, and `.clasp`
   configuration are not tracked in the repository.
6. `BackupService.gs` copies the spreadsheet file and its data. It does not read or
   archive the Apps Script source, so it cannot establish source parity.
7. This is a container-bound project: `onOpen()` creates a spreadsheet menu and
   `launchCoachIQ()` opens a spreadsheet dialog. Legacy Drive export guidance that
   applies only to standalone script projects is therefore not a safe primary path.

## Decision

Use a **browser-only, copy-out workflow from the existing safety copy**, followed
by a GitHub draft branch comparison. Nothing in this workflow writes to the live
project.

### Why the other paths are rejected

| Path | Decision | Reason |
| --- | --- | --- |
| Push GitHub to Apps Script | Prohibited | It could replace newer production code. |
| Apps Script API | Stop | The read test already returned 403. Enabling APIs or changing the district cloud project is outside this reconciliation. |
| `clasp` locally or in a cloud shell | Excluded | Issue #144 explicitly requires a no-`clasp` path. It also adds another authenticated tool capable of writes. |
| Legacy Drive API export | Not primary | Google's import/export guide limits this flow to standalone scripts and requires OAuth authorization. CoachIQ is container-bound. |
| Google Takeout | Optional evidence only | It is non-destructive, but completeness and container-bound source packaging must be verified before relying on it. |
| Manual browser snapshot from the safety copy | Selected | It needs no API, no installation, no production edit, and produces reviewable source before anything reaches `main`. |

## Minimal user action required

Direct source access is not available to this environment. A person who can open
the Apps Script project must provide the complete source once. The least risky
method is:

1. Open the **separate safety copy**, not the production project.
2. In GitHub's browser UI, create a branch from `main` named
   `reconcile/live-raw-2026-09-28`. Never upload directly to `main`.
3. In the safety-copy Apps Script editor, record the complete file-name list.
4. Copy every `.gs` and `.html` file, unchanged, into the same path on the raw
   branch. Show `appsscript.json` in the editor and copy it unchanged too.
5. Include the temporary `SourceExport.gs` and temporary manifest scopes in this
   **raw evidence branch if they are present in the safety copy**. Do not remove
   them from production. They will be classified during review, not silently lost.
6. Commit once with a message such as `Raw live source snapshot 2026-09-28` and
   open a **draft** pull request clearly marked `DO NOT MERGE — RAW SNAPSHOT`.

If the browser offers a downloadable archive of the safety-copy source, the user
may upload that archive to the draft branch instead of copying file by file, but
the archive is acceptable only after its file list and contents can be inspected.

## Deferred option — no manual copy

If the owner does not want to copy every source file in the browser, reconciliation
may be intentionally deferred until `clasp` is available. That is safer than a
partial snapshot. While deferred:

1. The live Apps Script project remains the source of truth and may continue to be
   maintained through its editor and safety-copy process.
2. Do not deploy, paste, or push code from this repository into Apps Script.
3. Do not merge new Apps Script implementation work based on the stale GitHub tree.
   New ideas can be captured as issues, acceptance criteria, mockups, and design
   documents without changing production source files.
4. Keep each planned feature independent so it can be reassessed after the live
   source is imported. Do not assume current function names, schemas, or UI markup
   still match production.
5. Leave the temporary API-test cleanup alone until the source is safely captured.

When `clasp` becomes available, use it for a **pull-only first capture**:

1. Start in a new empty directory—not this repository checkout.
2. Confirm the Script ID belongs to the safety copy or intended read source.
3. Run `clasp pull` into that empty directory. Do not run `clasp push`, `deploy`, or
   any command that writes to Apps Script.
4. Preserve that untouched pull as the raw snapshot and record its checksum/commit.
5. Compare the raw snapshot with GitHub using the read-only comparison tool.
6. Reconcile on a new reviewed branch and merge only after every difference is
   classified and tests pass.

This deferred route requires no copying today. Its tradeoff is that repository-based
feature implementation must wait; otherwise new code would be built on a source tree
already known not to match production, creating a three-way merge among old GitHub,
new GitHub work, and newer live code.

## Review and reconciliation procedure

1. Preserve the raw branch and its commit hash as immutable evidence.
2. Run the read-only comparison tool:

   ```bash
   python3 tools/compare_apps_script_sources.py --baseline . --candidate /path/to/live-snapshot
   ```

3. Confirm the candidate inventory against the Apps Script editor file list.
   Missing files block reconciliation. An extra file is not automatically deleted.
4. Create `reconcile/live-reviewed-2026-09-28` from `main`.
5. Apply reviewed live files to that branch. For every difference, classify it as:
   - production source to preserve;
   - a reviewed GitHub-only change to reapply later;
   - temporary API-test material; or
   - unresolved (which blocks the merge).
6. In the reviewed GitHub branch only, omit `SourceExport.gs` if it is confirmed to
   be solely the temporary test. Restore the known pre-test manifest there only
   after verifying that no legitimate pre-existing scopes are lost. Do **not** use
   this cleanup as an instruction to edit the live project.
7. Run `npm test`, `npm run check:syntax`, and inspect the complete GitHub diff.
8. Require a human review that confirms file count, file names, manifest, and the
   highest-risk services (`App.gs`, authentication/access helpers, sheet schemas,
   backup code, Live Game, and Settings).
9. Merge only the reviewed reconciliation pull request into `main`. Never merge the
   raw evidence pull request.
10. After merge, compare the resulting `main` tree to the reviewed snapshot again.
    Analytics work remains blocked until the comparison has no unexplained source
    differences.

## Production cleanup is a separate decision

This issue does not authorize removing `SourceExport.gs` or changing OAuth scopes
in the live project. Once GitHub accurately preserves the source, production
cleanup can be planned as a separate, reviewed change with the original manifest,
a second person checking the diff, and a rollback copy already available.

## Reconciliation acceptance checklist

- [ ] Raw snapshot branch created from GitHub `main`.
- [ ] Complete Apps Script editor file list recorded.
- [ ] Every live `.gs`, `.html`, and manifest file captured.
- [ ] Raw commit preserved and marked not to merge.
- [ ] Comparison report reviewed; no unexplained missing files.
- [ ] Temporary API-test artifacts classified without editing production.
- [ ] Reviewed branch passes tests and syntax checks.
- [ ] Human reviewer confirms sensitive files and manifest.
- [ ] Reviewed branch, not raw branch, merged into `main`.
- [ ] Post-merge source comparison has no unexplained differences.
- [ ] Only then may analytics implementation begin.

## References

- [GitHub issue #144](https://github.com/CoachCDubb/CoachIQIQ/issues/144)
- [Google Apps Script import/export guide](https://developers.google.com/apps-script/guides/import-export)
- [Google Account Help: download your data](https://support.google.com/accounts/answer/3024190)
