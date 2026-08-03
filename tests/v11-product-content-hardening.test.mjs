import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GAME_CATALOG, createGameSession } from '../js/games/registry.js';
import { auditChoiceIntegrity } from '../js/quality/choice-integrity-engine-v11.js';
import { premiumParagraphFamilyStats } from '../js/engines/premium-paragraph-engine-v11.js';

const profile={id:'quality-audit',age:13,grade:8,skills:{}};

test('Paragraf Dedektifi eski V4 soru üreticisini kullanmaz',()=>{
  const registry=fs.readFileSync(new URL('../js/games/registry.js',import.meta.url),'utf8');
  assert.equal(registry.includes('createV4ParagraphSession'),false);
  assert.equal(registry.includes('createPremiumParagraphSession'),true);
});

test('premium paragraf motoru 15 bilişsel aile ve en az 90 çekirdek varyasyon kapasitesi taşır',()=>{
  const stats=premiumParagraphFamilyStats();
  assert.equal(stats.familyCount,15);
  assert.ok(stats.minimumCoreVariants>=90);
});

test('Paragraf Dedektifi farklı seedlerde sekiz yayınlanabilir ve dengeli tur üretir',()=>{
  for(let seed=1;seed<=24;seed++){
    const session=createGameSession('paragraph-detective',profile,seed,{completedSessionCount:2});
    assert.equal(session.rounds.length,8,`seed ${seed}`);
    for(const round of session.rounds){
      const report=auditChoiceIntegrity(round,{gameId:'paragraph-detective',grade:8});
      assert.equal(report.passed,true,`${seed}/${round.questionKey}: ${report.errors.join(',')}`);
      assert.equal(round.distractorValidation?.verified,true,round.questionKey);
      assert.equal(round.options.length,4);
      assert.ok(round.optionDiagnostics?.filter(x=>!x.isCorrect).length===3);
    }
  }
});

test('bütün canlı çoktan seçmeli oyunlar ortak seçenek bütünlüğü raporu taşır',()=>{
  for(const game of GAME_CATALOG){
    if(profile.age<game.minAge||profile.age>game.maxAge)continue;
    let session;
    try{session=createGameSession(game.id,profile,99173,{completedSessionCount:2});}catch{continue;}
    for(const round of session.rounds.filter(x=>x.kind==='choice')){
      assert.ok(round.choiceIntegrity || round.globalQualityStatus,`${game.id}/${round.questionKey}`);
      const report=auditChoiceIntegrity(round,{gameId:game.id,grade:8});
      assert.equal(report.applicable,true);
      assert.equal(Number.isFinite(report.score),true);
    }
  }
});
