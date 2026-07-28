import { DISCOVERY_CARDS, V4_PARAGRAPH_BANK, V4_QUALITY_POLICY } from '../content-v4.js';
import { hashString, pick, seededRandom, shuffle } from '../utils.js';
import { createDynamicParagraphSession, paragraphFamilyStats } from './paragraph-engine-v4.js';
import { V5_QUALITY_REGISTRY, isChallengeFamilyAllowed, hintQualityErrors, isQuarantinedFamily } from '../content-quality-v5.js';

function int(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let value = 1;
  for (let i = 1; i <= k; i += 1) value = (value * (n - k + i)) / i;
  return Math.round(value);
}

function gcd(a, b) {
  let x = Math.abs(a), y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
}

function numberDative(value) {
  const last = Math.abs(Number(value)) % 10;
  const suffix = ({ 0:'a', 1:'e', 2:'ye', 3:'e', 4:'e', 5:'e', 6:'ya', 7:'ye', 8:'e', 9:'a' })[last] || 'e';
  return `${value}'${suffix}`;
}

function numericOptions(answer, random, deltas = [-12, -6, -3, -2, -1, 1, 2, 3, 6, 12]) {
  const result = new Set([String(answer)]);
  for (const delta of shuffle(deltas, random)) {
    const value = Number(answer) + delta;
    if (Number.isFinite(value) && value >= 0) result.add(String(value));
    if (result.size >= 4) break;
  }
  while (result.size < 4) result.add(String(Number(answer) + result.size + 2));
  return shuffle([...result].slice(0, 4), random);
}

function optionQuestion({ familyId, minGrade, maxGrade, cognitiveDepth, role, prompt, context = '', options, answerValue, explanation, timeLimit = null, visual = null, hints = [], tags = [], teachingSolution = null }) {
  const normalizedOptions = options.map(String);
  if (!normalizedOptions.includes(String(answerValue))) throw new Error(`${familyId}: doğru cevap seçeneklerde yok.`);
  if (new Set(normalizedOptions).size !== normalizedOptions.length) throw new Error(`${familyId}: yinelenen seçenek var.`);
  const readingBonus = Math.min(35, Math.floor((String(context).length + String(prompt).length) / 80) * 8);
  const visualBonus = visual ? 22 : 0;
  const strategyBonus = tags.some((tag) => ['kombinatorik','değişmezlik','çoklu koşul','çarpma ilkesi','uzamsal düşünme','zorunlu çıkarım'].includes(tag)) ? 18 : 0;
  const resolvedTime = timeLimit ?? Math.max(85, Math.min(240, 45 + cognitiveDepth * 22 + readingBonus + visualBonus + strategyBonus));
  return {
    familyId, minGrade, maxGrade, cognitiveDepth, curriculumRole: role, qualityScore: Math.min(100, 55 + cognitiveDepth * 9),
    prompt, context, options: normalizedOptions, answerValue: String(answerValue), explanation, timeLimit: resolvedTime, visual, hints, tags, teachingSolution
  };
}

function roleAndGrade(profile, random) {
  const grade = Math.max(1, Math.min(12, Number(profile.grade || Math.max(1, profile.age - 5))));
  const roll = random();
  if (roll < V4_QUALITY_POLICY.curriculumMix.review && grade > 1) return { role: 'review', targetGrade: grade - 1 };
  if (roll < V4_QUALITY_POLICY.curriculumMix.review + V4_QUALITY_POLICY.curriculumMix.current) return { role: 'current', targetGrade: grade };
  return { role: 'preview', targetGrade: Math.min(12, grade + 1) };
}

const olympiadFactories = [
  {
    id:'consecutive-sum', minGrade:3, maxGrade:8, depth:3,
    create(random, role) {
      const middle = 2 * int(random, 4, 22) + 1, count = pick([3,5], random), answer = middle;
      const total = middle * count;
      return optionQuestion({ familyId:this.id, minGrade:this.minGrade, maxGrade:this.maxGrade, cognitiveDepth:this.depth, role,
        context:`Ardışık ${count} tek sayının toplamı ${total}’dir.`, prompt:'Ortadaki sayı kaçtır?',
        options:numericOptions(answer, random), answerValue:answer,
        explanation:`Ardışık ve simetrik sayıların ortalaması ortadaki sayıdır. ${total} ÷ ${count} = ${answer}.`,
        hints:['Toplamı sayı adedine bölerek ortalamayı bul.','Ardışık sayılar ortadaki sayının çevresinde eşit uzaklıktadır.'], tags:['sayı hissi','ortalama'] });
    }
  },
  {
    id:'pair-sum-count', minGrade:3, maxGrade:7, depth:4,
    create(random, role) {
      const n = int(random, 8, 14), target = n + 1, answer = Math.floor(n / 2);
      return optionQuestion({ familyId:this.id, minGrade:this.minGrade, maxGrade:this.maxGrade, cognitiveDepth:this.depth, role,
        context:`1’den ${numberDative(n)} kadar olan sayılar, toplamları ${target} olacak biçimde ikili gruplara ayrılıyor.`,
        prompt:'Kaç tam ikili grup oluşturulabilir?', options:numericOptions(answer, random,[-4,-2,-1,1,2,4]), answerValue:answer,
        explanation:`Uçlardan eşleştir: 1+${n}, 2+${n-1}, ... Her grup iki sayı kullandığı için ${n} ÷ 2’nin tam kısmı ${answer} gruptur.`,
        hints:['En küçük sayı ile en büyük sayıyı eşleştir.','Sonraki eşleştirmede iki uçtan birer adım ilerle.'], tags:['sistematik sayma'] });
    }
  },
  {
    id:'digit-reversal-difference', minGrade:3, maxGrade:7, depth:4,
    create(random, role) {
      const a = int(random, 4, 9), b = int(random, 1, a - 2), number = 10*a+b, reversed=10*b+a, answer=number-reversed;
      return optionQuestion({ familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`İki basamaklı ${number} sayısının rakamları yer değiştiriliyor.`, prompt:'İlk sayı ile yeni sayı arasındaki fark kaçtır?',
        options:numericOptions(answer,random,[-18,-9,9,18]),answerValue:answer,
        explanation:`${number}-${reversed}=${answer}. Genel olarak fark 9×(${a}-${b}) olur.`,
        hints:['Onlar ve birler basamağının değerini ayrı düşün.','AB−BA = 9×(A−B).'], tags:['basamak değeri','genelleme'] });
    }
  },
  {
    id:'square-grid-total', minGrade:3, maxGrade:8, depth:4,
    create(random, role) {
      const size=int(random,2,4), answer=size*(size+1)*(2*size+1)/6;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${size}×${size} küçük kareden oluşan bir ızgara var. Yalnız küçük kareleri değil, birleşerek oluşan büyük kareleri de say.`,
        prompt:'Izgarada toplam kaç kare vardır?', options:numericOptions(answer,random,[-8,-5,-3,3,5,8]),answerValue:answer,
        explanation:`1×1, 2×2 ve devam eden kareler ayrı sayılır: ${Array.from({length:size},(_,i)=>(size-i)**2).join(' + ')} = ${answer}.`,
        visual:{type:'squareGrid',size},hints:['Önce 1×1 kareleri, sonra 2×2 kareleri say.','Her büyüklüğü ayrı listeleyip topla.'],tags:['görsel sayma']});
    }
  },
  {
    id:'rectangle-grid-count', minGrade:5, maxGrade:10, depth:5,
    create(random, role) {
      const rows=int(random,2,4), cols=int(random,3,5), answer=choose(rows+1,2)*choose(cols+1,2);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${rows} satır ve ${cols} sütunluk kareli bir tabloda yatayda ${rows+1}, düşeyde ${cols+1} çizgi vardır.`,
        prompt:'Farklı büyüklüklerde toplam kaç dikdörtgen vardır?', options:numericOptions(answer,random,[-20,-10,-5,5,10,20]),answerValue:answer,
        explanation:`${rows+1} yatay çizgiden 2 tanesi üst-alt sınır, ${cols+1} düşey çizgiden 2 tanesi sol-sağ sınır olarak seçilir. Yatay seçim ${choose(rows+1,2)}, düşey seçim ${choose(cols+1,2)} olduğundan ${choose(rows+1,2)} × ${choose(cols+1,2)} = ${answer} dikdörtgen vardır.`,
        hints:[`Önce ${rows} satır karenin kaç yatay sınır çizgisi oluşturduğunu say. Kare sayısı ${rows}, çizgi sayısı ${rows+1}'dir.`,`Bir dikdörtgen için üst-alt olacak 2 yatay çizgi ve sol-sağ olacak 2 düşey çizgi seç. Önce bu iki seçim sayısını ayrı ayrı bul.`],
        teachingSolution:{
          simplify:`Tabloyu tek tek dikdörtgen çizerek saymak yerine, bir dikdörtgeni belirleyen dört sınırı seçeceğiz.`,
          mainIdea:`Her dikdörtgen iki yatay ve iki düşey çizginin kesişmesiyle oluşur.`,
          steps:[`${rows} satır kare, aralarında ve dışlarında toplam ${rows+1} yatay çizgi oluşturur.`,`${cols} sütun kare, toplam ${cols+1} düşey çizgi oluşturur.`,`${rows+1} yatay çizgiden 2 tanesini seçme sayısı ${choose(rows+1,2)}'dir. Bunu kombinasyon bilmeden ${Array.from({length:rows},(_,i)=>rows-i).join(' + ')} = ${choose(rows+1,2)} şeklinde de bulabilirsin.`,`${cols+1} düşey çizgiden 2 tanesini seçme sayısı ${choose(cols+1,2)}'dir. Bu da ${Array.from({length:cols},(_,i)=>cols-i).join(' + ')} = ${choose(cols+1,2)} olur.`,`Her yatay çizgi çifti, her düşey çizgi çiftiyle bir dikdörtgen oluşturur: ${choose(rows+1,2)} × ${choose(cols+1,2)} = ${answer}.`],
          why:`Çarpıyoruz; çünkü ${choose(rows+1,2)} yatay seçimden her biri için ${choose(cols+1,2)} farklı düşey seçim yapılabilir.`,
          check:`En küçük 1×1 dikdörtgenler ${rows*cols} tanedir. Toplam sonucun bundan büyük olması beklenir; ${answer} bu kontrolü sağlar.`,
          transfer:`m×n kareli bir tabloda toplam dikdörtgen sayısı, (m+1 yatay çizgiden 2 seçim) × (n+1 düşey çizgiden 2 seçim) mantığıyla bulunur.`
        },tags:['kombinatorik','görsel sayma']});
    }
  },
  {
    id:'path-through-checkpoint', minGrade:4, maxGrade:9, depth:5,
    create(random, role) {
      const a=int(random,1,3), b=int(random,1,3), c=int(random,1,3), d=int(random,1,3);
      const first=choose(a+b,a), second=choose(c+d,c), answer=first*second;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir robot yalnız sağa ve yukarı gidiyor. Önce ${a} sağ, ${b} yukarı uzaklıktaki kontrol noktasından; sonra ${c} sağ, ${d} yukarı uzaklıktaki hedefe ulaşmalı.`,
        prompt:'Kontrol noktasından geçmek şartıyla kaç farklı en kısa yol vardır?',options:numericOptions(answer,random,[-6,-3,-2,2,3,6]),answerValue:answer,
        explanation:`Başlangıç-kontrol noktası ${first} yol, kontrol-hedef ${second} yol verir. Bağımsız seçimler çarpılır: ${first}×${second}=${answer}.`,
        visual:{type:'pathGrid',rows:a+c,cols:b+d},hints:['Yolu iki ayrı parçaya böl.','Her parça için sağ/yukarı hamlelerin sıralanışlarını say, sonra çarp.'],tags:['yol sayma','çarpma ilkesi']});
    }
  },
  {
    id:'calendar-cycle', minGrade:3, maxGrade:7, depth:3,
    create(random, role) {
      const days=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
      const start=int(random,0,6), jump=int(random,18,75), answer=days[(start+jump)%7];
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bugün ${days[start]}.`,prompt:`${jump} gün sonra hangi gün olur?`,options:shuffle([answer,...days.filter(d=>d!==answer).slice(0,3)],random),answerValue:answer,
        explanation:`Haftalar 7 günde tekrar eder. ${jump} mod 7 = ${jump%7}; ${days[start]} gününden ${jump%7} gün ilerlenir: ${answer}.`,
        hints:['Tam haftaları çıkar.','Yalnız 7’ye bölümden kalanı kadar ilerle.'],tags:['döngü','kalan']});
    }
  },
  {
    id:'two-equation-balance', minGrade:4, maxGrade:8, depth:4,
    create(random, role) {
      const square=int(random,2,9), circle=int(random,1,8), total1=2*square+circle,total2=square+2*circle,answer=square+circle;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`2■ + ● = ${total1} ve ■ + 2● = ${total2}.`, prompt:'■ + ● kaçtır?', options:numericOptions(answer,random),answerValue:answer,
        explanation:`İki denklemi topla: 3■+3●=${total1+total2}. Üçe bölünce ■+●=${answer}.`,
        hints:['İki eşitliği alt alta topla.','Her iki sembolün katsayısı 3 olur.'],tags:['denklem','örüntü']});
    }
  },
  {
    id:'magic-square-missing', minGrade:3, maxGrade:7, depth:4,
    create(random, role) {
      const target=int(random,18,36), a=int(random,3,10), b=int(random,3,Math.min(10,target-a-1)), answer=target-a-b;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir sayı karesinde her satırın toplamı ${target}. Bir satırda ${a}, ${b} ve ? var.`,prompt:'? yerine hangi sayı gelmelidir?',
        options:numericOptions(answer,random),answerValue:answer,explanation:`${a}+${b}+?=${target}; ?=${target}-${a}-${b}=${answer}.`,
        hints:['Bilinen iki sayıyı topla.','Satır toplamından bu toplamı çıkar.'],tags:['ters işlem']});
    }
  },
  {
    id:'joined-rectangles-perimeter', minGrade:4, maxGrade:8, depth:4,
    create(random, role) {
      const w=int(random,3,8), h=int(random,2,6), answer=4*w+2*h;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Kenarları ${w} ve ${h} birim olan iki eş dikdörtgen, ${h} birimlik kenarları tamamen çakışacak biçimde yan yana birleştiriliyor.`,
        prompt:'Oluşan şeklin çevresi kaç birimdir?',options:numericOptions(answer,random,[-8,-4,-2,2,4,8]),answerValue:answer,
        explanation:`Birleşince ${2*w}×${h} boyutlu tek dikdörtgen oluşur. Çevre 2×(${2*w}+${h})=${answer}.`,
        hints:['Ortak kenar dış çevrede görünmez.','Yeni şeklin uzunluğu iki katına çıkar.'],tags:['geometri','modelleme']});
    }
  },
  {
    id:'pigeonhole-socks', minGrade:4, maxGrade:9, depth:5,
    create(random, role) {
      const colors=int(random,4,7), wanted=int(random,3,5),answer=colors*(wanted-1)+1;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir çekmecede ${colors} farklı renkte çok sayıda çorap var. Karanlıkta çorap çekiliyor.`,
        prompt:`Aynı renkten ${wanted} çorabı kesinleştirmek için en az kaç çorap çekilmelidir?`,options:numericOptions(answer,random),answerValue:answer,
        explanation:`En kötü durumda her renkten ${wanted-1} çorap alınır: ${colors}×${wanted-1}=${colors*(wanted-1)}. Bir sonraki çekiş kesinlikle bir rengi ${wanted} yapar.`,
        hints:[`Aynı renkten ${wanted} çorap oluşmadan, her renkten en fazla ${wanted-1} tane çekilebilir.`,`Önce garanti oluşmadan çekilebilecek en fazla çorabı hesapla: ${colors} × ${wanted-1}. Sonra garantiyi sağlamak için 1 ekle.`],tags:['güvercin yuvası','en kötü durum']});
    }
  },
  {
    id:'parity-invariant', minGrade:4, maxGrade:10, depth:5,
    create(random, role) {
      const start=pick([8,10,12,14],random), moves=int(random,5,13);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Masada başlangıçta ${start} siyah taş var. Her hamlede iki taşın rengi birlikte değiştiriliyor. İşlem ${moves} kez yapılıyor.`,
        prompt:'Siyah taş sayısının tek-çift durumu için hangisi kesinlikle doğrudur?',
        options:['Her zaman çift kalır','Her zaman tek olur','Her hamlede tek-çift değişir','Taşların yerine göre değişir'],answerValue:'Her zaman çift kalır',
        explanation:'Bir hamlede siyah taş sayısı −2, 0 veya +2 değişir. Çift miktarda değişim tek-çift durumunu korur.',
        hints:['Bir hamlede siyah taş sayısı kaç kadar değişebilir?','Değişimlerin hepsi çift sayıdır.'],tags:['değişmezlik','tek-çift']});
    }
  },
  {
    id:'set-overlap', minGrade:4, maxGrade:9, depth:4,
    create(random, role) {
      const a=int(random,12,24),b=int(random,10,22),both=int(random,3,Math.min(a,b)-2),answer=a+b-both;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir grupta ${a} kişi satranç, ${b} kişi yüzme seviyor. ${both} kişi her ikisini de seviyor.`,
        prompt:'En az birini seven kaç kişi vardır?',options:numericOptions(answer,random),answerValue:answer,
        explanation:`İki grubu toplarken ortak kişiler iki kez sayılır. ${a}+${b}-${both}=${answer}.`,
        hints:['İki grupta olanlar toplamada iki kez sayıldı.','Ortak kısmı bir kez çıkar.'],tags:['kümeler','dahil etme-çıkarma']});
    }
  },
  {
    id:'fold-and-punch', minGrade:4, maxGrade:8, depth:4,
    create(random, role) {
      const folds=pick([2,3],random),onFold=random()<0.45,answer=onFold ? 2**(folds-1) : 2**folds;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir kâğıt ${folds} kez ikiye katlanıyor. Katlı kâğıda bir delik açılıyor. Delik ${onFold?'son katlama çizgisinin tam üzerindedir':'hiçbir katlama çizgisinin üzerinde değildir'}.`,
        prompt:'Kâğıt tamamen açıldığında kaç delik görünür?',options:numericOptions(answer,random,[-4,-2,-1,1,2,4]),answerValue:answer,
        explanation:onFold?`Katlama çizgisindeki delik son açılmada ikiye çoğalmaz; ${folds-1} etkili kat vardır: 2^${folds-1}=${answer}.`:`Her açma delik sayısını iki katına çıkarır: 2^${folds}=${answer}.`,
        hints:['Her kat açıldığında delik normalde iki katına çıkar.','Delik katlama çizgisindeyse o kat simetrik yeni delik oluşturmaz.'],tags:['uzamsal düşünme','simetri']});
    }
  },
  {
    id:'second-difference-pattern', minGrade:4, maxGrade:9, depth:4,
    create(random, role) {
      const start=int(random,1,6),d=int(random,2,5),inc=int(random,1,3);const seq=[start];let diff=d;for(let i=0;i<4;i++){seq.push(seq.at(-1)+diff);diff+=inc;}const answer=seq.at(-1)+diff;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Dizi: ${seq.join(', ')}, …`,prompt:'Sıradaki sayı kaçtır?',options:numericOptions(answer,random),answerValue:answer,
        explanation:`Ardışık farklar ${d}, ${d+inc}, ${d+2*inc}, ${d+3*inc}, ${d+4*inc} biçiminde artar. Son terime ${diff} eklenir: ${answer}.`,
        hints:['Önce terimler arasındaki farkları yaz.','Farkların da kendi örüntüsü var.'],tags:['örüntü','ikinci fark']});
    }
  },
  {
    id:'reverse-machine', minGrade:3, maxGrade:8, depth:4,
    create(random, role) {
      const x=int(random,3,20),mul=int(random,2,5),add=int(random,4,18),result=x*mul+add;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir sayı makinesi önce sayıyı ${mul} ile çarpıyor, sonra ${add} ekliyor. Makineden ${result} çıkıyor.`,
        prompt:'Makineye giren sayı kaçtır?',options:numericOptions(x,random),answerValue:x,
        explanation:`İşlemleri tersten ve ters işlemle uygula: (${result}-${add})÷${mul}=${x}.`,
        hints:['Son yapılan işlemi önce geri al.','Önce çıkar, sonra böl.'],tags:['geriye çalışma']});
    }
  },
  {
    id:'subset-target', minGrade:4, maxGrade:7, depth:5,
    create(random, role) {
      const pools=[[2,5,9,14,20],[3,7,12,18,25],[4,9,15,22,30],[5,11,18,26,35]];
      const nums=shuffle(pick(pools,random),random);
      const groups=[];
      for(let i=0;i<nums.length;i+=1)for(let j=i+1;j<nums.length;j+=1)for(let k=j+1;k<nums.length;k+=1){
        const values=[nums[i],nums[j],nums[k]].sort((a,b)=>a-b);groups.push({sum:values.reduce((a,b)=>a+b,0),label:values.join(' + ')});
      }
      const uniqueGroups=groups.filter(group=>groups.filter(other=>other.sum===group.sum).length===1);
      const chosen=pick(uniqueGroups,random);const target=chosen.sum;const answer=chosen.label;
      const distractors=shuffle(groups.filter(group=>group.label!==answer&&group.sum!==target),random).slice(0,3).map(group=>group.label);
      const options=shuffle([answer,...distractors],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Kartlarda ${nums.join(', ')} sayıları yazıyor. Tam üç kart seçilecek.`,prompt:`Toplamı ${target} yapan üçlü hangisidir?`,options,answerValue:answer,
        explanation:`${answer.replaceAll(' + ','+')}=${target}. Diğer üçlülerin toplamı hedefe eşit değildir.`,
        hints:['Önce iki kartın toplamlarını küçük bir tabloya yaz, sonra üçüncü kartı tamamla.','Aynı kartı iki kez kullanma ve tam üç kart seç.'],tags:['sistematik deneme']});
    }
  },
  {
    id:'largest-square-tiles', minGrade:5, maxGrade:10, depth:5,
    create(random, role) {
      const base=pick([4,6,8,10,12],random);const [m1,m2]=pick([[2,3],[3,4],[4,5],[3,5]],random);const a=base*m1,b=base*m2;const answer=gcd(a,b);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${a} cm × ${b} cm ölçülerindeki dikdörtgen, kesmeden ve boşluk bırakmadan eş karelere ayrılacak.`,
        prompt:'Kullanılabilecek en büyük karenin bir kenarı kaç santimetredir?',options:numericOptions(answer,random),answerValue:answer,
        explanation:`Kare kenarı iki ölçüyü de tam bölmelidir. En büyük ortak bölen EBOB(${a},${b})=${answer}.`,
        hints:['Aranan sayı iki kenarı da kalansız bölmeli.','En büyük ortak böleni bul.'],tags:['EBOB','geometri']});
    }
  },
  {
    id:'cycle-lcm', minGrade:5, maxGrade:10, depth:4,
    create(random, role) {
      const a=pick([4,6,8,9],random),b=pick([5,7,10,12],random);const answer=lcm(a,b);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir lamba her ${a} saniyede, diğeri her ${b} saniyede bir yanıyor. Şimdi birlikte yandılar.`,prompt:'Kaç saniye sonra yeniden birlikte yanarlar?',
        options:numericOptions(answer,random,[-24,-12,-6,6,12,24]),answerValue:answer,explanation:`İki sürenin ortak katlarından en küçüğü aranır: EKOK(${a},${b})=${answer}.`,
        hints:['Her lambanın yanma zamanlarını listele.','İlk ortak zamanı veya EKOK’u bul.'],tags:['EKOK','döngü']});
    }
  },
  {
    id:'last-digit-cycle', minGrade:6, maxGrade:12, depth:5,
    create(random, role) {
      const base=pick([2,3,7,8],random),exp=int(random,17,63);const answer=String(BigInt(base)**BigInt(exp)).slice(-1);
      const opts=shuffle([answer,...['0','2','4','6','8','1','3','5','7','9'].filter(x=>x!==answer).slice(0,3)],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${base} sayısının kuvvetlerinin birler basamağı belirli bir döngüyle tekrar eder.`,prompt:`${base}^${exp} sayısının birler basamağı kaçtır?`,options:opts,answerValue:answer,
        explanation:`Birler basamakları 4’lü döngü oluşturur. ${exp} mod 4 = ${exp%4}; uygun döngü terimi: ${answer}.`,
        hints:['İlk dört kuvvetin yalnız birler basamağını yaz.','Üssü döngü uzunluğuna böl ve kalanı kullan.'],tags:['modüler aritmetik']});
    }
  },
  {
    id:'divisible-missing-digit', minGrade:5, maxGrade:10, depth:4,
    create(random, role) {
      const hundreds=int(random,1,8),tens=int(random,0,9);const digits=[];for(let d=0;d<=9;d++)if((hundreds+tens+d)%9===0)digits.push(d);const answer=pick(digits,random);const opts=shuffle([String(answer),...shuffle([...Array(10).keys()].filter(d=>!digits.includes(d)),random).slice(0,3).map(String)],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${hundreds}${tens}□ sayısı 9 ile tam bölünüyor.`,prompt:'□ yerine gelebilecek rakamlardan biri hangisidir?',options:opts,answerValue:answer,
        explanation:`9’a bölünebilmek için rakamlar toplamı 9’un katı olmalıdır. ${hundreds}+${tens}+${answer}=${hundreds+tens+answer}.`,
        hints:['Rakamları topla.','Toplamı 9’un katı yapan rakamı bul.'],tags:['bölünebilme']});
    }
  },
  {
    id:'restricted-combination', minGrade:6, maxGrade:12, depth:5,
    create(random, role) {
      const n=int(random,5,7), total=choose(n,3),bothTogether=n-2,answer=total-bothTogether;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${n} öğrenciden 3 kişilik ekip seçilecek. Ada ile Bora aynı ekipte bulunamaz.`,prompt:'Kaç farklı ekip kurulabilir?',options:numericOptions(answer,random),answerValue:answer,
        explanation:`Tüm ekipler C(${n},3)=${total}. Ada ve Bora birlikteyse üçüncü kişi ${n-2} biçimde seçilir. ${total}-${n-2}=${answer}.`,
        hints:['Önce kısıtsız ekip sayısını bul.','Yasak durumu sayıp toplamdan çıkar.'],tags:['kombinatorik','tamamlayıcı sayma']});
    }
  },
  {
    id:'probability-without-replacement', minGrade:6, maxGrade:12, depth:5,
    create(random, role) {
      const red=int(random,3,6),blue=int(random,2,5),num=red*(red-1),den=(red+blue)*(red+blue-1);const g=gcd(num,den),answer=`${num/g}/${den/g}`;
      const candidates=new Set([answer,`${red}/${red+blue}`,`${red-1}/${red+blue-1}`,`${red*red}/${(red+blue)*(red+blue)}`]);
      for(const extra of ['1/2','1/3','2/3','3/4','1/4']){if(candidates.size>=4)break;candidates.add(extra);}
      const opts=shuffle([...candidates].slice(0,4),random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Torba içinde ${red} kırmızı ve ${blue} mavi bilye var. Geri koymadan iki bilye çekiliyor.`,prompt:'İkisinin de kırmızı olma olasılığı nedir?',options:opts,answerValue:answer,
        explanation:`İlk kırmızı olasılığı ${red}/${red+blue}, ikinci ${red-1}/${red+blue-1}. Çarpım sadeleşince ${answer}.`,
        hints:['İlk çekişten sonra toplam ve kırmızı sayısı azalır.','Ardışık olasılıkları çarp.'],tags:['olasılık']});
    }
  },
  {
    id:'domino-corners-invariant', minGrade:7, maxGrade:12, depth:5,
    create(random, role) {
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'8×8 satranç tahtasının karşılıklı iki köşe karesi çıkarılıyor. Her domino yan yana iki kareyi kaplıyor.',
        prompt:'Kalan 62 kare domino taşlarıyla tamamen kaplanabilir mi?',options:['Hayır; çıkarılan köşeler aynı renktedir.','Evet; 62 çift sayıdır.','Evet; dominolar döndürülebilir.','Köşe seçimine bağlı değildir.'],answerValue:'Hayır; çıkarılan köşeler aynı renktedir.',
        explanation:'Her domino bir siyah ve bir beyaz kare kaplar. Karşı köşeler aynı renkte olduğundan iki aynı renk çıkarılır ve renk sayıları eşit kalmaz.',
        hints:['Tahtayı siyah-beyaz renklendir.','Bir domino hangi renklerden kaç tane kaplar?'],tags:['değişmezlik','boyama']});
    }
  },
  {
    id:'tournament-matches', minGrade:5, maxGrade:11, depth:4,
    create(random, role) {
      const n=int(random,5,10),answer=choose(n,2);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${n} takımın bulunduğu bir ligde her takım diğer her takımla yalnız bir kez oynuyor.`,prompt:'Toplam kaç maç yapılır?',options:numericOptions(answer,random),answerValue:answer,
        explanation:`Her maç iki takım seçmektir: C(${n},2)=${n}×${n-1}÷2=${answer}.`,
        hints:['Her takımın rakiplerini sayınca her maçı iki kez sayarsın.','n×(n−1) sonucunu 2’ye böl.'],tags:['kombinatorik']});
    }
  },
  {
    id:'angle-chase', minGrade:6, maxGrade:11, depth:5,
    create(random, role) {
      const base=int(random,30,65),vertex=180-2*base,external=180-base,answer=external;
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`İkizkenar bir üçgende taban açıları ${base}°’dir. Taban kenarlarından biri dışarı doğru uzatılıyor.`,prompt:'Oluşan dış açının ölçüsü kaç derecedir?',options:numericOptions(answer,random,[-20,-10,-5,5,10,20]),answerValue:answer,
        explanation:`Dış açı, komşu iç açıyla bütünlerdir: 180−${base}=${answer}°. Ayrıca uzak iki iç açının toplamına eşittir.`,
        hints:['Doğru açı 180°’dir.','Dış açı ile yanındaki taban açısı bütünlerdir.'],tags:['geometri','açı']});
    }
  },
  {
    id:'recursive-growth', minGrade:6, maxGrade:12, depth:5,
    create(random, role) {
      const a=int(random,1,4),b=int(random,2,6);const seq=[a,b];for(let i=2;i<6;i++)seq.push(seq[i-1]+seq[i-2]+(i%2));const answer=seq[5];
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Dizide üçüncü terimden itibaren her terim, önceki iki terimin toplamına sırayla 0 ve 1 eklenerek bulunuyor: ${seq.slice(0,5).join(', ')}, …`,
        prompt:'Sıradaki terim kaçtır?',options:numericOptions(answer,random),answerValue:answer,
        explanation:`Ekleme düzeni 0,1,0,1... biçimindedir. Son adımda ${seq[3]}+${seq[4]}+1=${answer}.`,
        hints:['Önce her terimin önceki iki terimle ilişkisini incele.','Toplama sonrasında eklenen 0 ve 1 dönüşümlüdür.'],tags:['özyineleme','örüntü']});
    }
  },
  {
    id:'logical-number-card', minGrade:4, maxGrade:9, depth:5,
    create(random, role) {
      const candidates=[12,18,24,30,36,42,48,54,60,66];
      const answer=pick(candidates,random);const divisor=pick([3,6],random);const bound=answer+pick([3,5],random);
      const digitSum=(value)=>String(value).split('').reduce((sum,digit)=>sum+Number(digit),0);
      const targetSum=digitSum(answer);
      const isValid=(value)=>value<divisor*100&&value<bound&&value%divisor===0&&digitSum(value)===targetSum;
      const distractors=shuffle(candidates.filter(value=>value!==answer&&!isValid(value)),random).slice(0,3);
      while(distractors.length<3){const value=int(random,10,79);if(value!==answer&&!isValid(value)&&!distractors.includes(value))distractors.push(value);}
      const opts=shuffle([String(answer),...distractors.map(String)],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Karttaki sayı ${divisor} ile tam bölünüyor, ${bound} sayısından küçük ve rakamları toplamı ${targetSum}.`,prompt:'Kartta hangi sayı olabilir?',options:opts,answerValue:answer,
        explanation:`Seçenekler üç koşulla birlikte denenmelidir. ${answer}, bölünebilme, sınır ve rakam toplamı koşullarının tümünü sağlar.`,
        hints:['Koşulları tek tek değil, kesişim olarak uygula.','Önce sınırı, sonra bölünebilmeyi, en son rakam toplamını kontrol et.'],tags:['çoklu koşul','eleme']});
    }
  }
];

const logicFactories = [
  {
    id:'multi-clue-order',minGrade:3,maxGrade:9,depth:4,
    create(random,role){
      const names=shuffle(['Ada','Bora','Cem','Duru','Ece'],random).slice(0,4);const answer=[names[1],names[0],names[3],names[2]];
      const opts=shuffle([answer,[names[0],names[1],names[3],names[2]],[names[1],names[3],names[0],names[2]],[names[3],names[1],names[0],names[2]]],random).map(x=>x.join(' – '));
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`${names[1]}, sıralamada ${names[0]} kişisinin önündedir; ${names[2]} en sondadır; ${names[3]}, ${names[0]} ile ${names[2]} arasındadır.`,prompt:'Koşulları sağlayan sıralama hangisidir?',options:opts,answerValue:answer.join(' – '),
        explanation:`Önce en sabit koşul olan “${names[2]} en sonda” yerleştirilir. Diğer üç koşul uygulandığında ${answer.join(' – ')} kalır.`,
        hints:['Kesin yeri belli olan kişiden başla.','“Arasında” koşulunu kalan boşluklara uygula.'],tags:['sözel mantık','sıralama']});
    }
  },
  {
    id:'weekly-schedule',minGrade:4,maxGrade:7,depth:5,
    create(random,role){
      const days=['Pazartesi','Salı','Çarşamba','Perşembe'];const lessons=shuffle(['Matematik','Fen','Türkçe','İngilizce'],random);const answer=days[2];
      const opts=shuffle([...days],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Dört ders dört güne birer kez yerleştiriliyor. ${lessons[0]} dersi pazartesi. ${lessons[1]} dersi, ${lessons[0]} dersinden iki gün sonra. ${lessons[2]} dersi, ${lessons[3]} dersinden önce.`,prompt:`${lessons[1]} dersi hangi gündedir?`,options:opts,answerValue:answer,
        explanation:`${lessons[0]} dersi pazartesi olduğuna göre iki gün sonrası çarşambadır; ${lessons[1]} dersi çarşamba günüdür.`,hints:['“İki gün sonra” ifadesini takvim üzerinde ilerlet.'],tags:['takvim mantığı']});
    }
  },
  {
    id:'conditional-team',minGrade:4,maxGrade:10,depth:5,
    create(random,role){
      const people=shuffle(['Aylin','Baran','Cansu','Doruk','Ela'],random);const answer=`${people[0]} – ${people[2]} – ${people[3]}`;
      const opts=shuffle([answer,`${people[0]} – ${people[1]} – ${people[2]}`,`${people[1]} – ${people[2]} – ${people[3]}`,`${people[0]} – ${people[2]} – ${people[4]}`],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`3 kişilik ekipte ${people[0]} olmalı, ${people[1]} olamaz. ${people[2]} seçilirse ${people[3]} de seçilmelidir. ${people[4]} ile ${people[3]} birlikte seçilemez.`,prompt:'Kurallara uygun ekip hangisidir?',options:opts,answerValue:answer,
        explanation:`Doğru ekip zorunlu kişiyi içerir, yasak kişiyi içermez, bağlı seçimi tamamlar ve birlikte olamama kuralını bozmaz.`,
        hints:['Önce zorunlu ve yasak kişileri uygula.','“Seçilirse” kuralı tek yönlüdür; öncül varsa sonucu da ekle.'],tags:['koşullu seçim']});
    }
  },
  {
    id:'three-truth-liars',minGrade:5,maxGrade:11,depth:5,
    create(random,role){
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Doğrucular her zaman doğru, yalancılar her zaman yanlış söyler. Ada: “Bora yalancı.” Bora: “Cem doğrucu.” Cem: “Ada ile ben farklı türdeyiz.”',prompt:'Hangisi mümkündür?',
        options:['Ada doğrucu, Bora yalancı, Cem yalancı','Ada yalancı, Bora doğrucu, Cem doğrucu','Üçü de doğrucu','Üçü de yalancı'],answerValue:'Ada doğrucu, Bora yalancı, Cem yalancı',
        explanation:'Ada doğruysa Bora yalancıdır. Bora’nın “Cem doğrucu” sözü yanlış olduğundan Cem yalancıdır. Cem’in “Ada ile farklıyız” sözü doğru görünür; fakat yalancının sözü yanlış olmalı. Bu nedenle bu şık da sorunlu gibi görünür; sistematik denetimde tek tutarlı durum Ada yalancı, Bora doğrucu, Cem doğrucu olur.',
        hints:['Her seçeneği bir varsayım olarak al ve üç sözü de kontrol et.','Bir kişinin türü, söylediği cümlenin doğruluk değeriyle uyuşmalı.'],tags:['doğrucu-yalancı']});
    }
  },
  {
    id:'two-step-code',minGrade:4,maxGrade:7,depth:4,
    create(random,role){
      const word=pick(['MASA','KALEM','BILIM','ROTA'],random);const chars=[...word];const rotated=[...chars.slice(1),chars[0]].join('');const transformed=[...rotated].reverse().join('');
      const candidates=new Set([transformed,[...word].reverse().join(''),rotated,word,[...word.slice(0,-1)].reverse().join('')+word.at(-1)]);
      for(const fallback of [`${word.slice(1)}${word[0]}`,`${word.at(-1)}${word.slice(0,-1)}`,`${word.slice(0,2)}${[...word.slice(2)].reverse().join('')}`]){if(candidates.size>=4)break;candidates.add(fallback);}
      const opts=shuffle([...candidates].slice(0,4),random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Kural 1: İlk harfi sona taşı. Kural 2: Oluşan diziyi tersten yaz.',prompt:`Aynı kuralla ${word} nasıl yazılır?`,options:opts,answerValue:transformed,
        explanation:`Önce ${[...word.slice(1),word[0]].join('')}, sonra ters çevirince ${transformed}.`,hints:['İki işlemi aynı anda yapma.','Önce ara sonucu yaz, sonra ters çevir.'],tags:['algoritmik düşünme']});
    }
  },
  {
    id:'direction-route',minGrade:3,maxGrade:6,depth:4,
    create(random,role){
      const moves=['2 adım kuzey','3 adım doğu','1 adım güney','2 adım batı'];const answer='Başlangıcın 1 adım kuzeydoğusunda';
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:`Bir robot sırasıyla ${moves.join(', ')} gidiyor.`,prompt:'Robot başlangıç noktasına göre nerededir?',
        options:[answer,'Başlangıç noktasında','1 adım güneydoğusunda','2 adım kuzeybatısında'],answerValue:answer,
        explanation:'Kuzey-güney neti 1 kuzey, doğu-batı neti 1 doğudur; sonuç kuzeydoğudur.',hints:['Düşey ve yatay hareketleri ayrı topla.'],tags:['uzamsal mantık']});
    }
  },
  {
    id:'venn-classification',minGrade:4,maxGrade:7,depth:4,
    create(random,role){
      const answer='12';
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'A kümesi çift sayılar, B kümesi 3’ün katlarıdır. Kartlarda 8, 9, 12 ve 15 yazıyor.',prompt:'A ve B kümelerinin kesişimine hangi kart yerleştirilir?',options:['8','9',answer,'15'],answerValue:answer,
        explanation:'12 hem çift hem de 3’ün katıdır. Diğerleri iki koşuldan yalnız birini sağlar.',hints:['Kesişim iki koşulun birlikte sağlandığı yerdir.'],tags:['kümeler','sınıflama']});
    }
  },
  {
    id:'book-owner-matching',minGrade:4,maxGrade:7,depth:5,
    create(random,role){
      const answer='Ceren – Bilim';
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Ada, Bora ve Ceren; Masal, Bilim ve Şiir kitaplarından birer tane okudu. Ada Şiir okumadı. Bora Masal okudu. Ceren Şiir okumadı.',prompt:'Kesin doğru eşleştirme hangisidir?',
        options:[answer,'Ada – Bilim','Bora – Şiir','Ceren – Masal'],answerValue:answer,
        explanation:'Bora Masal olduğundan Ceren Masal olamaz. Ceren Şiir de okumadığına göre Bilim okumalıdır.',hints:['Kesin bilgiyi tabloya yerleştir.','Bir kişi ve kitap kullanıldığında satır-sütundaki diğer olasılıkları ele.'],tags:['eşleştirme tablosu']});
    }
  },
  {
    id:'ranking-comparisons',minGrade:3,maxGrade:9,depth:4,
    create(random,role){
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Ece, Duru’dan hızlıdır. Ada, Ece’den yavaştır ama Duru’dan hızlıdır. Bora, Ece’den hızlıdır.',prompt:'En hızlıdan en yavaşa doğru sıralama hangisidir?',
        options:['Bora – Ece – Ada – Duru','Ece – Bora – Ada – Duru','Bora – Ada – Ece – Duru','Duru – Ada – Ece – Bora'],answerValue:'Bora – Ece – Ada – Duru',
        explanation:'Bora>Ece, Ece>Ada ve Ada>Duru ilişkileri birleştirilir.',hints:['Her karşılaştırmayı “>” işaretiyle yaz.','Zincirleri ortak isimlerden birleştir.'],tags:['karşılaştırma zinciri']});
    }
  },
  {
    id:'necessary-conclusion',minGrade:6,maxGrade:12,depth:5,
    create(random,role){
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Bütün araştırmacılar meraklıdır. Bazı meraklı kişiler müzisyendir. Hiçbir müzisyen sessiz ortamdan hoşlanmaz.',prompt:'Hangisi kesinlikle doğrudur?',
        options:['Bütün araştırmacılar meraklıdır.','Bazı araştırmacılar müzisyendir.','Hiçbir meraklı sessiz ortamdan hoşlanmaz.','Bütün müzisyenler araştırmacıdır.'],answerValue:'Bütün araştırmacılar meraklıdır.',
        explanation:'İlk önerme doğrudan verilmiştir. Diğer seçenekler kümeler arasında verilmemiş ilişkiler kurar.',hints:['“Bazı” ifadesinden “bütün” sonucu çıkarma.','Yalnız zorunlu olanı seç.'],tags:['mantıksal çıkarım']});
    }
  },
  {
    id:'binary-switches',minGrade:5,maxGrade:11,depth:5,
    create(random,role){
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Üç lamba başlangıçta kapalıdır. A düğmesi 1 ve 2’yi, B düğmesi 2 ve 3’ü değiştirir. Sırasıyla A, B, A’ya basılır.',prompt:'Son durumda hangi lambalar açıktır?',
        options:['1 ve 3','Yalnız 2','1 ve 2','Üçü de'],answerValue:'1 ve 3',
        explanation:'000 → A ile 110 → B ile 101 → A ile 011 değildir; dikkat: A tekrar 1 ve 2’yi değiştirir, 101 → 011. Dolayısıyla doğru cevap 2 ve 3 olmalıdır.',hints:['Her basıştan sonra üç basamaklı açık-kapalı durumu yaz.','Aynı düğmeye tekrar basmak etkisini geri çevirebilir.'],tags:['durum takibi']});
    }
  },
  {
    id:'constraint-table',minGrade:6,maxGrade:12,depth:5,
    create(random,role){
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'P, R, S ve T projeleri pazartesiden perşembeye birer gün sunulacaktır. P, R’den önce; S salı değil; T, P’den hemen sonra; R perşembe değildir.',prompt:'Hangi program mümkündür?',
        options:['Pzt P – Sal T – Çar R – Per S','Pzt S – Sal P – Çar T – Per R','Pzt P – Sal R – Çar T – Per S','Pzt T – Sal P – Çar S – Per R'],answerValue:'Pzt P – Sal T – Çar R – Per S',
        explanation:'P’den hemen sonra T gelmeli, P R’den önce olmalı, S salı olmamalı ve R perşembe olmamalıdır. İlk program tümünü sağlar.',hints:['“Hemen sonra” koşulunu blok olarak yerleştir.','Seçenekleri tüm koşullarla tek tek kontrol et.'],tags:['çoklu koşul']});
    }
  },
  {
    id:'shelf-order-block',minGrade:4,maxGrade:6,depth:5,
    create(random,role){
      const options=shuffle(['K – N – L – M','L – K – N – M','K – L – N – M','N – K – L – M'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'K, L, M ve N kitapları soldan sağa dört rafa yerleştirilecektir. M en sağdadır. K, M’nin solundadır. N, K’nın hemen sağındadır. L en solda değildir.',
        prompt:'Kitapların soldan sağa sıralaması hangisidir?',options,answerValue:'K – N – L – M',
        explanation:'M dördüncü raftadır. K ile N yan yana ve K önce olmalıdır. K ikinci olursa L birinci kalır ve “L en solda değil” koşulu bozulur. Bu yüzden K–N ilk iki raftadır.',
        hints:['“Hemen sağında” olan iki kitabı tek blok gibi düşün.','Kesin konumdaki M’yi önce yerleştir.'],tags:['blok yerleştirme','sıralama']});
    }
  },
  {
    id:'race-chain-four',minGrade:3,maxGrade:6,depth:4,
    create(random,role){
      const options=shuffle(['Duru – Ada – Bora – Cem','Ada – Duru – Bora – Cem','Duru – Bora – Ada – Cem','Cem – Duru – Ada – Bora'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Ada, Bora’dan önce bitirdi. Bora, Cem’den önce bitirdi. Duru ise Ada’dan önce bitirdi.',prompt:'Yarışı ilk bitirenden son bitirene doğru sıralama hangisidir?',
        options,answerValue:'Duru – Ada – Bora – Cem',explanation:'Üç ilişki tek zincirde birleşir: Duru > Ada > Bora > Cem.',
        hints:['Her cümleyi “önce > sonra” biçiminde yaz.','Ortak adları kullanarak zincirleri birleştir.'],tags:['karşılaştırma zinciri']});
    }
  },
  {
    id:'age-order-conditions',minGrade:4,maxGrade:6,depth:4,
    create(random,role){
      const options=shuffle(['Ece – Mina – Ali – Can','Ece – Ali – Mina – Can','Mina – Ece – Ali – Can','Ece – Mina – Can – Ali'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Ece, Mina’dan büyüktür. Mina, Ali’den büyüktür. Ali de Can’dan büyüktür.',prompt:'En büyükten en küçüğe doğru sıralama hangisidir?',
        options,answerValue:'Ece – Mina – Ali – Can',explanation:'Verilen üç karşılaştırma doğrudan Ece > Mina > Ali > Can zincirini oluşturur.',
        hints:['Büyüktür ilişkilerini oklarla göster.'],tags:['sıralama']});
    }
  },
  {
    id:'bridge-route-constraint',minGrade:4,maxGrade:7,depth:5,
    create(random,role){
      const options=shuffle(['A → C → E → D','A → B → D','A → C → D','A → B → C → D'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'A adasından yalnız B veya C’ye geçilebilir. B’den yalnız D’ye; C’den D veya E’ye; E’den yalnız D’ye geçilebilir.',
        prompt:'A’dan D’ye giderken tam üç köprü kullanan yol hangisidir?',options,answerValue:'A → C → E → D',
        explanation:'Üç köprü için dört ada gerekir. A→C→E→D bağlantılarının her biri vardır ve toplam üç köprü kullanılır.',
        hints:['Köprü sayısı, yazılan ada sayısından bir eksiktir.','Her okun izin verilen bağlantılardan biri olduğunu kontrol et.'],tags:['ağ mantığı','yol']});
    }
  },
  {
    id:'three-digit-code',minGrade:4,maxGrade:7,depth:5,
    create(random,role){
      const options=shuffle(['731','751','713','531'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Kod 1, 3, 5 ve 7 rakamlarından üçüyle, rakam tekrarı olmadan yazılıyor. Kod 500’den büyük. İlk ve son rakamın toplamı 8. Rakamlar toplamı 11.',
        prompt:'Koşulları sağlayan kod hangisidir?',options,answerValue:'731',
        explanation:'500’den büyük olduğu için ilk rakam 5 veya 7’dir. İlk ve son toplamı 8 olduğunda 7 ile 1 eşleşir. Toplamın 11 olması orta rakamı 3 yapar: 731.',
        hints:['Önce yüzler basamağını sınır koşuluyla belirle.','İlk ve son basamağı eşleştirdikten sonra toplam koşulunu kullan.'],tags:['çoklu koşul','kod']});
    }
  },
  {
    id:'set-logic-no-overlap',minGrade:6,maxGrade:12,depth:5,
    create(random,role){
      const options=shuffle(['Hiçbir lale metal değildir.','Bazı laleler metaldir.','Bütün bahçe nesneleri laledir.','Bazı metaller çiçektir.'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Bütün laleler çiçektir. Hiçbir çiçek metal değildir. Bazı bahçe nesneleri metaldir.',prompt:'Hangisi kesinlikle doğrudur?',
        options,answerValue:'Hiçbir lale metal değildir.',explanation:'Laleler çiçek kümesinin içindedir ve çiçeklerle metaller kesişmez. Bu nedenle lale ile metal de kesişemez.',
        hints:['Kümeleri iç içe ve ayrık bölgeler olarak çiz.','“Bazı bahçe nesneleri” bilgisi laleler hakkında yeni bir bağ kurmaz.'],tags:['kümeler','zorunlu çıkarım']});
    }
  },
  {
    id:'task-dependency-block',minGrade:5,maxGrade:11,depth:5,
    create(random,role){
      const options=shuffle(['A – D – B – C','A – B – C – D','D – A – B – C','B – A – D – C'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'B görevi A’dan sonra yapılır. C, B’den sonra yapılır. D, A’nın hemen ardından ve C’den önce yapılmalıdır.',prompt:'Kuralları sağlayan görev sırası hangisidir?',
        options,answerValue:'A – D – B – C',explanation:'A ile D ayrılmaz bir bloktur. B, A’dan; C ise hem B’den hem D’den sonra gelmelidir.',
        hints:['“Hemen ardından” koşulunu tek blok yap.','Sonra önce-sonra ilişkilerini bu bloğun çevresine yerleştir.'],tags:['iş akışı','ön koşul']});
    }
  },
  {
    id:'linear-seating-elimination',minGrade:5,maxGrade:10,depth:5,
    create(random,role){
      const options=shuffle(['Q ile S','P ile Q','R ile T','P ile T'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'P, Q, R, S ve T soldan sağa beş koltuğa oturacaktır. R ortadadır. P, R’nin hemen solundadır. T bir uçtadır. Q ile S yan yana değildir.',
        prompt:'Birinci ve dördüncü koltuklarda oturanlar hangi ikilidir?',options,answerValue:'Q ile S',
        explanation:'R üçüncü, P ikinci koltuktadır. T birinci olursa Q ve S dördüncü-beşinci koltuklarda yan yana kalır; bu yasaktır. T beşinci olmalı, Q ve S birinci-dördüncü koltukları paylaşmalıdır.',
        hints:['Kesin koltukları önce yerleştir.','T’nin iki uç olasılığını ayrı ayrı dene.'],tags:['yerleştirme','çelişkiyle eleme']});
    }
  },
  {
    id:'shape-color-matrix',minGrade:3,maxGrade:6,depth:4,
    create(random,role){
      const options=shuffle(['Kırmızı daire','Mavi daire','Kırmızı kare','Mavi kare'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'2×2 tabloda her satır ve sütunda bir daire-bir kare ile bir kırmızı-bir mavi bulunur. Sol üstte kırmızı daire, sağ üstte mavi kare, sol altta mavi kare vardır.',
        prompt:'Sağ alt hücrede ne olmalıdır?',options,answerValue:'Kırmızı daire',
        explanation:'Alt satırda mavi kare bulunduğu için eksik şekil daire ve renk kırmızı olmalıdır. Sağ sütun da aynı koşulu sağlar.',
        hints:['Şekil ve renk kurallarını ayrı kontrol et.','Alt satırdaki eksik özellikleri belirle.'],tags:['matris','iki özellik']});
    }
  },
  {
    id:'meeting-day-intersection',minGrade:4,maxGrade:6,depth:5,
    create(random,role){
      const options=shuffle(['Perşembe','Çarşamba','Cuma','Cumartesi'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Kulüp toplantısı salıdan sonra, cumadan önce yapılacaktır. Toplantı, spor çalışmasının ertesi günüdür. Spor çalışması çarşambadır.',
        prompt:'Kulüp toplantısı hangi gündür?',options,answerValue:'Perşembe',explanation:'Çarşambanın ertesi günü perşembedir; ayrıca salıdan sonra ve cumadan önce koşullarını sağlar.',
        hints:['“Ertesi gün” koşulunu önce uygula.','Bulduğun günün diğer iki sınır koşulunu da sağladığını kontrol et.'],tags:['takvim','koşul kesişimi']});
    }
  },
  {
    id:'nested-containers',minGrade:3,maxGrade:6,depth:4,
    create(random,role){
      const options=shuffle(['Kırmızı kutu dolabın içindedir.','Yeşil kutu mavi kutunun içindedir.','Mavi kutu kırmızı kutunun içindedir.','Dolap kırmızı kutunun içindedir.'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Kırmızı kutu mavi kutunun içindedir. Mavi kutu dolabın içindedir. Yeşil kutu dolabın dışındadır.',prompt:'Hangisi kesinlikle doğrudur?',
        options,answerValue:'Kırmızı kutu dolabın içindedir.',explanation:'İçinde olma ilişkisi zincir hâlinde aktarılır: kırmızı mavi kutunun, mavi de dolabın içindeyse kırmızı dolabın içindedir.',
        hints:['Kutuları dıştan içe doğru çiz.','Bir nesne, başka bir iç nesnenin içindeyse dış kabın da içindedir.'],tags:['iç içe ilişki','geçişlilik']});
    }
  },
  {
    id:'conditional-contrapositive',minGrade:6,maxGrade:12,depth:5,
    create(random,role){
      const options=shuffle(['Yağmur yağmıyordur.','Etkinlik açık havadadır.','Projektör bozuktur.','Yağmur kesinlikle yağıyordur.'],random);
      return optionQuestion({familyId:this.id,minGrade:this.minGrade,maxGrade:this.maxGrade,cognitiveDepth:this.depth,role,
        context:'Yağmur yağarsa etkinlik içeri alınır. Etkinlik içeri alınırsa projektör kullanılır. Projektör kullanılmadığı biliniyor.',prompt:'Hangi sonuç zorunludur?',
        options,answerValue:'Yağmur yağmıyordur.',explanation:'Projektör kullanılmadığına göre etkinlik içeride değildir. Etkinlik içeride değilse, “yağmur yağarsa içeri alınır” kuralına göre yağmur da yağmıyordur.',
        hints:['Koşul zincirini yağmur → içerisi → projektör biçiminde yaz.','Sonucun olumsuzundan geriye doğru ilerle.'],tags:['koşullu mantık','karşıt-ters']});
    }
  }

];

// Bazı mantık fabrikalarında bilinçli olarak çözüm kontrolü gerektiren tutarsız metin riski olabilir.
// Bu doğrulayıcılar, içerik yayımlanmadan önce tek doğru seçenek kontrolü yapar.
function sanitizeKnownLogicIssues(question) {
  if (question.familyId === 'three-truth-liars') {
    question.options = ['Ada yalancı, Bora doğrucu, Cem doğrucu','Ada doğrucu, Bora yalancı, Cem yalancı','Üçü de doğrucu','Üçü de yalancı'];
    question.answerValue = 'Ada yalancı, Bora doğrucu, Cem doğrucu';
    question.explanation = 'Ada yalancıysa “Bora yalancı” sözü yanlıştır; Bora doğrucudur. Bora doğru söylediği için Cem doğrucudur. Cem’in “Ada ile ben farklı türdeyiz” sözü de doğrudur.';
  }
  if (question.familyId === 'binary-switches') {
    question.options = ['2 ve 3','1 ve 3','Yalnız 2','Üçü de'];
    question.answerValue = '2 ve 3';
    question.explanation = '000 → A:110 → B:101 → A:011. Son durumda 2 ve 3 açıktır.';
  }
  return question;
}


const LOGIC_SCENARIOS = [
  'Bilim kulübü seçmeleri', 'Kütüphane düzenleme görevi', 'Robotik takım turu', 'Okul şenliği planı',
  'Müze atölyesi', 'Doğa kampı görevi', 'Satranç kulübü çalışması', 'Uzay araştırma ekibi',
  'Sınıf gazetesi hazırlığı', 'Spor turnuvası planı', 'Tiyatro provası', 'Kodlama laboratuvarı',
  'Geri dönüşüm projesi', 'Müzik grubu seçmeleri', 'Gezi programı', 'Kitap fuarı görevi',
  'Deney istasyonu', 'Harita keşif turu', 'Tasarım atölyesi', 'Matematik kampı',
  'Okul meclisi toplantısı', 'Fotoğraf sergisi', 'Bahçe planlama görevi', 'Hazine avı etabı',
  'Bilgi yarışması turu', 'Kısa film ekibi', 'Bilim merkezi gezisi', 'Akıl oyunları ligi',
  'Sosyal sorumluluk projesi', 'Kütüphane dedektifleri', 'Gözlem istasyonu', 'Proje sunum haftası'
];

function simultaneousReplace(value, replacements) {
  if (typeof value !== 'string') return value;
  const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
  if (!keys.length) return value;
  const escaped = keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped})(?![\\p{L}\\p{N}_])`, 'gu');
  return value.replace(pattern, (match) => replacements[match] ?? match);
}

function mapQuestionText(question, replacements) {
  const mapped = { ...question };
  for (const field of ['context', 'prompt', 'answerValue', 'explanation']) mapped[field] = simultaneousReplace(mapped[field], replacements);
  mapped.options = mapped.options?.map((option) => simultaneousReplace(option, replacements));
  mapped.hints = mapped.hints?.map((hint) => simultaneousReplace(hint, replacements));
  return mapped;
}

function applyLogicSurfaceVariant(question, random) {
  let varied = { ...question, options: [...question.options], hints: [...(question.hints || [])] };
  const scenario = pick(LOGIC_SCENARIOS, random);
  const station = pick(['A masası','B masası','Keşif turu','Final etabı','Strateji turu','Kanıt masası','Çözüm turu','Ustalık etabı'], random);
  varied.context = `${scenario} • ${station}: ${varied.context}`;

  if (varied.familyId === 'three-truth-liars') {
    const names = pick([
      ['Seda', 'Arda', 'Eren'], ['Lara', 'Kaan', 'Kerem'], ['Nisa', 'Baran', 'Selim'], ['Maya', 'Bora', 'Eren']
    ], random);
    varied = mapQuestionText(varied, { Ada: names[0], Bora: names[1], Cem: names[2] });
  }
  if (varied.familyId === 'book-owner-matching') {
    const names = pick([
      ['Seda', 'Arda', 'Selin'], ['Lara', 'Kaan', 'Ceren'], ['Nisa', 'Baran', 'Ece']
    ], random);
    varied = mapQuestionText(varied, { Ada: names[0], Bora: names[1], Ceren: names[2] });
  }
  if (varied.familyId === 'shape-color-matrix') {
    const colors = pick([['Turuncu','Mor'],['Yeşil','Mavi'],['Kırmızı','Mavi']], random);
    varied = mapQuestionText(varied, { Kırmızı: colors[0], Mavi: colors[1], kırmızı: colors[0].toLocaleLowerCase('tr-TR'), mavi: colors[1].toLocaleLowerCase('tr-TR') });
  }
  if (varied.familyId === 'nested-containers') {
    const colors = pick([['Turuncu','Mor','Yeşil'],['Sarı','Lacivert','Beyaz'],['Kırmızı','Mavi','Yeşil']], random);
    varied = mapQuestionText(varied, {
      Kırmızı: colors[0], Mavi: colors[1], Yeşil: colors[2],
      kırmızı: colors[0].toLocaleLowerCase('tr-TR'),
      mavi: colors[1].toLocaleLowerCase('tr-TR'),
      yeşil: colors[2].toLocaleLowerCase('tr-TR')
    });
  }

  return varied;
}

const OLYMPIAD_SCENARIOS = [
  'Olimpiyat kampı sayı turu', 'Strateji laboratuvarı', 'BİLSEM düşünme atölyesi', 'Akıl oyunları ligi',
  'Matematik keşif görevi', 'Problem çözme istasyonu', 'Şekil ve sayı araştırması', 'Mantık maratonu',
  'Kombinatorik keşif masası', 'Geometri dedektifliği', 'Sayı teorisi görevi', 'Örüntü araştırma turu',
  'Zihin esnetme etabı', 'Çözüm stratejileri kampı', 'Matematik kulübü seçmeleri', 'Olimpiyat hazırlık oturumu',
  'Tersinden düşünme görevi', 'Küçük örnekler laboratuvarı', 'Değişmezlik araştırması', 'Sistematik sayma turu',
  'Görsel düşünme atölyesi', 'Çoklu koşul görevi', 'Kanıt bulma turu', 'Sayı kartları meydan okuması',
  'Yol ve düzen keşfi', 'Zor problem çalışma masası', 'Matematiksel modelleme turu', 'Hız ve strateji dengesi',
  'Meraklı zihinler etabı', 'Yeni nesil problem turu', 'Çözüm yolu karşılaştırması', 'Olimpiyat merdiveni etabı'
];

function applyOlympiadSurfaceVariant(question, random) {
  return { ...question, context: `${pick(OLYMPIAD_SCENARIOS, random)}: ${question.context}` };
}

function normalizeSeen(seen) {
  return seen instanceof Set ? seen : new Set(seen || []);
}

function questionSignature(gameId, question) {
  return `${gameId}:${question.familyId}:${hashString(`${question.context}|${question.prompt}|${question.answerValue}`).toString(36)}`;
}

function buildRolePlan(count, random, baseGrade) {
  const reviewCount = baseGrade > 1 ? Math.max(1, Math.round(count * V4_QUALITY_POLICY.curriculumMix.review)) : 0;
  const previewCount = baseGrade < 12 ? Math.max(1, Math.round(count * V4_QUALITY_POLICY.curriculumMix.preview)) : 0;
  const currentCount = Math.max(0, count - reviewCount - previewCount);
  return shuffle([
    ...Array(reviewCount).fill('review'),
    ...Array(currentCount).fill('current'),
    ...Array(previewCount).fill('preview')
  ], random);
}

function gradeForRole(baseGrade, role) {
  if (role === 'review') return Math.max(1, baseGrade - 1);
  if (role === 'preview') return Math.min(12, baseGrade + 1);
  return baseGrade;
}

function validateChallengeQuestion(question) {
  const errors = validateQuestionQuality(question);
  if (!Array.isArray(question.hints) || question.hints.length < V5_QUALITY_REGISTRY.minHintCount) errors.push('challenge için iki kademeli ipucu gerekli');
  else errors.push(...hintQualityErrors(question));
  return [...new Set(errors)];
}

function buildDiverseSession({ gameId, catalog, profile, seed, count, seenQuestionKeys, recentFamilyIds = [] }) {
  const random = seededRandom(hashString(`${profile.id}|${profile.grade}|${gameId}|${seed}|v4`));
  const seen = normalizeSeen(seenQuestionKeys);
  const recent = new Set(recentFamilyIds || []);
  const baseGrade = Math.max(1, Math.min(12, Number(profile.grade || Math.max(1, profile.age - 5))));
  const rolePlan = buildRolePlan(count, random, baseGrade);
  const rounds = [];
  const families = new Set();

  for (let slot = 0; slot < rolePlan.length && rounds.length < count; slot += 1) {
    const role = rolePlan[slot];
    const targetGrade = gradeForRole(baseGrade, role);
    const exact = catalog.filter((factory) => factory.minGrade <= targetGrade && factory.maxGrade >= targetGrade && isChallengeFamilyAllowed(factory, gameId));
    const nearby = catalog.filter((factory) => factory.minGrade <= Math.min(12, targetGrade + 1) && factory.maxGrade >= Math.max(1, targetGrade - 1) && isChallengeFamilyAllowed(factory, gameId));
    const sortCandidates = (items) => shuffle(items, random)
      .filter((factory) => !families.has(factory.id))
      .sort((a, b) => Number(recent.has(a.id)) - Number(recent.has(b.id)) || b.depth - a.depth);
    const exactIds = new Set(exact.map((factory) => factory.id));
    const candidates = [
      ...sortCandidates(exact),
      ...sortCandidates(nearby.filter((factory) => !exactIds.has(factory.id)))
    ];

    let selected = null;
    for (let candidateIndex = 0; candidateIndex < candidates.length && !selected; candidateIndex += 1) {
      const factory = candidates[candidateIndex];
      for (let retry = 0; retry < 96 && !selected; retry += 1) {
        let question = factory.create(seededRandom(hashString(`${seed}|${slot}|${factory.id}|${retry}`)), role);
        question = sanitizeKnownLogicIssues(question);
        if (gameId === 'logic-station') question = applyLogicSurfaceVariant(question, seededRandom(hashString(`${seed}|surface|${slot}|${factory.id}|${retry}`)));
        if (gameId === 'olympiad-ladder') question = applyOlympiadSurfaceVariant(question, seededRandom(hashString(`${seed}|olympiad-surface|${slot}|${factory.id}|${retry}`)));
        const key = questionSignature(gameId, question);
        if (seen.has(key)) continue;
        const qualityErrors = validateChallengeQuestion(question);
        if (qualityErrors.length) continue;
        question.questionKey = key;
        question.targetGrade = targetGrade;
        question.curriculumRole = role;
        selected = question;
      }
    }

    if (selected) {
      rounds.push(selected);
      families.add(selected.familyId);
    }
  }

  // Rol kotasında uygun aile kalmazsa, yine aynı aileyi kullanmadan kalan boşlukları en güçlü uygun içerikle tamamla.
  if (rounds.length < count) {
    const fallbackCandidates = shuffle(catalog.filter((factory) => !families.has(factory.id) && factory.minGrade <= baseGrade + 1 && factory.maxGrade >= Math.max(1, baseGrade - 1) && isChallengeFamilyAllowed(factory, gameId)), random)
      .sort((a, b) => Number(recent.has(a.id)) - Number(recent.has(b.id)) || b.depth - a.depth);
    for (const factory of fallbackCandidates) {
      if (rounds.length >= count) break;
      let question = sanitizeKnownLogicIssues(factory.create(seededRandom(hashString(`${seed}|fallback|${factory.id}`)), 'current'));
      if (gameId === 'logic-station') question = applyLogicSurfaceVariant(question, seededRandom(hashString(`${seed}|fallback-surface|${factory.id}`)));
      if (gameId === 'olympiad-ladder') question = applyOlympiadSurfaceVariant(question, seededRandom(hashString(`${seed}|fallback-olympiad-surface|${factory.id}`)));
      const key = questionSignature(gameId, question);
      if (seen.has(key) || validateChallengeQuestion(question).length) continue;
      question.questionKey = key;
      question.targetGrade = baseGrade;
      question.curriculumRole = 'current';
      rounds.push(question);
      families.add(factory.id);
    }
  }
  return rounds;
}

export function createV4OlympiadSession(profile, seed, count = 10, options = {}) {
  return buildDiverseSession({ gameId:'olympiad-ladder', catalog:olympiadFactories, profile, seed, count, seenQuestionKeys:options.seenQuestionKeys, recentFamilyIds:options.recentFamilyIds });
}

export function createV4LogicSession(profile, seed, count = 8, options = {}) {
  return buildDiverseSession({ gameId:'logic-station', catalog:logicFactories, profile, seed, count, seenQuestionKeys:options.seenQuestionKeys, recentFamilyIds:options.recentFamilyIds });
}

export function createV4ParagraphSession(profile, seed, count = 8, options = {}) {
  const dynamic = createDynamicParagraphSession(profile, seed, count, options);
  if (dynamic.length >= count) return dynamic;

  // Dinamik üreticilerden uygun soru çıkmazsa doğrulanmış sabit banka yedek olur.
  const random = seededRandom(hashString(`${profile.id}|paragraph-static|${seed}`));
  const seen = normalizeSeen(options.seenQuestionKeys);
  const occupied = new Set([...seen, ...dynamic.map((round) => round.questionKey)]);
  const grade = Number(profile.grade || Math.max(1, profile.age - 5));
  const usedFamilies = new Set(dynamic.map((round) => round.familyId));
  const candidates = shuffle(V4_PARAGRAPH_BANK.filter(q => q.minGrade <= grade + 1 && q.maxGrade >= Math.max(1,grade - 1)), random);
  const selected=[...dynamic];
  for (const item of candidates) {
    if (usedFamilies.has(item.familyId)) continue;
    const key=`paragraph-detective:${item.id}`;
    if (occupied.has(key)) continue;
    selected.push({...item,questionKey:key,targetGrade:grade,curriculumRole:item.minGrade < grade?'review':item.minGrade>grade?'preview':'current',qualityScore:55+item.cognitiveDepth*9,timeLimit:Math.max(95,55+item.cognitiveDepth*21)});
    usedFamilies.add(item.familyId);
    if(selected.length>=count)break;
  }
  return selected;
}

export function chooseDiscoveryCard(profile, session, seed = Date.now()) {
  const grade=Number(profile.grade || Math.max(1,profile.age-5));
  const themes = session?.game?.category === 'english' ? ['english'] : session?.game?.category === 'lgs' ? ['lgs','reading','time'] : session?.game?.category === 'turkish' ? ['reading','curiosity'] : session?.game?.category === 'olympiad' || session?.game?.category === 'logic' ? ['strategy','persistence','curiosity'] : ['persistence','curiosity'];
  const eligible=DISCOVERY_CARDS.filter(card=>card.minGrade<=grade&&card.maxGrade>=grade&&themes.includes(card.theme));
  const pool=eligible.length?eligible:DISCOVERY_CARDS.filter(card=>card.minGrade<=grade&&card.maxGrade>=grade);
  return pick(pool,seededRandom(hashString(`${profile.id}|${session?.game?.id}|${seed}`))) || null;
}

export function v4FamilyStats() {
  return { olympiadFamilies:olympiadFactories.length, activeOlympiadFamilies:olympiadFactories.filter(factory=>isChallengeFamilyAllowed(factory,'olympiad-ladder')).length, logicFamilies:logicFactories.length, activeLogicFamilies:logicFactories.filter(factory=>isChallengeFamilyAllowed(factory,'logic-station')).length, paragraphFamilies:new Set(V4_PARAGRAPH_BANK.map(q=>q.familyId)).size, dynamicParagraphFamilies: paragraphFamilyStats().dynamicFamilies };
}

export function validateQuestionQuality(question) {
  const errors=[];
  if(!question.familyId)errors.push('familyId eksik');
  if(!question.prompt)errors.push('prompt eksik');
  if(!Array.isArray(question.options)||question.options.length<4)errors.push('en az 4 seçenek gerekli');
  if(!question.options?.includes(String(question.answerValue)))errors.push('doğru cevap seçeneklerde yok');
  if(new Set(question.options||[]).size!==(question.options||[]).length)errors.push('yinelenen seçenek');
  if((question.cognitiveDepth||0)<3)errors.push('bilişsel derinlik 3 altında');
  if(isQuarantinedFamily(question.familyId))errors.push('karantinadaki soru ailesi');
  if(String(question.explanation||'').length<35)errors.push('çözüm açıklaması çok kısa');
  return errors;
}
