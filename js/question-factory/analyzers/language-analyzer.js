import { mergeEvidenceFromSource } from '../question-evidence-contract.js';

export const languageAnalyzer = {
  id: 'language-analyzer',
  subjects: ['Türkçe', 'Türk Dili ve Edebiyatı', 'turkce', 'edebiyat'],
  analyze(evidence = {}, ctx = {}) {
    const notes = [];
    const excerpt = String(evidence.questionExcerpt || '');
    const flow = [...(evidence.informationFlow || [])];
    if (!flow.length && excerpt) {
      flow.push('read-text', 'locate-evidence', 'infer');
      notes.push('inferred_informationFlow_language');
    }
    const next = mergeEvidenceFromSource(evidence, {
      representationType: evidence.representationType || 'verbal-text',
      informationFlow: flow,
      dependentDecisionCount: Math.max(Number(evidence.dependentDecisionCount) || 0, excerpt ? 2 : 0),
      questionType: evidence.questionType || (evidence.optionCount ? 'choice' : null)
    });
    return {
      evidence: next,
      notes,
      blueprintHints: {
        subject: evidence.subject || 'Türkçe',
        cognitiveTargets: ['inference', 'evidence-linking'],
        suitableGameIds: ctx.suitableGameIds || []
      }
    };
  }
};

export default languageAnalyzer;
