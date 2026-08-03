import { mergeEvidenceFromSource } from '../question-evidence-contract.js';

export const mathematicsAnalyzer = {
  id: 'mathematics-analyzer',
  subjects: ['Matematik', 'matematik'],
  analyze(evidence = {}, ctx = {}) {
    const notes = [];
    const excerpt = String(evidence.questionExcerpt || '');
    const flow = [...(evidence.informationFlow || [])];
    if (!flow.length && excerpt) {
      flow.push('read-quantities', 'select-operation', 'verify');
      notes.push('inferred_informationFlow_from_excerpt_structure');
    }
    const dependentDecisionCount = Math.max(
      Number(evidence.dependentDecisionCount) || 0,
      /sonra|ardından|önce/i.test(excerpt) ? 2 : (excerpt ? 1 : 0)
    );
    const next = mergeEvidenceFromSource(evidence, {
      representationType: evidence.representationType || (/\d/.test(excerpt) ? 'symbolic-numeric' : null),
      informationFlow: flow,
      dependentDecisionCount,
      questionType: evidence.questionType || (evidence.optionCount ? 'choice' : null)
    });
    return {
      evidence: next,
      notes,
      blueprintHints: {
        subject: 'Matematik',
        cognitiveTargets: ['multi-step', 'quantity-reasoning'],
        suitableGameIds: ctx.suitableGameIds || []
      }
    };
  }
};

export default mathematicsAnalyzer;
