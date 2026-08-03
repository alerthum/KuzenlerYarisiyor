/**
 * Ders analiz adapter kaydı — ortak motor if/else zinciri YOK.
 * Her adapter aynı arayüzü uygular: { id, subjects, analyze(evidence, ctx) }
 */

import { mathematicsAnalyzer } from './mathematics-analyzer.js';
import { languageAnalyzer } from './language-analyzer.js';
import { scienceAnalyzer } from './science-analyzer.js';
import { socialScienceAnalyzer } from './social-science-analyzer.js';
import { foreignLanguageAnalyzer } from './foreign-language-analyzer.js';

const ADAPTERS = [
  mathematicsAnalyzer,
  languageAnalyzer,
  scienceAnalyzer,
  socialScienceAnalyzer,
  foreignLanguageAnalyzer
];

function normalizeSubject(subject = '') {
  return String(subject).toLocaleLowerCase('tr-TR');
}

export function listAnalyzers() {
  return ADAPTERS.map((a) => ({ id: a.id, subjects: [...a.subjects] }));
}

export function resolveAnalyzer(subject) {
  const key = normalizeSubject(subject);
  return ADAPTERS.find((a) => a.subjects.some((s) => key.includes(normalizeSubject(s)))) || null;
}

/**
 * Ortak analiz girişi — adapter seçimi veri odaklı.
 */
export function analyzeEvidence(evidence = {}, ctx = {}) {
  const analyzer = resolveAnalyzer(evidence.subject || ctx.subject || '');
  if (!analyzer) {
    return {
      ok: false,
      analyzerId: null,
      evidence,
      notes: ['no_adapter_for_subject'],
      blueprintHints: null
    };
  }
  const result = analyzer.analyze(evidence, ctx);
  return {
    ok: true,
    analyzerId: analyzer.id,
    evidence: result.evidence || evidence,
    notes: result.notes || [],
    blueprintHints: result.blueprintHints || null
  };
}

export default { listAnalyzers, resolveAnalyzer, analyzeEvidence };
