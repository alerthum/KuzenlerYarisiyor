import { mergeEvidenceFromSource } from '../question-evidence-contract.js';

export const socialScienceAnalyzer = {
  id: 'social-science-analyzer',
  subjects: [
    'Sosyal Bilgiler', 'Tarih', 'Coğrafya', 'Hayat Bilgisi',
    'T.C. İnkılap Tarihi ve Atatürkçülük', 'Din Kültürü ve Ahlak Bilgisi', 'Felsefe',
    'sosyal', 'tarih', 'coğrafya', 'felsefe', 'din'
  ],
  analyze(evidence = {}, ctx = {}) {
    const notes = [];
    const excerpt = String(evidence.questionExcerpt || '');
    const flow = [...(evidence.informationFlow || [])];
    if (!flow.length && excerpt) {
      flow.push('read-context', 'relate-cause-effect', 'judge');
      notes.push('inferred_informationFlow_social');
    }
    const next = mergeEvidenceFromSource(evidence, {
      representationType: evidence.representationType || (/harita|şekil/i.test(excerpt) ? 'spatial-map' : 'verbal-social'),
      informationFlow: flow,
      dependentDecisionCount: Math.max(Number(evidence.dependentDecisionCount) || 0, excerpt ? 2 : 0),
      questionType: evidence.questionType || (evidence.optionCount ? 'choice' : null)
    });
    return {
      evidence: next,
      notes,
      blueprintHints: {
        subject: evidence.subject || 'Sosyal Bilgiler',
        cognitiveTargets: ['cause-effect', 'civic-reasoning'],
        suitableGameIds: ctx.suitableGameIds || []
      }
    };
  }
};

export default socialScienceAnalyzer;
