const FAMILY_GUIDES = Object.freeze({
  INFO_SECME: {
    strategy: 'Sorunun istediği bilgiyi tek cümleyle belirle; sonra yalnız bu hedefi karşılayan metin kanıtını seç.',
    example: 'Metinde geçen her doğru bilgi cevap değildir. Seçeneği, sorulan kişi veya durumla doğrudan eşleştir.',
    caution: 'Metinde birebir geçen sözcükleri görmek, seçeneğin soruya cevap verdiğini kanıtlamaz.'
  },
  BAGLAM_ANLAM: {
    strategy: 'Sözcüğü tek başına değil, öncesindeki ve sonrasındaki cümlelerle birlikte anlamlandır.',
    example: 'Aynı sözcük farklı metinlerde farklı anlam taşıyabilir; cümlenin kurduğu ilişkiyi kontrol et.',
    caution: 'Sözlükteki ilk anlamı otomatik olarak seçme.'
  },
  KANIT_BIRLESTIRME: {
    strategy: 'Kanıtları ayrı ayrı işaretle, ardından yalnız birlikte destekledikleri ortak sonucu kur.',
    example: 'Bir ayrıntı yönü, diğer ayrıntı nedeni gösteriyorsa cevap ikisini de kapsamalıdır.',
    caution: 'Tek bir güçlü ayrıntıyı bütün metnin sonucu sanma.'
  },
  METIN_YAPISI: {
    strategy: 'Cümlelerin görevini belirle: iddia, gerekçe, örnek, karşılaştırma veya sonuç.',
    example: 'Bir cümle önceki düşünceyi açıklıyorsa onu yeni ana fikir gibi değerlendirme.',
    caution: 'Konu benzerliğini mantıksal bağlantı sanma.'
  },
  GUVENILIRLIK: {
    strategy: 'Kaynağın iddiasını, sunduğu kanıtı ve kanıtın iddiayı gerçekten destekleyip desteklemediğini ayrı değerlendir.',
    example: 'Uzman adı bulunması tek başına yeterli değildir; uzmanlığın konu ile ilişkisini ve kanıtın niteliğini kontrol et.',
    caution: 'Kesin ve etkileyici dil, güvenilirlik kanıtı değildir.'
  },
  CELISKI_KARSILASTIRMA: {
    strategy: 'İki kaynağın aynı konu hakkında ne söylediğini yan yana yaz; benzerlik ile çelişkiyi ayrı işaretle.',
    example: 'Kaynaklar farklı ayrıntıları vurgulayabilir; ancak aynı soruya zıt cevap veriyorlarsa çelişirler.',
    caution: 'Farklı sözcük kullanımını otomatik olarak görüş ayrılığı sayma.'
  },
  NEDEN_SONUC: {
    strategy: 'Nedeni ve sonucu iki ayrı kutuya yaz; okun yönünü metindeki ilişkiye göre kur.',
    example: '“X yüzünden Y oldu” ifadesinde X neden, Y sonuçtur; seçenekte yönün ters çevrilmediğini doğrula.',
    caution: 'Birlikte gerçekleşen iki olayı doğrudan neden-sonuç sayma.'
  },
  SENTEZ_DEGERLENDIRME: {
    strategy: 'Tüm kanıtları kapsayan, metin dışına taşmayan ve istisnaları yok saymayan sonucu seç.',
    example: 'En geniş seçenek her zaman sentez değildir; yalnız kanıtların ortak sınırı kadar genelleme yap.',
    caution: 'Kişisel görüşünü metnin vardığı sonuçla karıştırma.'
  }
});

function familyFrom(value = {}) {
  return value.skeletonFamilyId || String(value.skeletonId || '').split('_').slice(0, -1).join('_') || null;
}

function normalizeAttempts(attempts = []) {
  return attempts
    .filter((attempt) => attempt && !attempt.correct && attempt.misconceptionId && attempt.skeletonId)
    .slice(-120);
}

export function buildV11MisconceptionInterventions(attempts = [], {
  minOccurrences = 2,
  maxTargets = 3
} = {}) {
  const grouped = new Map();
  for (const attempt of normalizeAttempts(attempts)) {
    const current = grouped.get(attempt.misconceptionId) || {
      misconceptionId: attempt.misconceptionId,
      misconception: attempt.misconception || '',
      skeletonId: attempt.skeletonId,
      skeletonFamilyId: familyFrom(attempt),
      count: 0,
      questionKeys: new Set(),
      lastSeenAt: null
    };
    current.count += 1;
    if (attempt.questionKey) current.questionKeys.add(attempt.questionKey);
    current.lastSeenAt = attempt.answeredAt || attempt.createdAt || current.lastSeenAt;
    grouped.set(attempt.misconceptionId, current);
  }

  return [...grouped.values()]
    .filter((item) => item.count >= minOccurrences && (item.questionKeys.size >= 2 || item.count >= 3))
    .sort((a, b) => b.count - a.count || String(b.lastSeenAt || '').localeCompare(String(a.lastSeenAt || '')))
    .slice(0, Math.max(0, maxTargets))
    .map((item) => ({
      ...item,
      questionKeys: [...item.questionKeys],
      evidenceLevel: item.count >= 4 ? 'HIGH' : 'MEDIUM'
    }));
}

export function microLessonForV11Misconception(intervention = {}) {
  const guide = FAMILY_GUIDES[intervention.skeletonFamilyId] || FAMILY_GUIDES.SENTEZ_DEGERLENDIRME;
  const misconception = intervention.misconception || 'aynı düşünme hatası';
  return {
    schemaVersion: '11.0',
    type: 'V11_MISCONCEPTION_MICRO_TEACHING',
    misconceptionId: intervention.misconceptionId || null,
    skeletonId: intervention.skeletonId || null,
    skeletonFamilyId: intervention.skeletonFamilyId || null,
    title: 'Bu düşünme yolunu güçlendirelim',
    summary: `Tekrar eden nokta: ${misconception}`,
    strategy: guide.strategy,
    example: guide.example,
    caution: guide.caution,
    practiceCount: intervention.evidenceLevel === 'HIGH' ? 2 : 1,
    durationMinutes: intervention.evidenceLevel === 'HIGH' ? 4 : 2
  };
}

export function attachV11SilentRemediation(rounds = [], attempts = [], {
  maxShare = 0.25,
  minOccurrences = 2,
  maxTargets = 3
} = {}) {
  const interventions = buildV11MisconceptionInterventions(attempts, { minOccurrences, maxTargets });
  const targetBySkeleton = new Map(interventions.map((item) => [item.skeletonId, item]));
  const limit = rounds.length ? Math.max(1, Math.floor(rounds.length * Math.min(0.25, Math.max(0, Number(maxShare) || 0)))) : 0;
  let attached = 0;
  const usedMisconceptions = new Set();

  const enriched = rounds.map((round) => {
    if (attached >= limit || round.adaptivePlacement) return round;
    const skeletonId = round.skeletonId || round.v11Identity?.skeletonId || null;
    const intervention = targetBySkeleton.get(skeletonId);
    if (!intervention || usedMisconceptions.has(intervention.misconceptionId)) return round;
    usedMisconceptions.add(intervention.misconceptionId);
    attached += 1;
    return {
      ...round,
      adaptivePlacement: true,
      adaptiveReason: 'V11_REPEATED_MISCONCEPTION',
      microLesson: round.microLesson || microLessonForV11Misconception(intervention),
      v11Remediation: {
        schemaVersion: '11.0',
        misconceptionId: intervention.misconceptionId,
        misconception: intervention.misconception,
        skeletonId: intervention.skeletonId,
        occurrenceCount: intervention.count,
        evidenceLevel: intervention.evidenceLevel
      }
    };
  });

  return {
    rounds: enriched,
    interventions,
    audit: {
      enabled: interventions.length > 0,
      interventionCount: interventions.length,
      attachedRoundCount: attached,
      maxShare: Math.min(0.25, Math.max(0, Number(maxShare) || 0)),
      maxRoundCount: limit,
      targetMisconceptionIds: interventions.map((item) => item.misconceptionId),
      targetSkeletonIds: interventions.map((item) => item.skeletonId)
    }
  };
}
