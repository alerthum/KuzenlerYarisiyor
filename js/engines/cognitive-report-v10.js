const PATTERN_LABELS = {
  inference: 'Çıkarım', comparison: 'Karşılaştırma', ordering: 'Sıralama',
  'reverse-reasoning': 'Tersine akıl yürütme', deduction: 'Tümdengelim',
  classification: 'Sınıflandırma', transfer: 'Bilgiyi yeni duruma aktarma',
  'error-analysis': 'Hata analizi', 'cause-effect': 'Neden-sonuç',
  'data-interpretation': 'Veri yorumlama',
  'argument-weakness-dynamic': 'Savdaki zayıflığı belirleme',
  'contradiction-detection-dynamic': 'Çelişkiyi belirleme',
  'set-logic-no-overlap': 'Kesişmeyen kümelerle akıl yürütme',
  'conditional-contrapositive': 'Koşullu önermede ters karşıt',
  'binary-switches': 'İkili durum değişimlerini izleme',
  'task-dependency-block': 'Görev bağımlılıklarını çözme',
  'text-inference': 'Metinden kanıtlı çıkarım', 'author-purpose': 'Yazarın amacını belirleme',
  'evidence-selection': 'Kanıt seçme', 'variable-control': 'Değişkenleri kontrol etme',
  'source-comparison': 'Kaynakları karşılaştırma', 'concept-transfer': 'Kavramı yeni duruma uygulama',
  'context-inference': 'Bağlamdan anlam çıkarma', 'constraint-propagation': 'Koşulları birlikte yürütme',
  'multi-step-verification': 'Çok adımlı doğrulama', 'claim-evaluation': 'İddiayı kanıtla değerlendirme',
  'transitive-reasoning': 'Geçişli akıl yürütme', 'proof-strategy': 'İspat stratejisi seçme',
  counterexample: 'Karşı örnek kullanma', 'dialogue-inference': 'Diyalogdan anlam çıkarma',
  'language-function': 'İletişim işlevini belirleme', 'invariant-reasoning': 'Değişmeyen özelliği bulma',
  proof: 'Kanıtlama', unknown: 'Diğer düşünme becerisi'
};

export function cognitivePatternLabel(pattern) {
  const rawKey = String(pattern || 'unknown').trim();
  const key = rawKey.toLocaleLowerCase('tr-TR').replace(/[\s_]+/g, '-');
  return PATTERN_LABELS[key] || 'Diğer düşünme becerisi';
}

export function buildCognitiveNarrative(profile = {}, audience = 'teacher') {
  const sampleSize = Number(profile.sampleSize || 0);
  if (sampleSize < 5) {
    return {
      status: 'collecting',
      headline: 'Profil oluşuyor',
      summary: 'Kesin yorum için daha fazla çözüm verisi gerekiyor.',
      evidenceText: `${sampleSize} cevap üzerinden ilk sinyaller toplanıyor.`
    };
  }
  const strong = (profile.strongPatterns || []).map(cognitivePatternLabel);
  const weak = (profile.weakPatterns || []).map(cognitivePatternLabel);
  const audiencePrefix = audience === 'parent' ? 'Çocuğunuz' : 'Öğrenci';
  const strengthText = strong.length ? `${strong.slice(0, 2).join(' ve ')} alanlarında güçlü görünüyor.` : 'Belirgin güçlü düşünme alanı için veri birikiyor.';
  const growthText = weak.length ? `${weak.slice(0, 2).join(' ve ')} alanlarında gelişim fırsatı bulunuyor.` : 'Belirgin bir gelişim riski görünmüyor.';
  return {
    status: 'ready',
    headline: `${audiencePrefix} nasıl düşünüyor?`,
    summary: `${strengthText} ${growthText}`,
    evidenceText: `${sampleSize} cevap • %${Number(profile.overallAccuracy || 0)} doğruluk • ${profile.evidenceLevel === 'high' ? 'yüksek' : profile.evidenceLevel === 'medium' ? 'orta' : 'düşük'} kanıt düzeyi`
  };
}

export function buildCognitiveActionPlan(profile = {}) {
  const weak = (profile.weakPatterns || []).slice(0, 3);
  const strong = new Set(profile.strongPatterns || []);
  const actions = weak.map((pattern) => ({
    pattern,
    label: cognitivePatternLabel(pattern),
    action: `${cognitivePatternLabel(pattern)} becerisini farklı oyunlara dağıtılmış kısa alıştırmalarla güçlendir.`,
    priority: 'develop'
  }));
  if (strong.size) {
    const pattern = [...strong][0];
    actions.push({
      pattern,
      label: cognitivePatternLabel(pattern),
      action: `${cognitivePatternLabel(pattern)} gücünü daha zor ve aktarım gerektiren sorularla koru.`,
      priority: 'challenge'
    });
  }
  return actions.slice(0, 4);
}

export function buildClassCognitiveSummary(metrics = []) {
  const profiles = metrics.map((item) => item?.brainProfile).filter((item) => item && Number(item.sampleSize || 0) >= 5);
  const patternMap = new Map();
  for (const profile of profiles) {
    for (const row of profile.patternStats || []) {
      const current = patternMap.get(row.pattern) || { pattern: row.pattern, attempts: 0, weightedStrength: 0 };
      current.attempts += Number(row.attempts || 0);
      current.weightedStrength += Number(row.strength || 0) * Number(row.attempts || 0);
      patternMap.set(row.pattern, current);
    }
  }
  const patterns = [...patternMap.values()].map((row) => ({
    pattern: row.pattern,
    label: cognitivePatternLabel(row.pattern),
    attempts: row.attempts,
    strength: row.attempts ? Math.round(row.weightedStrength / row.attempts) : 0
  })).sort((a, b) => a.strength - b.strength);
  return {
    studentCount: profiles.length,
    weakestPatterns: patterns.slice(0, 3),
    strongestPatterns: [...patterns].sort((a, b) => b.strength - a.strength).slice(0, 3),
    patterns
  };
}
