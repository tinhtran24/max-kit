# Complexity Assessment

Classify after scouting and diagnosis, so the route follows the confirmed cause, not the
wording of the request.

| Route | Indicators | Progress tracking |
|---|---|---|
| Simple (`workflow-quick.md`) | One file, clear error (type, syntax, lint), obvious fix location, root cause confirmed | None; under three steps |
| Moderate (`workflow-standard.md`) | 2-5 files, cause known but the fix spans files, or diagnosis still needs confirming | Six phases in the active plan, mirrored to the live surface when available |
| Complex (`workflow-deep.md`) | System-wide (5+ files), architecture decision, research needed, performance or security issue, cause spans layers | Nine phases with dependencies; scout, diagnose and research may run in parallel |
| Parallel (`--parallel`) | The flag was passed, or 2+ independent issues in different areas with no dependencies between them | One dependency tree per issue (scout, diagnose, fix, verify), one non-overlapping scope per agent |

`--parallel` activates parallel routing regardless of the classification.
