import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'content/v11/cognitive-skeletons.v11.json');
const outputPath = path.join(root, 'content/v11/question-blueprints.v11.json');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

function normalizeCount(value, fallback = 1) {
  if (Number.isFinite(value)) return { mode: 'EXACT', min: value, max: value, raw: String(value) };
  const raw = String(value ?? '').trim();
  const nums = [...raw.matchAll(/\d+/g)].map(m => Number(m[0]));
  if (nums.length >= 2) return { mode: 'RANGE', min: Math.min(...nums), max: Math.max(...nums), raw };
  if (nums.length === 1) return { mode: 'EXACT', min: nums[0], max: nums[0], raw };
  return { mode: 'HOLISTIC', min: fallback, max: null, raw: raw || 'Bütünsel' };
}

function difficultyLevel(name, rule, order) {
  return {
    level: order,
    code: name.toUpperCase(),
    labelTr: name === 'easy' ? 'Kolay' : name === 'medium' ? 'Orta' : 'Zor',
    transformationRule: rule,
    mustPreserveSkeletonLogic: true
  };
}

function createBlueprint(s) {
  const sourceCount = normalizeCount(s.requirements?.sourceCount?.value ?? s.requirements?.sourceCount?.raw, 1);
  const evidenceCount = normalizeCount(s.requirements?.evidenceCount?.value ?? s.requirements?.evidenceCount?.raw, 1);
  const distractors = (s.distractors || []).map((d, index) => ({
    optionRole: `DISTRACTOR_${index + 1}`,
    misconceptionId: `${s.skeletonId}_M${index + 1}`,
    misconception: d.misconception,
    mustBePlausible: true,
    mustBeTextGroundedOrDiagnostic: true
  }));

  return {
    schemaVersion: '11.0.0',
    blueprintId: `BP_${s.skeletonId}`,
    skeletonId: s.skeletonId,
    familyId: s.familyId,
    status: 'ACTIVE',
    identity: {
      visibleNameTr: s.visibleNameTr,
      mainSkill: s.mainSkill,
      subSkill: s.subSkill,
      grades: s.grades,
      cognitiveSteps: s.cognitiveSteps
    },
    sourceContract: {
      textStructure: s.textStructure,
      sourceCount,
      allowedSourceCount: sourceCount.max == null ? { min: sourceCount.min, max: 4 } : { min: sourceCount.min, max: sourceCount.max },
      sourceMustBeNecessary: true,
      noDecorativeSource: true
    },
    evidenceContract: {
      evidenceCount,
      correctAnswerMustReferenceEvidence: true,
      evidenceMustBeNecessary: true,
      evidenceUnitsMustBeAddressable: true,
      allowHolisticEvidence: evidenceCount.mode === 'HOLISTIC'
    },
    questionContract: {
      targetSkill: s.subSkill,
      cognitiveOperationSequence: s.cognitiveSteps,
      correctAnswerLogic: s.correctAnswerLogic,
      stemMustRequireReasoning: true,
      stemMustNotRevealAnswer: true,
      oneBestAnswer: true
    },
    optionContract: {
      optionCount: 4,
      correctOptionCount: 1,
      distractorCount: 3,
      distractors,
      distractorsMustRepresentDistinctMisconceptions: true,
      optionsMustBeParallelInForm: true,
      noGiveawayLengthOrGrammar: true
    },
    difficultyContract: {
      levels: [
        difficultyLevel('easy', s.difficultyRules.easy, 1),
        difficultyLevel('medium', s.difficultyRules.medium, 2),
        difficultyLevel('hard', s.difficultyRules.hard, 3)
      ],
      difficultyMustChangeReasoningDemand: true,
      topicChangeAloneIsNotDifficulty: true
    },
    variationContract: {
      realVariationAxes: s.realVariationAxes,
      forbiddenCosmeticOnlyVariations: s.surfaceMakeupExamples,
      selectedAxisRequired: true,
      variationMustPreserveIdentity: true
    },
    sessionContract: {
      notTogetherWith: s.notTogetherWith,
      duplicateSkeletonLimit: 1
    },
    qualityGate: {
      rejectReasons: s.qualityRejectionReasons,
      mandatoryChecks: [
        'SOURCE_COUNT_VALID',
        'EVIDENCE_COUNT_VALID',
        'ONE_BEST_ANSWER',
        'THREE_DISTINCT_MISCONCEPTIONS',
        'REAL_VARIATION_AXIS_USED',
        'NO_COSMETIC_ONLY_VARIATION',
        'NO_ANSWER_LEAK',
        'SKELETON_LOGIC_PRESERVED'
      ]
    },
    traceability: {
      sourceBasis: s.sourceBasis,
      generatedFromCatalogVersion: source.version
    }
  };
}

const blueprints = source.skeletons.map(createBlueprint);
const output = {
  version: '11.0.0-stage9',
  generatedAt: new Date().toISOString(),
  sourceCatalog: 'content/v11/cognitive-skeletons.v11.json',
  blueprintCount: blueprints.length,
  familyCount: new Set(blueprints.map(x => x.familyId)).size,
  blueprints
};
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`V11 Question Blueprint Build: ${output.blueprintCount} blueprint • ${output.familyCount} aile • ${outputPath}`);
