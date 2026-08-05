import { createPremiumChoicePack, definePremiumChoice } from './premium-question-core.js';

const LOGIC_ITEMS = [
  definePremiumChoice({
    id: 'logic-order-possible-01', gameId: 'logic-station', familyId: 'premium-logic-ordering', skeletonId: 'premium-logic-ordering:possible-order', subjectId: 'logic', topicId: 'ordering', learningOutcomeId: 'test-all-ordering-constraints',
    context: 'Aylin, Bora, Ceren ve Deniz bir sunum sırasına girecektir. Aylin, Bora’dan önce sunum yapacaktır. Ceren, Bora’nın hemen ardından sunum yapacaktır. Deniz son sırada olmayacaktır.',
    prompt: 'Aşağıdaki sıralamalardan hangisi bütün koşulları sağlar?',
    answer: 'Deniz – Aylin – Bora – Ceren',
    distractors: [
      { text: 'Aylin – Bora – Deniz – Ceren', misconceptionId: 'logic:break-immediate-after', why: 'Ceren’in Bora’nın hemen ardından gelmesi gerektiğini yalnızca “sonra” biçiminde yorumlar.', constructionRule: 'separate-required-adjacent-pair' },
      { text: 'Deniz – Bora – Ceren – Aylin', misconceptionId: 'logic:reverse-before-relation', why: 'Aylin’in Bora’dan önce olması koşulunu ters uygular.', constructionRule: 'reverse-directed-order' },
      { text: 'Aylin – Deniz – Bora – Ceren', misconceptionId: 'logic:place-deniz-last-condition-misread', why: 'Bora–Ceren ikilisini korur ancak Deniz’in yeriyle ilgili koşulu diğer seçeneklerle karşılaştırmadan seçer; burada doğru seçeneğin tekliğini sınamaz.', constructionRule: 'accept-partial-constraint-check' }
    ],
    explanation: 'Deniz ilk sıradadır ve son sırada değildir. Aylin Bora’dan önce gelir; Ceren de Bora’nın hemen arkasındadır. Böylece üç koşul birlikte sağlanır.',
    cognitiveTraits: ['constraintTracking', 'multiStepInference', 'elimination', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Aylin, Bora’dan önce olmalı.', 'Bora ile Ceren yan yana ve Bora önce olmalı.', 'Deniz dördüncü sırada olamaz.']
  }),
  definePremiumChoice({
    id: 'logic-schedule-possible-01', gameId: 'logic-station', familyId: 'premium-logic-scheduling', skeletonId: 'premium-logic-scheduling:five-day-forced', subjectId: 'logic', topicId: 'scheduling', learningOutcomeId: 'derive-forced-five-slot-schedule',
    context: 'Resim, Kodlama, Müzik, Drama ve Fen atölyeleri pazartesiden cumaya birer kez yapılacaktır. Kodlama, Resim’in hemen ertesi günü yapılacaktır. Müzik, Drama’dan önce yapılacaktır. Fen pazartesi veya cuma günü yapılmayacaktır. Drama çarşamba günü yapılmayacaktır.',
    prompt: 'Buna göre aşağıdakilerden hangisi kesinlikle doğrudur?',
    answer: 'Drama salı veya cuma günü yapılır.',
    distractors: [
      { text: 'Kodlama salı günü yapılır.', misconceptionId: 'logic:fix-adjacent-pair-too-early', why: 'Resim–Kodlama ikilisinin art arda gelmesini, ikilinin yalnız pazartesi–salı günlerine yerleşebileceği biçiminde yorumlar.', constructionRule: 'prematurely-fix-adjacent-pair' },
      { text: 'Resim, Fen’den önce yapılır.', misconceptionId: 'logic:infer-relative-order-without-proof', why: 'Resim–Kodlama ardışıklığından Resim ile Fen arasında zorunlu bir sıralama varmış gibi sonuç çıkarır.', constructionRule: 'invent-cross-constraint-order' },
      { text: 'Müzik pazartesi günü yapılır.', misconceptionId: 'logic:force-earliest-before-slot', why: 'Müzik Drama’dan önce olmalı koşulunu, Müzik mutlaka ilk gün yapılmalı biçiminde aşırı geneller.', constructionRule: 'replace-before-with-first' }
    ],
    explanation: 'Drama çarşamba olamaz. Müzik Drama’dan önce olduğundan Drama pazartesi de olamaz. Drama perşembe kabul edilirse Müzik pazartesi–çarşamba aralığında kalır; Fen salı, çarşamba veya perşembe olmalı ve Resim–Kodlama için art arda iki boş gün kalmaz. Bu nedenle Drama yalnız salı veya cuma olabilir.',
    cognitiveTraits: ['constraintTracking', 'scheduleConstruction', 'caseAnalysis', 'forcedInference', 'elimination', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 5,
    evidence: ['Kodlama, Resim’in hemen ertesi günüdür.', 'Müzik, Drama’dan önce olmalıdır.', 'Fen pazartesi veya cuma olamaz.', 'Drama çarşamba olamaz.', 'Drama perşembe olduğunda kalan günler Resim–Kodlama ardışık ikilisini barındıramaz.']
  }),
  definePremiumChoice({
    id: 'logic-matching-forced-01', gameId: 'logic-station', familyId: 'premium-logic-matching', skeletonId: 'premium-logic-matching:forced-assignment', subjectId: 'logic', topicId: 'matching', learningOutcomeId: 'derive-forced-one-to-one-match',
    context: 'Ada, Baran ve Cem; satranç, müzik ve bilim kulüplerine birer kişi olacak biçimde katılacaktır. Ada müzik kulübüne gitmeyecektir. Baran bilim kulübüne gidecektir. Cem satranç kulübüne gitmeyecektir.',
    prompt: 'Bu bilgilere göre hangi eşleştirme zorunludur?',
    answer: 'Ada satranç, Baran bilim, Cem müzik kulübüne gider.',
    distractors: [
      { text: 'Ada bilim, Baran müzik, Cem satranç kulübüne gider.', misconceptionId: 'logic:overwrite-explicit-assignment', why: 'Baran’ın bilim kulübünde olduğu açık bilgisini değiştirir ve Cem’i yasaklı kulübe yerleştirir.', constructionRule: 'violate-given-and-ban' },
      { text: 'Ada satranç, Baran müzik, Cem bilim kulübüne gider.', misconceptionId: 'logic:ignore-fixed-match', why: 'Ada koşulunu sağlasa da Baran’ın bilim kulübüne gitmesi gerektiğini yok sayar.', constructionRule: 'ignore-explicit-match' },
      { text: 'Ada müzik, Baran bilim, Cem satranç kulübüne gider.', misconceptionId: 'logic:use-only-positive-clue', why: 'Yalnız Baran bilgisini uygular; Ada ve Cem için verilen iki olumsuz koşulu ihlal eder.', constructionRule: 'ignore-negative-constraints' }
    ],
    explanation: 'Baran bilim kulübünü alınca Ada ve Cem’e satranç ile müzik kalır. Ada müziğe gidemediği için satranç; Cem de müzik kulübüne gider.',
    cognitiveTraits: ['matching', 'forcedInference', 'constraintPropagation', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Baran = bilim.', 'Ada ≠ müzik olduğundan kalanlar içinde Ada = satranç.', 'Cem’e müzik kalır ve Cem ≠ satranç koşulu da sağlanır.']
  }),
  definePremiumChoice({
    id: 'logic-selection-valid-01', gameId: 'logic-station', familyId: 'premium-logic-selection', skeletonId: 'premium-logic-selection:conditional-pair', subjectId: 'logic', topicId: 'selection', learningOutcomeId: 'apply-conditional-and-exclusive-rules',
    context: 'K, L, M ve N kitaplarından ikisi seçilecektir. K seçilirse L de seçilecektir. M ile N birlikte seçilmeyecektir. K ile M’den tam biri seçilecektir.',
    prompt: 'Hangi ikili seçilebilir?',
    answer: 'K ve L',
    distractors: [
      { text: 'K ve N', misconceptionId: 'logic:ignore-conditional-consequence', why: 'K seçildiğinde L’nin de seçilmesi gerektiğini uygulamaz.', constructionRule: 'drop-if-then-consequence' },
      { text: 'M ve N', misconceptionId: 'logic:ignore-mutual-exclusion', why: 'K–M koşulunu kısmen dikkate alırken M ile N’nin birlikte seçilemeyeceğini ihlal eder.', constructionRule: 'violate-not-together-rule' },
      { text: 'L ve N', misconceptionId: 'logic:misread-exactly-one', why: 'K ile M’den tam biri seçilmesi gerekirken ikisini de seçmez.', constructionRule: 'treat-exactly-one-as-at-most-one' }
    ],
    explanation: 'K seçildiğinde L zorunlu olur. K ile M’den yalnız K seçilmiş olur ve M–N yasağı da ihlal edilmez.',
    cognitiveTraits: ['conditionalReasoning', 'setSelection', 'constraintIntersection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['K → L.', 'K ve M’den tam biri seçilmeli.', 'M ile N aynı ikilide olamaz.']
  }),
  definePremiumChoice({
    id: 'logic-seating-forced-01', gameId: 'logic-station', familyId: 'premium-logic-seating', skeletonId: 'premium-logic-seating:adjacent-right', subjectId: 'logic', topicId: 'seating', learningOutcomeId: 'place-adjacent-directed-pair',
    context: 'Yan yana beş koltuk 1’den 5’e numaralandırılmıştır. Ece, Fırat ve Gül farklı koltuklara oturacaktır. Ece, Fırat’ın solunda olacaktır. Gül uç koltuklarda olmayacaktır. Fırat, Gül’ün hemen sağında olacaktır.',
    prompt: 'Aşağıdaki yerleşimlerden hangisi mümkündür?',
    answer: 'Ece 1, Gül 3, Fırat 4 numaralı koltukta.',
    distractors: [
      { text: 'Ece 4, Gül 2, Fırat 3 numaralı koltukta.', misconceptionId: 'logic:ignore-left-of-condition', why: 'Gül–Fırat yan yanalığını korur ancak Ece’yi Fırat’ın sağına yerleştirir.', constructionRule: 'satisfy-adjacency-break-direction' },
      { text: 'Ece 1, Gül 2, Fırat 4 numaralı koltukta.', misconceptionId: 'logic:misread-immediate-right', why: 'Fırat’ı Gül’ün sağında tutar fakat hemen sağında olma koşulunu uygulamaz.', constructionRule: 'replace-immediately-right-with-right' },
      { text: 'Ece 2, Gül 5, Fırat 4 numaralı koltukta.', misconceptionId: 'logic:break-end-and-direction', why: 'Gül’ü uç koltuğa koyar ve Fırat’ı Gül’ün soluna yerleştirir.', constructionRule: 'violate-two-linked-constraints' }
    ],
    explanation: 'Gül 3’te, Fırat hemen sağındaki 4’tedir. Ece 1’de olduğundan Fırat’ın solundadır; Gül de uçta değildir.',
    cognitiveTraits: ['spatialOrdering', 'adjacencyReasoning', 'constraintTracking', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Fırat = Gül + 1.', 'Gül 1 veya 5 olamaz.', 'Ece’nin koltuk numarası Fırat’ınkinden küçük olmalı.']
  }),
  definePremiumChoice({
    id: 'logic-chain-inference-01', gameId: 'logic-station', familyId: 'premium-logic-conditional-chain', skeletonId: 'premium-logic-conditional-chain:must-follow', subjectId: 'logic', topicId: 'conditional-inference', learningOutcomeId: 'derive-two-step-conditional-conclusion',
    context: 'Kütüphane açıksa Elif çalışma salonuna gider. Elif çalışma salonuna giderse o akşam sinemaya gitmez. Bugün kütüphane açıktır.',
    prompt: 'Bu bilgilere göre hangisi kesinlikle doğrudur?',
    answer: 'Elif bu akşam sinemaya gitmez.',
    distractors: [
      { text: 'Elif sinemaya gitmezse kütüphanenin açık olduğu anlaşılır.', misconceptionId: 'logic:affirm-converse', why: 'Koşullu ilişkinin yönünü ters çevirip sonucu neden gibi kullanır.', constructionRule: 'reverse-conditional-chain' },
      { text: 'Kütüphane kapalı olsaydı Elif sinemaya giderdi.', misconceptionId: 'logic:deny-antecedent', why: 'Kütüphanenin kapalı olmasından çalışma ve sinema davranışı hakkında zorunlu sonuç çıkarır.', constructionRule: 'infer-opposite-from-false-condition' },
      { text: 'Elif çalışma salonuna gitse bile sinemaya gidip gitmeyeceği bilinemez.', misconceptionId: 'logic:ignore-second-implication', why: 'İkinci koşulun açık sonucunu dikkate almaz.', constructionRule: 'drop-linked-implication' }
    ],
    explanation: 'Kütüphane açık olduğundan Elif çalışma salonuna gider. İkinci koşula göre çalışma salonuna giden Elif o akşam sinemaya gitmez.',
    cognitiveTraits: ['conditionalReasoning', 'multiStepInference', 'necessityJudgment', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['Kütüphane açık → Elif çalışma salonuna gider.', 'Çalışma salonu → sinemaya gitmez.']
  }),
  definePremiumChoice({
    id: 'logic-ranking-must-01', gameId: 'logic-station', familyId: 'premium-logic-ranking', skeletonId: 'premium-logic-ranking:transitive-must', subjectId: 'logic', topicId: 'ranking', learningOutcomeId: 'use-transitive-order-relations',
    context: 'Bir yarışta K, L’den önce; M, L’den sonra; N ise K’den önce bitirmiştir. Dört yarışmacının dereceleri birbirinden farklıdır.',
    prompt: 'Hangi ilişki kesinlikle doğrudur?',
    answer: 'N, L’den önce bitirmiştir.',
    distractors: [
      { text: 'M, K’den önce bitirmiştir.', misconceptionId: 'logic:place-after-l-before-k', why: 'M’nin yalnız L’den sonra olduğu bilgisini K ile yanlış ilişkilendirir.', constructionRule: 'invent-order-across-unlinked-side' },
      { text: 'K, N’den önce bitirmiştir.', misconceptionId: 'logic:reverse-explicit-ranking', why: 'N’nin K’den önce olduğu açık koşulu ters çevirir.', constructionRule: 'reverse-given-order' },
      { text: 'L, M’den sonra bitirmiştir.', misconceptionId: 'logic:reverse-after-relation', why: 'M’nin L’den sonra bitirdiği bilgisini ters okur.', constructionRule: 'reverse-directed-after' }
    ],
    explanation: 'N, K’den önce; K da L’den önce olduğundan geçişlilik yoluyla N, L’den önce bitirmiştir.',
    cognitiveTraits: ['transitiveReasoning', 'ranking', 'necessityJudgment', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['N < K.', 'K < L.', 'Bu iki ilişki N < L sonucunu zorunlu kılar.']
  }),
  definePremiumChoice({
    id: 'logic-truth-box-01', gameId: 'logic-station', familyId: 'premium-logic-truth', skeletonId: 'premium-logic-truth:exactly-one', subjectId: 'logic', topicId: 'truth-statements', learningOutcomeId: 'test-exactly-one-true-statement',
    context: 'Anahtar kırmızı, mavi veya yeşil kutulardan yalnız birindedir. Kırmızı kutunun üzerindeki yazı “Anahtar mavi kutuda.”, mavi kutunun üzerindeki yazı “Anahtar bu kutuda değil.”, yeşil kutunun üzerindeki yazı “Anahtar kırmızı kutuda değil.” demektedir. Bu üç yazıdan yalnız biri doğrudur.',
    prompt: 'Anahtar hangi kutudadır?',
    answer: 'Kırmızı kutuda.',
    distractors: [
      { text: 'Mavi kutuda.', misconceptionId: 'logic:accept-first-statement-only', why: 'İlk yazıyı doğru kabul eder ancak bu durumda diğer yazıların doğruluk sayılarını kontrol etmez.', constructionRule: 'test-single-statement-not-total-count' },
      { text: 'Yeşil kutuda.', misconceptionId: 'logic:confuse-not-here-with-other', why: 'Mavi kutudaki “burada değil” ifadesini yeşili zorunlu kılan tek bilgi gibi yorumlar.', constructionRule: 'collapse-negative-to-specific-alternative' },
      { text: 'Kutusu belirlenemez.', misconceptionId: 'logic:avoid-case-analysis', why: 'Üç olasılığı tek tek sınamadan koşulların yetersiz olduğunu varsayar.', constructionRule: 'declare-underdetermined-without-testing' }
    ],
    explanation: 'Anahtar kırmızıdaysa ilk yazı yanlış, ikinci yazı doğru, üçüncü yazı yanlış olur; yalnız bir yazı doğrudur. Mavi veya yeşil olasılıklarında iki yazı doğru çıkar.',
    cognitiveTraits: ['caseAnalysis', 'truthEvaluation', 'constraintCounting', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Her kutu olasılığı için üç yazının doğruluğu hesaplanır.', 'Kırmızı olasılığında doğruluk dizisi yanlış–doğru–yanlıştır.', 'Yalnız bu olasılıkta doğru yazı sayısı birdir.']
  }),
  definePremiumChoice({
    id: 'logic-table-forced-01', gameId: 'logic-station', familyId: 'premium-logic-table', skeletonId: 'premium-logic-table:remaining-slot', subjectId: 'logic', topicId: 'table-reasoning', learningOutcomeId: 'combine-row-and-column-exclusions',
    context: 'P, R ve S öğrencileri pazartesi, salı ve çarşamba günlerinde birer sunum yapacaktır. P pazartesi sunum yapmayacaktır. R, S’den önce sunum yapacaktır. S salı günü sunum yapmayacaktır.',
    prompt: 'S hangi gün sunum yapmak zorundadır?',
    answer: 'Çarşamba',
    distractors: [
      { text: 'Pazartesi', misconceptionId: 'logic:ignore-predecessor-space', why: 'S’yi pazartesiye yerleştirince R’nin S’den önce gelebileceği bir gün kalmadığını gözden kaçırır.', constructionRule: 'ignore-required-earlier-slot' },
      { text: 'Salı', misconceptionId: 'logic:ignore-explicit-day-ban', why: 'S’nin salı günü olamayacağı açık koşulu ihlal eder.', constructionRule: 'violate-explicit-slot-ban' },
      { text: 'Günü kesin olarak belirlenemez.', misconceptionId: 'logic:stop-before-propagation', why: 'S’nin salı yasağını ve R’nin önce gelme zorunluluğunu birlikte uygulamaz.', constructionRule: 'fail-to-propagate-two-constraints' }
    ],
    explanation: 'S salı olamaz. Pazartesi de olursa R’nin daha önce sunum yapacağı gün kalmaz. Bu nedenle S çarşamba olmak zorundadır.',
    cognitiveTraits: ['constraintPropagation', 'scheduleReasoning', 'forcedInference', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['S ≠ salı.', 'R, S’den önce olmalı.', 'S pazartesi olursa R için önceki gün yoktur; geriye çarşamba kalır.']
  }),
  definePremiumChoice({
    id: 'logic-committee-possible-01', gameId: 'logic-station', familyId: 'premium-logic-grouping', skeletonId: 'premium-logic-grouping:three-person', subjectId: 'logic', topicId: 'grouping', learningOutcomeId: 'evaluate-group-composition-rules',
    context: 'Ayşe, Berk, Cansu, Doruk ve Eren arasından üç kişilik bir kurul seçilecektir. Ayşe seçilirse Berk seçilmeyecektir. Cansu ile Doruk ya birlikte seçilecek ya da ikisi de seçilmeyecektir. Eren seçilirse Ayşe de seçilecektir.',
    prompt: 'Aşağıdaki kurullardan hangisi oluşturulabilir?',
    answer: 'Berk, Cansu ve Doruk',
    distractors: [
      { text: 'Ayşe, Berk ve Cansu', misconceptionId: 'logic:ignore-ayse-berk-exclusion', why: 'Ayşe ile Berk’in birlikte seçilemeyeceği koşulu ihlal eder.', constructionRule: 'violate-conditional-exclusion' },
      { text: 'Ayşe, Cansu ve Eren', misconceptionId: 'logic:split-linked-pair', why: 'Eren–Ayşe koşulunu sağlarken Cansu ile Doruk’un birlikte seçilmesi gerektiğini gözden kaçırır.', constructionRule: 'include-one-of-linked-pair' },
      { text: 'Berk, Doruk ve Eren', misconceptionId: 'logic:ignore-eren-consequence', why: 'Eren seçildiğinde Ayşe’nin de seçilmesi gerektiğini uygulamaz; ayrıca Doruk’u Cansu’suz seçer.', constructionRule: 'drop-two-consequences' }
    ],
    explanation: 'Berk seçilebilir; Ayşe kurulda değildir. Cansu ve Doruk birlikte seçilmiştir. Eren seçilmediği için Ayşe koşulu devreye girmez.',
    cognitiveTraits: ['grouping', 'conditionalReasoning', 'constraintIntersection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Ayşe varsa Berk yoktur.', 'Cansu ve Doruk aynı seçim durumunda olmalıdır.', 'Eren varsa Ayşe de olmalıdır.']
  })
];

const SOCIAL_ITEMS = [
  definePremiumChoice({
    id: 'social-media-source-01', gameId: 'social-citizenship', familyId: 'premium-social-media-literacy', skeletonId: 'premium-social-media-literacy:verify-before-share', subjectId: 'social-science', topicId: 'media-literacy', learningOutcomeId: 'verify-source-date-and-context',
    context: 'Bir öğrenci, “Yarın tüm okullar tatil” başlıklı bir ekran görüntüsü görür. Görselde kurum adı vardır ancak paylaşım tarihi kesilmiş, bağlantı görünmemektedir. Başka hesaplar da aynı görseli kaynak göstermeden paylaşmaktadır.',
    prompt: 'Öğrencinin paylaşmadan önce yapması gereken en güvenilir işlem hangisidir?',
    answer: 'İlgili resmî kurumun güncel duyuru sayfasını açıp tarih ve açıklamayı doğrulamak.',
    distractors: [
      { text: 'Aynı görseli çok hesap paylaştığı için doğru kabul etmek.', misconceptionId: 'media:popularity-as-verification', why: 'Tekrarlanan paylaşım sayısını kaynak doğruluğunun kanıtı sayar.', constructionRule: 'replace-source-check-with-share-count' },
      { text: 'Kurum logosu bulunduğu için bağlantıya gerek olmadığını düşünmek.', misconceptionId: 'media:logo-as-authenticity', why: 'Kolayca kopyalanabilen görsel unsuru resmî kaynakla karıştırır.', constructionRule: 'treat-branding-as-proof' },
      { text: 'Haberi önce arkadaş grubuna gönderip doğru olup olmadığını sormak.', misconceptionId: 'media:spread-then-verify', why: 'Doğrulama yapmadan bilginin yayılmasına neden olur.', constructionRule: 'publish-before-verification' }
    ],
    explanation: 'Kaynak, tarih ve bağlam birlikte doğrulanmalıdır. En güvenilir kontrol, ekran görüntüsü yerine kurumun güncel resmî duyurusuna ulaşmaktır.',
    cognitiveTraits: ['sourceEvaluation', 'evidenceVerification', 'responsibleDecision', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Ekran görüntüsünde tarih ve bağlantı yoktur.', 'Çok paylaşılması bilginin doğru olduğunu göstermez.', 'Resmî ve güncel duyuru birincil kaynaktır.']
  }),
  definePremiumChoice({
    id: 'social-budget-priority-01', gameId: 'social-citizenship', familyId: 'premium-social-budget', skeletonId: 'premium-social-budget:needs-before-wants', subjectId: 'social-science', topicId: 'financial-literacy', learningOutcomeId: 'prioritize-needs-under-budget',
    context: 'Bir sınıf etkinliği için 1.200 TL vardır. Ulaşım 650 TL, temel yiyecek 350 TL, süsleme 300 TL ve hatıra anahtarlığı 250 TL’dir. Ulaşım ve temel yiyecek olmadan etkinlik yapılamaz.',
    prompt: 'Bütçeyi aşmadan etkinliğin temel ihtiyaçlarını karşılayan en uygun karar hangisidir?',
    answer: 'Ulaşım ve temel yiyeceği almak; kalan 200 TL’yi beklenmeyen giderler için ayırmak.',
    distractors: [
      { text: 'Ulaşım, süsleme ve anahtarlık almak; yiyeceği etkinlik günü düşünmek.', misconceptionId: 'budget:wants-before-needs', why: 'Zorunlu yiyecek giderini erteleyip isteğe bağlı kalemleri öne alır.', constructionRule: 'prioritize-nonessential-items' },
      { text: 'Dört kalemin tamamını almak; 50 TL farkın önemli olmadığını kabul etmek.', misconceptionId: 'budget:ignore-limit', why: 'Toplam giderin bütçeyi aşmasını küçük fark gerekçesiyle normalleştirir.', constructionRule: 'accept-overbudget-total' },
      { text: 'Yalnız ulaşımı almak; kalan paranın tamamını sonraki etkinliğe saklamak.', misconceptionId: 'budget:omit-required-need', why: 'Etkinlik için zorunlu olduğu belirtilen temel yiyeceği karşılamaz.', constructionRule: 'fund-only-one-essential' }
    ],
    explanation: '650 + 350 = 1.000 TL ile iki zorunlu ihtiyaç karşılanır. Kalan 200 TL bütçe aşılmadan risk payı olarak tutulabilir.',
    cognitiveTraits: ['budgetReasoning', 'prioritySetting', 'constraintEvaluation', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Ulaşım ve yiyecek zorunludur.', 'Zorunlu toplam 1.000 TL’dir.', '1.200 − 1.000 = 200 TL kalır.']
  }),
  definePremiumChoice({
    id: 'social-consumer-rights-01', gameId: 'social-citizenship', familyId: 'premium-social-consumer', skeletonId: 'premium-social-consumer:defective-product', subjectId: 'social-science', topicId: 'consumer-rights', learningOutcomeId: 'use-documented-consumer-remedy',
    context: 'Bir öğrenci ailesiyle aldığı kulaklığın iki gün sonra çalışmadığını fark eder. Ürün düşürülmemiştir; fiş ve garanti belgesi saklanmıştır. Satıcı, ürünü incelemeden “Açılmış ürün geri alınmaz.” der.',
    prompt: 'Tüketici hakkını kullanmak için en uygun ilk adım hangisidir?',
    answer: 'Ayıbı fiş ve garantiyle yazılı bildirip uygun seçimlik hakkı talep etmek.',
    distractors: [
      { text: 'Belge göstermeden sosyal medyada mağazayı suçlamak.', misconceptionId: 'consumer:public-accusation-before-documentation', why: 'Kanıtlı ve resmî başvuru yerine doğrulanmamış kamusal suçlamayı seçer.', constructionRule: 'replace-formal-remedy-with-public-pressure' },
      { text: 'Satıcının ilk sözünü kesin karar kabul edip ürünü kullanmaya devam etmek.', misconceptionId: 'consumer:accept-informal-refusal', why: 'Belge ve yasal haklar varken sözlü reddi bağlayıcı sanır.', constructionRule: 'treat-verbal-refusal-as-final' },
      { text: 'Kulaklığı kendisi açıp onarmaya çalıştıktan sonra değişim istemek.', misconceptionId: 'consumer:alter-evidence-before-claim', why: 'Ürüne müdahale ederek arıza incelemesini ve başvuru kanıtını zayıflatır.', constructionRule: 'modify-product-before-notice' }
    ],
    explanation: 'Ayıplı mal iddiası belge ve yazılı bildirimle somutlaştırılmalıdır. Tüketici onarım, değişim, bedel indirimi veya sözleşmeden dönme gibi haklardan uygun olanı talep edebilir.',
    cognitiveTraits: ['rightsApplication', 'evidenceUse', 'proceduralReasoning', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Fiş ve garanti belgesi vardır.', 'Arıza kısa sürede ve kullanıcı müdahalesi olmadan ortaya çıkmıştır.', 'Yazılı başvuru talebi ve kanıtı kayıt altına alır.']
  }),
  definePremiumChoice({
    id: 'social-digital-consent-01', gameId: 'social-citizenship', familyId: 'premium-social-digital-citizenship', skeletonId: 'premium-social-digital-citizenship:photo-consent', subjectId: 'social-science', topicId: 'digital-citizenship', learningOutcomeId: 'respect-consent-and-privacy-online',
    context: 'Bir öğrenci sınıf gezisinde arkadaşlarının göründüğü bir fotoğrafı çekmiştir. Fotoğraf eğlencelidir ancak iki arkadaş fotoğrafın paylaşılmasını istemediğini söylemiştir.',
    prompt: 'Dijital vatandaşlık açısından en uygun davranış hangisidir?',
    answer: 'Fotoğrafı paylaşmamak; paylaşım düşünülüyorsa görünen herkesten açık izin almak.',
    distractors: [
      { text: 'Hesabı gizli olduğu için izin almadan paylaşmak.', misconceptionId: 'digital:private-account-removes-consent', why: 'Sınırlı erişimin kişilerin izin hakkını ortadan kaldırdığını varsayar.', constructionRule: 'equate-private-setting-with-consent' },
      { text: 'Fotoğrafa komik bir yazı ekleyip yalnız yakın arkadaşlara göndermek.', misconceptionId: 'digital:small-audience-justifies-sharing', why: 'Küçük grubun mahremiyet ihlalini önlediğini sanır.', constructionRule: 'justify-with-limited-audience' },
      { text: 'İstemeyen arkadaşları etiketlemeden fotoğrafı paylaşmak.', misconceptionId: 'digital:no-tag-equals-no-privacy-impact', why: 'Etiketlenmemeyi, görüntünün paylaşılmasına izin vermekle karıştırır.', constructionRule: 'remove-tag-not-image' }
    ],
    explanation: 'Fotoğrafta tanınabilen kişilerin paylaşım konusunda söz hakkı vardır. Gizli hesap, küçük grup veya etiketsiz paylaşım açık iznin yerini tutmaz.',
    cognitiveTraits: ['ethicalDecision', 'privacyReasoning', 'perspectiveTaking', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['Fotoğrafta başka kişiler görünmektedir.', 'İki kişi açıkça paylaşılmasını istememiştir.']
  }),
  definePremiumChoice({
    id: 'social-rights-balance-01', gameId: 'social-citizenship', familyId: 'premium-social-rights-balance', skeletonId: 'premium-social-rights-balance:noise-conflict', subjectId: 'social-science', topicId: 'rights-and-responsibilities', learningOutcomeId: 'balance-freedom-with-others-rights',
    context: 'Bir kişi evinde müzik dinleme özgürlüğü olduğunu söyleyerek gece geç saatte sesi çok açar. Komşular uyuyamadıklarını ve ertesi gün işe gideceklerini belirtir.',
    prompt: 'Hak ve özgürlüklerin kullanımı açısından en doğru değerlendirme hangisidir?',
    answer: 'Müzik, komşuların dinlenmesini engellemeyecek saat ve ses düzeyinde dinlenmelidir.',
    distractors: [
      { text: 'Evde müzik dinleme hakkı, konut içinde kullanıldığı için komşuların dinlenme hakkından önce gelir.', misconceptionId: 'rights:absolute-property-freedom', why: 'Mülkiyet hakkını diğer kişilerin haklarından bağımsız ve sınırsız görür.', constructionRule: 'treat-one-right-as-absolute' },
      { text: 'Komşular rahatsız olduğunda evde müzik dinleme hakkı kullanılmamalıdır.', misconceptionId: 'rights:solve-conflict-by-total-ban', why: 'Haklar arasında ölçülü denge kurmak yerine bir hakkı bütünüyle yok sayar.', constructionRule: 'replace-balance-with-total-prohibition' },
      { text: 'Ses düzeyi, rahatsız olan komşu sayısına göre belirlenmelidir.', misconceptionId: 'rights:minority-harm-ignored', why: 'Bir hakkın ihlalini etkilenen kişi sayısına bağlar.', constructionRule: 'require-majority-for-rights-protection' }
    ],
    explanation: 'Haklar sınırsız değildir; bir özgürlük kullanılırken başkalarının sağlık, huzur ve dinlenme hakkı gözetilmelidir. Uygun saat ve ses düzeyi denge sağlar.',
    cognitiveTraits: ['rightsBalancing', 'ethicalReasoning', 'perspectiveTaking', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Kişinin müzik dinleme özgürlüğü vardır.', 'Komşuların dinlenme hakkı etkilenmektedir.', 'Çözüm, bir hakkı yok etmek değil ölçülü kullanımdır.']
  }),
  definePremiumChoice({
    id: 'social-public-resource-01', gameId: 'social-citizenship', familyId: 'premium-social-public-resources', skeletonId: 'premium-social-public-resources:water-leak', subjectId: 'social-science', topicId: 'public-resources', learningOutcomeId: 'protect-shared-resources-through-action',
    context: 'Bir parkta günlerdir boşa su akıtan kırık bir çeşme vardır. Çevredeki kişiler bunun belediyenin işi olduğunu söyleyip müdahale etmemektedir.',
    prompt: 'Ortak kaynakların korunması için en sorumlu davranış hangisidir?',
    answer: 'Konumu ve durumu belediyenin ilgili birimine bildirmek, mümkünse kayıt numarasıyla takibini yapmak.',
    distractors: [
      { text: 'Kamu malı olduğu için bireylerin hiçbir sorumluluğu olmadığını düşünmek.', misconceptionId: 'public-resource:no-citizen-responsibility', why: 'Bakım yetkisi kurumda olsa da vatandaşın bildirim ve koruma sorumluluğunu yok sayar.', constructionRule: 'separate-citizen-from-shared-resource' },
      { text: 'Çeşmeyi uzmanlık olmadan söküp kendi başına onarmaya çalışmak.', misconceptionId: 'public-resource:unsafe-unauthorized-repair', why: 'Bildirim yerine güvenlik ve yetki riski taşıyan müdahaleyi seçer.', constructionRule: 'replace-reporting-with-unsafe-action' },
      { text: 'Sorunu yalnız fotoğraflayıp paylaşmak; ilgili kuruma bildirmemek.', misconceptionId: 'public-resource:visibility-without-remedy', why: 'Farkındalığı çözüm kanalıyla karıştırır ve onarım sürecini başlatmaz.', constructionRule: 'publicize-without-formal-report' }
    ],
    explanation: 'Onarım yetkili kurumun görevidir; vatandaşın doğru kanaldan açık konum ve durum bilgisiyle bildirim yapması kaynak kaybını azaltan etkili katılımdır.',
    cognitiveTraits: ['civicResponsibility', 'problemSolving', 'proceduralReasoning', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Su sürekli boşa akmaktadır.', 'Onarım yetkisi belediyededir.', 'Konumlu ve kayıtlı bildirim onarım sürecini başlatır.']
  }),
  definePremiumChoice({
    id: 'social-disaster-information-01', gameId: 'social-citizenship', familyId: 'premium-social-crisis-information', skeletonId: 'premium-social-crisis-information:official-channel', subjectId: 'social-science', topicId: 'disaster-awareness', learningOutcomeId: 'distinguish-official-crisis-information',
    context: 'Deprem sonrasında bir mesajlaşma grubunda “İki saat içinde daha büyük deprem kesin olacak.” mesajı yayılır. Mesajın kaynağı belirtilmemiştir ve insanlardan hemen şehri terk etmeleri istenmektedir.',
    prompt: 'Bu durumda en güvenli bilgi davranışı hangisidir?',
    answer: 'Mesajı yaymadan resmî afet açıklamalarını ve güvenlik talimatlarını izlemek.',
    distractors: [
      { text: 'Tedbirli olmak için mesajı bütün kişilere hemen iletmek.', misconceptionId: 'crisis:forward-unverified-warning', why: 'Kaynağı belirsiz kesinlik iddiasını yayarak panik ve yanlış yönlendirme riskini artırır.', constructionRule: 'spread-first-because-precaution' },
      { text: 'Mesaj korkutucu olduğu için yanlış olduğunu kabul etmek.', misconceptionId: 'crisis:emotion-based-dismissal', why: 'Doğruluğu kaynak ve kanıt yerine mesajın duygusal etkisine göre değerlendirir.', constructionRule: 'reject-by-tone-not-source' },
      { text: 'En çok takipçisi olan hesabın yorumunu resmî açıklama yerine kullanmak.', misconceptionId: 'crisis:influencer-as-authority', why: 'Takipçi sayısını afet konusunda kurumsal yetki ve uzmanlıkla karıştırır.', constructionRule: 'replace-authority-with-popularity' }
    ],
    explanation: 'Depremin tam zaman ve büyüklüğünü kesin biçimde bildiren kaynaksız mesajlar güvenilir kabul edilemez. Krizde doğrulanmış resmî talimatlar izlenmeli, söylenti yayılmamalıdır.',
    cognitiveTraits: ['riskEvaluation', 'sourceEvaluation', 'responsibleCommunication', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Mesajın kaynağı yoktur.', 'Kesin zaman ve büyüklük iddiası taşır.', 'Resmî kurumlar doğrulanmış güvenlik talimatı sağlar.']
  }),
  definePremiumChoice({
    id: 'social-participation-01', gameId: 'social-citizenship', familyId: 'premium-social-participation', skeletonId: 'premium-social-participation:evidence-proposal', subjectId: 'social-science', topicId: 'democratic-participation', learningOutcomeId: 'use-evidence-based-participation-channel',
    context: 'Mahalledeki çocuk parkında aydınlatma yetersizdir. Bir grup öğrenci sorunun çözülmesini istemektedir. Park belediyenin sorumluluk alanındadır.',
    prompt: 'Öğrencilerin etkili ve demokratik katılım için izlemesi gereken yol hangisidir?',
    answer: 'Sorunu belgeleyip belediyeye ortak ve kayıtlı bir başvuru yapmak.',
    distractors: [
      { text: 'Parkı kullanmayı bırakıp sorunun kendiliğinden fark edilmesini beklemek.', misconceptionId: 'participation:passive-waiting', why: 'Sorunu yetkili kuruma iletmeden görünür olmasını bekler.', constructionRule: 'replace-participation-with-withdrawal' },
      { text: 'Kimin sorumlu olduğunu araştırmadan farklı kurumları suçlamak.', misconceptionId: 'participation:accuse-without-jurisdiction', why: 'Yetki ve kanıt araştırması yapmadan çatışmacı iletişim kurar.', constructionRule: 'skip-authority-and-evidence-check' },
      { text: 'Aydınlatma direklerine izinsiz elektrik bağlantısı yapmak.', misconceptionId: 'participation:unauthorized-direct-action', why: 'Güvenli ve yasal başvuru yerine tehlikeli, yetkisiz müdahaleyi seçer.', constructionRule: 'replace-civic-channel-with-unsafe-fix' }
    ],
    explanation: 'Etkili katılım; sorunu doğru yetkiliye, somut kanıtlarla ve kayıtlı bir başvuru yoluyla iletmeyi gerektirir.',
    cognitiveTraits: ['civicParticipation', 'evidenceUse', 'proceduralReasoning', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Park belediyenin sorumluluk alanındadır.', 'Sorun konum ve zamanla belgelenebilir.', 'Kayıtlı başvuru takip edilebilir bir çözüm süreci oluşturur.']
  }),
  definePremiumChoice({
    id: 'social-school-council-01', gameId: 'social-citizenship', familyId: 'premium-social-representation', skeletonId: 'premium-social-representation:accountability', subjectId: 'social-science', topicId: 'representation', learningOutcomeId: 'connect-representation-with-accountability',
    context: 'Sınıf temsilcisi, öğrencilerin ortak görüşlerini okul meclisine taşımak üzere seçilmiştir. Toplantıdan sonra hangi önerileri ilettiğini ve hangi sonuçların çıktığını sınıfa açıklamamaktadır.',
    prompt: 'Temsil görevinin daha demokratik yürütülmesi için en uygun uygulama hangisidir?',
    answer: 'Görüşleri toplamak, kararları sınıfa açıklamak ve yeni geri bildirim almak.',
    distractors: [
      { text: 'Seçildiği için dönem boyunca yalnız kendi görüşünü savunması.', misconceptionId: 'representation:personal-opinion-mandate', why: 'Temsil yetkisini ortak görüşleri aktarma görevi yerine kişisel karar yetkisi gibi görür.', constructionRule: 'replace-representation-with-personal-rule' },
      { text: 'Toplantı bilgilerini yalnız yakın arkadaşlarıyla paylaşması.', misconceptionId: 'representation:selective-accountability', why: 'Bilgilendirme ve hesap verebilirliği bütün temsil edilen gruba değil küçük çevreye sınırlar.', constructionRule: 'limit-reporting-to-inner-circle' },
      { text: 'Hiç görüş toplamadan çoğunluğun ne istediğini tahmin etmesi.', misconceptionId: 'representation:assume-without-consultation', why: 'Katılım verisi toplamadan varsayıma dayalı temsil yapar.', constructionRule: 'substitute-guess-for-consultation' }
    ],
    explanation: 'Temsil, yalnız seçilmek değil; görüş toplamak, kararları açıklamak ve temsil edilen kişilere hesap vermek demektir.',
    cognitiveTraits: ['democraticReasoning', 'accountability', 'processEvaluation', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['Temsilci ortak görüşleri taşımak için seçilmiştir.', 'Sınıf toplantı sonuçlarına erişememektedir.', 'Görüş toplama ve geri bildirim temsil döngüsünü tamamlar.']
  }),
  definePremiumChoice({
    id: 'social-data-claim-01', gameId: 'social-citizenship', familyId: 'premium-social-data-literacy', skeletonId: 'premium-social-data-literacy:sample-limit', subjectId: 'social-science', topicId: 'data-literacy', learningOutcomeId: 'evaluate-sample-based-public-claim',
    context: 'Bir okul gazetesi, yalnız basketbol takımındaki 12 öğrenciye sorarak “Okuldaki öğrencilerin %90’ı spor salonunun büyütülmesini istiyor.” başlığını yayımlar. Okulda 600 öğrenci vardır.',
    prompt: 'Bu iddiayla ilgili en güçlü eleştiri hangisidir?',
    answer: 'Örneklem yalnız ilgili takımdan seçildiği için bütün okulu temsil etmeyebilir.',
    distractors: [
      { text: 'Yüzde kullanıldığı için iddia bilimsel ve kesin doğrudur.', misconceptionId: 'data:percentage-as-proof', why: 'Sayısal ifade kullanılmasını yöntem kalitesinin kanıtı sayar.', constructionRule: 'treat-number-format-as-validity' },
      { text: 'Takım öğrencileri sporla ilgilendiği için onların görüşü bütün öğrencilerden daha geçerlidir.', misconceptionId: 'data:interested-group-overrepresents-population', why: 'Konuya yakın grubun yanlı olabileceğini tersine çevirip üstün temsil olarak yorumlar.', constructionRule: 'privilege-biased-sample' },
      { text: '600 öğrencinin tamamına sorulmadıkça hiçbir sonuç çıkarılamaz.', misconceptionId: 'data:census-only-valid', why: 'Temsilî örneklemin kullanılabileceğini reddedip yalnız tam sayımı geçerli kabul eder.', constructionRule: 'reject-all-sampling' }
    ],
    explanation: 'Sorun örneklem büyüklüğünden önce seçim biçimidir. Basketbol takımı spor salonu konusunda okul genelinden farklı eğilime sahip olabilir; daha çeşitli ve rastgele bir örneklem gerekir.',
    cognitiveTraits: ['dataEvaluation', 'biasDetection', 'claimAssessment', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['12 kişi yalnız basketbol takımındandır.', 'İddia 600 öğrencinin tamamına genellenmiştir.', 'İlgili grup seçimi örneklem yanlılığı oluşturabilir.']
  })
];

const ENGLISH_ITEMS = [
  definePremiumChoice({
    id: 'eng-cloze-cause-result-01', gameId: 'english-cloze', familyId: 'premium-eng-causal-coherence', skeletonId: 'premium-eng-causal-coherence:result-connector', subjectId: 'english', topicId: 'connectors', learningOutcomeId: 'choose-result-connector-from-context',
    context: 'Leo had promised to call his grandmother after practice. His phone battery was almost empty, ___ he borrowed his coach’s phone.',
    prompt: 'Boşluğu anlam ve dil bilgisi bakımından en iyi tamamlayan sözcük hangisidir?',
    answer: 'so',
    distractors: [
      { text: 'because', misconceptionId: 'english:reverse-cause-result', why: 'İkinci cümledeki eylemi neden değil sonuç olarak bağlamak gerekir; “because” ilişki yönünü ters kurar.', constructionRule: 'use-cause-connector-in-result-slot' },
      { text: 'although', misconceptionId: 'english:invent-contrast', why: 'Düşük pil ile telefon ödünç alma arasında karşıtlık değil neden–sonuç ilişkisi vardır.', constructionRule: 'replace-result-with-concession' },
      { text: 'unless', misconceptionId: 'english:invent-condition', why: 'Cümlede gerçekleşmesi gereken bir koşul değil, gerçekleşmiş bir sonuca geçiş vardır.', constructionRule: 'replace-result-with-negative-condition' }
    ],
    explanation: 'Pil neredeyse bitmiştir; bunun sonucu olarak Leo koçunun telefonunu ödünç alır. Bu nedenle “so” uygundur. Türkçesi: Telefonunun şarjı neredeyse bitmişti, bu yüzden koçunun telefonunu ödünç aldı.',
    cognitiveTraits: ['contextIntegration', 'grammarSelection', 'causeEffectReasoning', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['The battery was almost empty.', 'Borrowing another phone is the result of that problem.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-concession-01', gameId: 'english-cloze', familyId: 'premium-eng-contrast-coherence', skeletonId: 'premium-eng-contrast-coherence:concession-connector', subjectId: 'english', topicId: 'connectors', learningOutcomeId: 'choose-concession-connector',
    context: 'Maya was tired after the long journey. ___ she wanted to rest, she joined the family dinner because it was her grandfather’s birthday.',
    prompt: 'Boşluğu hangi sözcük tamamlamalıdır?',
    answer: 'Although',
    distractors: [
      { text: 'Because', misconceptionId: 'english:confuse-cause-with-concession', why: 'Dinlenmek istemesi yemeğe katılmasının nedeni değil, buna rağmen aşılan karşıt durumdur.', constructionRule: 'use-cause-for-opposition' },
      { text: 'So', misconceptionId: 'english:result-clause-form-error', why: '“So” iki bağımsız sonucu bağlayabilir; burada yan cümle başında karşıtlık kurulmaktadır.', constructionRule: 'use-result-connector-as-subordinator' },
      { text: 'Unless', misconceptionId: 'english:negative-condition-for-contrast', why: 'Cümlede “-medikçe” anlamı veren bir koşul yoktur.', constructionRule: 'replace-concession-with-unless' }
    ],
    explanation: 'Maya dinlenmek istemesine rağmen yemeğe katılır; iki düşünce arasında karşıtlık vardır. “Although” = “-mesine rağmen”.',
    cognitiveTraits: ['contrastRecognition', 'contextIntegration', 'grammarSelection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['Maya wanted to rest.', 'She still joined the dinner.', 'The two clauses contrast.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-unless-01', gameId: 'english-cloze', familyId: 'premium-eng-conditionals', skeletonId: 'premium-eng-conditionals:unless', subjectId: 'english', topicId: 'conditionals', learningOutcomeId: 'interpret-unless-as-if-not',
    context: 'The museum closes at five. We won’t see the new exhibition ___ we leave the café in the next ten minutes.',
    prompt: 'Boşluğu en uygun tamamlayan sözcük hangisidir?',
    answer: 'unless',
    distractors: [
      { text: 'because', misconceptionId: 'english:condition-as-cause', why: 'Cümlede sergiyi görememenin açıklaması değil, bunu önleyecek zorunlu koşul verilmektedir.', constructionRule: 'replace-negative-condition-with-cause' },
      { text: 'although', misconceptionId: 'english:condition-as-contrast', why: 'Kafeden ayrılma ile sergiyi görme arasında karşıtlık değil koşul ilişkisi vardır.', constructionRule: 'replace-condition-with-concession' },
      { text: 'after', misconceptionId: 'english:ignore-deadline-logic', why: '“After” yalnız zaman sırası kurar; on dakika içinde ayrılmama durumunda sonucu açıklamaz.', constructionRule: 'use-time-linker-without-condition' }
    ],
    explanation: 'Sergiyi görebilmek için on dakika içinde ayrılmak gerekir. “Unless” burada “if we do not leave” yani “ayrılmazsak” anlamındadır.',
    cognitiveTraits: ['conditionalReasoning', 'timeConstraint', 'grammarSelection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['The museum closes at five.', 'Leaving soon is necessary to see the exhibition.', 'Unless = if not.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-past-continuous-01', gameId: 'english-cloze', familyId: 'premium-eng-past-events', skeletonId: 'premium-eng-past-events:interrupted-action', subjectId: 'english', topicId: 'past-continuous', learningOutcomeId: 'select-tense-for-interrupted-action',
    context: 'Nora ___ her presentation when the fire alarm suddenly rang. She saved the file and left the room with the others.',
    prompt: 'Boşluğu hangi ifade doğru tamamlar?',
    answer: 'was preparing',
    distractors: [
      { text: 'prepared', misconceptionId: 'english:completed-event-for-background-action', why: 'Alarm çaldığı sırada devam eden arka plan eylemi yerine tamamlanmış olay biçimi kullanır.', constructionRule: 'use-simple-past-for-interrupted-background' },
      { text: 'has prepared', misconceptionId: 'english:present-perfect-with-finished-past-time', why: '“When ... rang” belirli geçmiş ana bağlanırken present perfect kullanır.', constructionRule: 'use-present-perfect-in-past-narrative' },
      { text: 'is preparing', misconceptionId: 'english:present-tense-in-past-story', why: 'Tüm anlatı geçmiş zamanda olduğu hâlde şimdiki zamanı seçer.', constructionRule: 'ignore-narrative-time-frame' }
    ],
    explanation: 'Alarm aniden çaldığında sunumu hazırlama eylemi sürüyordu. Devam eden geçmiş eylem için “was preparing”, kısa kesen olay için “rang” kullanılır.',
    cognitiveTraits: ['timelineReasoning', 'tenseSelection', 'contextIntegration', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['The alarm rang suddenly at one moment.', 'Preparing the presentation was already in progress.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-comparative-01', gameId: 'english-cloze', familyId: 'premium-eng-comparison', skeletonId: 'premium-eng-comparison:adverb', subjectId: 'english', topicId: 'comparatives', learningOutcomeId: 'choose-comparative-adverb',
    context: 'In the first experiment, Deniz wrote the measurements too quickly and missed two values. In the second experiment, she worked ___ than before and recorded every value.',
    prompt: 'Boşluğu en iyi tamamlayan ifade hangisidir?',
    answer: 'more carefully',
    distractors: [
      { text: 'careful', misconceptionId: 'english:adjective-for-verb', why: '“Worked” fiilini nitelemek için sıfat değil zarf gerekir.', constructionRule: 'use-adjective-after-action-verb' },
      { text: 'most carefully', misconceptionId: 'english:superlative-for-two-comparison', why: 'Yalnız ilk ve ikinci deney karşılaştırılırken üstünlük derecesi kullanır.', constructionRule: 'use-superlative-in-two-item-comparison' },
      { text: 'carefully as', misconceptionId: 'english:malformed-equality-structure', why: 'Eşitlik yapısı “as carefully as” olmalıydı; ayrıca bağlam ikinci deneyde artış gösterir.', constructionRule: 'use-incomplete-as-as-form' }
    ],
    explanation: 'İkinci çalışma öncekiyle karşılaştırılıyor ve daha dikkatli yapılıyor. Fiili niteleyen karşılaştırmalı zarf “more carefully than” yapısını oluşturur.',
    cognitiveTraits: ['comparisonReasoning', 'wordClassSelection', 'contextIntegration', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['The first attempt missed values.', 'The second recorded every value.', '“Than before” requires a comparative form.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-present-perfect-01', gameId: 'english-cloze', familyId: 'premium-eng-present-perfect', skeletonId: 'premium-eng-present-perfect:already-result', subjectId: 'english', topicId: 'present-perfect', learningOutcomeId: 'connect-recent-completion-to-present-result',
    context: 'The team can send the report now because Selin ___ the final chart. It is attached to the email and ready for review.',
    prompt: 'Boşluğu en uygun tamamlayan ifade hangisidir?',
    answer: 'has already completed',
    distractors: [
      { text: 'already completes', misconceptionId: 'english:simple-present-for-recent-result', why: 'Şu anki sonucu olan tamamlanmış eylemi alışkanlık gibi simple present ile verir.', constructionRule: 'use-habit-tense-for-completed-result' },
      { text: 'was already completing', misconceptionId: 'english:ongoing-past-for-finished-task', why: 'Grafiğin bitmiş ve eklenmiş olduğu bilgisine rağmen eylemi geçmişte sürüyor gösterir.', constructionRule: 'use-progressive-for-completed-result' },
      { text: 'will already complete', misconceptionId: 'english:future-for-existing-result', why: 'Dosya şu anda hazır olduğu hâlde tamamlanmayı geleceğe taşır.', constructionRule: 'use-future-despite-current-evidence' }
    ],
    explanation: 'Grafik tamamlanmış ve sonucu şu anda hazırdır. Bu geçmiş eylem–şimdiki sonuç bağlantısı “has already completed” ile kurulur.',
    cognitiveTraits: ['timeReference', 'resultStateReasoning', 'grammarSelection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['The report can be sent now.', 'The chart is attached and ready.', 'The completion has a present result.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-relative-01', gameId: 'english-cloze', familyId: 'premium-eng-relative-clauses', skeletonId: 'premium-eng-relative-clauses:person-subject', subjectId: 'english', topicId: 'relative-pronouns', learningOutcomeId: 'choose-relative-pronoun-for-person',
    context: 'Our science teacher invited a researcher ___ studies how plastic waste affects sea turtles. The researcher will answer our questions on Friday.',
    prompt: 'Boşluğu hangi sözcük tamamlamalıdır?',
    answer: 'who',
    distractors: [
      { text: 'which', misconceptionId: 'english:thing-relative-for-person', why: 'Kişiyi tanımlayan özne konumunda “which” kullanır.', constructionRule: 'use-object-relative-for-person' },
      { text: 'where', misconceptionId: 'english:place-relative-for-person', why: 'Araştırmacıyı yer gibi yorumlayarak “where” seçer.', constructionRule: 'use-place-relative-for-person' },
      { text: 'when', misconceptionId: 'english:time-relative-for-person', why: 'Kişiyi zaman ifadesiyle bağlayan ilgi sözcüğünü kullanır.', constructionRule: 'use-time-relative-for-person' }
    ],
    explanation: 'Boşluk “a researcher” kişisini tanımlar ve yan cümlede özne görevindedir. Bu nedenle “who” kullanılır.',
    cognitiveTraits: ['referenceTracking', 'wordFunctionAnalysis', 'grammarSelection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['The antecedent is a person: a researcher.', 'The missing word is the subject of “studies”.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-enough-01', gameId: 'english-cloze', familyId: 'premium-eng-degree', skeletonId: 'premium-eng-degree:adjective-enough', subjectId: 'english', topicId: 'degree-expressions', learningOutcomeId: 'choose-enough-structure-from-result',
    context: 'The bridge model looked thin, but it was ___ to hold all twenty test weights without bending.',
    prompt: 'Boşluğu en uygun tamamlayan ifade hangisidir?',
    answer: 'strong enough',
    distractors: [
      { text: 'enough strong', misconceptionId: 'english:wrong-enough-word-order', why: '“Enough” sözcüğünü sıfattan önce getirerek İngilizce sözcük dizimini Türkçe mantığıyla kurar.', constructionRule: 'place-enough-before-adjective' },
      { text: 'too strong', misconceptionId: 'english:too-as-positive-sufficiency', why: '“Too” genellikle aşırılık ve olumsuz sonuç taşır; bağlam yeterliliği gösterir.', constructionRule: 'replace-sufficiency-with-excess' },
      { text: 'so strong than', misconceptionId: 'english:mix-result-and-comparison', why: '“So ... that” ve karşılaştırma yapılarının parçalarını birleştirir.', constructionRule: 'blend-so-that-with-comparative' }
    ],
    explanation: 'Model yirmi ağırlığı taşıyabildiğine göre yeterince güçlüdür. Sıfat + enough dizimiyle “strong enough” kullanılır.',
    cognitiveTraits: ['resultInference', 'wordOrder', 'grammarSelection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['The model held all twenty weights.', 'This result shows sufficient strength.', 'Enough follows an adjective.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-since-for-01', gameId: 'english-cloze', familyId: 'premium-eng-duration', skeletonId: 'premium-eng-duration:since-start-point', subjectId: 'english', topicId: 'time-expressions', learningOutcomeId: 'distinguish-since-from-for',
    context: 'Eren started volunteering at the animal shelter in September. He has worked there ___ the beginning of the school year.',
    prompt: 'Boşluğu hangi sözcük doğru tamamlar?',
    answer: 'since',
    distractors: [
      { text: 'for', misconceptionId: 'english:duration-for-start-point', why: '“The beginning of the school year” bir başlangıç noktasıdır; süre miktarı değildir.', constructionRule: 'use-for-before-starting-point' },
      { text: 'during', misconceptionId: 'english:during-for-continuing-since', why: '“During” bir dönem içindeki zamanı belirtir, başlangıçtan bugüne süren yapıyı kurmaz.', constructionRule: 'replace-since-with-during' },
      { text: 'until', misconceptionId: 'english:end-point-for-start-point', why: '“Until” bitiş sınırı verir; bağlamda çalışma hâlâ sürmektedir.', constructionRule: 'use-end-boundary-in-continuing-action' }
    ],
    explanation: 'Okul yılının başlangıcı belirli bir başlangıç noktasıdır ve çalışma o zamandan beri sürmektedir. Bu nedenle “since” kullanılır.',
    cognitiveTraits: ['timelineReasoning', 'durationClassification', 'grammarSelection', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 2,
    evidence: ['The work started in September.', 'It continues to the present.', 'The phrase names a starting point, not a length of time.']
  }),
  definePremiumChoice({
    id: 'eng-cloze-modal-deduction-01', gameId: 'english-cloze', familyId: 'premium-eng-modals', skeletonId: 'premium-eng-modals:evidence-deduction', subjectId: 'english', topicId: 'modals', learningOutcomeId: 'choose-modal-of-strong-deduction',
    context: 'The classroom lights are on, several bags are beside the desks, and voices are coming from inside. The students ___ be in the classroom.',
    prompt: 'Kanıtlara göre boşluğu en iyi tamamlayan ifade hangisidir?',
    answer: 'must',
    distractors: [
      { text: 'can’t', misconceptionId: 'english:negative-deduction-against-evidence', why: 'İçeride öğrenci olma olasılığını güçlü kanıtlara rağmen imkânsız gösterir.', constructionRule: 'choose-opposite-certainty' },
      { text: 'shouldn’t', misconceptionId: 'english:advice-modal-for-deduction', why: 'Kanıttan çıkarım yapmak yerine uygunluk veya tavsiye anlamı verir.', constructionRule: 'use-advice-modal-in-evidence-inference' },
      { text: 'used to', misconceptionId: 'english:past-habit-for-current-inference', why: 'Şimdiki kanıtları geçmiş alışkanlık yapısıyla tamamlar.', constructionRule: 'use-past-habit-for-present-evidence' }
    ],
    explanation: 'Işıklar, çantalar ve sesler öğrencilerin içeride olduğuna dair güçlü kanıtlardır. Güçlü olumlu çıkarım için “must be” kullanılır.',
    cognitiveTraits: ['evidenceInference', 'modalMeaning', 'contextIntegration', 'multiStepInference', 'conditionEvaluation'], reasoningStepCount: 3,
    evidence: ['The lights are on.', 'Bags are beside the desks.', 'Voices are coming from inside.']
  })
];

export const PREMIUM_EXPANSION_PACK = createPremiumChoicePack({
  version: '2.0.0',
  sourceLabel: 'Zihin Arenası Premium Soru Bankası',
  items: [...LOGIC_ITEMS, ...SOCIAL_ITEMS, ...ENGLISH_ITEMS]
});

export const PREMIUM_EXPANSION_GAME_IDS = PREMIUM_EXPANSION_PACK.gameIds;
export const generatePremiumExpansionRounds = PREMIUM_EXPANSION_PACK.generate;
export const premiumExpansionInventory = PREMIUM_EXPANSION_PACK.inventory;
