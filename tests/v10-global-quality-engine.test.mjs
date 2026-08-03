import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateQuestionQuality, auditGlobalSession } from '../js/quality/global-quality-engine-v10.js';
import { createGameSession } from '../js/games/registry.js';

const profile={id:'quality-user',grade:8,age:13,skills:{}};

test('cevabı kökte veren soru tüm derslerde reddedilir',()=>{
  const q={kind:'choice',context:'Bütün araştırmacılar meraklıdır.',prompt:'Hangisi doğrudur?',options:['Bütün araştırmacılar meraklıdır.','Bazı müzisyenler araştırmacıdır.','Hiç kimse meraklı değildir.','Kesin sonuç yoktur.'],answerValue:'Bütün araştırmacılar meraklıdır.',difficulty:4,explanation:'Öncül doğru seçenekte aynen tekrar edilmiştir.'};
  const r=evaluateQuestionQuality(q,{grade:8,gameId:'logic-station'});
  assert.equal(r.status,'REJECT');
  assert.ok(r.errors.some(x=>x.startsWith('answer_leak')));
});

test('kalite motoru yalnız sözel mantığa bağlı değildir',()=>{
  const math=evaluateQuestionQuality({kind:'choice',prompt:'2 + 2 sonucu kaçtır?',options:['4','41','900','-37'],answerValue:'4',difficulty:5,cognitiveDepth:5,explanation:'Toplama işlemi yapılır.'},{grade:8,gameId:'problem-hunter',subjectId:'mathematics'});
  const science=evaluateQuestionQuality({kind:'choice',context:'Bir deneyde sıcaklık artırılmış ve çözünme süresi ölçülmüştür.',prompt:'Bağımsız değişken hangisidir?',options:['Sıcaklık','Çözünme süresi','Kap türü','Madde miktarı'],answerValue:'Sıcaklık',difficulty:3,cognitiveDepth:3,explanation:'Araştırmacının değiştirdiği değişken sıcaklıktır; ölçülen sonuç çözünme süresidir.'},{grade:6,gameId:'science-lab',subjectId:'science'});
  assert.ok(math.overall<science.overall);
  assert.ok(math.warnings.includes('mechanical_math')||math.errors.length);
});

test('oturum denetimi baskın düşünme kalıbını bildirir',()=>{
  const rounds=Array.from({length:6},(_,i)=>({kind:'choice',familyId:`f${i}`,thinkingPatternId:'ORDERING',context:'A, B den önce gelir. C en sonda değildir.',prompt:'Uygun sıralama hangisidir?',options:['A-B-C','B-A-C','C-A-B','B-C-A'],answerValue:'A-B-C',difficulty:4,cognitiveDepth:4,explanation:'Koşullar birlikte uygulanınca yalnız A-B-C sıralaması kalır ve diğer seçenekler en az bir koşulu bozar.'}));
  const a=auditGlobalSession(rounds,{grade:8,gameId:'logic-station'});
  assert.ok(a.warnings.some(x=>x.includes('düşünme kalıbı baskın')));
});

test('farklı oyun oturumları global kalite raporu taşır',()=>{
  for(const gameId of ['logic-station','olympiad-ladder','science-lab','religion-practice','english-cloze','paragraph-detective']){
    const session=createGameSession(gameId,profile,`global-${gameId}`);
    assert.ok(session.globalQualityAudit);
    assert.equal(session.globalQualityAudit.reports.length,session.rounds.length);
    assert.ok(session.rounds.every(q=>Number.isFinite(q.globalQualityScore)));
  }
});

test('çok adımlı kanıtlı mantık sorusunda paralel seçenekler answer leak sayılmaz',()=>{
  const q={
    kind:'choice',
    context:'N, K’den önce; K da L’den önce bitirmiştir.',
    prompt:'Hangi ilişki zorunludur?',
    options:['N, L’den önce bitirmiştir.','L, N’den önce bitirmiştir.','K, N’den önce bitirmiştir.','L, K’den önce bitirmiştir.'],
    answerIndex:0,
    difficulty:4,
    cognitiveDepth:4,
    reasoningStepCount:2,
    cognitiveTraits:['multiStepInference','conditionEvaluation'],
    requireExplicitDistractorEvidence:true,
    distractorValidation:{verified:true},
    evidenceMap:{evidence:[{id:'e1',text:'N<K'},{id:'e2',text:'K<L'}],correctAnswerEvidenceIds:['e1','e2']},
    solutionGraph:[{step:1,evidence:'N<K'},{step:2,evidence:'K<L → N<L'}],
    explanation:'İki sıralama ilişkisi geçişli olarak birleştirilir.'
  };
  const r=evaluateQuestionQuality(q,{grade:8,gameId:'logic-station'});
  assert.equal(r.errors.some(x=>x.startsWith('answer_leak')),false);
});
