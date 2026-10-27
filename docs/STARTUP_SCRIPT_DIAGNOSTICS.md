# Capture the installed startup failure

The user-supplied Scripts.html and PlayerModule.html both match the repository (apart from final newline) and pass syntax checks. The supplied Index.html matches the startup monitor. The installed browser nevertheless reports `Invalid or unexpected token` at generated document line 2720. That is not enough to identify the source defect; this change does not claim to fix it.

The startup error panel now offers **Download startup diagnostics**. It records the error message, generated line/column, and text of recognized static CoachIQ script modules from the browser DOM. Unknown and external scripts contribute only index, external status and character count. Google bootstrap code, external URLs, live settings, spreadsheet records and browser storage are not exported.

After merging, replace the entire Index.html in the affected spreadsheet's Apps Script project, save, close the dialog, refresh the spreadsheet and launch CoachIQ. If it fails, click Download startup diagnostics and send CoachIQ-startup-diagnostics.json for analysis. Do not clear storage or delete records. A deployed web-app URL requires publishing a new version; the spreadsheet dialog uses saved source.

Validation: all 335 root tests pass; syntax/diff checks pass. A browser fixture with intentionally malformed app code verified that the real button downloads JSON retaining the malformed module and generated error position. The actual installed-project cause remains unresolved until its diagnostic capture is inspected.
