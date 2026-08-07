import { defineEvidenceBackedTurkishFamily } from './evidence-backed-turkish-family-engine.js';

function wrong(text, id, description, feedback) {
  return { text, correct: false, misconceptionId: id, description, feedback, evidenceIds: [] };
}
function supported(text, claimTag, evidenceIds) {
  return { text, correct: true, claimTag, evidenceIds };
}
function boundary(text, evidenceIds) { return { text, evidenceIds }; }
function evidence(id, text, description = '', feedback = '') {
  return { id, evidenceId: id, text, description, feedback };
}
function paragraphFamily(config) {
  return defineEvidenceBackedTurkishFamily({
    id: config.id, grade: 4, kind: 'paragraph', topicId: config.topicId,
    outcomeId: config.outcomeId, constructId: config.constructId,
    source: {
      id: config.sourceId,
      context: config.context,
      evidence: config.evidence,
      supportedConclusion: supported(config.conclusion, config.claimTag, config.supportIds),
      unsupportedClaims: config.unsupported,
      supportedBoundaryClaims: config.boundary,
      evidenceOptions: config.evidence,
      bestEvidenceId: config.bestEvidenceId
    }
  });
}
function correctMeaning(text, semanticTag) { return { text, correct: true, semanticTag }; }
function correctRelation(text, relationTag) { return { text, correct: true, relationTag }; }
function correctReplacement(text, replacementTag) { return { text, correct: true, replacementTag }; }
function meaningWrong(text, id, description, feedback) {
  return { text, correct: false, misconceptionId: id, description, feedback };
}
function meaningFamily(config) {
  return defineEvidenceBackedTurkishFamily({
    id: config.id, grade: 4, kind: 'meaning', topicId: config.topicId,
    outcomeId: config.outcomeId, constructId: config.constructId,
    source: {
      id: config.sourceId, context: config.context, targetPhrase: config.targetPhrase, connector: config.connector,
      meaning: correctMeaning(config.meaning, config.semanticTag),
      wrongMeanings: config.wrongMeanings,
      relation: correctRelation(config.relation, config.relationTag),
      wrongRelations: config.wrongRelations,
      replacement: correctReplacement(config.replacement, config.replacementTag),
      wrongReplacements: config.wrongReplacements
    }
  });
}

const paragraphFamilies = [
  paragraphFamily({
    id:'g4-tr-paragraph-garden-records',sourceId:'g4-garden-records',topicId:'reading-inference',outcomeId:'T.4.3.28',constructId:'combine-observation-evidence',claimTag:'records-improve-planning',
    context:'Dördüncü sınıf öğrencileri okul bahçesine aynı gün domates, fasulye ve marul ekti. Her grup haftada iki kez bitki boyunu, yaprak sayısını ve sulama miktarını çizelgeye yazdı. Üç hafta sonra fasulyenin hızlı uzadığı, marulun ise daha sık sulandığında daha canlı kaldığı görüldü. Öğrenciler yeni ekim planını hazırlarken yalnız tahminlerini değil, çizelgedeki sonuçları kullandı.',
    evidence:[
      evidence('e1','Bütün gruplar gözlemlerini haftada iki kez aynı tür çizelgeye kaydetmiştir.','Kayıt düzenini sonuçla karıştırmıştır.','Bu bilgi düzenli veri toplandığını gösterir ancak tek başına hangi planın doğru olduğunu söylemez.'),
      evidence('e2','Fasulyenin üç haftada diğer bitkilere göre daha hızlı uzadığı ölçülmüştür.','Tek bitkinin sonucunu bütün planın tek nedeni sanmıştır.','Bu bulgu önemlidir ancak sonuç farklı bitkilerle ilgili birden çok kanıta dayanır.'),
      evidence('e3','Marulun daha sık sulandığı günlerde daha canlı kaldığı çizelgede görülmüştür.','Yalnız sulama ayrıntısına odaklanmıştır.','Bu kanıt planın bir bölümünü destekler, bütün sonucu tek başına açıklamaz.'),
      evidence('e4','Yeni ekim planı hazırlanırken öğrencilerin tahmin yerine ölçüm sonuçlarını kullanması kararlaştırılmıştır.','Kararı gözlemden bağımsız bir görüş sanmıştır.','Bu cümle kayıtların planlamada kullanıldığını en doğrudan biçimde gösterir.')
    ],bestEvidenceId:'e4',supportIds:['e2','e3','e4'],
    conclusion:'Düzenli gözlem kayıtları, bitkilerin farklı ihtiyaçlarına göre daha bilinçli plan yapılmasını sağlamıştır.',
    unsupported:[
      wrong('Bahçedeki bütün bitkiler aynı miktarda suyla en iyi biçimde gelişmiştir.','same-water','Farklı bitkilerin farklı sonuçlarını tek kurala çevirmiştir.','Metin marulun sulama ihtiyacının farklılaştığını gösterir.'),
      wrong('Fasulye her koşulda domates ve maruldan daha yararlıdır.','value-overreach','Büyüme hızını yararlılık yargısına dönüştürmüştür.','Hızlı uzama, bitkinin her açıdan daha yararlı olduğunu kanıtlamaz.'),
      wrong('Öğrenciler ekim planını öğretmenlerinden hazır olarak almıştır.','invented-source','Metinde bulunmayan bir karar kaynağı eklemiştir.','Planın öğrencilerce çizelge sonuçlarına göre hazırlandığı belirtilmiştir.')
    ],
    boundary:[boundary('Öğrenciler gözlemlerini belirli aralıklarla kaydetmiştir.',['e1']),boundary('Bitkilerin gelişimi aynı özelliklere göre izlenmiştir.',['e1']),boundary('Yeni plan hazırlanırken ölçüm sonuçları dikkate alınmıştır.',['e4'])]
  }),
  paragraphFamily({
    id:'g4-tr-paragraph-library-club',sourceId:'g4-library-club',topicId:'main-idea',outcomeId:'T.4.3.16',constructId:'distinguish-count-and-quality',claimTag:'discussion-deepens-reading',
    context:'Okulun okuma kulübünde ilk ay öğrenciler yalnızca okudukları kitapların adını listeledi. İkinci ay her öğrenci beğendiği bir bölümü arkadaşlarına açıklayıp karakterlerin kararlarını tartıştı. Ödünç alınan kitap sayısı iki ayda da hemen hemen aynı kaldı. Buna rağmen ikinci ay yapılan kısa değerlendirmelerde öğrenciler olayların nedenlerini daha ayrıntılı anlatabildi.',
    evidence:[
      evidence('e1','İlk ay yalnız okunan kitapların adları listelenmiştir.','İlk ayın yöntemini başarı nedeni sanmıştır.','Bu bilgi iki uygulama arasındaki farkı gösterir.'),
      evidence('e2','İkinci ay öğrenciler seçtikleri bölümleri açıklayıp karakter kararlarını tartışmıştır.','Etkinliği yalnız konuşma olarak görmüştür.','Tartışma, metindeki nedenleri açıklamayı gerektirmiştir.'),
      evidence('e3','İki ayda ödünç alınan kitap sayısı yaklaşık olarak aynı kalmıştır.','Kitap sayısını anlama düzeyiyle eşitlemiştir.','Sayı değişmediği için gelişme yalnız daha çok kitap okumayla açıklanamaz.'),
      evidence('e4','İkinci ay öğrenciler olayların nedenlerini değerlendirmelerde daha ayrıntılı anlatmıştır.','Sonucu etkinlikten bağımsız kabul etmiştir.','Bu ölçüm, tartışmanın anlama derinliğiyle birlikte değiştiğini en güçlü biçimde gösterir.')
    ],bestEvidenceId:'e4',supportIds:['e2','e3','e4'],
    conclusion:'Okuduklarını tartışmak, kitap sayısı artmasa da öğrencilerin metni daha derin anlamasına katkı sağlamıştır.',
    unsupported:[
      wrong('İkinci ay öğrenciler ilk aydan iki kat fazla kitap okumuştur.','count-invention','Metindeki sabit kitap sayısını ters yorumlamıştır.','Kitap sayısının yaklaşık aynı kaldığı açıkça belirtilmiştir.'),
      wrong('Kitap hakkında konuşmak bütün öğrencilerin her soruya doğru cevap vermesini sağlamıştır.','absolute-success','Kısmi gelişmeyi kusursuz başarıya dönüştürmüştür.','Metin daha ayrıntılı anlatımdan söz eder, tam başarıdan değil.'),
      wrong('İlk ay yapılan çalışmaların hiçbir yararı olmamıştır.','all-or-nothing','Karşılaştırmayı tamamen yararsızlık yargısına çevirmiştir.','Metin ilk ayın yararsız olduğunu söylemez.')
    ],
    boundary:[boundary('İkinci ay öğrenciler metin üzerine konuşmuştur.',['e2']),boundary('Kitap sayısı iki ay arasında belirgin artmamıştır.',['e3']),boundary('İkinci ay nedenleri açıklama becerisi gelişmiştir.',['e4'])]
  }),
  paragraphFamily({
    id:'g4-tr-paragraph-water-experiment',sourceId:'g4-water-experiment',topicId:'evidence-evaluation',outcomeId:'T.4.3.31',constructId:'compare-groups-from-data',claimTag:'measurement-changes-behaviour',
    context:'İki sınıf bir hafta boyunca muslukları gereksiz açık bırakmama çalışması yaptı. 4-A sınıfı her gün kullanılan su miktarını panoya yazdı ve önceki günle karşılaştırdı. 4-B sınıfı yalnızca “Suyu koruyalım” afişleri hazırladı. Haftanın sonunda 4-A’nın su kullanımı başlangıca göre belirgin biçimde azalırken 4-B’de küçük bir değişim görüldü. İki sınıf da çalışmaya aynı gün başlamıştı.',
    evidence:[
      evidence('e1','İki sınıf da çalışmaya aynı gün başlamıştır.','Başlangıç zamanını tek neden sanmıştır.','Aynı başlangıç, karşılaştırmayı daha adil yapar fakat sonucu açıklamaz.'),
      evidence('e2','4-A her gün su miktarını kaydedip önceki günle karşılaştırmıştır.','Kayıt tutmayı afiş hazırlamayla aynı görmüştür.','Bu uygulama öğrencilere davranışlarının sonucunu düzenli olarak göstermiştir.'),
      evidence('e3','4-B yalnız suyu koruma mesajı içeren afişler hazırlamıştır.','Afişi ölçüm kanıtı sanmıştır.','Afiş farkındalık sağlar ancak kullanımın günlük değişimini göstermez.'),
      evidence('e4','Hafta sonunda 4-A’da belirgin, 4-B’de ise küçük bir azalma ölçülmüştür.','Sonucu grupların uygulamasıyla ilişkilendirmemiştir.','İki yaklaşımın sonuçlarını doğrudan karşılaştırdığı için en güçlü kanıttır.')
    ],bestEvidenceId:'e4',supportIds:['e2','e3','e4'],
    conclusion:'Kullanımı düzenli ölçüp geri bildirim vermek, yalnız hatırlatma afişi hazırlamaktan daha etkili görünmektedir.',
    unsupported:[
      wrong('Afiş hazırlamak su kullanımını kesinlikle artırmıştır.','direction-error','Küçük azalmayı artış diye yorumlamıştır.','4-B’de de küçük bir azalma olduğu belirtilmiştir.'),
      wrong('4-A öğrencileri suyu hiçbir zaman gereksiz kullanmamıştır.','perfect-behaviour','Azalmayı kusursuz davranışa dönüştürmüştür.','Ölçüm yalnız kullanımın azaldığını gösterir.'),
      wrong('İki sınıfın başlangıçtaki su kullanımı tamamen eşittir.','missing-baseline','Aynı gün başlamayı eşit miktar sanmıştır.','Başlangıç miktarlarının eşit olduğu söylenmemiştir.')
    ],
    boundary:[boundary('4-A günlük ölçüm yapmıştır.',['e2']),boundary('4-B farkındalık afişi hazırlamıştır.',['e3']),boundary('4-A’nın azalma miktarı daha büyüktür.',['e4'])]
  }),
  paragraphFamily({
    id:'g4-tr-paragraph-safe-route',sourceId:'g4-safe-route',topicId:'visual-verbal-inference',outcomeId:'T.4.3.27',constructId:'choose-route-from-multiple-criteria',claimTag:'safe-route-not-shortest',
    context:'Öğrenciler okuldan kütüphaneye giden üç yolu inceledi. Birinci yol en kısaydı ancak iki yoğun kavşaktan geçiyordu. İkinci yol biraz uzundu; kaldırımı genişti ve yalnız bir yaya geçidi kullanılıyordu. Üçüncü yol parkın içinden geçiyordu fakat yağmurdan sonra zemini kayganlaşıyordu. Grup, yol seçerken yalnız uzaklığa değil güvenlik koşullarına da bakılması gerektiğini belirtti.',
    evidence:[
      evidence('e1','Birinci yol en kısa olmasına rağmen iki yoğun kavşaktan geçmektedir.','Kısalığı tek seçim ölçütü sanmıştır.','Kısa yolun önemli bir güvenlik sakıncası vardır.'),
      evidence('e2','İkinci yolun geniş kaldırımı ve tek yaya geçidi vardır.','Yolun biraz uzun olmasını tüm olumlu özelliklerden üstün tutmuştur.','Bu özellikler yaya güvenliğini doğrudan destekler.'),
      evidence('e3','Üçüncü yol yağmurdan sonra kayganlaşmaktadır.','Park içinden geçmeyi her koşulda güvenli sanmıştır.','Hava koşulu bu yolun güvenliğini değiştirmektedir.'),
      evidence('e4','Grup, uzaklıkla birlikte güvenlik koşullarının da değerlendirilmesini istemiştir.','Sonuç ölçütünü ayrıntılardan koparmıştır.','Parçadaki bütün yol özelliklerini ortak bir karar ilkesine bağlar.')
    ],bestEvidenceId:'e2',supportIds:['e1','e2','e3','e4'],
    conclusion:'Yaya yolu seçerken en kısa mesafe tek başına yeterli değildir; yolun farklı koşullardaki güvenliği de değerlendirilmelidir.',
    unsupported:[
      wrong('Parktan geçen yol her mevsimde en güvenli yoldur.','weather-ignore','Yağmur koşulunu görmezden gelmiştir.','Metin park yolunun yağmurdan sonra kayganlaştığını söyler.'),
      wrong('Yoğun kavşaklardan geçen yollar her zaman kullanılamaz.','absolute-ban','Risk bilgisini kesin yasağa çevirmiştir.','Metin riskten söz eder, kullanım yasağından değil.'),
      wrong('İkinci yol kütüphaneye giden en kısa yoldur.','distance-swap','İkinci yolun özelliğini birinci yola taşımıştır.','En kısa yolun birinci yol olduğu belirtilmiştir.')
    ],
    boundary:[boundary('Birinci yol iki yoğun kavşaktan geçmektedir.',['e1']),boundary('İkinci yolun kaldırımı geniştir.',['e2']),boundary('Yağmur, üçüncü yolun güvenliğini etkiler.',['e3'])]
  }),
  paragraphFamily({
    id:'g4-tr-paragraph-museum-notes',sourceId:'g4-museum-notes',topicId:'source-comparison',outcomeId:'T.4.3.32',constructId:'combine-source-information',claimTag:'sources-complement-each-other',
    context:'Sınıf, eski bir değirmen hakkında araştırma yaptı. Müzedeki bilgi kartı değirmenin 1912’de kurulduğunu yazıyordu. Köyde yaşayan Ayşe Hanım, çocukluğunda değirmenin kışın da çalıştığını anlattı. Eski bir fotoğrafta ise değirmenin yanında un çuvalları ve bekleyen insanlar görülüyordu. Öğrenciler, tek bir kaynağın bütün sorulara cevap vermediğini fark ederek bilgileri birlikte değerlendirdi.',
    evidence:[
      evidence('e1','Müze kartı değirmenin kuruluş yılını vermektedir.','Tarih bilgisini bütün geçmiş sanmıştır.','Bu kaynak belirli bir soruya kesin bilgi verir.'),
      evidence('e2','Ayşe Hanım değirmenin kışın da çalıştığını hatırlamaktadır.','Sözlü kaynağı kuruluş yılı kanıtı sanmıştır.','Tanıklık kullanım dönemine ilişkin bilgi sağlar.'),
      evidence('e3','Fotoğraf değirmenin yanında çuvallar ve bekleyen insanlar göstermektedir.','Görseldeki ayrıntıları önemsiz saymıştır.','Fotoğraf değirmenin kullanımına ilişkin görsel kanıt sunar.'),
      evidence('e4','Öğrenciler farklı kaynakların farklı soruları yanıtladığını görmüştür.','Kaynakları birbirinin aynısı sanmıştır.','Bu cümle kaynakların birbirini tamamladığı sonucunu doğrudan açıklar.')
    ],bestEvidenceId:'e4',supportIds:['e1','e2','e3','e4'],
    conclusion:'Farklı kaynaklar aynı konu hakkında değişik türde bilgiler vererek araştırmayı tamamlayabilir.',
    unsupported:[
      wrong('Ayşe Hanım değirmenin 1912’de kurulduğunu kendi gözleriyle görmüştür.','timeline-error','Tanığın yaş dönemini kuruluş tarihiyle karıştırmıştır.','Metinde Ayşe Hanım’ın kuruluşu gördüğü söylenmez.'),
      wrong('Fotoğraf değirmenin yılın her günü çalıştığını kesin olarak kanıtlar.','single-photo-overreach','Tek fotoğraftan süreklilik sonucu çıkarmıştır.','Fotoğraf yalnız çekildiği andaki durumu gösterir.'),
      wrong('Müze kartındaki bütün bilgiler yanlıştır.','source-rejection','Kaynakların sınırlı olmasını yanlışlık olarak yorumlamıştır.','Kuruluş yılı bilgisi geçerli bir katkıdır.')
    ],
    boundary:[boundary('Değirmenin kuruluş yılı müze kartında yazılıdır.',['e1']),boundary('Sözlü anlatım değirmenin kış kullanımına değinir.',['e2']),boundary('Fotoğraf kullanım yoğunluğuna ilişkin ayrıntı gösterir.',['e3'])]
  }),
  paragraphFamily({
    id:'g4-tr-paragraph-poster-revision',sourceId:'g4-poster-revision',topicId:'author-attitude',outcomeId:'T.4.3.18',constructId:'evaluate-revision-from-feedback',claimTag:'feedback-improves-product',
    context:'Bir grup öğrenci enerji tasarrufu posteri hazırladı. İlk posterde çok sayıda küçük yazı ve birbirine benzeyen renkler vardı. Sınıf arkadaşları ana mesajın uzaktan okunamadığını söyledi. Grup, eleştirileri not ederek başlığı büyüttü, gereksiz cümleleri çıkardı ve önemli bilgileri farklı renklerle belirginleştirdi. İkinci sunumda öğrenciler posterin mesajını daha kısa sürede anlayabildi.',
    evidence:[
      evidence('e1','İlk posterde küçük yazılar ve benzer renkler kullanılmıştır.','Tasarım sorunlarını mesajın doğruluğuyla karıştırmıştır.','Bu ayrıntılar okunabilirlik sorununu açıklar.'),
      evidence('e2','Sınıf arkadaşları ana mesajın uzaktan okunamadığını belirtmiştir.','Geri bildirimi kişisel beğeni saymıştır.','Eleştiri belirli ve gözlenebilir bir soruna yöneliktir.'),
      evidence('e3','Grup başlığı büyütüp gereksiz cümleleri çıkarmıştır.','Değişiklikleri rastgele sanmıştır.','Düzenlemeler verilen geri bildirime doğrudan yanıt verir.'),
      evidence('e4','İkinci sunumda mesaj daha kısa sürede anlaşılmıştır.','Sonucu değişikliklerden bağımsız görmüştür.','Düzenleme sonrasındaki anlaşılabilirlik gelişimini ölçtüğü için en güçlü kanıttır.')
    ],bestEvidenceId:'e4',supportIds:['e2','e3','e4'],
    conclusion:'Belirli bir soruna yönelik geri bildirim, ürünün amacına uygun biçimde geliştirilmesine yardımcı olabilir.',
    unsupported:[
      wrong('Poster yalnız renk sayısı artırıldığı için başarılı olmuştur.','single-cause','Birden çok düzenlemeyi tek nedene indirgemiştir.','Başlık, cümleler ve renkler birlikte değiştirilmiştir.'),
      wrong('İlk posterde verilen enerji bilgileri tamamen yanlıştır.','content-invention','Okunabilirlik sorununu bilgi yanlışlığı sanmıştır.','Metin bilgilerin yanlış olduğundan söz etmez.'),
      wrong('Bütün eleştiriler bir ürünü mutlaka daha kötü yapar.','reverse-generalization','Olumlu sonuçlanan geri bildirimi ters genellemiştir.','Bu örnekte eleştiriler geliştirme amacıyla kullanılmıştır.')
    ],
    boundary:[boundary('İlk posterde okunabilirlik sorunu vardır.',['e1','e2']),boundary('Grup geri bildirime göre düzenleme yapmıştır.',['e3']),boundary('İkinci posterde mesaj daha hızlı anlaşılmıştır.',['e4'])]
  })
];

const meaningFamilies = [
  meaningFamily({
    id:'g4-tr-meaning-agirdan-almak',sourceId:'g4-meaning-agirdan',topicId:'contextual-meaning',outcomeId:'T.4.3.5',constructId:'infer-idiom-in-context',
    context:'Ece, proje için gereken resimleri günler öncesinden seçmişti. Kerem ise işi ağırdan aldığı için son gün hâlâ hangi fotoğrafları kullanacağına karar verememişti. Bu yüzden grup, sunumu tamamlamak için planladığından daha geç okuldan çıktı.',targetPhrase:'işi ağırdan aldığı',connector:'Bu yüzden',meaning:'gereken hızda davranmayıp işi geciktirdiği',semanticTag:'delay-work',relation:'önceki durumun sonucunu bildirmiştir',relationTag:'result',replacement:'yavaş davranıp işi geciktirdiği',replacementTag:'delay-equivalent',
    wrongMeanings:[meaningWrong('işi herkesten daha dikkatli yaptığı','care-vs-delay','Dikkatli olmayı gecikmeyle karıştırmıştır.','Metinde Kerem’in karar veremeyip işi geciktirdiği anlatılır.'),meaningWrong('görevi başkasına verdiği','delegate','Metinde olmayan bir görev devri eklemiştir.','Kerem görevi devretmemiş, geciktirmiştir.'),meaningWrong('çalışmayı erkenden tamamladığı','opposite-time','Bağlamın zaman yönünü ters çevirmiştir.','Son gün hâlâ karar veremediği belirtilmiştir.')],
    wrongRelations:[meaningWrong('karşılaştırma yapmıştır','relation-compare','Sonucu karşılaştırma sanmıştır.','İkinci cümle önceki gecikmenin sonucunu açıklar.'),meaningWrong('örnek vermiştir','relation-example','Sonucu örnek sanmıştır.','Bağlaç bir örnek başlatmaz.'),meaningWrong('koşul bildirmiştir','relation-condition','Neden-sonuç bağını koşul sanmıştır.','Sunumun gecikmesi önceki durumun sonucudur.')],
    wrongReplacements:[meaningWrong('hızla tamamladığı','replacement-opposite','Anlamı tersine çevirmiştir.','Hedef söz gecikmeyi anlatır.'),meaningWrong('arkadaşlarına dağıttığı','replacement-invented','Metinde olmayan görev dağıtımı eklemiştir.','Görev paylaşımı anlatılmıyor.'),meaningWrong('çok kolay bulduğu','replacement-ease','Zorluk düzeyini zaman davranışı sanmıştır.','Söz işin kolaylığını değil yavaş ilerlemeyi belirtir.')]
  }),
  meaningFamily({
    id:'g4-tr-meaning-gozden-gecirmek',sourceId:'g4-meaning-review',topicId:'contextual-meaning',outcomeId:'T.4.3.5',constructId:'infer-phrasal-meaning',
    context:'Mina öyküsünü bitirdiğinde hemen teslim etmedi. Metni yeniden gözden geçirdi; eksik noktalama işaretlerini tamamladı ve iki cümleyi daha açık yazdı. Ancak öykünün olay sırasını değiştirmedi.',targetPhrase:'gözden geçirdi',connector:'Ancak',meaning:'hataları ve eksikleri bulmak için yeniden inceledi',semanticTag:'review-revise',relation:'önceki düzenlemeyi sınırlayan bir karşıtlık kurmuştur',relationTag:'contrast-limit',replacement:'yeniden inceleyip düzenledi',replacementTag:'review-equivalent',
    wrongMeanings:[meaningWrong('ezberlemek için defalarca okudu','memorize','Düzeltme amacını ezberleme sanmıştır.','Bağlamda noktalama ve açıklık düzenlenmiştir.'),meaningWrong('başkasına yüksek sesle okudu','read-aloud','Metinde olmayan dinleyici eklemiştir.','Mina metni kendi düzeltmek için incelemiştir.'),meaningWrong('öyküyü tamamen baştan yazdı','rewrite-all','Kısmi düzenlemeyi tümünü değiştirme sanmıştır.','Olay sırası değişmemiştir.')],
    wrongRelations:[meaningWrong('neden bildirmiştir','relation-cause','Sınırlamayı neden sanmıştır.','Ancak sözü yapılan değişikliklerin sınırını gösterir.'),meaningWrong('sonuç bildirmiştir','relation-result','Karşıtlığı sonuç sanmıştır.','İkinci bölüm önceki düzenlemenin aksine değişmeyen yönü belirtir.'),meaningWrong('benzerlik kurmuştur','relation-similarity','Karşıt yönleri benzerlik sanmıştır.','Düzenlenen ve değişmeyen özellikler karşılaştırılmıştır.')],
    wrongReplacements:[meaningWrong('aklında tutmaya çalıştı','replacement-memory','Düzenleme anlamını değiştirmiştir.','Hedef söz inceleme ve düzeltmeyi anlatır.'),meaningWrong('başkasından sakladı','replacement-hide','Metinde gizleme yoktur.','Teslimi erteleme, saklama anlamına gelmez.'),meaningWrong('tamamen sildi','replacement-delete','İncelemeyi yok etme sanmıştır.','Metin geliştirilmiştir, silinmemiştir.')]
  }),
  meaningFamily({
    id:'g4-tr-meaning-kulak-vermek',sourceId:'g4-meaning-listen',topicId:'contextual-meaning',outcomeId:'T.4.3.5',constructId:'infer-idiom-attention',
    context:'Takım ilk denemede köprüyü ayakta tutamadı. Zeynep, arkadaşlarının “Tabanı genişletelim.” önerisine kulak verdi çünkü aynı sorun iki kez yaşanmıştı. Yeni modelde taban genişletilince köprü daha dengeli durdu.',targetPhrase:'kulak verdi',connector:'çünkü',meaning:'öneriyi dikkatle dinleyip dikkate aldı',semanticTag:'heed-advice',relation:'kararın nedenini açıklamıştır',relationTag:'cause',replacement:'öneriyi önemseyip uyguladı',replacementTag:'heed-equivalent',
    wrongMeanings:[meaningWrong('sesi duyamadığı için yaklaştı','literal-hearing','Deyimi gerçek işitme anlamında yorumlamıştır.','Bağlam önerinin dikkate alınmasını anlatır.'),meaningWrong('arkadaşlarının sözünü kesti','interrupt','Davranış yönünü ters çevirmiştir.','Zeynep öneriyi dinleyip uygulamıştır.'),meaningWrong('öneriyi hiç düşünmeden reddetti','reject','Bağlamın sonucuna aykırıdır.','Yeni model öneriye göre değiştirilmiştir.')],
    wrongRelations:[meaningWrong('sonuç bildirmiştir','relation-result','Nedeni sonuç sanmıştır.','İki kez sorun yaşanması kararın nedenidir.'),meaningWrong('karşıtlık kurmuştur','relation-contrast','Uyumlu ilişkiyi karşıtlık sanmıştır.','Cümleler birbirini açıklamaktadır.'),meaningWrong('örnek vermiştir','relation-example','Neden açıklamasını örnek sanmıştır.','Çünkü sözü gerekçe sunar.')],
    wrongReplacements:[meaningWrong('öneriyi duymamış gibi davrandı','replacement-ignore','Anlamı tersine çevirmiştir.','Hedef söz öneriyi dikkate almayı anlatır.'),meaningWrong('öneriyi yüksek sesle tekrarladı','replacement-repeat','Tekrarlamayı uygulama sanmıştır.','Zeynep öneriyi modelde kullanmıştır.'),meaningWrong('arkadaşlarından uzaklaştı','replacement-distance','Metinde olmayan hareket eklemiştir.','Deyim fiziksel uzaklık anlatmaz.')]
  }),
  meaningFamily({
    id:'g4-tr-meaning-ince-eleyip-sik-dokumak',sourceId:'g4-meaning-careful',topicId:'contextual-meaning',outcomeId:'T.4.3.5',constructId:'infer-idiom-careful-choice',
    context:'Sınıf temsilcileri gezi için üç müzeyi karşılaştırdı. Ulaşım, güvenlik, ücret ve sergilenen eserleri tek tek incelediler. Seçim yaparken ince eleyip sık dokudular; oysa ilk öneride yalnız bilet fiyatına bakılmıştı.',targetPhrase:'ince eleyip sık dokudular',connector:'oysa',meaning:'karar vermeden önce bütün ayrıntıları dikkatle değerlendirdiler',semanticTag:'careful-evaluation',relation:'önceki dikkatli yöntemle eski yüzeysel yöntemi karşılaştırmıştır',relationTag:'contrast',replacement:'ayrıntılı ve titiz bir değerlendirme yaptılar',replacementTag:'careful-equivalent',
    wrongMeanings:[meaningWrong('kararı rastgele verdiler','random','Titizliği rastgelelikle karıştırmıştır.','Birden çok ölçüt tek tek incelenmiştir.'),meaningWrong('yalnız en ucuz seçeneği aldılar','single-criterion','Eski yöntemi yeni karar sanmıştır.','Yeni seçimde dört ölçüt kullanılmıştır.'),meaningWrong('geziyi tamamen iptal ettiler','cancel','Metinde olmayan sonuç eklemiştir.','Müze seçimi yapılmıştır.')],
    wrongRelations:[meaningWrong('aynı düşünceyi tekrarlamıştır','relation-repeat','Karşıt yöntemleri tekrar sanmıştır.','Oysa sözü eski ve yeni yöntemi karşılaştırır.'),meaningWrong('neden bildirmiştir','relation-cause','Karşıtlığı gerekçe sanmıştır.','İkinci bölüm farklı bir yaklaşımı gösterir.'),meaningWrong('sonuç bildirmiştir','relation-result','Karşılaştırmayı sonuç sanmıştır.','Oysa sonucu değil zıtlığı kurar.')],
    wrongReplacements:[meaningWrong('hiç düşünmeden karar verdiler','replacement-hasty','Anlamı tersine çevirmiştir.','Hedef söz titiz değerlendirmeyi anlatır.'),meaningWrong('yalnız fiyatları topladılar','replacement-narrow','Bir ölçütü bütün değerlendirme sanmıştır.','Ulaşım, güvenlik ve eserler de incelenmiştir.'),meaningWrong('kararı başkasına bıraktılar','replacement-delegate','Metinde olmayan görev devri eklemiştir.','Temsilciler kararı kendileri değerlendirmiştir.')]
  }),
  meaningFamily({
    id:'g4-tr-meaning-elini-tasin-altina-koymak',sourceId:'g4-meaning-responsibility',topicId:'contextual-meaning',outcomeId:'T.4.3.5',constructId:'infer-idiom-responsibility',
    context:'Mahalle parkındaki kitap dolabı yağmurdan zarar görmüştü. Çocuklar yalnız şikâyet etmek yerine elini taşın altına koydu; görevleri paylaşıp rafları kuruttu ve koruyucu kaplama yaptı. Böylece dolap kısa sürede yeniden kullanılabildi.',targetPhrase:'elini taşın altına koydu',connector:'Böylece',meaning:'sorunun çözümü için sorumluluk alıp çalıştı',semanticTag:'take-responsibility',relation:'yapılan çalışmaların sonucunu bildirmiştir',relationTag:'result',replacement:'çözüm için sorumluluk üstlendi',replacementTag:'responsibility-equivalent',
    wrongMeanings:[meaningWrong('ağır bir taşı tek başına kaldırdı','literal-stone','Deyimi gerçek anlamda yorumlamıştır.','Bağlam ortak sorumluluk ve çalışmayı anlatır.'),meaningWrong('sorunu başkalarına bıraktı','avoid-responsibility','Anlamı tersine çevirmiştir.','Çocuklar görev paylaşmıştır.'),meaningWrong('dolabı kullanmaktan vazgeçti','give-up','Çözüm çabasını vazgeçme sanmıştır.','Dolap yeniden kullanılmıştır.')],
    wrongRelations:[meaningWrong('neden bildirmiştir','relation-cause','Sonucu neden sanmıştır.','Dolabın açılması önceki çalışmaların sonucudur.'),meaningWrong('karşıtlık kurmuştur','relation-contrast','Uyumlu sonucu karşıtlık sanmıştır.','İkinci cümle yapılan işin sonucunu verir.'),meaningWrong('örnek vermiştir','relation-example','Sonucu örnek sanmıştır.','Böylece sonucu bağlar.')],
    wrongReplacements:[meaningWrong('sorundan uzak durdu','replacement-avoid','Anlamı tersine çevirmiştir.','Hedef söz sorumluluk almayı anlatır.'),meaningWrong('yalnız şikâyet etti','replacement-complain','Bağlam açıkça bunun yerine çalışıldığını söyler.','Çocuklar görev alıp çözüm üretmiştir.'),meaningWrong('dolabı gizledi','replacement-hide','Metinde olmayan eylem eklemiştir.','Dolap onarılmıştır.')]
  }),
  meaningFamily({
    id:'g4-tr-meaning-yol-gostermek',sourceId:'g4-meaning-guide',topicId:'contextual-meaning',outcomeId:'T.4.3.5',constructId:'infer-metaphorical-guidance',
    context:'Deniz, uzun problemi görünce hangi işlemden başlayacağını bilemedi. Öğretmeni cevabı söylemedi; küçük bir tablo çizip verilenlerle isteneni ayırarak ona yol gösterdi. Hem Deniz çözümü kendi tamamladı hem de benzer sorularda kullanacağı bir yöntem öğrendi.',targetPhrase:'yol gösterdi',connector:'Hem',meaning:'çözümü doğrudan vermeden nasıl ilerleyeceğini öğretti',semanticTag:'guide-method',relation:'iki olumlu sonucu birlikte eklemiştir',relationTag:'addition',replacement:'izleyeceği yöntemi fark etmesine yardım etti',replacementTag:'guide-equivalent',
    wrongMeanings:[meaningWrong('sınıftan çıkış yönünü tarif etti','literal-route','Mecazı gerçek yol anlamında yorumlamıştır.','Bağlam problem çözme yöntemiyle ilgilidir.'),meaningWrong('doğru cevabı doğrudan söyledi','give-answer','Yöntem göstermeyi cevap vermek sanmıştır.','Öğretmenin cevabı söylemediği açıkça belirtilmiştir.'),meaningWrong('problemi Deniz yerine çözdü','solve-for-student','Rehberliği işi üstlenme sanmıştır.','Deniz çözümü kendisi tamamlamıştır.')],
    wrongRelations:[meaningWrong('karşıtlık kurmuştur','relation-contrast','Birlikte gerçekleşen sonuçları karşıt sanmıştır.','Hem...hem iki sonucu ekler.'),meaningWrong('neden bildirmiştir','relation-cause','Eklemeyi gerekçe sanmıştır.','İki kazanım yan yana verilmiştir.'),meaningWrong('koşul bildirmiştir','relation-condition','Birlikte oluşu koşul sanmıştır.','Cümlede koşul yoktur.')],
    wrongReplacements:[meaningWrong('cevabı onun yerine yazdı','replacement-answer','Yöntem göstermeyi cevap verme sanmıştır.','Deniz çözümü kendi yapmıştır.'),meaningWrong('sınıfın kapısını tarif etti','replacement-literal','Mecaz anlamı gerçek yola çevirmiştir.','Bağlam çözüm stratejisidir.'),meaningWrong('problemi daha da karıştırdı','replacement-confuse','Anlamı tersine çevirmiştir.','Tablo çözümü kolaylaştırmıştır.')]
  })
];

export const GRADE4_EVIDENCE_BACKED_TURKISH_FAMILIES = Object.freeze([...paragraphFamilies, ...meaningFamilies]);
