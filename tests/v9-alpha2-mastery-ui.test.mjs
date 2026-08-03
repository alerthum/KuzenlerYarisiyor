import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdaptiveLearningPlan, microLessonForTopic } from '../js/engines/micro-teaching-v9.js';
import { topicLabel } from '../js/curriculum/topic-labels-v9.js';
import { readFile } from 'node:fs/promises';

test('konu kimlikleri kullanıcıya Türkçe adla gösterilir',()=>{
  assert.equal(topicLabel('functions'),'Fonksiyonlar');
  assert.equal(topicLabel('cause-effect'),'Neden-sonuç');
});

test('mikro öğretim uzun ders yerine kısa strateji üretir',()=>{
  const lesson=microLessonForTopic('functions',{masteryScore:32});
  assert.equal(lesson.practiceCount,2);
  assert.ok(lesson.strategy.length>10);
  assert.ok(lesson.durationMinutes<=4);
});

test('sessiz telafi planı toplam oturumu ele geçirmez',()=>{
  const attempts=[
    {topicId:'functions',correct:false,difficulty:4,cognitiveLevel:4,hintCount:2,durationSeconds:90,answeredAt:'2026-07-20',visibleCardId:'problem',questionFamilyId:'f1'},
    {topicId:'functions',correct:false,difficulty:4,cognitiveLevel:4,hintCount:1,durationSeconds:80,answeredAt:'2026-07-21',visibleCardId:'graph',questionFamilyId:'f2'},
    {topicId:'ratio',correct:true,difficulty:4,cognitiveLevel:4,hintCount:0,durationSeconds:35,answeredAt:'2026-07-20',visibleCardId:'problem',questionFamilyId:'r1'},
    {topicId:'ratio',correct:true,difficulty:4,cognitiveLevel:4,hintCount:0,durationSeconds:30,answeredAt:'2026-07-21',visibleCardId:'target',questionFamilyId:'r2'}
  ];
  const plan=buildAdaptiveLearningPlan(attempts);
  assert.ok(plan.length>=1);
  assert.ok(plan.every(x=>x.recommendedShare<=.25));
  assert.equal(plan[0].label,'Fonksiyonlar');
});

test('öğrenci gelişim ekranı konu ustalığı ve mikro öğretimi içerir',async()=>{
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  assert.match(app,/Konu ustalık haritası/);
  assert.match(app,/Kısa güçlendirme önerileri/);
  assert.match(app,/Sessiz gelişim planı/);
});
