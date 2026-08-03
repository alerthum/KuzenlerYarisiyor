import { topicLabel } from '../curriculum/topic-labels-v9.js';
import { buildTopicMastery, silentRemediationPlan } from './mastery-engine-v9.js';

const STRATEGIES = Object.freeze({
  functions: ['Önce verilen değeri belirle, sonra ilişkiyi adım adım uygula.', 'Grafik varsa x değerinden dikey ilerleyip karşılık gelen y değerini oku.', 'Eksenleri ve değişkenlerin görevini karıştırma.'],
  ratio: ['İki niceliği aynı birime getir ve oranı sadeleştir.', 'Orantıda çapraz çarpım son adım olsun; önce ilişkinin doğru kurulduğunu kontrol et.', 'Birimleri eşitlemeden işlem yapma.'],
  percent: ['Yüzdeyi 100 parçadan kaç parça olduğunu düşünerek modele çevir.', 'Artış ve azalışta başlangıç değerini mutlaka belirle.', 'Yüzde ile yüzde puanı aynı şey değildir.'],
  equations: ['Bilinmeyeni yalnız bırakmak için iki tarafa aynı işlemi uygula.', 'İşaret değişimini ezberleme; yapılan ters işlemi düşün.', 'Bulduğun değeri başlangıç denkleminde kontrol et.'],
  inference: ['Cevabı metinde birebir arama; verilen kanıtlardan zorunlu sonucu çıkar.', 'Kesin bilgi ile olası yorumu ayır.', 'Seçeneğin metnin tamamıyla uyumlu olup olmadığını kontrol et.'],
  grammar: ['Önce cümlenin öznesini ve yüklemini bul.', 'Kuralı tek kelimeye değil cümlenin bütününe uygula.', 'Anlamı bozan seçeneği tekrar okuyarak doğrula.'],
  logic: ['Koşulları tek tek yaz ve kesin olanları önce yerleştir.', 'Bir koşulu kullanırken diğer koşulları ihlal etmediğini kontrol et.', 'Olasılıkları eleme tablosuyla daralt.'],
  probability: ['Tüm olası durumları ve istenen durumları ayrı say.', 'Aynı sonucu iki kez saymadığından emin ol.', 'Olayların bağımlı mı bağımsız mı olduğunu kontrol et.'],
  general: ['Soruda verilenleri, isteneni ve kısıtları üç ayrı satıra yaz.', 'İlk bulduğun cevabı seçmeden önce tüm koşulları doğrula.', 'Yanlış seçeneğin neden yanlış olduğunu da açıklamaya çalış.']
});

export function microLessonForTopic(topicId, mastery = {}) {
  const strategy = STRATEGIES[topicId] || STRATEGIES.general;
  const label = topicLabel(topicId);
  return {
    topicId,
    title: `${label} için kısa güçlendirme`,
    summary: `${label} sorularında önce ilişkiyi kur, sonra işlemi uygula.`,
    strategy: strategy[0],
    example: strategy[1],
    caution: strategy[2],
    practiceCount: mastery.masteryScore < 45 ? 2 : 1,
    durationMinutes: mastery.masteryScore < 45 ? 4 : 3
  };
}

export function buildAdaptiveLearningPlan(attempts = []) {
  const mastery = buildTopicMastery(attempts);
  const byTopic = new Map(mastery.map(row => [row.topicId,row]));
  const remediation = silentRemediationPlan(attempts, {maxTopics:3,maxShare:0.25});
  return remediation.map(item => ({
    ...item,
    label: topicLabel(item.topicId),
    mastery: byTopic.get(item.topicId),
    microLesson: microLessonForTopic(item.topicId, byTopic.get(item.topicId) || {})
  }));
}
