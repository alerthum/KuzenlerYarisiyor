import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { assertSubjectEngineResult } from './subject-engine-contract.js';
import { adaptCanonicalQuestion } from './game-adapter-contract.js';
import { curriculumRouteForGrade } from '../curriculum/curriculum-rollout-2026-2027.js';

export function produceCanonicalQuestion({ request, subjectEngine }) {
  const route = curriculumRouteForGrade(request.grade);
  const plan = subjectEngine.plan(Object.freeze({ ...structuredClone(request), curriculumRoute: route }));
  const generated = subjectEngine.generate(structuredClone(plan));
  const canonical = defineCanonicalQuestion({
    ...generated,
    curriculum: {
      ...generated.curriculum,
      schoolYear: route.schoolYear,
      programFamily: route.programFamily,
      grade: route.grade,
      sourceIds: [...new Set([...(generated.curriculum?.sourceIds || []), route.sourceId, route.rolloutEvidenceSourceId])]
    }
  });
  const proof = assertSubjectEngineResult(subjectEngine, canonical);
  return Object.freeze({ canonical, proof, plan: Object.freeze(structuredClone(plan)) });
}

export function bindQuestionToGame({ canonicalQuestion, gameAdapter }) {
  return adaptCanonicalQuestion(gameAdapter, canonicalQuestion);
}
