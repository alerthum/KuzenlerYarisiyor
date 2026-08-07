# Assessment Engineering Engine V2 — Phase 4B Option Balance R1

## Trigger

Human calibration feedback reported that 2 of the 5 Grade 8 Turkish questions could be answered from the option rhetoric without reading the stimulus.

## Root cause

The previous gate balanced option length and semantic field, but it did not detect the recurring rhetorical signature of the correct answer:

- the only qualified or two-sided claim,
- the only option containing an evidence limitation,
- the only academically balanced sentence,
- distractors carrying visibly absolute or one-sided claims.

This made the correct answer guessable even when all options had similar word counts.

## Remediation

- Rewrote all 20 options in the five-question calibration set.
- Preserved each question's answer key, evidence graph, misconception identities and curriculum binding.
- Made distractors plausible, partially supported and rhetorically comparable to the correct answer.
- Removed easy absolute-word and simplistic-overclaim patterns.
- Added an option-only rhetorical cue audit.
- Added a mutation test that hides the stimulus and makes the correct option the only qualified/limited claim; the gate must return RED.

## Automated evidence

- Grade 8 Turkish calibration tests: 10/10 PASS
- Assessment Engine V2 regression: 75/75 PASS
- Legacy publication policy: 2/2 PASS
- Production build: PASS using a temporary local copy of `KUZENLER_AYARLARI.env.ORNEK`; the temporary configuration was removed and is not included in the checkpoint.
- Blind option cue risk: 0 for all five questions

## Honest status

- Human review remains `NOT_MEASURED` for the revised option set.
- `productReady=false`
- Game adaptation remains locked.
- The five questions must be reviewed again before the 24-question pilot begins.
