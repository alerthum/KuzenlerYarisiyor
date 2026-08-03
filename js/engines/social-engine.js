import { pick, seededRandom, shuffle } from '../utils.js';

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function numericOptions(answer, random, offsets = [-20, -10, -5, 5, 10, 20]) {
  const values = new Set([answer]);
  while (values.size < 4) {
    const candidate = answer + pick(offsets, random);
    if (candidate >= 0) values.add(candidate);
  }
  return shuffle([...values], random).map(String);
}

export function createSocialRound(gameId, age, seed) {
  const random = seededRandom(seed);

  if (gameId === 'social-map-skills') {
    const mode = pick(age <= 10 ? ['direction', 'route', 'scaleEasy', 'weather'] : ['direction', 'route', 'scale', 'density', 'time'], random);
    if (mode === 'direction') {
      const horizontal = pick([['doğusunda', 'Doğu'], ['batısında', 'Batı']], random);
      const vertical = pick([['kuzeyinde', 'Kuzey'], ['güneyinde', 'Güney']], random);
      const places = shuffle(['okul', 'park', 'kütüphane', 'spor salonu', 'müze'], random);
      const answer = `${vertical[1]}${horizontal[1].toLocaleLowerCase('tr-TR')}`;
      const options = shuffle(['Kuzeydoğu','Kuzeybatı','Güneydoğu','Güneybatı'], random);
      return {
        context: `${places[0]}, ${places[1]}ın ${horizontal[0]}; ${places[2]} ise ${places[0]}un ${vertical[0]}.`,
        prompt: `${places[2]}, ${places[1]}ın hangi yönündedir?`, options, answerValue: answer,
        explanation: `Önce ${horizontal[1].toLocaleLowerCase('tr-TR')}, sonra ${vertical[1].toLocaleLowerCase('tr-TR')} yönünde ilerlenir; sonuç ${answer}dur.`
      };
    }
    if (mode === 'route') {
      const east = randomInt(random, 2, 8), north = randomInt(random, 2, 8), west = randomInt(random, 1, east - 1);
      const answer = east - west + north;
      return {
        context: `Ece krokide ${east} kare doğuya, ${north} kare kuzeye ve ${west} kare batıya ilerliyor.`,
        prompt: 'Toplam kaç karelik yol yürümüştür?', options: numericOptions(east + north + west, random), answerValue: String(east + north + west),
        explanation: `Yol uzunluğunda yönler çıkarılmaz; ${east}+${north}+${west}=${east + north + west} kare yürünür. Net uzaklık ayrı bir kavramdır.`
      };
    }
    if (mode === 'scaleEasy' || mode === 'scale') {
      const kmPerCm = age <= 10 ? pick([1,2,5], random) : pick([2,5,10,20], random);
      const cm = randomInt(random, 2, 8);
      const answer = kmPerCm * cm;
      return {
        context: `Bir haritada 1 cm gerçekte ${kmPerCm} km’yi göstermektedir. İki yer arasındaki uzaklık haritada ${cm} cm’dir.`,
        prompt: 'Gerçek uzaklık kaç kilometredir?', options: numericOptions(answer, random, [-10,-5,-2,2,5,10]), answerValue: String(answer),
        explanation: `${cm} × ${kmPerCm} = ${answer} km.`
      };
    }
    if (mode === 'density') {
      const area = randomInt(random, 2, 8) * 100, density = randomInt(random, 2, 9) * 10, population = area * density;
      return {
        context: `Yüz ölçümü ${area} km², nüfusu ${population} olan bir ilçede`, prompt: 'Nüfus yoğunluğu kaç kişi/km²’dir?',
        options: numericOptions(density, random, [-40,-20,-10,10,20,40]), answerValue: String(density),
        explanation: `Nüfus yoğunluğu = nüfus ÷ alan = ${population} ÷ ${area} = ${density}.`
      };
    }
    if (mode === 'time') {
      const start = randomInt(random, 8, 14), duration = randomInt(random, 2, 6), answer = start + duration;
      return {
        context: `Bir saha gezisi saat ${String(start).padStart(2,'0')}.00’de başlayıp ${duration} saat sürüyor.`, prompt: 'Gezi saat kaçta biter?',
        options: shuffle([answer, answer - 1, answer + 1, start + duration + 2].map((n)=>`${String(n).padStart(2,'0')}.00`), random), answerValue: `${String(answer).padStart(2,'0')}.00`,
        explanation: `${start}.00 + ${duration} saat = ${answer}.00.`
      };
    }
    return {
      context: 'Bir bölgenin son otuz yıllık sıcaklık ve yağış ortalamaları inceleniyor.', prompt: 'Bu veriler en çok hangi kavramı açıklar?',
      options: ['İklim','Günlük hava olayı','Nüfus','Saat dilimi'], answerValue: 'İklim', explanation: 'Uzun yıllara ait ortalamalar iklimi açıklar.'
    };
  }

  if (gameId === 'social-citizenship') {
    const mode = pick(age <= 10 ? ['budget', 'turn', 'safe', 'consumer'] : ['budget', 'participation', 'media', 'rights', 'tax'], random);
    if (mode === 'budget') {
      const income = randomInt(random, 8, 20) * 100, need = randomInt(random, 3, 7) * 100, saving = randomInt(random, 1, 3) * 100;
      const available = income - need - saving;
      return {
        context: `Aylık ${income} TL harçlığın ${need} TL’si zorunlu ihtiyaçlara, ${saving} TL’si birikime ayrılıyor.`, prompt: 'Planlı harcama için kaç TL kalır?',
        options: numericOptions(available, random, [-300,-200,-100,100,200,300]), answerValue: String(available), explanation: `${income} - ${need} - ${saving} = ${available} TL.`
      };
    }
    if (mode === 'turn') {
      return { context: 'Dört öğrenci aynı anda söz almak istiyor.', prompt: 'Adil ve katılımcı çözüm hangisidir?', options: ['Sırayla söz vermek','Yalnız en yüksek sesliyi dinlemek','Kimseyi konuşturmamak','Sadece arkadaşları seçmek'], answerValue: 'Sırayla söz vermek', explanation: 'Sırayla söz hakkı, eşit katılım sağlar.' };
    }
    if (mode === 'safe') {
      return { context: 'Bir oyun sitesindeki kişi adresini ve okulunu soruyor.', prompt: 'En güvenli davranış hangisidir?', options: ['Bilgileri hemen vermek','Bilgileri paylaşmayıp bir yetişkine söylemek','Şifreyi de göndermek','Tanımadığı kişiyi eve çağırmak'], answerValue: 'Bilgileri paylaşmayıp bir yetişkine söylemek', explanation: 'Kişisel bilgiler tanımadığımız kişilerle paylaşılmamalıdır.' };
    }
    if (mode === 'consumer') {
      return { context: 'Alınan ürün bozuk çıkıyor ve fiş saklanmış.', prompt: 'Tüketicinin en uygun ilk adımı hangisidir?', options: ['Ürünü çöpe atmak','Satıcıya başvurup değişim veya iade istemek','Fişi yırtmak','Sosyal medyada hakaret etmek'], answerValue: 'Satıcıya başvurup değişim veya iade istemek', explanation: 'Fişle birlikte satıcıya başvurmak tüketici hakkının uygun kullanımıdır.' };
    }
    if (mode === 'participation') {
      return { context: 'Belediye yeni bisiklet yolu için halkın görüşünü çevrim içi topluyor.', prompt: 'Bu uygulama hangi demokratik ilkeyi güçlendirir?', options: ['Katılım','Tekel','Sansür','Ayrımcılık'], answerValue: 'Katılım', explanation: 'Vatandaşların karar sürecine görüş sunması katılımdır.' };
    }
    if (mode === 'media') {
      return { context: 'Bir haber çok paylaşılmış ancak kaynağı ve tarihi görünmüyor.', prompt: 'Haberi paylaşmadan önce ne yapılmalıdır?', options: ['Kaynak ve kanıt kontrol edilmeli','Paylaşım sayısı yeterli görülmeli','Başlığa inanılmalı','Yorumlar doğru kabul edilmeli'], answerValue: 'Kaynak ve kanıt kontrol edilmeli', explanation: 'Doğrulama; kaynak, tarih, kanıt ve başka güvenilir yayınlarla karşılaştırma gerektirir.' };
    }
    if (mode === 'rights') {
      return { context: 'Bir öğrencinin fotoğrafı izni olmadan herkese açık paylaşılmıştır.', prompt: 'En doğrudan hangi hakla ilgilidir?', options: ['Özel hayatın gizliliği','Seyahat özgürlüğü','Seçme hakkı','Dilekçe hakkı'], answerValue: 'Özel hayatın gizliliği', explanation: 'Kişisel fotoğrafın izinsiz yayımlanması özel hayat ve kişisel veri hakkıyla ilgilidir.' };
    }
    return { context: 'Devlet okul, hastane, yol ve güvenlik hizmetleri sunuyor.', prompt: 'Vergilerin temel işlevi hangisidir?', options: ['Ortak hizmetlere kaynak sağlamak','Yalnız özel harcamayı artırmak','Kuralları kaldırmak','Geliri gizlemek'], answerValue: 'Ortak hizmetlere kaynak sağlamak', explanation: 'Vergiler ortak kamu hizmetlerinin finansmanına katkı sağlar.' };
  }

  const mode = pick(age <= 10 ? ['chronology', 'source', 'oral', 'heritage'] : ['chronology', 'source', 'cause', 'compare', 'heritage'], random);
  if (mode === 'chronology') {
    const base = randomInt(random, age <= 10 ? 1900 : 1500, 2000);
    const years = [base + randomInt(random, 1, 10), base + randomInt(random, 11, 20), base + randomInt(random, 21, 30)];
    const answer = [...years].sort((a,b)=>a-b).join(' → ');
    const options = shuffle([
      answer,
      `${years[2]} → ${years[1]} → ${years[0]}`,
      `${years[1]} → ${years[0]} → ${years[2]}`,
      `${years[0]} → ${years[2]} → ${years[1]}`
    ], random);
    return { context: `Üç belgenin tarihleri ${years.join(', ')} olarak verilmiştir.`, prompt: 'Eskiden yeniye doğru sıralama hangisidir?', options, answerValue: answer, explanation: `Yıllar küçükten büyüğe sıralanır: ${answer}.` };
  }
  if (mode === 'source') {
    const item = pick([
      ['olayı yaşayan kişinin günlüğü','Birincil kaynak'],['olaydan yıllar sonra yazılmış ders kitabı','İkincil kaynak'],['döneme ait madeni para','Birincil kaynak'],['sonradan hazırlanmış belgesel özeti','İkincil kaynak']
    ], random);
    return { context: `Araştırmada “${item[0]}” kullanılıyor.`, prompt: 'Bu kaynak nasıl sınıflandırılır?', options: ['Birincil kaynak','İkincil kaynak','Doğal kaynak','Sözlük'], answerValue: item[1], explanation: `${item[0]}, ${item[1].toLocaleLowerCase('tr-TR')} niteliğindedir.` };
  }
  if (mode === 'oral') {
    return { context: 'Bir öğrenci, mahallenin geçmişini öğrenmek için uzun süredir orada yaşayan kişilerle görüşüp ses kaydı alıyor.', prompt: 'Bu yöntem hangisidir?', options: ['Sözlü tarih','Nüfus sayımı','Deney','Hava gözlemi'], answerValue: 'Sözlü tarih', explanation: 'Geçmişi yaşamış kişilerle görüşme yapmak sözlü tarih yöntemidir.' };
  }
  if (mode === 'cause') {
    return { context: 'Yeni liman açıldıktan sonra ticaret hacmi, iş yeri sayısı ve şehre göç artmıştır.', prompt: 'En tutarlı neden-sonuç ilişkisi hangisidir?', options: ['Ulaşım ve ticaret imkânı ekonomik büyümeyi tetiklemiştir.','Göç bütün ticareti durdurmuştur.','Liman iklimi aniden değiştirmiştir.','İş yerleri nüfusu azaltmıştır.'], answerValue: 'Ulaşım ve ticaret imkânı ekonomik büyümeyi tetiklemiştir.', explanation: 'Liman ulaşım ve ticareti kolaylaştırmış, iş fırsatları göçü çekmiştir.' };
  }
  if (mode === 'compare') {
    return { context: 'Aynı olayı anlatan iki gazete farklı başlık ve yorum kullanmıştır.', prompt: 'Araştırmacı ne yapmalıdır?', options: ['Kaynakları ve kanıtları karşılaştırmalı','Yalnız ilk kaynağı doğru saymalı','Uzun yazıyı seçmeli','İki kaynağı da okumamalı'], answerValue: 'Kaynakları ve kanıtları karşılaştırmalı', explanation: 'Kaynağın amacı, tarihi ve kanıtları karşılaştırılmadan güvenilir sonuç kurulmaz.' };
  }
  return { context: 'Tarihî yapının duvarında çatlak görülüyor.', prompt: 'Kültürel mirası koruyan davranış hangisidir?', options: ['Yetkili kuruma bildirmek','Duvara isim yazmak','Parça koparmak','İzinsiz onarmak'], answerValue: 'Yetkili kuruma bildirmek', explanation: 'Koruma uzmanlık gerektirir; zarar yetkili kuruma bildirilmelidir.' };
}
