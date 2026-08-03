import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { auditGrade8TurkishCalibrationQuestion } from './turkish-g8-reading-calibration.js';
import { grade8TurkishOutcomeByCode } from '../curriculum/outcomes/tr-g8-turkce-2019.js';

const STYLE_REFERENCE_IDS = Object.freeze([
  'user-approved-grade8-turkish-option-balance-standard',
  'user-approved-grade8-turkish-full-scope-standard'
]);

function opt(id, text, {
  correct = false,
  support = [],
  partial = [],
  contradictions = [],
  scope = 'preserved',
  fit = 'full',
  misconceptionId = null,
  feedback
}) {
  return Object.freeze({
    id,
    text,
    correct,
    semanticField: 'item-specific-shared-field',
    support: Object.freeze([...support]),
    partialSupport: Object.freeze([...partial]),
    contradictions: Object.freeze([...contradictions]),
    scope,
    claimFit: fit,
    misconceptionId,
    feedback
  });
}

const SPECS = Object.freeze([
  {
    id: 'tr-g8-wave2-01-visual-title-prediction',
    outcomeCode: 'T.8.3.12',
    construct: { primarySkill: 'visual-title-topic-prediction', secondarySkills: ['multimodal-clue-integration', 'scope-control'], cognitiveProcess: 'prediction-from-evidence', knowledgeComponents: ['title', 'visual-detail', 'topic-boundary'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'afis-on-izleme', voice: 'kamusal-duyuru', sourceMode: 'ozgun-onarim-atolyesi-afisi', rhetoricalMoves: ['baslik', 'gorsel-simge', 'alt-bilgi'] },
    stimulusBlocks: [
      `Başlık: “ATMA, ONAR!”`,
      `Görsel betimi: Uzun bir masada farklı yaşlardan insanlar; bozuk bir masa lambasını, fermuarı kopmuş bir çantayı ve çalışmayan bir radyoyu birlikte onarıyor. Masanın yanında “Yedek parça paylaşım kutusu” bulunuyor.`,
      `Alt bilgi: “Cumartesi 11.00 — Kullanılmayan eşyana ikinci bir yaşam ver.”`
    ],
    stem: 'Bu başlık ve görselden hareketle metnin aşağıdaki konulardan hangisiyle ilgili olması beklenir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Başlık eşyayı atmak yerine onarmayı önerir.' },
      { id: 'e2', sentence: 2, claim: 'İnsanlar farklı eşyaları birlikte onarır ve parça paylaşır.' },
      { id: 'e3', sentence: 3, claim: 'Amaç kullanılmayan eşyaya yeniden kullanım olanağı sağlamaktır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Bozulan eşyaların ortak çalışma ve parça paylaşımıyla yeniden kullanıma kazandırılması', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Başlık, ortak onarım sahnesi ve “ikinci yaşam” ifadesi aynı konuya yönelir: eşyayı atmak yerine onarıp yeniden kullanmak.' }),
      opt('B', 'Ev araçlarında sık görülen arızaların güvenli biçimde sınıflandırılması ve kayıt altına alınması', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'repair-scene-read-as-technical-catalogue', feedback: 'Görselde arızalı eşyalar vardır; ancak afiş arıza türlerini sınıflandırmayı değil, eşyaları birlikte onarıp yeniden kullanmayı amaçlar.' }),
      opt('C', 'Geleneksel el becerilerinin kuşaklar arasında aktarılması için düzenlenen meslek tanıtımları', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'mixed-age-group-read-as-vocation-training', feedback: 'Farklı yaşların birlikte çalışması bu yorumu çağrıştırabilir; fakat meslek tanıtımı veya geleneksel zanaat bilgisi verilmemiştir.' }),
      opt('D', 'Kullanılmayan eşyaların bağışlanmadan önce ekonomik değerlerine göre ayrılması', { partial: ['e2', 'e3'], contradictions: ['e1'], scope: 'shifted', fit: 'partial', misconceptionId: 'reuse-read-as-sorting-for-donation', feedback: 'Eşyaların yeniden değerlendirilmesi ortak noktadır; ancak afişte bağış veya ekonomik değer sıralaması değil, doğrudan onarım anlatılır.' })
    ],
    steps: [
      { action: 'başlığın önerdiği temel eylemi belirle', evidenceIds: ['e1'], explanation: '“Atma, onar” karşıtlığı metnin merkezini belirler.', hint: 'Başlık okuyucuya hangi iki davranış arasında seçim yaptırıyor?' },
      { action: 'görseldeki ortak etkinliği belirle', evidenceIds: ['e2'], explanation: 'İnsanlar eşyaları birlikte onarıyor ve yedek parça paylaşıyor.', hint: 'Masadaki kişiler eşyaları inceliyor mu, satıyor mu, onarıyor mu?' },
      { action: 'alt bilginin amacıyla konuyu sınırla', evidenceIds: ['e3'], explanation: 'İkinci yaşam, yeniden kullanım fikrini doğrular.', hint: 'Alt bilgi, eşyanın hangi sonuca ulaşmasını istiyor?' }
    ]
  },
  {
    id: 'tr-g8-wave2-02-cartoon-attention',
    outcomeCode: 'T.8.3.27',
    construct: { primarySkill: 'cartoon-message-interpretation', secondarySkills: ['symbol-reading', 'contrast-integration'], cognitiveProcess: 'multimodal-inference', knowledgeComponents: ['visual-contrast', 'caption', 'implicit-criticism'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'karikatur', voice: 'elestirel-mizah', sourceMode: 'ozgun-dijital-dikkat-karikaturu', rhetoricalMoves: ['karsitlik', 'simge', 'ironi'] },
    stimulusBlocks: [
      `Karikatür betimi: Bir genç, saksıdaki solmuş çiçeğin yanına oturmuş; elindeki telefonu sulama kabı gibi tutarak ekrana dokunuyor. Telefon ekranında “Bugün 6 saat çevrim içiydin.” bildirimi var.`,
      `Çiçeğin yanındaki gerçek sulama kabı dolu olduğu hâlde yerde duruyor. Karikatürün altında “İlgilenmek ile meşgul olmak aynı şey değil.” yazıyor.`
    ],
    stem: 'Bu karikatürde asıl eleştirilen durum aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Genç gerçek çiçek yerine telefonla meşguldür.' },
      { id: 'e2', sentence: 1, claim: 'Çevrim içi süre altı saattir.' },
      { id: 'e3', sentence: 2, claim: 'Gerçek bakım aracı kullanılmadan durur ve altyazı ilgi ile meşguliyeti ayırır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Dijital araçların bitki bakımıyla ilgili yanlış yöntemleri yaygınlaştırması', { partial: ['e1'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'literal-phone-as-watering-tool', feedback: 'Telefonun sulama kabı gibi tutulması gerçek bir bakım önerisi değil, dikkatin yanlış yere yönelmesini anlatan görsel bir benzetmedir.' }),
      opt('B', 'Uzun süre dijital ortamda kalmanın, yakındaki gerçek sorumluluklara ayrılan ilgiyi azaltabilmesi', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Altı saatlik ekran kullanımı, solan çiçek ve kullanılmayan sulama kabı birlikte gerçek sorumluluğun ihmal edildiğini gösterir.' }),
      opt('C', 'Telefon bildirimlerinin, günlük işlerin hangi sırayla yapılacağını belirlemesi', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'notification-read-as-planning-tool', feedback: 'Bildirim yalnız çevrim içi süreyi gösterir; günlük işleri sıralayan bir yönlendirme veya planlama işlevi taşımaz.' }),
      opt('D', 'Bitki bakımının düzenli yapılmadığında dijital uygulamalarla desteklenmesi gereği', { partial: ['e1', 'e3'], contradictions: ['e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'criticism-read-as-app-solution', feedback: 'Karikatür dijital destek önermiyor; telefonla meşguliyetin gerçek bakımın yerini tutmadığını eleştiriyor.' })
    ],
    steps: [
      { action: 'görseldeki gerçek sorumluluğu belirle', evidenceIds: ['e1', 'e3'], explanation: 'Solan çiçek ve kullanılmayan sulama kabı bakımın aksadığını gösterir.', hint: 'Gencin yanında yapılmayı bekleyen gerçek iş nedir?' },
      { action: 'telefon ayrıntısının işlevini yorumla', evidenceIds: ['e1', 'e2'], explanation: 'Altı saatlik süre, meşguliyetin yoğunluğunu görünür kılar.', hint: 'Ekrandaki süre neden özellikle gösterilmiş?' },
      { action: 'altyazıyla eleştiriyi birleştir', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Meşgul görünmek, çevredeki sorumluluğa ilgi göstermek değildir.', hint: '“İlgilenmek” ile “meşgul olmak” ayrımı hangi davranışı eleştiriyor?' }
    ]
  },
  {
    id: 'tr-g8-wave2-03-visual-news-accessibility',
    outcomeCode: 'T.8.3.27',
    construct: { primarySkill: 'visual-news-data-interpretation', secondarySkills: ['spatial-sequence', 'claim-evidence-fit'], cognitiveProcess: 'multimodal-analysis', knowledgeComponents: ['route-map', 'caption', 'barrier', 'accessibility'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'gorsel-haber', voice: 'yerel-haber', sourceMode: 'ozgun-erisebilirlik-haberi', rhetoricalMoves: ['rota-gorseli', 'fotograf-notu', 'sonuc'] },
    stimulusBlocks: [
      `Haber başlığı: “Yeni yaya rotası herkes için kesintisiz mi?”`,
      `Görsel 1: Haritada okuldan kütüphaneye uzanan mavi erişilebilir rota gösteriliyor. Rotanın ortasında “A rampası” işareti var.`,
      `Görsel 2: Aynı noktadaki fotoğrafta rampanın çıkışını kapatan üç park etmiş motosiklet görülüyor. Alt yazı: “Rota çizimde kesintisiz, uygulamada geçiş daralıyor.”`
    ],
    stem: 'Bu görseller ve alt yazı birlikte değerlendirildiğinde aşağıdaki yorumlardan hangisine ulaşılır?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Haber rotanın herkes için kesintisiz olup olmadığını sorgular.' },
      { id: 'e2', sentence: 2, claim: 'Harita erişilebilir rotayı ve rampayı kesintisiz gösterir.' },
      { id: 'e3', sentence: 3, claim: 'Fotoğrafta rampanın çıkışı motosikletlerle daralmıştır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Haritadaki güzergâhın kısa olması, geçişte yaşanabilecek fiziksel engelleri önemsiz hâle getirir.', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'route-length-overrides-access', feedback: 'Harita rotanın uzunluğunu değil erişilebilirliğini gösterir; fotoğraftaki engel, kısa rota olsa bile geçişi etkileyebilir.' }),
      opt('B', 'Rampanın bulunması erişilebilirlik için yeterlidir; çevresindeki geçici kullanımlar rotanın niteliğini değiştirmez.', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'infrastructure-existence-equals-usability', feedback: 'Rampa bulunması tek başına yeterli değildir; çıkışının kapatılması rotanın gerçek kullanımını kesintiye uğratır.' }),
      opt('C', 'Erişilebilirlik yalnız plandaki düzenlemeyle değil, rotanın günlük kullanımda açık tutulmasıyla sağlanır.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Harita erişilebilir bir tasarım gösterirken fotoğraf uygulamadaki engeli ortaya koyar; ikisinin birlikte işlemesi gerekir.' }),
      opt('D', 'Motosikletlerin varlığı, haritada gösterilen rampanın yanlış konuma çizildiğini kanıtlar.', { partial: ['e2', 'e3'], contradictions: ['e2'], scope: 'expanded', fit: 'partial', misconceptionId: 'obstruction-read-as-mapping-error', feedback: 'Fotoğraf rampanın yerini yanlışlamaz; rampanın doğru yerde olsa da çıkışının kullanım sırasında kapatıldığını gösterir.' })
    ],
    steps: [
      { action: 'haritanın vaat ettiği kullanımı belirle', evidenceIds: ['e1', 'e2'], explanation: 'Plan, okul ile kütüphane arasında erişilebilir ve kesintisiz bir rota sunar.', hint: 'Haritada rota nasıl gösteriliyor?' },
      { action: 'fotoğraftaki kullanım engelini belirle', evidenceIds: ['e3'], explanation: 'Motosikletler rampanın çıkış alanını daraltır.', hint: 'Fotoğraf, çizimde görünmeyen hangi sorunu gösteriyor?' },
      { action: 'plan ile uygulama arasındaki sonucu çıkar', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Erişilebilir tasarımın günlük kullanımda da açık tutulması gerekir.', hint: 'Doğru yorum hem rampanın varlığını hem geçişin engellenmesini açıklamalı.' }
    ]
  },
  {
    id: 'tr-g8-wave2-04-story-film-inner-conflict',
    outcomeCode: 'T.8.3.33',
    construct: { primarySkill: 'literary-media-adaptation-comparison', secondarySkills: ['medium-specific-expression', 'character-consistency'], cognitiveProcess: 'compare-and-evaluate', knowledgeComponents: ['inner-monologue', 'visual-symbol', 'adaptation-choice'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'oyku-film-karsilastirmasi', voice: 'uyarlama-incelemesi', sourceMode: 'ozgun-oyku-ve-kisa-film', rhetoricalMoves: ['metin-alintisi', 'sahne-betimi', 'islev-karsilastirma'] },
    stimulusBlocks: [
      `Öykü: Deniz, yıllardır açmadığı mektubu eline alır. “Okursam geçmiş değişmeyecek, okumazsam da kapının önünde beklemeyi sürdürecek.” diye düşünür. Mektubu masaya bırakır ama odadan çıkamaz.`,
      `Kısa film uyarlaması: İç ses kullanılmaz. Deniz mektubu masaya bırakır; kapıya yürürken aynadaki görüntüsü kadrajda mektubun yanında kalır. Birkaç adım sonra geri dönüp sandalyeye oturur.`
    ],
    stem: 'Öykü ile kısa filmde Deniz’in kararsızlığının aktarılışıyla ilgili doğru değerlendirme aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Öykü kararsızlığı iç monolog ve odadan çıkamama yoluyla aktarır.' },
      { id: 'e2', sentence: 2, claim: 'Film iç ses kullanmaz; ayna, kadraj ve geri dönüş hareketi kullanır.' },
      { id: 'e3', sentence: 1, claim: 'Her iki anlatımda da karakter mektuptan uzaklaşamaz.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Film, öyküdeki kararsızlığı iç ses yerine görüntü düzeni ve oyuncunun hareketleriyle aktararak aynı çatışmayı korur.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Öykü düşünceyi doğrudan verir; film aynadaki görüntü, geri dönüş ve oturma hareketiyle aynı kararsızlığı görselleştirir.' }),
      opt('B', 'Film, mektubun içeriğini göstermediği için öyküdeki kararsızlığı kaldırır ve sahneyi yalnız fiziksel harekete dönüştürür.', { partial: ['e2'], contradictions: ['e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'no-inner-voice-means-no-conflict', feedback: 'İç sesin kaldırılması çatışmayı yok etmez; görsel düzen ve geri dönüş hareketi kararsızlığı farklı bir araçla anlatır.' }),
      opt('C', 'Öykü ve film aynı cümleleri kullanır; fark yalnız filmin olayları daha kısa sürede göstermesidir.', { partial: ['e1', 'e2'], contradictions: ['e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'adaptation-read-as-verbatim', feedback: 'Film aynı cümleleri kullanmaz ve iç sesi kaldırır; asıl fark süre değil, kararsızlığın sözel ve görsel araçlarla aktarılmasıdır.' }),
      opt('D', 'Film aynayı kullanarak Deniz’in mektubu okumaya karar verdiğini, öykü ise mektuptan vazgeçtiğini açıkça belirtir.', { partial: ['e1', 'e2'], contradictions: ['e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'ambiguous-ending-forced-into-opposite-decisions', feedback: 'İki anlatım da kesin bir karar göstermez; karakterin mektuptan uzaklaşamaması kararsızlığın sürdüğünü düşündürür.' })
    ],
    steps: [
      { action: 'öykünün kararsızlığı hangi araçla verdiğini bul', evidenceIds: ['e1'], explanation: 'İç monolog ve odadan çıkamama düşünceyi doğrudan aktarır.', hint: 'Öykü, Deniz’in zihnindeki çatışmayı nasıl duyuruyor?' },
      { action: 'filmin sözel olmayan anlatım araçlarını belirle', evidenceIds: ['e2'], explanation: 'Ayna, kadraj ve geri dönme hareketi iç sesin yerini alır.', hint: 'Film konuşmadan hangi görsel işaretleri kullanıyor?' },
      { action: 'iki ortamın koruduğu ortak çatışmayı belirle', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Her iki anlatımda da Deniz mektuptan uzaklaşamaz.', hint: 'Araçlar değişse de karakterin hangi durumu aynı kalıyor?' }
    ]
  },
  {
    id: 'tr-g8-wave2-05-poem-animation-time-change',
    outcomeCode: 'T.8.3.33',
    construct: { primarySkill: 'adaptation-change-analysis', secondarySkills: ['image-to-sound-mapping', 'setting-change'], cognitiveProcess: 'compare-and-evaluate', knowledgeComponents: ['poetic-image', 'animation-device', 'time-setting'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'siir-animasyon-karsilastirmasi', voice: 'sanat-incelemesi', sourceMode: 'ozgun-siir-ve-animasyon', rhetoricalMoves: ['imge', 'ses-goruntu-esleme', 'degisen-ayrinti'] },
    stimulusBlocks: [
      `Şiir: “Gece, dar sokakların sesini yuttu / ayak izlerim taşlarda tek başına kaldı.”`,
      `Animasyon uyarlaması: Sahne sabahın ilk ışıklarında geçer. Kalabalık giderek saydamlaşırken başkahramanın ayak sesleri yükselir; çevredeki diğer sesler yavaşça kısılır. Taşların üzerinde tek bir gölge uzar.`
    ],
    stem: 'Şiir ile animasyon arasındaki ilişki aşağıdakilerden hangisinde doğru açıklanmıştır?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Şiir gece, yalnızlık ve seslerin yok oluşu imgelerini kurar.' },
      { id: 'e2', sentence: 2, claim: 'Animasyon diğer sesleri azaltıp ayak sesini öne çıkarır.' },
      { id: 'e3', sentence: 2, claim: 'Animasyon zamanı geceden sabaha değiştirir ama yalnızlık duygusunu korur.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Animasyon, şiirdeki gece ayrıntısını koruyup yalnız ayak izlerini görsel bir simgeye dönüştürmüştür.', { partial: ['e1', 'e2'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'time-change-overlooked', feedback: 'Ayak sesi ve gölge şiirsel imgeyi dönüştürür; ancak animasyon geceyi korumaz, sahneyi sabaha taşır.' }),
      opt('B', 'Animasyon zamanı değiştirirken ses azaltma ve tek gölgeyle şiirdeki yalnızlık duygusunu farklı araçlarla sürdürmüştür.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Uyarlama geceyi sabaha çevirir; buna rağmen seslerin kısılması, tek ayak sesi ve gölgeyle yalnızlık duygusunu korur.' }),
      opt('C', 'Animasyon kalabalığı görünür kıldığı için şiirin yalnızlık düşüncesine karşı çıkar ve topluluk duygusunu öne çıkarır.', { partial: ['e2'], contradictions: ['e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'visible-crowd-read-as-belonging', feedback: 'Kalabalık giderek saydamlaşır; bu kullanım topluluk duygusunu değil, karakterin kalabalık içinde yalnızlaşmasını güçlendirir.' }),
      opt('D', 'Şiir ve animasyon yalnız ayak seslerinin yükselmesini anlatır; zaman ve çevre ayrıntıları iki eserde de aynıdır.', { partial: ['e1', 'e2'], contradictions: ['e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'shared-image-means-identical-setting', feedback: 'İki eserde ses imgesi ortaktır; ancak şiir geceyi, animasyon sabahı kullanır ve çevre ayrıntıları aynı değildir.' })
    ],
    steps: [
      { action: 'şiirdeki temel imge ve duyguyu belirle', evidenceIds: ['e1'], explanation: 'Gece ve yutulan sesler yalnızlık duygusunu kurar.', hint: 'Şiirde zaman, ses ve yalnızlık nasıl ilişkilendiriliyor?' },
      { action: 'animasyonun kullandığı ses ve görüntü araçlarını belirle', evidenceIds: ['e2'], explanation: 'Diğer seslerin kısılması ve tek gölge yalnızlığı görselleştirir.', hint: 'Animasyon hangi sesleri azaltıyor, hangisini öne çıkarıyor?' },
      { action: 'korunan duygu ile değişen zamanı ayır', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Duygu korunur, zaman geceden sabaha dönüşür.', hint: 'Uyarlamada hangi unsur aynı kalmış, hangi ortam ayrıntısı değişmiş?' }
    ]
  },
  {
    id: 'tr-g8-wave2-06-sentence-elements-cleanup',
    outcomeCode: 'T.8.4.18',
    construct: { primarySkill: 'sentence-element-analysis', secondarySkills: ['phrase-boundary', 'semantic-role'], cognitiveProcess: 'grammatical-analysis', knowledgeComponents: ['subject', 'definite-object', 'adverbial-complement', 'predicate'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'gonullu-etkinlik-duyurusu', voice: 'dil-cozumleme', sourceMode: 'ozgun-cumle-oge-analizi', rhetoricalMoves: ['zaman', 'eyleyen', 'nesne', 'arac'] },
    stimulus: `“Yağmurdan sonra çocuklar, parkın girişindeki çamurları küçük küreklerle temizledi.” cümlesinde eylemin zamanı, işi yapanlar, etkilenen varlık ve kullanılan araç ayrı söz gruplarıyla verilmiştir.`,
    stem: 'Bu cümlenin ögeleri aşağıdakilerin hangisinde doğru gösterilmiştir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Yağmurdan sonra zaman bildiren zarf tümlecidir.' },
      { id: 'e2', sentence: 1, claim: 'Çocuklar özne, parkın girişindeki çamurları belirtili nesnedir.' },
      { id: 'e3', sentence: 1, claim: 'Küçük küreklerle araç bildiren zarf tümleci, temizledi yüklemdir.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', '“Yağmurdan sonra” dolaylı tümleç, “çocuklar” özne, “parkın girişindeki çamurları” belirtili nesne, “küçük küreklerle” zarf tümlecidir.', { partial: ['e2', 'e3'], contradictions: ['e1'], scope: 'preserved', fit: 'partial', misconceptionId: 'time-phrase-read-as-locative', feedback: 'Özne, nesne ve araç grubu doğru ayrılmıştır; “yağmurdan sonra” yer değil zaman bildirdiği için dolaylı değil zarf tümlecidir.' }),
      opt('B', '“Yağmurdan sonra” zarf tümleci, “çocuklar” belirtili nesne, “parkın girişindeki çamurları” özne, “küçük küreklerle” dolaylı tümleçtir.', { partial: ['e1'], contradictions: ['e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'subject-object-swapped', feedback: 'Zaman grubu doğrudur; işi yapan çocuklar özne, temizleme eyleminden etkilenen çamurlar ise belirtili nesnedir.' }),
      opt('C', '“Yağmurdan sonra” zarf tümleci, “çocuklar” özne, “parkın girişindeki çamurları” belirtili nesne, “küçük küreklerle” zarf tümlecidir.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Zaman ve araç bildiren gruplar zarf tümleci; işi yapan “çocuklar” özne, etkilenen “çamurları” belirtili nesnedir.' }),
      opt('D', '“Yağmurdan sonra çocuklar” özne, “parkın girişindeki” dolaylı tümleç, “çamurları küçük küreklerle” belirtisiz nesnedir.', { partial: ['e2', 'e3'], contradictions: ['e1', 'e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'phrase-boundaries-merged', feedback: 'Zaman sözü özneye katılmaz; “parkın girişindeki” çamurları niteleyen söz grubunun parçasıdır ve nesne “çamurları” belirtme eki alır.' })
    ],
    steps: [
      { action: 'yükleme kim ve ne sorularını sor', evidenceIds: ['e2'], explanation: 'Kim temizledi: çocuklar; neyi temizledi: çamurları.', hint: 'Eylemi yapan kim, eylemden etkilenen ne?' },
      { action: 'zaman ve araç gruplarını ayır', evidenceIds: ['e1', 'e3'], explanation: '“Ne zaman” ve “ne ile” soruları zarf tümleçlerini buldurur.', hint: '“Yağmurdan sonra” ve “küçük küreklerle” hangi sorulara cevap veriyor?' },
      { action: 'söz gruplarının sınırlarını koru', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Niteleyici sözler ait oldukları ögeden ayrılmaz.', hint: '“Parkın girişindeki” sözü hangi ismi niteliyor?' }
    ]
  },
  {
    id: 'tr-g8-wave2-07-sentence-elements-hidden-subject',
    outcomeCode: 'T.8.4.18',
    construct: { primarySkill: 'implicit-subject-and-elements', secondarySkills: ['person-suffix-inference', 'phrase-boundary'], cognitiveProcess: 'grammatical-inference', knowledgeComponents: ['hidden-subject', 'definite-object', 'indirect-object', 'adverbial'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'arsiv-teslim-notu', voice: 'birinci-cogul', sourceMode: 'ozgun-gizli-ozne-cumlesi', rhetoricalMoves: ['zaman', 'nesne', 'yonelme', 'kisi-eki'] },
    stimulus: `“Eski fotoğrafları sabah erkenden belediye arşivine teslim ettik.” cümlesinde özne açıkça yazılmamış, yüklemin kişi ekinden anlaşılmaktadır.`,
    stem: 'Bu cümlenin ögeleri ve gizli öznesiyle ilgili doğru çözümleme aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Teslim ettik yüklemi birinci çoğul kişiyi, yani biz gizli öznesini gösterir.' },
      { id: 'e2', sentence: 1, claim: 'Eski fotoğrafları belirtili nesnedir.' },
      { id: 'e3', sentence: 1, claim: 'Sabah erkenden zarf tümleci, belediye arşivine dolaylı tümleçtir.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('D', 'Gizli özne “biz”, “eski fotoğrafları” belirtili nesne, “sabah erkenden” zarf tümleci, “belediye arşivine” dolaylı tümleçtir.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: '“-k” kişi eki gizli öznenin “biz” olduğunu gösterir; fotoğraflar nesne, zaman grubu zarf, yönelme eki alan arşiv grubu dolaylı tümleçtir.' }),
      opt('B', 'Gizli özne “onlar”, “eski fotoğrafları” özne, “sabah erkenden” dolaylı tümleç, “belediye arşivine” belirtili nesnedir.', { partial: ['e2', 'e3'], contradictions: ['e1', 'e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'person-and-case-roles-swapped', feedback: '“Ettik” birinci çoğul kişidir; belirtme eki alan fotoğraflar nesne, yönelme eki alan arşiv grubu dolaylı tümleçtir.' }),
      opt('C', 'Gizli özne “biz”, “eski fotoğrafları sabah erkenden” belirtili nesne, “belediye arşivine” zarf tümlecidir.', { partial: ['e1', 'e2'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'time-merged-into-object', feedback: 'Gizli özne doğrudur; fakat “sabah erkenden” fotoğrafları değil teslim etme zamanını belirtir ve ayrı bir zarf tümlecidir.' }),
      opt('A', 'Gizli özne “belediye”, “eski fotoğrafları” belirtili nesne, “sabah erkenden” zarf tümleci, “arşivine” yüklemdir.', { partial: ['e2', 'e3'], contradictions: ['e1'], scope: 'shifted', fit: 'partial', misconceptionId: 'nearest-noun-read-as-subject', feedback: 'Belediye sözcüğü “arşivine” tamlamasının parçasıdır; yüklem “teslim ettik”, gizli özne ise kişi ekinden anlaşılan “biz”dir.' })
    ],
    steps: [
      { action: 'yüklemin kişi ekinden gizli özneyi bul', evidenceIds: ['e1'], explanation: '“Ettik” birinci çoğul kişiyi gösterir.', hint: 'Yüklem “kimler teslim etti?” sorusuna hangi kişi ekiyle cevap veriyor?' },
      { action: 'belirtme ve yönelme eklerini ayır', evidenceIds: ['e2', 'e3'], explanation: '“-ı” nesneyi, “-e” yönelme bildiren dolaylı tümleci gösterir.', hint: '“Fotoğrafları” ve “arşivine” hangi hâl eklerini almış?' },
      { action: 'zaman sözünü ayrı öge olarak belirle', evidenceIds: ['e3'], explanation: '“Sabah erkenden” eylemin zamanını bildirir.', hint: 'Teslim etme işi ne zaman yapılmış?' }
    ]
  },
  {
    id: 'tr-g8-wave2-08-sentence-types-comparison',
    outcomeCode: 'T.8.4.19',
    construct: { primarySkill: 'sentence-type-comparison', secondarySkills: ['polarity', 'structure', 'predicate-position'], cognitiveProcess: 'grammatical-comparison', knowledgeComponents: ['positive-negative', 'simple-compound', 'regular', 'verb-sentence'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'iki-cumle-dil-incelemesi', voice: 'karsilastirmali', sourceMode: 'ozgun-cumle-turu-karsilastirmasi', rhetoricalMoves: ['iki-ornek', 'ortak-ozellik', 'ayirici-ozellik'] },
    stimulusBlocks: [
      `I. Kütüphanenin ışıkları henüz sönmemişti.`,
      `II. Görevli kapıyı kapatınca avlu sessizleşti.`
    ],
    stem: 'Bu iki cümlenin türleriyle ilgili doğru karşılaştırma aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'I. cümle fiil cümlesi, kurallı ve olumsuzdur.' },
      { id: 'e2', sentence: 2, claim: 'II. cümle fiil cümlesi, kurallı ve olumludur.' },
      { id: 'e3', sentence: 2, claim: 'II. cümlede zarf-fiil yan cümleciği bulunduğu için cümle birleşiktir; I. cümle basittir.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'İki cümle de kurallı fiil cümlesidir; I olumsuz ve basit, II olumlu ve birleşiktir.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Her iki yüklem sonda ve çekimli fiildir; “sönmemişti” olumsuz, “sessizleşti” olumlu, “kapatınca” ise II. cümleyi birleşik yapar.' }),
      opt('B', 'İki cümle de olumlu ve basittir; yalnız I. cümlede yüklem sonda olduğu için kurallı yapı vardır.', { partial: ['e1', 'e2'], contradictions: ['e1', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'negative-suffix-and-verbal-ignored', feedback: 'I. cümlede “-me” olumsuzluk eki vardır; II. cümledeki “kapatınca” zarf-fiili birleşik yapı oluşturur ve iki yüklem de sondadır.' }),
      opt('C', 'I. cümle olumsuz isim cümlesi, II. cümle olumlu fiil cümlesidir; iki cümle de birleşiktir.', { partial: ['e1', 'e2'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'compound-tense-read-as-noun-sentence', feedback: '“Sönmemişti” çekimli fiildir; I. cümlede fiilimsi veya yan cümlecik bulunmadığı için yapı bakımından basittir.' }),
      opt('D', 'I. cümle devrik ve olumsuz, II. cümle kurallı ve olumlu bir cümledir; yapı bakımından ikisi de basittir.', { partial: ['e1', 'e2'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'auxiliary-time-read-as-deviation', feedback: 'I. cümlenin yüklemi sonda olduğu için devrik değildir; II. cümledeki zarf-fiil cümleyi yapı bakımından birleşik yapar.' })
    ],
    steps: [
      { action: 'yüklemlerin türü ve yerini belirle', evidenceIds: ['e1', 'e2'], explanation: 'İki yüklem de çekimli fiildir ve cümle sonunda bulunur.', hint: '“Sönmemişti” ve “sessizleşti” isim mi, fiil mi; cümlenin neresinde?' },
      { action: 'olumluluk ve olumsuzluğu ayır', evidenceIds: ['e1', 'e2'], explanation: 'İlk yüklem olumsuzluk eki taşır, ikinci taşımaz.', hint: 'Hangi yüklem “-me/-ma” olumsuzluk eki almış?' },
      { action: 'fiilimsiye göre yapı türünü belirle', evidenceIds: ['e3'], explanation: '“Kapatınca” yan cümlecik oluşturur.', hint: 'İkinci cümlede çekimli yüklem dışında eylem anlamı taşıyan hangi sözcük var?' }
    ]
  },
  {
    id: 'tr-g8-wave2-09-passive-focus',
    outcomeCode: 'T.8.4.20',
    construct: { primarySkill: 'voice-meaning-contribution', secondarySkills: ['agent-focus', 'news-style'], cognitiveProcess: 'grammatical-meaning-analysis', knowledgeComponents: ['active', 'passive', 'agent-omission', 'result-focus'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'haber-cumlesi-karsilastirmasi', voice: 'dil-ve-anlam', sourceMode: 'ozgun-etken-edilgen-karsilastirmasi', rhetoricalMoves: ['iki-surum', 'odak-degisimi', 'fail-silme'] },
    stimulusBlocks: [
      `I. Ekip, dere yatağındaki atıkları iki günde topladı.`,
      `II. Dere yatağındaki atıklar iki günde toplandı.`
    ],
    stem: 'İkinci cümlede edilgen çatının kullanılmasının anlatıma katkısı aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'I. cümlede işi yapan ekip açıkça belirtilir.' },
      { id: 'e2', sentence: 2, claim: 'II. cümlede işi yapan belirtilmez.' },
      { id: 'e3', sentence: 2, claim: 'II. cümlede atıkların toplanması ve iki günlük sonuç öne çıkar.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'İşi yapanın kim olduğu kesin biçimde bilinmediği için cümleye kuşku anlamı katmıştır.', { partial: ['e2'], contradictions: ['e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'passive-equals-uncertainty', feedback: 'Edilgen yapı yapanı söylemez; fakat bu durum eylemin gerçekleşip gerçekleşmediği konusunda kuşku oluşturmaz.' }),
      opt('B', 'Yapanı geri plana alıp temizliğin tamamlanması ve süresi üzerinde odak kurmuştur.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Etken cümlede ekip öndeyken edilgen cümlede yapan belirtilmez; sonuç ve iki günlük süre belirginleşir.' }),
      opt('C', 'Atıkların kendi kendine toplandığını anlatarak olaya olağanüstü bir özellik kazandırmıştır.', { partial: ['e2', 'e3'], contradictions: ['e1'], scope: 'reversed', fit: 'partial', misconceptionId: 'passive-read-as-self-action', feedback: 'Edilgen çatı, eylemin kendiliğinden gerçekleştiğini değil, yapanın cümlede belirtilmediğini gösterir.' }),
      opt('D', 'Ekip sözcüğünü gereksiz bulduğu için cümleyi kısaltmış; anlamın geri kalanını değiştirmemiştir.', { partial: ['e1', 'e2'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'voice-change-read-as-only-shortening', feedback: 'Cümle kısalsa da odak değişir: ilkinde ekip, ikincisinde yapılan iş ve sonuç öne çıkar.' })
    ],
    steps: [
      { action: 'etken cümlede öne çıkan ögeyi belirle', evidenceIds: ['e1'], explanation: 'İşi yapan ekip açıkça belirtilmiştir.', hint: 'Birinci cümlede “kim topladı?” sorusunun cevabı var mı?' },
      { action: 'edilgen cümlede hangi bilginin kaldırıldığını belirle', evidenceIds: ['e2'], explanation: 'Yapan özne cümlede yer almaz.', hint: 'İkinci cümlede ekip bilgisi bulunuyor mu?' },
      { action: 'odak değişimini yorumla', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Temizliğin sonucu ve süresi öne çıkar.', hint: 'İkinci cümle okuyucunun dikkatini kimden hangi sonuca yöneltiyor?' }
    ]
  },
  {
    id: 'tr-g8-wave2-10-active-passive-responsibility',
    outcomeCode: 'T.8.4.20',
    construct: { primarySkill: 'voice-and-responsibility-analysis', secondarySkills: ['agent-transparency', 'institutional-language'], cognitiveProcess: 'grammatical-evaluation', knowledgeComponents: ['active-passive-choice', 'responsibility', 'focus'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'kurum-duyurusu-karsilastirmasi', voice: 'sorumluluk-odakli', sourceMode: 'ozgun-duyuru-dil-analizi', rhetoricalMoves: ['iki-surum', 'sorumlu-belirtme', 'odak-degisimi'] },
    stimulusBlocks: [
      `I. Teknik ekip, arızalı sensörleri kontrol etmediği için sistem geç devreye girdi.`,
      `II. Arızalı sensörler kontrol edilmediği için sistem geç devreye girdi.`
    ],
    stem: 'İkinci cümlede edilgen çatının tercih edilmesi, birinci cümleye göre anlatımı nasıl değiştirmiştir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'I. cümle kontrol etmeyen teknik ekibi açıkça sorumlu gösterir.' },
      { id: 'e2', sentence: 2, claim: 'II. cümlede kontrol işini yapmayan kişi veya ekip belirtilmez.' },
      { id: 'e3', sentence: 2, claim: 'II. cümle ihmal edilen işlem ve sistemin gecikmesi üzerinde odak kurar.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Kontrolün yapılmadığını reddetmiş, gecikmeyi sensörlerin doğal özelliğine bağlamıştır.', { partial: ['e2', 'e3'], contradictions: ['e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'passive-read-as-denial', feedback: 'İkinci cümle kontrolün yapılmadığını açıkça söyler; yalnızca bu ihmali kimin yaptığı bilgisini kaldırır.' }),
      opt('B', 'Teknik ekibin sorumluluğunu daha güçlü vurgulamış, gecikmenin nedenini kişiselleştirmiştir.', { partial: ['e1'], contradictions: ['e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'passive-read-as-agent-emphasis', feedback: 'Edilgen yapı teknik ekibi cümleden çıkarır; sorumluyu güçlendirmek yerine yapanı geri plana iter.' }),
      opt('D', 'Sorumlu ekibi belirtmeden, yapılmayan kontrol ile sistemdeki gecikme arasındaki ilişkiyi öne çıkarmıştır.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Birinci cümle sorumluyu açıklar; ikinci cümle yapanı gizleyerek ihmal edilen işlem ve gecikme ilişkisine odaklanır.' }),
      opt('C', 'Cümlenin yalnız sözcük sayısını azaltmış, sorumluluk ve odak bakımından aynı anlatımı korumuştur.', { partial: ['e1', 'e3'], contradictions: ['e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'voice-choice-has-no-meaning-effect', feedback: 'Olay aynı kalsa da sorumlunun görünürlüğü değişir; edilgen cümle yapanı kaldırdığı için odak ve hesap verebilirlik etkilenir.' })
    ],
    steps: [
      { action: 'birinci cümlede sorumlunun nasıl gösterildiğini belirle', evidenceIds: ['e1'], explanation: 'Teknik ekip kontrolü yapmayan özne olarak açıkça verilir.', hint: 'İlk cümle gecikmeden kimi sorumlu tutuyor?' },
      { action: 'ikinci cümlede kaybolan bilgiyi belirle', evidenceIds: ['e2'], explanation: 'Kontrolü kimin yapmadığı belirtilmez.', hint: 'İkinci cümlede “kim kontrol etmedi?” sorusunun cevabı var mı?' },
      { action: 'edilgenliğin odak ve sorumluluk etkisini birleştir', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'İşlem ve sonuç görünür kalırken sorumlu geri plana düşer.', hint: 'Doğru seçenek hem neden-sonuç ilişkisini hem sorumlunun görünmezliğini açıklamalı.' }
    ]
  }
]);

function makeCanonical(spec) {
  const outcome = grade8TurkishOutcomeByCode(spec.outcomeCode);
  if (!outcome) throw new Error(`${spec.id}: unknown outcome ${spec.outcomeCode}`);
  const answer = spec.options.find(entry => entry.correct);
  const orderedOptions = [...spec.options].sort((left, right) => left.id.localeCompare(right.id));
  return defineCanonicalQuestion({
    id: spec.id,
    curriculum: {
      country: 'TR', schoolYear: outcome.schoolYear, programFamily: outcome.programFamily, grade: 8,
      courseId: outcome.courseId, unitId: outcome.unitId, topicId: outcome.topicId,
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
      humanReview: { status: 'NOT_MEASURED', calibrationBatch: 'GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_10', gameAdaptationAllowed: false }
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
    misconceptionIds: orderedOptions.filter(entry => !entry.correct).map(entry => entry.misconceptionId),
    verifier: { solverId: 'tr-g8-wave2-semantic-score-v1', independentVerifierId: 'tr-g8-wave2-constraint-intersection-v1', verified: true },
    styleProfile: spec.style,
    provenance: { generatedFromSourceIds: [outcome.sourceId], styleReferenceIds: STYLE_REFERENCE_IDS },
    contentStatus: 'HUMAN_REVIEW_REQUIRED'
  });
}

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

const ITEMS = Object.freeze(SPECS.map(makeCanonical));

export function buildGrade8TurkishVisualGrammarWave2Questions() { return ITEMS; }
export function grade8TurkishVisualGrammarWave2QuestionById(id) { return ITEMS.find(item => item.id === id) || null; }

export function auditGrade8TurkishVisualGrammarWave2Catalog(items = ITEMS) {
  const itemAudits = items.map(item => ({ id: item.id, ...auditGrade8TurkishCalibrationQuestion(item) }));
  const errors = itemAudits.flatMap(row => row.errors.map(error => `${row.id}:${error}`));
  const outcomeCount = new Set(items.flatMap(item => item.curriculum.outcomeIds)).size;
  const genres = new Set(items.map(item => item.styleProfile.genre));
  const sources = new Set(items.map(item => item.styleProfile.sourceMode));
  const answerPositions = items.map(item => item.answerKey.optionId);
  if (items.length !== 10) errors.push(`catalog:item-count:${items.length}`);
  if (outcomeCount !== 6) errors.push(`catalog:outcome-count:${outcomeCount}`);
  if (genres.size !== 10) errors.push(`catalog:genre-count:${genres.size}`);
  if (sources.size !== 10) errors.push(`catalog:source-mode-count:${sources.size}`);
  for (const letter of ['A', 'B', 'C', 'D']) {
    const count = answerPositions.filter(value => value === letter).length;
    if (count < 2 || count > 3) errors.push(`catalog:answer-position:${letter}:${count}`);
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({
      itemCount: items.length,
      outcomeCount,
      genreCount: genres.size,
      sourceModeCount: sources.size,
      answerDistribution: Object.freeze(Object.fromEntries(['A','B','C','D'].map(letter => [letter, answerPositions.filter(value => value === letter).length]))),
      humanReviewStatus: 'NOT_MEASURED',
      gameAdaptationAllowed: false,
      productReady: false
    }),
    itemAudits: Object.freeze(itemAudits)
  });
}

export const grade8TurkishVisualGrammarWave2Engine = defineSubjectEngine({
  id: 'tr-g8-visual-grammar-wave2-engine-v1',
  domain: 'turkish-visual-grammar',
  supportedCourseIds: ['turkce'],
  supportedItemFormats: ['single-choice'],
  misconceptionCatalogId: 'tr-g8-visual-grammar-wave2-misconceptions-v1',
  styleCatalogId: 'tr-g8-visual-grammar-wave2-styles-v1',
  plan: request => {
    const item = grade8TurkishVisualGrammarWave2QuestionById(request.questionId);
    if (!item) throw new Error(`unknown wave2 question ${request.questionId}`);
    return Object.freeze({ questionId: item.id, curriculumRoute: request.curriculumRoute });
  },
  generate: plan => structuredClone(grade8TurkishVisualGrammarWave2QuestionById(plan.questionId)),
  solve,
  verifyIndependent: verify,
  explain: item => item.solutionGraph,
  qualityAudit: auditGrade8TurkishCalibrationQuestion
});

export const GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_IDS = Object.freeze(ITEMS.map(item => item.id));
export const GRADE8_TURKISH_VISUAL_GRAMMAR_WAVE2_CODES = Object.freeze([...new Set(SPECS.map(spec => spec.outcomeCode))]);
