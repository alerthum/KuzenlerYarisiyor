# Assessment Engineering Engine V2 — Phase 4B Grade 8 Turkish Calibration

## Decision

The project has reached its first human content-review stage under the curriculum-first architecture. Five game-independent canonical Grade 8 Turkish reading questions were produced against five official outcomes. The package is intentionally small: it calibrates the quality bar before any 24-item expansion or game binding.

## Official outcome coverage

- `T.8.3.17` — main idea/main emotion
- `T.8.3.23` — compare texts
- `T.8.3.25` — supported inference
- `T.8.3.29` — analyse media texts
- `T.8.3.31` — question source reliability

## Implemented quality gates

- answer requires multiple evidence nodes,
- single-sentence answer giveaway is explicitly disallowed,
- at least two distractors must be partially supported,
- all options share one semantic field,
- option lengths are checked for answer cues,
- three progressive hints are required,
- every option receives teaching feedback,
- solver and independent verifier use different decision procedures,
- second-correct-option and single-evidence mutations fail,
- game adaptation remains locked until human calibration approval.

## Automated evidence

- New Phase 4B calibration tests: 9/9 PASS
- Full Assessment V2 regression: 74/74 PASS
- Legacy publication policy: 2/2 PASS
- Production build: PASS using the repository example configuration only for local build verification; no private environment file is included.

## Honest state

- Human review: `NOT_MEASURED`
- Expansion to 24 items: not started
- Game adaptation: forbidden
- `productReady=false`
- Legacy content remains `UNVERIFIED_LEGACY`
