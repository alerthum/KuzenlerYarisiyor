# Assessment Engineering Engine V2 — Phase 4C R1 Fresh Review Fix

## Problem

The first Phase 4C 12-item human-review pack incorrectly reused all five Phase 4B calibration questions. Seven additional questions were new, but the pack was presented as a new review set. This was a review-selection defect, not a solver or canonical-question defect.

## Root cause

`scripts/build-assessment-v2-phase4c-pilot01-review.mjs` contained a manually selected ID list that intentionally included the five accepted calibration items. The script checked item count, outcome coverage and answer-position balance, but did not check whether an item had already appeared in a previous human-review pack.

## Fix

- Registered the 12 question IDs already shown in previous review packs.
- Registered the 12 remaining Pilot-01 questions as the fresh R1 review set.
- Added a hard overlap gate: any intersection with previously shown IDs stops review generation.
- Preserved eight-outcome coverage.
- Preserved answer-position balance: A=3, B=3, C=3, D=3.
- Generated new JSON and HTML review artifacts with explicit fresh-review metadata.
- Added a regression test that fails if a previously shown item returns to the fresh review set.

## Evidence

- Fresh review items: 12
- Previously shown items excluded: 12
- Previous-review overlap: 0
- Outcomes covered: 8
- Answer positions: A=3, B=3, C=3, D=3
- Assessment V2 regression: 86/86 PASS
- Production build: PASS
- `productReady=false`
- Game adaptation remains locked.
