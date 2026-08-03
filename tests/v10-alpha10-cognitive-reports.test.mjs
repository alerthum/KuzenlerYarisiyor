import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCognitiveNarrative, buildCognitiveActionPlan, buildClassCognitiveSummary, cognitivePatternLabel } from '../js/engines/cognitive-report-v10.js';

test('bilişsel kalıp adları kullanıcıya Türkçe gösterilir', () => {
  assert.equal(cognitivePatternLabel('reverse-reasoning'), 'Tersine akıl yürütme');
});

test('veli ve öğretmen için kanıta dayalı bilişsel anlatım üretir', () => {
  const profile={sampleSize:32,overallAccuracy:74,evidenceLevel:'high',strongPatterns:['comparison'],weakPatterns:['inference']};
  const report=buildCognitiveNarrative(profile,'parent');
  assert.match(report.summary,/Karşılaştırma/);
  assert.match(report.summary,/Çıkarım/);
  assert.match(report.evidenceText,/yüksek/);
});

test('eylem planı zayıf alanı geliştirir ve güçlü alanı korur', () => {
  const actions=buildCognitiveActionPlan({weakPatterns:['inference'],strongPatterns:['ordering']});
  assert.equal(actions[0].priority,'develop');
  assert.equal(actions.at(-1).priority,'challenge');
});

test('sınıf bilişsel özeti ağırlıklı güç puanı üretir', () => {
  const summary=buildClassCognitiveSummary([
    {brainProfile:{sampleSize:20,patternStats:[{pattern:'inference',attempts:10,strength:40},{pattern:'comparison',attempts:10,strength:80}]}},
    {brainProfile:{sampleSize:12,patternStats:[{pattern:'inference',attempts:5,strength:60},{pattern:'comparison',attempts:5,strength:70}]}}
  ]);
  assert.equal(summary.studentCount,2);
  assert.equal(summary.weakestPatterns[0].pattern,'inference');
  assert.equal(summary.strongestPatterns[0].pattern,'comparison');
});
