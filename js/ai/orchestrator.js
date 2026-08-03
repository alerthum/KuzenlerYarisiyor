import { curriculumMatrix, automaticExamPlans } from '../curriculum/meb-curriculum.js';
import { buildLearningMemory } from './memory.js';
import { resolveProvider, providerCapabilities } from './providers.js';

export const AI_AGENT_CATALOG = [
  { id: 'learner-model', name: 'Öğrenci Tanıma AI', purpose: 'Seviye, hız, hata, ipucu ve alışkanlık örüntülerini çıkarır.' },
  { id: 'class-intelligence', name: 'Sınıf Analisti AI', purpose: 'Sınıfın ortak eksiklerini ve öğretmen için öncelikleri belirler.' },
  { id: 'learning-coach', name: 'Öğrenme Koçu AI', purpose: 'Günlük rota, motivasyon ve sürdürülebilir hedef önerir.' },
  { id: 'ai-teacher', name: 'AI Öğretmen', purpose: 'Yanlış cevabı öğrencinin düzeyine uygun ikinci bir yöntemle açıklar.' },
  { id: 'parent-analyst', name: 'Veli Analisti AI', purpose: 'Haftalık gelişimi velinin anlayacağı kısa ve somut bir özete dönüştürür.' },
  { id: 'content-editor', name: 'İçerik Editörü AI', purpose: 'Soru çeşitliliğini, zorluk düzeyini ve tekrar riskini denetler.' },
  { id: 'assessment-auditor', name: 'Ölçme Değerlendirme AI', purpose: 'Kazanım kapsamasını ve sınav uyumunu değerlendirir.' },
  { id: 'question-reviewer', name: 'Soru Denetçisi AI', purpose: 'Hatalı soru, hatalı cevap ve öğrenci zorlanmasını kanıtlarla ayırır.' },
  { id: 'motivation-engine', name: 'Motivasyon AI', purpose: 'Kolaylaştırmadan, doğru meydan okuma ve çeşitlilikle geri dönüşü artırır.' },
  { id: 'safety-guardian', name: 'Güvenlik ve Denge AI', purpose: 'Aşırı kullanım, anlamsız puan kasma ve yaşa uygunsuz içerik riskini sınırlar.' }
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


export function runAiOrchestra(profile, attempts = [], options = {}) {
  const provider = resolveProvider(options);
  const model = buildLearnerModel(profile, attempts);
  const memory = buildLearningMemory(profile, attempts);
  const proactive = createProactivePlan(profile, attempts);
  const recent = recentAttempts(attempts, 60);
  const fatigueRisk = recent.filter((a) => Number(a.elapsedSeconds || 0) > 150).length >= 4;
  const randomGuessRisk = recent.length >= 8 && recent.filter((a) => Number(a.elapsedSeconds || 0) <= 3).length / recent.length > 0.35;
  return {
    provider: providerCapabilities(provider),
    model,
    memory,
    proactive,
    agents: AI_AGENT_CATALOG.map((agent) => ({ ...agent, status: 'ready' })),
    signals: {
      fatigueRisk,
      randomGuessRisk,
      needsTeacherReview: model.weakest?.attempts >= 5 && model.weakest?.accuracy < 45,
      needsParentSummary: recent.length >= 10
    },
    generatedAt: new Date().toISOString()
  };
}

export function createParentWeeklySummary(profile, attempts = []) {
  const model = buildLearnerModel(profile, attempts);
  const recent = recentAttempts(attempts, 80);
  const solved = recent.length;
  const strongest = model.strongest?.subject || 'henüz belirleniyor';
  const focus = model.weakest?.subject || 'genel muhakeme';
  return {
    title: `${profile.name} için haftalık gelişim özeti`,
    summary: `${solved} soru çözüldü. En güçlü sinyal ${strongest}; önümüzdeki rota ${focus} alanını zor ama yönlendirilmiş görevlerle güçlendirecek.`,
    accuracy: model.accuracy,
    averageSeconds: model.avgTime,
    hints: model.hints
  };
}

export function createClassInsight(learners = []) {
  const attempts = learners.flatMap((item) => item.attempts || []);
  const total = attempts.length;
  const correct = attempts.filter((item) => item.correct).length;
  const bySkill = new Map();
  for (const attempt of attempts) {
    const key = attempt.skill || 'general';
    const row = bySkill.get(key) || { count: 0, correct: 0 };
    row.count += 1; row.correct += attempt.correct ? 1 : 0; bySkill.set(key, row);
  }
  const priority = [...bySkill.entries()].map(([skill,row]) => ({ skill, accuracy: row.count ? Math.round(row.correct*100/row.count) : 0, count: row.count })).sort((a,b)=>a.accuracy-b.accuracy)[0] || null;
  return { learnerCount: learners.length, totalQuestions: total, accuracy: total ? Math.round(correct*100/total) : 0, priority, recommendation: priority ? `${priority.skill} alanında kısa bir ortak çalışma ve ardından kişisel görev önerilir.` : 'İlk sınıf verileri oluştuğunda öneri hazırlanacak.' };
}
