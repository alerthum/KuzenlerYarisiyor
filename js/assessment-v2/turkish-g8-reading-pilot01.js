import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import {
  auditGrade8TurkishCalibrationQuestion,
  buildGrade8TurkishCalibrationQuestions
} from './turkish-g8-reading-calibration.js';
import { grade8TurkishOutcomeByCode } from '../curriculum/outcomes/tr-g8-turkce-2019.js';

const STYLE_REFERENCE_IDS = Object.freeze([
  'user-ozdebir-paragraph-sample',
  'user-free-chat-question-architecture',
  'phase4b-human-approved-option-balance'
]);

function opt(id, text, { correct = false, support = [], partial = [], contradictions = [], scope = 'preserved', fit = 'full', misconceptionId = null, feedback }) {
  return Object.freeze({
    id, text, correct,
    semanticField: 'same-question-claim-space',
    support: Object.freeze([...support]),
    partialSupport: Object.freeze([...partial]),
    contradictions: Object.freeze([...contradictions]),
    scope,
    claimFit: fit,
    misconceptionId,
    feedback
  });
}

function makeCanonical(spec) {
  const outcome = grade8TurkishOutcomeByCode(spec.outcomeCode);
  if (!outcome) throw new Error(`${spec.id}: outcome not found ${spec.outcomeCode}`);
  const answer = spec.options.find(entry => entry.correct);
  if (!answer) throw new Error(`${spec.id}: correct option missing`);
  const orderedOptions = [...spec.options].sort((left, right) => left.id.localeCompare(right.id));
  return defineCanonicalQuestion({
    id: spec.id,
    curriculum: {
      country: 'TR', schoolYear: '2026-2027', programFamily: 'PRE_TYMM', grade: 8,
      courseId: 'turkce', unitId: outcome.unitId, topicId: outcome.topicId,
      outcomeIds: [outcome.id], sourceIds: [outcome.sourceId]
    },
    construct: spec.construct,
    content: {
      stimulus: spec.stimulus || null,
      stimulusBlocks: spec.stimulusBlocks || null,
      stem: spec.stem,
      options: orderedOptions.map(({ id, text }) => ({ id, text })),
      evidenceMap: spec.evidence,
      optionSemantics: orderedOptions.map(({ feedback, ...entry }) => entry),
      synthesisRequirement: { requiredEvidenceIds: spec.requiredEvidenceIds, singleSentenceSufficient: false },
      humanReview: { status: 'NOT_MEASURED', calibrationBatch: 'GRADE8_TURKISH_PILOT_01_24', gameAdaptationAllowed: false }
    },
    itemFormat: 'single-choice',
    responseModel: { optionIds: orderedOptions.map(entry => entry.id), optionCount: 4 },
    answerKey: { optionId: answer.id, supportingEvidenceIds: answer.support },
    solutionGraph: spec.steps.map((step, index) => ({
      id: `s${index + 1}`,
      action: step.action,
      dependsOn: index === 0 ? [] : [`s${index}`],
      evidenceIds: step.evidenceIds,
      evidence: step.explanation
    })),
    hints: spec.steps.map((step, index) => ({ level: index + 1, text: step.hint, revealsAnswer: false })),
    optionFeedback: orderedOptions.map(entry => ({
      optionId: entry.id,
      correct: entry.correct,
      misconceptionId: entry.misconceptionId,
      text: entry.feedback,
      supportingEvidenceIds: entry.correct ? entry.support : entry.partialSupport,
      contradictionEvidenceIds: entry.contradictions
    })),
    misconceptionIds: spec.options.filter(entry => !entry.correct).map(entry => entry.misconceptionId),
    verifier: {
      solverId: 'tr-g8-pilot-semantic-score-v1',
      independentVerifierId: 'tr-g8-pilot-constraint-intersection-v1',
      verified: true
    },
    styleProfile: spec.style,
    provenance: { generatedFromSourceIds: [outcome.sourceId], styleReferenceIds: STYLE_REFERENCE_IDS },
    contentStatus: 'HUMAN_REVIEW_REQUIRED'
  });
}

const NEW_SPECS = Object.freeze([
  // T.8.3.16 — Konu (3)
  {
    id: 'tr-g8-pilot01-06-city-sound-archive-topic', outcomeCode: 'T.8.3.16',
    construct: { primarySkill: 'topic-identification', secondarySkills: ['detail-grouping', 'scope-control'], cognitiveProcess: 'comprehension', knowledgeComponents: ['topic', 'supporting-detail'], intendedDifficultyBand: 'LGS_MEDIUM' },
    style: { genre: 'kültür-haberi', voice: 'nesnel-anlatıcı', sourceMode: 'özgün-ses-arşivi-yazısı', rhetoricalMoves: ['örnekleme', 'zaman-karşılaştırması'] },
    stimulus: `Bir araştırma ekibi, kentin farklı dönemlerinden kalan ses kayıtlarını aynı harita üzerinde topluyor. Eski vapur düdükleri, sokak satıcılarının çağrıları ve kapanmış atölyelerin makine sesleri bugünkü kayıtlarla yan yana dinlenebiliyor. Ekip, kayıtların yalnız nostalji uyandırmadığını; ulaşım biçimlerinin, çalışma hayatının ve kamusal alanların nasıl değiştiğini de gösterdiğini belirtiyor. Arşive yeni sesler eklenirken kayıt yeri ve tarihi de özellikle korunuyor.`,
    stem: 'Bu parçanın konusu aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Kentin farklı dönemlerine ait sesler haritalanmaktadır.' },
      { id: 'e2', sentence: 2, claim: 'Geçmiş ve günümüz sesleri karşılaştırılmaktadır.' },
      { id: 'e3', sentence: 3, claim: 'Sesler kent yaşamındaki değişimi göstermektedir.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Kent yaşamındaki değişimin, farklı dönemlerden kalan ses kayıtları aracılığıyla izlenmesi', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Parçanın tüm ayrıntıları, ses kayıtlarının kentteki değişimi görünür kılması çevresinde birleşir.' }),
      opt('B', 'Sokak satıcılarının seslerinin günümüzde neden daha az duyulduğunun araştırılması', { partial: ['e2'], scope: 'narrowed', fit: 'partial', misconceptionId: 'detail-as-topic', feedback: 'Sokak satıcıları yalnızca arşivdeki örneklerden biridir; parça bu sesin azalmasının nedenlerine odaklanmaz.' }),
      opt('C', 'Dijital haritaların tarih araştırmalarında sağladığı teknik kolaylıkların değerlendirilmesi', { partial: ['e1'], scope: 'shifted', fit: 'partial', misconceptionId: 'tool-as-topic', feedback: 'Harita bir araçtır; metnin odağı harita teknolojisi değil, seslerin taşıdığı kent belleğidir.' }),
      opt('D', 'Eski ses kayıtlarının insanlarda oluşturduğu nostalji duygusunun açıklanması', { partial: ['e3'], scope: 'narrowed', fit: 'partial', misconceptionId: 'mentioned-effect-as-topic', feedback: 'Nostalji anılır fakat metin, kayıtların bundan daha geniş bir işlev gördüğünü vurgular.' })
    ],
    steps: [
      { action: 'tekrarlanan varlıkları belirle', evidenceIds: ['e1', 'e2'], explanation: 'Parçada farklı dönemlere ait kent sesleri sürekli yinelenir.', hint: 'Metinde hangi tür malzeme tekrar tekrar anılıyor?' },
      { action: 'bu varlıkların hangi amaçla kullanıldığını bul', evidenceIds: ['e3'], explanation: 'Kayıtlar, kent yaşamındaki değişimi izlemek için kullanılır.', hint: 'Ses kayıtları yalnız dinlenmek için mi, yoksa hangi değişimi göstermek için mi toplanıyor?' },
      { action: 'ayrıntıları kapsayan konu ifadesini seç', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Konu, hem ses arşivini hem de bu arşivin kent değişimini göstermesini kapsar.', hint: 'Doğru seçenek hem “ses kayıtları”nı hem de “kentteki değişim”i birlikte taşımalı.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-07-seed-exchange-topic', outcomeCode: 'T.8.3.16',
    construct: { primarySkill: 'topic-identification', secondarySkills: ['example-abstraction', 'scope-control'], cognitiveProcess: 'comprehension', knowledgeComponents: ['topic', 'example'], intendedDifficultyBand: 'LGS_MEDIUM' },
    style: { genre: 'yerel-girişim-yazısı', voice: 'gözlemci-anlatıcı', sourceMode: 'özgün-tohum-takası-metni', rhetoricalMoves: ['örnekleme', 'işlev-açıklama'] },
    stimulus: `Köy meydanında kurulan masalara bu yıl domates, fasulye ve kavun tohumları bırakıldı. Paketlerin üzerinde tohumun yetiştiği yer, sulama biçimi ve kaç yıldır aynı ailede korunduğu yazıyordu. Katılanlar yalnız paket değiş tokuş etmedi; hangi çeşidin kuraklığa dayandığını, hangisinin erken ürün verdiğini de anlattı. Böylece her tohum, yanında onu yaşatan deneyimi de başka bir bahçeye taşıdı.`,
    stem: 'Bu parçada aşağıdakilerin hangisinden söz edilmektedir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Yerel tohumlar paylaşılmaktadır.' },
      { id: 'e2', sentence: 2, claim: 'Tohumların geçmişi ve yetiştirme bilgileri kaydedilmektedir.' },
      { id: 'e3', sentence: 3, claim: 'Katılımcılar üretim deneyimlerini aktarmaktadır.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Kuraklığa dayanıklı sebze çeşitlerinin ticari üretimde yaygınlaştırılmasından', { partial: ['e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'one-property-expanded', feedback: 'Kuraklığa dayanıklılık yalnız aktarılan bilgilerden biridir; ticari üretim metnin konusu değildir.' }),
      opt('B', 'Ailelerin yıllardır sakladıkları tohumların bilimsel laboratuvarlarda incelenmesinden', { partial: ['e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'recording-equals-lab', feedback: 'Tohum geçmişi yazılır ancak laboratuvar incelemesinden söz edilmez.' }),
      opt('C', 'Yerel tohumlarla birlikte bu tohumlara ilişkin yetiştirme bilgisinin paylaşılmasından', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Parça hem tohum değişimini hem de tohumla birlikte deneyimin aktarılmasını anlatır.' }),
      opt('D', 'Köy meydanlarında düzenlenen etkinliklerin üreticiler arasındaki rekabeti artırmasından', { partial: ['e1'], scope: 'reversed', fit: 'unsupported', misconceptionId: 'exchange-as-competition', feedback: 'Etkinlik vardır fakat rekabet değil, paylaşım ve bilgi aktarımı öne çıkar.' })
    ],
    steps: [
      { action: 'olayın merkezindeki nesneyi belirle', evidenceIds: ['e1'], explanation: 'Etkinliğin merkezinde yerel tohumlar bulunur.', hint: 'Meydandaki masalarda ne paylaşılmaktadır?' },
      { action: 'paylaşımın yalnız nesneyle sınırlı olup olmadığını incele', evidenceIds: ['e2', 'e3'], explanation: 'Tohumlarla birlikte yetiştirme bilgisi ve deneyim de aktarılır.', hint: 'Paketlerin üstündeki bilgiler ve katılımcıların anlattıkları neyi gösteriyor?' },
      { action: 'iki yönü de kapsayan konu seçeneğini bul', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Doğru konu, tohum ile deneyim paylaşımını birlikte içerir.', hint: 'Yalnız “tohum” diyen değil, “tohumla birlikte bilgi” diyen seçeneği ara.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-08-night-observation-topic', outcomeCode: 'T.8.3.16',
    construct: { primarySkill: 'topic-identification', secondarySkills: ['detail-unification', 'cause-purpose-distinction'], cognitiveProcess: 'comprehension', knowledgeComponents: ['topic', 'observation-method'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'doğa-gözlem-notu', voice: 'birinci-tekil', sourceMode: 'özgün-gece-gözlemi', rhetoricalMoves: ['kişisel-deneyim', 'yöntem-açıklama'] },
    stimulus: `Gece yürüyüşlerine ilk başladığımda yalnız gördüğüm hayvanların adını yazıyordum. Bir süre sonra ayın evresini, rüzgârın yönünü ve duyduğum sesin saatini de not etmeye başladım. Aynı patikaya farklı gecelerde döndüğümde, bazı canlıların yalnız belirli koşullarda ortaya çıktığını fark ettim. Defterim artık bir tür listesi olmaktan çıkmış, karşılaşmaların hangi şartlarda gerçekleştiğini gösteren bir gözlem kaydına dönüşmüştü.`,
    stem: 'Bu parçanın konusu aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Başlangıçta yalnız tür adları kaydedilmektedir.' },
      { id: 'e2', sentence: 2, claim: 'Çevresel koşullar da kayda eklenmektedir.' },
      { id: 'e3', sentence: 3, claim: 'Koşullar ile canlıların görünmesi arasında ilişki fark edilmektedir.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Aynı patikaya farklı gecelerde dönmenin, canlıların görülme sıklığını karşılaştırmaya katkısı', { partial: ['e1', 'e3'], scope: 'narrowed', fit: 'partial', misconceptionId: 'repeated-route-as-main-topic', feedback: 'Farklı gecelerde aynı patikaya dönmek karşılaştırma olanağı sağlar; ancak parça yalnız görülme sıklığını incelemeye odaklanmaz.' }),
      opt('B', 'Ayın evresi, rüzgâr ve saat bilgisinin gece yürüyüşlerinin planlanmasındaki işlevi', { partial: ['e2', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'recorded-conditions-as-planning-tool', feedback: 'Ay, rüzgâr ve saat kaydedilir; fakat bu bilgiler yürüyüşü planlamak için değil, canlılarla karşılaşma koşullarını anlamak için kullanılır.' }),
      opt('C', 'Gözlem notlarının tür adlarından, canlı davranışlarını sınıflandıran kayıtlara doğru genişlemesi', { partial: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'conditions-as-behaviour-classification', feedback: 'Defter tür listesinden daha kapsamlı hâle gelir; ancak canlı davranışlarını sınıflandırmaz, karşılaşmaların gerçekleştiği koşulları kaydeder.' }),
      opt('D', 'Gözlem kayıtlarının tür adlarıyla birlikte karşılaşma koşullarını içerecek biçimde geliştirilmesi', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Parça, yalnız tür adlarının yazıldığı defterin çevresel koşulları ve karşılaşma bağlamını da içeren bir kayda dönüşmesini anlatır.' })
    ],
    steps: [
      { action: 'defterdeki ilk kayıt biçimini belirle', evidenceIds: ['e1'], explanation: 'İlk kayıtlar yalnız hayvan adlarından oluşur.', hint: 'Anlatıcı başlangıçta defterine yalnız ne yazıyor?' },
      { action: 'sonradan eklenen veri türlerini belirle', evidenceIds: ['e2'], explanation: 'Ay, rüzgâr ve saat gibi koşullar eklenir.', hint: 'Daha sonra hangi çevresel bilgiler kayda katılıyor?' },
      { action: 'değişimin ortak konusunu seç', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Konu, gözlem kaydının koşulları da içerecek biçimde gelişmesidir.', hint: 'Doğru seçenek, tür adları ile çevresel koşulların birlikte kaydedilmesini kapsamalı.' }
    ]
  },

  // T.8.3.17 — Ana düşünce (2 yeni; kalibrasyondaki 1 ile toplam 3)
  {
    id: 'tr-g8-pilot01-09-margin-notes-main-idea', outcomeCode: 'T.8.3.17',
    construct: { primarySkill: 'main-idea-synthesis', secondarySkills: ['contrast-integration', 'author-purpose'], cognitiveProcess: 'analysis-and-synthesis', knowledgeComponents: ['central-claim', 'qualification'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'kişisel-deneme', voice: 'birinci-tekil', sourceMode: 'özgün-okuma-denemesi', rhetoricalMoves: ['itiraf', 'karşıtlık', 'sonuç'] },
    stimulus: `Kitapların kenarına not düşmeye uzun süre cesaret edemedim; sanki basılı cümleye dokunursam ona zarar verecekmişim gibi gelirdi. Sonra yıllar önce okuduğum bir kitabı yeniden açtım ve o zamanki sessizliğimin metinle arama mesafe koyduğunu fark ettim. Şimdi her satırı işaretlemiyorum, yazarın yerine de konuşmuyorum. Yalnızca durduğum, itiraz ettiğim ya da başka bir metni hatırladığım yerlere küçük izler bırakıyorum. Böylece kitap değişmiyor ama benim onunla kurduğum ilişki görünür hâle geliyor.`,
    stem: 'Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Anlatıcı başlangıçta kitaba not yazmaktan kaçınır.' },
      { id: 'e2', sentence: 2, claim: 'Not almamak metinle arasına mesafe koymuştur.' },
      { id: 'e3', sentence: 4, claim: 'Notlar seçici ve metinle diyalog kuran izlerdir.' },
      { id: 'e4', sentence: 5, claim: 'Notlar okurun metinle ilişkisini görünür kılar.' }
    ], requiredEvidenceIds: ['e2', 'e3', 'e4'],
    options: [
      opt('A', 'Kenar notları, metni değiştirmeden okurun düşünsel katılımını ve metinle kurduğu kişisel ilişkiyi görünür kılabilir.', { correct: true, support: ['e2', 'e3', 'e4'], feedback: 'Parçanın vardığı sonuç, seçici notların okur ile metin arasındaki ilişkiyi görünür kılmasıdır.' }),
      opt('B', 'Kitaplara not yazmak, ilk okumada gözden kaçan önemli ayrıntıların sonraki okumada bulunmasını kolaylaştırır.', { partial: ['e2'], scope: 'expanded', fit: 'partial', misconceptionId: 'note-as-memory-tool-only', feedback: 'Yeniden okuma anılır; ancak notların amacı bütün ayrıntıları bulmak değil, okurun tepkisini kaydetmektir.' }),
      opt('C', 'Okur, yazarın düşüncelerine katılmadığı her yerde kendi görüşünü metnin kenarına ayrıntılı biçimde yazmalıdır.', { partial: ['e3'], contradictions: ['e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'selective-note-to-every-disagreement', feedback: 'Anlatıcı her satırı işaretlemediğini ve yazarın yerine konuşmadığını özellikle belirtir.' }),
      opt('D', 'Basılı bir kitaba müdahale etmek metnin bütünlüğünü bozduğu için okuma notları ayrı bir defterde tutulmalıdır.', { partial: ['e1'], contradictions: ['e4'], scope: 'reversed', fit: 'opposite', misconceptionId: 'initial-fear-as-thesis', feedback: 'Bu seçenek anlatıcının başlangıçtaki çekincesini ana düşünce sanır; parça sonunda bu görüş aşılır.' })
    ],
    steps: [
      { action: 'başlangıçtaki çekinceyi belirle', evidenceIds: ['e1'], explanation: 'Anlatıcı kitaba zarar verme korkusuyla not almaktan kaçınır.', hint: 'İlk cümlede anlatıcının hangi çekincesi var?' },
      { action: 'anlatıcının sonradan benimsediği not alma biçimini ayır', evidenceIds: ['e3'], explanation: 'Notlar seçici, ölçülü ve metne verilen tepkileri kaydeden izlerdir.', hint: 'Anlatıcı her yeri mi işaretliyor, yoksa yalnız belirli anlarda mı not düşüyor?' },
      { action: 'parçanın ulaştığı sonucu seç', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Not almak metni değiştirmez; okurun metinle ilişkisini görünür kılar.', hint: 'Doğru seçenek hem “metnin değişmemesi”ni hem de “okurun ilişkisinin görünür olması”nı taşımalı.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-10-nature-photo-main-idea', outcomeCode: 'T.8.3.17',
    construct: { primarySkill: 'main-idea-synthesis', secondarySkills: ['means-end-distinction', 'qualification'], cognitiveProcess: 'analysis-and-synthesis', knowledgeComponents: ['central-claim', 'example-vs-thesis'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'sanatçı-görüşü', voice: 'birinci-tekil-uzman', sourceMode: 'özgün-fotoğrafçı-söyleşisi', rhetoricalMoves: ['karşılaştırma', 'örnekleme', 'öz-değerlendirme'] },
    stimulus: `Doğa fotoğrafçılığında en çok kullanılan ekipmanın fotoğraf makinesi olduğu sanılır. Oysa benim için asıl araç, aynı yere tekrar tekrar gidebilme sabrıdır. İlk gün yalnız bir kuş görürsünüz; beşinci gün onun hangi dalı seçtiğini, rüzgâr çıkınca nasıl yön değiştirdiğini fark edersiniz. Bu bilgi, deklanşöre basacağınız anı kolaylaştırır ama daha önemlisi canlıyı tek bir görüntüye indirgemenizi engeller. İyi fotoğraf, hızlı yakalanmış bir tesadüften çok, uzun süreli dikkatin kısa bir ana sığmasıdır.`,
    stem: 'Bu parçada anlatılmak istenen aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 2, claim: 'Fotoğrafçının asıl aracı sabırlı tekrar gözlemidir.' },
      { id: 'e2', sentence: 3, claim: 'Tekrarlı gözlem canlının davranış örüntülerini gösterir.' },
      { id: 'e3', sentence: 4, claim: 'Bu bilgi hem çekim anını hem canlıyı anlama biçimini geliştirir.' },
      { id: 'e4', sentence: 5, claim: 'İyi fotoğraf uzun süreli dikkatin ürünüdür.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e4'],
    options: [
      opt('A', 'Doğa fotoğrafçısının aynı yere dönmesi, canlıların en sık kullandığı alanları belirleyip çekim süresini kısaltır.', { partial: ['e2', 'e3'], scope: 'narrowed', fit: 'partial', misconceptionId: 'observation-only-for-efficiency', feedback: 'Tekrarlı gözlem çekim anını kolaylaştırır; fakat parça bunu yalnız zaman kazanma yöntemi olarak görmez.' }),
      opt('B', 'Fotoğraf makinesinin teknik özellikleri, doğadaki hızlı hareketleri yakalamada sabırlı gözlem kadar belirleyicidir.', { partial: ['e1'], contradictions: ['e1'], scope: 'shifted', fit: 'partial', misconceptionId: 'equipment-equalized', feedback: 'Parça teknik özellikleri karşılaştırmaz; asıl aracın sabır olduğunu söyleyerek ağırlığı gözleme verir.' }),
      opt('C', 'Canlıların davranışlarını önceden bilmek, fotoğrafçının doğaya müdahale etmeden istediği görüntüyü kurmasını sağlar.', { partial: ['e2'], scope: 'expanded', fit: 'partial', misconceptionId: 'observation-equals-staging', feedback: 'Davranışları tanımak anlatılır; fakat görüntüyü kurmak ya da müdahale etmek metinde yoktur.' }),
      opt('D', 'Nitelikli doğa fotoğrafı, rastlantısal bir anı yakalamaktan çok sabırlı gözlemle edinilen anlayışın görüntüye dönüşmesidir.', { correct: true, support: ['e1', 'e2', 'e4'], feedback: 'Parça iyi fotoğrafı, tekrar gözlem ve uzun süreli dikkat sonucu oluşan kısa bir an olarak tanımlar.' })
    ],
    steps: [
      { action: 'yazarın asıl araç olarak neyi gördüğünü belirle', evidenceIds: ['e1'], explanation: 'Yazar ekipmandan çok sabrı öne çıkarır.', hint: 'Fotoğrafçı, makinenin karşısına hangi “asıl araç”ı koyuyor?' },
      { action: 'tekrarlı gözlemin kazandırdığı şeyi belirle', evidenceIds: ['e2', 'e3'], explanation: 'Gözlem, canlıyı ve davranışını daha iyi anlamayı sağlar.', hint: 'Aynı yere dönmek yalnız çekim anını mı kolaylaştırıyor, canlıyı anlamayı da mı sağlıyor?' },
      { action: 'son cümleyi önceki kanıtlarla birleştir', evidenceIds: ['e1', 'e2', 'e4'], explanation: 'İyi fotoğraf sabır, gözlem ve anlayışın kısa bir ana dönüşmesidir.', hint: 'Doğru seçenek “rastlantı” ile “uzun süreli dikkat” karşıtlığını birlikte kurmalı.' }
    ]
  },

  // T.8.3.18 — Yardımcı fikirler (3)
  {
    id: 'tr-g8-pilot01-11-recipe-notebooks-supporting-ideas', outcomeCode: 'T.8.3.18',
    construct: { primarySkill: 'supporting-idea-identification', secondarySkills: ['evidence-checking', 'negative-stem-control'], cognitiveProcess: 'analysis', knowledgeComponents: ['explicit-detail', 'unsupported-claim'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'kültür-araştırması', voice: 'nesnel-anlatıcı', sourceMode: 'özgün-yemek-defteri-incelemesi', rhetoricalMoves: ['örnekleme', 'yorumlama'] },
    stimulus: `Araştırmacılar, farklı ailelerden kalma eski yemek defterlerini incelerken yalnız malzeme listelerine bakmadı. “Göz kararı”, “hamur kendini bırakınca” gibi ifadelerin yanında kimin tarifinin değiştirildiğini gösteren küçük notları da kaydetti. Bazı ölçüler zamanla standartlaşmış, bazı tarifler ise evde bulunan ürüne göre yeniden biçimlenmişti. Defterler, mutfak bilgisinin değişmeden aktarılan bir kalıp değil; deneyimle sürekli düzenlenen bir ortak hafıza olduğunu gösteriyordu.`,
    stem: 'Bu parçadan aşağıdakilerin hangisine ulaşılamaz?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'İnceleme malzeme listeleriyle sınırlı değildir.' },
      { id: 'e2', sentence: 2, claim: 'Sözlü/pratik ölçüler ve değişiklik notları kaydedilmiştir.' },
      { id: 'e3', sentence: 3, claim: 'Tarifler zaman ve koşullara göre değişmiştir.' },
      { id: 'e4', sentence: 4, claim: 'Mutfak bilgisi ortak ve değişken bir hafızadır.' }
    ], requiredEvidenceIds: ['e1', 'e3', 'e4'],
    options: [
      opt('A', 'Eski tarif defterleri, ailelerin mutfak bilgisini nasıl dönüştürdüğüne ilişkin izler taşır.', { partial: ['e2', 'e3'], scope: 'preserved', fit: 'supported', misconceptionId: 'supported-option-selected-in-negative-stem', feedback: 'Bu yargıya ulaşılır; değişiklik notları ve koşullara göre biçimlenen tarifler bunu destekler.' }),
      opt('B', 'Tariflerdeki bazı ifadeler, ölçünün yalnız sayısal değerlerle aktarılmadığını gösterir.', { partial: ['e2'], scope: 'preserved', fit: 'supported', misconceptionId: 'explicit-detail-overlooked', feedback: '“Göz kararı” ve “hamur kendini bırakınca” ifadeleri bu yargıyı doğrudan destekler.' }),
      opt('C', 'Mutfak bilgisinin aktarımı, hem koruma hem de yeni koşullara uyarlama içerir.', { partial: ['e3', 'e4'], scope: 'preserved', fit: 'supported', misconceptionId: 'synthesis-missed', feedback: 'Bazı ölçülerin standartlaşması ve bazı tariflerin değişmesi, koruma ile uyarlamanın birlikte bulunduğunu gösterir.' }),
      opt('D', 'Standart ölçülerin yaygınlaşması, farklı evlerde hazırlanan tariflerin benzer sonuç vermesini sağlamıştır.', { correct: true, support: ['e1', 'e3', 'e4'], feedback: 'Parçada bazı ölçülerin standartlaştığı söylenir; ancak farklı evlerde aynı sonucun alındığına ilişkin bir karşılaştırma yapılmaz.' })
    ],
    steps: [
      { action: 'metinde açıkça desteklenen ayrıntıları işaretle', evidenceIds: ['e1', 'e2'], explanation: 'İnceleme ölçüler, notlar ve değişiklikleri kapsar.', hint: 'Önce metinde doğrudan karşılığı bulunan üç seçeneği bul.' },
      { action: 'tariflerin değişip değişmediğini belirle', evidenceIds: ['e3'], explanation: 'Tarifler koşullara göre yeniden biçimlenmiştir.', hint: 'Üçüncü cümle, farklılıkların sona erdiğini mi yoksa sürdüğünü mü gösteriyor?' },
      { action: 'metnin söylemediği sonucu seç', evidenceIds: ['e1', 'e3', 'e4'], explanation: 'Bütün farklılıkların ortadan kalktığı sonucu kanıtlanmaz.', hint: '“Bazı ölçüler standartlaştı” bilgisi, “bütün tarifler aynılaştı” sonucunu verir mi?' }
    ]
  },
  {
    id: 'tr-g8-pilot01-12-repair-cafe-supporting-ideas', outcomeCode: 'T.8.3.18',
    construct: { primarySkill: 'supporting-idea-identification', secondarySkills: ['claim-evidence-matching', 'scope-control'], cognitiveProcess: 'analysis', knowledgeComponents: ['explicit-detail', 'inference-boundary'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'toplum-haberi', voice: 'haber-anlatıcısı', sourceMode: 'özgün-tamir-buluşması', rhetoricalMoves: ['olay-anlatımı', 'sonuç-çıkarma'] },
    stimulus: `Mahallede ayda bir kurulan tamir buluşmasına bozulan küçük ev aletleri getiriliyor. Gönüllüler cihazı sahibinin yanında açıyor; hangi parçanın neden bozulduğunu ve güvenli biçimde neyin yapılabileceğini anlatıyor. Her eşya onarılamıyor, fakat onarılamayanlar da doğrudan çöpe gitmiyor; kullanılabilir parçaları ayrılıyor. Etkinliğe gelenlerin bir kısmı sonraki aylarda yalnız eşya getirmek için değil, öğrendiklerini başkalarına aktarmak için de masaya oturuyor.`,
    stem: 'Bu parçadan aşağıdakilerin hangisi çıkarılamaz?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Küçük ev aletleri tamir için getirilmektedir.' },
      { id: 'e2', sentence: 2, claim: 'Tamir süreci sahibine açıklanmaktadır.' },
      { id: 'e3', sentence: 3, claim: 'Onarılamayan eşyalardan parça kazanımı yapılmaktadır.' },
      { id: 'e4', sentence: 4, claim: 'Bazı katılımcılar öğrendiklerini başkasına aktarmaktadır.' }
    ], requiredEvidenceIds: ['e2', 'e3', 'e4'],
    options: [
      opt('A', 'Etkinlik, eşyanın onarılmasının yanında katılımcıların tamir bilgisini paylaşmasına da ortam hazırlar.', { partial: ['e2', 'e4'], scope: 'preserved', fit: 'supported', misconceptionId: 'supported-synthesis-rejected', feedback: 'Gönüllülerin açıklaması ve eski katılımcıların bilgi aktarması bu sonucu destekler.' }),
      opt('B', 'Onarılamayan cihazların bazı parçaları başka kullanımlar için değerlendirilebilir.', { partial: ['e3'], scope: 'preserved', fit: 'supported', misconceptionId: 'explicit-detail-missed', feedback: 'Kullanılabilir parçaların ayrıldığı açıkça belirtilmiştir.' }),
      opt('C', 'Tamir buluşmalarına düzenli katılanlar, zamanla küçük ev aletlerini uzman desteği olmadan onarabilecek yeterliliğe ulaşır.', { correct: true, support: ['e2', 'e3', 'e4'], feedback: 'Bazı katılımcıların öğrendiklerini aktardığı söylenir; herkesin bağımsız onarım yeterliliğine ulaştığına ilişkin veri yoktur.' }),
      opt('D', 'Bazı katılımcılar zamanla yalnız hizmet alan kişi olmaktan çıkıp bilgi aktaran kişiye dönüşür.', { partial: ['e4'], scope: 'preserved', fit: 'supported', misconceptionId: 'role-change-overlooked', feedback: 'Son cümle, bazı katılımcıların daha sonra masaya bilgi aktarmak için oturduğunu söyler.' })
    ],
    steps: [
      { action: 'etkinliğin üç farklı işlevini ayır', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Tamir, parça değerlendirme ve bilgi aktarımı birlikte vardır.', hint: 'Metinde yalnız tamir mi var; öğrenme ve parça değerlendirme de var mı?' },
      { action: 'metnin sınırlamasını fark et', evidenceIds: ['e3'], explanation: 'Her eşyanın onarılamadığı açıkça belirtilir.', hint: 'Üçüncü cümlede etkinliğin başarısı için hangi sınır konuyor?' },
      { action: 'bu sınırı aşan seçeneği bul', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Yeni cihaz ihtiyacının tümden bittiği sonucu metni aşar.', hint: '“Her eşya onarılamıyor” bilgisi hangi seçeneği desteklemez?' }
    ]
  },
  {
    id: 'tr-g8-pilot01-13-bird-tracking-supporting-ideas', outcomeCode: 'T.8.3.18',
    construct: { primarySkill: 'supporting-idea-identification', secondarySkills: ['data-interpretation', 'negative-stem-control'], cognitiveProcess: 'analysis', knowledgeComponents: ['explicit-result', 'limitation'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'bilim-haberi', voice: 'nesnel-bilim-anlatıcısı', sourceMode: 'özgün-kuş-izleme-raporu', rhetoricalMoves: ['yöntem', 'bulgu', 'sınırlama'] },
    stimulus: `Araştırmacılar, göç eden on iki leyleğe hafif vericiler takarak üç yıl boyunca rotalarını izledi. Kuşların çoğu aynı dinlenme alanlarına döndü; ancak kurak geçen yılda iki sulak alan atlanarak daha kuzeydeki alanlar kullanıldı. Vericiler yalnız konumu ve zamanı kaydettiği için kuşların neden rota değiştirdiği doğrudan bilinmiyordu. Ekip, uydu görüntülerindeki su düzeyiyle hareket kayıtlarını karşılaştırarak kuraklığın olası etkisini değerlendirdi.`,
    stem: 'Bu parçadan aşağıdakilerin hangisine ulaşılamaz?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'On iki leylek üç yıl izlenmiştir.' },
      { id: 'e2', sentence: 2, claim: 'Çoğu aynı alanlara dönmüş, kurak yılda bazı alanlar değişmiştir.' },
      { id: 'e3', sentence: 3, claim: 'Verici kayıtları neden bilgisini doğrudan vermez.' },
      { id: 'e4', sentence: 4, claim: 'Kuraklık etkisi başka veriyle karşılaştırılarak değerlendirilmiştir.' }
    ], requiredEvidenceIds: ['e2', 'e3', 'e4'],
    options: [
      opt('A', 'Leyleklerin çoğunun aynı alanlara dönmesi, dinlenme alanı seçiminin çevresel değişimlerden bağımsız olduğunu gösterir.', { correct: true, support: ['e2', 'e3', 'e4'], feedback: 'Çoğu alan tekrar kullanılsa da kurak yılda bazı sulak alanların atlanması, seçimin çevresel koşullardan bağımsız olmadığını gösterir.' }),
      opt('B', 'Hareket kayıtları, kuşların nerede ve ne zaman bulunduğunu göstermiştir.', { partial: ['e1', 'e3'], scope: 'preserved', fit: 'supported', misconceptionId: 'method-detail-missed', feedback: 'Vericilerin konum ve zaman bilgisini kaydettiği açıkça söylenir.' }),
      opt('C', 'Rota değişikliğinin olası nedeni, hareket verileri ile çevresel veriler karşılaştırılarak araştırılmıştır.', { partial: ['e3', 'e4'], scope: 'preserved', fit: 'supported', misconceptionId: 'data-combination-overlooked', feedback: 'Uydu görüntülerindeki su düzeyi ile hareket kayıtları karşılaştırılmıştır.' }),
      opt('D', 'Bazı leylekler kurak geçen yılda önceki yıllardan farklı dinlenme alanları kullanmıştır.', { partial: ['e2'], scope: 'preserved', fit: 'supported', misconceptionId: 'exception-overlooked', feedback: 'İki sulak alanın atlanıp daha kuzeydeki alanların kullanıldığı belirtilmiştir.' })
    ],
    steps: [
      { action: 'normal yıllar ile kurak yılı karşılaştır', evidenceIds: ['e2'], explanation: 'Çoğu rota korunmuş fakat bazı dinlenme alanları değişmiştir.', hint: 'İkinci cümlede hem devamlılık hem de değişiklik var; ikisini ayır.' },
      { action: 'vericinin neyi gösterip neyi göstermediğini belirle', evidenceIds: ['e3'], explanation: 'Konum ve zaman görünür, neden doğrudan görünmez.', hint: 'Verici kuşun kararının nedenini mi, yalnız hareketini mi kaydediyor?' },
      { action: 'metne aykırı mutlak yargıyı seç', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Alanların bütünüyle değişmeden kaldığı söylenemez.', hint: 'Kurak yıldaki iki farklı alan, hangi seçeneği geçersiz kılıyor?' }
    ]
  },

  // T.8.3.23 — Metin karşılaştırma (2 yeni)
  {
    id: 'tr-g8-pilot01-14-translation-cross-text', outcomeCode: 'T.8.3.23',
    construct: { primarySkill: 'cross-text-comparison', secondarySkills: ['perspective-mapping', 'common-topic-different-emphasis'], cognitiveProcess: 'analysis', knowledgeComponents: ['shared-topic', 'distinct-claim'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'iki-görüş-metni', voice: 'iki-uzman', sourceMode: 'özgün-çeviri-tartışması', rhetoricalMoves: ['görüş', 'gerekçelendirme'] },
    stimulusBlocks: [
      `I. Çevirmen: Eski bir romandaki günlük konuşmaları bugünün okuruna bütünüyle yabancı bırakmak, karakterlerin canlılığını azaltabilir. Bu nedenle bazı deyimleri güncel karşılıklarla veririm; fakat dönemin toplumsal ilişkilerini değiştirecek sözcüklerden kaçınırım.`,
      `II. Çevirmen: Metnin yaşı, yalnız olaylarda değil, cümlelerin yürüyüşünde de hissedilir. Okuma biraz yavaşlasa bile bu ritmi korumayı seçerim. Yabancı gelen her ifadeyi güncellemek, eserin zamanla arasındaki bağı zayıflatabilir.`
    ],
    stem: 'Bu iki metinle ilgili aşağıdakilerden hangisi söylenebilir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Birinci çevirmen bazı deyimleri günceller.' },
      { id: 'e2', sentence: 1, claim: 'Birinci çevirmen dönem ilişkilerini korumaya çalışır.' },
      { id: 'e3', sentence: 2, claim: 'İkinci çevirmen eski ritmi ve yabancılığı korur.' },
      { id: 'e4', sentence: 2, claim: 'İkinci çevirmen güncellemenin zaman bağını zayıflatabileceğini düşünür.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'İki çevirmen de metnin tarihsel özelliklerini korumak ister; birincisi seçici güncellemeye, ikincisi dilsel mesafeyi sürdürmeye ağırlık verir.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'Ortak amaç tarihsel yapıyı korumaktır; yöntem ve öncelikler farklıdır.' }),
      opt('B', 'Birinci çevirmen okurun rahatlığını, ikinci çevirmen yazarın anlatımını önemser; bu nedenle amaçları birbiriyle bağdaşmaz.', { partial: ['e1', 'e3'], contradictions: ['e2'], scope: 'polarized', fit: 'partial', misconceptionId: 'difference-as-total-conflict', feedback: 'Öncelikleri farklıdır fakat ikisi de eserin tarihsel niteliğini korumaya çalışır; amaçları bütünüyle zıt değildir.' }),
      opt('C', 'İki çevirmen de eski ifadelerin güncellenmesini gerekli görür; yalnız güncellemenin kapsamı konusunda ayrılır.', { partial: ['e1'], contradictions: ['e3', 'e4'], scope: 'expanded', fit: 'partial', misconceptionId: 'one-view-generalized-to-both', feedback: 'İkinci çevirmen yabancı ifadeleri güncellemek yerine korumayı savunur.' }),
      opt('D', 'Birinci metin çeviride sözcük seçimini, ikinci metin yalnız olay örgüsünün döneme uygunluğunu ele alır.', { partial: ['e1'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'second-text-topic-shift', feedback: 'İkinci metin olay örgüsünü değil, cümle ritmi ve dilsel yabancılığı ele alır.' })
    ],
    steps: [
      { action: 'birinci metnin koruduğu ve değiştirdiği yönleri ayır', evidenceIds: ['e1', 'e2'], explanation: 'Bazı deyimler güncellenir, dönem ilişkileri korunur.', hint: 'Birinci çevirmen neyi güncelliyor, hangi sınırı koruyor?' },
      { action: 'ikinci metnin temel önceliğini belirle', evidenceIds: ['e3', 'e4'], explanation: 'İkinci çevirmen metnin eski ritmini ve zaman bağını korur.', hint: 'İkinci çevirmen okuma yavaşlasa bile hangi özelliği korumayı seçiyor?' },
      { action: 'ortak amaç ile farklı yöntemi birlikte ifade eden seçeneği bul', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'İki görüşün ortaklığı ve ayrılığı birlikte kurulmalıdır.', hint: 'Doğru seçenek “ikisi de korumak istiyor” derken yöntem farkını da göstermeli.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-15-city-park-cross-text', outcomeCode: 'T.8.3.23',
    construct: { primarySkill: 'cross-text-comparison', secondarySkills: ['claim-relation', 'support-vs-qualification'], cognitiveProcess: 'analysis', knowledgeComponents: ['common-concept', 'different-function'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'iki-kısa-makale', voice: 'iki-araştırmacı', sourceMode: 'özgün-kent-parkı-karşılaştırması', rhetoricalMoves: ['bulgu', 'uyarı'] },
    stimulusBlocks: [
      `I. Kent parklarındaki ağaçlık alanlar, sıcak günlerde çevredeki sert yüzeylere göre daha serin bölgeler oluşturur. Bu etki özellikle gölgenin kesintisiz olduğu yürüyüş yollarında belirgindir.`,
      `II. Bir parkın serinletici etkisi yalnız ağaç sayısına bağlı değildir. Ağaçların yerleşimi, toprak yüzeyinin geçirgenliği ve parkın çevresindeki yapı yoğunluğu da bu etkinin mahalleye ne ölçüde yayıldığını değiştirir.`
    ],
    stem: 'Bu iki metin arasındaki ilişki aşağıdakilerin hangisinde doğru verilmiştir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Birinci metin parkların serin alan oluşturduğunu söyler.' },
      { id: 'e2', sentence: 1, claim: 'Gölge sürekliliği etkiyi artırır.' },
      { id: 'e3', sentence: 2, claim: 'İkinci metin serinletmenin çoklu koşullara bağlı olduğunu söyler.' },
      { id: 'e4', sentence: 2, claim: 'Etkinin mahalleye yayılması çevre düzenine göre değişir.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'İkinci metin, birinci metindeki serinletme etkisini reddedip parkların kent sıcaklığı üzerinde belirgin bir rolü olmadığını savunur.', { partial: ['e3'], contradictions: ['e1'], scope: 'reversed', fit: 'opposite', misconceptionId: 'qualification-as-rejection', feedback: 'İkinci metin etkiyi reddetmez; etkinin hangi koşullara bağlı olduğunu ayrıntılandırır.' }),
      opt('B', 'Birinci metin parkların serinletici etkisini açıklar, ikinci metin bu etkinin oluşma ve yayılma koşullarını genişletir.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'İkinci metin birinci bulguyu tamamlar ve etkide rol oynayan ek değişkenleri gösterir.' }),
      opt('C', 'Birinci metin ağaç sayısının önemini, ikinci metin parkların yalnız çevredeki yapı yoğunluğuna göre planlanmasını öne çıkarır.', { partial: ['e1', 'e4'], scope: 'narrowed', fit: 'partial', misconceptionId: 'single-factor-from-multifactor', feedback: 'Birinci metin ağaç sayısını değil gölge alanını; ikinci metin ise yalnız yapı yoğunluğunu değil birden çok koşulu ele alır.' }),
      opt('D', 'İki metin farklı park türlerini karşılaştırarak hangi park düzeninin daha ekonomik olduğunu belirlemeye çalışır.', { partial: ['e2', 'e3'], scope: 'shifted', fit: 'unsupported', misconceptionId: 'physical-effect-to-cost', feedback: 'Metinlerde ekonomik karşılaştırma ya da park türü sınıflaması yoktur.' })
    ],
    steps: [
      { action: 'birinci metnin temel bulgusunu belirle', evidenceIds: ['e1', 'e2'], explanation: 'Park ve gölge serin alan oluşturur.', hint: 'Birinci metin hangi etkiyi ortaya koyuyor?' },
      { action: 'ikinci metnin bu bulguya ne yaptığını belirle', evidenceIds: ['e3', 'e4'], explanation: 'İkinci metin etkiyi koşullara bağlayarak ayrıntılandırır.', hint: 'İkinci metin etkiyi reddediyor mu, yoksa hangi değişkenlere bağlı olduğunu mu açıklıyor?' },
      { action: 'tamamlama ilişkisini seç', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'İkinci metin birincinin bulgusunu genişletir.', hint: 'Doğru seçenek “bulgu + koşullar” ilişkisini kurmalı.' }
    ]
  },

  // T.8.3.25 — Çıkarım (2 yeni)
  {
    id: 'tr-g8-pilot01-16-clockmaker-inference', outcomeCode: 'T.8.3.25',
    construct: { primarySkill: 'supported-inference', secondarySkills: ['action-motive-link', 'detail-synthesis'], cognitiveProcess: 'inference', knowledgeComponents: ['implicit-trait', 'cause-action'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'kısa-anekdot', voice: 'üçüncü-tekil', sourceMode: 'özgün-saatçi-anlatısı', rhetoricalMoves: ['sorun', 'çözüm', 'sonuç'] },
    stimulus: `Saatçi, yüz yıllık duvar saatinin kırılan dişlisini hazır parça kutularında bulamadı. Müşteriye yeni bir mekanizma takmayı önermek yerine eski dişlinin ölçülerini çıkardı, sertliğine yakın bir metal seçti ve parçayı elde biçimlendirdi. Saat çalışmaya başladığında kasadaki çizikleri cilalamadı; “Bunlar mekanizmanın kusuru değil, evde geçirdiği yılların izi.” dedi.`,
    stem: 'Bu parçadan saatçiyle ilgili aşağıdakilerin hangisine ulaşılabilir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Hazır parça bulunamamıştır.' },
      { id: 'e2', sentence: 2, claim: 'Saatçi özgün mekanizmaya uygun parça üretmiştir.' },
      { id: 'e3', sentence: 3, claim: 'Kullanım izlerini tarihsel değer olarak korumuştur.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Eski saatlerin görünümünü yenilemenin, mekanizmayı onarmaktan daha önemli olduğunu düşünmektedir.', { partial: ['e3'], contradictions: ['e3'], scope: 'reversed', fit: 'opposite', misconceptionId: 'surface-over-function', feedback: 'Saatçi çizikleri cilalamaz; görünümü yenilemekten çok işlevi ve tarihsel izi korur.' }),
      opt('B', 'Hazır parça bulunmadığında onarımı bırakmak yerine özgün yapıya uygun çözüm üretmeye ve kullanım izlerini korumaya çalışmaktadır.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Saatçi hem mekanizmaya uygun özel parça üretir hem de geçmişin izlerini silmez.' }),
      opt('C', 'Müşterinin eski eşyaya bağlılığını önemsemese de teknik becerisini göstermek için parçayı kendi üretmiştir.', { partial: ['e2'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'skill-display-as-motive', feedback: 'Parçayı üretmesi teknik beceri gösterir; fakat kullanım izlerini koruması eski eşyaya bağlılığı önemsediğini düşündürür.' }),
      opt('D', 'Yeni mekanizmaların eski saatlerle uyumsuz olduğunu düşündüğü için benzer onarımlarda el yapımı parçayı tercih etmektedir.', { partial: ['e1', 'e2'], scope: 'expanded', fit: 'partial', misconceptionId: 'single-case-generalized', feedback: 'Bu saat için özel parça üretmiştir; benzer bütün onarımlarda aynı tercihi yaptığına ilişkin başka örnek verilmez.' })
    ],
    steps: [
      { action: 'hazır çözüm bulunmadığında saatçinin davranışını belirle', evidenceIds: ['e1', 'e2'], explanation: 'Saatçi özgün ölçülere uygun yeni bir parça üretir.', hint: 'Saatçi hazır parça yokken işi bırakıyor mu, nasıl bir çözüm geliştiriyor?' },
      { action: 'saatin görünümüne yaklaşımını belirle', evidenceIds: ['e3'], explanation: 'Çizikleri kusur değil, yaşanmışlık izi olarak görür.', hint: 'Kasadaki çizikleri neden cilalamıyor?' },
      { action: 'iki davranıştan ortak tutumu çıkar', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Özgün yapıyı ve tarihsel izi koruyan bir onarım anlayışı vardır.', hint: 'Doğru seçenek hem mekanizma çözümünü hem de izleri koruma tutumunu içermeli.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-17-orchestra-rehearsal-inference', outcomeCode: 'T.8.3.25',
    construct: { primarySkill: 'supported-inference', secondarySkills: ['sequence-reasoning', 'group-dynamics'], cognitiveProcess: 'inference', knowledgeComponents: ['implicit-purpose', 'process-result'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'sahne-arkası-anlatısı', voice: 'gözlemci', sourceMode: 'özgün-orkestra-provası', rhetoricalMoves: ['gözlem', 'değişim', 'sonuç'] },
    stimulus: `Şef, prova başında orkestradan eseri çalmamasını istedi. Müzisyenler notaları önlerine aldı; yalnızca birbirlerinin nefes alışlarını, yay kaldırışlarını ve şefin işaretlerini izleyerek bölümü sessizce yürüttü. Ardından aynı yeri çaldıklarında girişler daha az dağıldı, özellikle uzun susuşlardan sonraki başlangıçlar birlikte geldi. Şef, “Bazen sesi düzeltmek için önce sesin çevresindeki hareketi görmek gerekir.” dedi.`,
    stem: 'Bu parçadan aşağıdakilerin hangisi çıkarılabilir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'İlk aşamada ses üretmeden prova yapılmıştır.' },
      { id: 'e2', sentence: 2, claim: 'Müzisyenler görsel ve bedensel işaretleri izlemiştir.' },
      { id: 'e3', sentence: 3, claim: 'Sonraki çalmada eş zamanlılık gelişmiştir.' },
      { id: 'e4', sentence: 4, claim: 'Şef sesi çevreleyen hareketin önemini vurgular.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Sessiz prova, müzisyenlerin bireysel yorumlarını azaltıp eserin her seferinde aynı biçimde çalınmasını sağlar.', { partial: ['e1', 'e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'coordination-equals-uniformity', feedback: 'Eş zamanlılık gelişmiştir; fakat bireysel yorumların azalması ya da her çalımın aynı olması söylenmez.' }),
      opt('B', 'Şefin işaretlerini izlemek, müzisyenlerin nota okumaya duyduğu ihtiyacı zamanla ortadan kaldırabilir.', { partial: ['e2'], scope: 'expanded', fit: 'unsupported', misconceptionId: 'visual-cues-replace-score', feedback: 'Müzisyenlerin notaları önünde tuttuğu belirtilir; işaretler notanın yerini değil, birlikte başlama becerisini destekler.' }),
      opt('C', 'Ortak hareket işaretlerini fark etmek, toplu icrada zamanlamayı ses çıkarmadan da geliştirebilir.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Sessizce izlenen nefes, yay ve şef işaretleri sonraki çalımda girişlerin birleşmesini sağlamıştır.' }),
      opt('D', 'Uzun susuşlar içeren eserler, müzisyenlerin teknik becerilerini ölçmek için diğer eserlerden daha uygundur.', { partial: ['e3'], scope: 'shifted', fit: 'unsupported', misconceptionId: 'example-to-assessment-claim', feedback: 'Uzun susuşlar örnek olarak anılır; eserlerin teknik ölçme değerine ilişkin karşılaştırma yapılmaz.' })
    ],
    steps: [
      { action: 'sessiz provada izlenen ipuçlarını belirle', evidenceIds: ['e1', 'e2'], explanation: 'Müzisyenler ses yerine nefes, yay ve şef işaretlerini izler.', hint: 'Prova sessizken müzisyenler hangi işaretlere odaklanıyor?' },
      { action: 'sonraki çalımda neyin değiştiğini belirle', evidenceIds: ['e3'], explanation: 'Girişler ve susuş sonrası başlangıçlar daha uyumlu olur.', hint: 'Sessiz yürütmeden sonra sesli icrada hangi sorun azalıyor?' },
      { action: 'yöntem ile sonucu birleştir', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Ortak hareketleri görmek zamanlamayı geliştirir.', hint: 'Doğru seçenek “hareket işaretleri” ile “birlikte zamanlama” arasında bağ kurmalı.' }
    ]
  },

  // T.8.3.29 — Medya metinleri (2 yeni)
  {
    id: 'tr-g8-pilot01-18-eco-bottle-media', outcomeCode: 'T.8.3.29',
    construct: { primarySkill: 'media-message-analysis', secondarySkills: ['claim-evidence-gap', 'selective-framing'], cognitiveProcess: 'evaluation', knowledgeComponents: ['advertising-claim', 'missing-comparison'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'reklam-incelemesi', voice: 'medya-okuru', sourceMode: 'özgün-eko-şişe-reklamı', rhetoricalMoves: ['iddia', 'veri-seçimi', 'karşılaştırma'] },
    stimulusBlocks: [
      `Reklam: “Yeni Terra şişe, önceki modelimize göre üretimde yüzde 30 daha az plastik kullanır. Her yudumda doğaya daha hafif bir iz bırakın.”`,
      `Ürün bilgisinde şişenin kapağı ve dış ambalajı hesaba katılmadan yalnız gövde ağırlığının karşılaştırıldığı; ürünün kaç kez kullanılabileceğine ilişkin test yapılmadığı belirtilmektedir.`
    ],
    stem: 'Bu reklamla ilgili aşağıdaki değerlendirmelerden hangisi en uygundur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Reklam önceki modele göre daha az plastik iddiası taşır.' },
      { id: 'e2', sentence: 2, claim: 'Karşılaştırma yalnız şişe gövdesini kapsar.' },
      { id: 'e3', sentence: 2, claim: 'Yeniden kullanım ömrü test edilmemiştir.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('D', 'Yüzde 30 ifadesi gövde ağırlığına dayanır; reklam bu sınırlı karşılaştırmayı ürünün toplam çevresel etkisini temsil edecek biçimde genişletmektedir.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Veri yalnız gövde plastiğini kapsarken reklam bunu genel çevresel iz iddiasına dönüştürür.' }),
      opt('B', 'Önceki modele göre daha az plastik kullanılması, kapağın ve ambalajın aynı miktarda plastik içerdiğini düşündürmektedir.', { partial: ['e1', 'e2'], scope: 'shifted', fit: 'unsupported', misconceptionId: 'omitted-data-assumed-equal', feedback: 'Kapağın ve ambalajın miktarı verilmediği için aynı kaldıkları sonucu çıkarılamaz.' }),
      opt('C', 'Ürünün kullanım ömrü ölçülmediği için gövdede yüzde 30 daha az plastik kullanıldığı bilgisi de geçersiz kabul edilmelidir.', { partial: ['e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'one-limitation-erases-other-data', feedback: 'Kullanım ömrünün bilinmemesi çevresel yorumun kapsamını sınırlar; gövde ağırlığı karşılaştırmasını geçersiz kılmaz.' }),
      opt('A', 'Reklam, ürünün önceki modelden daha hafif olduğunu açıklar; çevresel yarar konusunda tüketiciye ayrıca bir çıkarım sunmaz.', { partial: ['e1'], contradictions: ['e1'], scope: 'narrowed', fit: 'partial', misconceptionId: 'persuasive-framing-ignored', feedback: '“Doğaya daha hafif iz” sözü, veriyi çevresel yarar mesajına dönüştüren ikna edici bir çıkarımdır.' })
    ],
    steps: [
      { action: 'reklamın kullandığı sayısal iddiayı belirle', evidenceIds: ['e1'], explanation: 'Yüzde 30 azalma önceki modele göre ileri sürülür.', hint: 'Reklam hangi sayısal karşılaştırmayı öne çıkarıyor?' },
      { action: 'ürün bilgisindeki kapsam sınırlarını ayır', evidenceIds: ['e2', 'e3'], explanation: 'Veri yalnız gövdeyi kapsar ve kullanım ömrü bilinmez.', hint: 'Karşılaştırmaya hangi parçalar ve hangi kullanım bilgisi dâhil edilmemiş?' },
      { action: 'veri ile reklam mesajı arasındaki genişlemeyi değerlendir', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Sınırlı plastik verisi toplam çevresel etki iddiasına taşınır.', hint: 'Doğru seçenek, “ölçülen şey” ile “reklamın ima ettiği şey” arasındaki farkı göstermeli.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-19-exhibition-poster-media', outcomeCode: 'T.8.3.29',
    construct: { primarySkill: 'media-message-analysis', secondarySkills: ['audience-targeting', 'omission-analysis'], cognitiveProcess: 'evaluation', knowledgeComponents: ['poster-purpose', 'selective-presentation'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'afiş-incelemesi', voice: 'medya-okuru', sourceMode: 'özgün-müze-afişi', rhetoricalMoves: ['slogan', 'görsel-seçim', 'bilgi-eksiltme'] },
    stimulusBlocks: [
      `Afişin üstünde karanlık bir koridorda parlayan tek bir maske görülüyor. Altında “Yasaklı Törenler: Hiç anlatılmayan geceyi görmeye hazır mısın?” sloganı yer alıyor.`,
      `Müzenin ayrıntılı açıklamasında serginin farklı toplumların mevsim geçişi törenlerini ele aldığı, “yasaklı” sözcüğünün yalnız iki eserin geçmişte kısa süre sergilenmemesine gönderme yaptığı yazıyor.`
    ],
    stem: 'Bu afişin medya mesajıyla ilgili aşağıdakilerden hangisi söylenebilir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Afiş karanlık ve gizemli görsel kullanır.' },
      { id: 'e2', sentence: 1, claim: 'Slogan yasak ve bilinmeyen duygusunu öne çıkarır.' },
      { id: 'e3', sentence: 2, claim: 'Serginin asıl kapsamı mevsim geçişi törenleridir.' },
      { id: 'e4', sentence: 2, claim: 'Yasaklılık yalnız iki esere ilişkin sınırlı bir durumdur.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'Afiş, sergideki törenleri ayrıntılı biçimde tanıttığını göstermek için tek bir maskeyi merkezde kullanmıştır.', { partial: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'single-image-as-complete-summary', feedback: 'Tek maske ayrıntılı kapsam sunmaz; daha çok gizem duygusu oluşturur.' }),
      opt('B', 'Slogan, yalnız iki esere ait sınırlı bir özelliği serginin geneline yayarak merak ve gizem duygusunu güçlendirmektedir.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: '“Yasaklı” çerçevesi serginin genel konusundan daha geniş gösterilerek dikkat çekici bir mesaj kurulmuştur.' }),
      opt('C', 'Afiş ile ayrıntılı açıklama aynı bilgileri farklı uzunluklarda verir; aralarında vurgu bakımından belirgin bir ayrım yoktur.', { partial: ['e2', 'e3'], contradictions: ['e4'], scope: 'flattened', fit: 'partial', misconceptionId: 'framing-difference-ignored', feedback: 'Afiş yasak ve gizemi büyütürken açıklama asıl kapsamı ve sınırlamayı gösterir.' }),
      opt('D', 'Müze, sergideki eserlerin geçmişte sergilenmediğini gizlediği için afişte yalnız mevsim geçişlerini öne çıkarmıştır.', { partial: ['e3', 'e4'], contradictions: ['e2'], scope: 'reversed', fit: 'opposite', misconceptionId: 'poster-emphasis-reversed', feedback: 'Afiş mevsim geçişlerini değil, “yasaklı” ve “hiç anlatılmayan” söylemini öne çıkarır.' })
    ],
    steps: [
      { action: 'afişin oluşturduğu duyguyu belirle', evidenceIds: ['e1', 'e2'], explanation: 'Karanlık görsel ve slogan gizem ile yasak duygusu kurar.', hint: 'Görsel ve slogan izleyicide hangi beklentiyi oluşturuyor?' },
      { action: 'ayrıntılı açıklamanın gerçek kapsamını belirle', evidenceIds: ['e3', 'e4'], explanation: 'Sergi mevsim törenlerini kapsar; yasaklılık iki eserle sınırlıdır.', hint: '“Yasaklı” sözcüğü serginin tamamını mı, yalnız kaç eseri mi ilgilendiriyor?' },
      { action: 'sınırlı özelliğin nasıl genelleştirildiğini seç', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Afiş sınırlı durumu genel merak unsuruna dönüştürür.', hint: 'Doğru seçenek, afişin hangi bilgiyi büyüterek dikkat çektiğini açıklamalı.' }
    ]
  },

  // T.8.3.31 — Kaynak güvenilirliği (2 yeni)
  {
    id: 'tr-g8-pilot01-20-historical-photo-source', outcomeCode: 'T.8.3.31',
    construct: { primarySkill: 'source-reliability-evaluation', secondarySkills: ['provenance-check', 'cross-source-verification'], cognitiveProcess: 'evaluation', knowledgeComponents: ['original-source', 'caption-verification'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'dijital-doğrulama-vakası', voice: 'araştırmacı-anlatıcı', sourceMode: 'özgün-tarihî-fotoğraf-vakası', rhetoricalMoves: ['iddia', 'kaynak-izleme', 'karşılaştırma'] },
    stimulus: `Bir paylaşımda, kalabalık bir istasyon fotoğrafının 1923'te yeni başkente taşınan memurları gösterdiği yazıyordu. Paylaşım binlerce kez aktarılmış, fakat fotoğrafçının adı ve arşiv numarası verilmemişti. Görsel arama yapan bir öğrenci, aynı fotoğrafı bir demiryolu müzesinin dijital arşivinde buldu. Arşiv kaydında fotoğrafın 1937'de başka bir şehirdeki bayram yolculuğu sırasında çekildiği, negatif numarası ve fotoğrafçısı ile birlikte belirtiliyordu.`,
    stem: 'Bu bilginin güvenilirliğini değerlendiren öğrencinin aşağıdakilerden hangisini yapması en uygundur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Sosyal medya paylaşımı tarih ve olay iddiası taşır.' },
      { id: 'e2', sentence: 2, claim: 'Paylaşımda kaynak ve arşiv bilgisi yoktur.' },
      { id: 'e3', sentence: 3, claim: 'Fotoğraf kurumsal arşivde bulunmuştur.' },
      { id: 'e4', sentence: 4, claim: 'Arşiv kaydı farklı tarih/yer ve izlenebilir kayıt bilgisi sunar.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'Paylaşım çok sayıda kişi tarafından aktarıldığı için tarih bilgisini koruyup yalnız fotoğrafçının adını arşiv kaydından eklemelidir.', { partial: ['e1', 'e3'], contradictions: ['e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'popularity-over-provenance', feedback: 'Aktarım sayısı iddiayı doğrulamaz; arşiv kaydı tarih ve yer bilgisinin de yanlış olduğunu gösterir.' }),
      opt('B', 'Müze arşivi kurumsal olduğu için kayıt açıklamasını başka hiçbir belgeyle karşılaştırmadan kesin sonuç olarak kabul etmelidir.', { partial: ['e3', 'e4'], scope: 'expanded', fit: 'partial', misconceptionId: 'authority-without-crosscheck', feedback: 'Kurumsal ve izlenebilir kayıt daha güçlüdür; yine de gerekirse başka kaynaklarla karşılaştırılabilir, “hiçbir karşılaştırma gerekmez” sonucu doğru değildir.' }),
      opt('C', 'Sosyal medya iddiası ile arşiv kaydının tarih, yer ve kaynak bilgilerini karşılaştırıp paylaşımın açıklamasının desteklenmediğini belirtmelidir.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'Öğrenci iddiayı, izlenebilir arşiv kaydıyla karşılaştırarak tarih ve yer uyuşmazlığını gösterir.' }),
      opt('D', 'İki açıklama birbiriyle çeliştiği için fotoğrafın hangi döneme ait olduğunun hiçbir yöntemle belirlenemeyeceğini söylemelidir.', { partial: ['e1', 'e4'], scope: 'collapsed', fit: 'partial', misconceptionId: 'conflict-means-unknowable', feedback: 'Çelişki vardır; ancak arşiv numarası, negatif ve fotoğrafçı bilgisi araştırılabilir bir kanıt zinciri sunar.' })
    ],
    steps: [
      { action: 'ilk paylaşımın kaynak eksiklerini belirle', evidenceIds: ['e1', 'e2'], explanation: 'İddia vardır fakat kaynak bilgisi yoktur.', hint: 'İlk paylaşımda fotoğrafı doğrulayacak hangi bilgiler eksik?' },
      { action: 'arşiv kaydının sağladığı doğrulanabilir bilgileri belirle', evidenceIds: ['e3', 'e4'], explanation: 'Tarih, yer, negatif ve fotoğrafçı bilgisi bulunur.', hint: 'Müze kaydı yalnız farklı bir açıklama mı veriyor, yoksa izlenebilir kayıt bilgileri de sunuyor mu?' },
      { action: 'iki kaynağı karşılaştıran değerlendirmeyi seç', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Güvenilirlik kaynak zinciri ve bilgi uyuşması üzerinden değerlendirilir.', hint: 'Doğru seçenek popülerliğe değil, iki kaydın tarih-yer-kaynak karşılaştırmasına dayanmalı.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-21-water-test-source', outcomeCode: 'T.8.3.31',
    construct: { primarySkill: 'source-reliability-evaluation', secondarySkills: ['sampling-evaluation', 'method-comparison'], cognitiveProcess: 'evaluation', knowledgeComponents: ['sample-scope', 'measurement-method'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'yerel-haber-doğrulaması', voice: 'sorgulayıcı-anlatıcı', sourceMode: 'özgün-su-testi-vakası', rhetoricalMoves: ['iddia', 'yöntem-karşılaştırma', 'sınırlama'] },
    stimulus: `Bir mahalle grubunda, ev tipi renk şeridiyle yapılan tek ölçümün fotoğrafı paylaşılarak “Bölgenin şebeke suyu içilemez durumda.” denildi. Ölçümün hangi musluktan, ne zaman ve şeritlerin son kullanma tarihi kontrol edilerek yapılıp yapılmadığı belirtilmedi. Belediyenin laboratuvar raporunda ise aynı hafta farklı sokaklardan alınan sekiz örneğin yöntemi, ölçüm belirsizliği ve sonuçları yayımlandı; değerlerin yasal aralıkta olduğu, iki noktada tadı etkileyebilecek fakat sağlık sınırını aşmayan farklılık görüldüğü açıklandı.`,
    stem: 'Bu iki kaynağın güvenilirliğiyle ilgili aşağıdaki değerlendirmelerden hangisi en uygundur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Tek ev tipi ölçümden tüm bölgeye genelleme yapılmıştır.' },
      { id: 'e2', sentence: 2, claim: 'İlk ölçümün koşulları ve araç geçerliliği belirsizdir.' },
      { id: 'e3', sentence: 3, claim: 'Laboratuvar birden çok örnek ve açık yöntem sunar.' },
      { id: 'e4', sentence: 3, claim: 'Rapor sağlık sınırı ile tat farklılığını ayırır.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'Ev tipi test doğrudan musluk suyunu ölçtüğü için laboratuvar raporundan daha güncel ve mahalleyi temsil etmeye daha uygundur.', { partial: ['e1'], contradictions: ['e2', 'e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'directness-over-method', feedback: 'Tek ölçümün koşulları belirsizdir ve mahalleyi temsil etmez; güncellik tek başına yöntem kalitesinin yerini tutmaz.' }),
      opt('B', 'Laboratuvar raporu daha çok örnek ve yöntem bilgisi sunduğundan daha güçlüdür; yine de yalnız raporlanan hafta ve örnekleme noktaları için değerlendirilmelidir.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'Çoklu örnek ve açık yöntem güvenilirliği artırır; sonuçların zaman ve örnekleme kapsamı da korunur.' }),
      opt('C', 'İki kaynakta farklı sonuç bulunduğu için suyun güvenliği konusunda ikisinin de aynı ölçüde güvenilir olduğu kabul edilmelidir.', { partial: ['e1', 'e3'], scope: 'flattened', fit: 'partial', misconceptionId: 'all-conflicting-sources-equal', feedback: 'Kaynaklar yöntem, örnek sayısı ve şeffaflık bakımından eşit değildir.' }),
      opt('D', 'Laboratuvar iki noktada tat farklılığı bildirdiğine göre mahalle paylaşımındaki “içilemez” sonucu yöntem ayrıntısı olmasa da doğrulanmıştır.', { partial: ['e4'], contradictions: ['e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'taste-equals-health-risk', feedback: 'Rapor tat farklılığını sağlık sınırının aşılmasıyla eşitlemez; ikisini açıkça ayırır.' })
    ],
    steps: [
      { action: 'ilk kaynağın örnek ve yöntem sorunlarını belirle', evidenceIds: ['e1', 'e2'], explanation: 'Tek ölçüm tüm bölgeye genellenmiş ve koşullar açıklanmamıştır.', hint: 'İlk paylaşım kaç ölçüme dayanıyor ve ölçüm koşulları biliniyor mu?' },
      { action: 'laboratuvar raporunun kanıt gücünü belirle', evidenceIds: ['e3', 'e4'], explanation: 'Birden çok örnek, açık yöntem ve ölçülü sonuç vardır.', hint: 'İkinci kaynak örnek sayısı, yöntem ve sonuç ayrımı bakımından ne sunuyor?' },
      { action: 'güçlü kaynağı seçerken kapsam sınırını koru', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Laboratuvar güçlüdür fakat belirli hafta ve noktalara dayanır.', hint: 'Doğru seçenek hem neden daha güvenilir olduğunu hem de hangi kapsamla sınırlı olduğunu belirtmeli.' }
    ]
  },

  // T.8.3.32 — Grafik, tablo, çizelge yorumlama (3)
  {
    id: 'tr-g8-pilot01-22-library-table', outcomeCode: 'T.8.3.32',
    construct: { primarySkill: 'table-interpretation', secondarySkills: ['multi-column-comparison', 'unsupported-causality-control'], cognitiveProcess: 'analysis', knowledgeComponents: ['table-row', 'trend-comparison'], intendedDifficultyBand: 'LGS_MEDIUM_HIGH' },
    style: { genre: 'veri-tablosu', voice: 'nesnel', sourceMode: 'özgün-kütüphane-tablosu', rhetoricalMoves: ['tablo', 'karşılaştırma'] },
    stimulusBlocks: [
      `Bir ilçe kütüphanesinin üç aylık kayıtları şöyledir:`,
      `Ay | Ziyaretçi | Ödünç kitap | Etkinlik katılımı\nNisan | 1.200 | 760 | 180\nMayıs | 1.450 | 740 | 320\nHaziran | 1.100 | 690 | 410`
    ],
    stem: 'Tablodaki bilgilere göre aşağıdakilerden hangisi söylenebilir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Mayıs ziyaretçi sayısı en yüksektir.' },
      { id: 'e2', sentence: 1, claim: 'Ödünç kitap sayısı her ay azalmıştır.' },
      { id: 'e3', sentence: 1, claim: 'Etkinlik katılımı her ay artmıştır.' },
      { id: 'e4', sentence: 1, claim: 'Haziran ziyaretçisi azalırken etkinlik katılımı artmıştır.' }
    ], requiredEvidenceIds: ['e2', 'e3', 'e4'],
    options: [
      opt('A', 'Ziyaretçi sayısının en yüksek olduğu ayda ödünç kitap sayısı da diğer aylardan yüksektir.', { partial: ['e1'], contradictions: ['e2'], scope: 'preserved', fit: 'partial', misconceptionId: 'maxima-assumed-same-column', feedback: 'Mayıs ziyaretçide en yüksek olsa da ödünç kitap sayısı nisanda daha yüksektir.' }),
      opt('B', 'Etkinlik katılımındaki artış, her ay kütüphaneye gelen toplam ziyaretçi sayısını da artırmıştır.', { partial: ['e3'], contradictions: ['e4'], scope: 'causal', fit: 'partial', misconceptionId: 'parallel-trend-assumed', feedback: 'Etkinlik katılımı artarken haziranda toplam ziyaretçi azalır; ayrıca tablo neden-sonuç göstermez.' }),
      opt('D', 'Ödünç kitap sayısı azalırken etkinlik katılımı artmış, bu iki göstergenin aylık yönü birbirinden ayrılmıştır.', { correct: true, support: ['e2', 'e3', 'e4'], feedback: 'Üç ay boyunca ödünç kitap sayısı düşerken etkinlik katılımı yükselir.' }),
      opt('C', 'Hazirandaki etkinliklerin niteliği, daha az ziyaretçiyle daha fazla katılım sağlandığını göstermektedir.', { partial: ['e4'], scope: 'expanded', fit: 'unsupported', misconceptionId: 'quantity-to-quality', feedback: 'Sayılar etkinlik katılımını gösterir; etkinliklerin niteliği hakkında bilgi vermez.' })
    ],
    steps: [
      { action: 'her sütunun aylık yönünü ayrı belirle', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Ziyaretçi dalgalı, ödünç kitap azalan, etkinlik katılımı artan yöndedir.', hint: 'Üç sütunu birbirine karıştırmadan nisan-mayıs-haziran sırasıyla incele.' },
      { action: 'aynı yönde gitmeyen iki göstergiyi bul', evidenceIds: ['e2', 'e3'], explanation: 'Ödünç kitap ile etkinlik katılımı ters yönlerde değişir.', hint: 'Hangi sütun sürekli azalırken hangisi sürekli artıyor?' },
      { action: 'nedensellik ya da nitelik eklemeyen seçeneği seç', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Doğru seçenek yalnız tablodaki yönleri karşılaştırır.', hint: 'Tablo sayıları verir; neden ya da kalite açıklayan seçeneklerden kaçın.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-23-school-garden-chart', outcomeCode: 'T.8.3.32',
    construct: { primarySkill: 'chart-interpretation', secondarySkills: ['ratio-aware-comparison', 'condition-control'], cognitiveProcess: 'analysis', knowledgeComponents: ['before-after', 'category-comparison'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'karşılaştırmalı-çizelge', voice: 'nesnel', sourceMode: 'özgün-okul-bahçesi-verisi', rhetoricalMoves: ['önce-sonra', 'kategori-karşılaştırması'] },
    stimulusBlocks: [
      `Okul bahçesinde iki sulama yöntemi dört eşit büyüklükte alanda denenmiştir. Haftalık su kullanımı (litre):`,
      `Alan | Bitki türü | Eski yöntem | Damla sulama\n1 | Domates | 420 | 260\n2 | Biber | 380 | 250\n3 | Domates | 410 | 270\n4 | Biber | 390 | 240`
    ],
    stem: 'Çizelgedeki verilere göre aşağıdakilerden hangisine ulaşılabilir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Alanlar eşit büyüklüktedir.' },
      { id: 'e2', sentence: 1, claim: 'Her alanda damla sulama daha az su kullanmıştır.' },
      { id: 'e3', sentence: 1, claim: 'En büyük azalma Alan 1 dedir: 160 litre.' },
      { id: 'e4', sentence: 1, claim: 'Bitki türü aynı olsa da kullanım değerleri birebir aynı değildir.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e4'],
    options: [
      opt('A', 'Damla sulama bütün alanlarda su kullanımını azaltmış, aynı bitki türündeki alanlarda bile tasarruf miktarı değişmiştir.', { correct: true, support: ['e1', 'e2', 'e4'], feedback: 'Dört alanda da azalma vardır ve aynı bitki türlerinde azalma miktarları eşit değildir.' }),
      opt('B', 'Domates alanlarında damla sulama, biber alanlarına göre her durumda daha fazla su tasarrufu sağlamıştır.', { partial: ['e3', 'e4'], scope: 'expanded', fit: 'partial', misconceptionId: 'category-generalization', feedback: 'Alan 1 yüksek tasarruf gösterse de Alan 3 ile biber alanları karşılaştırıldığında “her durumda” sonucu çıkmaz.' }),
      opt('C', 'Eski yöntemde en çok su kullanılan alan, damla sulamada da en çok su kullanılan alan olarak kalmıştır.', { partial: ['e3'], contradictions: ['e4'], scope: 'preserved', fit: 'partial', misconceptionId: 'rank-preservation-assumed', feedback: 'Eski yöntemde Alan 1 en yüksekken damla sulamada Alan 3 en yüksektir.' }),
      opt('D', 'Alanlar eşit büyüklükte olduğundan su kullanımındaki bütün farklılıklar yalnız bitki türünden kaynaklanmaktadır.', { partial: ['e1', 'e4'], scope: 'causal', fit: 'unsupported', misconceptionId: 'equal-area-single-cause', feedback: 'Eşit alan karşılaştırmayı kolaylaştırır; fakat yöntem dışındaki bütün koşulların aynı olduğu belirtilmez.' })
    ],
    steps: [
      { action: 'her satırda eski ve yeni değeri karşılaştır', evidenceIds: ['e2'], explanation: 'Damla sulama dört alanda da daha düşük değer verir.', hint: 'Her satırda üçüncü ve dördüncü sütunlardan hangisi daha küçük?' },
      { action: 'aynı bitki türündeki alanların farklarını karşılaştır', evidenceIds: ['e4'], explanation: 'Domates ve biber çiftlerinde değerler birebir aynı değildir.', hint: 'Alan 1 ile 3, Alan 2 ile 4 aynı tasarruf miktarını mı gösteriyor?' },
      { action: 'verinin gösterdiği iki sonucu birlikte seç', evidenceIds: ['e1', 'e2', 'e4'], explanation: 'Genel azalma ile alanlar arası değişkenlik birlikte görülür.', hint: 'Doğru seçenek hem bütün alanlardaki azalmayı hem de tasarruf miktarlarının değişmesini taşımalı.' }
    ]
  },
  {
    id: 'tr-g8-pilot01-24-audio-guide-table', outcomeCode: 'T.8.3.32',
    construct: { primarySkill: 'table-interpretation', secondarySkills: ['percentage-vs-count', 'group-comparison'], cognitiveProcess: 'analysis', knowledgeComponents: ['sample-size', 'percentage'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'anket-tablosu', voice: 'nesnel', sourceMode: 'özgün-müze-anketi', rhetoricalMoves: ['örneklem', 'oran-karşılaştırması'] },
    stimulusBlocks: [
      `Bir müze, sesli rehber kullanan ziyaretçilere “Anlatım süresi uygun muydu?” sorusunu yöneltmiştir. Tablonun ikinci sütunu her yaş grubunda ankete katılan toplam kişi sayısını, üçüncü sütunu ise bu katılımcılar arasında “uygun” yanıtını verenlerin oranını göstermektedir.`,
      `Yaş grubu | Ankete katılan toplam kişi sayısı (kişi) | Bu grupta “uygun” diyenlerin oranı (%)
12-17 yaş | 80 | 65
18-35 yaş | 150 | 58
36-55 yaş | 100 | 72
56+ yaş | 50 | 76`
    ],
    stem: 'Tablodaki bilgilere göre aşağıdaki yorumlardan hangisi doğrudur?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Grupların katılımcı sayıları farklıdır.' },
      { id: 'e2', sentence: 1, claim: 'En yüksek oran 56+ grubundadır.' },
      { id: 'e3', sentence: 1, claim: 'En çok “uygun” yanıtı yaklaşık 87 kişiyle 18-35 grubundadır.' },
      { id: 'e4', sentence: 1, claim: 'En büyük örneklem 18-35 grubudur fakat oranı en düşüktür.' }
    ], requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'En yüksek uygunluk oranına sahip grup, katılımcı sayısı en fazla olduğu için toplam olumlu yanıtta da ilk sıradadır.', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'percentage-equals-count', feedback: '56+ grubunun oranı en yüksek olsa da katılımcı sayısı düşüktür; olumlu yanıt sayısı yaklaşık 38 dir.' }),
      opt('B', '18-35 yaş grubundaki olumlu yanıt sayısı, 36-55 ve 56+ gruplarındaki olumlu yanıtların toplamından fazladır.', { partial: ['e1', 'e4'], contradictions: ['e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'large-sample-always-largest-count', feedback: '18-35 grubunda yaklaşık 87 olumlu yanıt vardır; 36-55 ve 56+ gruplarının toplamı yaklaşık 110 olduğu için bu yargı doğru değildir.' }),
      opt('C', 'Katılımcı sayıları farklı olduğu için grupların uygunluk oranları karşılaştırılamaz.', { partial: ['e1'], scope: 'collapsed', fit: 'partial', misconceptionId: 'unequal-sample-blocks-percentage-comparison', feedback: 'Oranlar farklı büyüklükteki grupları karşılaştırmak için kullanılabilir; yalnız kişi sayısıyla karıştırılmamalıdır.' }),
      opt('D', '56+ grubu en yüksek orana sahipken toplam olumlu yanıt sayısında daha büyük örneklemli grupların gerisinde kalabilir.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'Yüksek yüzde, küçük örneklem nedeniyle en yüksek kişi sayısı anlamına gelmez; yaklaşık 38 olumlu yanıt vardır.' })
    ],
    steps: [
      { action: 'oran ile katılımcı sayısını ayrı oku', evidenceIds: ['e1', 'e2'], explanation: 'En yüksek yüzde, en büyük örneklem değildir.', hint: 'Yüzde sütunu ile katılımcı sayısı sütununu birbirine karıştırma.' },
      { action: 'yaklaşık olumlu yanıt sayılarını hesapla', evidenceIds: ['e3', 'e4'], explanation: 'Yüzde, grup büyüklüğüyle çarpılarak kişi sayısı bulunur.', hint: 'Örneğin 56+ grubu için 50 × %76 yaklaşık kaç kişi eder?' },
      { action: 'yüksek oran ile toplam sayı farkını ifade eden seçeneği seç', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: '56+ oran olarak önde, kişi sayısı olarak daha geridedir.', hint: 'Doğru seçenek “en yüksek yüzde” ile “en çok kişi”nin aynı şey olmadığını göstermeli.' }
    ]
  }
]);

const ACCEPTED_ITEMS = buildGrade8TurkishCalibrationQuestions();
const NEW_ITEMS = Object.freeze(NEW_SPECS.map(makeCanonical));
const PILOT_ITEMS = Object.freeze([...ACCEPTED_ITEMS, ...NEW_ITEMS]);

export const GRADE8_TURKISH_PILOT01_PREVIOUS_REVIEW_IDS = Object.freeze([
  'tr-g8-reading-calibration-01-restoration-main-idea',
  'tr-g8-reading-calibration-02-contextual-word-inference',
  'tr-g8-reading-calibration-03-museum-label-cross-text',
  'tr-g8-reading-calibration-04-language-app-media-analysis',
  'tr-g8-reading-calibration-05-blue-light-source-reliability',
  'tr-g8-pilot01-06-city-sound-archive-topic',
  'tr-g8-pilot01-10-nature-photo-main-idea',
  'tr-g8-pilot01-11-recipe-notebooks-supporting-ideas',
  'tr-g8-pilot01-15-city-park-cross-text',
  'tr-g8-pilot01-17-orchestra-rehearsal-inference',
  'tr-g8-pilot01-22-library-table',
  'tr-g8-pilot01-23-school-garden-chart'
]);

export const GRADE8_TURKISH_PILOT01_FRESH_REVIEW_IDS = Object.freeze([
  'tr-g8-pilot01-07-seed-exchange-topic',
  'tr-g8-pilot01-08-night-observation-topic',
  'tr-g8-pilot01-09-margin-notes-main-idea',
  'tr-g8-pilot01-12-repair-cafe-supporting-ideas',
  'tr-g8-pilot01-13-bird-tracking-supporting-ideas',
  'tr-g8-pilot01-14-translation-cross-text',
  'tr-g8-pilot01-16-clockmaker-inference',
  'tr-g8-pilot01-18-eco-bottle-media',
  'tr-g8-pilot01-19-exhibition-poster-media',
  'tr-g8-pilot01-20-historical-photo-source',
  'tr-g8-pilot01-21-water-test-source',
  'tr-g8-pilot01-24-audio-guide-table'
]);

function semanticScore(entry, requiredEvidenceIds) {
  const required = new Set(requiredEvidenceIds);
  const covered = entry.support.filter(id => required.has(id)).length;
  const penalties = entry.contradictions.length * 5 + (entry.scope === 'preserved' ? 0 : 3) + (entry.claimFit === 'full' ? 0 : 3);
  return covered * 3 - penalties;
}

function solve(item) {
  const required = item.content.synthesisRequirement.requiredEvidenceIds;
  const ranked = item.content.optionSemantics
    .map(entry => ({ id: entry.id, score: semanticScore(entry, required) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  if (ranked.length < 2 || ranked[0].score === ranked[1].score) throw new Error(`${item.id}: solver ambiguity`);
  return Object.freeze({ optionId: ranked[0].id, score: ranked[0].score });
}

function verify(item, solved) {
  const required = new Set(item.content.synthesisRequirement.requiredEvidenceIds);
  const accepted = item.content.optionSemantics.filter(entry =>
    entry.claimFit === 'full' && entry.scope === 'preserved' && entry.contradictions.length === 0
    && [...required].every(id => entry.support.includes(id))
  );
  return accepted.length === 1 && accepted[0].id === solved.optionId && solved.optionId === item.answerKey.optionId;
}

export function buildGrade8TurkishPilot01Questions() {
  return PILOT_ITEMS;
}

export function grade8TurkishPilot01QuestionById(id) {
  return PILOT_ITEMS.find(item => item.id === id) || null;
}

export function auditGrade8TurkishPilot01Catalog(items = PILOT_ITEMS) {
  const itemAudits = items.map(item => ({ id: item.id, ...auditGrade8TurkishCalibrationQuestion(item) }));
  const errors = itemAudits.flatMap(row => row.errors.map(error => `${row.id}:${error}`));
  const outcomeCounts = new Map();
  for (const item of items) {
    const outcomeId = item.curriculum.outcomeIds[0];
    outcomeCounts.set(outcomeId, (outcomeCounts.get(outcomeId) || 0) + 1);
  }
  const answerCounts = Object.fromEntries(['A', 'B', 'C', 'D'].map(id => [id, items.filter(item => item.answerKey.optionId === id).length]));
  if (items.length !== 24) errors.push(`catalog:item-count:${items.length}`);
  if (outcomeCounts.size !== 8) errors.push(`catalog:outcome-count:${outcomeCounts.size}`);
  for (const [outcomeId, count] of outcomeCounts) if (count !== 3) errors.push(`catalog:outcome-distribution:${outcomeId}:${count}`);
  for (const [optionId, count] of Object.entries(answerCounts)) if (count !== 6) errors.push(`catalog:answer-distribution:${optionId}:${count}`);
  const genreCount = new Set(items.map(item => item.styleProfile.genre)).size;
  const sourceModeCount = new Set(items.map(item => item.styleProfile.sourceMode)).size;
  if (genreCount < 16) errors.push(`catalog:genre-diversity:${genreCount}`);
  if (sourceModeCount < 20) errors.push(`catalog:source-mode-diversity:${sourceModeCount}`);
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      itemCount: items.length,
      outcomeCount: outcomeCounts.size,
      questionsPerOutcome: Object.freeze(Object.fromEntries(outcomeCounts)),
      answerCounts: Object.freeze(answerCounts),
      genreCount,
      sourceModeCount,
      humanReviewStatus: 'NOT_MEASURED',
      gameAdaptationAllowed: false,
      productReady: false
    }),
    itemAudits: Object.freeze(itemAudits)
  });
}

export const grade8TurkishPilot01Engine = defineSubjectEngine({
  id: 'tr-g8-turkish-reading-pilot01-engine-v1',
  domain: 'reading-turkish',
  supportedCourseIds: ['turkce'],
  supportedItemFormats: ['single-choice'],
  misconceptionCatalogId: 'tr-g8-reading-pilot01-misconceptions-v1',
  styleCatalogId: 'tr-g8-reading-pilot01-styles-v1',
  plan: request => {
    const item = grade8TurkishPilot01QuestionById(request.questionId);
    if (!item) throw new Error(`unknown pilot question ${request.questionId}`);
    return Object.freeze({ questionId: item.id, curriculumRoute: request.curriculumRoute });
  },
  generate: plan => structuredClone(grade8TurkishPilot01QuestionById(plan.questionId)),
  solve,
  verifyIndependent: verify,
  explain: item => item.solutionGraph,
  qualityAudit: auditGrade8TurkishCalibrationQuestion
});

export const GRADE8_TURKISH_PILOT01_IDS = Object.freeze(PILOT_ITEMS.map(item => item.id));
