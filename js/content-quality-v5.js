export const V5_QUALITY_REGISTRY = Object.freeze({
  version: '5.0.0',
  quarantinedFamilies: Object.freeze({
    'path-through-checkpoint': 'Görsel, yön ve kontrol noktası üretimi yeniden doğrulanana kadar kapalı.',
    'book-owner-matching': 'Koşul kümesi bazı yüzey varyasyonlarında çözümsüz kalabildiği için kapalı.',
    'subset-target': 'Tek adımlı şık toplama biçimi olimpiyat havuzundan çıkarıldı.',
    'digit-reversal-difference': 'Mekanik iki basamaklı fark sorusu olimpiyat havuzundan çıkarıldı.'
  }),
  speedOnlyFamilies: Object.freeze([
    'consecutive-sum',
    'calendar-cycle'
  ]),
  forbiddenHintFragments: Object.freeze([
    'en kötü olasılığı düşün',
    'kesin bilgiyi tabloya yerleştir',
    'önce büyük çarpma',
    'büyük çarpma veya fark'
  ]),
  minChallengeDepth: 4,
  minExplanationLength: 55,
  minHintCount: 2,
  qualityRecordCount: 11
});

export function isQuarantinedFamily(familyId) {
  return Boolean(V5_QUALITY_REGISTRY.quarantinedFamilies[familyId]);
}

export function isChallengeFamilyAllowed(factory, gameId) {
  if (isQuarantinedFamily(factory.id)) return false;
  if (gameId === 'olympiad-ladder' && V5_QUALITY_REGISTRY.speedOnlyFamilies.includes(factory.id)) return false;
  return Number(factory.depth || 0) >= V5_QUALITY_REGISTRY.minChallengeDepth;
}

export function hintQualityErrors(question) {
  const errors = [];
  const hints = Array.isArray(question.hints) ? question.hints : [];
  if (hints.length < V5_QUALITY_REGISTRY.minHintCount) errors.push('en az iki kademeli ipucu gerekli');
  for (const hint of hints) {
    const normalized = String(hint).toLocaleLowerCase('tr-TR');
    for (const fragment of V5_QUALITY_REGISTRY.forbiddenHintFragments) {
      if (normalized.includes(fragment)) errors.push(`belirsiz ipucu: ${fragment}`);
    }
  }
  return errors;
}
