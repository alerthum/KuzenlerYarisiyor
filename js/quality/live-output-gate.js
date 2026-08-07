/**
 * Öğrencinin gerçekten gördüğü son soru nesnesi için fail-closed kalite kapısı.
 * Ara üretim metaverisini değil prompt + context + seçenek + ipucu + açıklamayı
 * denetler. Kritik bir ihlalde soru canlı oturuma giremez.
 */

export const LIVE_OUTPUT_GATE_VERSION = '2.0.0';

const FORBIDDEN_PATTERNS = Object.freeze([
  /Olimpiyat kulübünde çözülen bir soru:/i,
  /Sınıfta çözülen bir mantık sorusu:/i,
  /Senaryodaki sayıları ayıkla; genel kuralı bul\./i,
  /Hedef kelimenin düşünme türünü ayır/i,
  /English word lab review:/i,
  /Which choice is the violation\?/i,
  /Which world matches synonym meaning\?/i,
  /\bW[ABCDEF]\b/,
  /(?:^|\s)(?:WA|WB|WC|WD)(?:\s|$)/
]);

const GENERIC_HINT_PATTERNS = Object.freeze([
  /^Koşulları ve kanıtları tek tek ayır\.?$/i,
  /^Her seçeneği bütün koşullara göre yeniden kontrol et\.?$/i,
  /^Metindeki\/verideki kanıtları sırayla ayır\.?$/i,
  /^Her seçeneği aynı ölçüte göre kontrol et\.?$/i,
  /^Senaryodaki sayıları ayıkla; genel kuralı bul\.?$/i
]);

const MOJIBAKE = /(?:Ã.|Ä.|Å.|â€|ï¿½)/;
const CODE_ONLY_OPTION = /^(?:[A-Z]{1,3}\d?|W[A-Z]|[A-Z]\/[A-Z])$/;

function text(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalized(value) {
  return text(value)
    .toLocaleLowerCase('tr-TR')
    .replaceAll('≤', ' le ')
    .replaceAll('≥', ' ge ')
    .replace(/<=/g, ' le ')
    .replace(/>=/g, ' ge ')
    .replace(/[^\p{L}\p{N}+\-−×÷=<>%/]+/gu, '');
}

function visibleText(round) {
  return [round.prompt, round.context, ...(round.options || []), ...(round.hints || []), round.explanation]
    .map(text)
    .filter(Boolean)
    .join(' ');
}

function quotedTarget(value) {
  return text(value).match(/[“\"]([^”\"]{2,48})[”\"]/)?.[1] || '';
}

function numberClues(value) {
  return [...new Set(text(value).match(/\d+(?:[.,]\d+)?(?:\s*[:/%°]\s*\d+)?/g) || [])].slice(0, 4);
}

function finalSentence(value) {
  const rows = text(value).split(/(?<=[.!?])\s+/).filter(Boolean);
  return rows.at(-1) || text(value);
}

function sourceHintsAreSpecific(round) {
  const hints = Array.isArray(round?.hints) ? round.hints.map(text).filter(Boolean) : [];
  if (hints.length < 2) return false;
  if (hints.some((hint) => GENERIC_HINT_PATTERNS.some((pattern) => pattern.test(hint)))) return false;
  return new Set(hints.map(normalized)).size === hints.length && hints.every((hint) => hint.length >= 25);
}

function gameHints(gameId, round) {
  if (round?.trustedHumanReview?.status === 'APPROVED' && sourceHintsAreSpecific(round)) {
    return round.hints.map(text).slice(0, 2);
  }
  const prompt = text(round?.prompt);
  const context = text(round?.context);
  const target = quotedTarget(prompt);
  const numbers = numberClues(`${context} ${prompt}`);
  const numericClue = numbers.length ? numbers.join(', ') : 'verilen nicelikleri';

  switch (gameId) {
    case 'paragraph-detective': {
      if (/tutum/i.test(prompt)) return [
        'Parçada olumlu ve eleştirel ifadeleri iki sütuna ayır; yazarın ikisini birlikte taşıyan tutumunu ara.',
        '“Fakat”, “ancak” ve benzeri geçişlerden sonra gelen değerlendirmenin yazarın asıl mesafesini nasıl değiştirdiğini kontrol et.'
      ];
      if (/çıkarım/i.test(prompt)) return [
        'Metinde kesin verilen bilgiyle yalnız olasılık bildiren sonucu ayır; “kesinlikle” türü aşırı genellemeleri ele.',
        'Birden çok etken verilmişse tek nedeni zorunlu ilan etmeyen, kanıtın sınırını koruyan seçeneği ara.'
      ];
      if (/destek|kanıt/i.test(prompt)) return [
        `“${prompt.replace(/[?？]$/, '')}” sorusunda önce savunulan görüşü neden-sonuç biçiminde yaz; ardından bu ilişkiyi doğrudan ölçen seçeneği seç.`,
        `“${context.slice(0, 64)}${context.length > 64 ? '…' : ''}” bağlamında anket, beğeni veya yakın konu yerine iddiadaki değişkenleri karşılaştıran somut kanıtı ara.`
      ];
      if (/zayıflık|yetersiz/i.test(prompt)) return [
        'Örneklem büyüklüğü, gözlem süresi ve karşılaştırma grubu bakımından kanıtın sınırlarını belirle.',
        'Tek kişinin kısa deneyiminden bütün öğrencilere uzanan genellemenin hangi basamakta kanıtsız kaldığını bul.'
      ];
      if (/ana düşünce|ana fikir/i.test(prompt)) return [
        'Parçadaki örneklerin ortak yönünü tek cümlede birleştir; yalnız bir örneği tekrar eden seçenekleri ele.',
        'Yazarın sonuçta savunduğu genel yargıyı, ayrıntıların tümünü açıklayıp açıklamadığına göre sınamaya çalış.'
      ];
      return [
        `“${prompt.replace(/[?？]$/, '')}” sorusunda parçanın bütününü açıklayan ilişkiyi belirle; tek cümlelik ayrıntıya takılma.`,
        'Seçeneğin metinde açıkça verilen kanıtların tamamını karşılamasını ve metne yeni bir iddia eklememesini denetle.'
      ];
    }
    case 'meaning-hunt': {
      if (sourceHintsAreSpecific(round)) {
        const authored = round.hints.map(text).slice(0, 2);
        return [
          `${authored[0]} “${prompt.slice(0, 72)}${prompt.length > 72 ? '…' : ''}” sorusundaki bağlamla birlikte düşün.`,
          authored[1]
        ];
      }
      const phrase = target || prompt.replace(/[?？]$/, '').slice(0, 72) || 'hedef söz';
      return [
        `“${phrase}” ifadesini geçici olarak çıkar; yerine seçeneklerdeki anlamları koyup cümlenin doğal kalıp kalmadığını sınayarak ilerle.`,
        `“${phrase}” çevresindeki eylem ve sonuç ifadelerini kullan; yalnız sözlükte mümkün olan ama bu bağlama uymayan anlamları ele.`
      ];
    }
    case 'science-reasoning': {
      if (/hipotez/i.test(prompt)) return [
        'Hipotezde değiştirilecek koşulun, ölçülecek sonucun ve sürenin açıkça bulunup bulunmadığını kontrol et.',
        '“Daha iyi” gibi ölçülemeyen sözler yerine sayıyla veya gözlem ölçütüyle sınanabilen karşılaştırmayı ara.'
      ];
      if (/kanıt/i.test(prompt)) return [
        'Özdeş gruplar, eşit başlangıç koşulları ve tekrarlı ölçüm içeren düzeni diğerlerinden ayır.',
        'Kişisel izlenim veya üretici açıklaması yerine değişkenin etkisini karşılaştırmalı olarak ölçen seçeneği bul.'
      ];
      if (/değişken/i.test(prompt)) return [
        `Düzende özellikle değiştirilen niceliği ve sonuç olarak ölçülen niceliği ayrı yaz; ${numericClue} değerlerinin hangi role ait olduğunu belirle.`,
        'Sabit tutulan koşulu bağımsız değişkenle karıştırma; sonuç cümlesini yalnız ölçülen verinin yönü kadar güçlü kur.'
      ];
      if (/yorum|çıkarım|neden/i.test(prompt)) return [
        `“${context.slice(0, 72)}${context.length > 72 ? '…' : ''}” gözleminde birlikte değişimin tek başına neden-sonuç kanıtı olmadığını unutma; ortak etkeni ara.`,
        'Seçenekteki kesinlik düzeyini verinin gücüyle karşılaştır; gözlem yalnız ilişki gösteriyorsa doğrudan neden ilan etme.'
      ];
      return [
        `“${prompt.replace(/[?？]$/, '')}” için “${context.slice(0, 58)}${context.length > 58 ? '…' : ''}” düzeninde ${numericClue} değerleri arasında değiştirilen koşulu ve ölçülen sonucu ayır.`,
        `Sonucu yalnız bu deney düzeniyle destekle; “${context.slice(-52)}” bölümünde verilmeyen bir değişkeni açıklama olarak ekleme.`
      ];
    }
    case 'problem-hunter': {
      const canonicalId = text(round?.canonicalQuestionId);
      if (/exponent-rules/.test(canonicalId)) return [
        '4 ve 8 tabanlarını önce 2’nin kuvveti olarak yaz; farklı tabanlarla doğrudan üs işlemi yapma.',
        'Paydaki üsleri topladıktan sonra paydanın üssünü çıkar; son kuvveti başlangıç ifadesinde sayısal olarak da kontrol et.'
      ];
      if (/radical-combination/.test(canonicalId)) return [
        '12, 27 ve 75 kök içlerinden sırasıyla 4, 9 ve 25 tam kare çarpanlarını ayırarak bütün terimleri √3 türünden yaz.',
        'Kök içleri eşit olduktan sonra yalnız dış katsayıları işleme al; çıkarılan terimin eksi işaretini son toplama kadar koru.'
      ];
      if (/square-frame-identity/.test(canonicalId)) return [
        'Eklenen alanı dıştaki (x+3) kenarlı karenin alanından içteki x kenarlı karenin alanını çıkararak modelle.',
        '(x+3)² açılımında 2·x·3 orta terimini unutma; iki x² teriminin neden birbirini götürdüğünü kontrol et.'
      ];
      if (/inequality-direction/.test(canonicalId)) return [
        'Önce her iki taraftan 12 çıkararak −3x≤15 biçimine gel; negatif katsayıyı en son adımda ele al.',
        'İki tarafı −3’e bölerken eşitsizlik yönünü değiştir; x=0 gibi bir deneme değeriyle çözüm yönünü bağımsız doğrula.'
      ];
      if (/triangle-inequality/.test(canonicalId)) return [
        'Üçüncü kenar x için |12−7|<x<12+7 eşitsizliğini kur; sınırların neden çözüm kümesine alınmadığını açıklayarak ilerle.',
        '5 ile 19 arasındaki tam sayıları uçları almadan say; son−ilk+1 hesabını gerçek listeyle kontrol et.'
      ];
      if (/graph-interpretation/.test(canonicalId)) return [
        'Her şıkkın aynı işlemi istemediğini fark et: bazıları dört aylık toplamı, bazıları aylık artışı, bazıları tek ay değerini karşılaştırıyor.',
        'Bilim, spor ve sanat verileri için yalnız ilgili şıkkın gerektirdiği toplam veya farkı hesapla; doğru görünen ilk şıkta durma.'
      ];
      if (/linear-tank/.test(canonicalId)) return [
        '2. ve 6. dakika ölçümlerinden dört dakikadaki toplam azalmayı bulup dakikalık değişim hızını hesapla.',
        'Doğrusal modelde t=0 için 180 litreyi koru; sonra V=45 eşitliğini çözerek denklem ile zamanı birlikte doğrula.'
      ];
      if (/probability-cards/.test(canonicalId)) return [
        '1–15 arasındaki asal sayılarla 5’in katlarını iki ayrı küme olarak yaz; iki kümeye de giren 5’i yalnız bir kez say.',
        'Birleşim kümesinin eleman sayısını 15 eş olasılıklı karta oranla; paydayı uygun olmayan kartları çıkararak değiştirme.'
      ];
      return [
        `Bağlamdaki ${numericClue} verilerini, her birinin rolünü ve aralarındaki matematiksel ilişkiyi ayrı ayrı yaz.`,
        `“${prompt.replace(/[?？]$/, '')}” sorusunda bulduğun sonucu başlangıç modeline geri koyarak hem işlemi hem yorumunu doğrula.`
      ];
    }
    case 'error-detective': {
      const key = text(round?.questionKey);
      if (/decimal/.test(key)) return [
        'Ondalık toplamada sayıları sağ kenara göre değil, virgüller ve aynı basamak değerleri alt alta gelecek biçimde yeniden yaz.',
        `“${context.slice(0, 72)}${context.length > 72 ? '…' : ''}” işleminde eksik ondalık basamakları sıfırla tamamlayıp toplamı kontrol et.`
      ];
      if (/place-value/.test(key)) return [
        'Doğal sayı toplamasında birler basamaklarını aynı sütuna getir; sayıları soldan hizalamak basamak değerlerini değiştirir.',
        `“${context.slice(0, 72)}${context.length > 72 ? '…' : ''}” işleminde her rakamın gerçek basamak değerini yazıp hizalamayı doğrula.`
      ];
      if (/subtraction-zero/.test(key)) return [
        'Birler basamağına ödünç verebilmek için soldaki ilk sıfır olmayan basamağa kadar ilerle; bozulan her basamağı sırayla yeniden düzenle.',
        'Ödünç alma zincirini tamamladıktan sonra çıkarma sonucunu toplama işlemiyle geri kontrol et.'
      ];
      if (/distributive/.test(key)) return [
        '16’yı 10+6 biçiminde ayırdığında 24 çarpanının toplamın iki terimine de dağılması gerektiğini cebirsel olarak yaz.',
        'Parçalı sonuçları topladıktan sonra 24×16 işlemini farklı bir parçalamayla yeniden hesaplayıp aynı sonucu verdiğini kontrol et.'
      ];
      if (/remainder/.test(key)) return [
        '13 kutunun toplam kapasitesini 12×13 ile bul; 157 kitaptan sonra açıkta kalan nesnenin gerçek yaşamda ne gerektirdiğini yorumla.',
        'Bölüm ve kalanı yalnız sayı olarak değil, “dolu kutu” ve “açıkta kalan kitap” anlamlarıyla birlikte değerlendir.'
      ];
      if (/fraction-compare/.test(key)) return [
        'Kesirleri karşılaştırmadan önce eşit büyüklükte parçalara dönüştür; 3/4’ü pay ve paydayı aynı sayıyla çarparak sekizde birlere çevir.',
        'Ortak paydada yalnız payları karşılaştır; başlangıç kesirlerinin değerini koruduğunu şekil veya çapraz çarpımla doğrula.'
      ];
      if (/equivalent-fraction/.test(key)) return [
        'Bir kesrin değerini korumak için pay ve paydaya aynı toplama değil, aynı sıfırdan farklı çarpma veya bölme işlemi uygulanır.',
        '2/3 ile önerilen kesri çapraz çarpımla karşılaştır; eşdeğerlik varsa çapraz çarpımların eşit olması gerekir.'
      ];
      if (/perimeter-area/.test(key)) return [
        'Çitin kapladığı yüzeyi değil bahçenin sınır uzunluğunu ölçtüğünü belirle; iki uzun ve iki kısa kenarı ayrı ayrı say.',
        'Bulduğun sonucu metre birimiyle yaz; metrekare çıkan işlem alanı hesapladığı için sorulan büyüklüğü karşılamaz.'
      ];
      if (/average/.test(key)) return [
        'Ortalamada bütün veri değerlerini topla ve toplamı veri sayısına böl; yalnız en büyük ve en küçük değeri kullanma.',
        'Bulduğun ortalamanın veri kümesinin en küçük ve en büyük değeri arasında kaldığını kontrol et.'
      ];
      if (/math-time/.test(key)) return [
        'Başlangıç saatinden tam saatleri ve kalan dakikaları sırayla ilerlet; saat ile dakika birimlerini doğrudan ondalık sayı gibi toplama.',
        'Son saati başlangıca göre geçen toplam dakikaya çevirerek ikinci bir yöntemle doğrula.'
      ];
      return [
        `“${prompt.replace(/[?？]$/, '')}” sorusunda öğrencinin ilk yanlış adımını bul; sonucun yanlış olmasına değil hatanın başladığı kurala odaklan.`,
        `Bağlamdaki ${numericClue} verilerini doğru yöntemle yeniden işle ve her yanlış seçeneğin hangi kavram yanılgısına dayandığını karşılaştır.`
      ];
    }
    case 'logic-station': {
      const mode = /zorunlu|kesin/i.test(prompt) ? 'zorunlu' : /mümkün|olabilir/i.test(prompt) ? 'mümkün' : 'geçerli';
      const contextAnchor = `${context.slice(0, 68)}${context.length > 68 ? '…' : ''}`;
      return [
        `“${prompt.replace(/[?？]$/, '')}” sorusunda “${mode}” ölçütünü işaretle; “${contextAnchor}” bağlamındaki her öncülü ayrı bir kısıt olarak göster.`,
        mode === 'zorunlu'
          ? `“${contextAnchor}” için bütün geçerli düzenleri düşün; yargı yalnız tek örnekte değil, her düzende doğru kalmalıdır.`
          : `“${contextAnchor}” için seçeneğin bütün öncülleri aynı anda sağladığı tek bir tam düzen kur; ilk çelişkide ele.`
      ];
    }
    case 'lgs-foundation': {
      const subject = /olasılık|torba|kart/i.test(`${context} ${prompt}`) ? 'olasılık'
        : /oran|fiyat|yüzde/i.test(`${context} ${prompt}`) ? 'oran ve yüzde'
          : /deney|model|değişken/i.test(`${context} ${prompt}`) ? 'bilimsel kanıt'
            : /parça|metin|yazar/i.test(`${context} ${prompt}`) ? 'metin kanıtı'
              : 'soru kökündeki ölçüt';
      return [
        `“${prompt.replace(/[?？]$/, '')}” sorusunda ana çözüm ekseni “${subject}”tir; seçeneklerin aynı veriyi hangi yöntemle kullandığını karşılaştır.`,
        `Bağlamdaki ${numericClue === 'verilen nicelikleri' ? 'temel' : numericClue} verilerini veya sözel kanıtları sonuca bağlayan adımı açıkça kur; gerekçesiz doğru görünen seçeneği seçme.`
      ];
    }
    case 'olympiad-ladder':
      if (sourceHintsAreSpecific(round)) {
        const authored = round.hints.map(text).slice(0, 2);
        return [
          `${authored[0]} Bu sorudaki ${numericClue} verilerini bu stratejiye göre yerleştir.`,
          authored[1]
        ];
      }
      return [
        `Bu problemde ${numericClue} verileriyle doğrudan işlem yapmadan önce değişmezliği, sayma ayrımını veya en küçük-en büyük koşulunu belirle.`,
        'Bulduğun sonucu başlangıç koşullarına geri yerleştir; yalnız değeri değil, yöntemin neden bütün olasılıkları kapsadığını doğrula.'
      ];
    case 'english-vocabulary': {
      if (target) return [
        `“${target}” sözcüğünün çevresindeki karşıtlık, neden-sonuç veya miktar ipuçlarını işaretle; sözcüğün cümlede üstlendiği anlamı çıkar.`,
        `Her Türkçe anlamı “${target}” yerine düşünerek cümlenin tamamıyla tutarlı olup olmadığını karşılaştır.`
      ];
      const blankSentence = finalSentence(context).replace(/\s+/g, ' ').slice(0, 120);
      return [
        `“${blankSentence}” cümlesindeki boşluktan önce ve sonra verilen eylem ya da durum ipuçlarını birlikte kullan.`,
        'Dört kelimeyi boşluğa sırayla yerleştir; hem dil bilgisi hem bağlam bakımından doğal ve tek anlamlı olanı seç.'
      ];
    }
    default:
      if (sourceHintsAreSpecific(round)) return round.hints.map(text).slice(0, 2);
      return [
        `“${prompt.replace(/[?？]$/, '').slice(0, 90)}” sorusunda verilenlerle isteneni ayrı yaz.`,
        'Seçenekleri bütün koşullara geri yerleştirerek yalnız birinin tutarlı kaldığını doğrula.'
      ];
  }
}

function normalizeGrade5English(round) {
  const options = Array.isArray(round.options) ? round.options : [];
  const correct = options[Number(round.answerIndex)] || '';
  const originalPrompt = text(round.prompt);
  const completedSentence = originalPrompt.includes('___')
    ? originalPrompt.replace('___', correct)
    : originalPrompt;
  return {
    ...round,
    prompt: 'Bağlama göre boşluğu doğru tamamlayan İngilizce kelime hangisidir?',
    context: `${text(round.context)}\n\n${originalPrompt}`,
    explanation: `${text(round.explanation)} Doğru cümle: “${completedSentence}”`.trim()
  };
}

export function normalizeTrustedLiveRound(round, { gameId, grade } = {}) {
  let normalizedRound = { ...round };
  if (gameId === 'english-vocabulary' && Number(grade) <= 5 && text(round.prompt).includes('___')) {
    normalizedRound = normalizeGrade5English(normalizedRound);
  }
  return {
    ...normalizedRound,
    hints: gameHints(gameId, normalizedRound),
    liveOutputGateVersion: LIVE_OUTPUT_GATE_VERSION,
    liveOutputReviewedSurface: true
  };
}

export function auditLiveOutputRound(round, { gameId, grade } = {}) {
  const errors = [];
  const warnings = [];
  const prompt = text(round?.prompt);
  const context = text(round?.context);
  const explanation = text(round?.explanation);
  const options = Array.isArray(round?.options) ? round.options.map(text) : [];
  const hints = Array.isArray(round?.hints) ? round.hints.map(text).filter(Boolean) : [];
  const combined = visibleText(round || {});

  if (!round || typeof round !== 'object') errors.push('ROUND_MISSING');
  if (!text(round?.questionKey)) errors.push('QUESTION_KEY_MISSING');
  if (round?.kind !== 'choice') errors.push('UNSUPPORTED_KIND');
  if (prompt.length < 12) errors.push('PROMPT_TOO_SHORT');
  if (context.length < 18) errors.push('CONTEXT_TOO_SHORT');
  if (explanation.length < 24) errors.push('EXPLANATION_TOO_SHORT');
  if (options.length !== 4) errors.push('OPTIONS_MUST_BE_FOUR');
  if (!Number.isInteger(round?.answerIndex) || round.answerIndex < 0 || round.answerIndex >= options.length) errors.push('ANSWER_INDEX_INVALID');
  if (options.some((option) => option.length < 1)) errors.push('EMPTY_OPTION');
  if (new Set(options.map(normalized)).size !== options.length) errors.push('DUPLICATE_OPTIONS');
  if (options.some((option) => CODE_ONLY_OPTION.test(option))) errors.push('CONTEXT_FREE_CODE_OPTION');
  if (MOJIBAKE.test(combined)) errors.push('MOJIBAKE_TEXT');
  if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(combined))) errors.push('FORBIDDEN_SURFACE_PATTERN');
  if (hints.length < 2) errors.push('HINTS_MISSING');
  if (hints.some((hint) => GENERIC_HINT_PATTERNS.some((pattern) => pattern.test(hint)))) errors.push('GENERIC_HINT');
  if (hints.some((hint) => hint.length < 25)) errors.push('HINT_TOO_SHORT');

  const minimumSteps = ['logic-station', 'problem-hunter', 'science-reasoning', 'lgs-foundation'].includes(gameId) ? 2 : 1;
  const steps = Number(round?.reasoningStepCount || round?.cognitiveDepthEvidence?.reasoningStepCount || round?.solutionGraph?.length || 0);
  if (steps < minimumSteps) errors.push('REASONING_DEPTH_TOO_LOW');

  const deepGrade8Match = text(round?.questionKey).match(/^trusted:2\.0:(problem-hunter|science-reasoning|paragraph-detective|meaning-hunt|logic-station):/);
  if (deepGrade8Match) {
    const deepGameId = deepGrade8Match[1];
    if (Number(grade) !== 8) errors.push('DEEP_G8_WRONG_GRADE');
    if (round?.trustedHumanReview?.status !== 'APPROVED') errors.push('HUMAN_REVIEW_NOT_APPROVED');
    if (round?.trustedHumanReview?.difficultyVerdict !== 'HARD') errors.push('HARD_DIFFICULTY_NOT_CONFIRMED');
    if (!['LGS_HIGH', 'LOGIC_HIGH'].includes(round?.intendedDifficultyBand)) errors.push('HIGH_DIFFICULTY_BAND_REQUIRED');
    if (Number(round?.authoredReasoningStepCount || 0) < 4) errors.push('AUTHORED_REASONING_STEPS_TOO_LOW');
    const proofVerified = ['paragraph-detective', 'meaning-hunt'].includes(deepGameId)
      ? round?.evidenceProof?.verified === true
      : round?.solverProof?.verified === true;
    if (!proofVerified) errors.push('INDEPENDENT_PROOF_NOT_VERIFIED');
    if (round?.distractorValidation?.verified !== true) errors.push('DISTRACTOR_VALIDATION_MISSING');
    const diagnosticWrongOptions = Array.isArray(round?.optionDiagnostics)
      ? round.optionDiagnostics.filter((row) => row && row.isCorrect === false && text(row.misconceptionId)).length
      : 0;
    if (diagnosticWrongOptions < 3) errors.push('THREE_DIAGNOSTIC_DISTRACTORS_REQUIRED');
  }

  if (gameId === 'olympiad-ladder') {
    if (steps < 4) errors.push('OLYMPIAD_REASONING_DEPTH_TOO_LOW');
    if (/(?:100 gün|tokalaşma|çorap|21 taş|ardışık üç tam sayı)/i.test(combined)) errors.push('OLYMPIAD_FOUNDATION_EXERCISE');
  }

  const intentionalEnglishItem = gameId === 'english-vocabulary'
    || (gameId === 'lgs-foundation' && /english/i.test(String(round?.familyId || round?.subjectId || '')));
  if (!intentionalEnglishItem && /\b(?:which|choice|world|review|matches|word lab)\b/i.test(`${prompt} ${context}`)) {
    errors.push('UNEXPECTED_ENGLISH_IN_NON_ENGLISH_GAME');
  }

  if (gameId === 'english-vocabulary') {
    const hasEnglishContext = /\b(?:the|a|an|is|are|was|were|to|of|and|but|so|because|after|before|must|can)\b/i.test(context);
    if (!hasEnglishContext) warnings.push('ENGLISH_CONTEXT_SIGNAL_WEAK');
    if (!/[?？]$/.test(prompt)) errors.push('ENGLISH_PROMPT_INCOMPLETE');
  }

  if (Number(grade) >= 4 && prompt.length < 20 && context.length < 45) warnings.push('SURFACE_MAY_BE_TOO_SHALLOW');

  return {
    ok: errors.length === 0,
    gameId,
    grade: Number(grade || 0),
    questionKey: round?.questionKey || null,
    errors,
    warnings,
    surfaceLength: combined.length,
    optionCount: options.length,
    reasoningStepCount: steps,
    version: LIVE_OUTPUT_GATE_VERSION
  };
}

export function filterTrustedLiveRounds(rounds, context = {}) {
  const accepted = [];
  const rejected = [];
  for (const sourceRound of rounds || []) {
    const round = normalizeTrustedLiveRound(sourceRound, context);
    const audit = auditLiveOutputRound(round, context);
    if (audit.ok) accepted.push({ round: { ...round, liveOutputAudit: audit }, audit });
    else rejected.push({ round, audit });
  }
  return {
    rounds: accepted.map((row) => row.round),
    audit: {
      version: LIVE_OUTPUT_GATE_VERSION,
      attemptedCount: (rounds || []).length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      rejected: rejected.map(({ audit }) => audit)
    }
  };
}
