import { curriculumMatrix, automaticExamPlans } from '../curriculum/meb-curriculum.js';

export const AI_AGENT_CATALOG = [
  { id: 'learner-model', name: 'Öğrenci Tanıma AI', purpose: 'Seviye, hız, hata, ipucu ve alışkanlık örüntülerini çıkarır.' },
  { id: 'class-intelligence', name: 'Sınıf Analisti AI', purpose: 'Sınıfın ortak eksiklerini ve öğretmen için öncelikleri belirler.' },
  { id: 'learning-coach', name: 'Öğrenme Koçu AI', purpose: 'Günlük rota, motivasyon ve sürdürülebilir hedef önerir.' },
  { id: 'content-editor', name: 'İçerik Editörü AI', purpose: 'Soru çeşitliliğini, zorluk düzeyini ve tekrar riskini denetler.' },
  { id: 'assessment-auditor', name: 'Ölçme Değerlendirme AI', purpose: 'Kazanım kapsamasını ve sınav uyumunu değerlendirir.' },
  { id: 'question-reviewer', name: 'Soru Denetçisi AI', purpose: 'Hatalı soru, hatalı cevap ve öğrenci zorlanmasını kanıtlarla ayırır.' }
];

function average(items) {
  return items.length ? items.reduce((sum, value) => sum + Number(value || 0), 0) / items.length : 0;
}

function recentAttempts(attempts, count = 40) {
  return [...attempts].slice(-count);
}

export function buildLearnerModel(profile, attempts = []) {
  const recent = recentAttempts(attempts);
  const correct = recent.filter((attempt) => attempt.correct).length;
  const accuracy = recent.length ? Math.round(correct * 100 / recent.length) : 0;
  const avgTime = Math.round(average(recent.map((attempt) => attempt.elapsedSeconds)));
  const hints = recent.reduce((sum, attempt) => sum + Number(attempt.hintsUsed || 0), 0);
  const matrix = curriculumMatrix(profile, attempts);
  const weakest = [...matrix].sort((a, b) => a.accuracy - b.accuracy || a.attempts - b.attempts)[0];
  const strongest = [...matrix].sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts)[0];
  return {
    profileId: profile.id,
    grade: Number(profile.grade || 1),
    examPlans: profile.examPlans?.length ? profile.examPlans : automaticExamPlans(profile.grade),
    accuracy,
    avgTime,
    hints,
    weakest,
    strongest,
    confidence: recent.length >= 20 ? 'yüksek' : recent.length >= 8 ? 'orta' : 'başlangıç'
  };
}

export function createProactivePlan(profile, attempts = []) {
  const model = buildLearnerModel(profile, attempts);
  const lowAccuracy = model.accuracy < 65;
  const highHints = model.hints > Math.max(4, recentAttempts(attempts).length * 0.25);
  const plan = [];
  if (model.weakest) {
    plan.push({
      type: 'focus',
      title: `${model.weakest.subject} güçlendirme`,
      reason: model.weakest.attempts < 5 ? `${model.weakest.subject} için seviyeni ölçecek seçilmiş meydan okuma hazır.` : `Son doğruluk %${model.weakest.accuracy}; şimdi bir üst düzey görev geliyor.`,
      minutes: lowAccuracy ? 8 : 6
    });
  }
  plan.push({
    type: 'challenge',
    title: model.examPlans.includes('LGS') ? 'LGS yeni nesil mini görev' : model.examPlans.includes('YKS') ? 'TYT–AYT muhakeme görevi' : 'Günün akıl yürütme görevi',
    reason: 'Tek adımlı ezber yerine çok adımlı düşünme çalışması.',
    minutes: 7
  });
  if (highHints) {
    plan.push({ type: 'habit', title: 'İpucusuz iki soru', reason: 'İpucu kullanımı yükseldi; önce kendi stratejini dene.', minutes: 4 });
  }
  return {
    model,
    greeting: `${profile.name}, bugünün meydan okuma rotası hazır.`,
    summary: recentAttempts(attempts).length < 8
      ? 'İlk görevler seviyeni tanırken doğrudan orta-üstü ve zor sorularla başlar.'
      : lowAccuracy
        ? 'Zayıf alanı kolay sorularla değil, yönlendirilmiş orta-üstü görevlerle güçlendiriyoruz.'
        : 'Güçlü olduğun alanı korurken bir üst zorluğa çıkıyoruz.',
    plan: plan.slice(0, 3)
  };
}

export function reviewQuestionReport(report, siblingReports = []) {
  const sameKey = siblingReports.filter((item) => item.questionKey && item.questionKey === report.questionKey);
  const repeated = sameKey.length >= 2 || report.reason === 'duplicate';
  const answerConflict = report.correctAnswer !== undefined && report.studentAnswer !== undefined && String(report.correctAnswer) === String(report.studentAnswer) && report.wasCorrect === false;
  const weakEvidence = !report.note && !report.studentAnswer && sameKey.length < 2;
  const verdict = repeated
    ? 'yüksek tekrar riski'
    : answerConflict
      ? 'cevap anahtarı veya kontrol mantığı hatası'
      : weakEvidence
        ? 'kanıt yetersiz; öğrenci zorlanması olabilir'
        : 'editör incelemesi gerekli';
  return {
    verdict,
    confidence: repeated || answerConflict ? 'yüksek' : weakEvidence ? 'düşük' : 'orta',
    signals: [
      `${sameKey.length} benzer bildirim`,
      report.studentAnswer ? 'öğrenci cevabı kayıtlı' : 'öğrenci cevabı yok',
      report.correctAnswer !== undefined ? 'doğru cevap kayıtlı' : 'doğru cevap eksik'
    ],
    recommendation: repeated ? 'Soruyu karantinaya al ve eşdeğer varyantla değiştir.' : answerConflict ? 'Cevap denetimini test et ve soruyu geçici kapat.' : 'İkinci öğrenci sinyali veya editör doğrulaması bekle.'
  };
}
