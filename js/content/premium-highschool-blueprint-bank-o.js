import { createPremiumBlueprintPack } from './premium-blueprint-core.js';
import {
  PREMIUM_DEEP_TRAITS,
  defineCandidatePremiumBlueprint,
  defineCriteriaPremiumBlueprint,
  defineNumericPremiumBlueprint,
  formatPremiumNumber
} from './premium-blueprint-templates.js';

const DEEP = PREMIUM_DEEP_TRAITS;

function positionMap(order) {
  return Object.fromEntries(order.map((name, index) => [name, index + 1]));
}

function validateOrderConstraints(variant, candidate) {
  const order = candidate.order;
  if (!Array.isArray(order) || new Set(order).size !== order.length) return false;
  const positions = positionMap(order);
  return variant.constraints.every((constraint) => {
    if (constraint.kind === 'before') return positions[constraint.a] < positions[constraint.b];
    if (constraint.kind === 'immediatelyBefore') return positions[constraint.b] - positions[constraint.a] === 1;
    if (constraint.kind === 'notPosition') return positions[constraint.person] !== constraint.position;
    if (constraint.kind === 'position') return positions[constraint.person] === constraint.position;
    if (constraint.kind === 'notAdjacent') return Math.abs(positions[constraint.a] - positions[constraint.b]) !== 1;
    return false;
  });
}

function validateMatchingConstraints(variant, candidate) {
  const mapping = candidate.mapping || {};
  if (new Set(Object.values(mapping)).size !== Object.keys(mapping).length) return false;
  return variant.constraints.every((constraint) => {
    if (constraint.kind === 'equals') return mapping[constraint.person] === constraint.item;
    if (constraint.kind === 'notEquals') return mapping[constraint.person] !== constraint.item;
    if (constraint.kind === 'different') return mapping[constraint.a] !== mapping[constraint.b];
    return false;
  });
}

function evaluateFormula(formula, assignment) {
  if (formula.kind === 'var') return Boolean(assignment[formula.name]);
  if (formula.kind === 'not') return !evaluateFormula(formula.value, assignment);
  if (formula.kind === 'and') return evaluateFormula(formula.left, assignment) && evaluateFormula(formula.right, assignment);
  if (formula.kind === 'or') return evaluateFormula(formula.left, assignment) || evaluateFormula(formula.right, assignment);
  if (formula.kind === 'implies') return !evaluateFormula(formula.left, assignment) || evaluateFormula(formula.right, assignment);
  throw new Error(`unknown formula kind: ${formula.kind}`);
}

function assignments(variables) {
  return Array.from({ length: 2 ** variables.length }, (_, mask) => Object.fromEntries(
    variables.map((name, index) => [name, Boolean(mask & (1 << index))])
  ));
}

function validateLogicalConclusion(variant, candidate) {
  const models = assignments(variant.variables)
    .filter((assignment) => variant.premises.every((premise) => evaluateFormula(premise, assignment)));
  return models.length > 0 && models.every((assignment) => evaluateFormula(candidate.formula, assignment));
}

function validateTruthCandidate(variant, candidate) {
  const culprit = candidate.culprit;
  const trueCount = variant.statements.filter((statement) => {
    if (statement.kind === 'is') return culprit === statement.person;
    if (statement.kind === 'isNot') return culprit !== statement.person;
    return false;
  }).length;
  return trueCount === variant.requiredTrueCount;
}

function subsetClosure(relations) {
  const nodes = [...new Set(relations.flatMap((entry) => [entry.from, entry.to]))];
  const closure = new Set(relations.map((entry) => `${entry.from}>${entry.to}`));
  for (const node of nodes) closure.add(`${node}>${node}`);
  let changed = true;
  while (changed) {
    changed = false;
    for (const a of nodes) for (const b of nodes) for (const c of nodes) {
      if (closure.has(`${a}>${b}`) && closure.has(`${b}>${c}`) && !closure.has(`${a}>${c}`)) {
        closure.add(`${a}>${c}`);
        changed = true;
      }
    }
  }
  return closure;
}

function validateSyllogismCandidate(variant, candidate) {
  const closure = subsetClosure(variant.subsets);
  const disjoint = new Set();
  for (const pair of variant.disjoint) {
    disjoint.add(`${pair.a}!${pair.b}`);
    disjoint.add(`${pair.b}!${pair.a}`);
  }
  let changed = true;
  const nodes = [...new Set([
    ...variant.subsets.flatMap((entry) => [entry.from, entry.to]),
    ...variant.disjoint.flatMap((entry) => [entry.a, entry.b])
  ])];
  while (changed) {
    changed = false;
    for (const x of nodes) for (const y of nodes) for (const z of nodes) {
      if (closure.has(`${x}>${y}`) && disjoint.has(`${y}!${z}`) && !disjoint.has(`${x}!${z}`)) {
        disjoint.add(`${x}!${z}`);
        disjoint.add(`${z}!${x}`);
        changed = true;
      }
    }
  }
  if (candidate.claim.kind === 'disjoint') return disjoint.has(`${candidate.claim.a}!${candidate.claim.b}`);
  if (candidate.claim.kind === 'subset') return closure.has(`${candidate.claim.a}>${candidate.claim.b}`);
  return false;
}

function validateRouteCandidate(variant, candidate) {
  const path = candidate.path;
  if (!Array.isArray(path) || path[0] !== variant.start || path.at(-1) !== variant.end) return false;
  const edgeSet = new Set(variant.edges.flatMap(([a, b]) => [`${a}>${b}`, `${b}>${a}`]));
  if (path.slice(0, -1).some((node, index) => !edgeSet.has(`${node}>${path[index + 1]}`))) return false;
  if (variant.mustVisit && !path.includes(variant.mustVisit)) return false;
  if (variant.avoid && path.includes(variant.avoid)) return false;
  return path.length - 1 <= variant.maxEdges;
}

function validateRankingCandidate(variant, candidate) {
  const expected = [...variant.records].sort((a, b) => {
    for (const rule of variant.sortRules) {
      const direction = rule.direction === 'asc' ? 1 : -1;
      const delta = (a[rule.field] - b[rule.field]) * direction;
      if (delta !== 0) return delta;
    }
    return a.name.localeCompare(b.name, 'tr-TR');
  }).map((entry) => entry.name);
  return candidate.order.join('|') === expected.join('|');
}

const LOGIC_BLUEPRINTS = [
  defineCandidatePremiumBlueprint({
    id: 'hs-logic-order-chain', gameId: 'logic-station', familyId: 'hs-logic-order-chain-family', skeletonId: 'hs-logic-order-chain:adjacency-and-order', subjectId: 'logic', topicId: 'ordering', learningOutcomeId: 'combine-adjacency-and-relative-order-constraints', solutionClass: 'constraint-ordering', extraTraits: ['constraintPropagation'],
    isValidCandidate: validateOrderConstraints,
    variants: [
      { id:'v1', context:'Aylin, Bora, Cem ve Deniz soldan sağa dört sandalyeye oturacaktır. Aylin, Bora’nın hemen solundadır. Cem, Deniz’in sağındadır. Bora son sandalyede değildir.', prompt:'Koşulları sağlayan oturma düzeni hangisidir?', explanation:'Aylin–Bora bloğu korunmalı, Deniz Cem’den önce gelmeli ve Bora dördüncü olmamalıdır.', evidence:['Aylin ile Bora bitişik ve doğru sıradadır.','Deniz, Cem’den önce yer alır.','Bora son sırada değildir.'], constraints:[{kind:'immediatelyBefore',a:'Aylin',b:'Bora'},{kind:'before',a:'Deniz',b:'Cem'},{kind:'notPosition',person:'Bora',position:4}], candidates:[
        {id:'a',text:'Aylin – Bora – Deniz – Cem',order:['Aylin','Bora','Deniz','Cem']},
        {id:'b',text:'Deniz – Cem – Aylin – Bora',order:['Deniz','Cem','Aylin','Bora'],misconceptionId:'ignore-last-position',why:'Bitişiklik ve göreli sıra sağlansa da Bora son sandalyeye yerleştirilir.',rule:'ignore-position-exclusion'},
        {id:'c',text:'Aylin – Bora – Cem – Deniz',order:['Aylin','Bora','Cem','Deniz'],misconceptionId:'reverse-relative-order',why:'Cem ile Deniz arasındaki sağ-sol koşulunu ters uygular.',rule:'reverse-relative-order'},
        {id:'d',text:'Bora – Aylin – Deniz – Cem',order:['Bora','Aylin','Deniz','Cem'],misconceptionId:'reverse-adjacent-pair',why:'Aylin–Bora bitişikliğini korur fakat yönünü ters çevirir.',rule:'reverse-adjacent-block'}
      ]},
      { id:'v2', context:'Ece, Fırat, Gökçe ve Hakan dört sunum sırasına yerleşecektir. Fırat, Gökçe’nin hemen önündedir. Hakan, Ece’nin hemen önündedir. Gökçe, Hakan’dan önce sunum yapar.', prompt:'Koşulları sağlayan sunum sırası hangisidir?', explanation:'Fırat–Gökçe ve Hakan–Ece blokları korunmalı; ilk blok ikinci bloktan önce gelmelidir.', evidence:['Fırat–Gökçe bitişik bloktur.','Hakan–Ece bitişik bloktur.','Gökçe, Hakan’dan önce yer alır.'], constraints:[{kind:'immediatelyBefore',a:'Fırat',b:'Gökçe'},{kind:'immediatelyBefore',a:'Hakan',b:'Ece'},{kind:'before',a:'Gökçe',b:'Hakan'}], candidates:[
        {id:'a',text:'Fırat – Gökçe – Hakan – Ece',order:['Fırat','Gökçe','Hakan','Ece']},
        {id:'b',text:'Hakan – Ece – Fırat – Gökçe',order:['Hakan','Ece','Fırat','Gökçe'],misconceptionId:'reverse-block-order',why:'İki bitişik bloğu korur ancak Gökçe’yi Hakan’dan sonra yerleştirir.',rule:'reverse-block-precedence'},
        {id:'c',text:'Fırat – Hakan – Gökçe – Ece',order:['Fırat','Hakan','Gökçe','Ece'],misconceptionId:'break-both-blocks',why:'İki zorunlu bitişik çiftin de arasına başka kişi yerleştirir.',rule:'break-adjacency-blocks'},
        {id:'d',text:'Gökçe – Fırat – Hakan – Ece',order:['Gökçe','Fırat','Hakan','Ece'],misconceptionId:'reverse-first-pair',why:'Hakan–Ece bloğunu korur fakat Fırat–Gökçe yönünü ters çevirir.',rule:'reverse-first-adjacent-pair'}
      ]}
    ]
  }),
  defineCandidatePremiumBlueprint({
    id: 'hs-logic-matching', gameId: 'logic-station', familyId: 'hs-logic-matching-family', skeletonId: 'hs-logic-matching:fixed-and-excluded-pairs', subjectId: 'logic', topicId: 'matching', learningOutcomeId: 'solve-one-to-one-matching-with-fixed-and-excluded-pairs', solutionClass: 'constraint-matching', extraTraits: ['relationalMapping'],
    isValidCandidate: validateMatchingConstraints,
    variants: [
      {id:'v1',context:'Ada, Berk, Can ve Duru; R, S, T ve U projelerinden birer tanesini alacaktır. Berk T’yi, Duru R’yi alır. Ada R’yi, Can U’yu alamaz.',prompt:'Koşulları sağlayan eşleştirme hangisidir?',explanation:'Berk ve Duru sabitlenince S ile U Ada ve Can’a kalır; Can U alamadığı için Can S, Ada U olur.',evidence:['Berk–T ve Duru–R sabittir.','Ada için R elenir.','Can U alamadığı için kalan S’yi alır.'],constraints:[{kind:'equals',person:'Berk',item:'T'},{kind:'equals',person:'Duru',item:'R'},{kind:'notEquals',person:'Ada',item:'R'},{kind:'notEquals',person:'Can',item:'U'}],candidates:[
        {id:'a',text:'Ada–U, Berk–T, Can–S, Duru–R',mapping:{Ada:'U',Berk:'T',Can:'S',Duru:'R'}},
        {id:'b',text:'Ada–S, Berk–T, Can–U, Duru–R',mapping:{Ada:'S',Berk:'T',Can:'U',Duru:'R'},misconceptionId:'ignore-can-exclusion',why:'Sabit eşleştirmeleri korur fakat Can’ı yasaklı U projesine verir.',rule:'ignore-one-exclusion'},
        {id:'c',text:'Ada–U, Berk–S, Can–T, Duru–R',mapping:{Ada:'U',Berk:'S',Can:'T',Duru:'R'},misconceptionId:'move-fixed-berk',why:'Berk için verilen T eşleştirmesini değiştirir.',rule:'override-fixed-match'},
        {id:'d',text:'Ada–R, Berk–T, Can–S, Duru–U',mapping:{Ada:'R',Berk:'T',Can:'S',Duru:'U'},misconceptionId:'swap-fixed-duru',why:'Ada’nın R yasağını ve Duru’nun sabit R eşleştirmesini birlikte bozar.',rule:'swap-fixed-and-forbidden'}
      ]},
      {id:'v2',context:'Eylül, Kerem, Mert ve Selin; K, L, M ve N laboratuvarlarından birine gidecektir. Kerem L’ye, Selin N’ye gider. Eylül K’ya, Mert M’ye gidemez.',prompt:'Koşulları sağlayan eşleştirme hangisidir?',explanation:'L ve N sabittir. K ile M Eylül ve Mert’e kalır; Eylül K’ya gidemediği için Eylül M, Mert K olur.',evidence:['Kerem–L ve Selin–N sabittir.','Eylül için K elenir.','Mert için M elendiğinden K’ya yerleşir.'],constraints:[{kind:'equals',person:'Kerem',item:'L'},{kind:'equals',person:'Selin',item:'N'},{kind:'notEquals',person:'Eylül',item:'K'},{kind:'notEquals',person:'Mert',item:'M'}],candidates:[
        {id:'a',text:'Eylül–M, Kerem–L, Mert–K, Selin–N',mapping:{Eylül:'M',Kerem:'L',Mert:'K',Selin:'N'}},
        {id:'b',text:'Eylül–K, Kerem–L, Mert–M, Selin–N',mapping:{Eylül:'K',Kerem:'L',Mert:'M',Selin:'N'},misconceptionId:'ignore-two-exclusions',why:'Sabitleri korur ancak Eylül ve Mert’in iki yasak eşleştirmesini de kullanır.',rule:'ignore-excluded-pairs'},
        {id:'c',text:'Eylül–M, Kerem–K, Mert–L, Selin–N',mapping:{Eylül:'M',Kerem:'K',Mert:'L',Selin:'N'},misconceptionId:'move-fixed-kerem',why:'Kerem’in sabit L laboratuvarını Mert’e verir.',rule:'override-fixed-laboratory'},
        {id:'d',text:'Eylül–N, Kerem–L, Mert–K, Selin–M',mapping:{Eylül:'N',Kerem:'L',Mert:'K',Selin:'M'},misconceptionId:'move-fixed-selin',why:'Selin için verilen N eşleştirmesini değiştirir.',rule:'override-second-fixed-match'}
      ]}
    ]
  }),
  defineCandidatePremiumBlueprint({
    id:'hs-logic-schedule',gameId:'logic-station',familyId:'hs-logic-schedule-family',skeletonId:'hs-logic-schedule:fixed-day-and-nonadjacency',subjectId:'logic',topicId:'scheduling',learningOutcomeId:'combine-fixed-position-and-nonadjacency-constraints',solutionClass:'schedule-constraint-satisfaction',extraTraits:['temporalReasoning'],isValidCandidate:validateOrderConstraints,
    variants:[
      {id:'v1',context:'Kodlama, müzik, resim ve spor etkinlikleri pazartesiden perşembeye birer gün yapılacaktır. Müzik salıdır. Kodlama resimden önce yapılır. Spor ile resim art arda değildir.',prompt:'Koşulları sağlayan program hangisidir?',explanation:'Müzik ikinci gündür; kodlama resimden önce olmalı ve spor resimle komşu olmamalıdır.',evidence:['Müzik ikinci sıraya sabitlenir.','Kodlama resimden önce yer alır.','Spor ile resim arasında en az bir gün bulunur.'],constraints:[{kind:'position',person:'Müzik',position:2},{kind:'before',a:'Kodlama',b:'Resim'},{kind:'notAdjacent',a:'Spor',b:'Resim'}],candidates:[
        {id:'a',text:'Kodlama – Müzik – Spor – Resim',order:['Kodlama','Müzik','Spor','Resim'],misconceptionId:'ignore-nonadjacency',why:'Müzik ve sıra koşulu sağlanır; spor ile resim art arda gelir.',rule:'ignore-nonadjacency'},
        {id:'b',text:'Spor – Müzik – Kodlama – Resim',order:['Spor','Müzik','Kodlama','Resim']},
        {id:'c',text:'Resim – Müzik – Spor – Kodlama',order:['Resim','Müzik','Spor','Kodlama'],misconceptionId:'reverse-before',why:'Kodlama etkinliğini resimden sonraya yerleştirir.',rule:'reverse-precedence'},
        {id:'d',text:'Kodlama – Spor – Müzik – Resim',order:['Kodlama','Spor','Müzik','Resim'],misconceptionId:'move-fixed-day',why:'Müzik etkinliğini salı gününden çarşambaya taşır.',rule:'ignore-fixed-day'}
      ]},
      {id:'v2',context:'Deney, gezi, münazara ve sunum etkinlikleri dört ders saatine yerleşecektir. Gezi üçüncü saattedir. Deney sunumdan önce yapılır. Münazara ile deney art arda değildir.',prompt:'Koşulları sağlayan program hangisidir?',explanation:'Gezi üçüncü sıraya sabitlenir; deney sunumdan önce ve münazaradan ayrı olmalıdır.',evidence:['Gezi üçüncü sıradadır.','Deney sunumdan önce gelir.','Münazara deneyle komşu değildir.'],constraints:[{kind:'position',person:'Gezi',position:3},{kind:'before',a:'Deney',b:'Sunum'},{kind:'notAdjacent',a:'Münazara',b:'Deney'}],candidates:[
        {id:'a',text:'Deney – Münazara – Gezi – Sunum',order:['Deney','Münazara','Gezi','Sunum'],misconceptionId:'ignore-separation',why:'Gezi ve önce-sonra koşulu sağlanır; deney ile münazara bitişiktir.',rule:'ignore-nonadjacent-events'},
        {id:'b',text:'Münazara – Deney – Gezi – Sunum',order:['Münazara','Deney','Gezi','Sunum'],misconceptionId:'reverse-separation-side',why:'Münazara ile deney yine art arda yerleştirilir.',rule:'retain-forbidden-adjacency'},
        {id:'c',text:'Deney – Sunum – Gezi – Münazara',order:['Deney','Sunum','Gezi','Münazara']},
        {id:'d',text:'Sunum – Münazara – Gezi – Deney',order:['Sunum','Münazara','Gezi','Deney'],misconceptionId:'reverse-presentation-order',why:'Deneyi sunumdan sonraya yerleştirir.',rule:'reverse-required-order'}
      ]}
    ]
  }),
  defineCandidatePremiumBlueprint({
    id:'hs-logic-implication',gameId:'logic-station',familyId:'hs-logic-implication-family',skeletonId:'hs-logic-implication:truth-model-entailment',subjectId:'logic',topicId:'conditional-reasoning',learningOutcomeId:'derive-necessary-conclusion-from-conditional-premises',solutionClass:'propositional-entailment',extraTraits:['formalLogic'],isValidCandidate:validateLogicalConclusion,
    variants:[
      {id:'v1',context:'P doğruysa Q doğrudur. Q doğruysa R doğrudur. P doğrudur.',prompt:'Bu bilgilerden zorunlu olarak hangisi çıkar?',explanation:'P, Q’yu; Q da R’yi gerektirir. P doğru olduğundan R de zorunlu olarak doğrudur.',evidence:['P→Q ve P birlikte Q’yu verir.','Q→R ve Q birlikte R’yi verir.','Sonuç zincirleme çıkarımdır.'],variables:['P','Q','R'],premises:[{kind:'implies',left:{kind:'var',name:'P'},right:{kind:'var',name:'Q'}},{kind:'implies',left:{kind:'var',name:'Q'},right:{kind:'var',name:'R'}},{kind:'var',name:'P'}],candidates:[
        {id:'a',text:'R doğrudur.',formula:{kind:'var',name:'R'}},
        {id:'b',text:'R yanlıştır.',formula:{kind:'not',value:{kind:'var',name:'R'}},misconceptionId:'reverse-chain-result',why:'Koşullu zincirin ulaştığı sonucu tersine çevirir.',rule:'negate-entailed-conclusion'},
        {id:'c',text:'P yanlıştır.',formula:{kind:'not',value:{kind:'var',name:'P'}},misconceptionId:'deny-given-premise',why:'Doğru olduğu açıkça verilen P önermesini reddeder.',rule:'negate-explicit-premise'},
        {id:'d',text:'Q ve R yanlıştır.',formula:{kind:'and',left:{kind:'not',value:{kind:'var',name:'Q'}},right:{kind:'not',value:{kind:'var',name:'R'}}},misconceptionId:'ignore-both-implications',why:'P’nin iki koşullu önermeyi tetiklemesini yok sayar.',rule:'ignore-conditional-chain'}
      ]},
      {id:'v2',context:'K doğruysa L yanlıştır. L yanlışsa M doğrudur. K doğrudur.',prompt:'Bu bilgilerden zorunlu olarak hangisi çıkar?',explanation:'K doğru olduğunda L yanlış olur; L’nin yanlışlığı da M’nin doğruluğunu gerektirir.',evidence:['K→¬L uygulanır.','¬L→M uygulanır.','M zorunlu doğru olur.'],variables:['K','L','M'],premises:[{kind:'implies',left:{kind:'var',name:'K'},right:{kind:'not',value:{kind:'var',name:'L'}}},{kind:'implies',left:{kind:'not',value:{kind:'var',name:'L'}},right:{kind:'var',name:'M'}},{kind:'var',name:'K'}],candidates:[
        {id:'a',text:'M doğrudur.',formula:{kind:'var',name:'M'}},
        {id:'b',text:'L doğrudur.',formula:{kind:'var',name:'L'},misconceptionId:'ignore-negated-consequent',why:'K’nın L’yi yanlış yapması koşulunu ters okur.',rule:'reverse-negated-consequent'},
        {id:'c',text:'K yanlıştır.',formula:{kind:'not',value:{kind:'var',name:'K'}},misconceptionId:'deny-explicit-k',why:'Doğru olduğu verilen K önermesini reddeder.',rule:'negate-given-fact'},
        {id:'d',text:'M yanlıştır.',formula:{kind:'not',value:{kind:'var',name:'M'}},misconceptionId:'stop-before-second-rule',why:'İlk çıkarımdan sonra ikinci koşullu önermeyi uygulamaz.',rule:'omit-second-implication'}
      ]}
    ]
  }),
  defineCandidatePremiumBlueprint({
    id:'hs-logic-truth-statements',gameId:'logic-station',familyId:'hs-logic-truth-family',skeletonId:'hs-logic-truth:count-true-statements',subjectId:'logic',topicId:'truth-statements',learningOutcomeId:'identify-case-that-satisfies-exact-truth-count',solutionClass:'truth-count-consistency',extraTraits:['counterfactualTesting'],isValidCandidate:validateTruthCandidate,
    variants:[
      {id:'v1',context:'Dosyayı Aylin, Bora, Cem veya Deniz’den biri silmiştir. Aylin “Bora sildi.”, Bora “Deniz silmedi.”, Cem “Cem sildi.”, Deniz “Bora silmedi.” diyor. Yalnız bir ifade doğrudur.',prompt:'Dosyayı kim silmiştir?',explanation:'Her aday için dört ifade sınanır. Yalnız Deniz suçlu olduğunda tam bir ifade doğru olur.',evidence:['Adaylar tek tek yerine konur.','Her adayda doğru ifade sayısı hesaplanır.','Deniz durumunda yalnız “Bora silmedi” ifadesi doğrudur.'],requiredTrueCount:1,statements:[{kind:'is',person:'Bora'},{kind:'isNot',person:'Deniz'},{kind:'is',person:'Cem'},{kind:'isNot',person:'Bora'}],candidates:[
        {id:'a',text:'Aylin',culprit:'Aylin',misconceptionId:'count-two-as-one',why:'Aylin durumunda iki olumsuz ifade doğru olduğu hâlde tek doğru sanılır.',rule:'miscount-true-statements'},
        {id:'b',text:'Bora',culprit:'Bora',misconceptionId:'ignore-positive-statement',why:'Bora durumunda hem Aylin’in hem Bora’nın ifadesi doğru olur.',rule:'ignore-one-true-statement'},
        {id:'c',text:'Cem',culprit:'Cem',misconceptionId:'count-three-as-one',why:'Cem durumunda üç ifade doğru olduğu için koşul sağlanmaz.',rule:'ignore-multiple-true-statements'},
        {id:'d',text:'Deniz',culprit:'Deniz'}
      ]},
      {id:'v2',context:'Anahtarı Ece, Fırat, Gül veya Hakan’dan biri almıştır. Ece “Fırat aldı.”, Fırat “Gül almadı.”, Gül “Hakan aldı.”, Hakan “Fırat almadı.” diyor. Yalnız bir ifade doğrudur.',prompt:'Anahtarı kim almıştır?',explanation:'Dört olasılıkta ifadeler değerlendirilir. Yalnız Gül seçildiğinde tam bir ifade doğru kalır.',evidence:['Her aday için dört ifade değerlendirilir.','Doğru ifade sayısı bire eşit olmalıdır.','Gül durumunda yalnız Hakan’ın “Fırat almadı” ifadesi doğrudur.'],requiredTrueCount:1,statements:[{kind:'is',person:'Fırat'},{kind:'isNot',person:'Gül'},{kind:'is',person:'Hakan'},{kind:'isNot',person:'Fırat'}],candidates:[
        {id:'a',text:'Ece',culprit:'Ece',misconceptionId:'accept-two-truths',why:'Ece durumunda iki olumsuz ifade doğru olur.',rule:'accept-wrong-truth-count'},
        {id:'b',text:'Fırat',culprit:'Fırat',misconceptionId:'ignore-first-and-second',why:'Fırat durumunda birden çok ifade doğru olur.',rule:'omit-true-statements'},
        {id:'c',text:'Gül',culprit:'Gül'},
        {id:'d',text:'Hakan',culprit:'Hakan',misconceptionId:'accept-three-truths',why:'Hakan durumunda üç ifade doğru olur.',rule:'accept-excess-true-statements'}
      ]}
    ]
  }),
  defineCandidatePremiumBlueprint({
    id:'hs-logic-syllogism',gameId:'logic-station',familyId:'hs-logic-syllogism-family',skeletonId:'hs-logic-syllogism:subset-disjoint-closure',subjectId:'logic',topicId:'set-relations',learningOutcomeId:'derive-set-conclusion-through-subset-and-disjoint-relations',solutionClass:'syllogistic-closure',extraTraits:['setReasoning'],isValidCandidate:validateSyllogismCandidate,
    variants:[
      {id:'v1',context:'Bütün mercanlar deniz canlısıdır. Hiçbir deniz canlısı kara bitkisi değildir.',prompt:'Bu bilgilerden zorunlu olarak hangisi çıkar?',explanation:'Mercanlar deniz canlıları kümesinin alt kümesidir; deniz canlıları kara bitkilerinden ayrık olduğundan mercanlar da kara bitkilerinden ayrıdır.',evidence:['Mercan ⊆ deniz canlısı.','Deniz canlısı ile kara bitkisi ayrık.','Alt küme ayrıklığı mercanlara taşır.'],subsets:[{from:'mercan',to:'deniz'}],disjoint:[{a:'deniz',b:'karaBitkisi'}],candidates:[
        {id:'a',text:'Hiçbir mercan kara bitkisi değildir.',claim:{kind:'disjoint',a:'mercan',b:'karaBitkisi'}},
        {id:'b',text:'Bütün deniz canlıları mercandır.',claim:{kind:'subset',a:'deniz',b:'mercan'},misconceptionId:'reverse-subset',why:'Mercanların deniz canlısı olmasını tersine çevirir.',rule:'reverse-subset-relation'},
        {id:'c',text:'Bütün kara bitkileri mercandır.',claim:{kind:'subset',a:'karaBitkisi',b:'mercan'},misconceptionId:'bridge-disjoint-as-subset',why:'Ayrık kümeler arasında alt küme ilişkisi kurar.',rule:'turn-disjointness-into-subset'},
        {id:'d',text:'Bütün mercanlar kara bitkisidir.',claim:{kind:'subset',a:'mercan',b:'karaBitkisi'},misconceptionId:'ignore-disjointness',why:'Ayrıklık bilgisinin tam tersini sonuç yapar.',rule:'ignore-disjoint-relation'}
      ]},
      {id:'v2',context:'Bütün arşiv belgeleri kayıtlı evraktır. Hiçbir kayıtlı evrak sözlü anlatım değildir.',prompt:'Bu bilgilerden zorunlu olarak hangisi çıkar?',explanation:'Arşiv belgeleri kayıtlı evrakların alt kümesidir; kayıtlı evraklar sözlü anlatımlardan ayrık olduğundan arşiv belgeleri de sözlü anlatım değildir.',evidence:['Arşiv belgesi ⊆ kayıtlı evrak.','Kayıtlı evrak ile sözlü anlatım ayrık.','Ayrıklık alt kümeye aktarılır.'],subsets:[{from:'arsiv',to:'kayitli'}],disjoint:[{a:'kayitli',b:'sozlu'}],candidates:[
        {id:'a',text:'Hiçbir arşiv belgesi sözlü anlatım değildir.',claim:{kind:'disjoint',a:'arsiv',b:'sozlu'}},
        {id:'b',text:'Bütün kayıtlı evraklar arşiv belgesidir.',claim:{kind:'subset',a:'kayitli',b:'arsiv'},misconceptionId:'reverse-document-subset',why:'Alt küme yönünü kayıtlı evraktan arşive çevirir.',rule:'reverse-subset-direction'},
        {id:'c',text:'Bütün sözlü anlatımlar kayıtlı evraktır.',claim:{kind:'subset',a:'sozlu',b:'kayitli'},misconceptionId:'convert-disjoint-to-inclusion',why:'Ayrık kümeleri kapsama ilişkisi gibi yorumlar.',rule:'convert-disjoint-to-subset'},
        {id:'d',text:'Bütün arşiv belgeleri sözlü anlatımdır.',claim:{kind:'subset',a:'arsiv',b:'sozlu'},misconceptionId:'negate-disjoint-conclusion',why:'Zorunlu ayrıklığın karşıtını seçer.',rule:'negate-derived-disjointness'}
      ]}
    ]
  }),
  defineCandidatePremiumBlueprint({
    id:'hs-logic-route',gameId:'logic-station',familyId:'hs-logic-route-family',skeletonId:'hs-logic-route:graph-path-with-constraints',subjectId:'logic',topicId:'graph-paths',learningOutcomeId:'select-valid-path-under-visit-avoid-and-length-constraints',solutionClass:'constrained-graph-path',extraTraits:['spatialPlanning'],isValidCandidate:validateRouteCandidate,
    variants:[
      {id:'v1',context:'A, B, C, D ve E noktaları arasında A–B, A–C, B–D, C–D, C–E ve D–E yolları vardır. A’dan E’ye giderken C’den geçilmeli, B’ye uğranmamalı ve en fazla üç yol kullanılmalıdır.',prompt:'Koşulları sağlayan rota hangisidir?',explanation:'Rota mevcut kenarları izlemeli, C’yi içermeli, B’yi dışarıda bırakmalı ve üç kenarı aşmamalıdır.',evidence:['A–C ve C–E yolları vardır.','Rota C’den geçer ve B’yi içermez.','İki kenar kullanıldığı için sınır içindedir.'],start:'A',end:'E',mustVisit:'C',avoid:'B',maxEdges:3,edges:[['A','B'],['A','C'],['B','D'],['C','D'],['C','E'],['D','E']],candidates:[
        {id:'a',text:'A – C – E',path:['A','C','E']},
        {id:'b',text:'A – B – D – E',path:['A','B','D','E'],misconceptionId:'ignore-must-visit',why:'Geçerli yolları kullanır ancak C zorunluluğunu ve B yasağını bozar.',rule:'ignore-visit-and-avoid'},
        {id:'c',text:'A – C – B – D – E',path:['A','C','B','D','E'],misconceptionId:'invent-edge-and-exceed',why:'C–B yolu bulunmadığı gibi üç yol sınırı da aşılır.',rule:'use-nonexistent-edge'},
        {id:'d',text:'A – C – D – B – D – E',path:['A','C','D','B','D','E'],misconceptionId:'include-forbidden-node',why:'Mevcut bazı yolları izlese de B’ye uğrar ve yol sınırını aşar.',rule:'visit-forbidden-and-loop'}
      ]},
      {id:'v2',context:'K, L, M, N ve P noktaları arasında K–L, K–M, L–N, M–N, M–P ve N–P yolları vardır. K’dan P’ye giderken N’den geçilmeli, L’ye uğranmamalı ve en fazla üç yol kullanılmalıdır.',prompt:'Koşulları sağlayan rota hangisidir?',explanation:'K–M–N–P rotası bütün kenarları kullanır, N’den geçer, L’yi dışarıda bırakır ve üç yol kullanır.',evidence:['K–M, M–N ve N–P yolları vardır.','N zorunluluğu sağlanır; L kullanılmaz.','Toplam üç kenar vardır.'],start:'K',end:'P',mustVisit:'N',avoid:'L',maxEdges:3,edges:[['K','L'],['K','M'],['L','N'],['M','N'],['M','P'],['N','P']],candidates:[
        {id:'a',text:'K – M – N – P',path:['K','M','N','P']},
        {id:'b',text:'K – M – P',path:['K','M','P'],misconceptionId:'skip-required-node',why:'Kısa ve geçerli bir yol seçer fakat N’den geçme koşulunu atlar.',rule:'skip-mandatory-node'},
        {id:'c',text:'K – L – N – P',path:['K','L','N','P'],misconceptionId:'use-forbidden-node',why:'N’den geçer ancak yasaklı L noktasına uğrar.',rule:'include-forbidden-node'},
        {id:'d',text:'K – M – L – N – P',path:['K','M','L','N','P'],misconceptionId:'invent-link-and-exceed',why:'M–L yolu yoktur ve rota üç yol sınırını aşar.',rule:'invent-edge-and-exceed-limit'}
      ]}
    ]
  }),
  defineCandidatePremiumBlueprint({
    id:'hs-logic-ranking',gameId:'logic-station',familyId:'hs-logic-ranking-family',skeletonId:'hs-logic-ranking:multi-criterion-sort',subjectId:'logic',topicId:'data-ranking',learningOutcomeId:'rank-records-using-primary-and-secondary-criteria',solutionClass:'multi-criterion-ranking',extraTraits:['dataReasoning'],isValidCandidate:validateRankingCandidate,
    variants:[
      {id:'v1',context:'Dört takım puana göre yüksekten düşüğe sıralanacaktır. Puanlar eşitse hata sayısı az olan öne geçer: Atlas 18 puan 3 hata, Bora 21 puan 5 hata, Ceylan 18 puan 2 hata, Doruk 16 puan 1 hata.',prompt:'Doğru sıralama hangisidir?',explanation:'Önce puanlar azalan sıralanır; 18 puanlı iki takım arasında daha az hatalı Ceylan öne geçer.',evidence:['Bora 21 puanla birincidir.','Ceylan ve Atlas 18 puanda eşittir.','Ceylan 2 hatayla Atlas’ın önündedir.'],records:[{name:'Atlas',score:18,error:3},{name:'Bora',score:21,error:5},{name:'Ceylan',score:18,error:2},{name:'Doruk',score:16,error:1}],sortRules:[{field:'score',direction:'desc'},{field:'error',direction:'asc'}],candidates:[
        {id:'a',text:'Bora – Ceylan – Atlas – Doruk',order:['Bora','Ceylan','Atlas','Doruk']},
        {id:'b',text:'Bora – Atlas – Ceylan – Doruk',order:['Bora','Atlas','Ceylan','Doruk'],misconceptionId:'reverse-tiebreak',why:'Puan eşitliğinde az hata yerine fazla hatayı öne alır.',rule:'reverse-secondary-sort'},
        {id:'c',text:'Ceylan – Atlas – Bora – Doruk',order:['Ceylan','Atlas','Bora','Doruk'],misconceptionId:'prioritize-error-over-score',why:'Hata sayısını puandan önce uygulayarak 21 puanlı takımı geriye iter.',rule:'swap-primary-secondary-criteria'},
        {id:'d',text:'Doruk – Ceylan – Atlas – Bora',order:['Doruk','Ceylan','Atlas','Bora'],misconceptionId:'sort-score-ascending',why:'Puanları yüksekten düşüğe değil düşükten yükseğe sıralar.',rule:'reverse-primary-sort'}
      ]},
      {id:'v2',context:'Dört proje başarı puanına göre yüksekten düşüğe sıralanacaktır. Puanlar eşitse tamamlama süresi kısa olan öne geçer: K 84 puan 12 gün, L 91 puan 15 gün, M 84 puan 10 gün, N 78 puan 8 gün.',prompt:'Doğru sıralama hangisidir?',explanation:'L 91 puanla öndedir; 84 puanlı M, 10 günlük süresiyle K’nın önüne geçer.',evidence:['L en yüksek puana sahiptir.','K ve M 84 puanda eşittir.','M daha kısa sürede tamamlanmıştır.'],records:[{name:'K',score:84,time:12},{name:'L',score:91,time:15},{name:'M',score:84,time:10},{name:'N',score:78,time:8}],sortRules:[{field:'score',direction:'desc'},{field:'time',direction:'asc'}],candidates:[
        {id:'a',text:'L – M – K – N',order:['L','M','K','N']},
        {id:'b',text:'L – K – M – N',order:['L','K','M','N'],misconceptionId:'reverse-time-tiebreak',why:'Eşit puanda kısa süre yerine uzun süreyi öne alır.',rule:'reverse-time-tiebreak'},
        {id:'c',text:'N – M – K – L',order:['N','M','K','L'],misconceptionId:'sort-by-time-only',why:'Başarı puanı yerine yalnız tamamlama süresini sıralama ölçütü yapar.',rule:'ignore-primary-score'},
        {id:'d',text:'M – K – L – N',order:['M','K','L','N'],misconceptionId:'resolve-tie-before-primary',why:'Eşit puanlı projeleri en yüksek puanlı L’nin önüne yerleştirir.',rule:'apply-secondary-before-primary'}
      ]}
    ]
  })
];

const PROBLEM_BLUEPRINTS = [
  defineNumericPremiumBlueprint({
    id:'hs-problem-mixture',gameId:'problem-hunter',familyId:'hs-problem-mixture-family',skeletonId:'hs-problem-mixture:solute-balance',reasoningPathId:'model-solute-balance-solve-check',subjectId:'mathematics',topicId:'mixtures',learningOutcomeId:'solve-mixture-concentration-by-conservation',solutionClass:'mixture-balance',extraTraits:['algebraicModeling'],cognitiveTraits:[...DEEP,'algebraicModeling'],
    variants:[{id:'v1',initialVolume:20,initialRate:0.30,addedRate:0.50,targetRate:0.40},{id:'v2',initialVolume:30,initialRate:0.20,addedRate:0.50,targetRate:0.35}],
    render:(v)=>({context:`${v.initialVolume} litre, %${v.initialRate*100} derişimli çözeltiye %${v.addedRate*100} derişimli çözeltiden eklenecektir.`,prompt:`Karışımın derişiminin %${v.targetRate*100} olması için kaç litre çözelti eklenmelidir?`,hints:['Çözünen madde miktarlarını eşitle.','Son hacmin başlangıç ve eklenen hacim toplamı olduğunu unutma.']}),
    solve:(v)=>(v.targetRate*v.initialVolume-v.initialRate*v.initialVolume)/(v.addedRate-v.targetRate),
    verify:(v,x)=>Math.abs((v.initialRate*v.initialVolume+v.addedRate*Number(x))-v.targetRate*(v.initialVolume+Number(x)))<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} litre`,
    wrongValues:(v,correct)=>[
      {id:'average-rates',value:v.initialVolume/2,why:'Derişim oranlarını hacim dengesinden bağımsız ortalayıp eklenecek miktarı keyfî biçimde başlangıç hacminin yarısı alır.',rule:'average-concentrations-without-balance'},
      {id:'difference-only',value:(v.targetRate-v.initialRate)*v.initialVolume,why:'Derişim farkını hacimle çarpar ancak eklenen çözeltinin kendi derişimini hesaba katmaz.',rule:'use-target-gap-as-volume'},
      {id:'add-initial-volume',value:correct+v.initialVolume,why:'Denklemden bulunan ek hacme başlangıç hacmini bir kez daha ekler.',rule:'report-final-volume-as-added-volume'}
    ],
    explanation:(v,x)=>`Çözünen madde dengesi ${v.initialRate}·${v.initialVolume}+${v.addedRate}·x=${v.targetRate}·(${v.initialVolume}+x) biçimindedir. Denklem çözülünce x=${formatPremiumNumber(x)} litre bulunur.`,
    evidence:(v,x)=>[`Başlangıç çözünen miktarı ${formatPremiumNumber(v.initialRate*v.initialVolume)} litredir.`,`Eklenen çözünen miktarı ${v.addedRate}x olur.`,`Denge denklemi çözülerek ${formatPremiumNumber(x)} litre bulunur.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-problem-work-rate',gameId:'problem-hunter',familyId:'hs-problem-work-rate-family',skeletonId:'hs-problem-work-rate:add-unit-rates',reasoningPathId:'convert-to-unit-rates-add-invert',subjectId:'mathematics',topicId:'work-rate',learningOutcomeId:'combine-two-work-rates',solutionClass:'combined-work-rate',cognitiveTraits:[...DEEP,'rateReasoning'],
    variants:[{id:'v1',aDays:12,bDays:18},{id:'v2',aDays:10,bDays:15}],
    render:(v)=>({context:`Aynı işi birinci ekip tek başına ${v.aDays} günde, ikinci ekip ${v.bDays} günde tamamlıyor.`,prompt:'İki ekip birlikte çalışırsa iş kaç günde biter?',hints:['Her ekibin bir günde yaptığı iş oranını bul.','Oranları toplayıp tersini al.']}),
    solve:(v)=>1/(1/v.aDays+1/v.bDays),
    verify:(v,x)=>Math.abs(Number(x)*(1/v.aDays+1/v.bDays)-1)<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} gün`,
    wrongValues:(v)=>[
      {id:'average-days',value:(v.aDays+v.bDays)/2,why:'İş bitirme sürelerini hız gibi doğrudan ortalar.',rule:'average-completion-times'},
      {id:'sum-days',value:v.aDays+v.bDays,why:'Birlikte çalışmayı süreleri toplamak olarak yorumlar.',rule:'add-completion-times'},
      {id:'difference-days',value:Math.abs(v.bDays-v.aDays),why:'Hızların birleşimini sürelerin farkı sanır.',rule:'subtract-completion-times'}
    ],
    explanation:(v,x)=>`Günlük iş oranı 1/${v.aDays}+1/${v.bDays} olur. Bu toplamın tersi ${formatPremiumNumber(x)} gündür.`,
    evidence:(v,x)=>[`Birinci ekip günde işin 1/${v.aDays}'sini yapar.`,`İkinci ekip günde işin 1/${v.bDays}'sini yapar.`,`Toplam hızın tersi ${formatPremiumNumber(x)} gündür.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-problem-catch-up',gameId:'problem-hunter',familyId:'hs-problem-catch-up-family',skeletonId:'hs-problem-catch-up:lead-distance-relative-speed',reasoningPathId:'compute-lead-use-relative-speed-check',subjectId:'mathematics',topicId:'relative-motion',learningOutcomeId:'solve-catch-up-problem-with-delayed-start',solutionClass:'relative-speed-catch-up',cognitiveTraits:[...DEEP,'relativeMotion'],
    variants:[{id:'v1',leadSpeed:60,chaserSpeed:90,delay:1.5},{id:'v2',leadSpeed:50,chaserSpeed:75,delay:2}],
    render:(v)=>({context:`Bir araç saatte ${v.leadSpeed} km hızla yola çıkıyor. ${formatPremiumNumber(v.delay)} saat sonra aynı noktadan saatte ${v.chaserSpeed} km hızla ikinci araç hareket ediyor.`,prompt:'İkinci araç hareket ettikten kaç saat sonra birinci araca yetişir?',hints:['İlk aracın başlangıç avantajını bul.','Hız farkını bağıl hız olarak kullan.']}),
    solve:(v)=>v.leadSpeed*v.delay/(v.chaserSpeed-v.leadSpeed),
    verify:(v,t)=>Math.abs(v.chaserSpeed*Number(t)-v.leadSpeed*(Number(t)+v.delay))<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} saat`,
    wrongValues:(v,correct)=>[
      {id:'divide-by-chaser',value:v.leadSpeed*v.delay/v.chaserSpeed,why:'Başlangıç mesafesini bağıl hıza değil ikinci aracın hızına böler.',rule:'use-chaser-speed-instead-of-relative-speed'},
      {id:'divide-by-speed-sum',value:v.leadSpeed*v.delay/(v.chaserSpeed+v.leadSpeed),why:'Aynı yöndeki araçlarda hız farkı yerine hız toplamını kullanır.',rule:'add-speeds-for-same-direction'},
      {id:'add-delay-again',value:correct+v.delay,why:'Sorulan süre ikinci aracın hareketinden sonrası olduğu hâlde gecikmeyi yeniden ekler.',rule:'report-time-from-first-departure'}
    ],
    explanation:(v,t)=>`İlk araç ${formatPremiumNumber(v.delay)} saatte ${formatPremiumNumber(v.leadSpeed*v.delay)} km öne geçer. Bağıl hız ${v.chaserSpeed-v.leadSpeed} km/sa olduğundan yetişme süresi ${formatPremiumNumber(t)} saattir.`,
    evidence:(v,t)=>[`Başlangıç farkı ${formatPremiumNumber(v.leadSpeed*v.delay)} km'dir.`,`Bağıl hız ${v.chaserSpeed-v.leadSpeed} km/saattir.`,`Mesafe bağıl hıza bölünerek ${formatPremiumNumber(t)} saat bulunur.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-problem-area-scale',gameId:'problem-hunter',familyId:'hs-problem-area-scale-family',skeletonId:'hs-problem-area-scale:square-linear-ratio',reasoningPathId:'find-linear-scale-square-apply',subjectId:'mathematics',topicId:'similarity',learningOutcomeId:'apply-square-of-linear-scale-to-area',solutionClass:'area-scale-factor',cognitiveTraits:[...DEEP,'geometricScaling'],
    variants:[{id:'v1',area:72,oldSide:2,newSide:3},{id:'v2',area:81,oldSide:3,newSide:4}],
    render:(v)=>({context:`Benzer iki şeklin karşılık gelen kenar uzunlukları ${v.oldSide}:${v.newSide} oranındadır. Küçük şeklin alanı ${v.area} cm²’dir.`,prompt:'Büyük şeklin alanı kaç cm²’dir?',hints:['Önce uzunluk ölçek katsayısını bul.','Alanların ölçek katsayının karesiyle değiştiğini kullan.']}),
    solve:(v)=>v.area*(v.newSide/v.oldSide)**2,
    verify:(v,x)=>Math.abs(Number(x)-v.area*(v.newSide/v.oldSide)**2)<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} cm²`,
    wrongValues:(v)=>[
      {id:'linear-area-scale',value:v.area*(v.newSide/v.oldSide),why:'Alanı uzunluk gibi yalnız bir kez ölçek katsayısıyla çarpar.',rule:'apply-linear-scale-to-area'},
      {id:'add-side-difference',value:v.area+(v.newSide-v.oldSide)**2,why:'Kenar farkının karesini alana ekleyerek benzerlik oranını kullanmaz.',rule:'add-square-of-side-difference'},
      {id:'add-one-to-scale',value:v.area*((v.newSide/v.oldSide)+1),why:'Ölçek katsayısının karesi yerine katsayıya bir ekler.',rule:'replace-square-with-plus-one'}
    ],
    explanation:(v,x)=>`Uzunluk ölçeği ${v.newSide}/${v.oldSide}'dir. Alan ölçeği bunun karesi olduğundan ${v.area}·(${v.newSide}/${v.oldSide})²=${formatPremiumNumber(x)} cm² bulunur.`,
    evidence:(v,x)=>[`Uzunluk ölçeği ${formatPremiumNumber(v.newSide/v.oldSide)}'dir.`,`Alan ölçeği ${formatPremiumNumber((v.newSide/v.oldSide)**2)} olur.`,`Alan ${formatPremiumNumber(x)} cm²'ye çıkar.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-problem-combination',gameId:'problem-hunter',familyId:'hs-problem-combination-family',skeletonId:'hs-problem-combination:complement-count',reasoningPathId:'count-all-subtract-no-special-check',subjectId:'mathematics',topicId:'combinatorics',learningOutcomeId:'count-selections-with-at-least-one-special-member',solutionClass:'combination-complement',cognitiveTraits:[...DEEP,'combinatorialReasoning'],
    variants:[{id:'v1',n:5,k:2,special:2},{id:'v2',n:6,k:3,special:2}],
    render:(v)=>({context:`${v.n} kişilik bir grupta ${v.special} kişi belirli bir uzmanlığa sahiptir. ${v.k} kişilik ekip seçilecektir.`,prompt:'Ekipte en az bir uzman bulunacak şekilde kaç farklı seçim yapılabilir?',hints:['Önce bütün ekipleri say.','Hiç uzman içermeyen ekipleri çıkar.']}),
    solve:(v)=>combination(v.n,v.k)-combination(v.n-v.special,v.k),
    verify:(v,x)=>Number(x)===combination(v.n,v.k)-combination(v.n-v.special,v.k),
    formatAnswer:(x)=>`${formatPremiumNumber(x)} seçim`,
    wrongValues:(v)=>[
      {id:'all-selections',value:combination(v.n,v.k),why:'Uzman içermeyen ekipleri toplam seçimlerden çıkarmaz.',rule:'count-all-without-constraint'},
      {id:'exactly-one-special',value:v.special*combination(v.n-v.special,v.k-1),why:'En az bir uzman koşulunu yalnız tam bir uzman varmış gibi sayar.',rule:'count-exactly-one-instead-of-at-least-one'},
      {id:'no-special',value:combination(v.n-v.special,v.k),why:'İstenen ekipler yerine hiç uzman içermeyen tamamlayıcı grubu cevaplar.',rule:'report-complement-count'}
    ],
    explanation:(v,x)=>`Toplam C(${v.n},${v.k}) ekipten uzman içermeyen C(${v.n-v.special},${v.k}) ekip çıkarılır. Sonuç ${x} seçimdir.`,
    evidence:(v,x)=>[`Bütün ekip sayısı C(${v.n},${v.k})=${combination(v.n,v.k)}'dir.`,`Uzmansız ekip sayısı C(${v.n-v.special},${v.k})=${combination(v.n-v.special,v.k)}'dir.`,`Fark ${x} seçimdir.`]
  })
];

function combination(n, k) {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 1; i <= k; i += 1) result = result * (n - k + i) / i;
  return result;
}

const SCIENCE_BLUEPRINTS = [
  defineNumericPremiumBlueprint({
    id:'hs-lab-density',gameId:'science-lab',familyId:'hs-lab-density-family',skeletonId:'hs-lab-density:mass-over-volume',reasoningPathId:'read-measurements-divide-check-unit',subjectId:'science',topicId:'density',learningOutcomeId:'calculate-density-from-mass-and-volume',solutionClass:'density-calculation',cognitiveTraits:[...DEEP,'quantitativeReasoning'],
    variants:[{id:'v1',mass:270,volume:100},{id:'v2',mass:390,volume:50}],
    render:(v)=>({context:`Bir numunenin kütlesi ${v.mass} g, hacmi ${v.volume} cm³ olarak ölçülüyor.`,prompt:'Numunenin yoğunluğu kaç g/cm³’tür?',hints:['Yoğunluk bağıntısını yaz.','Kütleyi hacme böl.']}),
    solve:(v)=>v.mass/v.volume,
    verify:(v,x)=>Math.abs(Number(x)*v.volume-v.mass)<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} g/cm³`,
    wrongValues:(v)=>[
      {id:'invert-ratio',value:v.volume/v.mass,why:'Kütleyi hacme bölmek yerine hacmi kütleye böler.',rule:'invert-density-ratio'},
      {id:'multiply',value:v.mass*v.volume,why:'Bölme bağıntısını çarpma olarak uygular.',rule:'multiply-mass-and-volume'},
      {id:'subtract',value:v.mass-v.volume,why:'İki ölçüm arasındaki farkı yoğunluk sanır.',rule:'subtract-measurements'}
    ],
    explanation:(v,x)=>`Yoğunluk d=m/V bağıntısıyla ${v.mass}/${v.volume}=${formatPremiumNumber(x)} g/cm³ bulunur.`,
    evidence:(v,x)=>[`Kütle ${v.mass} g'dır.`,`Hacim ${v.volume} cm³'tür.`,`Kütle hacme bölünerek ${formatPremiumNumber(x)} g/cm³ bulunur.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-lab-series-current',gameId:'science-lab',familyId:'hs-lab-circuit-family',skeletonId:'hs-lab-circuit:add-series-resistance-use-ohm',reasoningPathId:'combine-resistance-apply-ohm-check',subjectId:'science',topicId:'electric-circuits',learningOutcomeId:'calculate-current-in-series-circuit',solutionClass:'series-circuit-current',cognitiveTraits:[...DEEP,'physicalModeling'],
    variants:[{id:'v1',voltage:12,r1:2,r2:4},{id:'v2',voltage:24,r1:3,r2:5}],
    render:(v)=>({context:`${v.voltage} V’luk kaynağa seri bağlı ${v.r1} Ω ve ${v.r2} Ω dirençler bağlanıyor.`,prompt:'Devreden geçen akım kaç amperdir?',hints:['Seri dirençleri topla.','Toplam dirençle Ohm yasasını uygula.']}),
    solve:(v)=>v.voltage/(v.r1+v.r2),
    verify:(v,x)=>Math.abs(Number(x)*(v.r1+v.r2)-v.voltage)<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} A`,
    wrongValues:(v)=>[
      {id:'use-first-resistor',value:v.voltage/v.r1,why:'Toplam seri direnç yerine yalnız ilk direnci kullanır.',rule:'ignore-second-series-resistor'},
      {id:'use-second-resistor',value:v.voltage/v.r2,why:'Toplam seri direnç yerine yalnız ikinci direnci kullanır.',rule:'ignore-first-series-resistor'},
      {id:'multiply-voltage-resistance',value:v.voltage*(v.r1+v.r2),why:'I=V/R bağıntısında bölme yerine çarpma yapar.',rule:'multiply-in-ohms-law'}
    ],
    explanation:(v,x)=>`Seri devrede toplam direnç ${v.r1+v.r2} Ω’dur. I=V/R ile ${v.voltage}/${v.r1+v.r2}=${formatPremiumNumber(x)} A bulunur.`,
    evidence:(v,x)=>[`Dirençler seri olduğundan ${v.r1}+${v.r2}=${v.r1+v.r2} Ω olur.`,`Kaynak gerilimi ${v.voltage} V'tur.`,`Ohm yasası akımı ${formatPremiumNumber(x)} A verir.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-lab-heat-energy',gameId:'science-lab',familyId:'hs-lab-heat-family',skeletonId:'hs-lab-heat:mass-specific-heat-temperature-change',reasoningPathId:'find-temperature-change-multiply-factors-check-unit',subjectId:'science',topicId:'heat-energy',learningOutcomeId:'calculate-heat-from-mass-specific-heat-and-temperature-change',solutionClass:'calorimetry-energy',cognitiveTraits:[...DEEP,'quantitativeReasoning'],
    variants:[{id:'v1',mass:200,c:4.2,initial:20,final:30},{id:'v2',mass:100,c:4.2,initial:15,final:30}],
    render:(v)=>({context:`${v.mass} g suyun sıcaklığı ${v.initial} °C’den ${v.final} °C’ye çıkarılıyor. Suyun öz ısısı ${v.c} J/(g·°C)’dir.`,prompt:'Suya aktarılan ısı kaç joule’dür?',hints:['Sıcaklık değişimini son eksi ilk olarak bul.','Q=m·c·ΔT bağıntısını uygula.']}),
    solve:(v)=>v.mass*v.c*(v.final-v.initial),
    verify:(v,x)=>Math.abs(Number(x)-v.mass*v.c*(v.final-v.initial))<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} J`,
    wrongValues:(v)=>[
      {id:'omit-specific-heat',value:v.mass*(v.final-v.initial),why:'Öz ısı katsayısını çarpıma katmaz.',rule:'omit-specific-heat-factor'},
      {id:'use-final-temperature',value:v.mass*v.c*v.final,why:'Sıcaklık değişimi yerine son sıcaklığın kendisini kullanır.',rule:'use-final-temperature-as-delta'},
      {id:'omit-mass',value:v.c*(v.final-v.initial),why:'Isı hesabında kütle faktörünü atlar.',rule:'omit-mass-factor'}
    ],
    explanation:(v,x)=>`ΔT=${v.final-v.initial} °C’dir. Q=${v.mass}·${v.c}·${v.final-v.initial}=${formatPremiumNumber(x)} J olur.`,
    evidence:(v,x)=>[`Sıcaklık değişimi ${v.final-v.initial} °C'dir.`,`Kütle ve öz ısı çarpıma alınır.`,`Aktarılan ısı ${formatPremiumNumber(x)} J'dür.`]
  }),
  defineNumericPremiumBlueprint({
    id:'hs-lab-mass-conservation',gameId:'science-lab',familyId:'hs-lab-conservation-family',skeletonId:'hs-lab-conservation:reactant-total-minus-known-product',reasoningPathId:'sum-reactants-apply-conservation-subtract-known',subjectId:'science',topicId:'mass-conservation',learningOutcomeId:'find-unknown-product-mass-by-conservation',solutionClass:'mass-balance',cognitiveTraits:[...DEEP,'chemicalReasoning'],
    variants:[{id:'v1',r1:12,r2:32,knownProduct:36},{id:'v2',r1:10,r2:24,knownProduct:26}],
    render:(v)=>({context:`Kapalı kapta ${v.r1} g A maddesi ile ${v.r2} g B maddesi tamamen tepkimeye giriyor. Ürünlerden birinin kütlesi ${v.knownProduct} g ölçülüyor.`,prompt:'Diğer ürünün kütlesi kaç gramdır?',hints:['Kapalı sistemde toplam kütleyi koru.','Bilinen ürün kütlesini toplamdan çıkar.']}),
    solve:(v)=>v.r1+v.r2-v.knownProduct,
    verify:(v,x)=>Math.abs(v.knownProduct+Number(x)-(v.r1+v.r2))<1e-9,
    formatAnswer:(x)=>`${formatPremiumNumber(x)} g`,
    wrongValues:(v)=>[
      {id:'report-reactant-total',value:v.r1+v.r2,why:'Bilinmeyen ürün yerine toplam giren kütlesini cevaplar.',rule:'report-total-reactant-mass'},
      {id:'subtract-first-reactant',value:v.knownProduct-v.r1,why:'Toplam kütleyi kurmadan bilinen üründen yalnız ilk gireni çıkarır.',rule:'subtract-one-reactant-from-product'},
      {id:'mixed-add-subtract',value:v.r1+v.knownProduct-v.r2,why:'Giren ve ürün kütlelerini aynı tarafta karıştırır.',rule:'mix-reactant-and-product-sides'}
    ],
    explanation:(v,x)=>`Girenlerin toplamı ${v.r1+v.r2} g’dır. Kapalı kapta bu toplam ürünlere eşit olduğundan bilinmeyen ürün ${v.r1+v.r2}-${v.knownProduct}=${x} g’dır.`,
    evidence:(v,x)=>[`Toplam giren kütlesi ${v.r1+v.r2} g'dır.`,`Kapalı sistemde toplam ürün kütlesi de aynıdır.`,`Bilinen ürün çıkarılınca ${x} g kalır.`]
  }),
  defineCriteriaPremiumBlueprint({
    id:'hs-lab-ecosystem-data',gameId:'science-lab',familyId:'hs-lab-ecosystem-family',skeletonId:'hs-lab-ecosystem:data-bounded-population-claim',subjectId:'science',topicId:'ecosystem-data',learningOutcomeId:'select-population-conclusion-supported-by-multi-year-data',solutionClass:'ecological-data-interpretation',criteria:['matchesData','boundedClaim'],extraTraits:['dataReasoning'],
    variants:[
      {id:'v1',context:'Bir göldeki alg yoğunluğu üç ayda 20, 35 ve 50 birim; sudaki çözünmüş oksijen ise 8, 6 ve 4 mg/L ölçülüyor.',prompt:'Verilerle en iyi desteklenen değerlendirme hangisidir?',explanation:'Ölçülen dönemde alg yoğunluğu artarken oksijen azalmıştır; veri ilişkiyi gösterir fakat tek başına nedeni kanıtlamaz.',evidence:['Alg değeri her ölçümde artar.','Oksijen değeri her ölçümde azalır.','Nedene ilişkin ayrı deney yapılmamıştır.'],options:[
        {key:'a',text:'Ölçüm döneminde alg yoğunluğu artarken çözünmüş oksijen azalma eğilimi göstermiştir.',checks:{matchesData:true,boundedClaim:true}},
        {key:'b',text:'Alg artışı oksijen düşüşünün tek ve kesin nedenidir.',checks:{matchesData:false,boundedClaim:false},misconceptionId:'exclusive-cause',why:'Birlikte değişimden deneysel olarak gösterilmeyen tek neden çıkarır.',rule:'infer-exclusive-causation'},
        {key:'c',text:'Alg yoğunluğu ile çözünmüş oksijen aynı yönde değişmiştir.',checks:{matchesData:false,boundedClaim:true},misconceptionId:'reverse-trend-relation',why:'Biri artarken diğerinin azalmasını aynı yönlü değişim sayar.',rule:'reverse-opposite-trends'},
        {key:'d',text:'Bir sonraki ay oksijen değerinin tam 2 mg/L olacağı kanıtlanmıştır.',checks:{matchesData:false,boundedClaim:false},misconceptionId:'exact-extrapolation',why:'Üç ölçümden kesin bir sonraki değer üretir.',rule:'extrapolate-exact-future-value'}
      ]},
      {id:'v2',context:'Bir ormandaki tavşan sayısı üç yılda 120, 150 ve 180; tilki sayısı aynı yıllarda 30, 28 ve 25 olarak kaydediliyor.',prompt:'Verilerle en iyi desteklenen değerlendirme hangisidir?',explanation:'Kayıtlarda tavşan sayısı artarken tilki sayısı azalmıştır; bu gözlem neden-sonuç açıklaması için yeterli değildir.',evidence:['Tavşan sayısı düzenli artar.','Tilki sayısı düzenli azalır.','Başka çevresel etkenler ölçülmemiştir.'],options:[
        {key:'a',text:'Kayıt döneminde tavşan sayısı artarken tilki sayısı azalma eğilimi göstermiştir.',checks:{matchesData:true,boundedClaim:true}},
        {key:'b',text:'Tavşan artışının tek nedeni tilki sayısındaki azalmadır.',checks:{matchesData:false,boundedClaim:false},misconceptionId:'single-cause-from-correlation',why:'İki eğilimden ölçülmeyen tek neden çıkarır.',rule:'infer-single-cause'},
        {key:'c',text:'Tavşan ve tilki sayıları kayıt döneminde birlikte artmıştır.',checks:{matchesData:false,boundedClaim:true},misconceptionId:'misread-direction',why:'Tilki sayısındaki düşüşü artış olarak okur.',rule:'reverse-series-direction'},
        {key:'d',text:'Dördüncü yılda tilki sayısının tam 22 olacağı kesindir.',checks:{matchesData:false,boundedClaim:false},misconceptionId:'deterministic-forecast',why:'Kısa bir diziden kesin gelecek değeri çıkarır.',rule:'make-exact-forecast'}
      ]}
    ]
  }),
  defineCriteriaPremiumBlueprint({
    id:'hs-lab-reliability',gameId:'science-lab',familyId:'hs-lab-reliability-family',skeletonId:'hs-lab-reliability:repeat-control-average',subjectId:'science',topicId:'measurement-reliability',learningOutcomeId:'choose-procedure-that-improves-measurement-reliability',solutionClass:'experimental-reliability',criteria:['reducesRandomError','preservesComparison'],extraTraits:['experimentalDesign'],
    variants:[
      {id:'v1',context:'Bir öğrenci farklı yüzeylerde kayan bloğun durma mesafesini karşılaştırıyor. Her yüzey için yalnız bir ölçüm yapıyor.',prompt:'Sonuçların güvenilirliğini en çok artıracak değişiklik hangisidir?',explanation:'Her yüzeyde aynı koşullarda tekrarlı ölçüm yapıp ortalama almak rastgele hatanın etkisini azaltır ve karşılaştırmayı korur.',evidence:['Tek ölçüm rastgele hataya duyarlıdır.','Tekrarlar aynı koşullarda yapılmalıdır.','Ortalama karşılaştırmayı daha kararlı hâle getirir.'],options:[
        {key:'a',text:'Her yüzeyde tekrarlı ölçüm yapıp mesafe ortalamasını almak.',checks:{reducesRandomError:true,preservesComparison:true}},
        {key:'b',text:'Her yüzey için farklı kütlede bir blok kullanmak.',checks:{reducesRandomError:false,preservesComparison:false},misconceptionId:'change-second-variable',why:'Yüzey etkisiyle birlikte kütleyi de değiştirerek karşılaştırmayı bozar.',rule:'introduce-confounding-variable'},
        {key:'c',text:'Yalnız en uzun durma mesafesini sonuç olarak kaydetmek.',checks:{reducesRandomError:false,preservesComparison:false},misconceptionId:'select-extreme',why:'Tekrarlı veriyi temsil etmek yerine uç değeri seçer.',rule:'report-maximum-only'},
        {key:'d',text:'Cetvel yerine ölçüm yapmadan yüzeyi gözle değerlendirmek.',checks:{reducesRandomError:false,preservesComparison:false},misconceptionId:'replace-measurement-with-impression',why:'Sayısal ölçümü öznel gözleme dönüştürür.',rule:'remove-objective-measurement'}
      ]},
      {id:'v2',context:'Bir öğrenci çözelti sıcaklığının çözünme süresine etkisini araştırıyor. Her sıcaklıkta yalnız bir kez süre ölçüyor.',prompt:'Sonuçların güvenilirliğini en çok artıracak değişiklik hangisidir?',explanation:'Her sıcaklık düzeyinde aynı miktarlarla tekrarlı süre ölçümleri yapıp ortalama almak rastgele ölçüm farklarını azaltır.',evidence:['Her sıcaklıkta tek ölçüm vardır.','Diğer koşullar aynı tutulmalıdır.','Tekrarlı ölçümlerin ortalaması güvenilirliği artırır.'],options:[
        {key:'a',text:'Her sıcaklıkta tekrarlı süre ölçümü yapıp ortalama almak.',checks:{reducesRandomError:true,preservesComparison:true}},
        {key:'b',text:'Her sıcaklıkta farklı miktarda çözünen madde kullanmak.',checks:{reducesRandomError:false,preservesComparison:false},misconceptionId:'vary-solute-amount',why:'Sıcaklıkla birlikte madde miktarını değiştirir.',rule:'change-controlled-variable'},
        {key:'c',text:'Yalnız en kısa çözünme süresini sonuç olarak seçmek.',checks:{reducesRandomError:false,preservesComparison:false},misconceptionId:'choose-minimum',why:'Tekrarlı ölçümlerin dağılımını yok sayıp uç değeri seçer.',rule:'report-minimum-only'},
        {key:'d',text:'Süreyi ölçmek yerine çözeltinin görünümünü yorumlamak.',checks:{reducesRandomError:false,preservesComparison:false},misconceptionId:'replace-time-with-appearance',why:'Araştırılan süre değişkenini farklı ve öznel bir gözlemle değiştirir.',rule:'replace-dependent-measure'}
      ]}
    ]
  })
];

export const PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_O = createPremiumBlueprintPack({
  version: '3.4.0',
  sourceLabel: 'Zihin Arenası Premium 9–10. Sınıf Mantık–Problem–Fen Blueprint Bankası',
  blueprints: [...LOGIC_BLUEPRINTS, ...PROBLEM_BLUEPRINTS, ...SCIENCE_BLUEPRINTS]
});

export const PREMIUM_HIGHSCHOOL_GAME_IDS_O = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_O.gameIds;
export const generatePremiumHighschoolRoundsO = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_O.generate;
export const premiumHighschoolInventoryO = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_O.inventory;
export const premiumHighschoolBlueprintReportO = PREMIUM_HIGHSCHOOL_BLUEPRINT_PACK_O.validationReport;
