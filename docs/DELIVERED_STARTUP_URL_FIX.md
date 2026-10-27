# Confirmed startup syntax failure: logo URL check

The supplied startup diagnostics identified Scripts/main line 2720, column 60. The delivered expression ended at `indexOf("https:`; the remainder beginning with the two slashes had disappeared. Several ordinary line comments were also absent. The originally pasted Scripts.html was intact. The specific delivery component responsible is not established, but the malformed delivered expression is the confirmed syntax failure.

Replace the URL prefix literal in the initializer with `"https:" + String.fromCharCode(47, 47)`. This retains the original case-insensitive HTTPS prefix validation without a literal double slash in that JavaScript string.

## Immediate repair

In Extensions → Apps Script → Scripts.html, find `const logoUrl =` inside `applyCoachIQTheme`. Replace its entire declaration with:

```javascript
    const logoUrl = requestedLogoUrl.toLowerCase().indexOf("https:" + String.fromCharCode(47, 47)) === 0
      ? requestedLogoUrl
      : "";
```

Include the declaration’s final semicolon when selecting it. Save, close the CoachIQ dialog, refresh the spreadsheet and launch CoachIQ again. A web-app deployment additionally requires publishing a new version. No records or GameDay assets change.

Alternatively merge this fix and copy the full updated Scripts.html. No other Apps Script file needs updating for this repair.

## Validation

Replacing only the damaged expression in the supplied browser-captured module made that entire module pass syntax checks. A full HTML browser fixture using that repaired captured module opened CoachIQ successfully with simulated Google services. The new regression verifies the original expression fails under the observed line-tail removal, while the replacement still parses and retains accepted/rejected logo URL behavior. All 337 root tests pass; syntax and diff checks pass. Reopening the actual Google-hosted project remains the final user-side verification.
