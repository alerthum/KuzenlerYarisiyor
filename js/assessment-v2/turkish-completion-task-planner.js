const THEMES = Object.freeze([
  { id: 'kutuphane', label: 'mahalle kütüphanesinin dönüşümü', evidence: 'ziyaretçi notları, görevli görüşü ve kullanım çizelgesi' },
  { id: 'su', label: 'okulda su tasarrufu çalışması', evidence: 'sayaç verisi, öğrenci gözlemi ve bakım görevlisi açıklaması' },
  { id: 'zanaat', label: 'unutulmaya yüz tutan yerel bir zanaat', evidence: 'usta anlatısı, eski fotoğraf ve kısa bilgi metni' },
  { id: 'bahce', label: 'mahallede kurulan ortak bahçe', evidence: 'gönüllü günlüğü, ürün listesi ve komşu görüşleri' },
  { id: 'muzik', label: 'gençlerin hazırladığı sokak müziği etkinliği', evidence: 'afiş, prova kaydı ve izleyici değerlendirmesi' },
  { id: 'dijital', label: 'dijital ortamda yanlış bilginin yayılması', evidence: 'iki paylaşım, kaynak bilgisi ve doğrulama notu' },
  { id: 'müze', label: 'kent müzesindeki yeni sergi', evidence: 'eser etiketi, ziyaretçi rotası ve küratör açıklaması' },
  { id: 'spor', label: 'okul spor kulübünde takım çalışması', evidence: 'antrenman planı, oyuncu görüşü ve maç gözlemi' },
  { id: 'doğa', label: 'yakındaki sulak alanda canlı gözlemi', evidence: 'alan notları, tür çizelgesi ve uzman kaydı' },
  { id: 'ulaşım', label: 'öğrenciler için güvenli ulaşım önerisi', evidence: 'güzergâh haritası, süre tablosu ve kullanıcı görüşü' },
  { id: 'tiyatro', label: 'bir öykünün okul tiyatrosuna uyarlanması', evidence: 'öykü bölümü, sahne planı ve yönetmen notu' },
  { id: 'dayanışma', label: 'mahalle dayanışma kampanyası', evidence: 'ihtiyaç listesi, gönüllü çağrısı ve sonuç raporu' }
]);

function hash(text) {
  return [...String(text)].reduce((sum, char) => (sum * 33 + char.charCodeAt(0)) >>> 0, 5381);
}

function themeFor(code) {
  return THEMES[hash(code) % THEMES.length];
}

function contains(text, words) {
  return words.some(word => text.includes(word));
}

function genericCriteria(action, area) {
  const base = [
    'Görevin amacına ve verilen bağlama uygun bir ürün ortaya koyar.',
    'Düşüncesini en az iki açık kanıt, ayrıntı veya örnekle destekler.',
    'Bilgileri mantıklı bir sırada ve anlaşılır bir dille düzenler.',
    'Ürününü ölçütlere göre gözden geçirir; eksik veya aşırı genellemeleri düzeltir.'
  ];
  if (area === 'SPEAKING') base[2] = 'Ses, vurgu, geçiş ifadeleri ve beden dilini iletişim amacına uygun kullanır.';
  if (area === 'WRITING') base[2] = 'Paragraf düzeni, bağdaşıklık, yazım ve noktalama bakımından tutarlı bir metin oluşturur.';
  if (action === 'SELF_REFLECTION') return [
    'Kullandığı yöntemi ve yöntemi seçme nedenini açıklar.',
    'Başarılı olduğu bir yönü somut örnekle gösterir.',
    'Geliştirmesi gereken bir yönü kanıta dayanarak belirler.',
    'Bir sonraki çalışma için uygulanabilir bir uyarlama kararı verir.'
  ];
  return base;
}

function actionProfile(outcome) {
  const text = outcome.officialOutcomeText.toLocaleLowerCase('tr-TR');
  if (contains(text, ['öz yansıtma', 'kendini uyarlayabilme'])) return { key: 'SELF_REFLECTION', label: 'öz değerlendirme ve uyarlama' };
  if (contains(text, ['materyal seçimini'])) return { key: 'SOURCE_SELECTION', label: 'materyal seçme ve gerekçelendirme' };
  if (contains(text, ['strateji', 'yöntem seçimlerini', 'sürecini yönetebilme'])) return { key: 'PROCESS_MANAGEMENT', label: 'süreç ve strateji yönetimi' };
  if (contains(text, ['tahmin'])) return { key: 'PREDICTION', label: 'ipuçlarından tahmin üretme' };
  if (contains(text, ['anlamını tahmin'])) return { key: 'VOCABULARY_INFERENCE', label: 'bağlamdan söz varlığı anlamı çıkarma' };
  if (contains(text, ['yüzey anlam'])) return { key: 'SURFACE_MEANING', label: 'açık bilgiyi belirleme' };
  if (contains(text, ['derin anlam', 'çıkarım'])) return { key: 'DEEP_INFERENCE', label: 'kanıta dayalı çıkarım yapma' };
  if (contains(text, ['karşılaştır'])) return { key: 'COMPARE', label: 'ölçütlü karşılaştırma yapma' };
  if (contains(text, ['sınıflandır'])) return { key: 'CLASSIFY', label: 'ölçüt belirleyerek sınıflandırma' };
  if (contains(text, ['hikâye unsurları'])) return { key: 'STORY_ANALYSIS', label: 'hikâye unsurlarını çözümleme' };
  if (contains(text, ['metin yapıları', 'bölümlerini'])) return { key: 'STRUCTURE_ANALYSIS', label: 'metin yapısını çözümleme' };
  if (contains(text, ['anahtar kelime'])) return { key: 'KEYWORDS', label: 'anahtar kavramları belirleme' };
  if (contains(text, ['düşünceyi geliştirme'])) return { key: 'IDEA_DEVELOPMENT', label: 'düşünceyi geliştirme yolunu kullanma veya çözümleme' };
  if (contains(text, ['söz sanat'])) return { key: 'FIGURATIVE_LANGUAGE', label: 'söz sanatını belirleme ve etkisini açıklama' };
  if (contains(text, ['söz varlığ'])) return { key: 'VOCABULARY_BUILD', label: 'söz varlığını anlamlı biçimde geliştirme' };
  if (contains(text, ['çoklu ortam'])) return { key: 'MULTIMEDIA', label: 'çoklu ortam ögelerini anlamla ilişkilendirme' };
  if (contains(text, ['özet'])) return { key: 'SUMMARY', label: 'ana düşünce ve önemli ayrıntıları özetleme' };
  if (contains(text, ['eleştir'])) return { key: 'CRITIQUE', label: 'ölçüte dayalı eleştiri geliştirme' };
  if (contains(text, ['değerlendir'])) return { key: 'EVALUATE', label: 'ölçüte dayalı değerlendirme yapma' };
  if (contains(text, ['yorum'])) return { key: 'INTERPRET', label: 'kanıta dayalı yorum geliştirme' };
  if (contains(text, ['probleme çözüm'])) return { key: 'PROBLEM_SOLVING', label: 'soruna uygulanabilir çözüm üretme' };
  if (contains(text, ['tartış'])) return { key: 'DISCUSS', label: 'görüşleri karşılaştırarak tartışma' };
  if (contains(text, ['yaratıcı'])) return { key: 'CREATIVE', label: 'özgün ve tutarlı yaratıcı üretim' };
  if (contains(text, ['uygun tepki'])) return { key: 'INTERACTION', label: 'bağlama uygun etkileşim ve tepki' };
  if (contains(text, ['geçiş ve bağlantı'])) return { key: 'COHESION', label: 'mantıksal geçiş ve bağlantı kurma' };
  if (contains(text, ['açık ve örtük'])) return { key: 'IMPLICIT_EXPLICIT', label: 'açık ve örtük anlamı etkili kullanma' };
  if (contains(text, ['sesini uygun'])) return { key: 'DELIVERY', label: 'ses, vurgu ve tonlamayı yönetme' };
  if (contains(text, ['hazırlıklı'])) return { key: 'PREPARED_PRODUCTION', label: 'hazırlıklı üretimi yapılandırma' };
  if (contains(text, ['amaç ve içeriğe'])) return { key: 'PURPOSE_AUDIENCE', label: 'amaç, içerik ve hedef kitleyi eşleştirme' };
  if (contains(text, ['ön bilgilerinden'])) return { key: 'PRIOR_KNOWLEDGE', label: 'ön bilgiyi yeni bağlama aktarma' };
  if (contains(text, ['yazısını', 'yazma', 'yazılı'])) return { key: 'WRITING_PRODUCTION', label: 'amaçlı yazılı üretim' };
  if (contains(text, ['konuşma', 'sözlü'])) return { key: 'SPEAKING_PRODUCTION', label: 'amaçlı sözlü üretim' };
  return { key: 'COMPREHENSION', label: 'anlamı belirleme ve kanıtla açıklama' };
}

function areaFor(outcome) {
  const code = outcome.officialOutcomeCode;
  if (code.startsWith('T.D') || code.startsWith('T.8.1')) return 'LISTENING';
  if (code.startsWith('T.O') || code.startsWith('T.8.3')) return 'READING';
  if (code.startsWith('T.K') || code.startsWith('T.8.2')) return 'SPEAKING';
  return 'WRITING';
}

function criteriaFor(profile, area) {
  const generic = genericCriteria(profile.key, area);
  const specialized = {
    SOURCE_SELECTION: ['En az iki materyali güvenilirlik, yaş düzeyi ve amaç ölçütleriyle karşılaştırır.', 'Seçtiği materyalin göreve uygunluğunu somut özelliklerle gerekçelendirir.', 'Seçmediği materyalin sınırlılığını açıklar.', 'Seçiminin sonucunu ve gerekirse alternatifini belirtir.'],
    PROCESS_MANAGEMENT: ['Görev öncesi amacını ve kullanacağı yöntemi belirler.', 'Görev sırasında anlamayı/üretimi izleyecek bir kontrol yöntemi kullanır.', 'Zorlandığı noktada yöntemini gerekçeli biçimde değiştirir.', 'Görev sonunda yöntemin etkisini kanıtla değerlendirir.'],
    PREDICTION: ['Başlık, görsel, ses veya ilk bölümden en az iki ipucu seçer.', 'İpuçlarını birbiriyle ilişkilendirerek makul bir tahmin kurar.', 'Tahminini metinde olmayan ayrıntılarla aşırı genişletmez.', 'Yeni bilgi geldiğinde tahminini günceller.'],
    VOCABULARY_INFERENCE: ['Bilinmeyen sözün çevresindeki anlam ipuçlarını belirler.', 'Sözün cümledeki olası anlamını kendi sözleriyle açıklar.', 'Tahminini sözlük anlamıyla karşılaştırır.', 'Sözü yeni ve doğru bir cümlede kullanır.'],
    DEEP_INFERENCE: ['Açıkça verilen en az iki kanıtı belirler.', 'Kanıtların ortak sonucunu aşırı genellemeden çıkarır.', 'Alternatif bir yorumu neden elemediğini açıklar.', 'Çıkarımının sınırını belirtir.'],
    COMPARE: ['Karşılaştırma için açık ölçütler belirler.', 'Benzerlik ve farklılıkları aynı ölçütler üzerinden gösterir.', 'Her yargısını ilgili metin/medya kanıtına bağlar.', 'Karşılaştırmadan dengeli bir sonuç çıkarır.'],
    CLASSIFY: ['Sınıflandırma ölçütünü açıkça tanımlar.', 'Unsurları ölçüte göre doğru gruplara yerleştirir.', 'Sınırda kalan bir unsuru gerekçesiyle değerlendirir.', 'Sınıflandırmanın amaca katkısını açıklar.'],
    STORY_ANALYSIS: ['Kişi, yer, zaman ve olay örgüsü unsurlarını belirler.', 'Çatışma veya temel problemi açıklar.', 'Karakter davranışı ile olay sonucu arasında ilişki kurar.', 'Metinden kanıt göstererek çözümlemesini tamamlar.'],
    STRUCTURE_ANALYSIS: ['Giriş, gelişme ve sonuç ya da metne özgü bölümleri belirler.', 'Her bölümün işlevini açıklar.', 'Önemli bilgileri metin yapısıyla ilişkilendirir.', 'Bölüm sırası değiştiğinde anlamın nasıl etkileneceğini değerlendirir.'],
    KEYWORDS: ['Metnin ana konusunu ve alt düşüncelerini belirler.', 'Tekrar, kavram ağı ve vurgu ipuçlarından anahtar sözcükleri seçer.', 'Seçtiği her sözcüğün metni temsil etme nedenini açıklar.', 'Gereksiz ayrıntı sözcüklerini dışarıda bırakır.'],
    MULTIMEDIA: ['Metin, görsel, ses veya hareketli görüntünün verdiği bilgileri ayrı ayrı belirler.', 'Ögelerin birbirini desteklediği veya değiştirdiği noktaları açıklar.', 'Tasarım tercihinin anlam ve hedef kitle üzerindeki etkisini değerlendirir.', 'Yalnız tek bir medya ögesine dayanarak sonuç çıkarmaz.'],
    SUMMARY: ['Ana düşünceyi ve temel olay/kanıt zincirini belirler.', 'Ayrıntıları önem sırasına göre seçer.', 'Kendi cümleleriyle kısa ve tutarlı bir özet oluşturur.', 'Kişisel yorum veya metinde olmayan bilgi eklemez.'],
    CRITIQUE: ['Değerlendirme ölçütünü açıkça belirtir.', 'Güçlü ve geliştirilmesi gereken yönleri ayrı kanıtlarla gösterir.', 'Yargısını kişisel beğeniden ayırır.', 'Uygulanabilir bir geliştirme önerisi sunar.'],
    EVALUATE: ['Amaç ve hedef kitleye uygun değerlendirme ölçütleri belirler.', 'En az iki kanıtı ölçütlere göre inceler.', 'Olumlu ve sınırlı yönleri dengeli biçimde ifade eder.', 'Sonucunu kanıtın izin verdiği kapsamda tutar.'],
    PROBLEM_SOLVING: ['Sorunun nedenini ve etkilenen tarafları belirler.', 'Birden fazla çözüm seçeneği üretir.', 'Çözümleri uygulanabilirlik ve olası sonuçlarıyla karşılaştırır.', 'Seçtiği çözüm için izlenebilir başarı ölçütü verir.'],
    COHESION: ['Düşünceler arasındaki zaman, neden, karşıtlık veya örneklendirme ilişkisini belirler.', 'İlişkiye uygun geçiş ifadeleri seçer.', 'İfadeleri tekrara düşmeden ve anlamı bozmadan kullanır.', 'Metin/konuşma akışını son kontrolde düzeltir.'],
    SELF_REFLECTION: genericCriteria('SELF_REFLECTION', area)
  };
  return specialized[profile.key] || generic;
}

function contextAndStem(outcome, grade, area, profile) {
  const theme = themeFor(outcome.officialOutcomeCode);
  const age = grade === 5 ? '5. sınıf öğrencisinin anlayabileceği açıklıkta' : '8. sınıf/LGS düzeyinde';
  const common = `${theme.label} konusunda ${theme.evidence} içeren özgün bir çalışma paketi verilir.`;
  if (area === 'LISTENING') return {
    context: `${common} Paket, 80-120 saniyelik bir ses/video kaydı ve kayıt öncesi kısa başlık-görsel ipucundan oluşur.`,
    stem: `Kaydı iki kez dinle/izle. ${profile.label} becerisini kullanarak ${age} bir yanıt veya ürün oluştur; kullandığın kanıtları zaman kodu ya da ayrıntı adıyla göster.`
  };
  if (area === 'READING') return {
    context: `${common} Pakette farklı işlevlerde iki kısa metin, bir görsel ve kaynak künyeleri bulunur.`,
    stem: `Metin ve görselleri incele. ${profile.label} becerisini kullanarak ${age} bir çözüm üret; kararını metindeki somut ifadelerle kanıtla.`
  };
  if (area === 'SPEAKING') return {
    context: `${theme.label} hakkında sınıf içi bir toplantı yapılacaktır. Öğrenciye ${theme.evidence} ve iki farklı dinleyici profili verilir.`,
    stem: `${profile.label} amacıyla 1-2 dakikalık bir konuşma hazırla ve sun. İçeriğini hedef kitleye göre düzenle, kanıtlarını sözlü olarak ilişkilendir ve sunum sonrası öz değerlendirme yap.`
  };
  return {
    context: `${theme.label} üzerine ${theme.evidence} içeren bir yazma dosyası verilir. Metnin amacı ve hedef okuyucusu görev kartında belirtilir.`,
    stem: `${profile.label} becerisini gösterecek ${grade === 5 ? '120-180' : '180-250'} sözcüklük bir metin hazırla. Taslak oluştur, kanıtları düzenle, metni gözden geçir ve son hâlini kısa öz değerlendirmeyle birlikte sun.`
  };
}

export function buildTurkishCompletionTaskSpec(outcome, grade) {
  const area = areaFor(outcome);
  const profile = actionProfile(outcome);
  const { context, stem } = contextAndStem(outcome, grade, area, profile);
  const itemFormat = area === 'SPEAKING' ? 'interactive-simulation' : 'open-response';
  return Object.freeze({
    primarySkill: `${area.toLocaleLowerCase('en-US')}-${profile.key.toLocaleLowerCase('en-US')}`,
    secondarySkills: area === 'SPEAKING' ? ['hedef-kitle', 'kanıtlı-anlatım', 'sunum-öz-değerlendirme'] : ['kanıt-seçimi', 'yapılandırma', 'öz-değerlendirme'],
    cognitiveProcess: `${profile.label}-uygula-ve-değerlendir`,
    difficultyBand: grade === 5 ? 'GRADE5_BALANCED' : 'LGS_MEDIUM_HIGH',
    context,
    stem,
    criteria: criteriaFor(profile, area),
    itemFormat,
    responseModel: { deliveryChannel: area, expectedDurationSeconds: area === 'SPEAKING' ? 120 : undefined },
    misconceptionIds: area === 'SPEAKING'
      ? ['amac-hedef-kitle-uyumsuzlugu', 'kanitsiz-sozlu-iddia', 'sunum-akisi-kopuklugu']
      : area === 'WRITING'
        ? ['plansiz-yazma', 'kanitsiz-genelleme', 'duzeltme-yapmama']
        : ['tek-ipucuna-dayanma', 'metin-disi-ekleme', 'kanit-sinirini-asma'],
    solverId: `turkish-g${grade}-${area.toLocaleLowerCase('en-US')}-rubric-solver-v1`,
    verifierId: `turkish-g${grade}-${area.toLocaleLowerCase('en-US')}-independent-rubric-verifier-v1`,
    styleProfile: { genre: `${area.toLocaleLowerCase('en-US')}-curriculum-performance-task`, voice: grade === 5 ? 'age-calibrated-clear' : 'lgs-academic-clear', rhetoricalMoves: ['planla', 'kanıt-seç', 'üret', 'gözden-geçir'] },
    batch: `TURKISH_G${grade}_FULL_SCOPE_COMPLETION`
  });
}
