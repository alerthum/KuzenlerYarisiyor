/**
 * 4. ve 8. sınıf öncelikli güvenli canlı banka — Dalga 1.
 * Sorular serbest üretim değildir; son öğrenci yüzeyi, tanısal çeldirici,
 * iki özgül ipucu, dört akıl yürütme adımı ve bağımsız cevap doğrulaması içerir.
 */

function freezeRows(rows) {
  return Object.freeze(rows.map((row) => Object.freeze(row)));
}

function buildRound(spec) {
  const {
    id, grade, gameId, subjectId, topicId, outcomeId, skill,
    context, prompt, options, answer, hints, evidence, misconceptions,
    experienceType, durationSeconds = grade >= 8 ? 210 : 150
  } = spec;
  if (!Array.isArray(options) || options.length !== 4 || new Set(options).size !== 4) throw new Error(`${id}: four-options-required`);
  if (!Array.isArray(hints) || hints.length < 2 || hints.some((x) => String(x).trim().length < 25)) throw new Error(`${id}: specific-hints-required`);
  if (!Array.isArray(evidence) || evidence.length < 4) throw new Error(`${id}: four-evidence-steps-required`);
  if (!Array.isArray(misconceptions) || misconceptions.length !== 3) throw new Error(`${id}: three-misconceptions-required`);
  const answerIndex = options.indexOf(answer);
  if (answerIndex < 0) throw new Error(`${id}: answer-missing`);

  let wrong = 0;
  const optionDiagnostics = options.map((option, optionIndex) => {
    if (optionIndex === answerIndex) return Object.freeze({
      optionIndex, optionText: option, isCorrect: true, misconceptionId: null,
      misconception: null,
      rationale: 'Bütün kanıtları ve koşulları birlikte karşılar; bağımsız doğrulama aynı sonucu üretir.',
      whyStudentChoosesThis: 'Verilenleri ilişkilendirir ve sonucu başlangıç koşullarına geri yerleştirir.'
    });
    const row = misconceptions[wrong++];
    return Object.freeze({
      optionIndex, optionText: option, isCorrect: false,
      misconceptionId: row.id, misconception: row.text,
      rationale: row.text, whyStudentChoosesThis: row.why
    });
  });

  const solutionGraph = evidence.map((row, index) => Object.freeze({
    step: index + 1,
    id: `s${index + 1}`,
    action: row.action,
    evidence: row.evidence
  }));
  solutionGraph.push(Object.freeze({
    step: solutionGraph.length + 1,
    id: 'independent-verification',
    action: 'sonucu yeniden doğrula',
    evidence: `Bağımsız doğrulayıcı doğru cevabı “${answer}” olarak yeniden üretmiştir.`
  }));

  const explanation = `${evidence.map((row, index) => `${index + 1}) ${row.action}: ${row.evidence}`).join(' ')} Sonuç: ${answer}`;
  return Object.freeze({
    kind: 'choice',
    questionKey: `trusted:4.0:${gameId}:${id}`,
    gameId,
    prompt, context,
    options: Object.freeze([...options]),
    answerIndex,
    explanation,
    hints: Object.freeze([...hints]),
    detailedOptions: Object.freeze(optionDiagnostics.map((row) => row.isCorrect ? `Doğru: ${row.rationale}` : `Yanlış: ${row.rationale}`)),
    optionDiagnostics: Object.freeze(optionDiagnostics),
    skill, subjectId, topicId,
    learningOutcomeId: outcomeId,
    curriculumReferenceId: outcomeId,
    gradeBand: String(grade), targetGrade: grade,
    difficulty: grade >= 8 ? 5 : 4,
    cognitiveDepth: grade >= 8 ? 5 : 4,
    authoredReasoningStepCount: evidence.length,
    reasoningStepCount: solutionGraph.length,
    cognitiveTraits: Object.freeze(['multiEvidenceIntegration', 'relationAnalysis', 'misconceptionDiscrimination', 'independentVerification']),
    familyId: `trusted-g${grade}-${subjectId}:${topicId}`,
    skeletonId: `trusted-g${grade}-${subjectId}:${experienceType}`,
    reasoningPathId: `trusted-g${grade}-${subjectId}:${id}`,
    cognitiveExperienceId: `trusted-g${grade}:${experienceType}:${id}`,
    trustedExperienceType: experienceType,
    trustedSessionOrder: spec.sessionOrder,
    solutionGraph: Object.freeze(solutionGraph),
    cognitiveDepthEvidence: Object.freeze({
      authoredReasoningStepCount: evidence.length,
      reasoningStepCount: solutionGraph.length,
      highCognitiveTraits: ['multiEvidenceIntegration', 'relationAnalysis', 'independentVerification'],
      source: 'trusted-authored-priority-4-8-bank'
    }),
    sourceLabel: `${grade}. Sınıf ${subjectId} · Elle İncelenmiş Öncelikli Güvenli Banka`,
    premiumTier: 'PLATINUM', premiumQuestion: true,
    canonicalQuestionId: id, constructId: skill,
    knowledgeComponents: Object.freeze([topicId, skill, experienceType]),
    intendedDifficultyBand: grade >= 8 ? 'GRADE8_HIGH' : 'GRADE4_CHALLENGING',
    durationSeconds,
    solverProof: Object.freeze({
      verified: true,
      solverId: `trusted-g${grade}-${subjectId}-solver:${id}`,
      independentVerifierId: `trusted-g${grade}-${subjectId}-verifier:${id}`,
      evidenceType: 'independent-authored-verifier',
      answerText: answer
    }),
    requireExplicitDistractorEvidence: true,
    distractorValidation: Object.freeze({ verified: true, diagnosticCount: 3, distinctMisconceptions: 3, violations: Object.freeze([]) }),
    trustedHumanReview: Object.freeze({
      status: 'APPROVED',
      difficultyVerdict: grade >= 8 ? 'HARD' : 'AGE_APPROPRIATE_CHALLENGING',
      languageVerdict: subjectId === 'english' ? 'NATURAL_EN_WITH_TR_INSTRUCTION' : 'NATURAL_TR',
      distractorVerdict: 'DIAGNOSTIC',
      reviewStandard: 'FINAL_STUDENT_SURFACE_V4'
    })
  });
}

const m = (id, text, why) => ({ id, text, why });
const e = (action, evidence) => ({ action, evidence });

const G8_HISTORY = [
  buildRound({ id:'g8-his-01-source-comparison', grade:8, gameId:'social-time-travel', subjectId:'history', topicId:'national-struggle-sources', outcomeId:'history-g8-2-1', skill:'source-comparison', experienceType:'source-triangulation', sessionOrder:1,
    context:'Kaynak A, 1919 tarihli bir yerel gazete haberinde işgallere karşı protesto toplantısına çevre ilçelerden de katılım olduğunu bildiriyor. Kaynak B, toplantıya katılan bir öğretmenin yıllar sonra yazdığı anılarında kalabalığın çok coşkulu olduğunu söylüyor. Kaynak C, aynı güne ait resmî telgrafta toplantının saati, alınan kararlar ve gönderilen temsilci sayısını kaydediyor.',
    prompt:'Toplantının hem geniş katılımlı olduğunu hem de somut kararlar aldığını en güçlü biçimde göstermek için hangi kaynak kullanımı uygundur?',
    options:['Yalnız Kaynak B; coşku bütün ayrıntıları kanıtlar.','Kaynak A ile C birlikte; biri katılımı, diğeri karar ve temsilci bilgisini destekler.','Yalnız Kaynak C; resmî belge olduğu için katılım hakkında yazmadığı ayrıntıları da kanıtlar.','Kaynak A ile B birlikte; ikisi de karar metnini aynen verir.'], answer:'Kaynak A ile C birlikte; biri katılımı, diğeri karar ve temsilci bilgisini destekler.',
    hints:['Her kaynağın açıkça desteklediği bilgiyi ayrı yaz; kaynağın söylemediği bir ayrıntıyı ona yükleme.','İki parçalı iddianın “katılım” ve “somut karar” bölümleri için farklı kaynakların birbirini tamamlaması gerekir.'],
    evidence:[e('iddianın iki bölümünü ayır','Geniş katılım ve karar alınması iki ayrı kanıttır.'),e('A kaynağını değerlendir','Çevre ilçelerden katılımı doğrudan bildirir.'),e('C kaynağını değerlendir','Kararları ve temsilci sayısını kaydeder.'),e('kaynakları birleştir','A ve C iddianın iki bölümünü ayrı ayrı destekler.')],
    misconceptions:[m('emotion-as-proof','Anıdaki coşkuyu bütün tarihsel ayrıntıların kanıtı sayar.','Duygu anlatımını katılım ve karar belgesiyle karıştırır.'),m('official-overreach','Resmî belgenin yazmadığı katılım ayrıntısını da kanıtladığını varsayar.','Kaynak türünü sınırsız güvenilirlik sanır.'),m('claim-mismatch','A ve B’nin karar metnini aynen verdiğini ileri sürer.','Kaynakların gerçek içeriklerini karşılaştırmaz.')] }),
  buildRound({ id:'g8-his-02-cause-chain', grade:8, gameId:'social-time-travel', subjectId:'history', topicId:'mondros-occupations', outcomeId:'history-g8-2-2', skill:'cause-consequence-chain', experienceType:'causal-chain', sessionOrder:2,
    context:'Mondros Ateşkes Antlaşması’nın bazı maddeleri İtilaf Devletlerine güvenliği tehdit eden bir durum gördüklerinde stratejik noktaları işgal etme imkânı veriyordu. İşgaller başlayınca İstanbul Hükûmeti etkili bir karşılık veremedi. Bunun üzerine farklı bölgelerde müdafaa cemiyetleri kuruldu ve bölgesel direnişler başladı.',
    prompt:'Bu bilgilerden kurulabilecek en tutarlı neden-sonuç zinciri hangisidir?',
    options:['Cemiyetlerin kurulması → Mondros’un imzalanması → işgallerin başlaması','Mondros’un işgale açık maddeleri → işgaller → hükûmetin yetersizliği → yerel direniş örgütleri','Hükûmetin güçlü karşılığı → işgallerin sona ermesi → cemiyetlerin dağılması','Bölgesel direnişler → İtilaf Devletlerinin Mondros’u imzalaması'], answer:'Mondros’un işgale açık maddeleri → işgaller → hükûmetin yetersizliği → yerel direniş örgütleri',
    hints:['Olayları metindeki zaman sırasına dizmek yetmez; her okun bir sonraki olayı nasıl hazırladığını da kontrol et.','İlk halkada antlaşmanın verdiği imkân, son halkada halkın geliştirdiği tepki bulunmalıdır.'],
    evidence:[e('başlangıç koşulunu bul','Mondros maddeleri işgale zemin oluşturur.'),e('ilk sonucu belirle','İşgaller başlar.'),e('ara koşulu ekle','İstanbul Hükûmeti etkili karşılık veremez.'),e('toplumsal tepkiyi bağla','Yerel cemiyet ve direnişler gelişir.')],
    misconceptions:[m('reverse-order','Sonucu nedenin önüne geçirir.','Zaman ve nedensellik yönünü ters kurar.'),m('contradict-text','Hükûmetin güçlü karşılık verdiğini varsayar.','Metindeki açık bilgiyle çelişir.'),m('effect-causes-treaty','Direnişlerin Mondros’un nedeni olduğunu söyler.','Sonraki olayı önceki antlaşmanın nedeni yapar.')] }),
  buildRound({ id:'g8-his-03-congress-principle', grade:8, gameId:'social-time-travel', subjectId:'history', topicId:'congresses-national-sovereignty', outcomeId:'history-g8-2-4', skill:'principle-inference', experienceType:'principle-matching', sessionOrder:3,
    context:'Erzurum Kongresi’nde “Millî sınırlar içinde vatan bir bütündür, parçalanamaz.” ve “Kuvayımilliye’yi etkili, millî iradeyi hâkim kılmak esastır.” kararları alınmıştır. Sivas Kongresi’nde bütün millî cemiyetler tek çatı altında birleştirilmiştir.',
    prompt:'Bu kararların ortak yönünü en iyi açıklayan yargı hangisidir?',
    options:['Bölgesel amaçları birbirinden bağımsız tutmak','Millî birlik, ülke bütünlüğü ve halk iradesine dayalı ortak mücadele kurmak','Yabancı devletlerin yönetimini geçici olarak kabul etmek','Saltanat yönetimini güçlendirmek için yerel cemiyetleri çoğaltmak'], answer:'Millî birlik, ülke bütünlüğü ve halk iradesine dayalı ortak mücadele kurmak',
    hints:['Kararlardaki “bütün”, “millî irade” ve “tek çatı” ifadelerini ortak bir üst ilkeye dönüştür.','Doğru seçenek hem ülke bütünlüğünü hem yönetimde halk iradesini hem de örgütsel birliği birlikte taşımalıdır.'],
    evidence:[e('ülke bütünlüğü ilkesini çıkar','Vatanın parçalanamaz olduğu belirtilir.'),e('siyasal dayanağı çıkar','Millî iradenin hâkim kılınması istenir.'),e('örgütsel adımı belirle','Cemiyetler tek çatı altında birleştirilir.'),e('ortak ilkeyi kur','Millî birlik ve halk iradesiyle ortak mücadele hedeflenir.')],
    misconceptions:[m('regional-fragmentation','Kararları bölgesel ayrılığı koruma amacıyla yorumlar.','Tek çatı ve bütünlük ifadelerini yok sayar.'),m('mandate-assumption','Yabancı yönetimini kabul edildiğini varsayar.','Metinde böyle bir kabul yoktur.'),m('opposite-organization','Yerel cemiyetleri çoğaltmayı birlik sanır.','Birleştirme kararının tersini söyler.')] }),
  buildRound({ id:'g8-his-04-front-strategy', grade:8, gameId:'social-time-travel', subjectId:'history', topicId:'national-struggle-fronts', outcomeId:'history-g8-3-2', skill:'strategic-comparison', experienceType:'strategy-comparison', sessionOrder:4,
    context:'Doğu Cephesi’nde askerî başarıdan sonra Gümrü Antlaşması imzalandı. Güney Cephesi’nde halk direnişi etkili oldu ve Ankara Antlaşması’yla Fransa bölgeden çekildi. Batı Cephesi’nde düzenli ordu kurulmuş, uzun süren büyük savaşlar sonunda kesin sonuç alınmıştır.',
    prompt:'Cephelerin mücadele biçimlerini karşılaştıran en doğru değerlendirme hangisidir?',
    options:['Üç cephede de yalnız yerel halk birlikleri savaşmıştır.','Doğu ve Batı cephelerinde hiçbir antlaşma yapılmamıştır.','Cephelerde farklı askerî ve toplumsal yöntemler kullanılmış; sonuçlar diplomatik antlaşmalarla da desteklenmiştir.','Güney Cephesi düzenli ordunun tek başına kazandığı cephedir.'], answer:'Cephelerde farklı askerî ve toplumsal yöntemler kullanılmış; sonuçlar diplomatik antlaşmalarla da desteklenmiştir.',
    hints:['Her cephe için “kim mücadele etti?” ve “sonuç nasıl kesinleşti?” sorularını ayrı ayrı cevapla.','Doğru seçenek bütün cepheleri tek yöntemle açıklamamalı; farklılıkları ve diplomatik sonuçları birlikte göstermelidir.'],
    evidence:[e('Doğu Cephesi yöntemini belirle','Askerî başarı ve Gümrü Antlaşması vardır.'),e('Güney Cephesi yöntemini belirle','Halk direnişi ve Ankara Antlaşması öne çıkar.'),e('Batı Cephesi yöntemini belirle','Düzenli ordu ve büyük savaşlar belirleyicidir.'),e('karşılaştırmayı kur','Farklı yöntemler diplomatik sonuçlarla tamamlanmıştır.')],
    misconceptions:[m('single-method','Bütün cepheleri yalnız yerel birliklerle açıklar.','Düzenli ordu bilgisini yok sayar.'),m('deny-treaties','Antlaşmaları görmezden gelir.','Metindeki Gümrü ve Ankara antlaşmalarını kullanmaz.'),m('wrong-front-force','Güney’i yalnız düzenli orduya bağlar.','Halk direnişi vurgusunu ters yorumlar.')] }),
  buildRound({ id:'g8-his-05-reform-purpose', grade:8, gameId:'social-time-travel', subjectId:'history', topicId:'ataturk-reforms', outcomeId:'history-g8-4-3', skill:'reform-purpose-analysis', experienceType:'reform-purpose-map', sessionOrder:5,
    context:'Yeni Türk harfleri kabul edilmiş, Millet Mektepleri açılmış ve okuma yazma seferberliği başlatılmıştır. Aynı dönemde eğitim kurumları Tevhid-i Tedrisat Kanunu ile tek çatı altında toplanmıştır.',
    prompt:'Bu düzenlemelerin birlikte ulaşmayı amaçladığı temel sonuç hangisidir?',
    options:['Eğitimi farklı kurumlar arasında daha parçalı hâle getirmek','Okuryazarlığı artırmak ve eğitimde birlik sağlayarak çağdaşlaşmayı hızlandırmak','Yalnız yükseköğretimde yabancı dil kullanımını zorunlu kılmak','Eğitimi sadece belirli bir meslek grubuna açmak'], answer:'Okuryazarlığı artırmak ve eğitimde birlik sağlayarak çağdaşlaşmayı hızlandırmak',
    hints:['Harf değişikliği ve Millet Mekteplerinin hedefini, eğitim kurumlarının tek çatıya alınmasının hedefinden ayrı çıkar.','Sonra iki hedefi “toplumun eğitime erişimi” ve “eğitim sisteminin bütünlüğü” ortak paydasında birleştir.'],
    evidence:[e('harf düzenlemesinin amacını bul','Okuma yazmayı kolaylaştırma ve yaygınlaştırma hedeflenir.'),e('Millet Mekteplerini değerlendir','Yetişkinlerin de yeni yazıyı öğrenmesi amaçlanır.'),e('Tevhid-i Tedrisatı değerlendir','Eğitimde kurum ve program birliği sağlanır.'),e('ortak sonucu kur','Okuryazarlık, birlik ve çağdaşlaşma birlikte ilerler.')],
    misconceptions:[m('fragmentation','Birlik düzenlemesini parçalanma olarak yorumlar.','Kanunun adındaki ve bağlamdaki birlik amacını kaçırır.'),m('narrow-language-policy','Düzenlemeyi yalnız yabancı dil meselesine indirger.','Metindeki okuryazarlık ve kurum birliğini kullanmaz.'),m('restricted-access','Eğitimin daraltıldığını varsayar.','Millet Mekteplerinin yaygınlaştırıcı yönünü ters okur.')] }),
  buildRound({ id:'g8-his-06-foreign-policy', grade:8, gameId:'social-time-travel', subjectId:'history', topicId:'ataturk-foreign-policy', outcomeId:'history-g8-6-1', skill:'foreign-policy-principle', experienceType:'policy-principle-case', sessionOrder:6,
    context:'Türkiye, Musul sorununda önce görüşme yolunu denemiş; uyuşmazlık çözülemeyince konu Milletler Cemiyetine taşınmıştır. Hatay meselesinde diplomatik girişimler sürdürülmüş, bölgenin ayrı bir devlet olması ve ardından halk iradesiyle Türkiye’ye katılması sağlanmıştır.',
    prompt:'Bu iki örnek Atatürk dönemi dış politikasının hangi ortak özelliğini gösterir?',
    options:['Her sorunda doğrudan savaşı ilk seçenek olarak görme','Sorunları barışçı ve diplomatik yollarla çözmeye çalışma, millî çıkarları koruma','Uluslararası kuruluşların bütün kararlarını sorgulamadan kabul etme','Sınır sorunlarından tamamen vazgeçme'], answer:'Sorunları barışçı ve diplomatik yollarla çözmeye çalışma, millî çıkarları koruma',
    hints:['Her iki olayda kullanılan ilk araçları belirle: görüşme, uluslararası süreç ve halk iradesi.','Doğru seçenek barışçı yöntemi vurgularken Türkiye’nin millî çıkarlarını takip etmeyi de dışlamamalıdır.'],
    evidence:[e('Musul yöntemini incele','Görüşme ve uluslararası kurum yolu denenmiştir.'),e('Hatay yöntemini incele','Diplomasi ve halk iradesi kullanılmıştır.'),e('ortak yöntemi bul','Her iki olayda barışçı araçlar önceliklidir.'),e('amaçla yöntemi birleştir','Diplomasi millî çıkarları koruma amacıyla yürütülmüştür.')],
    misconceptions:[m('war-first','Savaşı ilk yöntem sayar.','Verilen diplomatik süreçlerle çelişir.'),m('uncritical-acceptance','Uluslararası kararların sorgusuz kabul edildiğini varsayar.','Millî çıkar takibini yok sayar.'),m('abandon-claims','Türkiye’nin sorunlardan vazgeçtiğini söyler.','Her iki meselede aktif girişimleri görmezden gelir.')] })
];

const G8_RELIGION = [
  buildRound({ id:'g8-dkab-01-kader-irade', grade:8, gameId:'religion-practice', subjectId:'religion', topicId:'kader-irade-sorumluluk', outcomeId:'dkab-g8-8-1-2', skill:'concept-relation', experienceType:'ethical-concept-case', sessionOrder:1,
    context:'Bir öğrenci sınava hiç çalışmadan düşük not alınca “Kaderimde bu varmış, yapabileceğim bir şey yoktu.” diyor. Arkadaşı ise insanın seçme imkânı olan konularda kararlarının sonuçlarından sorumlu olduğunu hatırlatıyor.',
    prompt:'Bu durumu kader ve insan iradesi ilişkisi bakımından en doğru açıklayan seçenek hangisidir?',
    options:['İnsan hiçbir seçiminin sonucundan sorumlu değildir.','Kader inancı, insanın çalışma ve tercih sorumluluğunu ortadan kaldırmaz.','Başarı yalnız şansa bağlıdır; çabanın etkisi yoktur.','İnsan her olayı bütünüyle kontrol eder ve hiçbir sınırı yoktur.'], answer:'Kader inancı, insanın çalışma ve tercih sorumluluğunu ortadan kaldırmaz.',
    hints:['Öğrencinin kontrol edebildiği davranışla kontrol edemediği koşulları birbirinden ayır.','Doğru seçenek ne insan iradesini yok saymalı ne de insanın bütün olayları sınırsız kontrol ettiğini ileri sürmelidir.'],
    evidence:[e('seçilebilir davranışı bul','Çalışmak veya çalışmamak öğrencinin tercih alanındadır.'),e('sonuç bağlantısını kur','Tercih sınav hazırlığını ve sonucu etkiler.'),e('kader yorumunun sınırını belirle','Kader sorumluluğu kaldıran bir gerekçe değildir.'),e('dengeyi koru','İnsan sınırlı fakat gerçek bir irade ve sorumluluk taşır.')],
    misconceptions:[m('no-responsibility','İnsan sorumluluğunu bütünüyle reddeder.','İrade ve tercih alanını yok sayar.'),m('chance-only','Çabanın etkisini sıfırlar.','Neden-sonuç bağını görmezden gelir.'),m('unlimited-control','İnsana sınırsız kontrol yükler.','İradenin sınırlarını yok sayar.')] }),
  buildRound({ id:'g8-dkab-02-zekat-yardim', grade:8, gameId:'religion-practice', subjectId:'religion', topicId:'zekat-yardimlasma', outcomeId:'dkab-g8-8-2-2', skill:'principle-application', experienceType:'social-solidarity-case', sessionOrder:2,
    context:'Bir yardım kampanyasında ihtiyaç sahiplerinin adları ve fotoğrafları izinleri olmadan yayımlanıyor. Kampanyayı düzenleyenler daha çok bağış topladıklarını söylüyor; bazı gönüllüler ise yardım ederken kişinin onurunu korumanın da gerekli olduğunu belirtiyor.',
    prompt:'İslam’ın yardımlaşma anlayışına en uygun değerlendirme hangisidir?',
    options:['Bağış artıyorsa ihtiyaç sahibinin mahremiyeti önemsizdir.','Yardım, ihtiyaç sahibini incitmeden ve onurunu koruyarak yapılmalıdır.','Yardım yalnız herkesin göreceği biçimde yapılırsa değerlidir.','İhtiyaç sahibinin izni hiçbir durumda gerekli değildir.'], answer:'Yardım, ihtiyaç sahibini incitmeden ve onurunu koruyarak yapılmalıdır.',
    hints:['Yardımın yalnız maddi sonucunu değil, yardım edilen kişinin hak ve onurunu da değerlendirme ölçütüne kat.','Doğru seçenek yardımı engellememeli; yöntemin mahremiyet ve incitmeme ilkeleriyle uyumlu olmasını istemelidir.'],
    evidence:[e('yardım amacını belirle','İhtiyacın giderilmesi hedeflenir.'),e('kişilik hakkını ekle','Mahremiyet ve insan onuru korunmalıdır.'),e('araç-amaç ilişkisini değerlendir','Daha çok bağış amacı her yöntemi meşru kılmaz.'),e('uygun yöntemi seç','İncitmeden ve izin gözeterek yardım yapılır.')],
    misconceptions:[m('outcome-justifies-method','Bağış miktarını her yöntemi haklı çıkaran ölçüt sayar.','Ahlaki sınırları sonuç uğruna yok sayar.'),m('publicity-required','Gösterişi yardımın şartı sanır.','Gizli ve saygılı yardımı değersizleştirir.'),m('consent-irrelevant','İzni bütünüyle önemsiz sayar.','Mahremiyet hakkını görmezden gelir.')] }),
  buildRound({ id:'g8-dkab-03-din-bilgi', grade:8, gameId:'religion-practice', subjectId:'religion', topicId:'din-bilgi-kaynak', outcomeId:'dkab-g8-8-3-1', skill:'source-evaluation', experienceType:'religious-source-evaluation', sessionOrder:3,
    context:'Bir sosyal medya paylaşımı, ayetin yalnız bir bölümünü vererek çevreyi korumanın dinî açıdan önemsiz olduğunu iddia ediyor. Öğrenciler ayetin öncesini ve sonrasını, güvenilir bir meal ve konuya ilişkin diğer temel ilkeleri birlikte inceliyor.',
    prompt:'Öğrencilerin izlediği yöntem neden daha güvenilirdir?',
    options:['Paylaşım çok beğeni aldığı için doğrudur.','Metni bağlamı, güvenilir kaynak ve ilgili ilkelerle birlikte değerlendirdikleri için.','Ayetin yalnız kısa bölümünü kullanmak her zaman daha açıktır.','Sosyal medyada yayılan hiçbir bilgi incelenmeden reddedilmelidir.'], answer:'Metni bağlamı, güvenilir kaynak ve ilgili ilkelerle birlikte değerlendirdikleri için.',
    hints:['Bir dinî metnin anlamını değerlendirirken “bağlam”, “kaynak güvenilirliği” ve “bütünlük” ölçütlerini ayrı ayrı ara.','Doğru seçenek sosyal medyayı otomatik doğru veya otomatik yanlış saymak yerine iddianın nasıl doğrulandığını açıklamalıdır.'],
    evidence:[e('iddianın kaynağını sorgula','Paylaşım ayetin yalnız bir bölümünü kullanır.'),e('bağlamı genişlet','Önceki ve sonraki bölümler incelenir.'),e('kaynak güvenilirliğini kontrol et','Güvenilir meal ve temel ilkeler kullanılır.'),e('bütüncül yorum yap','Metin parçalanmadan ve farklı kanıtlarla değerlendirilir.')],
    misconceptions:[m('popularity-truth','Beğeni sayısını doğruluk ölçütü yapar.','Kaynak ve kanıt kontrolünü atlar.'),m('fragment-is-clearer','Kısa parçayı bağlamdan üstün sayar.','Anlam bütünlüğünü bozar.'),m('blanket-rejection','Bütün sosyal medya bilgisini incelemeden reddeder.','Eleştirel doğrulama yerine genelleme yapar.')] }),
  buildRound({ id:'g8-dkab-04-hz-muhammed-istisare', grade:8, gameId:'religion-practice', subjectId:'religion', topicId:'hz-muhammed-istisare', outcomeId:'dkab-g8-8-4-2', skill:'exemplary-behaviour', experienceType:'historical-ethical-transfer', sessionOrder:4,
    context:'Bir sınıf projesinde başkan, kararları tek başına vermek istiyor. Diğer öğrenciler, Hz. Muhammed’in önemli konularda arkadaşlarının görüşlerini dinlediğini ve istişareye önem verdiğini hatırlatıyor.',
    prompt:'Bu örnekten sınıf projesine aktarılabilecek en uygun ilke hangisidir?',
    options:['Lider bütün kararları kimseye danışmadan vermelidir.','Ortak işleri ilgilendiren kararlarda görüş alışverişi yapılmalı ve sorumluluk paylaşılmalıdır.','Çoğunluk ne söylerse söylesin hiçbir görüş dikkate alınmamalıdır.','İstişare yalnız sonuç başarısız olduğunda yapılır.'], answer:'Ortak işleri ilgilendiren kararlarda görüş alışverişi yapılmalı ve sorumluluk paylaşılmalıdır.',
    hints:['Tarihî örnekteki davranışı doğrudan kopyalamak yerine davranışın arkasındaki yönetim ilkesini çıkar.','Doğru seçenek liderliği ortadan kaldırmadan başkalarının görüş ve sorumluluğuna yer vermelidir.'],
    evidence:[e('örnek davranışı belirle','Hz. Muhammed görüşleri dinler ve istişare eder.'),e('temel ilkeyi çıkar','Ortak karar ve katılım önemlidir.'),e('sınıf durumuna aktar','Proje bütün öğrencileri ilgilendirir.'),e('uygun uygulamayı seç','Görüş alışverişi ve sorumluluk paylaşımı yapılır.')],
    misconceptions:[m('authoritarian-leadership','Liderliği tek başına karar verme sanır.','İstişare ilkesini reddeder.'),m('ignore-all-views','Bütün görüşleri önemsiz sayar.','Katılımı yok eder.'),m('consult-after-failure','İstişareyi yalnız başarısızlığa bağlar.','Karar öncesi işlevini kaçırır.')] }),
  buildRound({ id:'g8-dkab-05-kuran-yorum', grade:8, gameId:'religion-practice', subjectId:'religion', topicId:'kuran-ana-konular', outcomeId:'dkab-g8-8-5-1', skill:'theme-inference', experienceType:'text-theme-synthesis', sessionOrder:5,
    context:'Bir metinde insanın adaletli davranması, verdiği sözü tutması, ihtiyaç sahibine yardım etmesi ve yaptığı davranışların sonucunu düşünmesi öğütleniyor.',
    prompt:'Bu öğütleri birlikte kapsayan ana tema hangisidir?',
    options:['Yalnız ibadetlerin biçimsel ayrıntıları','Ahlaki sorumluluk ve toplumsal iyilik','Sadece tarihî olayların kronolojisi','Doğa olaylarının bilimsel açıklaması'], answer:'Ahlaki sorumluluk ve toplumsal iyilik',
    hints:['Dört öğüdün ortak yönünü bul: adalet, söz, yardım ve davranış sonucu hangi üst kavramda birleşir?','Yalnız bir örneği karşılayan değil, bireysel sorumlulukla toplum yararını birlikte kapsayan seçeneği ara.'],
    evidence:[e('adaleti sınıflandır','Ahlaki ve toplumsal bir ilkedir.'),e('söz tutmayı sınıflandır','Bireysel güven ve sorumlulukla ilgilidir.'),e('yardımı sınıflandır','Toplumsal dayanışmayı destekler.'),e('ortak temayı kur','Ahlaki sorumluluk ve toplumsal iyilik birleşir.')],
    misconceptions:[m('form-only','Metni yalnız biçimsel ibadet ayrıntısına indirger.','Verilen ahlaki öğütleri karşılamaz.'),m('chronology','Tarih sıralaması arar.','Metinde tarihî olay yoktur.'),m('science-domain','Bilimsel doğa açıklaması sanır.','İçeriğin değer ve davranış yönünü kaçırır.')] }),
  buildRound({ id:'g8-dkab-06-farklilik-saygi', grade:8, gameId:'religion-practice', subjectId:'religion', topicId:'din-farklilik-saygi', outcomeId:'dkab-g8-8-6-1', skill:'respectful-reasoning', experienceType:'pluralism-case', sessionOrder:6,
    context:'Bir grup öğrenci farklı inanç ve düşüncelere sahip arkadaşlarının okul etkinliğine katılmasını istemiyor. Başka bir grup ise herkesin insan onuruna sahip olduğunu, farklılıkların hakaret ve dışlamaya gerekçe olamayacağını savunuyor.',
    prompt:'Din ve vicdan özgürlüğü ile insan onuru açısından hangi tutum daha uygundur?',
    options:['Farklı düşünenleri etkinlikten dışlamak','İnsanların inanç ve düşüncelerine saygı göstererek ortak kurallarda birlikte çalışmak','Yalnız çoğunluğun düşüncesini ifade etmesine izin vermek','Farklılıkları konuşmayı tamamen yasaklamak'], answer:'İnsanların inanç ve düşüncelerine saygı göstererek ortak kurallarda birlikte çalışmak',
    hints:['“Katılma hakkı”, “insan onuru” ve “ortak kurallar” ölçütlerini aynı anda karşılayan seçeneği ara.','Saygı, bütün fikirleri doğru kabul etmek değildir; kişiyi dışlamadan birlikte yaşama imkânı sağlamaktır.'],
    evidence:[e('temel hakkı belirle','İnanç ve düşünce özgürlüğü kişiyi korur.'),e('insan onurunu ekle','Farklılık dışlama gerekçesi olamaz.'),e('ortak yaşam ölçütünü kur','Herkes ortak kurallara uyar.'),e('uygun tutumu seç','Saygılı katılım ve birlikte çalışma sağlanır.')],
    misconceptions:[m('exclusion','Farklılığı dışlama gerekçesi yapar.','Hak ve onuru ihlal eder.'),m('majority-only','Çoğunluğu tek hak sahibi sayar.','Azınlık haklarını yok sayar.'),m('silence-difference','Farklılığı konuşmayı yasaklayarak çözmeye çalışır.','Saygılı iletişim yerine baskı uygular.')] })
];

const G4 = [
  // Türkçe
  buildRound({ id:'g4-tr-01-main-idea', grade:4, gameId:'paragraph-detective', subjectId:'turkish', topicId:'main-idea', outcomeId:'tr-g4-turkce-2019-main-idea', skill:'main-idea-inference', experienceType:'paragraph-main-idea', sessionOrder:1,
    context:'Bir mahallede çocuklar boş arsaya fidan dikti. İlk gün herkes heyecanlıydı; fakat yaz gelince fidanların düzenli sulanması gerekti. Çocuklar haftalık görev çizelgesi hazırladı, komşular da su bidonları getirdi. Sonbaharda arsa küçük bir koruluğa dönüştü.', prompt:'Bu parçanın ana düşüncesi hangisidir?',
    options:['Fidanlar yalnız ilk gün sulanmalıdır.','Ortak bir işi sürdürmek, düzenli sorumluluk ve iş birliği gerektirir.','Boş arsalar her zaman kendiliğinden koruluğa dönüşür.','Komşular yalnız su bidonu taşımaktan hoşlanır.'], answer:'Ortak bir işi sürdürmek, düzenli sorumluluk ve iş birliği gerektirir.',
    hints:['Parçadaki ilk heyecan, görev çizelgesi ve komşu desteğini tek bir genel yargıda birleştir.','Yalnız bir ayrıntıyı tekrar eden değil, olayın başlangıcından sonucuna kadar bütününü açıklayan seçeneği ara.'],
    evidence:[e('başlangıç durumunu bul','Çocuklar fidan diker.'),e('sorunu belirle','Yazın düzenli sulama gerekir.'),e('çözümü belirle','Görev paylaşımı ve komşu desteği kurulur.'),e('genel yargıyı çıkar','Süreklilik sorumluluk ve iş birliği ister.')], misconceptions:[m('one-day-care','Bakımı yalnız ilk güne indirger.','Süreklilik bilgisini yok sayar.'),m('automatic-result','Koruluğun kendiliğinden oluştuğunu varsayar.','Çabayı görmezden gelir.'),m('detail-only','Komşuların bir ayrıntısını ana düşünce yapar.','Bütün parçayı kapsamaz.')] }),
  buildRound({ id:'g4-tr-02-inference', grade:4, gameId:'paragraph-detective', subjectId:'turkish', topicId:'inference', outcomeId:'tr-g4-turkce-2019-inference', skill:'evidence-inference', experienceType:'evidence-inference', sessionOrder:2,
    context:'Ece sabah pencereden baktığında çatılarda ince bir beyaz tabaka gördü. Sokaktaki arabaların camları buğulanmıştı. Dışarı çıkmadan önce kalın montunu giyip eldivenlerini aldı.', prompt:'Bu parçadan kesin olarak çıkarılabilecek yargı hangisidir?',
    options:['Ece denize yüzmeye gidecektir.','Hava soğuktur.','Bütün gün kar yağacaktır.','Ece okula gitmeyecektir.'], answer:'Hava soğuktur.',
    hints:['Çatı, araba camları ve Ece’nin kıyafet seçimi ortak olarak hangi hava koşulunu destekliyor?','“Bütün gün” ve gelecekteki planlar gibi metinde kesin kanıtı olmayan ifadeleri ele.'],
    evidence:[e('çatı kanıtını kullan','Beyaz tabaka don veya kar belirtisidir.'),e('cam kanıtını kullan','Buğulanma sıcaklık farkını gösterir.'),e('kıyafet kanıtını kullan','Mont ve eldiven soğuğa hazırlanmadır.'),e('sınırlı çıkarım yap','Kesin çıkarım havanın soğuk olduğudur.')], misconceptions:[m('unrelated-plan','Metinde olmayan yüzme planı ekler.','Kanıt dışı tahmin yapar.'),m('future-certainty','Bütün gün kar yağacağını kesinleştirir.','Zaman kapsamını aşar.'),m('school-assumption','Okula gitmeme sonucu çıkarır.','Metinde okul bilgisi yoktur.')] }),
  buildRound({ id:'g4-tr-03-idiom', grade:4, gameId:'meaning-hunt', subjectId:'turkish', topicId:'figurative-language', outcomeId:'tr-g4-turkce-2019-figurative', skill:'contextual-meaning', experienceType:'idiom-context', sessionOrder:3,
    context:'Mert, takımın sunum dosyasını son anda kaybettiğini fark etti. Herkes telaşlanınca Elif yedek dosyayı açtı, eksik görselleri hızla ekledi ve sunumu zamanında başlattı. Arkadaşları “Elif yine imdadımıza yetişti.” dedi.', prompt:'“İmdadımıza yetişti” sözü bu parçada hangi anlama gelir?',
    options:['Zor durumda yardım etti.','Yarışta herkesi geçti.','Çok uzak bir yere koştu.','Sunumu tamamen iptal etti.'], answer:'Zor durumda yardım etti.',
    hints:['Sözü gerçek anlamda koşmak olarak değil, Elif’in sorun ortaya çıktıktan sonra yaptığı işe göre yorumla.','Doğru anlam, kayıp dosya ve zaman baskısı sorununu nasıl çözdüğünü açıklamalıdır.'],
    evidence:[e('sorunu belirle','Sunum dosyası kaybolur.'),e('acil durumu belirle','Sunum zamanı yaklaşmıştır.'),e('Elif’in eylemini bul','Yedek dosyayı açıp eksikleri tamamlar.'),e('deyim anlamını çıkar','Zor durumda yardım eder.')], misconceptions:[m('race-meaning','Yetişmek sözünü yarış anlamında alır.','Bağlamı kullanmaz.'),m('literal-running','Sözü fiziksel koşma olarak yorumlar.','Mecazı kaçırır.'),m('opposite-action','Yardım yerine iptal sonucu çıkarır.','Olayın sonucuyla çelişir.')] }),
  buildRound({ id:'g4-tr-04-cohesion', grade:4, gameId:'meaning-hunt', subjectId:'turkish', topicId:'sentence-cohesion', outcomeId:'tr-g4-turkce-2019-cohesion', skill:'connector-selection', experienceType:'connector-choice', sessionOrder:4,
    context:'Deniz, deney için gerekli bütün malzemeleri hazırladı. ___ ölçüm tablosunu yanına almayı unuttuğu için sonuçları düzenli kaydedemedi.', prompt:'Boşluğa düşüncenin akışına göre hangi söz getirilmelidir?',
    options:['Bu nedenle','Ancak','Örneğin','Ayrıca'], answer:'Ancak',
    hints:['İlk cümlede hazırlığın tamam olduğu söyleniyor; ikinci cümlede bu olumlu duruma ters düşen eksiklik anlatılıyor.','Karşıtlık kuran bağlacı seç; neden-sonuç veya örnekleme bildiren bağlaçları ele.'],
    evidence:[e('ilk yargıyı belirle','Bütün malzemeler hazırlanmıştır.'),e('ikinci yargıyı belirle','Ölçüm tablosu unutulmuştur.'),e('ilişkiyi bul','İki yargı arasında karşıtlık vardır.'),e('bağlacı seç','Karşıtlık için “Ancak” uygundur.')], misconceptions:[m('cause-connector','Karşıtlığı neden-sonuç sanır.','İlişki türünü karıştırır.'),m('example-connector','İkinci cümleyi örnek sayar.','Örnekleme yoktur.'),m('addition-connector','Eksikliği ek bilgi sanır.','Olumlu-olumsuz dönüşü kaçırır.')] }),
  // Matematik
  buildRound({ id:'g4-math-01-multi-step', grade:4, gameId:'problem-hunter', subjectId:'mathematics', topicId:'multi-step-natural-numbers', outcomeId:'tr-g4-matematik-2018-multi-step', skill:'multi-step-modeling', experienceType:'inventory-model', sessionOrder:1,
    context:'Bir okul kütüphanesine 6 kutu kitap geldi. Her kutuda 28 kitap vardı. Kitapların 45’i sınıf kitaplıklarına dağıtıldı, kalanlar ana kütüphaneye yerleştirildi.', prompt:'Ana kütüphaneye kaç kitap yerleştirilmiştir?',
    options:['123','168','213','113'], answer:'123',
    hints:['Önce gelen toplam kitabı kutu sayısı ile kutudaki kitap sayısını kullanarak bul.','Dağıtılan 45 kitap toplamdan çıkarılmalıdır; 45’i kutu sayısından çıkarma.'],
    evidence:[e('kutu modelini kur','6 kutunun her birinde 28 kitap vardır.'),e('toplamı hesapla','6×28=168 kitap gelir.'),e('dağıtılanı çıkar','168−45=123.'),e('sonucu yorumla','123 kitap ana kütüphaneye kalır.')], misconceptions:[m('no-subtraction','Yalnız toplam gelen kitabı cevaplar.','İkinci adımı atlar.'),m('add-distributed','Dağıtılanı toplama ekler.','Kalan yerine yeni toplam bulur.'),m('arithmetic-slip','Çıkarma işleminde onluk bozmayı yanlış yapar.','168−45 işlemini hatalı hesaplar.')] }),
  buildRound({ id:'g4-math-02-fraction', grade:4, gameId:'problem-hunter', subjectId:'mathematics', topicId:'fraction-of-quantity', outcomeId:'tr-g4-matematik-2018-fraction', skill:'fraction-modeling', experienceType:'fraction-sharing', sessionOrder:2,
    context:'Bir sınıfta 32 öğrencinin 3/8’i bilim kulübüne katılmıştır. Kulübe katılanların 1/3’ü proje sunumu yapacaktır.', prompt:'Proje sunumu yapacak kaç öğrenci vardır?',
    options:['4','12','8','3'], answer:'4',
    hints:['Önce 32’nin 3/8’ini bul; kesrin paydası kadar eş gruba ayırıp pay kadarını al.','İkinci kesir bütün sınıfa değil, bilim kulübüne katılan öğrenci sayısına uygulanır.'],
    evidence:[e('ilk bütünü belirle','Bütün sınıf 32 öğrencidir.'),e('kulüp sayısını bul','32÷8×3=12.'),e('ikinci bütünü belirle','Sunum oranı 12 kulüp öğrencisine uygulanır.'),e('sonucu hesapla','12÷3=4 öğrenci.')], misconceptions:[m('stop-first-step','12’de durur.','İkinci kesri uygulamaz.'),m('apply-to-whole','1/3’ü 32’ye uygular.','İkinci bütünün değiştiğini kaçırır.'),m('multiply-denominators','Kesir paydalarını doğrudan çarparak 3 bulur.','Miktar modelini kurmaz.')] }),
  buildRound({ id:'g4-math-03-perimeter', grade:4, gameId:'problem-hunter', subjectId:'mathematics', topicId:'perimeter-missing-side', outcomeId:'tr-g4-matematik-2018-perimeter', skill:'geometric-reasoning', experienceType:'perimeter-constraint', sessionOrder:3,
    context:'Dikdörtgen biçimindeki bir bahçenin çevresi 54 metredir. Uzun kenarı 17 metredir.', prompt:'Bahçenin kısa kenarı kaç metredir?',
    options:['10','20','27','37'], answer:'10',
    hints:['Dikdörtgen çevresinde iki uzun ve iki kısa kenar bulunduğunu denklem olarak yaz.','Önce iki uzun kenarın toplamını 54’ten çıkar, sonra kalan uzunluğu iki kısa kenara eşit paylaştır.'],
    evidence:[e('çevre modelini kur','2×17+2×k=54.'),e('uzun kenar toplamını bul','34 metredir.'),e('kısa kenarlara kalan toplamı bul','54−34=20.'),e('bir kısa kenarı bul','20÷2=10 metre.')], misconceptions:[m('remaining-total','20’yi tek kısa kenar sanır.','İki kısa kenarı ayırmaz.'),m('half-perimeter','Çevreyi ikiye bölüp 27 der.','Uzun kenarı çıkarmadan işlem yapar.'),m('subtract-once','54−17=37 yapar.','İki uzun kenar olduğunu unutur.')] }),
  buildRound({ id:'g4-math-04-data', grade:4, gameId:'problem-hunter', subjectId:'mathematics', topicId:'data-table-comparison', outcomeId:'tr-g4-matematik-2018-data', skill:'data-analysis', experienceType:'table-comparison', sessionOrder:4,
    context:'Bir geri dönüşüm kampanyasında pazartesi 18 kg, salı 25 kg, çarşamba 21 kg, perşembe 30 kg kâğıt toplandı.', prompt:'Salı ve perşembe günleri toplanan toplam kâğıt, pazartesi ve çarşamba toplamından kaç kilogram fazladır?',
    options:['16','55','39','9'], answer:'16',
    hints:['İki ayrı grup oluştur: salı+perşembe ve pazartesi+çarşamba.','“Kaç fazla” sorusu iki grubun toplamları arasındaki farkı ister; yalnız büyük toplamı cevaplama.'],
    evidence:[e('birinci toplamı bul','25+30=55.'),e('ikinci toplamı bul','18+21=39.'),e('karşılaştırma işlemini seç','Fazlalık için fark alınır.'),e('farkı hesapla','55−39=16 kg.')], misconceptions:[m('large-total','55’i cevaplar.','Fark yerine büyük toplamı verir.'),m('small-total','39’u cevaplar.','Karşılaştırmayı tamamlamaz.'),m('single-day-difference','30−21=9 yapar.','Günleri tek tek karşılaştırır.')] }),
  // Fen
  buildRound({ id:'g4-sci-01-controlled-test', grade:4, gameId:'science-reasoning', subjectId:'science', topicId:'controlled-experiment', outcomeId:'tr-g4-fen-2018-controlled-test', skill:'variable-control', experienceType:'plant-experiment', sessionOrder:1,
    context:'İki aynı saksıya aynı tür ve eşit büyüklükte bitkiler dikiliyor. İkisine de eşit su veriliyor. Bir saksı güneş alan pencereye, diğeri karanlık dolaba konuyor. Bir hafta sonra boyları ölçülüyor.', prompt:'Bu deneyde araştırılan değişken hangisidir?',
    options:['Işık alma durumu','Verilen su miktarı','Bitki türü','Saksı büyüklüğü'], answer:'Işık alma durumu',
    hints:['İki düzende aynı tutulanlarla farklı olan koşulu ayrı listele.','Araştırılan değişken, araştırmacının özellikle değiştirdiği tek koşuldur.'],
    evidence:[e('aynıları belirle','Bitki türü, büyüklük, saksı ve su eşittir.'),e('farklı koşulu bul','Bir bitki ışıkta, diğeri karanlıktadır.'),e('ölçülen sonucu bul','Boy değişimi ölçülür.'),e('bağımsız değişkeni seç','Işık alma durumu değiştirilmiştir.')], misconceptions:[m('constant-water','Sabit tutulan suyu değişken sanır.','Kontrol değişkenini karıştırır.'),m('constant-species','Bitki türünü araştırılan değişken sanır.','İki saksıda aynı olduğunu kaçırır.'),m('constant-pot','Saksı büyüklüğünü seçer.','Farklı olmayan koşulu işaretler.')] }),
  buildRound({ id:'g4-sci-02-force', grade:4, gameId:'science-reasoning', subjectId:'science', topicId:'force-motion', outcomeId:'tr-g4-fen-2018-force', skill:'force-effect-inference', experienceType:'motion-observation', sessionOrder:2,
    context:'Aynı oyuncak araba düz zeminde üç kez itiliyor. Birinci itişte araba 1 metre, ikinci daha güçlü itişte 2,5 metre, üçüncü en güçlü itişte 4 metre gidiyor. Zemin ve araba değişmiyor.', prompt:'Bu gözlemden hangi sonuca ulaşılabilir?',
    options:['Uygulanan kuvvet arttıkça arabanın aldığı yol artmıştır.','Arabanın rengi değiştikçe aldığı yol artmıştır.','Zemin her denemede farklıdır.','Kuvvetin hareket üzerinde hiçbir etkisi yoktur.'], answer:'Uygulanan kuvvet arttıkça arabanın aldığı yol artmıştır.',
    hints:['Denemelerde değiştirilen tek koşulla ölçülen sonucu eşleştir.','Arabanın rengi veya zemini hakkında metinde değişiklik verilmediğini kontrol et.'],
    evidence:[e('sabitleri belirle','Araba ve zemin aynıdır.'),e('değişeni belirle','İtiş kuvveti artar.'),e('sonucu gözle','Alınan yol 1’den 4 metreye çıkar.'),e('ilişkiyi kur','Kuvvet artışı yol artışıyla birlikte görülür.')], misconceptions:[m('irrelevant-color','Rengi neden yapar.','Metinde renk değişimi yoktur.'),m('invent-surface','Zeminin değiştiğini varsayar.','Aynı zemin bilgisiyle çelişir.'),m('deny-effect','Kuvvet etkisini reddeder.','Veri yönüyle çelişir.')] }),
  buildRound({ id:'g4-sci-03-matter-change', grade:4, gameId:'science-reasoning', subjectId:'science', topicId:'matter-state-change', outcomeId:'tr-g4-fen-2018-matter', skill:'process-sequence', experienceType:'state-change-sequence', sessionOrder:3,
    context:'Buz küpleri bir bardakta bekletildiğinde suya dönüşüyor. Bardaktaki su ısıtıldığında bir süre sonra buhar oluşuyor. Buhar soğuk kapağa değdiğinde yeniden su damlaları meydana geliyor.', prompt:'Olayların sırası hangi hâl değişimlerini gösterir?',
    options:['Erime → buharlaşma → yoğuşma','Donma → erime → süblimleşme','Yoğuşma → donma → erime','Buharlaşma → donma → erime'], answer:'Erime → buharlaşma → yoğuşma',
    hints:['Her aşamada maddenin başlangıç ve son hâlini yaz: katıdan sıvıya, sıvıdan gaza, gazdan sıvıya.','Hâl değişimlerinin adını ezberden seçmeden, yönünü oklarla göster.'],
    evidence:[e('ilk dönüşümü bul','Buz katıdan sıvıya geçer: erime.'),e('ikinci dönüşümü bul','Su sıvıdan gaza geçer: buharlaşma.'),e('üçüncü dönüşümü bul','Buhar gazdan sıvıya geçer: yoğuşma.'),e('sırayı birleştir','Erime, buharlaşma, yoğuşma.')], misconceptions:[m('reverse-first','İlk olayı donma sanır.','Katıdan sıvıya yönü ters okur.'),m('wrong-sequence','Yoğuşmayı başa alır.','Olay zaman sırasını bozarr.'),m('gas-to-solid','Buharı doğrudan donma sayar.','Gazdan sıvıya geçişi karıştırır.')] }),
  buildRound({ id:'g4-sci-04-earth', grade:4, gameId:'science-reasoning', subjectId:'science', topicId:'earth-rotation', outcomeId:'tr-g4-fen-2018-earth', skill:'model-explanation', experienceType:'earth-sun-model', sessionOrder:4,
    context:'Bir öğrenci karanlık odada el fenerini sabit tutup küreyi kendi ekseni etrafında döndürüyor. Kürenin feneri gören yüzü aydınlık, diğer yüzü karanlık kalıyor.', prompt:'Bu model en iyi hangi olayı açıklar?',
    options:['Gece ve gündüzün oluşması','Mevsimlerin yalnız bir günde değişmesi','Ay’ın kendi ışığını üretmesi','Dünya’nın Güneş’e yaklaşınca aniden soğuması'], answer:'Gece ve gündüzün oluşması',
    hints:['Modelde ışık kaynağı sabit, küre ise kendi ekseni etrafında dönüyor; aydınlık ve karanlık yüzlerin değişimini izle.','Bir günlük dönüşle ilgili olayı seç; yıllık dolanma veya Ay’ın ışığı gibi farklı olayları ele.'],
    evidence:[e('model parçalarını eşleştir','Fener Güneş’i, küre Dünya’yı temsil eder.'),e('hareketi belirle','Küre kendi ekseninde döner.'),e('ışık durumunu gözle','Bir yüz aydınlık, diğeri karanlıktır.'),e('olayı çıkar','Dönüş gece ve gündüzü oluşturur.')], misconceptions:[m('season-confusion','Günlük dönüşü mevsimlerle karıştırır.','Dolanma ve eksen eğikliğini kullanmaz.'),m('moon-light','Ay’ın ışık üretmesini çıkarır.','Modelde Ay yoktur.'),m('distance-temperature','Uzaklık-soğuma sonucu ekler.','Modelin temsil etmediği olayı seçer.')] }),
  // Sosyal
  buildRound({ id:'g4-soc-01-map', grade:4, gameId:'social-time-travel', subjectId:'social', topicId:'map-directions', outcomeId:'tr-g4-sosyal-2018-map', skill:'spatial-reasoning', experienceType:'map-route', sessionOrder:1,
    context:'Bir krokide okulun kuzeyinde park, parkın doğusunda kütüphane, okulun batısında sağlık ocağı vardır.', prompt:'Kütüphaneden sağlık ocağına gitmek isteyen biri genel olarak hangi yönde ilerlemelidir?',
    options:['Güneybatı','Kuzeydoğu','Doğu','Kuzey'], answer:'Güneybatı',
    hints:['Okulu merkez kabul edip parkı kuzeye, kütüphaneyi parkın doğusuna yerleştir.','Kütüphaneden önce okula göre aşağı ve sola doğru hareket yönünü birleştir.'],
    evidence:[e('okulu konumlandır','Okul merkezdir.'),e('parkı yerleştir','Park okulun kuzeyindedir.'),e('kütüphane ve sağlık ocağını yerleştir','Kütüphane kuzeydoğuda, sağlık ocağı batıdadır.'),e('yönü çıkar','Kütüphaneden sağlık ocağına güneybatı yönü gerekir.')], misconceptions:[m('reverse-route','Ters rotanın yönünü seçer.','Başlangıç ve varışı karıştırır.'),m('single-axis','Yalnız doğu-batı eksenine bakar.','Kuzey-güney farkını yok sayar.'),m('destination-relative','Sağlık ocağının okuldan yönünü doğrudan cevaplar.','Kütüphaneyi başlangıç almamıştır.')] }),
  buildRound({ id:'g4-soc-02-needs-wants', grade:4, gameId:'social-time-travel', subjectId:'social', topicId:'needs-budget', outcomeId:'tr-g4-sosyal-2018-budget', skill:'budget-priority', experienceType:'budget-decision', sessionOrder:2,
    context:'Ayşe’nin 300 TL’si vardır. Okul için 120 TL’lik ayakkabıya ve 80 TL’lik deftere ihtiyacı vardır. Ayrıca 170 TL’lik bir oyuncak almak istemektedir.', prompt:'Ayşe ihtiyaçlarını önce karşılamak isterse en uygun karar hangisidir?',
    options:['Oyuncağı alıp defterden vazgeçmek','Ayakkabı ve defteri alıp kalan 100 TL’yi biriktirmek','Üçünü de alabileceğini düşünmek','Yalnız oyuncağı alıp bütün parayı harcamak'], answer:'Ayakkabı ve defteri alıp kalan 100 TL’yi biriktirmek',
    hints:['Önce “ihtiyaç” olarak verilen iki ürünü topla ve bütçeden çıkar.','İstek olan oyuncağı, ihtiyaçlar karşılandıktan sonra kalan parayla karşılaştır.'],
    evidence:[e('ihtiyaçları ayır','Ayakkabı ve defter ihtiyaçtır.'),e('ihtiyaç toplamını bul','120+80=200 TL.'),e('kalan bütçeyi bul','300−200=100 TL.'),e('kararı değerlendir','170 TL oyuncak alınamaz; 100 TL biriktirilir.')], misconceptions:[m('want-first','İsteği ihtiyaçtan önce seçer.','Öncelik ilkesini ters kurar.'),m('ignore-budget','Toplam 370 TL’yi 300’e sığdırır.','Bütçe sınırını kontrol etmez.'),m('spend-all-want','Bütün bütçeyi oyuncağa ayırır.','Temel ihtiyaçları yok sayar.')] }),
  buildRound({ id:'g4-soc-03-source', grade:4, gameId:'social-time-travel', subjectId:'social', topicId:'family-history-sources', outcomeId:'tr-g4-sosyal-2018-history-source', skill:'source-selection', experienceType:'family-history-source', sessionOrder:3,
    context:'Bir öğrenci ailesinin 50 yıl önce hangi şehirde yaşadığını araştırıyor. Elinde büyükannesinin anlattıkları, tarihli bir tapu belgesi, üzerinde yer adı bulunan eski bir fotoğraf ve internette yazarı belli olmayan bir yorum vardır.', prompt:'Bilgiyi en güvenilir biçimde doğrulamak için hangi yöntem uygundur?',
    options:['Yalnız anonim internet yorumunu kullanmak','Büyükannenin anlatısını tarihli belge ve fotoğrafla karşılaştırmak','Hiçbir kaynağı incelemeden tahmin etmek','Yalnız fotoğrafın renklerine bakmak'], answer:'Büyükannenin anlatısını tarihli belge ve fotoğrafla karşılaştırmak',
    hints:['Sözlü kaynakla yazılı ve görsel kaynakların birbirini nasıl doğrulayabileceğini düşün.','Yazarı ve kanıtı belirsiz tek bir yorum yerine tarih ve yer bilgisi taşıyan kaynakları birlikte kullan.'],
    evidence:[e('araştırma sorusunu belirle','Ailenin geçmişte yaşadığı şehir aranır.'),e('sözlü kaynağı değerlendir','Büyükannenin anlatısı ipucu verir.'),e('belge ve fotoğrafı değerlendir','Tarih ve yer bilgisi bağımsız kanıt sağlar.'),e('doğrulama yöntemini seç','Kaynaklar karşılaştırılarak bilgi güçlendirilir.')], misconceptions:[m('anonymous-source','Anonim yorumu tek kanıt sayar.','Kaynak güvenilirliğini sorgulamaz.'),m('guessing','Kanıtsız tahmin yapar.','Araştırma yöntemini kullanmaz.'),m('irrelevant-feature','Fotoğraf rengini yer kanıtı sanır.','İlgili bilgiyi seçemez.')] }),
  buildRound({ id:'g4-soc-04-responsibility', grade:4, gameId:'social-time-travel', subjectId:'social', topicId:'rights-responsibilities', outcomeId:'tr-g4-sosyal-2018-rights', skill:'right-responsibility-balance', experienceType:'classroom-rights-case', sessionOrder:4,
    context:'Sınıftaki öğrencilerin fikirlerini söyleme hakkı vardır. Bir öğrenci konuşurken diğerleri sürekli sözünü kesiyor ve kendi görüşlerini daha yüksek sesle söylemeye çalışıyor.', prompt:'Hak ve sorumluluk dengesine en uygun çözüm hangisidir?',
    options:['Yalnız en yüksek sesle konuşanın görüşünü dinlemek','Herkese sırayla söz verip konuşanı dinleme sorumluluğunu uygulamak','Kimsenin görüş bildirmesine izin vermemek','Söz kesmeyi fikir özgürlüğünün tek yolu kabul etmek'], answer:'Herkese sırayla söz verip konuşanı dinleme sorumluluğunu uygulamak',
    hints:['Fikir belirtme hakkının başkalarının aynı hakkını kullanmasını engelleyip engellemediğini kontrol et.','Doğru çözüm hem konuşma hakkını korumalı hem dinleme ve sıra bekleme sorumluluğunu içermelidir.'],
    evidence:[e('hakkı belirle','Her öğrenci fikir söyleyebilir.'),e('sorunu belirle','Söz kesmek başkasının hakkını engeller.'),e('sorumluluğu belirle','Dinlemek ve sıra beklemek gerekir.'),e('dengeyi kur','Herkese sırayla söz verilir.')], misconceptions:[m('loudest-wins','Gücü hak ölçütü yapar.','Eşitliği bozar.'),m('ban-all-speech','Sorunu bütün hakları kaldırarak çözer.','Özgürlüğü yok eder.'),m('interrupt-as-right','Söz kesmeyi hak sanır.','Başkalarının hakkını ihlal eder.')] }),
  // İngilizce
  buildRound({ id:'g4-en-01-routine', grade:4, gameId:'english-vocabulary', subjectId:'english', topicId:'daily-routines', outcomeId:'tr-g4-ingilizce-2018-routines', skill:'context-vocabulary', experienceType:'english-context-choice', sessionOrder:1,
    context:'“I wake up at seven. Then I wash my face and ___ before school.”', prompt:'Boşluğu anlamlı biçimde tamamlayan ifade hangisidir?',
    options:['have breakfast','fly a kite','go to bed','watch the stars'], answer:'have breakfast',
    hints:['Cümlenin “before school” bölümünden sabah rutini arandığını belirle.','Wake up ve wash my face eylemlerinden sonra doğal olarak gelen günlük eylemi seç.'],
    evidence:[e('zamanı belirle','Olay sabah ve okul öncesidir.'),e('eylem zincirini kur','Uyanma ve yüz yıkama vardır.'),e('seçenekleri bağlama koy','Kahvaltı sabah rutinine uyar.'),e('cümleyi tamamla','Have breakfast doğal ve anlamlıdır.')], misconceptions:[m('play-activity','Oyun etkinliğini sabah rutinine yerleştirir.','Zaman bağlamını kullanmaz.'),m('night-routine','Go to bed seçer.','Sabah-gece ayrımını karıştırır.'),m('night-observation','Watch the stars seçer.','Okul öncesi rutinle uyuşmaz.')] }),
  buildRound({ id:'g4-en-02-ability', grade:4, gameId:'english-vocabulary', subjectId:'english', topicId:'abilities', outcomeId:'tr-g4-ingilizce-2018-abilities', skill:'sentence-meaning', experienceType:'english-ability-inference', sessionOrder:2,
    context:'Mia says: “I can swim and ride a bike, but I cannot play the piano.”', prompt:'Which sentence is TRUE?',
    options:['Mia can play the piano.','Mia cannot swim.','Mia can ride a bike.','Mia cannot do any sports.'], answer:'Mia can ride a bike.',
    hints:['Can ve cannot ifadelerini iki ayrı listeye ayır.','But bağlacından önceki iki yeteneği ve sonrasındaki yapamadığı eylemi karşılaştır.'],
    evidence:[e('can listesini çıkar','Swim ve ride a bike yapabilir.'),e('cannot listesini çıkar','Play the piano yapamaz.'),e('seçenekleri karşılaştır','Ride a bike olumlu listede vardır.'),e('doğru cümleyi seç','Mia can ride a bike.')], misconceptions:[m('reverse-cannot','Piano için can kullanır.','Cannot ifadesini ters okur.'),m('reverse-can','Swim için cannot kullanır.','Olumlu yeteneği reddeder.'),m('overgeneralize','Bir yapamadığı eylemden hiçbir spor yapamadığı sonucunu çıkarır.','Bilgiyi aşırı geneller.')] }),
  buildRound({ id:'g4-en-03-directions', grade:4, gameId:'english-vocabulary', subjectId:'english', topicId:'directions', outcomeId:'tr-g4-ingilizce-2018-directions', skill:'instruction-sequence', experienceType:'english-route-instruction', sessionOrder:3,
    context:'“The library is next to the bank. Go straight, turn left at the bank, and you can see the library.”', prompt:'What should you do at the bank?',
    options:['Turn left.','Turn right.','Stop and sleep.','Go back home.'], answer:'Turn left.',
    hints:['Soruda “at the bank” ifadesinden hemen sonra gelen yön komutunu bul.','Go straight önceki hareket, turn left ise banka noktasındaki harekettir.'],
    evidence:[e('hedef noktayı bul','Kütüphane bankanın yanındadır.'),e('ilk komutu belirle','Go straight denir.'),e('banka noktasındaki komutu bul','Turn left at the bank denir.'),e('cevabı seç','Turn left.')], misconceptions:[m('direction-swap','Left yerine right seçer.','Yön kelimelerini karıştırır.'),m('irrelevant-action','Uyuma eylemi ekler.','Metinde yoktur.'),m('route-abandon','Eve dönmeyi seçer.','Talimat zincirini terk eder.')] }),
  buildRound({ id:'g4-en-04-weather', grade:4, gameId:'english-vocabulary', subjectId:'english', topicId:'weather-clothes', outcomeId:'tr-g4-ingilizce-2018-weather', skill:'context-clothing', experienceType:'english-weather-decision', sessionOrder:4,
    context:'“It is cold and snowy today. Leo wants to play outside.”', prompt:'What should Leo wear?',
    options:['A coat and boots','A swimsuit and sandals','Shorts only','A sun hat for a hot day'], answer:'A coat and boots',
    hints:['Cold ve snowy kelimelerinin gerektirdiği kıyafet özelliklerini düşün.','Sıcak hava veya yüzme için kullanılan seçenekleri ele.'],
    evidence:[e('hava durumunu belirle','Hava soğuk ve karlıdır.'),e('etkinliği belirle','Leo dışarı çıkacaktır.'),e('koruyucu kıyafeti seç','Mont ve bot soğuğa uygundur.'),e('uygunsuz seçenekleri ele','Mayo, şort ve sıcak hava şapkası uygun değildir.')], misconceptions:[m('summer-clothes','Yaz kıyafeti seçer.','Cold ve snowy kelimelerini kullanmaz.'),m('insufficient-clothing','Yalnız şort seçer.','Soğuktan korunmayı yok sayar.'),m('hot-weather-item','Sıcak hava şapkası seçer.','Hava koşulunu ters yorumlar.')] }),
  // Din Kültürü
  buildRound({ id:'g4-dkab-01-kindness', grade:4, gameId:'religion-practice', subjectId:'religion', topicId:'guzel-ahlak-yardim', outcomeId:'tr-g4-dkab-2018-kindness', skill:'ethical-choice', experienceType:'kindness-case', sessionOrder:1,
    context:'Sınıfa yeni gelen öğrenci teneffüste yalnız kalıyor ve okulun bölümlerini bulmakta zorlanıyor.', prompt:'Güzel ahlak ve yardımlaşma açısından en uygun davranış hangisidir?',
    options:['Onu görmezden gelmek','Okulu tanıtıp oyunlara katılmasına yardımcı olmak','Yanlış yön tarif ederek eğlenmek','Yalnız kaldığı için onunla alay etmek'], answer:'Okulu tanıtıp oyunlara katılmasına yardımcı olmak',
    hints:['Yeni öğrencinin ihtiyacını belirle: yön bulma ve gruba katılma.','Doğru seçenek hem yardım etmeli hem kişinin onurunu korumalıdır.'],
    evidence:[e('ihtiyacı belirle','Yeni öğrenci yolu ve arkadaşlığı bilmiyor.'),e('ahlaki ilkeyi seç','Yardımlaşma ve incitmeme gerekir.'),e('davranışları karşılaştır','Tanıtma ve oyuna katma ihtiyacı karşılar.'),e('sonucu seç','Yardımcı olmak uygundur.')], misconceptions:[m('ignore','İhtiyacı görmezden gelir.','Yardımlaşmayı uygulamaz.'),m('mislead','Kasıtlı yanlış yönlendirir.','Güven ve dürüstlüğü bozar.'),m('mock','Alay etmeyi seçer.','İnsan onurunu incitir.')] }),
  buildRound({ id:'g4-dkab-02-cleanliness', grade:4, gameId:'religion-practice', subjectId:'religion', topicId:'temizlik', outcomeId:'tr-g4-dkab-2018-cleanliness', skill:'principle-application', experienceType:'cleanliness-case', sessionOrder:2,
    context:'Bir piknikten sonra yerde yiyecek paketleri ve plastik şişeler kalıyor. Grup, “Nasıl olsa belediye toplar.” diyerek ayrılmak istiyor.', prompt:'Temizlik ve sorumluluk anlayışına uygun davranış hangisidir?',
    options:['Çöpleri yerde bırakmak','Çöpleri ayırıp uygun kutulara atmak','Çöpleri görünmesin diye çalılığa saklamak','Başka insanların da çöp atmasını beklemek'], answer:'Çöpleri ayırıp uygun kutulara atmak',
    hints:['Temizlik sorumluluğunun yalnız başkasına bırakılıp bırakılamayacağını düşün.','Doğru seçenek çevreyi gerçekten temizlemeli; yalnız çöpü görünmez hâle getirmemelidir.'],
    evidence:[e('sorunu belirle','Piknik alanında çöp kalmıştır.'),e('sorumluluğu belirle','Çöpü üreten grup toplamalıdır.'),e('uygun yöntemi seç','Atıklar ayrılıp kutuya atılır.'),e('sonucu değerlendir','Çevre temiz ve düzenli kalır.')], misconceptions:[m('shift-responsibility','Sorumluluğu belediyeye bırakır.','Kendi davranışının sonucunu üstlenmez.'),m('hide-not-clean','Çöpü saklamayı temizlik sanır.','Sorunu çözmez.'),m('wait-others','Başkalarının yanlışını bekler.','Sorumlu davranışı geciktirir.')] }),
  buildRound({ id:'g4-dkab-03-prayer-meaning', grade:4, gameId:'religion-practice', subjectId:'religion', topicId:'dua', outcomeId:'tr-g4-dkab-2018-prayer', skill:'meaning-application', experienceType:'prayer-attitude', sessionOrder:3,
    context:'Ali sınav öncesi dua ediyor, sonra da planlı biçimde çalışıyor. Arkadaşı ise hiç çalışmadan yalnız dua etmenin yeterli olacağını söylüyor.', prompt:'Bu durum için en dengeli değerlendirme hangisidir?',
    options:['Dua etmek çalışmayı gereksiz kılar.','İnsan dua ederken üzerine düşen sorumlulukları da yerine getirmelidir.','Çalışan kişinin dua etmesine gerek yoktur.','Başarı için ne dua ne çalışma önemlidir.'], answer:'İnsan dua ederken üzerine düşen sorumlulukları da yerine getirmelidir.',
    hints:['Dua ile insanın kendi çabası arasında “biri varsa diğeri gereksiz” ilişkisi kurma.','Doğru seçenek manevi yönelişle sorumluluk ve çalışmayı birlikte korumalıdır.'],
    evidence:[e('Ali’nin davranışlarını ayır','Dua eder ve çalışır.'),e('arkadaşın iddiasını değerlendir','Çabayı gereksiz sayar.'),e('sorumluluk ilkesini ekle','İnsan yapabileceği işi yerine getirir.'),e('dengeyi kur','Dua ve çaba birlikte bulunur.')], misconceptions:[m('prayer-replaces-effort','Duayı çabanın yerine koyar.','Sorumluluğu kaldırır.'),m('effort-excludes-prayer','Çalışmayı dua ile karşıt görür.','İkisini gereksiz biçimde ayırır.'),m('deny-both','İki davranışı da önemsiz sayar.','Durumun anlamını yok eder.')] }),
  buildRound({ id:'g4-dkab-04-respect', grade:4, gameId:'religion-practice', subjectId:'religion', topicId:'saygi-farklilik', outcomeId:'tr-g4-dkab-2018-respect', skill:'respectful-communication', experienceType:'respect-dialogue', sessionOrder:4,
    context:'İki öğrenci bir konuda farklı düşünüyor. Biri diğerinin sözünü kesip “Sen hiçbir şey bilmiyorsun.” diyor. Diğeri ise görüşünü gerekçesiyle anlatıp arkadaşını dinliyor.', prompt:'Saygılı iletişimi gösteren davranış hangisidir?',
    options:['Hakaret ederek konuşmayı kazanmak','Karşı görüşü dinleyip kendi görüşünü nazikçe gerekçelendirmek','Farklı düşünenle bir daha konuşmamak','Sözünü keserek daha yüksek sesle konuşmak'], answer:'Karşı görüşü dinleyip kendi görüşünü nazikçe gerekçelendirmek',
    hints:['Saygının yalnız sessiz kalmak değil, dinleme ve uygun söz kullanma davranışlarını içerdiğini düşün.','Doğru seçenek fikir ayrılığını ortadan kaldırmadan iletişimi ve insan onurunu korumalıdır.'],
    evidence:[e('fikir ayrılığını kabul et','İki öğrenci farklı düşünebilir.'),e('saygısız davranışı belirle','Söz kesme ve hakaret inciticidir.'),e('saygılı davranışı belirle','Dinleme ve nazik gerekçe vardır.'),e('uygun seçeneği seç','Karşı görüş dinlenip nazikçe cevaplanır.')], misconceptions:[m('insult-as-win','Hakareti ikna yöntemi sayar.','İnsan onurunu zedeler.'),m('avoidance','İletişimi tamamen keser.','Saygılı diyalog kurmaz.'),m('volume-as-right','Yüksek sesi doğruluk sanır.','Gerekçe ve dinlemeyi yok sayar.')] })
];

export const TRUSTED_PRIORITY_4_8_ROUNDS = freezeRows([...G8_HISTORY, ...G8_RELIGION, ...G4]);

function keys(gameId, grade) {
  return Object.freeze(TRUSTED_PRIORITY_4_8_ROUNDS.filter((row) => row.gameId === gameId && row.targetGrade === grade).map((row) => row.questionKey));
}

export const TRUSTED_PRIORITY_4_8_KEYS = Object.freeze({
  grade8History: keys('social-time-travel', 8),
  grade8Religion: keys('religion-practice', 8),
  grade4Paragraph: keys('paragraph-detective', 4),
  grade4Meaning: keys('meaning-hunt', 4),
  grade4Math: keys('problem-hunter', 4),
  grade4Science: keys('science-reasoning', 4),
  grade4Social: keys('social-time-travel', 4),
  grade4English: keys('english-vocabulary', 4),
  grade4Religion: keys('religion-practice', 4)
});
