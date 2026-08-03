import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPETITION_POLICY_V2, buildBlockedSetsV2 } from '../js/quality/repetition-policy-v2.js';
import { planCapacity } from '../js/quality/capacity-planner.js';
import { listAnalyzers, resolveAnalyzer } from '../js/question-factory/analyzers/analyzer-registry.js';
import { PIPELINE_STAGES, emptyQuestionEvidence } from '../js/question-factory/question-evidence-contract.js';
import { getCurriculumGraph, SUBJECT_CATALOG } from '../js/curriculum/curriculum-graph.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

test('Repetition Policy V2 config is game/subject/grade independent', () => {
  assert.equal(REPETITION_POLICY_V2.cognitiveExperienceId.lifetimeBan, false);
  const math = buildBlockedSetsV2([
    { gameId: 'problem-hunter', gradeBand: '4', sessionIndex: 0, cognitiveExperienceId: 'cx-a', skeletonId: 'sk-a', structuralId: 'st-a', familyId: 'f-a' }
  ], { gameId: 'problem-hunter', gradeBand: '4', currentSessionIndex: 3 });
  const turkce = buildBlockedSetsV2([
    { gameId: 'paragraph-detective', gradeBand: '8', sessionIndex: 0, cognitiveExperienceId: 'cx-b', skeletonId: 'sk-b', structuralId: 'st-b', familyId: 'f-b' }
  ], { gameId: 'paragraph-detective', gradeBand: '8', currentSessionIndex: 3 });
  assert.equal(math.lifetimeCx, false);
  assert.equal(turkce.lifetimeCx, false);
  assert.equal(math.policyVersion, turkce.policyVersion);
});

test('capacity planner does not require lgs-foundation gameId', () => {
  const plan = planCapacity({
    gameId: 'paragraph-detective',
    gradeBand: 4,
    sessionLength: 10,
    annualSessionsPerStudent: 40,
    usageShare: 1
  }, { familyCount: 12, skeletonCount: 48, structuralCount: 200, cognitiveExperienceCount: 200, exactQuestionEstimate: 5000 });
  assert.ok(plan.annualDemand > 0);
  assert.equal(plan.gameId, 'paragraph-detective');
});

test('registry capacity helpers have no targeted gameId allowlists', () => {
  const registry = fs.readFileSync(path.join(root, 'js/games/registry.js'), 'utf8');
  assert.equal(registry.includes("['lgs-foundation', 'science-reasoning', 'error-detective']"), false);
  assert.equal(registry.includes("['error-detective', 'lgs-foundation', 'science-reasoning']"), false);
  // Ortak surplus kuralı
  assert.match(registry, /sessionLength \|\| 5\) \* 10/);
});

test('curriculum graph covers catalog subjects and grades 1-12 skeleton', () => {
  const graph = getCurriculumGraph();
  assert.equal(SUBJECT_CATALOG.length, 15);
  assert.ok(graph.gradesCovered >= 1);
  assert.ok(graph.skillCount >= 10);
});

test('question evidence contract and analyzer adapters exist', () => {
  assert.ok(PIPELINE_STAGES.includes('CURRICULUM_MAPPING'));
  assert.ok(PIPELINE_STAGES.includes('PUBLISH_GATE'));
  const empty = emptyQuestionEvidence();
  assert.equal(empty.verificationStatus, 'PARTIAL');
  assert.equal(empty.answerVisible, false);
  const analyzers = listAnalyzers();
  assert.ok(analyzers.length >= 5);
  assert.ok(resolveAnalyzer('Matematik'));
  assert.ok(resolveAnalyzer('İngilizce'));
  assert.ok(resolveAnalyzer('Fen Bilimleri'));
});
