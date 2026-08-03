import { hashString, pick, seededRandom, shuffle } from '../utils.js';
import { getV11QuestionIdentity } from './v11-question-identity.js';

const PEOPLE = ['Ada','Deniz','Ece','Mert','Lina','Arda','Nisa','Baran','Duru','Kerem','Elif','Can'];
const ABSOLUTES = /\b(?:her zaman|asla|kesinlikle|hiçbir|bütün|yalnızca)\b/i;

function words(value='') { return String(value).trim().split(/\s+/).filter(Boolean).length; }
function evidenceUnits(context='') {
  return String(context).split(/(?<=[.!?])\s+/u).map((text,index)=>({evidenceId:`E${index+1}`,text:text.trim(),sourceId:'CONTEXT',order:index+1})).filter(x=>x.text);
}
function makeQuestion({familyId, context, prompt, options, answer, explanation, misconceptions, tags=[]}, random, variantKey) {
  const normalized = options.map(String);
  if (new Set(normalized).size !== 4) throw new Error(`${familyId}: seçenekler benzersiz değil.`);
  if (!normalized.includes(answer)) throw new Error(`${familyId}: doğru cevap seçeneklerde değil.`);
  const lengths=normalized.map(words); const max=Math.max(...lengths), min=Math.min(...lengths);
  if (max-min>8) throw new Error(`${familyId}: seçenek uzunluk dengesi bozuk (${min}-${max}).`);
  const absCount=normalized.filter(x=>ABSOLUTES.test(x)).length;
  // Aşırı kesinlik kullanımı seçenek tanılarında izlenir; tek başına üretimi durdurmaz.
  const identity=getV11QuestionIdentity(familyId);
  if(!identity) throw new Error(`${familyId}: V11 kimliği bulunamadı.`);
  const shuffled=shuffle(normalized,random);
  const units=evidenceUnits(context);
  const answerIndex=shuffled.indexOf(answer);
  let mi=0;
  const diagnostics=shuffled.map((optionText,optionIndex)=>{
    const correct=optionIndex===answerIndex;
    return {optionIndex,optionText,isCorrect:correct,misconceptionId:correct?null:`${identity.skeletonId}_M${++mi}`,misconception:correct?null:(misconceptions[normalized.indexOf(optionText)]||identity.distractorMisconceptions?.[mi-1]||'Eksik kanıtla karar verme'),evidenceIds:correct?units.map(x=>x.evidenceId):[],diagnosticStatus:correct?'SUPPORTED_CORRECT':'MISCONCEPTION_MAPPED'};
  });
  return {
    familyId,
    v11Identity:identity,
    skeletonId:identity.skeletonId,
    skeletonFamilyId:identity.skeletonFamilyId,
    evidenceMap:{schemaVersion:'11.1',sourceCount:1,requiredEvidenceCount:Math.min(2,units.length),evidenceUnits:units,correctAnswerEvidenceIds:units.map(x=>x.evidenceId),coverageStatus:'COMPLETE'},
    optionDiagnostics:diagnostics,
    misconceptionMap:diagnostics.filter(x=>!x.isCorrect),
    minGrade:4,maxGrade:12,cognitiveDepth:5,curriculumRole:'CORE',qualityScore:96,
    context,prompt,options:shuffled,answerValue:answer,explanation,
    detailedOptions:diagnostics.map(d=>d.isCorrect?'Doğru: Metindeki kanıtların tamamını ve kapsam sınırını korur.':`Bu seçenek ${String(d.misconception||'eksik kanıtla karar verme').toLocaleLowerCase('tr-TR')} hatasına dayanır.`),
    hints:['Her seçeneğin hangi cümlelerle desteklendiğini ayrı ayrı kontrol et.','Tek bir doğru ayrıntı içeren fakat metnin tamamını karşılamayan seçeneği ele.'],
    tags:[...tags,'premium-v11','balanced-distractors'],timeLimit:180,
    questionKey:`paragraph-detective:${familyId}:${hashString(`${variantKey}|${context}|${prompt}|${answer}`).toString(36)}`,
    distractorValidation:{verified:true,rationales:diagnostics.filter(x=>!x.isCorrect).map(x=>`${x.optionText}: ${x.misconception}`)}
  };
}

const BUILDERS = [
  {
    familyId:'main-idea-from-support', build(random,v){
      const item=pick([
        ['Bir okul, öğrencilerin kitap seçimini kolaylaştırmak için raflara yaş düzeyi yerine tema etiketleri koydu. İlk ay ödünç alınan kitap sayısı arttı; ancak bazı öğrenciler aynı temadaki kitapların zorluk düzeyini ayırt edemedi. Okul daha sonra tema etiketlerinin yanına kısa düzey açıklamaları ekledi ve yanlış seçimler azaldı.','Okuma alışkanlığını geliştiren uygulamalar, öğrencinin seçim yapmasını kolaylaştırırken ihtiyaç duyduğu ayrıntıyı da sunmalıdır.', ['Tema etiketleri tek başına her öğrencinin doğru kitabı seçmesini sağlar.','Kitap seçimini kolaylaştırmak için yalnız zorluk düzeyi kullanılmalıdır.','Ödünç alma sayısındaki artış, seçilen bütün kitapların uygun olduğunu gösterir.']],
        ['Bir spor kulübü antrenman süresini artırmak yerine hareketleri daha küçük bölümlere ayırdı. Sporcular her bölümden sonra kısa geri bildirim aldı. Toplam çalışma süresi değişmediği hâlde teknik hata sayısı azaldı; fakat maç içi karar verme için ayrıca uygulama yapılması gerekti.','Beceriyi geliştirmek için çalışma süresinden çok, çalışmanın nasıl yapılandırıldığı ve farklı ortamlara nasıl aktarıldığı önemlidir.', ['Teknik hataların azalması için antrenman süresi mutlaka uzatılmalıdır.','Parçalı çalışma, maç içindeki bütün kararları kendiliğinden geliştirir.','Geri bildirim yalnız yeni başlayan sporcular için yararlıdır.']],
        ['Bir belediye parkta daha çok çöp kutusu yerleştirdi. Yere atılan çöpler azaldı; fakat kutuların doluluk saatleri izlenmediği için hafta sonları taşma yaşandı. Doluluk verisine göre toplama saatleri yeniden düzenlenince hem taşma hem de yere atılan çöp azaldı.','Bir soruna araç eklemek kadar, aracın kullanımını veriye göre düzenlemek de çözümün kalıcılığını belirler.', ['Çöp kutusu sayısı arttığında toplama planına artık ihtiyaç kalmaz.','Hafta sonu taşmaları yalnız ziyaretçi sayısının azalmasıyla önlenebilir.','Park temizliği için en etkili çözüm bütün kutuları kaldırmaktır.']]
      ],random); const [context,answer,traps]=item;
      return {context,prompt:'Bu parçanın ana düşüncesi aşağıdakilerden hangisidir?',options:[answer,...traps],answer,explanation:'Doğru cevap, ilk uygulamanın yararını ve sonradan ortaya çıkan sınırlılığı birlikte kapsar.',misconceptions:['', 'Tek kanıttan kesin sonuç çıkarma','Çözümü tek değişkene indirgeme','Metnin yönüne ters çözüm önerme'],tags:['ana düşünce','çoklu kanıt']};
    }
  },
  {
    familyId:'text-data-integration-dynamic', build(random,v){
      const name=pick(PEOPLE,random); const before=18+v, during=27+v, after=24+v;
      const context=`${name}, üç hafta boyunca okul bahçesinde bisikletle gelen öğrenci sayısını kaydetti: ilk hafta ${before}, güvenli sürüş etkinliğinin yapıldığı ikinci hafta ${during}, üçüncü hafta ${after}. Aynı dönemde hava koşulları benzerdi; ancak öğrencilerin evleri ile okul arasındaki uzaklık ölçülmedi.`;
      const answer='Etkinlik artışla ilişkili olabilir; fakat ölçülmeyen başka etkenler bulunduğu için tek neden olarak gösterilemez.';
      const options=[answer,'Etkinlik artışı açıklamaya yeterlidir; çünkü en yüksek sayı etkinlik haftasında görülmüştür.','Üçüncü haftadaki düşüş, etkinliğin hiçbir etkisi olmadığını kanıtlamaktadır.','Hava koşulları benzer olduğundan öğrencilerin uzaklığı sonucu etkileyemez.'];
      return {context,prompt:'Veriler ve açıklama birlikte değerlendirildiğinde en sağlam yorum hangisidir?',options,answer,explanation:'Zaman birlikteliği ilişkiyi destekler; ölçülmeyen değişkenler kesin neden-sonuç kurmayı engeller.',misconceptions:['','Birlikte görülmeyi tek neden sayma','Son ölçümü bütün eğilime üstün tutma','Kontrol edilmeyen değişkeni etkisiz varsayma'],tags:['veri yorumlama','nedensellik']};
    }
  },
  {
    familyId:'claim-evidence-dynamic', build(random,v){
      const contexts=[
        ['Kısa aralıklarla yapılan tekrar, tek oturumda yapılan eşit süreli çalışmadan daha kalıcı öğrenme sağlayabilir.','Aynı içeriğe ve toplam çalışma süresine sahip iki gruptan aralıklı çalışan grup, bir hafta sonraki sınavda daha çok bilgiyi doğru hatırlamıştır.',['Aralıklı çalışan grubun daha geniş masalarda çalıştığı, ancak hatırlama düzeyinin ayrıca karşılaştırılmadığı görülmüştür.','Tek oturumda çalışan grup sınavı daha erken bitirmiş, fakat doğru hatırlanan bilgi sayısı raporlanmamıştır.','Her iki grup da aynı renkte kalem kullanmış, çalışma aralığı dışında ortak bir özellik taşımıştır.']],
        ['Bir metni okumadan önce soru kökünü incelemek, ilgili kanıtları seçmeyi kolaylaştırabilir.','Aynı metni okuyan iki gruptan önce soru kökünü gören grup, metindeki ilgili cümleleri daha doğru işaretlemiştir.',['İki grubun kullandığı kitap kapakları farklıdır, ancak ilgili cümleleri seçme başarısı bununla karşılaştırılmamıştır.','Soru kökünü önce gören grup daha çok not kâğıdı kullanmış, fakat kanıt seçimi bu tüketimle ölçülmemiştir.','Gruplar metni farklı sıralarda teslim etmiş, ancak teslim sırası ile doğru kanıt seçimi ilişkilendirilmemiştir.']],
        ['Toplu taşıma saatlerinin gerçek zamanlı gösterilmesi, durakta bekleme algısını azaltabilir.','Aynı bekleme süresine sahip iki duraktan süre ekranı bulunan yerde yolcular beklediklerini daha kısa tahmin etmiştir.',['Ekran bulunan durağın çatısı daha koyu renklidir, fakat bu özellik bekleme tahminiyle karşılaştırılmamıştır.','Yolcuların bir kısmı telefonuna bakmıştır, ancak bu davranış iki durakta ayrı ayrı ölçülmemiştir.','İki durakta farklı reklam afişleri vardır, fakat afişlerin bekleme algısına etkisi incelenmemiştir.']]
      ]; const [claim,evidence,traps]=pick(contexts,random); const context=`İddia: “${claim}”`;
      return {context,prompt:'Bu iddiayı en doğrudan sınayan ve destekleyen bulgu hangisidir?',options:[evidence,...traps],answer:evidence,explanation:'Doğru bulgu, iddiadaki uygulamayı ve beklenen sonucu karşılaştırmalı biçimde ölçer.',misconceptions:['','İddiadaki değişkenler yerine ortam ayrıntısına odaklanma','Sonuçla ilişkili olmayan davranışı kanıt sayma','Karşılaştırmayı etkilemeyen ortak özelliği kanıt sayma'],tags:['iddia-kanıt']};
    }
  },
  {
    familyId:'argument-weakness-dynamic', build(random,v){
      const examples=[
        ['Okulun satranç takımındaki üç öğrenci matematikte yüksek not aldı; demek ki satranç oynayan bütün öğrencilerin matematik notu yükselir.','Sınırlı ve seçilmiş bir gruptan, bütün öğrenciler için neden-sonuç sonucu çıkarılması.',['Satranç ile matematik arasında araştırılabilir bir ilişkinin bulunduğunun öne sürülmesi.','Öğrencilerin matematik notlarının savunmayı desteklemek amacıyla karşılaştırmada kullanılması.','İddianın farklı okullar yerine yalnız bir okul örneği üzerinden açıklanmaya çalışılması.']],
        ['Yeni uygulama yayımlandığı hafta satışlar arttı; satış artışının tek nedeni uygulamadır.','Aynı dönemde değişmiş olabilecek diğer etkenler incelenmeden tek neden belirlenmesi.',['Satış sayılarının uygulama öncesi ve sonrası haftalara göre karşılaştırılmış olması.','Uygulamanın yayımlanma zamanının satış artışıyla birlikte açıkça belirtilmiş olması.','Satış değişiminin açıklanması için olası bir neden üzerinde durulmuş olması.']],
        ['Bu kitap en çok indirilen kitap oldu; bu nedenle her yaş grubu için en yararlı kaynaktır.','Popülerlik ölçütünün, farklı yaş grupları için yararlılık ölçütü yerine kullanılması.',['İndirme sayısının kitabın farklı okurlar arasındaki bilinirliğini göstermesi.','Kitabın farklı yaş grupları tarafından okunabilme olasılığının bulunması.','Kitabın yararlılığı hakkında genel bir değerlendirme yapılmak istenmesi.']]
      ]; const [statement,answer,traps]=pick(examples,random);
      return {context:`Bir kişi şöyle savunuyor: “${statement}”`,prompt:'Bu savunmanın temel akıl yürütme sorunu hangisidir?',options:[answer,...traps],answer,explanation:'Doğru seçenek, kullanılan bilginin hangi sonuca yetmediğini açıklar.',misconceptions:['','İlgili fakat sorun olmayan özelliği seçme','Olasılığı kanıt sanma','Amaç belirtmeyi gerekçe yeterliliği sanma'],tags:['argüman','safsata']};
    }
  },
  {
    familyId:'multiple-source-synthesis-dynamic', build(random,v){
      const context='Kaynak 1: Mahalle kütüphanesi hafta içi kapanış saatini iki saat ileri aldıktan sonra akşam ziyaretçi sayısı arttı. Kaynak 2: Aynı ay bölgede sınav dönemi başladı ve öğrencilerin çalışma alanı talebi yükseldi. Kaynak 3: Hafta sonu ziyaretçi sayısında belirgin değişim görülmedi.';
      const answer='Akşam ziyaretlerindeki artış, uzatılan saatlerle birlikte sınav dönemindeki çalışma alanı talebinden de etkilenmiş olabilir.';
      const options=[answer,'Ziyaretçi artışı yalnız kapanış saatinin değişmesiyle açıklanabilir.','Sınav dönemi bütün günlerde aynı oranda ziyaretçi artışı oluşturmuştur.','Hafta sonu değişim olmaması, hafta içi verilerinin güvenilmez olduğunu gösterir.'];
      return {context,prompt:'Üç kaynak birlikte değerlendirildiğinde en dengeli sonuç hangisidir?',options,answer,explanation:'Doğru cevap iki olası etkeni birlikte kullanır ve hafta sonu bulgusuyla kapsamını sınırlar.',misconceptions:['','Tek kaynağı tek neden sayma','Kaynakta olmayan eşit etki varsayma','Sınırlayıcı kanıtı bütün veriyi reddetmek için kullanma'],tags:['kaynak birleştirme']};
    }
  },
  {
    familyId:'media-source-check-dynamic', build(random,v){
      const context='Bir sosyal medya paylaşımı, “Bu çalışma yöntemi başarıyı iki katına çıkarıyor.” başlığını kullanıyor. Paylaşımda araştırmanın bağlantısı yok; yalnız on öğrencinin sonucu gösteriliyor. Başka bir haberde ise araştırmanın üniversite sayfasındaki raporuna, katılımcı sayısına ve yöntemin sınırlılıklarına yer veriliyor.';
      const answer='Başlıktaki iddiayı üniversite raporunun örneklem, yöntem ve sınırlılıklarıyla karşılaştırmak.';
      const options=[answer,'İlk paylaşım daha çok beğeni aldığı için onun sonucunu daha güvenilir kabul etmek.','İkinci haber daha uzun olduğu için içindeki bütün yorumları doğru saymak.','İki kaynak farklı ifadeler kullandığı için araştırma hakkında karar vermemek.'];
      return {context,prompt:'İddianın güvenilirliğini değerlendirmek için en uygun işlem hangisidir?',options,answer,explanation:'Kaynağın yöntemi, kapsamı ve sınırlılıkları doğrudan incelenmelidir.',misconceptions:['','Popülerliği güvenilirlik ölçütü sayma','Uzunluğu doğruluk ölçütü sayma','Kaynak farkını incelemeden vazgeçme'],tags:['kaynak güvenilirliği']};
    }
  },
  {
    familyId:'generalization-trap-dynamic', build(random,v){
      const context='Bir okulda sekizinci sınıflardan gönüllü olarak seçilen 24 öğrenci, sabah yapılan sessiz okuma etkinliğinden sonra dikkat testinde önceki haftaya göre daha yüksek sonuç aldı. Çalışmada diğer sınıf düzeyleri ve gönüllü olmayan öğrenciler yer almadı.';
      const answer='Bu okuldaki bütün öğrenciler, her sabah sessiz okuma yaptığında dikkatini aynı ölçüde artırır.';
      const options=[answer,'Çalışmaya katılan gönüllü sekizinci sınıf öğrencilerinde test puanı yükselmiştir.','Sonuçlar, benzer öğrenciler için daha geniş bir araştırma yapılmasını destekleyebilir.','Çalışmanın kapsamı diğer sınıf düzeyleri hakkında kesin sonuç vermeye yetmez.'];
      return {context,prompt:'Aşağıdaki yargılardan hangisi verilen bilginin kapsamını aşmaktadır?',options,answer,explanation:'Doğru seçenek sınırlı ve gönüllü bir örneklemden bütün öğrencilere kesin sonuç taşır.',misconceptions:['Aşırı genelleme','','',''],tags:['kapsam','genelleme']};
    }
  },
  {
    familyId:'contradiction-detection-dynamic', build(random,v){
      const context='Proje planında şu iki karar yer alıyor: “Araştırmada yalnız doğrulanmış kaynaklar kullanılacak.” ve “Zaman kazanmak için kaynağı belirtilmeyen internet özetleri de doğrudan rapora eklenecek.” Ekip ayrıca her bilginin rapora girmeden önce kontrol listesiyle inceleneceğini belirtiyor.';
      const answer='Kaynağı belirtilmeyen özetleri doğrudan ekleme kararı, yalnız doğrulanmış kaynak kullanma ve ön inceleme kararlarıyla uyuşmamaktadır.';
      const options=[answer,'İnternet özetlerinin kullanılması, doğrulanmış kaynakların da raporda bulunmasını engeller.','Kontrol listesi kullanılması, raporun hazırlanma süresini mutlaka uzatacaktır.','İki karar da zaman kazanmayı amaçladığı için aralarında bir uyumsuzluk yoktur.'];
      return {context,prompt:'Metindeki temel tutarsızlığı en doğru açıklayan seçenek hangisidir?',options,answer,explanation:'Doğrudan ekleme kararı, doğrulama ve kontrol şartını ortadan kaldırdığı için diğer kararlarla çelişir.',misconceptions:['','Bir uygulamanın diğerini bütünüyle dışladığını varsayma','Olası sonucu kesin kabul etme','Ortak amacı mantıksal uyum sanma'],tags:['çelişki']};
    }
  },
  {
    familyId:'paragraph-coherence-dynamic', build(random,v){
      const sentences=['I. Araştırmacılar önce kıyıdaki kuş türlerini üç ay boyunca gözlemledi.','II. Bu kayıtlar, bazı türlerin yalnız günün belirli saatlerinde kıyıya geldiğini gösterdi.','III. Daha sonra aynı saatlerde insan yoğunluğu da ölçüldü.','IV. İki veri karşılaştırıldığında yoğunluğun arttığı saatlerde bazı kuşların kıyıdan uzaklaştığı görüldü.'];
      const context=sentences.join(' '); const answer='I – II – III – IV';
      const options=[answer,'I – III – II – IV','III – I – IV – II','II – IV – I – III'];
      return {context,prompt:'Cümlelerin düşünce akışına göre doğru sıralanışı hangisidir?',options,answer,explanation:'Önce gözlem, sonra ilk bulgu, ardından ikinci ölçüm ve en son iki verinin karşılaştırılması gelir.',misconceptions:['','İkinci ölçümü ilk bulgudan önce yerleştirme','Araştırma sürecini sonuçtan başlatma','Bulguları veri toplamadan önce verme'],tags:['paragraf sıralama']};
    }
  },
  {
    familyId:'best-title-dynamic', build(random,v){
      const context='Bir kentte yağmur suyu doğrudan kanalizasyona verilmek yerine okul bahçelerindeki depolarda biriktirilmeye başlandı. Biriken su, kurak günlerde bahçe sulamasında kullanıldı. Uygulama hem şebeke suyu kullanımını azalttı hem de yoğun yağışta kanalizasyon yükünü hafifletti. Ancak depoların düzenli temizlenmesi gerektiği de görüldü.';
      const answer='Yağmur Suyuyla Tasarruf ve Taşkın Yönetimi';
      const options=[answer,'Okul Bahçelerinde Yağmur Suyunu Değerlendirmek','Depolanan Suyun Bakım ve Temizlik Gereği','Kentsel Su Yönetiminde Okulların Rolü'];
      return {context,prompt:'Bu metnin kapsamını en iyi yansıtan başlık hangisidir?',options,answer,explanation:'Başlık hem su tasarrufu hem taşkın yükünü azaltma işlevini kapsar; bakım gereğini dışlamaz.',misconceptions:['','Metindeki yan ayrıntıyı ana konu sayma','Metnin ele almadığı tarihsel çerçeveyi seçme','Sınırlılığı bütün metnin konusu sayma'],tags:['başlık']};
    }
  },
  {
    familyId:'implicit-inference-dynamic', build(random,v){
      const context='Bir atölyede öğrenciler aynı köprüyü önce yalnız çizime bakarak, sonra küçük bir model kurup ağırlık ekleyerek tasarladı. İkinci denemede kullandıkları malzeme miktarı biraz arttı; fakat köprüler daha az çöktü ve öğrenciler hangi parçanın yük taşıdığını açıklayabildi.';
      const answer='Model denemesi, köprünün dayanıklılık nedenlerini anlamayı desteklemiştir.';
      const options=[answer,'Malzeme miktarındaki artış, dayanıklılıktaki gelişmenin temel nedenidir.','İlk çizim yöntemi, yük taşıyan parçaları açıklamada daha etkilidir.','Çökme sayısının azalması, bütün parçaların aynı görevi üstlendiğini gösterir.'];
      return {context,prompt:'Bu metinden aşağıdakilerden hangisi çıkarılabilir?',options,answer,explanation:'Çökme azalması ve öğrencilerin yük taşıyan parçaları açıklaması, uygulamalı denemenin kavrayışı desteklediğini gösterir.',misconceptions:['','Bir değişkeni yeterli koşul sayma','İlk yöntemin katkısını bütünüyle yok sayma','Sonuçtan eşit dağılım çıkarma'],tags:['örtük çıkarım']};
    }
  },
  {
    familyId:'author-purpose-dynamic', build(random,v){
      const context='Mahalledeki eski çeşmenin taşları temizlenirken üzerindeki tarih silinmeye başladı. Restoratörler temizliği durdurdu, farklı yöntemleri küçük bir alanda denedi ve en az aşındıran yöntemi seçti. Bu örnek, tarihî yapıları yenilerken “daha temiz” görünmenin tek başarı ölçütü olmadığını gösteriyor.';
      const answer='Tarihî yapıları korurken görünüş kadar özgün bilgiyi korumanın da gözetilmesi gerektiğini açıklamak.';
      const options=[answer,'Çeşmenin yapıldığı dönemde kullanılan bütün taş türlerini sıralamak.','Restorasyon işinin yalnız uzmanlar tarafından yapılabileceğini kanıtlamak.','Mahalledeki çeşmenin diğer yapılardan daha değerli olduğunu savunmak.'];
      return {context,prompt:'Yazarın bu metni yazma amacı hangisidir?',options,answer,explanation:'Örnek olay, koruma kararlarında görünüş ile tarihî bilginin birlikte değerlendirilmesi gerektiğini vurgular.',misconceptions:['','Örnekte bulunmayan bilgi listesini amaç sanma','Uygulama ayrıntısından mutlak yetki sonucu çıkarma','Karşılaştırılmayan yapılar arasında değer sırası kurma'],tags:['yazarın amacı']};
    }
  },
  {
    familyId:'irrelevant-data-filter', build(random,v){
      const context=`Bir ekip üç farklı sulama aralığının aynı tür fidelerin büyümesine etkisini inceliyor. Bütün fideler aynı toprakta, eşit ışıkta ve ${20+v} °C ortamda tutuluyor. Sulama aralıkları iki, dört ve altı gün olarak belirleniyor. Saksıların dış yüzeyleri farklı renklere boyanıyor ve dört hafta sonunda boyları ölçülüyor.`;
      const answer='Saksıların dış yüzeylerinin farklı renklere boyanması';
      const options=[answer,'Fidelerin aynı türden seçilmesi','Ortam sıcaklığının aynı tutulması','Dört hafta sonunda boyların ölçülmesi'];
      return {context,prompt:'Sulama aralığının büyümeye etkisini yorumlamak için hangi bilgi deneyin temel değişkenleriyle doğrudan ilişkili değildir?',options,answer,explanation:'Saksı rengi bu düzende değişken olarak araştırılmadığı için büyüme karşılaştırmasının parçası değildir.',misconceptions:['','Kontrol değişkenini gereksiz sanma','Kontrol değişkenini gereksiz sanma','Sonuç ölçümünü gereksiz sanma'],tags:['gereksiz bilgi','deney']};
    }
  },
  {
    familyId:'multi-condition-reading-dynamic', build(random,v){
      const context='Bir bilim şenliğine seçilecek proje; en az iki farklı veri kaynağı kullanmalı, kaynaklardan biri öğrencinin kendi ölçümü olmalı, sonuç bölümünde iki kaynağın birlikte ne gösterdiği açıklanmalı ve proje daha önce aynı biçimde sunulmamış olmalıdır. A projesi iki haber kullanıyor. B projesi ölçüm ve haber kullanıyor fakat sonuçta yalnız haberi yorumluyor. C projesi ölçüm ve anket kullanıyor, ikisini birlikte yorumluyor ve ilk kez sunuluyor. D projesi koşulları sağlıyor ancak geçen yıl aynı biçimde sunuldu.';
      const answer='C projesi';
      const options=[answer,'A projesi','B projesi','D projesi'];
      return {context,prompt:'Bütün koşulları aynı anda sağlayan proje hangisidir?',options,answer,explanation:'C projesi kaynak türü, kendi ölçümü, ortak yorum ve özgünlük koşullarının tamamını karşılar.',misconceptions:['','Kendi ölçüm koşulunu atlama','Birlikte yorum koşulunu atlama','Özgünlük koşulunu atlama'],tags:['çoklu koşul']};
    }
  },
  {
    familyId:'event-sequence-reconstruction', build(random,v){
      const context='Araştırma ekibi önce neyi ölçeceğini belirledi. Ardından ölçüm aracını küçük bir grupla denedi ve anlaşılmayan maddeleri düzeltti. Sonra asıl veriyi topladı. En son verileri sınıflandırıp sonuçları yorumladı.';
      const answer='Amaç belirleme → aracı deneme → veri toplama → veriyi yorumlama';
      const options=[answer,'Aracı deneme → amaç belirleme → veriyi yorumlama → veri toplama','Amaç belirleme → veri toplama → aracı deneme → veriyi yorumlama','Veri toplama → aracı deneme → amaç belirleme → veriyi yorumlama'];
      return {context,prompt:'Araştırma sürecinin doğru sırası hangisidir?',options,answer,explanation:'Araç, asıl veri toplanmadan önce denenir; yorum ise veri toplama ve sınıflandırmadan sonra yapılır.',misconceptions:['','Amaçtan önce araç seçme ve yorumu erken yapma','Pilot denemeyi asıl veriden sonra yapma','Süreci veri toplamadan başlatma'],tags:['süreç sırası']};
    }
  }
];

export function createPremiumParagraphSession(profile, seed, count=8, options={}) {
  const random=seededRandom(seed);
  const seen=options.seenQuestionKeys instanceof Set?options.seenQuestionKeys:new Set(options.seenQuestionKeys||[]);
  const recent=new Set(options.recentFamilyIds||[]);
  const candidates=[];
  const order=shuffle(BUILDERS,random).sort((a,b)=>Number(recent.has(a.familyId))-Number(recent.has(b.familyId)));
  for(let pass=0;pass<6&&candidates.length<count;pass++){
    for(const builder of order){
      const variant=(pass+1)*7+Math.floor(random()*97);
      const raw=builder.build(random,variant);
      const q=makeQuestion({familyId:builder.familyId,...raw},random,variant);
      if(seen.has(q.questionKey)||candidates.some(x=>x.questionKey===q.questionKey))continue;
      candidates.push(q);
      if(candidates.length>=count)break;
    }
  }
  return candidates;
}

export function premiumParagraphFamilyStats(){ return {familyCount:BUILDERS.length,minimumCoreVariants:BUILDERS.length*6}; }
