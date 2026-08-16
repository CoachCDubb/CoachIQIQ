# Exact pre-crash CoachIQ baseline

The application source in this repository matches the last known pre-crash
snapshot recovered from the CoachIQ Apps Script rollout.

## Verification fingerprint

Relative to commit `bcf009f` (`Version 1.0.0`):

- `GameService.gs`: 926 added lines
- `Scripts.html`: 771 additions and 35 deletions
- `Styles.html`: 305 additions and 3 deletions; 2,457 total lines
- 25 application files changed

The complete application-only recovery patch is tracked at:

`backups/CoachIQ-exact-pre-crash.patch.gz.b64`

## Restore

From the repository root, restore the application files onto Version 1.0.0 with:

```bash
git checkout bcf009f -- .
base64 -d backups/CoachIQ-exact-pre-crash.patch.gz.b64 | gzip -dc | git apply
```

Do not apply the patch on top of an already-restored snapshot.

## Important feature boundary

This snapshot predates the changes that destabilized Live Game. It does not
contain `EmbeddedPages.Game`, `getRecommendedLiveGamePlans_`,
`useRecommendedLiveGamePlan`, or `trackPostgamePlanAgain`.
