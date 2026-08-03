const SUBJECT_REQUIREMENTS = Object.freeze({
  mathematics: ['learningOutcomeId','thinkingModel','solutionStrategy','distractorStrategies'],
  turkish: ['learningOutcomeId','thinkingModel','naturalContextRule','distractorStrategies'],
  science: ['learningOutcomeId','thinkingModel','scientificAccuracyRule','solutionStrategy'],
  social: ['learningOutcomeId','thinkingModel','sourceUseRule','distractorStrategies'],
  religion: ['learningOutcomeId','thinkingModel','conceptAccuracyRule','pedagogicalBoundary'],
  english: ['learningOutcomeId','thinkingModel','cefrLevel','naturalUsageRule'],
  logic: ['thinkingModel','constraintModel','solutionStrategy','distractorStrategies'],
  olympiad: ['thinkingModel','multiStepRequirement','solutionStrategy','hintStrategy']
});

const FAMILY_STATUS = Object.freeze({ LAB:'LAB', SILVER:'SILVER', GOLD:'GOLD', BLOCKED:'BLOCKED' });

function text(value=''){ return String(value).trim(); }
function list(value){ return Array.isArray(value) ? value.filter(Boolean) : []; }
function subjectKeyOf(value=''){
  const id=text(value).toLocaleLowerCase('tr-TR');
  if(/math|matematik/.test(id)) return 'mathematics';
  if(/turk|türk/.test(id)) return 'turkish';
  if(/science|fen/.test(id)) return 'science';
  if(/social|sosyal|tarih|coğraf/.test(id)) return 'social';
  if(/religion|din/.test(id)) return 'religion';
  if(/english|ingiliz/.test(id)) return 'english';
  if(/olymp|olimpiyat/.test(id)) return 'olympiad';
  if(/logic|zeka|zekâ/.test(id)) return 'logic';
  return 'default';
}

export function createFamilyBlueprint(input={}){
  const subjectKey=subjectKeyOf(input.subjectId);
  return Object.freeze({
    schemaVersion:'10.0',
    familyId:text(input.familyId),
    subjectId:text(input.subjectId),
    subjectKey,
    visibleCardId:text(input.visibleCardId),
    topicId:text(input.topicId),
    learningOutcomeId:text(input.learningOutcomeId),
    title:text(input.title),
    purpose:text(input.purpose),
    thinkingModel:text(input.thinkingModel),
    thinkingPatternIds:list(input.thinkingPatternIds),
    difficultyBand:list(input.difficultyBand),
    cognitiveDepth:Number(input.cognitiveDepth||0),
    contextPolicy:{
      required:Boolean(input.contextPolicy?.required),
      mustAffectSolution:input.contextPolicy?.mustAffectSolution!==false,
      bannedTemplates:list(input.contextPolicy?.bannedTemplates),
      naturalContextRule:text(input.naturalContextRule||input.contextPolicy?.naturalContextRule)
    },
    distractorStrategies:list(input.distractorStrategies),
    solutionStrategy:text(input.solutionStrategy),
    hintStrategy:list(input.hintStrategy),
    variantAxes:list(input.variantAxes),
    qualityEvidence:list(input.qualityEvidence),
    constraints:{...(input.constraints||{})},
    domainRules:{
      scientificAccuracyRule:text(input.scientificAccuracyRule),
      sourceUseRule:text(input.sourceUseRule),
      conceptAccuracyRule:text(input.conceptAccuracyRule),
      pedagogicalBoundary:text(input.pedagogicalBoundary),
      cefrLevel:text(input.cefrLevel),
      naturalUsageRule:text(input.naturalUsageRule),
      constraintModel:text(input.constraintModel),
      multiStepRequirement:text(input.multiStepRequirement)
    },
    goldExample:input.goldExample||null
  });
}

export function auditFamilyBlueprint(blueprint={}){
  const errors=[], warnings=[];
  const required=['familyId','subjectId','visibleCardId','title','purpose','thinkingModel'];
  for(const field of required) if(!text(blueprint[field])) errors.push(`missing_${field}`);
  if(!list(blueprint.thinkingPatternIds).length) errors.push('missing_thinking_patterns');
  if(!list(blueprint.distractorStrategies).length) errors.push('missing_distractor_strategy');
  if(!list(blueprint.variantAxes).length) errors.push('missing_variant_axes');
  if(Number(blueprint.cognitiveDepth||0)<3) warnings.push('cognitive_depth_below_premium');
  if(list(blueprint.variantAxes).length<3) warnings.push('variant_space_narrow');
  if(list(blueprint.distractorStrategies).length<2) warnings.push('distractor_strategy_narrow');
  if(!text(blueprint.solutionStrategy)) warnings.push('solution_strategy_weak');
  if(!blueprint.goldExample) warnings.push('gold_example_missing');
  if(blueprint.contextPolicy?.required && !blueprint.contextPolicy?.mustAffectSolution) errors.push('decorative_context_forbidden');

  const subjectRequirements=SUBJECT_REQUIREMENTS[blueprint.subjectKey]||[];
  for(const field of subjectRequirements){
    const domainValue=blueprint.domainRules?.[field];
    const value=blueprint[field] ?? domainValue ?? blueprint.contextPolicy?.[field];
    if(Array.isArray(value) ? !value.length : !text(value)) errors.push(`subject_requirement_${field}`);
  }

  const score=Math.max(0,100-errors.length*18-warnings.length*5);
  const status=errors.length?FAMILY_STATUS.BLOCKED:score>=90?FAMILY_STATUS.GOLD:score>=76?FAMILY_STATUS.SILVER:FAMILY_STATUS.LAB;
  return {ok:!errors.length,status,score,errors:[...new Set(errors)],warnings:[...new Set(warnings)]};
}

export function buildVariantContract(blueprint={}, seed={}){
  const audit=auditFamilyBlueprint(blueprint);
  if(!audit.ok) return {ok:false,audit,contract:null};
  const selectedAxes={};
  for(const axis of blueprint.variantAxes){
    const key=typeof axis==='string'?axis:axis.id;
    const values=typeof axis==='string'?[]:list(axis.values);
    selectedAxes[key]=seed[key] ?? values[0] ?? null;
  }
  return {ok:true,audit,contract:{
    familyId:blueprint.familyId,
    subjectId:blueprint.subjectId,
    visibleCardId:blueprint.visibleCardId,
    learningOutcomeId:blueprint.learningOutcomeId,
    thinkingPatternId:blueprint.thinkingPatternIds[0],
    cognitiveDepth:blueprint.cognitiveDepth,
    selectedAxes,
    generationRules:{
      contextMustAffectSolution:blueprint.contextPolicy.mustAffectSolution,
      distractorStrategies:blueprint.distractorStrategies,
      solutionStrategy:blueprint.solutionStrategy,
      hints:blueprint.hintStrategy,
      prohibitedTemplates:blueprint.contextPolicy.bannedTemplates
    }
  }};
}

export const PREMIUM_FAMILY_CATALOG = Object.freeze([
  createFamilyBlueprint({familyId:'math-error-chain',subjectId:'mathematics',visibleCardId:'yanlis-cozumu-yakala',topicId:'operations',learningOutcomeId:'multi-step-error-analysis',title:'Hata Zinciri Dedektifi',purpose:'Çok adımlı çözümde ilk hatayı buldurur.',thinkingModel:'İşlem adımlarını geriye doğru doğrulama',thinkingPatternIds:['ERROR_ANALYSIS','MULTI_STEP_VERIFICATION'],difficultyBand:[3,4,5],cognitiveDepth:4,distractorStrategies:['yaygın işlem önceliği hatası','önceki adımdan taşınan hata'],solutionStrategy:'Her adımı bağımsız doğrula, ilk bozulan eşitliği işaretle.',hintStrategy:['Sonuçtan değil ilk adımdan başla.','Bir adım doğru olsa bile önceki hata onu geçersiz kılabilir.'],variantAxes:[{id:'operationFamily',values:['fraction','percent','integer']},{id:'errorLocation',values:[1,2,3]},{id:'representation',values:['symbolic','word-problem']}],qualityEvidence:['tek doğru ilk hata','çeldiriciler gerçek öğrenci yanılgısı'],goldExample:{id:'math-error-chain-gold-1'},contextPolicy:{required:false,mustAffectSolution:true}}),
  createFamilyBlueprint({familyId:'tr-inference-evidence',subjectId:'turkish',visibleCardId:'paragraf-dedektifi',topicId:'paragraph',learningOutcomeId:'implicit-meaning-with-evidence',title:'Kanıtlı Çıkarım',purpose:'Metinde açıkça yazmayan sonucu kanıtla ilişkilendirir.',thinkingModel:'İddia-kanıt eşleştirmesi',thinkingPatternIds:['TEXT_INFERENCE','EVIDENCE_SELECTION'],difficultyBand:[3,4,5],cognitiveDepth:4,naturalContextRule:'Metin gerçek bir gözlem, günlük yaşam kararı veya bilim-kültür anlatısı gibi doğal akmalıdır.',contextPolicy:{required:true,mustAffectSolution:true,bannedTemplates:['renkli başlıklı dosya','kulüp raporu']},distractorStrategies:['metindeki tek ayrıntıyı aşırı genelleme','doğru ama sorulan çıkarımla ilgisiz yargı'],solutionStrategy:'Her seçenek için metinden destekleyici veya çürüten ifadeyi bul.',hintStrategy:['Seçenek metinde aynen geçmek zorunda değildir.','İki farklı cümleyi birlikte düşün.'],variantAxes:[{id:'textGenre',values:['observation','biography','science-popular']},{id:'inferenceType',values:['cause','attitude','purpose']},{id:'evidenceDistance',values:['near','distributed']}],qualityEvidence:['doğru cevap doğrudan kopya değildir','en az iki güçlü çeldirici'],goldExample:{id:'tr-inference-evidence-gold-1'}}),
  createFamilyBlueprint({familyId:'science-variable-lab',subjectId:'science',visibleCardId:'deney-laboratuvari',topicId:'scientific-method',learningOutcomeId:'control-variable-reasoning',title:'Değişken Laboratuvarı',purpose:'Deney tasarımında bağımsız, bağımlı ve kontrol değişkenlerini ayırt ettirir.',thinkingModel:'Deneysel kontrol ve nedensellik',thinkingPatternIds:['SCIENTIFIC_REASONING','VARIABLE_CONTROL'],difficultyBand:[3,4,5],cognitiveDepth:4,scientificAccuracyRule:'Deney koşulları bilimsel olarak mümkün ve ölçülebilir olmalıdır.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['bağımlı-bağımsız değişken karışıklığı','aynı anda iki değişkeni değiştirme'],solutionStrategy:'Araştırma sorusundaki değiştirilen ve ölçülen büyüklükleri belirle.',hintStrategy:['Tek bir koşul değişmeli.','Sonuç olarak ölçülen büyüklüğü bul.'],variantAxes:[{id:'domain',values:['plants','heat','electricity']},{id:'variableCount',values:[3,4]},{id:'dataForm',values:['text','table']}],qualityEvidence:['tek değişken ilkesi','ölçülebilir sonuç'],goldExample:{id:'science-variable-lab-gold-1'}}),
  createFamilyBlueprint({familyId:'social-source-compare',subjectId:'social',visibleCardId:'kaynak-dedektifi',topicId:'historical-sources',learningOutcomeId:'compare-source-perspectives',title:'Kaynakları Karşılaştır',purpose:'İki kaynağın bakış açısını ve kanıt gücünü karşılaştırır.',thinkingModel:'Kaynak eleştirisi',thinkingPatternIds:['SOURCE_COMPARISON','PERSPECTIVE_ANALYSIS'],difficultyBand:[3,4,5],cognitiveDepth:4,sourceUseRule:'Kaynak türü, tarih ve yazar konumu çıkarımı gerçekten etkilemelidir.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['kaynak türünü güvenilirlikle eşitleme','tek kaynağı kesin gerçek kabul etme'],solutionStrategy:'Kaynağın üreticisini, amacını, zamanını ve ortak kanıtları karşılaştır.',hintStrategy:['Kaynağı kimin oluşturduğunu düşün.','İki kaynağın ortaklaştığı noktayı bul.'],variantAxes:[{id:'sourcePair',values:['diary-law','map-letter','photo-report']},{id:'conflictLevel',values:['low','medium','high']},{id:'task',values:['reliability','bias','corroboration']}],qualityEvidence:['kaynak metni çözüme zorunlu','tek taraflı ezber yok'],goldExample:{id:'social-source-compare-gold-1'}}),
  createFamilyBlueprint({familyId:'religion-concept-situation',subjectId:'religion',visibleCardId:'deger-karar-atolyesi',topicId:'values',learningOutcomeId:'apply-concept-to-situation',title:'Değer ve Karar',purpose:'Dini-ahlaki kavramı gerçek bir karara uygular.',thinkingModel:'Kavramı bağlama transfer etme',thinkingPatternIds:['CONCEPT_TRANSFER','ETHICAL_REASONING'],difficultyBand:[2,3,4],cognitiveDepth:3,conceptAccuracyRule:'Kavramlar öğretim programındaki anlam sınırlarında kullanılmalıdır.',pedagogicalBoundary:'Yargılayıcı, korkutucu veya mezhep ayrımına dayalı ifade kullanılmaz.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['yakın fakat farklı değer','iyi niyetli ama kavramla uyuşmayan davranış'],solutionStrategy:'Durumdaki niyet, davranış ve sonucu hedef kavramla karşılaştır.',hintStrategy:['Kavramın yalnız sonucuna değil niyetine de bak.'],variantAxes:[{id:'setting',values:['school','family','community']},{id:'concept',values:['justice','responsibility','solidarity']},{id:'conflict',values:['choice','pressure','resource']}],qualityEvidence:['kavram doğruluğu','yaşa uygun ve yargılayıcı olmayan dil'],goldExample:{id:'religion-concept-situation-gold-1'}}),
  createFamilyBlueprint({familyId:'english-context-choice',subjectId:'english',visibleCardId:'meaning-in-context',topicId:'vocabulary',learningOutcomeId:'infer-word-meaning-in-context',title:'Meaning in Context',purpose:'Kelime anlamını doğal cümle ve bağlamdan çıkarttırır.',thinkingModel:'Context clue integration',thinkingPatternIds:['LANGUAGE_APPLICATION','CONTEXT_INFERENCE'],difficultyBand:[2,3,4],cognitiveDepth:3,cefrLevel:'A2-B1',naturalUsageRule:'Cümleler doğal, yaşa uygun ve gerçek İngilizce kullanımına yakın olmalıdır.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['same word class but wrong meaning','context-compatible surface association'],solutionStrategy:'Use grammar, nearby clues and the overall situation together.',hintStrategy:['Look for contrast or cause words.','Check which meaning fits the whole sentence.'],variantAxes:[{id:'clueType',values:['definition','contrast','example']},{id:'wordClass',values:['verb','adjective','noun']},{id:'setting',values:['school','travel','daily-life']}],qualityEvidence:['CEFR uyumu','doğal kullanım'],goldExample:{id:'english-context-choice-gold-1'}}),

  createFamilyBlueprint({familyId:'social-cause-chain',subjectId:'social',visibleCardId:'kaynak-dedektifi',topicId:'historical-causality',learningOutcomeId:'build-evidence-based-cause-chain',title:'Neden-Sonuç Zinciri',purpose:'Bir gelişmenin nedenlerini, ara etkilerini ve sonuçlarını kanıta dayalı biçimde sıralatır.',thinkingModel:'Tarihsel nedensellik ve çok adımlı ilişki kurma',thinkingPatternIds:['CAUSE_EFFECT_CHAIN','EVIDENCE_SELECTION'],difficultyBand:[3,4,5],cognitiveDepth:4,sourceUseRule:'Verilen bilgi parçaları neden, ara etki ve sonuç ayrımını zorunlu kılmalıdır.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['sonucu neden gibi sunma','zaman sırasını nedensellik sanma'],solutionStrategy:'Her bilgiyi neden, ara etki veya sonuç olarak sınıflandır; yalnız kanıtlanan bağlantıları zincire ekle.',hintStrategy:['Önce gerçekleşen her olay neden değildir.','Bir adımın diğerini nasıl etkilediğini açıkla.'],variantAxes:[{id:'theme',values:['migration','trade','technology']},{id:'chainLength',values:[3,4,5]},{id:'evidenceForm',values:['short-text','timeline','mixed-source']}],qualityEvidence:['en az üç bağlantılı adım','kanıta dayalı tek zincir'],goldExample:{id:'social-cause-chain-gold-1'}}),
  createFamilyBlueprint({familyId:'religion-ethical-dilemma',subjectId:'religion',visibleCardId:'deger-karar-atolyesi',topicId:'values',learningOutcomeId:'evaluate-ethical-choice-with-reasons',title:'Ahlaki İkilem',purpose:'Birden fazla değerin çatıştığı durumda gerekçeli ve dengeli karar kurdurur.',thinkingModel:'Değer çatışmasını çözme ve gerekçe değerlendirme',thinkingPatternIds:['ETHICAL_DILEMMA','JUSTIFICATION'],difficultyBand:[3,4,5],cognitiveDepth:4,conceptAccuracyRule:'Adalet, sorumluluk, dürüstlük ve yardımlaşma kavramları programdaki anlam sınırlarında kullanılmalıdır.',pedagogicalBoundary:'Tek bir kişiyi damgalayan, korkutan veya mezhep ayrımı üreten dil kullanılmaz.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['iyi niyeti tek başına yeterli sayma','bir değeri korurken diğerinin hakkını yok sayma'],solutionStrategy:'Etkilenen kişileri, çatışan değerleri ve kararın kısa-uzun vadeli sonuçlarını birlikte değerlendir.',hintStrategy:['Karardan kimlerin etkilendiğini listele.','Bir değeri korurken başka bir hakkı zedeliyor musun?'],variantAxes:[{id:'setting',values:['school','family','neighbourhood']},{id:'valueConflict',values:['honesty-loyalty','justice-mercy','responsibility-help']},{id:'decisionForm',values:['best-action','best-reason','evaluate-claim']}],qualityEvidence:['gerekçeli karar','yargılayıcı olmayan dil'],goldExample:{id:'religion-ethical-dilemma-gold-1'}}),
  createFamilyBlueprint({familyId:'english-dialogue-completion',subjectId:'english',visibleCardId:'meaning-in-context',topicId:'communication',learningOutcomeId:'complete-dialogue-by-function-and-context',title:'Dialogue Completion',purpose:'Diyaloğun iletişim amacını ve bağlamını birlikte değerlendirerek doğal ifadeyi seçtirir.',thinkingModel:'Pragmatic language inference',thinkingPatternIds:['DIALOGUE_INFERENCE','LANGUAGE_FUNCTION'],difficultyBand:[2,3,4],cognitiveDepth:3,cefrLevel:'A2-B1',naturalUsageRule:'Diyaloglar yaşa uygun, günlük ve doğal İngilizce kalıplar içermelidir.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['grammatically correct but pragmatically wrong reply','same topic but wrong language function'],solutionStrategy:'Identify the speaker’s purpose, tone and the information already given before choosing the reply.',hintStrategy:['Ask what the speaker is trying to do.','A natural reply must fit both meaning and function.'],variantAxes:[{id:'function',values:['request','suggestion','apology','invitation']},{id:'setting',values:['school','home','travel']},{id:'tone',values:['neutral','friendly','polite']}],qualityEvidence:['natural turn-taking','CEFR uyumu'],goldExample:{id:'english-dialogue-completion-gold-1'}}),
  createFamilyBlueprint({familyId:'olympiad-proof-strategy',subjectId:'olympiad',visibleCardId:'olimpiyat-meydani',title:'İspat Stratejisi',purpose:'Bir iddiayı örnekle doğrulamak yerine uygun ispat yaklaşımını seçtirir ve gerekçelendirir.',thinkingModel:'İspat yöntemi seçimi ve karşı örnek analizi',multiStepRequirement:'Öğrenci en az iki olası stratejiyi karşılaştırmalı ve neden birinin yeterli olduğunu açıklamalıdır.',thinkingPatternIds:['PROOF_STRATEGY','COUNTEREXAMPLE'],difficultyBand:[4,5],cognitiveDepth:5,contextPolicy:{required:false,mustAffectSolution:true},distractorStrategies:['birkaç örneği ispat sayma','iddianın tersini kanıtlamaya çalışma'],solutionStrategy:'İddianın biçimini belirle; doğrudan ispat, çelişki, tümevarım veya karşı örnek arasından en uygun yolu seç.',hintStrategy:['“Her zaman” ifadesini çürütmek için tek karşı örnek yeterlidir.','Örnekler neden genel kanıt değildir?'],variantAxes:[{id:'claimType',values:['universal','existence','divisibility']},{id:'strategy',values:['direct','contradiction','counterexample']},{id:'task',values:['select','complete','criticise']}],qualityEvidence:['strateji gerekçesi','çok adımlı düşünme'],goldExample:{id:'olympiad-proof-strategy-gold-1'}}),
  createFamilyBlueprint({familyId:'logic-constraint-grid',subjectId:'logic',visibleCardId:'kosul-agi',title:'Koşul Ağı',purpose:'Birden çok koşulu tabloya dönüştürerek zorunlu sonucu buldurur.',thinkingModel:'Kısıt yayılımı ve olasılık eleme',constraintModel:'En az dört varlık, üç bağımsız kısıt ve tek zorunlu sonuç.',thinkingPatternIds:['CONSTRAINT_PROPAGATION','MATCHING'],difficultyBand:[4,5],cognitiveDepth:5,contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['tek koşula uyan ama bütünü bozan eşleşme','olası olanı zorunlu sanma'],solutionStrategy:'Kesin koşulları tabloya yerleştir, çakışan olasılıkları sırayla ele.',hintStrategy:['Önce kesin eşleşmeleri yaz.','Bir koşulun diğer satırları nasıl etkilediğini izle.'],variantAxes:[{id:'entityCount',values:[4,5]},{id:'relationType',values:['day-task','person-object','place-order']},{id:'questionType',values:['must','cannot','complete-grid']}],qualityEvidence:['tek çözüm doğrulaması','çok adımlı çıkarım'],goldExample:{id:'logic-constraint-grid-gold-1'}}),
  createFamilyBlueprint({familyId:'math-reverse-check',subjectId:'mathematics',visibleCardId:'yanlis-cozumu-yakala',topicId:'equations',learningOutcomeId:'reverse-check-solution',title:'Tersine Doğrulama',purpose:'Bir sonucun hangi işlem zincirinden gelebileceğini tersine denetletir.',thinkingModel:'Sonuçtan başlangıca tersine akıl yürütme',thinkingPatternIds:['REVERSE_REASONING','MULTI_STEP_VERIFICATION'],difficultyBand:[3,4,5],cognitiveDepth:4,distractorStrategies:['son işlemi ters çevirip önceki adımı atlama','işlem sırasını ters çevirirken işareti koruma'],solutionStrategy:'Son adımdan başlayarak her işlemin tersini uygula ve başlangıç değeriyle karşılaştır.',hintStrategy:['En son yapılan işlemi önce geri al.','Her ters işlemden sonra ara değeri kontrol et.'],variantAxes:[{id:'operationChain',values:['add-multiply','subtract-divide','percent-add']},{id:'chainLength',values:[2,3,4]},{id:'questionForm',values:['find-start','find-error','select-chain']}],qualityEvidence:['tek tersine çözüm','çok adımlı doğrulama'],goldExample:{id:'math-reverse-check-gold-1'},contextPolicy:{required:false,mustAffectSolution:true}}),
  createFamilyBlueprint({familyId:'tr-author-purpose',subjectId:'turkish',visibleCardId:'paragraf-dedektifi',topicId:'paragraph',learningOutcomeId:'infer-author-purpose',title:'Yazarın Amacını Kanıtla',purpose:'Metnin anlatım tercihlerini yazarın amacıyla ilişkilendirir.',thinkingModel:'Dilsel ipuçlarından amaç çıkarımı',thinkingPatternIds:['AUTHOR_PURPOSE','EVIDENCE_SELECTION'],difficultyBand:[3,4,5],cognitiveDepth:4,naturalContextRule:'Metin doğal bir bilgilendirme, eleştiri veya çağrı metni olmalıdır.',contextPolicy:{required:true,mustAffectSolution:true,bannedTemplates:['renkli başlıklı dosya','kulüp raporu']},distractorStrategies:['konuyu amaç sanma','metindeki tek ayrıntıyı ana amaç sayma'],solutionStrategy:'Fiilleri, vurgu yapılan sonuçları ve okura yönelen ifadeleri birlikte değerlendir.',hintStrategy:['Metin ne anlatıyor sorusundan sonra neden anlatıyor sorusunu sor.','Son cümledeki yönlendirmeyi önceki kanıtlarla birleştir.'],variantAxes:[{id:'genre',values:['public-awareness','science-popular','review']},{id:'purpose',values:['inform','persuade','criticize']},{id:'evidenceSpread',values:['near','distributed']}],qualityEvidence:['amaç doğrudan söylenmez','iki metin kanıtı gerekir'],goldExample:{id:'tr-author-purpose-gold-1'}}),
  createFamilyBlueprint({familyId:'science-data-claim',subjectId:'science',visibleCardId:'deney-laboratuvari',topicId:'scientific-method',learningOutcomeId:'evaluate-claim-from-data',title:'Veriden İddiaya',purpose:'Tablo veya gözlem verisinin hangi iddiayı desteklediğini sorgulatır.',thinkingModel:'Veri-iddia uygunluğu ve sınırlılık analizi',thinkingPatternIds:['DATA_INTERPRETATION','CLAIM_EVALUATION'],difficultyBand:[3,4,5],cognitiveDepth:4,scientificAccuracyRule:'Veriler tutarlı, ölçülebilir ve iddiayı aşmayacak biçimde yorumlanmalıdır.',contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['korelasyonu kesin neden sayma','verinin kapsamadığı gruba genelleme'],solutionStrategy:'Önce verinin doğrudan gösterdiğini belirle, sonra seçenekteki genellemenin sınırını kontrol et.',hintStrategy:['Tabloda ölçülmeyen bir şeyi kesin sonuç gibi kabul etme.','İddianın tüm verilerle uyumlu olup olmadığına bak.'],variantAxes:[{id:'domain',values:['temperature','plant-growth','electricity']},{id:'trend',values:['increase','decrease','plateau']},{id:'claimScope',values:['exact','overgeneralized','causal']}],qualityEvidence:['veriye bağlı tek doğru sonuç','aşırı genelleme çeldiricisi'],goldExample:{id:'science-data-claim-gold-1'}}),
  createFamilyBlueprint({familyId:'logic-order-chain',subjectId:'logic',visibleCardId:'kosul-agi',title:'Sıralama Zinciri',purpose:'Göreli sıralama koşullarından zorunlu konumu buldurur.',thinkingModel:'Kısmi sıralamaları birleştirip zorunlu sıra üretme',constraintModel:'En az beş varlık, dört göreli sıra koşulu ve tek zorunlu sonuç.',thinkingPatternIds:['ORDERING','TRANSITIVE_REASONING'],difficultyBand:[4,5],cognitiveDepth:5,contextPolicy:{required:true,mustAffectSolution:true},distractorStrategies:['yalnız komşu koşulu dikkate alma','olası sırayı zorunlu sıra sanma'],solutionStrategy:'Koşulları oklarla göster, geçişli ilişkileri birleştir ve boş konumları ele.',hintStrategy:['Önce kesin önce-sonra zincirini kur.','Doğrudan verilmeyen geçişli ilişkiyi çıkar.'],variantAxes:[{id:'entityCount',values:[5,6]},{id:'constraintDensity',values:['medium','high']},{id:'questionType',values:['must-before','position','cannot']}],qualityEvidence:['tek zorunlu sıra','en az üç adımlı çıkarım'],goldExample:{id:'logic-order-chain-gold-1'}}),
  createFamilyBlueprint({familyId:'olympiad-invariant',subjectId:'olympiad',visibleCardId:'olimpiyat-meydani',title:'Değişmezlik Avcısı',purpose:'İşlemler boyunca değişmeyen özelliği keşfettirir.',thinkingModel:'Örneklerden değişmez özellik türetme ve kanıtlama',multiStepRequirement:'En az iki başarısız deneme yolunu eleten bir değişmezlik gerekir.',thinkingPatternIds:['INVARIANT_REASONING','PROOF'],difficultyBand:[4,5],cognitiveDepth:5,contextPolicy:{required:false,mustAffectSolution:true},distractorStrategies:['küçük örneklerde doğru görünen genelleme','parite yerine büyüklüğe odaklanan sonuç'],solutionStrategy:'İşlem öncesi ve sonrası korunan niceliği karşılaştır; sonra tüm adımlara genelle.',hintStrategy:['Sayıların tek-çift durumunu izle.','Her işlemden sonra aynı kalan başka ne var?'],variantAxes:[{id:'invariant',values:['parity','remainder','coloring']},{id:'operation',values:['replace','move','pair']},{id:'proofDemand',values:['explain','counterexample','minimum']}],qualityEvidence:['kanıt gereksinimi','en az iki adımlı ipucu'],goldExample:{id:'olympiad-invariant-gold-1'}})
]);

export function getPremiumFamilies(subjectId=''){
  const key=subjectKeyOf(subjectId);
  return PREMIUM_FAMILY_CATALOG.filter(x=>x.subjectKey===key);
}

export function auditPremiumCatalog(catalog=PREMIUM_FAMILY_CATALOG){
  const results=catalog.map(blueprint=>({familyId:blueprint.familyId,subjectKey:blueprint.subjectKey,...auditFamilyBlueprint(blueprint)}));
  return {ok:results.every(x=>x.ok),total:results.length,gold:results.filter(x=>x.status==='GOLD').length,blocked:results.filter(x=>x.status==='BLOCKED').length,results};
}
