import { mergeEvidenceFromSource } from '../question-evidence-contract.js';

export const scienceAnalyzer = {
  id: 'science-analyzer',
  subjects: ['Fen Bilimleri', 'Fizik', 'Kimya', 'Biyoloji', 'fen', 'fizik', 'kimya', 'biyoloji'],
  analyze(evidence = {}, ctx = {}) {
    const notes = [];
    const excerpt = String(evidence.questionExcerpt || '');
    const flow = [...(evidence.informationFlow || [])];
    if (!flow.length && excerpt) {
      flow.push('observe-claim', 'link-evidence', 'conclude');
      notes.push('inferred_informationFlow_science');
    }
    const next = mergeEvidenceFromSource(evidence, {
      representationType: evidence.representationType || (/grafik|tablo|deney/i.test(excerpt) ? 'data-visual' : 'verbal-scientific'),
      informationFlow: flow,
      dependentDecisionCount: Math.max(Number(evidence.dependentDecisionCount) || 0, excerpt ? 2 : 0),
      questionType: evidence.questionType || (evidence.optionCount ? 'choice' : null)
    });
    return {
      evidence: next,
      notes,
      blueprintHints: {
        subject: evidence.subject || 'Fen Bilimleri',
        cognitiveTargets: ['variable-control', 'evidence'],
        suitableGameIds: ctx.suitableGameIds || []
      }
    };
  }
};

export default scienceAnalyzer;
