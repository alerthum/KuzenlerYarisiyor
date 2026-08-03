import { defineCanonicalQuestion } from './canonical-question-contract.js';
import { defineSubjectEngine } from './subject-engine-contract.js';
import { auditGrade8TurkishCalibrationQuestion } from './turkish-g8-reading-calibration.js';
import { grade8TurkishOutcomeByCode } from '../curriculum/outcomes/tr-g8-turkce-2019.js';

const STYLE_REFERENCE_IDS = Object.freeze([
  'user-ozdebir-paragraph-sample',
  'user-approved-grade8-turkish-calibration-standard'
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
    id, text, correct,
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
    id: 'tr-g8-wave1-01-context-ketum',
    outcomeCode: 'T.8.3.5',
    construct: { primarySkill: 'contextual-word-meaning', secondarySkills: ['context-clue-integration', 'tone-reading'], cognitiveProcess: 'inference', knowledgeComponents: ['context-clue', 'behaviour-description', 'word-meaning'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'portre-yazisi', voice: 'gozlemci', sourceMode: 'ozgun-sanatci-portresi', rhetoricalMoves: ['davranis-ornekleri', 'karsilastirma', 'baglamsal-tanim'] },
    stimulus: `Söyleşinin başında fotoğrafçı, yıllardır çektiği insan yüzlerinden uzun uzun söz etti. Konu kendi yaşamına gelince cümleleri kısaldı; hangi şehirde büyüdüğünü söyledi ama ailesine ve özel hayatına ilişkin soruları nazikçe geçiştirdi. Muhabir onun bu ketum tavrını soğukluk olarak yorumlamadı. Çünkü sanatçı başkalarının hikâyelerini anlatırken cömert, kendinden söz ederken ölçülüydü.`,
    stem: 'Bu parçada “ketum” sözcüğüyle anlatılmak istenen aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 2, claim: 'Kendi yaşamı sorulduğunda cevapları kısalır.' },
      { id: 'e2', sentence: 2, claim: 'Özel hayat sorularını nazikçe geçiştirir.' },
      { id: 'e3', sentence: 4, claim: 'Başkalarını anlatırken açık, kendinden söz ederken ölçülüdür.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Kendisiyle ilgili soruları gereksiz bulduğu için konuşmayı başka konulara yönlendiren', { partial: ['e1', 'e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'silence-as-dismissal', feedback: 'Sanatçı soruları değersiz bulduğunu göstermiyor; özel yaşamını paylaşma sınırı koyuyor ve bunu nazik bir tutumla yapıyor.' }),
      opt('B', 'İnsanlarla yakın ilişki kurmakta zorlandığı için söyleşide kısa cevaplar veren', { partial: ['e1'], contradictions: ['e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'privacy-as-social-distance', feedback: 'Kısa cevaplar yalnız kendi yaşamı söz konusu olduğunda görülüyor; başkalarının hikâyelerini anlatırken iletişim kurmakta güçlük çekmiyor.' }),
      opt('C', 'Kendi duygu ve özel yaşamını açıklama konusunda ölçülü ve kapalı davranan', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Sözcüğün anlamı üç davranıştan çıkarılır: cevapları kısaltma, özel soruları geçiştirme ve kendinden söz ederken sınır koyma.' }),
      opt('D', 'Söyleşide yanlış anlaşılmamak için yalnız doğrulanabilir ayrıntıları paylaşan', { partial: ['e1', 'e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'privacy-as-fact-checking', feedback: 'Parçada doğrulama kaygısından söz edilmiyor; anlatılan tutum, kişinin kendisiyle ilgili ayrıntıları paylaşmaya isteksiz ve ölçülü oluşudur.' })
    ],
    steps: [
      { action: 'sözcüğün çevresindeki davranışları bul', evidenceIds: ['e1', 'e2'], explanation: 'Kısa cevaplar ve özel soruları geçiştirme, paylaşım sınırını gösterir.', hint: 'Sanatçı kendi yaşamı sorulunca ne yapıyor?' },
      { action: 'bu davranışın soğukluk olup olmadığını ayır', evidenceIds: ['e3'], explanation: 'Başkalarının hikâyelerinde açık olması, genel bir iletişim sorunu olmadığını gösterir.', hint: 'Aynı kişi başkalarından söz ederken nasıl davranıyor?' },
      { action: 'davranışları ortak bir anlamda birleştir', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Ketumluk, kişinin kendisiyle ilgili bilgileri ölçülü biçimde saklı tutmasıdır.', hint: 'Doğru anlam hem kısa cevapları hem özel hayat sınırını açıklamalı.' }
    ]
  },
  {
    id: 'tr-g8-wave1-02-expression-disorder-revision',
    outcomeCode: 'T.8.3.8',
    construct: { primarySkill: 'expression-disorder-repair', secondarySkills: ['meaning-preservation', 'redundancy-detection'], cognitiveProcess: 'analysis-and-revision', knowledgeComponents: ['redundancy', 'quantity-scope', 'sentence-revision'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'editor-notu', voice: 'duzeltme-odakli', sourceMode: 'ozgun-yayin-kurulu-senaryosu', rhetoricalMoves: ['sorun-tespiti', 'anlam-siniri', 'revizyon'] },
    stimulus: `Bir okul dergisinin editörü şu cümleyi inceliyor: “Bu karar, kurul üyelerinin çoğu tarafından ortaklaşa birlikte alındı ve uygulamaya ertesi gün başlandı.” Editör, cümlede aynı anlamı karşılayan sözcüklerin yan yana kullanıldığını; buna karşılık kararın üyelerin tamamınca değil, çoğunluğunca alındığı bilgisinin korunması gerektiğini belirtiyor.`,
    stem: 'Editörün iki uyarısını da karşılayan düzeltme aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Ortaklaşa ve birlikte sözcükleri aynı anlamı tekrar eder.' },
      { id: 'e2', sentence: 2, claim: 'Kararı üyelerin çoğu almıştır; tamamı değil.' },
      { id: 'e3', sentence: 1, claim: 'Uygulamaya ertesi gün başlanmıştır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Kurul üyelerinin çoğu bu kararı aldı; uygulama çalışmaları ertesi gün başladı.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Gereksiz anlam tekrarını kaldırır; kararın çoğunluk tarafından alındığı ve uygulamanın ertesi gün başladığı bilgilerini korur.' }),
      opt('B', 'Bu ortak karar kurul üyeleri tarafından alındı ve ertesi gün uygulamaya geçirildi.', { partial: ['e1', 'e3'], contradictions: ['e2'], scope: 'expanded', fit: 'partial', misconceptionId: 'majority-changed-to-all', feedback: 'Anlatım sadeleşir; buna karşılık “çoğu” bilgisi silindiği için kararın kurulun tamamınca alındığı izlenimi doğar.' }),
      opt('C', 'Kurul üyelerinin çoğu ortaklaşa karar aldı ve bu karar ertesi gün uygulanmaya başlandı.', { partial: ['e2', 'e3'], contradictions: ['e1'], scope: 'preserved', fit: 'partial', misconceptionId: 'redundancy-partly-retained', feedback: 'Çoğunluk ve zaman bilgileri korunur; “çoğu” ile “ortaklaşa” aynı birliktelik anlamını gereksiz biçimde üst üste bindirir.' }),
      opt('D', 'Kurul üyeleri kararın çoğunu birlikte aldı ve uygulamaya sonraki gün geçildi.', { partial: ['e1', 'e3'], contradictions: ['e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'quantity-attached-to-decision', feedback: '“Çoğu” sözcüğünü üyelere değil karara bağladığı için anlam değişir; kurulun hangi bölümünün karar aldığı bilgisi kaybolur.' })
    ],
    steps: [
      { action: 'gereksiz anlam tekrarını belirle', evidenceIds: ['e1'], explanation: 'Ortaklaşa ve birlikte aynı birliktelik anlamını yineler.', hint: 'Hangi iki sözcük aynı işi yapıyor?' },
      { action: 'korunması gereken nicelik bilgisini belirle', evidenceIds: ['e2'], explanation: 'Kararı kurulun tamamı değil çoğunluğu almıştır.', hint: '“Çoğu” sözcüğü neyi niteliyor?' },
      { action: 'zaman bilgisini de koruyan revizyonu seç', evidenceIds: ['e1', 'e2', 'e3'], explanation: 'Doğru düzeltme hem tekrarları kaldırır hem anlam ayrıntılarını korur.', hint: 'Seçenek, çoğunluk ve ertesi gün bilgilerini değiştirmemeli.' }
    ]
  },
  {
    id: 'tr-g8-wave1-03-verbal-function',
    outcomeCode: 'T.8.3.9',
    construct: { primarySkill: 'verbal-function-analysis', secondarySkills: ['word-class-in-context', 'sentence-element-awareness'], cognitiveProcess: 'grammatical-analysis', knowledgeComponents: ['adjective-verb', 'verbal-noun', 'modifier', 'subject-function'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'dil-inceleme-notu', voice: 'cozumleyici', sourceMode: 'ozgun-cumle-cozumlemesi', rhetoricalMoves: ['ornek-cumle', 'islev-ayirma', 'karsilastirma'] },
    stimulus: `“Kıyıya yaklaşan tekneleri izlemek, günün yorgunluğunu unutturuyordu.” cümlesinde “yaklaşan” sözcüğü teknelerin hangi durumda olduğunu belirtirken “izlemek” sözcüğü cümlede bir eylemin adını karşılamaktadır.`,
    stem: 'Bu cümledeki fiilimsilerin görevleriyle ilgili doğru açıklama aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Yaklaşan sözcüğü tekneleri niteler.' },
      { id: 'e2', sentence: 1, claim: 'İzlemek sözcüğü eylemin adını karşılar.' },
      { id: 'e3', sentence: 1, claim: 'İzlemek sözcük grubu cümlenin öznesi görevindedir.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', '“Yaklaşan” isim-fiil olarak teknelerin adını, “izlemek” sıfat-fiil olarak yorgunluğun niteliğini bildirir.', { partial: ['e1', 'e2'], contradictions: ['e1', 'e2', 'e3'], scope: 'reversed', fit: 'opposite', misconceptionId: 'verbal-types-swapped', feedback: 'İki fiilimsinin türü ters çevrilmiştir; “yaklaşan” bir ismi niteler, “izlemek” ise eylemi adlaştırarak özne görevine girer.' }),
      opt('B', '“Yaklaşan” zarf-fiil olarak izleme eyleminin zamanını, “izlemek” isim-fiil olarak yüklemin nedenini açıklar.', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'modifier-read-as-adverb', feedback: '“Yaklaşan” izleme eylemini değil “tekneleri” niteler; “izlemek” de neden bildiren bir tamlayıcı değil, cümlenin öznesidir.' }),
      opt('C', 'İki sözcük de kalıcı isim hâline geldiği için cümlede fiilimsi özelliğini yitirmiş ve varlık adı olarak kullanılmıştır.', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'all-infinitives-permanent-nouns', feedback: 'Sözcükler eylem anlamını korur; biri tekneleri niteleyen sıfat-fiil, diğeri eylemi adlandıran isim-fiil görevindedir.' }),
      opt('D', '“Yaklaşan” sıfat-fiil olarak tekneleri niteler, “izlemek” isim-fiil olarak özne görevinde kullanılan eylem adını oluşturur.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Açıklama hem fiilimsi türlerini hem cümledeki işlevlerini doğru kurar: niteleme ve eylemi adlaştırarak özne olma.' })
    ],
    steps: [
      { action: 'yaklaşan sözcüğünün bağlandığı ismi bul', evidenceIds: ['e1'], explanation: 'Sözcük tekneleri nitelediği için sıfat-fiildir.', hint: '“Yaklaşan” hangi varlığın özelliğini bildiriyor?' },
      { action: 'izlemek sözcüğünün anlam görevini belirle', evidenceIds: ['e2'], explanation: 'Eylemi adlaştırdığı için isim-fiildir.', hint: '“İzlemek” burada çekimli bir eylem mi, eylemin adı mı?' },
      { action: 'isim-fiilin cümledeki yerini belirle', evidenceIds: ['e3'], explanation: 'Yorgunluğu unutturan şey izleme eylemidir; grup özne olur.', hint: '“Ne unutturuyordu?” sorusunun cevabı nedir?' }
    ]
  },
  {
    id: 'tr-g8-wave1-04-transition-functions',
    outcomeCode: 'T.8.3.10',
    construct: { primarySkill: 'transition-expression-function', secondarySkills: ['logical-relation-analysis', 'cohesion'], cognitiveProcess: 'relationship-analysis', knowledgeComponents: ['contrast', 'addition', 'result', 'cohesion'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'kisa-elestiri', voice: 'degerlendirici', sourceMode: 'ozgun-sergi-elestirisi', rhetoricalMoves: ['olumlu-yargı', 'karsitlik', 'ekleme', 'sonuc'] },
    stimulus: `Serginin ilk salonunda yapıtlar kronolojik bir sırayla yerleştirilmişti. Oysa ikinci salonda tarihler yerine ortak temalar öne çıkarılmıştı. Bununla birlikte iki bölümde de sanatçının eskizlerine yer verilmişti. Dolayısıyla ziyaretçi, sanatçının zaman içindeki değişimini izlerken aynı temaya farklı dönemlerde nasıl döndüğünü de görebiliyordu.`,
    stem: 'Bu parçadaki geçiş ve bağlantı ifadelerinin metne katkısı aşağıdakilerden hangisinde doğru verilmiştir?',
    evidence: [
      { id: 'e1', sentence: 2, claim: 'Oysa iki salonun düzenleme anlayışını karşılaştırır.' },
      { id: 'e2', sentence: 3, claim: 'Bununla birlikte ortak bir özelliği ekler.' },
      { id: 'e3', sentence: 4, claim: 'Dolayısıyla önceki düzenlemelerin ziyaretçiye sağladığı sonucu bildirir.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', '“Oysa” serginin ilk salonunu açıklar, “bununla birlikte” örnek verir, “dolayısıyla” önceki yargıyı sınırlar.', { partial: ['e1', 'e2'], contradictions: ['e1', 'e2', 'e3'], scope: 'reversed', fit: 'opposite', misconceptionId: 'connectors-labelled-by-position', feedback: 'Bağlaçların işlevi metindeki sıralarına göre değil kurdukları ilişkiye göre belirlenir; burada karşıtlık, ekleme ve sonuç vardır.' }),
      opt('B', '“Oysa” iki düzeni karşılaştırır, “bununla birlikte” ortak noktayı ekler, “dolayısıyla” bu düzenlerin sonucunu açıklar.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Üç ifade farklı bağlar kurar: salonlar arasında karşıtlık, iki bölüm arasında ortaklık ve düzenlemelerin ziyaretçiye sağladığı sonuç.' }),
      opt('C', '“Oysa” ortak temayı örneklendirir, “bununla birlikte” önceki bilgiyi düzeltir, “dolayısıyla” yeni bir konuya geçiş yapar.', { partial: ['e1', 'e2'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'connector-meanings-shifted', feedback: 'İfadeler yeni konu açmıyor; salonların farkını, ortak özelliğini ve bunların doğurduğu izleme imkânını birbirine bağlıyor.' }),
      opt('D', '“Oysa” zaman sırasını belirtir, “bununla birlikte” salonları neden-sonuçla bağlar, “dolayısıyla” benzerliği vurgular.', { partial: ['e1', 'e3'], contradictions: ['e1', 'e2', 'e3'], scope: 'reversed', fit: 'opposite', misconceptionId: 'logical-relations-reversed', feedback: 'Zaman, neden ve benzerlik ilişkileri seçenek içinde yer değiştirmiştir; metindeki gerçek sıra karşıtlık, ek bilgi ve sonuçtur.' })
    ],
    steps: [
      { action: 'oysa ile bağlanan iki yargıyı karşılaştır', evidenceIds: ['e1'], explanation: 'Salonların düzenlenişi birbirinden farklıdır.', hint: 'İlk ve ikinci salon aynı ilkeye göre mi düzenlenmiş?' },
      { action: 'bununla birlikte ifadesinin eklediği ortaklığı bul', evidenceIds: ['e2'], explanation: 'Farklı düzenlere rağmen iki bölümde de eskiz vardır.', hint: 'İki salonun ortak özelliği hangi cümlede ekleniyor?' },
      { action: 'dolayısıyla ile verilen sonucu belirle', evidenceIds: ['e3'], explanation: 'Düzenleme, iki farklı gelişimi birlikte izleme olanağı sağlar.', hint: 'Son cümle önceki bilgilerin hangi sonucunu veriyor?' }
    ]
  },
  {
    id: 'tr-g8-wave1-05-title-memory-boxes',
    outcomeCode: 'T.8.3.19',
    construct: { primarySkill: 'title-selection', secondarySkills: ['central-theme-synthesis', 'detail-control'], cognitiveProcess: 'synthesis', knowledgeComponents: ['title-scope', 'central-theme', 'supporting-detail'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'kisisel-deneme', voice: 'birinci-tekil', sourceMode: 'ozgun-hafiza-denemesi', rhetoricalMoves: ['nesne-anisi', 'zaman-karsilastirmasi', 'genelleme'] },
    stimulus: `Çocukluğumdan kalan kutuları açtığımda içlerinden değerli eşyalar çıkmıyor: paslanmış bir anahtar, yarısı silinmiş bir bilet, kenarı kırık bir düğme... Yine de bu nesneleri atamıyorum. Çünkü her biri, artık ayrıntılarını hatırlayamadığım bir günün kapısını aralıyor. Bellek bazen geçmişi olduğu gibi saklamıyor; küçük bir nesneye dokununca onu yeniden kuruyor. Bu yüzden kutularım eşya değil, eksik anıların sessiz taslaklarıyla dolu.`,
    stem: 'Bu parçaya en uygun başlık aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Kutularda maddi değeri düşük eski nesneler vardır.' },
      { id: 'e2', sentence: 3, claim: 'Nesneler unutulmuş günleri çağrıştırır.' },
      { id: 'e3', sentence: 4, claim: 'Bellek nesneler aracılığıyla geçmişi yeniden kurar.' },
      { id: 'e4', sentence: 5, claim: 'Kutular eksik anıların taslaklarını taşır.' }
    ],
    requiredEvidenceIds: ['e2', 'e3', 'e4'],
    options: [
      opt('A', 'Çocukluktan Kalan Değersiz Eşyalar', { partial: ['e1', 'e2'], scope: 'narrowed', fit: 'partial', misconceptionId: 'detail-used-as-title', feedback: 'Başlık kutulardaki nesneleri belirtir; parçanın asıl odağı olan bu nesnelerin belleği harekete geçirip anıları yeniden kurması dışarıda kalır.' }),
      opt('B', 'Geçmişi Olduğu Gibi Saklamak', { partial: ['e2'], contradictions: ['e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'memory-as-exact-storage', feedback: 'Parça belleğin geçmişi değişmeden sakladığını değil, küçük nesneler üzerinden eksik parçaları yeniden kurduğunu anlatır.' }),
      opt('C', 'Nesnelerle Yeniden Kurulan Bellek', { correct: true, support: ['e2', 'e3', 'e4'], feedback: 'Başlık, nesnelerin unutulmuş günleri açması ile belleğin geçmişi yeniden kurması düşüncelerini aynı çatı altında toplar.' }),
      opt('D', 'Bir Koleksiyonun Düzenlenme Hikâyesi', { partial: ['e1', 'e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'boxes-read-as-collection', feedback: 'Kutular bir koleksiyon düzeni içinde ele alınmıyor; parçanın merkezinde nesnelerin maddi sınıflandırması değil, anıları çağırma gücü bulunur.' })
    ],
    steps: [
      { action: 'nesnelerin maddi özelliği ile işlevini ayır', evidenceIds: ['e1', 'e2'], explanation: 'Nesneler değerli değildir; anıları çağırdıkları için saklanır.', hint: 'Yazar eşyaları neden atamıyor?' },
      { action: 'bellekle ilgili temel yargıyı bul', evidenceIds: ['e3'], explanation: 'Bellek, geçmişi nesneler üzerinden yeniden kurar.', hint: 'Parçada belleğin nasıl çalıştığı söyleniyor?' },
      { action: 'nesne ve bellek ilişkisini kapsayan başlığı seç', evidenceIds: ['e2', 'e3', 'e4'], explanation: 'Uygun başlık ayrıntıyı değil temel ilişkiyi yansıtır.', hint: 'Başlık hem nesneleri hem anıların yeniden kurulmasını içermeli.' }
    ]
  },
  {
    id: 'tr-g8-wave1-06-story-elements-station',
    outcomeCode: 'T.8.3.20',
    construct: { primarySkill: 'story-element-analysis', secondarySkills: ['conflict-identification', 'setting-time-mapping'], cognitiveProcess: 'narrative-analysis', knowledgeComponents: ['character', 'setting', 'time', 'conflict'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'kisa-oyku', voice: 'ucuncu-tekil', sourceMode: 'ozgun-istasyon-oykusu', rhetoricalMoves: ['mekan-kurma', 'zaman-baskisi', 'ikilem'] },
    stimulus: `Yağmur, akşam treninin kalkmasına on dakika kala eski istasyonun camlarına vuruyordu. Derya, bankın altında unutulmuş küçük bir çanta buldu. İçinden bir çocuk kimliği ve karşı perondaki kasabaya ait otobüs bileti çıktı. Anons, trenin kapılarının kapanacağını bildirirken Derya çantayı görevliye bırakmakla otobüs durağına koşup sahibini aramak arasında kaldı.`,
    stem: 'Bu metindeki hikâye unsurlarını doğru eşleştiren seçenek aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Olay yağmurlu bir akşam eski istasyonda geçer.' },
      { id: 'e2', sentence: 2, claim: 'Başkişi Derya unutulmuş çantayı bulur.' },
      { id: 'e3', sentence: 4, claim: 'Derya trenine yetişmek ile çantanın sahibini aramak arasında kalır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Mekân eski istasyon, zaman yağmurlu akşam, kişi Derya, çatışma trenine yetişme ile çantanın sahibine yardım etme arasında kalmasıdır.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Seçenek mekânı, zamanı, başkişiyi ve olayın düğümünü oluşturan ikilemi metindeki ayrıntılara uygun biçimde eşleştirir.' }),
      opt('B', 'Mekân karşı kasaba, zaman sabah, kişi çantanın sahibi, çatışma otobüs bileti ile tren bileti arasındaki karışıklıktır.', { partial: ['e2'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'mentioned-place-as-setting', feedback: 'Karşı kasaba yalnız bilete ait bilgidir; olay istasyonda ve akşam geçer, merkezdeki ikilem de bilet türleri değil Derya’nın kararıdır.' }),
      opt('C', 'Mekân tren vagonu, zaman yolculuk sonrası, kişi istasyon görevlisi, çatışma kayıp kimliğin kime ait olduğunun belirlenmesidir.', { partial: ['e2', 'e3'], contradictions: ['e1'], scope: 'shifted', fit: 'partial', misconceptionId: 'inferred-events-as-given-elements', feedback: 'Tren vagonu ve yolculuk sonrası metinde gerçekleşmez; görevli de başkişi değildir, asıl düğüm Derya’nın zaman baskısı altındaki seçimidir.' }),
      opt('D', 'Mekân otobüs durağı, zaman tren kalktıktan sonra, kişi çocuk, çatışma çantanın görevliye teslim edilip edilmemesidir.', { partial: ['e2', 'e3'], contradictions: ['e1'], scope: 'narrowed', fit: 'partial', misconceptionId: 'one-choice-branch-as-whole-conflict', feedback: 'Otobüs durağı yalnız olası hareket yönüdür ve tren henüz kalkmamıştır; çatışma tek bir teslim seçeneği değil iki sorumluluk arasında kalmadır.' })
    ],
    steps: [
      { action: 'olayın geçtiği yer ve zamanı bul', evidenceIds: ['e1'], explanation: 'Eski istasyon ve yağmurlu akşam açıkça verilir.', hint: 'İlk cümle hangi yer ve zamanı kuruyor?' },
      { action: 'olayı taşıyan kişiyi belirle', evidenceIds: ['e2'], explanation: 'Çantayı bulan ve karar verecek kişi Derya’dır.', hint: 'Olay boyunca karar vermesi gereken kişi kim?' },
      { action: 'olayın düğümünü oluşturan ikilemi belirle', evidenceIds: ['e3'], explanation: 'Trene yetişme ile çantanın sahibine yardım etme çatışır.', hint: 'Derya hangi iki seçenek arasında kalıyor?' }
    ]
  },
  {
    id: 'tr-g8-wave1-07-problem-solution-library',
    outcomeCode: 'T.8.3.22',
    construct: { primarySkill: 'solution-design', secondarySkills: ['constraint-integration', 'stakeholder-balance'], cognitiveProcess: 'evaluation-and-design', knowledgeComponents: ['problem-causes', 'stakeholders', 'feasible-solution'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'toplumsal-sorun-metni', voice: 'nesnel-rapor', sourceMode: 'ozgun-mahalle-kutuphanesi-vakasi', rhetoricalMoves: ['sorun-tanimi', 'paydas-gorusleri', 'kisitlar'] },
    stimulus: `Mahalle kütüphanesinin tek büyük salonu gün içinde farklı amaçlarla kullanılıyor. Sınava hazırlanan öğrenciler sessizlik isterken yaşlı okurlar gazete üzerine konuşabilecekleri ortak bir alan talep ediyor. Binanın duvarları tarihî olduğu için kalıcı bölme yapılamıyor; bütçe de yeni salon eklemeye yetmiyor. Kütüphane yönetimi, iki grubun da mekândan vazgeçmeden yararlanmasını sağlayacak bir çözüm arıyor.`,
    stem: 'Metindeki koşullar dikkate alındığında en işlevsel çözüm aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 2, claim: 'Öğrenciler sessiz çalışma ortamı ister.' },
      { id: 'e2', sentence: 2, claim: 'Yaşlı okurlar konuşabilecekleri ortak alan ister.' },
      { id: 'e3', sentence: 3, claim: 'Kalıcı bölme yapılamaz ve yeni salon bütçesi yoktur.' },
      { id: 'e4', sentence: 4, claim: 'İki grup da mekândan vazgeçmeden yararlanmalıdır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'Salonun gün boyu sessiz çalışma alanı yapılması ve sohbet etmek isteyenlerin yakın kafelere yönlendirilmesi', { partial: ['e1', 'e3'], contradictions: ['e2', 'e4'], scope: 'narrowed', fit: 'partial', misconceptionId: 'one-stakeholder-prioritized', feedback: 'Öğrencilerin ihtiyacını karşılar; yaşlı okurların kütüphaneden yararlanma talebini dışarı taşıdığı için iki grubu birlikte gözetmez.' }),
      opt('B', 'Salonun ortasına taşınabilir raflar konulması ve iki grubun aynı saatlerde kendi bölümünde bulunması', { partial: ['e1', 'e2', 'e3'], scope: 'preserved', fit: 'partial', misconceptionId: 'visual-divider-solves-sound', feedback: 'Kalıcı duvar kısıtına uyulur; taşınabilir raflar konuşma sesini yeterince ayırmadığı için sessizlik gereksinimini güvenilir biçimde çözmez.' }),
      opt('C', 'Konuşmalı etkinliklerin azaltılması ve salonun kullanımının başvuru sırasına göre gruplardan birine verilmesi', { partial: ['e1', 'e2', 'e3'], contradictions: ['e4'], scope: 'shifted', fit: 'partial', misconceptionId: 'turn-taking-with-exclusion', feedback: 'Zaman paylaşımı düşüncesi içerir; başvuru sırası diğer grubu dönem dönem dışarıda bıraktığı için ortak ve öngörülebilir kullanım sağlamaz.' }),
      opt('D', 'Belirli saatleri sessiz çalışmaya, belirli saatleri konuşmalı okumaya ayıran ve programı önceden duyuran dönüşümlü kullanım düzeni', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'Yeni yapı gerektirmeden iki ihtiyacı farklı zamanlarda karşılar; her grubun kütüphaneyi kullanmasını ve programı önceden bilmesini sağlar.' })
    ],
    steps: [
      { action: 'iki grubun farklı ihtiyaçlarını ayır', evidenceIds: ['e1', 'e2'], explanation: 'Bir grup sessizlik, diğer grup konuşmalı ortaklık ister.', hint: 'İki grubun talepleri neden aynı anda çatışıyor?' },
      { action: 'fiziksel ve mali kısıtları belirle', evidenceIds: ['e3'], explanation: 'Yeni oda ya da kalıcı bölme çözümü kullanılamaz.', hint: 'Hangi çözümler bina ve bütçe nedeniyle uygulanamaz?' },
      { action: 'iki grubu dışlamadan uygulanabilir çözümü seç', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Zaman temelli dönüşüm, fiziksel değişiklik yapmadan iki kullanımı mümkün kılar.', hint: 'Doğru çözüm mekânı değil kullanım zamanını düzenlemeli.' }
    ]
  },
  {
    id: 'tr-g8-wave1-08-real-fiction-birds',
    outcomeCode: 'T.8.3.24',
    construct: { primarySkill: 'real-fiction-distinction', secondarySkills: ['verifiability', 'figurative-event-detection'], cognitiveProcess: 'classification-and-justification', knowledgeComponents: ['factual-claim', 'fictional-event', 'personification'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'bilimsel-ve-edebi-iki-metin', voice: 'karsilastirmali', sourceMode: 'ozgun-kus-gocu-cift-metni', rhetoricalMoves: ['bilgi-verme', 'kurgu', 'kisilestirme'] },
    stimulusBlocks: [
      `I. Metin: Kıyı kuşlarına takılan hafif vericiler, bazı bireylerin sonbaharda aynı sulak alanlarda mola verdiğini göstermiştir. Araştırmacılar rota değişikliklerini rüzgâr yönü ve besin bulunabilirliğiyle birlikte incelemektedir.`,
      `II. Metin: Sürünün en genç kuşu, gece çöktüğünde ayın kendisine kuzeydeki gizli gölü fısıldadığını duydu. Kanatlarını çırpınca yıldızlar önünde bir yol açtı ve sürü o ışıklı patikayı izledi.`
    ],
    stem: 'Bu iki metindeki gerçek ve kurgusal unsurlarla ilgili doğru değerlendirme aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'I. metin verici ölçümlerine dayanan araştırma bulgusu sunar.' },
      { id: 'e2', sentence: 1, claim: 'I. metin rota değişikliklerini çevresel etkenlerle inceler.' },
      { id: 'e3', sentence: 2, claim: 'II. metinde ay konuşur ve yıldızlar yol açar.' },
      { id: 'e4', sentence: 2, claim: 'II. metin bilimsel ölçüm değil hayalî olay örgüsü kurar.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'I. metin kuşların aynı yerde durmasını anlattığı için kurguya, II. metin göç yönünü açıkladığı için gerçeğe dayanır.', { partial: ['e1', 'e3'], contradictions: ['e1', 'e4'], scope: 'reversed', fit: 'opposite', misconceptionId: 'topic-used-instead-of-verifiability', feedback: 'Gerçeklik konuya göre değil sunuluş biçimine göre ayrılır; ölçüm ve araştırma birinci metni, olağanüstü olaylar ikinci metni belirler.' }),
      opt('B', 'I. metin ölçülebilir araştırma verilerine dayanır, II. metin doğa varlıklarına insan özelliği vererek hayalî bir yolculuk kurar.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'Birinci metindeki verici ve çevresel etkenler doğrulanabilir bilgi sunar; ikinci metindeki konuşan ay ve yol açan yıldızlar kurgusal unsurlardır.' }),
      opt('C', 'İki metin de kuş göçünü anlattığı için gerçektir; ayrım yalnız birinin bilimsel, diğerinin şiirsel bir dille yazılmasıdır.', { partial: ['e1', 'e3'], contradictions: ['e4'], scope: 'expanded', fit: 'partial', misconceptionId: 'shared-topic-means-shared-reality', feedback: 'Ortak konu iki metni gerçek yapmaz; ikinci metindeki doğaüstü eylemler yalnız dil farkı değil, açık bir kurgu işaretidir.' }),
      opt('D', 'İki metin de yazarın seçtiği ayrıntılara dayandığı için kurgusaldır; araştırma araçlarının anılması gerçeklik sağlamaz.', { partial: ['e1', 'e4'], contradictions: ['e1', 'e2'], scope: 'expanded', fit: 'partial', misconceptionId: 'all-written-text-is-fiction', feedback: 'Yazılı olması bir metni kurgu yapmaz; birinci metin ölçülebilir araç ve araştırma ilişkileriyle doğrulanabilir iddialar kurar.' })
    ],
    steps: [
      { action: 'birinci metindeki doğrulanabilir unsurları bul', evidenceIds: ['e1', 'e2'], explanation: 'Verici ölçümleri ve çevresel etkenler araştırma yoluyla sınanabilir.', hint: 'Birinci metindeki bilgiler hangi araç ve değişkenlere dayanıyor?' },
      { action: 'ikinci metindeki olağanüstü eylemleri belirle', evidenceIds: ['e3'], explanation: 'Ayın fısıldaması ve yıldızların yol açması gerçek dışı olaylardır.', hint: 'Doğadaki hangi varlıklar insan gibi davranıyor?' },
      { action: 'gerçeklik ölçütünü dil türünden ayır', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Ölçülebilir kanıt gerçek unsuru, olağanüstü olay örgüsü kurguyu gösterir.', hint: 'Doğru seçenek konuya değil doğrulanabilirlik ve olağanüstülüğe dayanmalı.' }
    ]
  },
  {
    id: 'tr-g8-wave1-09-emphasis-design',
    outcomeCode: 'T.8.3.28',
    construct: { primarySkill: 'emphasis-form-analysis', secondarySkills: ['layout-meaning', 'argument-focus'], cognitiveProcess: 'multimodal-text-analysis', knowledgeComponents: ['bolding', 'repetition', 'example-sequence', 'central-claim'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'dergi-sayfasi-taslagi', voice: 'kulturel-yorum', sourceMode: 'ozgun-tipografik-metin', rhetoricalMoves: ['ornek-siralama', 'tekrar', 'koyu-vurgu'] },
    stimulusBlocks: [
      `Bir kentin belleğini yalnız büyük yapılar taşımaz. Bir çeşmenin kitabesi, eski bir dükkân tabelası ve kaldırımdaki aşınmış taş gibi “küçük izler” de geçmişten söz eder. Bu izler önemsiz görüldüğünde kentin gündelik yaşamına ait tanıklıklar zamanla kaybolur.`,
      `Dergi tasarımında “küçük izler” sözü iki kez yinelenmiş; “Asıl kayıp, küçük izleri önemsiz saydığımızda başlar.” cümlesi koyu yazılmıştır.`
    ],
    stem: 'Metindeki düşüncenin vurgulanış biçimiyle ilgili doğru değerlendirme aşağıdakilerden hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Çeşme, tabela ve taş örnekleri küçük izlerin kapsamını somutlaştırır.' },
      { id: 'e2', sentence: 2, claim: 'Küçük izler sözü tekrar edilerek odak korunur.' },
      { id: 'e3', sentence: 2, claim: 'Son yargı koyu yazılarak temel düşünce görsel olarak öne çıkarılır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', 'Örnekler kentin tarihini ayrıntılandırır, tekrar metnin ritmini artırır, koyu yazı yalnız sayfa düzenini dengeler.', { partial: ['e1', 'e2', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'visual-emphasis-as-decoration', feedback: 'Örnek ve tekrarın etkisini kısmen açıklar; koyu yazının yalnız süs olmadığını, temel yargıyı görünür kıldığını gözden kaçırır.' }),
      opt('B', 'Örnekler büyük yapıların önemini azaltır, tekrar karşıt bir düşünce kurar, koyu yazı yeni bir konuya geçildiğini gösterir.', { partial: ['e1', 'e2'], contradictions: ['e2', 'e3'], scope: 'reversed', fit: 'partial', misconceptionId: 'emphasis-devices-as-topic-shift', feedback: 'Metin yeni konuya geçmez; örnek, tekrar ve koyu yazı aynı düşünceyi somutlaştırıp merkezde tutmak için birlikte kullanılır.' }),
      opt('C', 'Örnekler küçük izleri somutlaştırır, tekrar ana kavramı canlı tutar, koyu yazı temel yargının görsel olarak öne çıkmasını sağlar.', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Üç vurgu aracının işlevini birlikte açıklar: somut örnekleme, ana kavramı yineleme ve merkezî yargıyı tipografik olarak belirginleştirme.' }),
      opt('D', 'Örnekler nesnel kanıt sunar, tekrar anlatıcının kararsızlığını gösterir, koyu yazı metindeki tek doğrulanabilir bilgiyi işaretler.', { partial: ['e1', 'e2', 'e3'], scope: 'expanded', fit: 'partial', misconceptionId: 'examples-as-proof-and-repetition-as-doubt', feedback: 'Örnekler araştırma kanıtı değildir ve tekrar kararsızlık bildirmez; kullanılan araçlar aynı düşünceyi daha görünür ve akılda kalıcı kılar.' })
    ],
    steps: [
      { action: 'örneklerin neyi görünür kıldığını belirle', evidenceIds: ['e1'], explanation: 'Soyut küçük izler düşüncesi somut nesnelerle açıklanır.', hint: 'Çeşme, tabela ve taş hangi kavramın örnekleri?' },
      { action: 'tekrarın odak üzerindeki etkisini belirle', evidenceIds: ['e2'], explanation: 'Ana kavramın metin boyunca unutulmaması sağlanır.', hint: 'Hangi söz iki kez kullanılarak odakta tutuluyor?' },
      { action: 'koyu yazının anlam görevini belirle', evidenceIds: ['e3'], explanation: 'Son cümledeki temel yargı görsel olarak öne çıkarılır.', hint: 'Koyu yazılan cümle ayrıntı mı, temel sonuç mu?' }
    ]
  },
  {
    id: 'tr-g8-wave1-10-thought-development',
    outcomeCode: 'T.8.3.34',
    construct: { primarySkill: 'thought-development-methods', secondarySkills: ['evidence-purpose', 'method-distinction'], cognitiveProcess: 'rhetorical-analysis', knowledgeComponents: ['numerical-data', 'comparison', 'quotation', 'example'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'bilgilendirici-kose', voice: 'aciklayici', sourceMode: 'ozgun-muzik-egitimi-yazisi', rhetoricalMoves: ['sayisal-veri', 'karsilastirma', 'sonuc'] },
    stimulus: `Bir müzik okulunda başlangıç düzeyindeki 120 öğrenci iki gruba ayrıldı. İlk grup haftada bir kez altmış dakika, ikinci grup haftada üç kez yirmişer dakika çalıştı. Sekiz hafta sonunda ikinci grubun ritim hataları ortalama yüzde 28 azalırken ilk gruptaki azalma yüzde 11'de kaldı. Bu sonuç, toplam süre aynı olsa bile çalışmanın günlere yayılmasının öğrenmeyi destekleyebileceğini düşündürüyor.`,
    stem: 'Bu parçada düşünceyi geliştirmek için başvurulan yollar ve bunların işlevi aşağıdakilerden hangisinde doğru verilmiştir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: '120 öğrenciden oluşan iki grup tanıtılır.' },
      { id: 'e2', sentence: 2, claim: 'Çalışma düzenleri karşılaştırılır.' },
      { id: 'e3', sentence: 3, claim: 'Yüzde 28 ve yüzde 11 sayısal sonuçları verilir.' },
      { id: 'e4', sentence: 4, claim: 'Veriler çalışmayı günlere yayma düşüncesini destekler.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'Karşılaştırma ve sayısal veriler kullanılmış; iki çalışma düzeninin sonuçları ölçülebilir farklarla desteklenmiştir.', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'İki grubun çalışma biçimleri karşılaştırılır ve başarı farkı yüzdelerle verilir; böylece sonuç ölçülebilir bir dayanağa bağlanır.' }),
      opt('B', 'Tanımlama ve örneklendirme kullanılmış; ritim çalışmasının ne olduğu tek bir okul örneği üzerinden açıklanmıştır.', { partial: ['e1', 'e2'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'study-as-single-example', feedback: 'Bir okul çalışması anlatılsa da amaç kavram tanımlamak değildir; iki düzen karşılaştırılır ve fark sayısal sonuçlarla gösterilir.' }),
      opt('C', 'Tanık gösterme ve karşılaştırma kullanılmış; uzman görüşü iki grubun çalışma süresiyle ilişkilendirilmiştir.', { partial: ['e2', 'e4'], contradictions: ['e1', 'e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'research-result-as-expert-quote', feedback: 'Parçada bir uzmanın sözüne yer verilmez; dayanak, iki grubun ölçülen sonuçları ve bu sonuçların sayısal karşılaştırmasıdır.' }),
      opt('D', 'Benzetme ve sayısal veriler kullanılmış; çalışma düzeni bir ritim kalıbına benzetilerek yüzdelerle açıklanmıştır.', { partial: ['e3', 'e4'], contradictions: ['e2'], scope: 'shifted', fit: 'partial', misconceptionId: 'implicit-analogy-assumed', feedback: 'Yüzdeler bulunur; çalışma düzenini başka bir varlığa benzeten ifade yoktur, temel yöntem iki grubun sonuçlarını karşılaştırmadır.' })
    ],
    steps: [
      { action: 'iki grubun nasıl düzenlendiğini belirle', evidenceIds: ['e1', 'e2'], explanation: 'Toplam süre aynı, çalışma sıklığı farklı iki grup karşılaştırılır.', hint: 'Gruplar arasında değişen temel özellik nedir?' },
      { action: 'sonuçların hangi yolla desteklendiğini bul', evidenceIds: ['e3'], explanation: 'Ritim hatalarındaki azalma yüzdelerle gösterilir.', hint: 'Parçada hangi ölçülebilir değerler kullanılmış?' },
      { action: 'yöntemlerin düşünceye katkısını birleştir', evidenceIds: ['e1', 'e2', 'e3', 'e4'], explanation: 'Karşılaştırma ve sayısal veri, çalışma düzeni hakkındaki sonucu destekler.', hint: 'Doğru seçenek hem yöntemleri hem neden kullanıldıklarını açıklamalı.' }
    ]
  },
  {
    id: 'tr-g8-wave1-11-process-order-seed',
    outcomeCode: 'T.8.3.35',
    construct: { primarySkill: 'process-step-comprehension', secondarySkills: ['prerequisite-ordering', 'instruction-following'], cognitiveProcess: 'sequencing', knowledgeComponents: ['procedure', 'dependency', 'chronological-order'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'uygulama-kilavuzu', voice: 'yonerge', sourceMode: 'ozgun-tohum-cimlendirme-karti', rhetoricalMoves: ['hazirlik', 'kosul', 'izleme', 'aktarim'] },
    stimulusBlocks: [
      `Bir tohum çimlendirme kartında şu basamaklar karışık verilmiştir:`,
      `I. Kök 2-3 santimetreye ulaştığında fideyi toprak dolu saksıya aktarın.`,
      `II. Kâğıt havluyu nemlendirin ve tohumları aralıklı biçimde üzerine yerleştirin.`,
      `III. Kabı ışık alan, doğrudan güneş görmeyen bir yerde tutup nemi her gün kontrol edin.`,
      `IV. Tohumların üzerini ikinci nemli havluyla kapatıp kabın kapağını gevşekçe örtün.`
    ],
    stem: 'İşlemin uygulanabilir bir sıraya kavuşması için basamaklar nasıl düzenlenmelidir?',
    evidence: [
      { id: 'e1', sentence: 2, claim: 'Önce havlu nemlendirilir ve tohumlar yerleştirilir.' },
      { id: 'e2', sentence: 4, claim: 'Tohumlar yerleştirildikten sonra üzeri kapatılır.' },
      { id: 'e3', sentence: 3, claim: 'Kap hazırlandıktan sonra uygun ortamda nem izlenir.' },
      { id: 'e4', sentence: 1, claim: 'Kök geliştikten sonra saksıya aktarım yapılır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3', 'e4'],
    options: [
      opt('A', 'II - III - IV - I', { partial: ['e1', 'e3', 'e4'], contradictions: ['e2'], scope: 'preserved', fit: 'partial', misconceptionId: 'monitor-before-covering', feedback: 'Tohumların üzeri kapatılmadan kabı izleme aşamasına geçilir; III. basamak, hazırlık tamamlandıktan sonra uygulanmalıdır.' }),
      opt('B', 'IV - II - III - I', { partial: ['e2', 'e3', 'e4'], contradictions: ['e1'], scope: 'reversed', fit: 'partial', misconceptionId: 'cover-before-placement', feedback: 'İkinci havluyla kapatma işlemi tohumlar ilk havluya yerleştirildikten sonra yapılabilir; IV. basamak başlangıç olamaz.' }),
      opt('C', 'II - IV - I - III', { partial: ['e1', 'e2', 'e4'], contradictions: ['e3'], scope: 'shifted', fit: 'partial', misconceptionId: 'transfer-before-growth-monitoring', feedback: 'Tohumlar hazırlanır; kök gelişimi izlenmeden saksıya aktarma aşamasına geçildiği için süreçte gerekli bekleme ve kontrol eksik kalır.' }),
      opt('D', 'II - IV - III - I', { correct: true, support: ['e1', 'e2', 'e3', 'e4'], feedback: 'Önce tohumlar yerleştirilip kapatılır, sonra uygun ortamda gelişim izlenir ve kök yeterli uzunluğa geldiğinde saksıya aktarılır.' })
    ],
    steps: [
      { action: 'hazırlık işlemlerini belirle', evidenceIds: ['e1', 'e2'], explanation: 'Tohumları yerleştirme, üzerini kapatmadan önce gelir.', hint: 'Tohumların üzerini kapatabilmek için önce hangi işlem yapılmalı?' },
      { action: 'izleme aşamasının yerini belirle', evidenceIds: ['e3'], explanation: 'Kap hazırlandıktan sonra nem ve gelişim takip edilir.', hint: 'Günlük kontrol, kabın hazırlanmasından önce mi sonra mı yapılır?' },
      { action: 'son koşula bağlı aktarımı sona yerleştir', evidenceIds: ['e4'], explanation: 'Saksıya aktarım kök belirli uzunluğa ulaştığında yapılır.', hint: 'Hangi işlem kökün büyümesi koşuluna bağlıdır?' }
    ]
  },
  {
    id: 'tr-g8-wave1-12-source-selection-heat-island',
    outcomeCode: 'T.8.3.30',
    construct: { primarySkill: 'effective-source-use', secondarySkills: ['source-purpose-matching', 'recency-and-method-evaluation'], cognitiveProcess: 'evaluation-and-selection', knowledgeComponents: ['primary-data', 'academic-explanation', 'commercial-source', 'research-question'], intendedDifficultyBand: 'LGS_HIGH' },
    style: { genre: 'arastirma-planlama', voice: 'ogrenci-projesi', sourceMode: 'ozgun-kaynak-karti-seti', rhetoricalMoves: ['soru-belirleme', 'kaynak-karsilastirma', 'amac-eslestirme'] },
    stimulusBlocks: [
      `Ece, “Mahallemizde yaz akşamları hangi bölgeler daha sıcak kalıyor ve bunun olası nedenleri nelerdir?” sorusunu araştıracaktır.`,
      `1. Belediyenin 2025 tarihli, sokaklara göre gece yüzey sıcaklıklarını gösteren açık veri haritası`,
      `2. Yazarı belirtilmeyen 2017 tarihli “Şehirde serin kalmanın on yolu” başlıklı blog yazısı`,
      `3. Bir üniversitenin 2024 tarihli, yapı yoğunluğu ve yeşil alanın gece sıcaklığıyla ilişkisini açıklayan araştırma özeti`,
      `4. Isı yalıtım ürünü satan bir firmanın kendi ürününü tanıttığı reklam broşürü`
    ],
    stem: 'Ece’nin araştırma sorusuna doğrudan veri ve açıklayıcı çerçeve sağlayacak kaynak çifti hangisidir?',
    evidence: [
      { id: 'e1', sentence: 1, claim: 'Araştırma hem mahalledeki sıcak bölgeleri hem nedenlerini sorar.' },
      { id: 'e2', sentence: 2, claim: 'Kaynak 1 güncel ve konuma özgü sıcaklık verisi sunar.' },
      { id: 'e3', sentence: 4, claim: 'Kaynak 3 yapı ve yeşil alanla sıcaklık ilişkisini açıklar.' },
      { id: 'e4', sentence: 3, claim: 'Kaynak 2 yazarsız ve eski bir genel öneri metnidir.' },
      { id: 'e5', sentence: 5, claim: 'Kaynak 4 ticari tanıtım amacı taşır.' }
    ],
    requiredEvidenceIds: ['e1', 'e2', 'e3'],
    options: [
      opt('A', '1 ve 2', { partial: ['e1', 'e2', 'e4'], scope: 'narrowed', fit: 'partial', misconceptionId: 'general-advice-used-as-causal-source', feedback: 'Harita mahalle verisini sağlar; yazarsız ve eski blog, yapı ile yeşil alanın sıcaklığa etkisini güvenilir bir yöntemle açıklamaz.' }),
      opt('B', '1 ve 3', { correct: true, support: ['e1', 'e2', 'e3'], feedback: 'Belediye haritası sıcak bölgeleri konuma göre gösterir; üniversite özeti bu dağılımı yapı yoğunluğu ve yeşil alanla açıklamak için çerçeve sağlar.' }),
      opt('C', '2 ve 4', { partial: ['e1', 'e4', 'e5'], scope: 'shifted', fit: 'partial', misconceptionId: 'popular-and-commercial-sources-selected', feedback: 'İki kaynak da araştırma sorusuna özgü ölçüm sunmaz; biri yazarsız genel öneri, diğeri satış amacı taşıyan ürün tanıtımıdır.' }),
      opt('D', '3 ve 4', { partial: ['e1', 'e3', 'e5'], scope: 'narrowed', fit: 'partial', misconceptionId: 'explanation-without-local-data', feedback: 'Üniversite özeti nedenleri açıklamaya yardım eder; reklam broşürü mahallede hangi bölgelerin sıcak kaldığını gösteren yerel veri sağlamaz.' })
    ],
    steps: [
      { action: 'araştırma sorusunun iki bilgi ihtiyacını ayır', evidenceIds: ['e1'], explanation: 'Soru yerel sıcaklık dağılımı ile bu dağılımın nedenlerini birlikte ister.', hint: 'Ece yalnız sıcak yerleri mi, nedenlerini de mi araştırıyor?' },
      { action: 'yerel ve güncel veriyi sağlayan kaynağı seç', evidenceIds: ['e2'], explanation: 'Belediye haritası sokak düzeyinde gece sıcaklığı verir.', hint: 'Mahalle içindeki farkları hangi kaynak doğrudan gösterir?' },
      { action: 'nedenleri açıklayacak araştırma kaynağını eşleştir', evidenceIds: ['e3'], explanation: 'Üniversite özeti yapı ve yeşil alan ilişkisini açıklar.', hint: 'Sıcaklık farkının olası nedenlerini hangi kaynak yöntemli biçimde açıklıyor?' }
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
      humanReview: { status: 'NOT_MEASURED', calibrationBatch: 'GRADE8_TURKISH_READING_LANGUAGE_WAVE1_12', gameAdaptationAllowed: false }
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
    verifier: { solverId: 'tr-g8-wave1-semantic-score-v1', independentVerifierId: 'tr-g8-wave1-constraint-intersection-v1', verified: true },
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

export function buildGrade8TurkishReadingLanguageWave1Questions() { return ITEMS; }
export function grade8TurkishReadingLanguageWave1QuestionById(id) { return ITEMS.find(item => item.id === id) || null; }

export function auditGrade8TurkishReadingLanguageWave1Catalog(items = ITEMS) {
  const itemAudits = items.map(item => ({ id: item.id, ...auditGrade8TurkishCalibrationQuestion(item) }));
  const errors = itemAudits.flatMap(row => row.errors.map(error => `${row.id}:${error}`));
  const outcomes = new Set(items.flatMap(item => item.curriculum.outcomeIds));
  const genres = new Set(items.map(item => item.styleProfile.genre));
  const sources = new Set(items.map(item => item.styleProfile.sourceMode));
  const answerPositions = items.map(item => item.answerKey.optionId);
  if (items.length !== 12) errors.push(`catalog:item-count:${items.length}`);
  if (outcomes.size !== 12) errors.push(`catalog:outcome-count:${outcomes.size}`);
  if (genres.size !== 12) errors.push(`catalog:genre-count:${genres.size}`);
  if (sources.size !== 12) errors.push(`catalog:source-mode-count:${sources.size}`);
  for (const letter of ['A', 'B', 'C', 'D']) {
    const count = answerPositions.filter(value => value === letter).length;
    if (count !== 3) errors.push(`catalog:answer-position:${letter}:${count}`);
  }
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    metrics: Object.freeze({ itemCount: items.length, outcomeCount: outcomes.size, genreCount: genres.size, sourceModeCount: sources.size, answerDistribution: Object.freeze(Object.fromEntries(['A','B','C','D'].map(letter => [letter, answerPositions.filter(value => value === letter).length]))), humanReviewStatus: 'NOT_MEASURED', gameAdaptationAllowed: false, productReady: false }),
    itemAudits: Object.freeze(itemAudits)
  });
}

export const grade8TurkishReadingLanguageWave1Engine = defineSubjectEngine({
  id: 'tr-g8-reading-language-wave1-engine-v1',
  domain: 'turkish-reading-language',
  supportedCourseIds: ['turkce'],
  supportedItemFormats: ['single-choice'],
  misconceptionCatalogId: 'tr-g8-reading-language-wave1-misconceptions-v1',
  styleCatalogId: 'tr-g8-reading-language-wave1-styles-v1',
  plan: request => {
    const item = grade8TurkishReadingLanguageWave1QuestionById(request.questionId);
    if (!item) throw new Error(`unknown wave1 question ${request.questionId}`);
    return Object.freeze({ questionId: item.id, curriculumRoute: request.curriculumRoute });
  },
  generate: plan => structuredClone(grade8TurkishReadingLanguageWave1QuestionById(plan.questionId)),
  solve,
  verifyIndependent: verify,
  explain: item => item.solutionGraph,
  qualityAudit: auditGrade8TurkishCalibrationQuestion
});

export const GRADE8_TURKISH_READING_LANGUAGE_WAVE1_IDS = Object.freeze(ITEMS.map(item => item.id));
export const GRADE8_TURKISH_READING_LANGUAGE_WAVE1_CODES = Object.freeze(SPECS.map(spec => spec.outcomeCode));
