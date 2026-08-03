import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const catalog=JSON.parse(fs.readFileSync(new URL('../content/v11/cognitive-skeletons.v11.json',import.meta.url),'utf8'));

test('V11 kataloğu 40 benzersiz iskelet ve 8 aile içerir',()=>{
  assert.equal(catalog.skeletons.length,40);
  assert.equal(new Set(catalog.skeletons.map(x=>x.skeletonId)).size,40);
  assert.equal(new Set(catalog.skeletons.map(x=>x.familyId)).size,8);
});

test('her iskelet üç ayrı çeldirici planı ve üç zorluk seviyesi taşır',()=>{
  for(const s of catalog.skeletons){
    assert.equal(s.distractors.length,3,s.skeletonId);
    assert.ok(s.distractors.every(x=>x.misconception.trim().length>10),s.skeletonId);
    assert.ok(s.difficultyRules.easy,s.skeletonId);
    assert.ok(s.difficultyRules.medium,s.skeletonId);
    assert.ok(s.difficultyRules.hard,s.skeletonId);
  }
});

test('her iskelet gerçek varyasyon, yüzeysel makyaj ve ret kuralı taşır',()=>{
  for(const s of catalog.skeletons){
    assert.ok(s.realVariationAxes.length,s.skeletonId);
    assert.ok(s.surfaceMakeupExamples.length,s.skeletonId);
    assert.ok(s.qualityRejectionReasons.length,s.skeletonId);
  }
});

test('aynı oturum yasakları tanımlı iskelet kimliği biçimindedir',()=>{
  for(const s of catalog.skeletons){
    for(const id of s.notTogetherWith) assert.match(id,/^[A-Z_]+_\d{2}$/,`${s.skeletonId} -> ${id}`);
  }
});
