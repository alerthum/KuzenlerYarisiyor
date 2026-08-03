import { hashString, pick, seededRandom, shuffle } from '../utils.js';
import { V4_QUALITY_POLICY } from '../content-v4.js';
import { getV11QuestionIdentity } from './v11-question-identity.js';

function int(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function gradeOf(profile) {
  return Math.max(1, Math.min(12, Number(profile.grade || Math.max(1, profile.age - 5))));
}

function normalizeSeen(value) {
  return value instanceof Set ? value : new Set(value || []);
}

function splitEvidenceUnits(context) {
  const text = String(context || '').replace(/\s+/g, ' ').trim();
  if (!text) return [];
  const units = text
    .split(/(?<=[.!?])\s+|(?=\b(?:I{1,3}|IV)\.\s)/u)
    .map(item => item.trim())
    .filter(Boolean);
  return (units.length ? units : [text]).map((evidenceText, index) => ({
    evidenceId: `E${index + 1}`,
    text: evidenceText,
    sourceId: 'CONTEXT',
    order: index + 1
  }));
}

function requiredEvidenceLimit(requiredEvidenceCount, availableCount) {
  const numeric = Number(requiredEvidenceCount);
  if (Number.isFinite(numeric) && numeric > 0) return Math.min(numeric, availableCount);
  return availableCount;
}

function buildV11EvidenceMap(context, v11Identity) {
  const allEvidence = splitEvidenceUnits(context);
  const limit = requiredEvidenceLimit(v11Identity.requiredEvidenceCount, allEvidence.length);
  const selected = allEvidence.slice(0, Math.max(1, limit));
  return {
    schemaVersion: '11.0',
    sourceCount: Number(v11Identity.requiredSourceCount) || 1,
    requiredEvidenceCount: v11Identity.requiredEvidenceCount,
    evidenceUnits: selected,
    correctAnswerEvidenceIds: selected.map(item => item.evidenceId),
    coverageStatus: selected.length > 0 ? 'COMPLETE' : 'MISSING'
  };
}

function buildV11OptionDiagnostics(normalizedOptions, answerValue, v11Identity, evidenceMap) {
  const correct = String(answerValue);
  let distractorIndex = 0;
  return normalizedOptions.map((optionText, optionIndex) => {
    const isCorrect = optionText === correct;
    const misconception = isCorrect
      ? null
      : v11Identity.distractorMisconceptions[distractorIndex++] || 'Tanımlanmamış çeldirici yanılgısı';
    return {
      optionIndex,
      optionText,
      isCorrect,
      misconceptionId: isCorrect ? null : `${v11Identity.skeletonId}_M${distractorIndex}`,
      misconception,
      evidenceIds: isCorrect ? evidenceMap.correctAnswerEvidenceIds : [],
      diagnosticStatus: isCorrect ? 'SUPPORTED_CORRECT' : 'MISCONCEPTION_MAPPED'
    };
  });
}

function question({ familyId, minGrade, maxGrade, cognitiveDepth, role, context, prompt, options, answerValue, explanation, detailedOptions = null, hints = [], tags = [] }) {
  const normalized = options.map(String);
  if (new Set(normalized).size !== 4) throw new Error(`${familyId}: seçenekler benzersiz değil.`);
  if (!normalized.includes(String(answerValue))) throw new Error(`${familyId}: doğru cevap seçeneklerde değil.`);
  const readingLoad = String(context).length + String(prompt).length;
  const timeLimit = Math.max(95, Math.min(240, 55 + cognitiveDepth * 21 + Math.floor(readingLoad / 110) * 12));
  const v11Identity = getV11QuestionIdentity(familyId);
  if (!v11Identity) throw new Error(`${familyId}: V11 bilişsel kimliği tanımlı değil.`);
  const evidenceMap = buildV11EvidenceMap(context, v11Identity);
  const optionDiagnostics = buildV11OptionDiagnostics(normalized, answerValue, v11Identity, evidenceMap);
  return {
    familyId,
    v11Identity,
    skeletonId: v11Identity.skeletonId,
    skeletonFamilyId: v11Identity.skeletonFamilyId,
    evidenceMap,
    optionDiagnostics,
    misconceptionMap: optionDiagnostics.filter(item => !item.isCorrect),
    minGrade,
    maxGrade,
    cognitiveDepth,
    curriculumRole: role,
    qualityScore: Math.min(100, 55 + cognitiveDepth * 9),
    context,
    prompt,
    options: normalized,
    answerValue: String(answerValue),
    explanation,
    detailedOptions,
    hints,
    tags,
    timeLimit
  };
}

const people = ['Ada', 'Deniz', 'Ece', 'Mert', 'Lina', 'Arda', 'Nisa', 'Baran', 'Duru', 'Kerem', 'Elif', 'Can'];


const promptInstructions = [
  'Metindeki bütün kanıtları birlikte değerlendir.',
  'Kararını yalnız metinde verilen bilgilere dayandır.',
  'Seçenekleri metnin kapsamını aşmadan karşılaştır.',
  'Ana bilgi ile destekleyici ayrıntıları ayır.',
  'Metindeki ilişkileri adım adım incele.',
  'Kesin yargılarla ölçülü çıkarımları birbirinden ayır.',
  'Cevabını metindeki en güçlü kanıta göre belirle.',
  'Metnin bütünüyle uyuşan seçeneği bul.',
  'Her seçeneğin metin tarafından desteklenip desteklenmediğini denetle.',
  'Yalnız bir ayrıntıya değil, metnin tamamına odaklan.',
  'Metinde açıkça verilenlerle çıkarılabilecek olanları ayır.',
  'En savunulabilir seçeneği belirle.'
];

function applyInstructionVariant(candidate, random) {
  const instruction = pick(promptInstructions, random);
  return { ...candidate, prompt: `${instruction} ${candidate.prompt}` };
}
const paragraphFactories = [
  {
    id: 'controlled-experiment-evidence', minGrade: 3, maxGrade: 7, depth: 4,
    create(random, role) {
      const experiments = [
        { subject:'fasulye fideleri', variable:'ışık süresi', low:'günde 2 saat', high:'günde 8 saat', measure:'ortalama 4 cm', result:'ortalama 9 cm', inference:'Işık süresi, fidelerin büyümesini etkileyebilir.', false1:'Bütün bitkiler yalnız ışıkla büyür.', false2:'Uzun süre ışık alan her bitki kesinlikle 9 cm olur.', control:'su ve toprak miktarı' },
        { subject:'buz parçaları', variable:'ortam sıcaklığı', low:'serin odada', high:'güneş alan yerde', measure:'18 dakikada', result:'7 dakikada', inference:'Ortam sıcaklığı, buzun erime süresini etkileyebilir.', false1:'Buz yalnız güneşte erir.', false2:'Her buz parçası tam 7 dakikada erir.', control:'buz parçalarının büyüklüğü' },
        { subject:'oyuncak arabalar', variable:'rampa yüksekliği', low:'10 cm rampadan', high:'25 cm rampadan', measure:'80 cm', result:'145 cm', inference:'Rampa yüksekliği, arabanın aldığı yolu etkileyebilir.', false1:'Arabaların hızı yalnız renklerine bağlıdır.', false2:'Her araba kesinlikle 145 cm gider.', control:'araba ve zemin türü' },
        { subject:'kâğıt havlular', variable:'kat sayısı', low:'tek katlı', high:'üç katlı', measure:'12 mL', result:'28 mL', inference:'Kat sayısı, emilen su miktarını etkileyebilir.', false1:'Bütün kâğıtlar aynı miktarda su emer.', false2:'Üç katlı her ürün tam 28 mL emer.', control:'havlu büyüklüğü ve suya temas süresi' }
      ];
      const e = pick(experiments, random);
      return question({ familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${pick(people, random)} iki grup ${e.subject} üzerinde çalıştı. Birinci grup ${e.low} ${e.measure}; ikinci grup ${e.high} ${e.result} sonucunu verdi. ${e.control} iki grupta aynı tutuldu.`,
        prompt:'Bu çalışmadan çıkarılabilecek en güvenilir sonuç hangisidir?',
        options:shuffle([e.inference,e.false1,e.false2,`${e.variable} ile sonuç arasında hiçbir ilişki yoktur.`],random),answerValue:e.inference,
        explanation:`Yalnız ${e.variable} değiştirilmiş, ${e.control} sabit tutulmuştur. Bu nedenle ölçülü bir “etkileyebilir” sonucu kurulabilir.`,
        hints:['Değiştirilen tek koşulu bul.','“Kesinlikle, her zaman, bütün” gibi veriyi aşan sözlere dikkat et.'],tags:['kanıt','deney','çıkarım'] });
    }
  },
  {
    id:'event-sequence-reconstruction', minGrade:2, maxGrade:6, depth:3,
    create(random, role) {
      const flows = [
        ['tohumları saksılara yerleştirdi','her saksıya eşit su verdi','saksıları etiketledi'],
        ['kaynakları konu başlıklarına ayırdı','önemli bilgileri not etti','sunum slaytlarını hazırladı'],
        ['hamuru yoğurdu','şekil verdi','fırında pişirdi'],
        ['haritadaki başlangıç noktasını belirledi','rotayı çizdi','mesafeyi hesapladı'],
        ['kitapları türlerine ayırdı','yazar adına göre sıraladı','raflara etiket yapıştırdı'],
        ['malzemeleri ölçtü','deney düzeneğini kurdu','sonuçları tabloya yazdı']
      ];
      const f = pick(flows, random); const name=pick(people,random);
      const correct=`${f[0]} → ${f[1]} → ${f[2]}`;
      return question({ familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${name} önce ${f[0]}. Ardından ${f[1]}. Son olarak ${f[2]}.`,prompt:'İşlemlerin doğru sırası hangisidir?',
        options:shuffle([correct,`${f[2]} → ${f[0]} → ${f[1]}`,`${f[1]} → ${f[2]} → ${f[0]}`,`${f[0]} → ${f[2]} → ${f[1]}`],random),answerValue:correct,
        explanation:'“Önce, ardından ve son olarak” ifadeleri olayların sırasını açıkça belirtir.',hints:['Zaman bildiren kelimeleri işaretle.'],tags:['olay sırası'] });
    }
  },
  {
    id:'main-idea-from-support', minGrade:3, maxGrade:8, depth:4,
    create(random, role) {
      const themes = [
        {activity:'yabancı dil öğrenmek', details:'Her gün on dakika kelime tekrar etmek ve kısa cümleler kurmak, haftada bir kez uzun süre çalışmaktan daha kalıcı olabilir.', main:'Kısa fakat düzenli çalışmalar öğrenmeyi güçlendirebilir.', traps:['Başarı için yalnız doğuştan yetenek gerekir.','Uzun süre çalışmak her zaman zararlıdır.','Kelime öğrenmek gereksizdir.']},
        {activity:'bir müzik aleti çalmak', details:'İlk günlerde hatalar normaldir. Küçük bölümleri yavaşça tekrar eden öğrenciler zamanla parçanın tamamını daha rahat çalar.', main:'Sabırlı ve parçalı çalışma beceriyi geliştirir.', traps:['Hata yapan kişi çalışmayı bırakmalıdır.','Müzik yalnız hızlı çalındığında güzeldir.','İlk deneme her zaman kusursuz olmalıdır.']},
        {activity:'uzun bir problem çözmek', details:'Soruyu küçük adımlara ayırmak, verilenleri sınıflandırmak ve her adımı kontrol etmek karmaşıklığı azaltır.', main:'Karmaşık problemler planlı küçük adımlarla daha yönetilebilir olur.', traps:['Uzun sorularda bütün bilgiler gereksizdir.','En hızlı işlem her zaman doğru işlemdir.','Plan yapmak zaman kaybıdır.']},
        {activity:'bir spor dalında ilerlemek', details:'Isınma, temel hareketleri doğru yapmak ve düzenli antrenman, yalnız maç oynamaktan daha sağlam gelişim sağlar.', main:'Temel becerileri düzenli çalışmak kalıcı gelişim sağlar.', traps:['Yalnız yarışmalara katılmak yeterlidir.','Isınma çalışmaları gereksizdir.','Sporcular hiç hata yapmamalıdır.']}
      ]; const t=pick(themes,random);
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${t.activity[0].toLocaleUpperCase('tr-TR')+t.activity.slice(1)} isteyen biri için şu öneri veriliyor: ${t.details}`,
        prompt:'Parçanın ana düşüncesi hangisidir?',options:shuffle([t.main,...t.traps],random),answerValue:t.main,
        explanation:'Doğru seçenek metindeki bütün destekleyici cümleleri ortak bir düşüncede toplar.',hints:['Tek bir ayrıntıyı değil, bütün cümlelerin ortak mesajını ara.'],tags:['ana düşünce']});
    }
  },
  {
    id:'irrelevant-data-filter', minGrade:3, maxGrade:8, depth:4,
    create(random, role) {
      const topic = pick([
        {measure:'toplanan kâğıt miktarı', unit:'kg', months:['nisan','mayıs','haziran'], extra:'kulüp odasının kapısı yeşile boyandı'},
        {measure:'okunan kitap sayısı', unit:'kitap', months:['pazartesi','salı','çarşamba'], extra:'kütüphanecinin masasında mor bir kalem vardı'},
        {measure:'koşulan tur sayısı', unit:'tur', months:['birinci gün','ikinci gün','üçüncü gün'], extra:'parkın girişinde sarı çiçekler açmıştı'},
        {measure:'üretilen elektrik', unit:'birim', months:['sabah','öğle','akşam'], extra:'ölçüm cihazının kutusu maviydi'}
      ],random);
      const a=int(random,12,35), b=a+int(random,4,15), c=b+int(random,3,14);
      const values = `${topic.months[0]} ${a}, ${topic.months[1]} ${b}, ${topic.months[2]} ${c} ${topic.unit}`;
      const correct=topic.extra[0].toLocaleUpperCase('tr-TR')+topic.extra.slice(1);
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir grup üç dönemde ${topic.measure} değerini kaydetti: ${values}. Ayrıca ${topic.extra}.`,prompt:`${topic.measure[0].toLocaleUpperCase('tr-TR')+topic.measure.slice(1)} değişimini yorumlamak için hangi bilgi gereksizdir?`,
        options:shuffle([correct,`${topic.months[0]} ölçümü`,`${topic.months[1]} ölçümü`,`${topic.months[2]} ölçümü`],random),answerValue:correct,
        explanation:'Renk veya ortam ayrıntısı ölçülen değerin dönemlere göre değişimini açıklamaz.',hints:['Sorunun istediği değişkenle doğrudan ilişkisi olmayan bilgiyi seç.'],tags:['gereksiz bilgi']});
    }
  },
  {
    id:'text-data-integration-dynamic', minGrade:4, maxGrade:9, depth:5,
    create(random, role) {
      const contexts = [
        {thing:'ödünç alınan kitap', intervention:'salı günü kütüphanenin teneffüste de açık kalması', likely:'Ek açık kalma süresi salı günkü artışa katkı sağlamış olabilir.'},
        {thing:'bisiklet kullanan öğrenci', intervention:'çarşamba günü güvenli sürüş etkinliği yapılması', likely:'Etkinlik, çarşamba günkü kullanım artışına katkı sağlamış olabilir.'},
        {thing:'bilim kulübüne katılan öğrenci', intervention:'ikinci hafta tanıtım gösterisi yapılması', likely:'Tanıtım gösterisi ikinci haftadaki artışla ilişkili olabilir.'},
        {thing:'toplanan pil', intervention:'cuma günü okul genelinde duyuru yapılması', likely:'Duyuru cuma günkü toplama miktarını artırmış olabilir.'}
      ]; const t=pick(contexts,random);
      const a=int(random,12,30), b=a+int(random,5,16), c=Math.max(1,b-int(random,1,5));
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Üç ölçümde ${t.thing} sayıları sırasıyla ${a}, ${b} ve ${c} oldu. Aynı dönemde ${t.intervention} gerçekleşti.`,prompt:'Veriler ve açıklama birlikte düşünüldüğünde en dikkatli yorum hangisidir?',
        options:shuffle([t.likely,'Değişimin tek nedeni kesinlikle bu etkinliktir.','İlk ölçüm en yüksek değerdir.','Açıklanan olayın sonuçla hiçbir ilişkisi olamaz.'],random),answerValue:t.likely,
        explanation:'Veri ile aynı dönemde gerçekleşen olay arasında olası bir ilişki kurulabilir; ancak tek neden olduğu kesin söylenemez.',hints:['“Olabilir” ile “kesinlikle” arasındaki farkı düşün.'],tags:['veri yorumlama','ölçülü çıkarım']});
    }
  },
  {
    id:'claim-evidence-dynamic', minGrade:5, maxGrade:12, depth:5,
    create(random, role) {
      const claims=[
        {claim:'Aralıklı tekrar, aynı toplam sürede yapılan tek parça çalışmadan daha kalıcı olabilir.',evidence:'Aynı toplam süre çalışan iki gruptan aralıklı çalışan grup bir hafta sonra daha fazla bilgiyi hatırladı.',traps:['Aralıklı çalışanlar daha çok kalem kullandı.','Grupların sınıfları farklı renge boyandı.','Bazı öğrenciler ders sonrası spor yaptı.']},
        {claim:'Telefonu çalışma masasından uzaklaştırmak dikkati artırabilir.',evidence:'Aynı metni okuyan iki gruptan telefonu başka odada bırakan grup dikkat testinde daha yüksek sonuç aldı.',traps:['Telefonların kılıfları farklı renkteydi.','Bir grubun sıraları pencereye yakındı.','Öğrenciler farklı marka kalem kullandı.']},
        {claim:'Güvenli bisiklet yolu, kısa mesafede bisiklet kullanımını artırabilir.',evidence:'Benzer iki bölgede yol yapıldıktan sonra bisiklet sayısı artarken yol yapılmayan bölgede belirgin değişim olmadı.',traps:['Bölgelerdeki binaların renkleri farklıydı.','Bazı bisikletlerde zil bulunuyordu.','Yol kenarında farklı ağaç türleri vardı.']},
        {claim:'Çözümden önce plan kurmak çok adımlı problemlerde hatayı azaltabilir.',evidence:'Benzer düzeydeki iki gruptan çözüm planı yazan grup daha az işlem hatası yaptı.',traps:['Plan yazan grup mavi kâğıt kullandı.','Sorular farklı yazı tipindeydi.','Sınıfta üç pencere vardı.']}
      ]; const c=pick(claims,random);
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`İddia: “${c.claim}”`,prompt:'Bu iddiayı en doğrudan destekleyen bulgu hangisidir?',options:shuffle([c.evidence,...c.traps],random),answerValue:c.evidence,
        explanation:'Doğru bulgu, iddiadaki değişkenleri karşılaştırır ve iddia edilen sonucu doğrudan ölçer.',hints:['İddiayı oluşturan iki ana değişkeni bul.'],tags:['iddia-kanıt']});
    }
  },
  {
    id:'argument-weakness-dynamic', minGrade:6, maxGrade:12, depth:5,
    create(random, role) {
      const examples=[
        {statement:'Bu yöntemi kullanan iki arkadaşım yüksek not aldı; yöntemi kullanan herkes yüksek not alır.',weakness:'Çok küçük bir örnekten bütün kullanıcılar için genelleme yapılması.'},
        {statement:'Geçen hafta yağmur yağdıktan sonra takımımız kazandı; demek ki yağmur her zaman galibiyet getirir.',weakness:'Aynı zamanda gerçekleşen iki olay arasında kanıtsız neden-sonuç kurulması.'},
        {statement:'Bu kitap en çok satanlar listesinde; o hâlde her okuyucu için en yararlı kitaptır.',weakness:'Popülerliğin herkes için yarar anlamına geldiğinin varsayılması.'},
        {statement:'Bir öğrenci sabah çalışıp başarılı oldu; bütün öğrenciler yalnız sabah çalışmalıdır.',weakness:'Tek bir kişinin deneyiminin herkes için geçerli sayılması.'}
      ]; const e=pick(examples,random);
      const wrong=['Cümlede bir örnek verilmesi.','Konu hakkında görüş bildirilmesi.','Sonucun kısa bir cümleyle yazılması.'];
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,context:`Bir kişi şöyle diyor: “${e.statement}”`,prompt:'Bu akıl yürütmenin temel zayıflığı hangisidir?',options:shuffle([e.weakness,...wrong],random),answerValue:e.weakness,
        explanation:'Doğru seçenek, iddiayı güvenilmez yapan mantık sıçramasını açıklar.',hints:['Örnek sayısına, “herkes/her zaman” gibi genellemelere ve neden-sonuç kanıtına bak.'],tags:['argüman analizi']});
    }
  },
  {
    id:'multiple-source-synthesis-dynamic', minGrade:6, maxGrade:12, depth:5,
    create(random, role) {
      const change=int(random,6,18);
      const topics=[
        {outcome:'şehir merkezindeki araç sayısı',action:'toplu taşıma seferleri artırıldı',other:'aynı dönemde akaryakıt fiyatları yükseldi',neutral:'bisiklet yolu uzunluğu değişmedi'},
        {outcome:'tek kullanımlık bardak tüketimi',action:'yeniden kullanılabilir bardak indirimi başlatıldı',other:'aynı dönemde içecek fiyatları yükseldi',neutral:'kantinin çalışma saati değişmedi'},
        {outcome:'kütüphanedeki ziyaretçi sayısı',action:'çalışma saatleri uzatıldı',other:'aynı dönemde sınav haftası başladı',neutral:'kitap raflarının rengi değişmedi'},
        {outcome:'parkta yürüyüş yapan kişi sayısı',action:'aydınlatma güçlendirildi',other:'aynı dönemde hava sıcaklığı arttı',neutral:'parkın adı değişmedi'}
      ]; const t=pick(topics,random);
      const correct=`${t.action[0].toLocaleUpperCase('tr-TR')+t.action.slice(1)} etkili olmuş olabilir; ancak “${t.other}” bilgisinin etkisi de ayrıştırılmalıdır.`;
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Kaynak 1: ${t.action}; ardından ${t.outcome} %${change} değişti. Kaynak 2: ${t.other}. Kaynak 3: ${t.neutral}.`,prompt:'Değişimi yorumlarken en dikkatli sonuç hangisidir?',
        options:shuffle([correct,`Değişimin tek nedeni kesinlikle ${t.neutral}.`,`İkinci kaynaktaki değişkenin hiçbir etkisi olamaz.`,`Veriler ${t.outcome} hakkında hiçbir şey söylemez.`],random),answerValue:correct,
        explanation:'Aynı dönemde birden fazla etken değiştiğinde tek nedene kesin bağ kurmak için ek karşılaştırma gerekir.',hints:['Aynı anda değişen bütün etkenleri işaretle.'],tags:['çoklu kaynak','nedensellik']});
    }
  },
  {
    id:'multi-condition-reading-dynamic', minGrade:4, maxGrade:10, depth:5,
    create(random, role) {
      const maxTime=int(random,7,12);
      const candidates=[
        {name:'A',time:maxTime-1,source:true,visual:false},
        {name:'B',time:maxTime+1,source:true,visual:true},
        {name:'C',time:maxTime,source:true,visual:true},
        {name:'D',time:maxTime-2,source:false,visual:true}
      ];
      const lines=candidates.map(c=>`${c.name}: ${c.time} dakika, ${c.source?'kaynakçalı':'kaynakçasız'}, ${c.visual?'görsel verili':'görsel verisiz'}`).join('; ');
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir sunumun kabulü için kaynakça içermesi, ${maxTime} dakikayı aşmaması ve en az bir görsel veri kullanması gerekir. ${lines}.`,prompt:'Hangi sunum bütün koşulları sağlar?',
        options:shuffle(['Yalnız C','A ve C','Yalnız B','C ve D'],random),answerValue:'Yalnız C',
        explanation:`A görsel koşulunu, B süre koşulunu, D kaynakça koşulunu karşılamaz. C üç koşulu da sağlar.`,hints:['Her aday için üç koşulu ayrı ayrı işaretle.'],tags:['çoklu koşul','eleme']});
    }
  },
  {
    id:'media-source-check-dynamic', minGrade:6, maxGrade:12, depth:5,
    create(random, role) {
      const claims=[
        'Bu yöntem başarıyı kesin olarak iki katına çıkarır.',
        'Bu besin bütün hastalıkları önler.',
        'Bu uygulama hafızayı bir haftada kusursuz yapar.',
        'Bu çalışma yöntemi herkes için tek doğru yoldur.'
      ]; const claim=pick(claims,random);
      const sourceIssue=pick(['uzman adı, araştırma bağlantısı, örneklem büyüklüğü ve tarih vermiyor','yalnızca isimsiz bir görsel paylaşıyor ve yöntem açıklamıyor','kaynağın kim olduğunu ve verinin nasıl toplandığını belirtmiyor'],random);
      const correct='İddianın dayandığı özgün araştırmayı, yöntemi ve kaynağı aramak.';
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir paylaşım “${claim}” diyor; ancak ${sourceIssue}.`,prompt:'Paylaşımın güvenilirliğini değerlendirmek için ilk yapılması gereken hangisidir?',
        options:shuffle([correct,'Beğeni sayısı yüksekse doğru kabul etmek.','Başlığın büyük harfle yazılmasına bakmak.','En kısa yorumu kanıt saymak.'],random),answerValue:correct,
        explanation:'Doğrulanabilir kaynak, yöntem, tarih ve örneklem bilgisi bulunmadan kesinlik iddiası güvenilir kabul edilmez.',hints:['İddianın izlenebilir bir kaynağı var mı?'],tags:['medya okuryazarlığı']});
    }
  },
  {
    id:'generalization-trap-dynamic', minGrade:5, maxGrade:11, depth:5,
    create(random, role) {
      const texts=[
        {text:'Bazı şehirlerde güvenli yollar ve uygun hava olduğunda bisiklet kullanımı artmıştır.',over:'Güvenli yol bulunan bütün şehirlerde herkes bisiklet kullanır.',safe1:'Bazı şehirlerde uygun koşullarda kullanım artabilir.',safe2:'Hava koşulları kullanım tercihini etkileyebilir.',safe3:'Güvenli yollar artışla ilişkili olabilir.'},
        {text:'Araştırmaya katılan öğrencilerin bir bölümünde kısa molalar dikkatin korunmasına yardımcı olmuştur.',over:'Kısa mola veren bütün öğrenciler her sınavda tam puan alır.',safe1:'Bazı öğrencilerde kısa molalar yararlı olabilir.',safe2:'Molanın etkisi kişiye ve göreve göre değişebilir.',safe3:'Araştırma dikkatle ilgili bir ilişki göstermiştir.'},
        {text:'İncelenen dört parkta ağaç gölgesi bulunan alanlarda yazın daha fazla ziyaretçi gözlenmiştir.',over:'Ağaç bulunan her yerde yıl boyunca bütün insanlar parka gider.',safe1:'İncelenen parklarda gölge yaz ziyaretleriyle ilişkili olabilir.',safe2:'Sonuç incelenen parklarla sınırlıdır.',safe3:'Mevsim koşulları ziyaret sayısını etkileyebilir.'}
      ]; const t=pick(texts,random);
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,context:`Metin: “${t.text}”`,prompt:'Hangi seçenek metindeki bilgiyi aşan bir genellemedir?',options:shuffle([t.over,t.safe1,t.safe2,t.safe3],random),answerValue:t.over,
        explanation:'“Bazı, incelenen, olabilir” gibi sınırlı ifadeler “bütün, herkes, her zaman” biçiminde evrensel sonuca dönüştürülemez.',hints:['Kapsamı büyüten kesinlik kelimelerini bul.'],tags:['çeldirici analizi','genelleme']});
    }
  },
  {
    id:'paragraph-coherence-dynamic', minGrade:5, maxGrade:11, depth:5,
    create(random, role) {
      const sets=[
        ['Uzun problemler, her cümlesi işlemde kullanılacakmış gibi görünebilir.','Oysa bazı bilgiler yalnızca dikkat dağıtmak amacıyla verilmiştir.','Bu yüzden çözümden önce gerekli bilgileri belirlemek önemlidir.','Gereksiz bilgiyi elemek işlem yükünü azaltır.'],
        ['Bir iddianın ikna edici görünmesi onun doğru olduğunu göstermez.','Önce iddianın dayandığı kanıtın kaynağı incelenmelidir.','Ardından yöntemin başka açıklamaları dışlayıp dışlamadığı sorgulanmalıdır.','Böylece ilk izlenim yerine kanıta dayalı karar verilebilir.'],
        ['Yeni bir kelimeyi yalnızca ezberlemek kısa süreli olabilir.','Kelimeyi farklı cümlelerde kullanmak anlam bağlantılarını artırır.','Daha sonra belirli aralıklarla tekrar etmek hatırlamayı güçlendirir.','Bu yöntem kelimenin aktif biçimde kullanılmasını kolaylaştırır.']
      ]; const s=pick(sets,random); const correct='I – II – III – IV';
      const context=`I. ${s[0]} II. ${s[1]} III. ${s[2]} IV. ${s[3]}`;
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,context,prompt:'Cümlelerin anlamlı paragraf sırası hangisidir?',options:shuffle([correct,'II – I – IV – III','III – II – I – IV','I – III – II – IV'],random),answerValue:correct,
        explanation:'Cümleler konuyu tanıtma, karşılaştırma/uygulama, sonuç ve genel yarar ilişkisiyle ilerler.',hints:['Bağlaçları ve önceki cümleye gönderme yapan kelimeleri izle.'],tags:['paragraf akışı']});
    }
  },
  {
    id:'best-title-dynamic', minGrade:2, maxGrade:7, depth:3,
    create(random, role) {
      const texts=[
        {body:'Bir tohum önce su alır, kabuğu açılır, küçük bir kök çıkarır. Daha sonra ışığa doğru uzanan filiz oluşur.',title:'Tohumdan Filize Adım Adım',traps:['Ormandaki En Büyük Ağaç','Toprağın Renkleri','Yağmursuz Bir Gün']},
        {body:'Ay, Dünya çevresinde dolanırken Güneş’ten aldığı ışığın farklı bölümleri görünür. Bu nedenle Ay’ın şekli değişiyormuş gibi algılanır.',title:'Ay’ın Evreleri Nasıl Oluşur?',traps:['Güneş’in İç Yapısı','Dünya’daki En Uzun Gün','Yıldızların Renkleri']},
        {body:'Bir kitabı seçerken yalnız kapağa bakmak yeterli değildir. Konusu, yaş düzeyi ve okuyucunun ilgisi birlikte düşünülmelidir.',title:'Doğru Kitabı Seçmek',traps:['Kapak Tasarımının Tarihi','En Uzun Romanlar','Kütüphane Duvarları']},
        {body:'Bir problemi çözerken küçük örnekler denemek, değişmeyen özelliği fark etmeyi ve genel kuralı bulmayı kolaylaştırabilir.',title:'Küçük Örnekten Genel Kurala',traps:['Hızlı Yazmanın Yolları','Sayıların Renkleri','Soruları Atlamak']}
      ]; const t=pick(texts,random);
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,context:t.body,prompt:'Metne en uygun başlık hangisidir?',options:shuffle([t.title,...t.traps],random),answerValue:t.title,
        explanation:'Başlık metnin yalnız bir ayrıntısını değil, ana konusunu ve yönünü kapsar.',hints:['Metinde en çok tekrarlanan ilişkiyi tek cümlede özetle.'],tags:['başlık']});
    }
  },
  {
    id:'implicit-inference-dynamic', minGrade:5, maxGrade:12, depth:5,
    create(random, role) {
      const studies=[
        {setup:'Bir grup çalışma sırasında telefonunu başka odada bıraktı, diğer grup telefonu masada tuttu. İki grup aynı metni aynı sürede okudu.',result:'Telefonu uzakta tutan grup sorularda daha yüksek başarı gösterdi.',answer:'Telefonun görünür olması dikkati olumsuz etkileyebilir.',traps:['Telefon kullanan herkes başarısız olur.','Başarıyı yalnız telefon belirler.','İlk grup doğuştan daha zekidir.']},
        {setup:'Benzer iki sınıftan biri yeni konuyu küçük örneklerle, diğeri yalnız tanımı okuyarak çalıştı.',result:'Küçük örnek kullanan sınıf yeni sorulara daha doğru genelleme yaptı.',answer:'Küçük örnekler kuralı keşfetmeye yardımcı olabilir.',traps:['Tanım okumak her zaman zararlıdır.','Bütün öğrenciler aynı yöntemle öğrenir.','Örnek kullanan sınıfın bütün cevapları kesinlikle doğrudur.']},
        {setup:'İki takım aynı antrenman süresini kullandı. Bir takım çalışmayı kısa aralıklara böldü, diğeri tek parça çalıştı.',result:'Aralıklı çalışan takım bir hafta sonra hareketleri daha doğru hatırladı.',answer:'Aralıklı çalışma kalıcılığı destekleyebilir.',traps:['Tek parça çalışma hiçbir zaman işe yaramaz.','Süre dışında hiçbir etken önemli değildir.','Aralıklı çalışan herkes yarışmayı kazanır.']}
      ]; const s=pick(studies,random);
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,context:`${s.setup} ${s.result}`,prompt:'Bu çalışmaya dayanarak hangi sonuca ulaşılabilir?',options:shuffle([s.answer,...s.traps],random),answerValue:s.answer,
        explanation:'Doğru çıkarım verinin kapsamını aşmaz ve “olabilir/destekleyebilir” biçiminde ölçülü kurulur.',hints:['Kesin genellemeleri ele; doğrudan ölçülmeyen özellikleri çıkar.'],tags:['örtük çıkarım']});
    }
  },
  {
    id:'author-purpose-dynamic', minGrade:3, maxGrade:8, depth:4,
    create(random, role) {
      const pieces=[
        {text:'Diş fırçalarken musluğu kapatmak her gün birçok litre suyun boşa akmasını önler. Küçük bir alışkanlık yıl boyunca büyük tasarruf sağlar.',answer:'Su tasarrufu davranışına yönlendirmek'},
        {text:'Çevrim içi bir bilgiyi paylaşmadan önce kaynağını ve tarihini kontrol et. Eski veya kaynaksız bilgiler yanlış karar vermene yol açabilir.',answer:'Bilgiyi doğrulama konusunda okuyucuyu uyarmak'},
        {text:'Yaya geçidine yaklaşırken hızını azalt ve iki yönü de kontrol et. Birkaç saniyelik dikkat ciddi kazaları önleyebilir.',answer:'Güvenli davranışa teşvik etmek'},
        {text:'Kısa bir çalışma planı yap, zor görevleri küçük parçalara ayır ve tamamladığın adımları işaretle. Böylece ne kadar ilerlediğini görürsün.',answer:'Planlı çalışma yöntemi önermek'}
      ]; const p=pick(pieces,random);
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,context:`“${p.text}”`,prompt:'Yazarın bu metni yazma amacı nedir?',options:shuffle([p.answer,'Bir masal kahramanını tanıtmak','Bir nesnenin tarihini kronolojik anlatmak','Yalnızca ortamı betimlemek'],random),answerValue:p.answer,
        explanation:'Metin bilgi vermenin yanında okuyucuyu belirli ve yararlı bir davranışa yönlendirir.',hints:['Metin okuyucudan ne yapmasını bekliyor?'],tags:['yazarın amacı']});
    }
  },
  {
    id:'contradiction-detection-dynamic', minGrade:3, maxGrade:8, depth:4,
    create(random, role) {
      const pairs=[
        ['Müze pazartesi kapalıdır.','Sınıf müzeyi pazartesi sabahı ziyaret edecektir.'],
        ['Yarışmaya yalnız 12 yaşından küçükler katılabilir.','Listeye 14 yaşındaki bir öğrenci yarışmacı olarak eklenmiştir.'],
        ['Deneyde bütün saksılara eşit su verilecektir.','İkinci saksıya diğerlerinin iki katı su verilmiştir.'],
        ['Toplantı saat 15.00’te sona erecektir.','Sunum programı 15.30’da başlayacaktır ve toplantının içindedir.']
      ]; const p=pick(pairs,random); const correct='İki bilgi aynı anda doğru olamayacak biçimde çelişmektedir.';
      return question({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,context:`Plan notları: “${p[0]}” ve “${p[1]}”`,prompt:'Notlardaki temel sorun hangisidir?',options:shuffle([correct,'İkinci bilgi birinciyi ayrıntılandırmaktadır.','İki bilgi arasında hiçbir ilişki yoktur.','Sorun yalnız yazım biçimindedir.'],random),answerValue:correct,
        explanation:'Koşullardan biri doğruysa diğeri gerçekleşemez; planın düzeltilmesi gerekir.',hints:['İki cümlenin aynı anda gerçekleşip gerçekleşemeyeceğini sor.'],tags:['çelişki']});
    }
  }
];

function signature(q) {
  return `paragraph-detective:${q.familyId}:${hashString(`${q.context}|${q.prompt}|${q.answerValue}`).toString(36)}`;
}

function rolePlan(grade, count) {
  const review = grade > 1 ? Math.max(1, Math.round(count * V4_QUALITY_POLICY.curriculumMix.review)) : 0;
  const preview = grade < 12 ? Math.max(1, Math.round(count * V4_QUALITY_POLICY.curriculumMix.preview)) : 0;
  const current = Math.max(0, count - review - preview);
  return shuffle([
    ...Array(review).fill({ role:'review', targetGrade:Math.max(1,grade-1) }),
    ...Array(current).fill({ role:'current', targetGrade:grade }),
    ...Array(preview).fill({ role:'preview', targetGrade:Math.min(12,grade+1) })
  ], seededRandom(hashString(`paragraph-role|${grade}|${count}`)));
}

export function createDynamicParagraphSession(profile, seed, count = 8, options = {}) {
  const grade=gradeOf(profile);
  const seen=normalizeSeen(options.seenQuestionKeys);
  const recent=new Set(options.recentFamilyIds || []);
  const usedFamilies=new Set();
  const output=[];
  const plan=rolePlan(grade,count);

  for (let index=0; index<plan.length; index+=1) {
    const {role,targetGrade}=plan[index];
    const eligible=paragraphFactories.filter(f=>!usedFamilies.has(f.id)&&f.minGrade<=targetGrade&&f.maxGrade>=targetGrade);
    const fallback=paragraphFactories.filter(f=>!usedFamilies.has(f.id)&&f.minGrade<=grade+1&&f.maxGrade>=Math.max(1,grade-1));
    const ordered=shuffle(eligible.length?eligible:fallback, seededRandom(hashString(`${seed}|paragraph-family|${index}`)))
      .sort((a,b)=>Number(recent.has(a.id))-Number(recent.has(b.id)) || b.depth-a.depth);
    let selected=null;
    for (const factory of ordered) {
      for (let attempt=0; attempt<160; attempt+=1) {
        const random=seededRandom(hashString(`${profile.id}|${seed}|${index}|${factory.id}|${attempt}`));
        const candidate=applyInstructionVariant(factory.create(random,role), random);
        const key=signature(candidate);
        if(seen.has(key)) continue;
        candidate.questionKey=key;
        candidate.targetGrade=targetGrade;
        selected=candidate;
        break;
      }
      if(selected) break;
    }
    if(selected){ output.push(selected); usedFamilies.add(selected.familyId); }
  }
  return output;
}

export function paragraphFamilyStats(){
  return { dynamicFamilies:paragraphFactories.length };
}
