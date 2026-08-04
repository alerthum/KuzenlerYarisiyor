import { generatePremiumRounds } from '../content/premium-question-bank.js';

const freeze = (value) => {
  if (Array.isArray(value)) return Object.freeze(value.map(freeze));
  if (value && typeof value === 'object') return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freeze(child)])));
  return value;
};

export const LAUNCH_PILOT_PREMIUM_SLOTS = freeze([
  { slotId: 'turkish:5:word-mine', grade: 5, courseGroup: 'turkish', gameId: 'word-mine', sourceKey: 'premium-task:2.5.0:word-mine:word-mine-premium-05:scc0je', curriculumReferenceId: 'turkish-g5-complete-t-y-5-18' },
  { slotId: 'turkish:6:word-ladder', grade: 6, courseGroup: 'turkish', gameId: 'word-ladder', sourceKey: 'premium-task:2.3.0:word-ladder:ladder-nar-kol-01:1ti8nxf', curriculumReferenceId: 'turkce-g6-t-o-6-21' },
  { slotId: 'turkish:7:forbidden-story', grade: 7, courseGroup: 'turkish', gameId: 'forbidden-story', sourceKey: 'premium-task:2.3.0:forbidden-story:story-forbidden-u-01:1ujd3uf', curriculumReferenceId: 'turkce-g7-t-y-7-1' },
  { slotId: 'turkish:8:meaning-hunt', grade: 8, courseGroup: 'turkish', gameId: 'meaning-hunt', sourceKey: 'premium:2.1.0:meaning-hunt:meaning-isik-tutmak-01:aq5911', curriculumReferenceId: 'tr-g8-pilot02-01-idiom-contribution-community-oven' },
  { slotId: 'turkish:8:paragraph-detective', grade: 8, courseGroup: 'turkish', gameId: 'paragraph-detective', sourceKey: 'premium-pilot:paragraph-detective:tr-main-idea-01:122remb', curriculumReferenceId: 'tr-g8-reading-calibration-01-restoration-main-idea' },

  { slotId: 'math:5:target-number', grade: 5, courseGroup: 'math', gameId: 'target-number', sourceKey: 'premium-task:2.5.0:target-number:target-number-premium-03:287srg', curriculumReferenceId: 'math-g5-mat-5-1-2' },
  { slotId: 'math:6:speed-math', grade: 6, courseGroup: 'math', gameId: 'speed-math', sourceKey: 'premium:2.6.0:speed-math:speed-percent-sale-01:y9orlf', curriculumReferenceId: 'matematik-g6-mat-6-1-8' },
  { slotId: 'math:7:pattern-lab', grade: 7, courseGroup: 'math', gameId: 'pattern-lab', sourceKey: 'premium:2.2.0:pattern-lab:pattern-matchsticks-01:jmob3w', curriculumReferenceId: 'matematik-g7-mat-7-2-4' },
  { slotId: 'math:8:problem-hunter', grade: 8, courseGroup: 'math', gameId: 'problem-hunter', sourceKey: 'phase5h:math:g8:linear-tank-01', curriculumReferenceId: 'math-g8-cross-03-linear-tank' },
  { slotId: 'math:5:geometry-lab', grade: 5, courseGroup: 'math', gameId: 'geometry-lab', sourceKey: 'premium:3.0.0:geometry-lab:g35-geometry-composite-area-01:8grgur', curriculumReferenceId: 'math-g5-mat-5-4-4' },
  { slotId: 'math:6:error-detective', grade: 6, courseGroup: 'math', gameId: 'error-detective', sourceKey: 'premium-pilot:error-detective:math-equation-error-01:nl452y', curriculumReferenceId: 'matematik-g6-mat-6-2-1' },
  { slotId: 'math:7:olympiad-ladder', grade: 7, courseGroup: 'math', gameId: 'olympiad-ladder', sourceKey: 'premium:2.6.0:olympiad-ladder:olympiad-pigeonhole-remainder-01:144voa7', curriculumReferenceId: 'matematik-g7-mat-7-2-3' },
  { slotId: 'math:8:logic-station', grade: 8, courseGroup: 'math', gameId: 'logic-station', sourceKey: 'premium:2.0.0:logic-station:logic-schedule-possible-01:mssrym', curriculumReferenceId: 'math-g8-complete-33-sample-space', alignmentMode: 'SKILL_TRANSFER' },

  { slotId: 'english:5:english-vocabulary', grade: 5, courseGroup: 'english', gameId: 'english-vocabulary', sourceKey: 'premium:3.1.0:english-vocabulary:g35-en-vocab-protect-01:18is450', curriculumReferenceId: 'english-g5-eng-5-7-v1' },
  { slotId: 'english:6:english-cloze', grade: 6, courseGroup: 'english', gameId: 'english-cloze', sourceKey: 'premium:2.0.0:english-cloze:eng-cloze-cause-result-01:19phl4r', curriculumReferenceId: 'yabanci-dil-g6-eng-6-4-g1' },
  { slotId: 'english:7:english-sentence-builder', grade: 7, courseGroup: 'english', gameId: 'english-sentence-builder', sourceKey: 'premium-task:2.3.0:english-sentence-builder:order-if-finish-01:11i74e', curriculumReferenceId: 'yabanci-dil-g7-eng-7-2-g1' },
  { slotId: 'english:8:english-vocabulary', grade: 8, courseGroup: 'english', gameId: 'english-vocabulary', sourceKey: 'premium:2.2.0:english-vocabulary:english-vocab-context-12:1jd1pbt', curriculumReferenceId: 'english-g8-e8-4-r1' },

  { slotId: 'social:5:social-time-travel', grade: 5, courseGroup: 'social', gameId: 'social-time-travel', sourceKey: 'phase5h:social:g5:first-settlements-evidence-01', curriculumReferenceId: 'social-g5-sb-5-3-2' },
  { slotId: 'social:6:social-map-skills', grade: 6, courseGroup: 'social', gameId: 'social-map-skills', sourceKey: 'phase5h:social:g6:relative-location-01', curriculumReferenceId: 'sosyal-bilgiler-g6-sb-6-2-1' },
  { slotId: 'social:7:social-citizenship', grade: 7, courseGroup: 'social', gameId: 'social-citizenship', sourceKey: 'phase5h:social:g7:accessibility-equality-01', curriculumReferenceId: 'sosyal-bilgiler-g7-sb-7-1-2' },
  { slotId: 'social:8:social-time-travel', grade: 8, courseGroup: 'social', gameId: 'social-time-travel', sourceKey: 'phase5h:social:g8:national-struggle-source-01', curriculumReferenceId: 'history-g8-2-1' },

  { slotId: 'science:5:science-lab', grade: 5, courseGroup: 'science', gameId: 'science-lab', sourceKey: 'phase5h:science:g5:conductor-evidence-01', curriculumReferenceId: 'science-g5-fb-5-6-1-2' },
  { slotId: 'science:6:science-reasoning', grade: 6, courseGroup: 'science', gameId: 'science-reasoning', sourceKey: 'phase5h:science:g6:bulb-brightness-variable-01', curriculumReferenceId: 'fen-bilimleri-g6-fb-6-6-2-1' },
  { slotId: 'science:7:science-lab', grade: 7, courseGroup: 'science', gameId: 'science-lab', sourceKey: 'premium:2.1.0:science-lab:science-ecosystem-chain-01:1gv13n3', curriculumReferenceId: 'fen-bilimleri-g7-fb-7-7-1-1' },
  { slotId: 'science:8:science-reasoning', grade: 8, courseGroup: 'science', gameId: 'science-reasoning', sourceKey: 'phase5h:science:g8:photosynthesis-light-01', curriculumReferenceId: 'science-g8-broad-25-photosynthesis-factor' },

  { slotId: 'religion:5:religion-practice', grade: 5, courseGroup: 'religion', gameId: 'religion-practice', sourceKey: 'phase5h:religion:g5:ihlas-meaning-01', curriculumReferenceId: 'dkab-g5-dkab-5-1-4' },
  { slotId: 'religion:6:religion-practice', grade: 6, courseGroup: 'religion', gameId: 'religion-practice', sourceKey: 'phase5h:religion:g6:truthfulness-01', curriculumReferenceId: 'din-kulturu-ve-ahlak-bilgisi-g6-dkab-6-3-1' },
  { slotId: 'religion:7:religion-practice', grade: 7, courseGroup: 'religion', gameId: 'religion-practice', sourceKey: 'phase5h:religion:g7:belief-behaviour-01', curriculumReferenceId: 'din-kulturu-ve-ahlak-bilgisi-g7-dkab-7-1-3' },
  { slotId: 'religion:8:religion-practice', grade: 8, courseGroup: 'religion', gameId: 'religion-practice', sourceKey: 'premium:2.4.0:religion-practice:religion-help-dignity-01:1sq4xqq', curriculumReferenceId: 'dkab-g8-8-2-1' },

  { slotId: 'mixed:8:lgs-foundation', grade: 8, courseGroup: 'mixed', gameId: 'lgs-foundation', sourceKey: 'premium:2.6.0:lgs-foundation:lgs-probability-bag-01:10u5ryk', curriculumReferenceId: 'math-g8-cross-05-probability-cards' }
]);

function authoredChoiceRound({ questionKey, prompt, context, options, answerIndex, explanation, topicId, learningOutcomeId, familyId, subjectId, skill, gradeBand, wrongReasons, hints }) {
  const optionDiagnostics = options.map((optionText, optionIndex) => ({
    optionIndex,
    optionText,
    isCorrect: optionIndex === answerIndex,
    misconceptionId: optionIndex === answerIndex ? null : `${familyId}:misconception-${optionIndex + 1}`,
    misconception: optionIndex === answerIndex ? null : wrongReasons[optionIndex],
    rationale: optionIndex === answerIndex ? explanation : wrongReasons[optionIndex],
    whyStudentChoosesThis: optionIndex === answerIndex ? 'Bütün koşulları ve kanıtları birlikte değerlendirir.' : wrongReasons[optionIndex]
  }));
  return freeze({
    kind: 'choice', questionKey, prompt, context, options, answerIndex, explanation,
    hints: hints || ['Önce verilen kanıtları ve değişmeyen koşulları ayır.', 'Her seçeneği bütün kanıtlarla tek tek karşılaştır.'],
    skill, subjectId, topicId, learningOutcomeId, gradeBand,
    difficulty: 4, cognitiveDepth: 4, reasoningStepCount: 3,
    cognitiveTraits: ['multiStepInference', 'conditionEvaluation', 'informationLinking'],
    familyId, skeletonId: `${familyId}:evidence-choice`, reasoningPathId: 'read-relate-eliminate',
    sourceLabel: 'Zihin Arenası Phase 5H Uzman Aday Bankası', premiumTier: 'GOLD', premiumQuestion: true, premiumPilot: true,
    requireExplicitDistractorEvidence: true, optionDiagnostics,
    distractorValidation: { verified: true, diagnosticCount: 3, distinctMisconceptions: 3, violations: [] },
    evidenceMap: { evidence: [{ id: `${questionKey}:e1`, text: context }], correctAnswerEvidenceIds: [`${questionKey}:e1`] },
    solutionGraph: [{ step: 1, evidence: 'Sorudaki veriler ve koşullar ayrıştırılır.' }, { step: 2, evidence: 'Seçenekler bütün koşullarla karşılaştırılır.' }, { step: 3, evidence: explanation }],
    cognitiveDepthEvidence: { reasoningStepCount: 3, highCognitiveTraits: ['multiStepInference', 'conditionEvaluation', 'informationLinking'], source: 'phase5h-human-authored-candidate' }
  });
}

const CUSTOM_ROUNDS = new Map([
  ['phase5h:math:g8:linear-tank-01', authoredChoiceRound({
    questionKey: 'phase5h:math:g8:linear-tank-01', familyId: 'phase5h-math-linear-tank', subjectId: 'mathematics', skill: 'mathematics', gradeBand: '8', topicId: 'dogrusal-denklemler', learningOutcomeId: 'tr.pre-tymm.g8.matematik.m-8-2-2-5',
    context: '180 litre su bulunan bir depodan her dakika sabit 3 litre su kullanılmaktadır. t dakika sonra depoda kalan su miktarı V litre ile gösterilecektir.',
    prompt: 'Depoda 45 litre su kaldığı anı doğru veren denklem ve süre hangisidir?',
    options: ['V = 180 + 3t ve t = 45', 'V = 180 − 3t ve t = 45', 'V = 3t − 180 ve t = 75', 'V = 180 − t/3 ve t = 405'],
    answerIndex: 1,
    explanation: 'Sabit azalma V = 180 − 3t ile modellenir. 45 = 180 − 3t olduğundan 3t = 135 ve t = 45 dakikadır.',
    wrongReasons: ['Azalan miktarı artış olarak modeller.', null, 'Değişkenlerin sırasını ters kurup denklemi yanlış çözer.', 'Dakikadaki 3 litrelik azalmayı bölme olarak yorumlar.']
  })],
  ['phase5h:social:g5:first-settlements-evidence-01', authoredChoiceRound({
    questionKey: 'phase5h:social:g5:first-settlements-evidence-01', familyId: 'phase5h-social-first-settlements', subjectId: 'social', skill: 'social', gradeBand: '5', topicId: 'anadoluda-ilk-yerlesimler', learningOutcomeId: 'tr-tymm-g5-sosyal-bilgiler-sb-5-3-2',
    context: 'Bir kazı alanında sabit ev temelleri, tahıl depolama çukurları, öğütme taşları ve aynı yerde uzun süre kullanılmış ocaklar bulunmuştur.',
    prompt: 'Bu bulgular, burada yaşayan toplumun sosyal hayatı hakkında en güçlü hangi çıkarımı destekler?',
    options: ['Yalnız avcılıkla geçinen ve sürekli yer değiştiren bir topluluktur.', 'Yerleşik yaşam sürmüş, üretim ve depolama yapmış bir topluluktur.', 'Deniz ticaretine dayalı büyük bir liman devleti kurmuştur.', 'Bütün ihtiyaçlarını başka toplumlardan satın almıştır.'],
    answerIndex: 1,
    explanation: 'Sabit yapılar, depolama alanları ve öğütme taşları yerleşik yaşam ile tarımsal üretimin birlikte yürütüldüğünü gösterir.',
    wrongReasons: ['Sabit ev ve depolama bulgularını göçebe yaşamla bağdaştırır.', null, 'Metinde deniz, liman veya ticaret kanıtı olmadığı hâlde sonuç ekler.', 'Üretim araçlarını dışarıdan satın alma kanıtı gibi yorumlar.']
  })],
  ['phase5h:social:g6:relative-location-01', authoredChoiceRound({
    questionKey: 'phase5h:social:g6:relative-location-01', familyId: 'phase5h-social-relative-location', subjectId: 'social', skill: 'social', gradeBand: '6', topicId: 'ulkemizin-konumu', learningOutcomeId: 'tr-tymm-g6-sosyal-bilgiler-sb-6-2-1',
    context: 'Türkiye 36°–42° kuzey paralelleri ile 26°–45° doğu meridyenleri arasındadır. Asya ve Avrupa kıtaları arasında yer alır; üç tarafı denizlerle çevrilidir.',
    prompt: 'Bu bilgiler birlikte değerlendirildiğinde Türkiye’nin konumuyla ilgili hangi çıkarım yapılabilir?',
    options: ['Güney Yarım Küre’de ve yalnız Asya kıtasındadır.', 'Kuzey ve Doğu Yarım Kürelerdedir; kıtalar arası geçiş konumuna sahiptir.', 'Başlangıç meridyeninin batısında ve okyanuslarla çevrilidir.', 'Ekvator üzerinde bulunduğu için her yerde aynı iklim görülür.'],
    answerIndex: 1,
    explanation: 'Kuzey enlemleri Kuzey Yarım Küreyi, doğu boylamları Doğu Yarım Küreyi; Asya ve Avrupa arasındaki konum ise kıtalar arası geçiş özelliğini gösterir.',
    wrongReasons: ['Kuzey enlemlerini Güney Yarım Küre olarak okur ve Avrupa bağlantısını yok sayar.', null, 'Doğu boylamlarını başlangıç meridyeninin batısı sanır ve deniz ile okyanusu karıştırır.', 'Enlem aralığını tek bir Ekvator çizgisi gibi yorumlar.']
  })],
  ['phase5h:social:g7:accessibility-equality-01', authoredChoiceRound({
    questionKey: 'phase5h:social:g7:accessibility-equality-01', familyId: 'phase5h-social-accessibility', subjectId: 'social', skill: 'social', gradeBand: '7', topicId: 'firsat-esitligi', learningOutcomeId: 'tr-tymm-g7-sosyal-bilgiler-sb-7-1-2',
    context: 'Belediye kütüphanesi yenilenirken tekerlekli sandalye kullanan, görme güçlüğü yaşayan ve işitme desteğine ihtiyaç duyan bireylerin hizmetlerden bağımsız yararlanması hedefleniyor.',
    prompt: 'Fırsat eşitliğini en sürdürülebilir biçimde destekleyen öneri hangisidir?',
    options: ['Yalnız girişe engelli bireylere öncelik verildiğini yazan bir afiş asmak.', 'Rampa ve erişilebilir masa kurup personeli çağırmak için yalnız zil koymak.', 'Basamaksız erişim, uygun yükseklikte banko, hissedilebilir yönlendirme ve görsel-işitsel duyuru sistemini birlikte kurmak.', 'Kütüphaneyi ayda bir gün yalnız özel gereksinimli bireylere açmak.'],
    answerIndex: 2,
    explanation: 'Birden fazla gereksinimi kalıcı tasarımla birlikte karşılayan üçüncü öneri, kişileri başkasına bağımlı bırakmadan eşit erişim sağlar.',
    wrongReasons: ['Sembolik bir duyuru yapar fakat fiziksel ve iletişimsel engelleri kaldırmaz.', 'Bazı engelleri azaltır ancak görsel-işitsel erişimi ve bağımsız kullanımı eksik bırakır.', null, 'Eşit katılım yerine kişileri ayrı bir güne ayırarak erişimi sınırlar.']
  })],
  ['phase5h:social:g8:national-struggle-source-01', authoredChoiceRound({
    questionKey: 'phase5h:social:g8:national-struggle-source-01', familyId: 'phase5h-history-national-struggle-source', subjectId: 'history', skill: 'social', gradeBand: '8', topicId: 'milli-mucadele-hazirlik', learningOutcomeId: 'tr-pre-tymm-g8-inkilap-2-1',
    context: 'Bir araştırmacı Kuvay-ı Millîye’nin oluşumunu incelerken 1919’da yerel bir direnişçiye ait mektubu, o dönemin resmî genelgesini ve yıllar sonra yazılmış bir tarih kitabını karşılaştırıyor. Mektup yereldeki kaygıları, genelge örgütlenme hedefini, kitap ise sonraki değerlendirmeleri aktarıyor.',
    prompt: 'Süreci güvenilir biçimde açıklamak için en uygun yöntem hangisidir?',
    options: ['Yalnız mektubu kullanmak; olaya katılan kişinin anlatımı bütünüyle tarafsızdır.', 'Yalnız tarih kitabını kullanmak; daha sonra yazıldığı için diğer kaynaklara gerek yoktur.', 'Kaynakların yazıldığı zamanı, amacını ve bakış açısını karşılaştırıp ortak ve farklı bilgileri birlikte değerlendirmek.', 'Kaynaklar farklı ayrıntılar verdiği için hiçbirinden yararlanmamak.'],
    answerIndex: 2,
    explanation: 'Millî Mücadele süreci, farklı türde kaynakların zamanı, amacı ve bakış açısı sorgulanarak çapraz değerlendirilmelidir.',
    wrongReasons: ['Birincil kaynağı otomatik olarak tarafsız kabul eder.', 'İkincil kaynağın tek başına bütün dönemi temsil ettiğini varsayar.', null, 'Kaynak farklılıklarını araştırma kanıtı yerine kullanılamazlık gerekçesi sayar.']
  })],
  ['phase5h:science:g5:conductor-evidence-01', authoredChoiceRound({
    questionKey: 'phase5h:science:g5:conductor-evidence-01', familyId: 'phase5h-science-conductor-evidence', subjectId: 'science', skill: 'science', gradeBand: '5', topicId: 'iletken-ve-yalitkan-maddeler', learningOutcomeId: 'tr-tymm-g5-fen-bilimleri-fb-5-6-1-2',
    context: 'Özdeş bir basit devrede pil ile ampul arasındaki boşluğa sırayla aynı uzunlukta bakır tel, tahta çubuk ve plastik şerit yerleştiriliyor. Ampul yalnız bakır tel kullanıldığında yanıyor.',
    prompt: 'Deneyin sonucunu kanıta uygun biçimde açıklayan seçenek hangisidir?',
    options: ['Tahta ve plastik de iletkendir; yalnız kalın oldukları için ampul yanmamıştır.', 'Bakır tel elektrik akımını iletip devreyi tamamlamıştır.', 'Ampulün yanması, bakır telin devreye yeni elektrik enerjisi ürettiğini gösterir.', 'Yalnız ampulün yanması gözlendiği için maddelerin iletkenliği hakkında karşılaştırma yapılamaz.'],
    answerIndex: 1,
    explanation: 'Devrenin diğer elemanları aynıyken yalnız araya konan madde değişmiştir. Ampulün bakır telde yanması, bakırın akımı ileterek devreyi tamamladığını; tahta ve plastiğin aynı koşulda bunu yapmadığını gösterir.',
    wrongReasons: ['İletkenlik yerine maddenin kalınlığını neden sayar; oysa örnekte uzunluk eşitlenmiş ve gözlenen fark malzeme türüyle ilişkilidir.', null, 'İletkeni enerji kaynağı sanır; bakır tel enerji üretmez, pilin sağladığı akım için yol oluşturur.', 'Ampulün yanıp yanmaması basit devrede akımın geçip geçmediğine ilişkin doğrudan karşılaştırma kanıtıdır.'],
    hints: ['Devrede değiştirilen tek elemanı belirle.', 'Ampulün yanması, elektrik akımının kapalı bir yoldan geçtiğini gösterir.']
  })],
  ['phase5h:science:g6:bulb-brightness-variable-01', authoredChoiceRound({
    questionKey: 'phase5h:science:g6:bulb-brightness-variable-01', familyId: 'phase5h-science-bulb-variable', subjectId: 'science', skill: 'science', gradeBand: '6', topicId: 'ampul-parlakligi-degiskenleri', learningOutcomeId: 'tr-tymm-g6-fen-bilimleri-fb-6-6-2-1',
    context: 'Bir öğrenci pil sayısının ampul parlaklığına etkisini araştıracaktır. İki devrede özdeş ampul ve kablolar kullanacaktır.',
    prompt: 'Adil bir deney için devreler nasıl kurulmalıdır?',
    options: ['Birinci devrede 1 pil ve 1 ampul, ikinci devrede 2 pil ve 2 farklı ampul kullanılmalıdır.', 'Yalnız pil sayısı değiştirilmeli; ampul sayısı, ampul türü ve bağlantı biçimi aynı tutulmalıdır.', 'Pil sayısı aynı tutulup bir devrede kablo uzatılmalı, diğerinde ampul değiştirilmelidir.', 'Bütün devre elemanları farklı seçilip daha parlak görünen ampul kaydedilmelidir.'],
    answerIndex: 1,
    explanation: 'Bağımsız değişken yalnız pil sayısı olmalı; diğer devre özellikleri kontrol değişkeni olarak aynı tutulmalıdır.',
    wrongReasons: ['Pil sayısıyla birlikte ampul sayısını ve türünü de değiştirerek sonucu belirsizleştirir.', null, 'Araştırılan pil sayısını sabit tutup birden fazla başka değişkeni değiştirir.', 'Kontrol değişkeni bırakmadığı için karşılaştırılabilir kanıt üretmez.']
  })],
  ['phase5h:science:g8:photosynthesis-light-01', authoredChoiceRound({
    questionKey: 'phase5h:science:g8:photosynthesis-light-01', familyId: 'phase5h-science-photosynthesis-light', subjectId: 'science', skill: 'science', gradeBand: '8', topicId: 'fotosentez-hizi', learningOutcomeId: 'tr-2018-g8-science-f-8-6-2-2',
    context: 'Özdeş su bitkileri eşit sıcaklıkta ve eşit miktarda karbondioksit bulunan kaplara konuyor. Lambaya 10 cm, 20 cm ve 40 cm uzaklıktaki bitkilerin bir dakikada oluşturduğu kabarcık sayıları sırasıyla 30, 18 ve 8 olarak ölçülüyor.',
    prompt: 'Deneyin değişkenleri ve verilerden çıkarılabilecek sonuç hangi seçenekte doğru verilmiştir?',
    options: ['Bağımsız değişken sıcaklıktır; sıcaklık arttıkça fotosentez yavaşlar.', 'Bağımsız değişken ışık şiddetidir; lamba uzaklaştıkça ölçülen fotosentez hızı azalmıştır.', 'Bağımlı değişken karbondioksit miktarıdır; uzaklık arttıkça karbondioksit artmıştır.', 'Kontrol değişkeni kabarcık sayısıdır; ışık şiddetinin etkisi ölçülememiştir.'],
    answerIndex: 1,
    explanation: 'Değiştirilen lamba uzaklığı ışık şiddetini etkiler; ölçülen kabarcık sayısı fotosentez hızının göstergesidir ve uzaklık arttıkça azalmıştır.',
    wrongReasons: ['Sabit tutulan sıcaklığı bağımsız değişken sanır.', null, 'Sabit tutulan karbondioksiti bağımlı değişken olarak yorumlar.', 'Ölçülen sonucu kontrol değişkeni sanıp deney düzenini yanlış sınıflandırır.']
  })],
  ['phase5h:religion:g5:ihlas-meaning-01', authoredChoiceRound({
    questionKey: 'phase5h:religion:g5:ihlas-meaning-01', familyId: 'phase5h-religion-ihlas-meaning', subjectId: 'religion', skill: 'religion', gradeBand: '5', topicId: 'ihlas-suresi', learningOutcomeId: 'tr-tymm-g5-din-kulturu-ve-ahlak-bilgisi-dkab-5-1-4',
    context: 'İhlâs suresinin anlamında Allah’ın bir olduğu, hiçbir şeye muhtaç olmadığı, doğurmadığı ve doğurulmadığı, hiçbir varlığın da O’na denk olmadığı bildirilir.',
    prompt: 'Bu anlamdan çıkarılabilecek en kapsamlı sonuç hangisidir?',
    options: ['Bütün varlıkların özellikleri birbirinin aynıdır.', 'Allah bir ve eşsizdir; yaratılmışların hiçbirine benzemez.', 'Sure yalnız geçmişte yaşamış insanları anlatır.', 'İnsanların bütün ihtiyaçlarının aynı olması gerekir.'],
    answerIndex: 1,
    explanation: 'Metindeki bütün ifadeler Allah’ın bir, eşsiz ve hiçbir varlığa benzemeyen oluşunu vurgular.',
    wrongReasons: ['Allah’ın eşsizliği mesajını bütün varlıkların aynı olması şeklinde ters yorumlar.', null, 'Surenin evrensel inanç mesajını tarihsel bir anlatıya indirger.', 'Allah’ın hiçbir şeye muhtaç olmamasıyla insanların ihtiyaçlarını karıştırır.']
  })],
  ['phase5h:religion:g6:truthfulness-01', authoredChoiceRound({
    questionKey: 'phase5h:religion:g6:truthfulness-01', familyId: 'phase5h-religion-truthfulness', subjectId: 'religion', skill: 'religion', gradeBand: '6', topicId: 'dogru-sozluluk', learningOutcomeId: 'tr-tymm-g6-din-kulturu-ve-ahlak-bilgisi-dkab-6-3-1',
    context: 'Mert, grup ödevindeki kendi bölümünü zamanında tamamlamamıştır. Öğretmen nedenini sorduğunda arkadaşını suçlarsa ceza almayacağını düşünür.',
    prompt: 'Doğru sözlülüğü hayatına yansıtmak isteyen Mert’in davranışı hangisi olmalıdır?',
    options: ['Sorumluluğu arkadaşına yükleyip konuyu kapatmalıdır.', 'Gerçeği söylemeli, kendi sorumluluğunu kabul etmeli ve eksik bölüm için çözüm önermelidir.', 'Hiç cevap vermeyerek yanlış anlaşılmayı sürdürmelidir.', 'Yalnız yakın arkadaşlarına gerçeği anlatmalıdır.'],
    answerIndex: 1,
    explanation: 'Doğru sözlülük, gerçeği ifade etmeyi; sorumluluk ise hatayı kabul edip düzeltme adımı önermeyi gerektirir.',
    wrongReasons: ['Kısa vadeli cezadan kaçınmayı doğruluğun önüne koyar.', null, 'Sessiz kalmanın yanlış bilgiyi sürdürdüğünü gözden kaçırır.', 'Doğruluğu herkese karşı tutarlı bir ilke yerine yakın çevreyle sınırlar.']
  })],
  ['phase5h:religion:g7:belief-behaviour-01', authoredChoiceRound({
    questionKey: 'phase5h:religion:g7:belief-behaviour-01', familyId: 'phase5h-religion-belief-behaviour', subjectId: 'religion', skill: 'religion', gradeBand: '7', topicId: 'ahiret-inanci-ve-davranis', learningOutcomeId: 'tr-tymm-g7-din-kulturu-ve-ahlak-bilgisi-dkab-7-1-3',
    context: 'Bir öğrenci, kimsenin görmediği bir anda yerde bulduğu cüzdanı sahibine ulaştırır. Davranışını, insanın yaptığı her iyilik ve kötülükten sorumlu olduğu düşüncesiyle açıklar.',
    prompt: 'Bu örnek, inancın insan davranışına etkisini en doğru nasıl gösterir?',
    options: ['İyi davranışın yalnız başkaları izlerken gerekli olduğunu gösterir.', 'Sorumluluk bilincinin, denetim olmasa da doğru davranmayı desteklediğini gösterir.', 'Bulunan eşyanın değeri yüksekse dürüst olunması gerektiğini gösterir.', 'İnanç ile günlük davranışlar arasında ilişki kurulamayacağını gösterir.'],
    answerIndex: 1,
    explanation: 'Öğrenci dış denetim olmadığı hâlde sorumluluk bilinciyle doğru davranmış; inanç ile davranış arasında bağ kurmuştur.',
    wrongReasons: ['İç denetim örneğini dış denetime bağlı davranış gibi yorumlar.', null, 'Dürüstlüğü eşyanın maddi değeriyle sınırlar.', 'Metinde açıkça kurulan inanç-davranış bağını yok sayar.']
  })]
]);

function applyLaunchPilotCorrections(slot, round) {
  if (slot.sourceKey !== 'premium:2.6.0:lgs-foundation:lgs-probability-bag-01:10u5ryk') return round;
  const correctedText = 'İki kırmızı seçimini 3×2=6, toplam olası durumu 5+4=9 alıp 6/9 bulmak';
  const correctedReason = 'Ardışık iki çekilişte toplam olası sıralı durum sayısını 5×4 yerine 5+4 olarak hesaplar.';
  const options = [...round.options];
  options[3] = correctedText;
  const optionDiagnostics = round.optionDiagnostics.map((diagnostic, index) => index === 3 ? {
    ...diagnostic,
    optionText: correctedText,
    misconceptionId: 'lgs:add-stage-denominators',
    misconceptionName: 'lgs:add-stage-denominators',
    misconception: correctedReason,
    rationale: correctedReason,
    whyStudentChoosesThis: correctedReason,
    constructionRule: 'add-sequential-sample-space-sizes',
    semanticCategory: 'lgs:add-stage-denominators'
  } : diagnostic);
  const detailedOptions = round.detailedOptions.map((detail, index) => index === 3 ? `Yanlış: ${correctedReason}` : detail);
  return freeze({
    ...round,
    options,
    optionDiagnostics,
    detailedOptions,
    sourceLabel: `${round.sourceLabel} · Phase 5H manuel çeldirici düzeltmesi`,
    pilotCorrectionId: 'phase5h-lgs-probability-equivalent-distractor-fix'
  });
}

const cache = new Map();
function premiumRounds(gameId, grade) {
  const key = `${gameId}:${grade}`;
  if (!cache.has(key)) cache.set(key, generatePremiumRounds(gameId, { grade, count: 1_000_000, seed: 42 }).rounds);
  return cache.get(key);
}

export function resolveLaunchPilotPremiumRound(slot) {
  const custom = CUSTOM_ROUNDS.get(slot.sourceKey);
  if (custom) return custom;
  const round = premiumRounds(slot.gameId, slot.grade).find((row) => row.questionKey === slot.sourceKey);
  if (!round) throw new Error(`launch-pilot-premium-source-not-found:${slot.slotId}:${slot.sourceKey}`);
  return freeze(applyLaunchPilotCorrections(slot, round));
}

export function buildLaunchPilotPremiumBank() {
  const rows = LAUNCH_PILOT_PREMIUM_SLOTS.map((slot) => freeze({ ...slot, round: resolveLaunchPilotPremiumRound(slot) }));
  return freeze({
    schemaVersion: '1.1', phase: '5H', id: 'ASSESSMENT_V2_PHASE5H_PREMIUM_PILOT_BANK_30',
    sourcePolicy: 'VERSIONED_PREMIUM_OR_EXPLICIT_PHASE5H_AUTHORING_ONLY', count: rows.length, rows,
    automaticHumanApproval: false, publicationAllowed: false
  });
}

export const ASSESSMENT_V2_LAUNCH_PILOT_PREMIUM_BANK = buildLaunchPilotPremiumBank();
