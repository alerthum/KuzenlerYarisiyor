import { mergeEvidenceFromSource } from '../question-evidence-contract.js';

export const foreignLanguageAnalyzer = {
  id: 'foreign-language-analyzer',
  subjects: ['İngilizce', 'ingilizce', 'YDT'],
  analyze(evidence = {}, ctx = {}) {
    const notes = [];
    const excerpt = String(evidence.questionExcerpt || '');
    const flow = [...(evidence.informationFlow || [])];
    if (!flow.length && excerpt) {
      flow.push('parse-utterance', 'identify-speech-act', 'select-response');
      notes.push('inferred_informationFlow_foreign_language');
    }
    const next = mergeEvidenceFromSource(evidence, {
      representationType: evidence.representationType || 'verbal-bilingual',
      informationFlow: flow,
      dependentDecisionCount: Math.max(Number(evidence.dependentDecisionCount) || 0, excerpt ? 2 : 0),
      questionType: evidence.questionType || (evidence.optionCount ? 'choice' : null)
    });
    return {
      evidence: next,
      notes,
      blueprintHints: {
        subject: 'İngilizce',
        cognitiveTargets: ['pragmatics', 'lexical-context'],
        suitableGameIds: ctx.suitableGameIds || []
      }
    };
  }
};

export default foreignLanguageAnalyzer;
