const FAMILY_LABELS = {
  INFO_SECME: 'Bilgiyi seçme',
  BAGLAM_ANLAM: 'Bağlamdan anlam çıkarma',
  KANIT_BIRLESTIRME: 'Kanıtları birleştirme',
  METIN_YAPISI: 'Metin yapısını çözümleme',
  GUVENILIRLIK: 'Kaynak güvenilirliğini değerlendirme',
  CELISKI_KARSILASTIRMA: 'Çelişki ve karşılaştırma',
  NEDEN_SONUC: 'Neden-sonuç ilişkisi kurma',
  SENTEZ_DEGERLENDIRME: 'Sentez ve değerlendirme'
};

function toTime(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function familyFromAttempt(attempt = {}) {
  return attempt.skeletonFamilyId || String(attempt.skeletonId || '').split('_').slice(0, -1).join('_') || 'UNKNOWN';
}

function labelForFamily(familyId) {
  return FAMILY_LABELS[familyId] || 'Diğer düşünme alanı';
}

function labelForSkeleton(skeletonId) {
  const family = String(skeletonId || '').split('_').slice(0, -1).join('_');
  const suffix = String(skeletonId || '').split('_').at(-1);
  return `${labelForFamily(family)}${suffix ? ` • ${suffix}` : ''}`;
}

function diagnosedErrors(attempts = []) {
  return attempts
    .filter((item) => !item.correct && item.misconceptionId && item.diagnosticStatus === 'MISCONCEPTION_CAPTURED')
    .slice()
    .sort((a, b) => toTime(a.answeredAt || a.createdAt) - toTime(b.answeredAt || b.createdAt));
}

function splitPeriods(items, windowSize) {
  const recent = items.slice(-windowSize);
  const previous = items.slice(-(windowSize * 2), -windowSize);
  return { recent, previous };
}

function countBy(items, keySelector) {
  const map = new Map();
  for (const item of items) {
    const key = keySelector(item);
    if (!key) continue;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

function trendStatus(recentCount, previousCount) {
  if (previousCount === 0 && recentCount > 0) return 'NEW';
  if (recentCount === 0 && previousCount > 0) return 'IMPROVING';
  if (recentCount <= Math.max(0, previousCount - 1)) return 'IMPROVING';
  if (recentCount >= previousCount + 2) return 'INCREASING';
  return 'STABLE';
}

function trendLabel(status) {
  return ({
    NEW: 'Yeni sinyal',
    IMPROVING: 'Azalıyor',
    INCREASING: 'Artıyor',
    STABLE: 'Benzer düzeyde'
  })[status] || 'İzleniyor';
}

function supportLevel(total, recent, status) {
  if (status === 'INCREASING' || recent >= 3 || total >= 6) return 'HIGH';
  if (recent >= 2 || total >= 3) return 'MEDIUM';
  return 'WATCH';
}

function supportLabel(level) {
  return ({ HIGH: 'Öncelikli destek', MEDIUM: 'Kısa destek', WATCH: 'İzleme' })[level] || 'İzleme';
}

export function buildV11MisconceptionDevelopmentReport(attempts = [], options = {}) {
  const windowSize = Math.max(4, Number(options.windowSize || 12));
  const errors = diagnosedErrors(attempts);
  const { recent, previous } = splitPeriods(errors, windowSize);
  const allCounts = countBy(errors, (item) => item.misconceptionId);
  const recentCounts = countBy(recent, (item) => item.misconceptionId);
  const previousCounts = countBy(previous, (item) => item.misconceptionId);
  const latestById = new Map(errors.map((item) => [item.misconceptionId, item]));

  const rows = [...allCounts.entries()].map(([misconceptionId, totalCount]) => {
    const latest = latestById.get(misconceptionId) || {};
    const recentCount = recentCounts.get(misconceptionId) || 0;
    const previousCount = previousCounts.get(misconceptionId) || 0;
    const status = trendStatus(recentCount, previousCount);
    const level = supportLevel(totalCount, recentCount, status);
    const familyId = familyFromAttempt(latest);
    return {
      misconceptionId,
      misconception: latest.misconception || 'Tanımlı düşünme yanılgısı',
      skeletonId: latest.skeletonId || null,
      skeletonLabel: labelForSkeleton(latest.skeletonId),
      skeletonFamilyId: familyId,
      familyLabel: labelForFamily(familyId),
      totalCount,
      recentCount,
      previousCount,
      trendStatus: status,
      trendLabel: trendLabel(status),
      supportLevel: level,
      supportLabel: supportLabel(level),
      lastSeenAt: latest.answeredAt || latest.createdAt || null,
      questionFamilyId: latest.questionFamilyId || null
    };
  }).sort((a, b) => {
    const priority = { HIGH: 3, MEDIUM: 2, WATCH: 1 };
    return (priority[b.supportLevel] - priority[a.supportLevel]) || (b.recentCount - a.recentCount) || (b.totalCount - a.totalCount);
  });

  const familyMap = new Map();
  for (const row of rows) {
    const current = familyMap.get(row.skeletonFamilyId) || {
      skeletonFamilyId: row.skeletonFamilyId,
      familyLabel: row.familyLabel,
      totalErrors: 0,
      recentErrors: 0,
      misconceptionCount: 0,
      highPriorityCount: 0
    };
    current.totalErrors += row.totalCount;
    current.recentErrors += row.recentCount;
    current.misconceptionCount += 1;
    if (row.supportLevel === 'HIGH') current.highPriorityCount += 1;
    familyMap.set(row.skeletonFamilyId, current);
  }

  const improvingCount = rows.filter((row) => row.trendStatus === 'IMPROVING').length;
  const increasingCount = rows.filter((row) => row.trendStatus === 'INCREASING').length;
  const activeSupportCount = rows.filter((row) => ['HIGH', 'MEDIUM'].includes(row.supportLevel) && row.recentCount > 0).length;

  return {
    schemaVersion: '11.0',
    status: errors.length ? 'READY' : 'COLLECTING',
    diagnosedErrorCount: errors.length,
    distinctMisconceptionCount: rows.length,
    recentWindowSize: windowSize,
    recentDiagnosedErrorCount: recent.length,
    previousDiagnosedErrorCount: previous.length,
    improvingCount,
    increasingCount,
    activeSupportCount,
    rows,
    families: [...familyMap.values()].sort((a, b) => b.recentErrors - a.recentErrors || b.totalErrors - a.totalErrors),
    priorities: rows.filter((row) => row.recentCount > 0 && ['HIGH', 'MEDIUM'].includes(row.supportLevel)).slice(0, 3)
  };
}

export function buildV11MisconceptionNarrative(report = {}, audience = 'teacher') {
  const subject = audience === 'parent' ? 'Çocuğunuzun' : 'Öğrencinin';
  if (report.status !== 'READY') {
    return {
      headline: 'Düşünme hataları için veri toplanıyor',
      summary: 'Yanlış cevapların nedeni güvenilir biçimde yorumlanabilmesi için daha fazla tanısal soru gerekiyor.',
      evidenceText: 'Henüz tanılanmış tekrar yok'
    };
  }
  if (!report.activeSupportCount) {
    return {
      headline: `${subject} belirgin tekrar eden yanılgısı görünmüyor`,
      summary: 'Tanılanan hatalar tekil veya azalan düzeyde. Sistem yine de yeni cevaplarla gelişimi izlemeyi sürdürüyor.',
      evidenceText: `${report.diagnosedErrorCount} tanılanmış hata • ${report.improvingCount} azalan alan`
    };
  }
  const top = report.priorities?.[0];
  return {
    headline: `${subject} düşünme biçimindeki tekrarlar`,
    summary: top
      ? `${top.familyLabel} alanında “${top.misconception}” yanılgısı şu anda en güçlü destek sinyali.`
      : 'Tekrar eden düşünme hataları için hedefli destek planı hazırlandı.',
    evidenceText: `${report.diagnosedErrorCount} tanılanmış hata • ${report.activeSupportCount} aktif destek alanı`
  };
}

export function buildV11ClassMisconceptionSummary(attemptGroups = []) {
  const reports = attemptGroups.map((attempts) => buildV11MisconceptionDevelopmentReport(attempts));
  const familyMap = new Map();
  for (const report of reports) {
    for (const family of report.families) {
      const current = familyMap.get(family.skeletonFamilyId) || {
        skeletonFamilyId: family.skeletonFamilyId,
        familyLabel: family.familyLabel,
        studentCount: 0,
        totalErrors: 0,
        recentErrors: 0
      };
      current.studentCount += 1;
      current.totalErrors += family.totalErrors;
      current.recentErrors += family.recentErrors;
      familyMap.set(family.skeletonFamilyId, current);
    }
  }
  return {
    studentCount: reports.length,
    studentsWithDiagnosedErrors: reports.filter((report) => report.diagnosedErrorCount > 0).length,
    families: [...familyMap.values()].sort((a, b) => b.recentErrors - a.recentErrors || b.totalErrors - a.totalErrors)
  };
}
