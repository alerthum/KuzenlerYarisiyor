# Assessment Engineering Engine V2 — Phase 4A Curriculum-First Foundation

## Decision

The project no longer treats an item model or a game family as the starting point of content production.
The enforced order is now:

1. authoritative curriculum and exam source,
2. grade/course/unit/topic/outcome selection,
3. subject-specific construct and misconception plan,
4. canonical question generation,
5. domain solver and genuinely independent verifier,
6. progressive hints and option-by-option teaching feedback,
7. content/style/ambiguity/age/difficulty gates,
8. game adaptation,
9. semantic round-trip validation,
10. human pilot and publication decision.

The shared layer is a **question contract**, not one universal question generator.
Mathematics, reading/Turkish, science, social sciences, foreign language and other domains may use different solvers, source structures, item formats, misconception catalogs and style catalogs.

## Evidence reviewed

- User-provided conversation about a universal curriculum/question JSON and prompt station.
- User-provided human-authored paragraph question-bank sample, used only as a genre/stem/option-style reference.
- MEB TYMM program index and pre-TYMM program archive.
- 2026-2027 MEB curriculum rollout routing.
- TTKB weekly course schedules.
- MEB multiple-choice item-writing guide.
- Current ÖSYM YKS, DGS and KPSS source families.
- OECD PISA 2025 and IEA TIMSS 2023 assessment frameworks.

No protected question text is copied into the engine.

## What was accepted from the attached conversation

- Curriculum/learning-outcome registry must precede question generation.
- A canonical JSON-like item contract is necessary.
- Every option needs a pedagogical explanation.
- Hints must be available during solving.
- Correct answers require reverse/independent verification.
- Grade, course, topic, outcome and exam target must be explicit metadata.
- Game presentation must be separated from content truth.

## What was rejected or corrected

- A single global distractor recipe is not valid across all courses.
- Item format and option count cannot be selected from grade alone.
- Not every outcome should be forced into a daily-life or infographic scenario.
- An LLM checking its own answer is not an independent verifier.
- A generic system prompt cannot replace subject engines and deterministic validation.
- Example outcome codes must not be treated as official until located in the active official source/version.
- Engineering PASS must not imply product readiness.

## Audit of the supplied 8th-grade example package

The package is useful as a product-feature prototype, but not as a validated question bank.
Observed defects include:

- The artificial-intelligence/art item treats speed superiority over human production as a certain inference although the passage only says that AI produces in seconds.
- One stem contains a Turkish expression error: “aşağıdakilerin hangisinden ağır basmaktadır”.
- Some misconception-role labels do not match the actual error represented by the option.
- The flow-breaking item is too obvious for an intended LGS discrimination level.
- Several contexts repeat the popular-science explanatory voice, so the package still needs genre and voice diversity controls.

## Implemented modules

- `js/curriculum/curriculum-source-registry.js`
- `js/curriculum/curriculum-rollout-2026-2027.js`
- `js/curriculum/curriculum-ingestion-contract.js`
- `js/assessment-v2/canonical-question-contract.js`
- `js/assessment-v2/subject-engine-contract.js`
- `js/assessment-v2/game-adapter-contract.js`
- `js/assessment-v2/question-production-pipeline.js`
- `js/assessment-v2/question-architecture-policy.js`
- `tests/assessment-v2/curriculum-first-architecture.test.mjs`

## Current verified state

- 12/12 grades have an active 2026-2027 curriculum-version route.
- 112 compulsory course-placement records are source-verified for grades 1-12 across the initial primary/middle and Anadolu high-school schedules.
- The complete active 8th-grade Turkish program is ingested as a first end-to-end pilot: 76 official outcomes (14 listening/viewing, 7 speaking, 35 reading, 20 writing), including official guidance notes and source-page locators.
- Authoritative data sources and style-only sources are technically separated.
- Canonical questions cannot carry game bindings.
- Subject engines require domain solve, independent verification and quality audit methods.
- Game adapters require semantic round-trip validation.
- A source from the wrong active curriculum family cannot create an outcome record.
- Existing Assessment V2 models remain operational.
- `productReady=false` remains unchanged.
- Legacy content remains `UNVERIFIED_LEGACY`.

## Automated evidence

- Curriculum-first architecture tests: 11/11 PASS.
- Full Assessment Engine V2 regression: 65/65 PASS.
- Legacy publication-policy tests: 2/2 PASS.
- Production build: PASS.

## Honest coverage boundary

This checkpoint does **not** claim that every Turkish school type, elective course and learning outcome has already been ingested. The initial compulsory-course registry covers primary/middle school and Anadolu high school. Electives and other high-school types remain explicitly `NOT_YET_INGESTED`. Only the full 8th-grade Turkish outcome set is complete at outcome level in this checkpoint.

## Next implementation tranche

1. Expand official course schedules to all high-school types and elective groups.
2. Ingest official unit/topic/outcome records for each active grade/course/version without fabricated codes.
3. Build exam blueprint records for MEB common exams, LGS, TYT/AYT/YDT, DGS and KPSS.
4. Build subject-engine specifications and misconception catalogs course by course.
5. Produce canonical question pilot sets before any game binding; then run human review and only afterward create game adaptations.
