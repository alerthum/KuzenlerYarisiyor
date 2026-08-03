/**
 * Genel soru analiz boru hattı — ortak aşamalar, ders mantığı adapter ile.
 */

import { PIPELINE_STAGES, emptyQuestionEvidence, validateEvidenceContract, mergeEvidenceFromSource } from './question-evidence-contract.js';
import { analyzeEvidence } from './analyzers/analyzer-registry.js';
import { skillsForGradeSubject } from '../curriculum/curriculum-graph.js';
import { buildCognitiveExperience } from '../quality/question-factory-v13.js';

function stage(name, fn) {
  return { name, run: fn };
}

const STAGES = [
  stage('SOURCE', (ctx) => {
    if (!ctx.source?.sourceId) ctx.flags.push('SOURCE_GAP');
    return ctx;
  }),
  stage('DOCUMENT', (ctx) => {
    ctx.evidence = mergeEvidenceFromSource(ctx.evidence, {
      sourceId: ctx.source?.sourceId,
      sourceType: ctx.source?.sourceType,
      documentUrl: ctx.source?.documentUrl || null,
      page: ctx.source?.page ?? null
    });
    return ctx;
  }),
  stage('QUESTION_EVIDENCE', (ctx) => {
    ctx.evidence = mergeEvidenceFromSource(ctx.evidence, {
      evidenceId: ctx.evidence.evidenceId || `ev:${ctx.source?.sourceId || 'unknown'}:${ctx.source?.questionNo || 'x'}`,
      questionNo: ctx.source?.questionNo ?? null,
      questionExcerpt: ctx.source?.questionExcerpt || null,
      optionCount: ctx.source?.optionCount ?? null,
      optionsVisible: ctx.source?.optionsVisible === true,
      answerVisible: ctx.source?.answerVisible === true,
      solutionVisible: ctx.source?.solutionVisible === true,
      grade: ctx.source?.grade ?? null,
      subject: ctx.source?.subject || null,
      unit: ctx.source?.unit || null,
      topic: ctx.source?.topic || null,
      questionType: ctx.source?.questionType || null
    });
    return ctx;
  }),
  stage('CURRICULUM_MAPPING', (ctx) => {
    if (ctx.evidence.grade != null && ctx.evidence.subject) {
      const skills = skillsForGradeSubject(ctx.evidence.grade, ctx.evidence.subject);
      const ids = skills
        .filter((s) => !ctx.evidence.topic || s.topic === ctx.evidence.topic || s.unit === ctx.evidence.unit)
        .map((s) => s.curriculumSkillId);
      if (ids.length) {
        ctx.evidence = mergeEvidenceFromSource(ctx.evidence, { curriculumSkillIds: ids.slice(0, 5) });
      } else {
        ctx.flags.push('CURRICULUM_MAPPING_GAP');
      }
    } else {
      ctx.flags.push('CURRICULUM_MAPPING_GAP');
    }
    return ctx;
  }),
  stage('BLUEPRINT_EXTRACTION', (ctx) => {
    const analyzed = analyzeEvidence(ctx.evidence, {
      suitableGameIds: ctx.suitableGameIds || []
    });
    ctx.analyzerId = analyzed.analyzerId;
    ctx.blueprintHints = analyzed.blueprintHints;
    ctx.evidence = analyzed.evidence;
    if (!analyzed.ok) ctx.flags.push('ANALYZER_GAP');
    return ctx;
  }),
  stage('SOLUTION_GRAPH', (ctx) => {
    if (!(ctx.evidence.solutionGraph || []).length && ctx.source?.solutionVisible) {
      ctx.evidence = mergeEvidenceFromSource(ctx.evidence, {
        solutionGraph: ctx.source.solutionGraph || []
      });
    }
    if (!(ctx.evidence.solutionGraph || []).length) ctx.flags.push('SOLUTION_GRAPH_GAP');
    return ctx;
  }),
  stage('INDEPENDENT_SOLVER', (ctx) => {
    // Kaynakta cevap yoksa solver sonucu uydurulmaz.
    if (!ctx.evidence.answerVisible) {
      ctx.solver = { ran: false, reason: 'answer_not_visible_in_source' };
    } else {
      ctx.solver = { ran: true, status: 'deferred_to_runtime_gate' };
    }
    return ctx;
  }),
  stage('MISCONCEPTION_MODEL', (ctx) => {
    if (!(ctx.evidence.misconceptionEvidence || []).length) ctx.flags.push('MISCONCEPTION_GAP');
    return ctx;
  }),
  stage('DISTRACTOR_PLAN', (ctx) => {
    if (!(ctx.evidence.distractorEvidence || []).length && ctx.evidence.optionsVisible) {
      ctx.flags.push('DISTRACTOR_GAP');
    }
    return ctx;
  }),
  stage('AGE_DIFFICULTY_VALIDATION', (ctx) => {
    const g = Number(ctx.evidence.grade);
    if (Number.isFinite(g) && g >= 3) {
      ctx.ageDifficulty = { minDifficulty: 3, note: 'grade>=3 rejects easy/medium routine' };
    } else {
      ctx.ageDifficulty = { minDifficulty: null, note: 'not_measured' };
    }
    return ctx;
  }),
  stage('SEMANTIC_CX_IDENTITY', (ctx) => {
    if (ctx.evidence.questionExcerpt) {
      const cx = buildCognitiveExperience({
        prompt: ctx.evidence.questionExcerpt,
        kind: ctx.evidence.questionType || 'choice',
        familyId: ctx.blueprintHints?.familyId || null,
        skeletonId: ctx.blueprintHints?.skeletonId || null,
        options: Array(ctx.evidence.optionCount || 0).fill('?')
      });
      ctx.evidence = mergeEvidenceFromSource(ctx.evidence, {
        structuralIdCandidate: cx.structuralId,
        cognitiveExperienceIdCandidate: cx.cognitiveExperienceId
      });
    }
    return ctx;
  }),
  stage('PUBLISH_GATE', (ctx) => {
    const validation = validateEvidenceContract(ctx.evidence);
    ctx.publish = {
      ok: validation.ok && ctx.evidence.verificationStatus !== 'REJECTED' && !ctx.flags.includes('SOURCE_GAP'),
      errors: validation.errors,
      flags: [...ctx.flags]
    };
    return ctx;
  })
];

/**
 * Tek kaynak kaydını ortak pipeline'dan geçir.
 */
export function runAnalysisPipeline(source = {}, options = {}) {
  let ctx = {
    source,
    evidence: emptyQuestionEvidence(),
    flags: [],
    suitableGameIds: options.suitableGameIds || [],
    stages: []
  };
  for (const s of STAGES) {
    ctx = s.run(ctx);
    ctx.stages.push({ name: s.name, flags: [...ctx.flags] });
  }
  return {
    pipelineVersion: '1.0',
    stages: PIPELINE_STAGES,
    analyzerId: ctx.analyzerId || null,
    evidence: ctx.evidence,
    blueprintHints: ctx.blueprintHints || null,
    solver: ctx.solver || null,
    publish: ctx.publish || null,
    flags: ctx.flags,
    stageTrace: ctx.stages
  };
}

export default runAnalysisPipeline;
