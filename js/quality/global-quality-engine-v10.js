import { auditChoiceIntegrity } from './choice-integrity-engine-v11.js';
import { runQualityOrchestra, isShowcaseEligible } from './quality-orchestra-v10.js';
const TR_STOP = new Set(['ve','veya','ile','bir','bu','şu','o','için','gibi','daha','en','hangisi','aşağıdakilerden','göre','olan','olarak','ise']);

function normalize(value='') {
  return String(value).toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9%]+/g,' ').trim();
}

function tokens(value='') {
  return normalize(value).split(/\s+/).filter(x=>x.length>2&&!TR_STOP.has(x));
}

function optionIdentity(value='') {
  const raw=String(value).toLocaleLowerCase('tr-TR').trim();
  // Matematiksel ifadelerde işlem işaretleri anlamın parçasıdır; bunları silmek
  // farklı ifadeleri yanlışlıkla aynı seçenek sayar.
  if(/[+−\-×*÷/()]/.test(raw)) return raw.replace(/\s+/g,'');
  return normalize(raw);
}

function allNumericOptions(options=[]) {
  return options.length>0 && options.every(value=>/^[-+]?\d+(?:[.,]\d+)?$/.test(String(value).trim()));
}

function overlapRatio(a,b){
  const A=new Set(tokens(a)), B=new Set(tokens(b));
  if(!A.size||!B.size)return 0;
  let common=0; for(const x of A)if(B.has(x))common++;
  return common/Math.min(A.size,B.size);
}

function answerValueOf(q){
  if(q.answerValue!=null)return String(q.answerValue);
  if(Number.isInteger(q.answerIndex)&&Array.isArray(q.options))return String(q.options[q.answerIndex]??'');
  if(q.answer!=null)return String(q.answer);
  return '';
}

function inferPattern(q={}){
  if(q.thinkingPatternId)return q.thinkingPatternId;
  const text=normalize(`${q.familyId||''} ${q.context||''} ${q.prompt||''} ${(q.tags||[]).join(' ')}`);
  const map=[
    [/grafik|tablo|veri|çizelge/,'DATA_INTERPRETATION'],
    [/sıra|önce|sonra|hemen|yerleştir/,'ORDERING'],
    [/eşleştir|kim hangi|hangi kişi/,'MATCHING'],
    [/koşul|eğer|ise|olamaz|zorunlu/,'CONDITIONAL_REASONING'],
    [/çıkarım|yargı|parça|metin/,'TEXT_INFERENCE'],
    [/olasılık|ihtimal/,'PROBABILITY'],
    [/şekil|geometri|açı|alan|çevre/,'SPATIAL_GEOMETRY'],
    [/örüntü|dizi|kural/,'PATTERN_DISCOVERY'],
    [/hata|yanlış çözüm/,'ERROR_ANALYSIS'],
    [/deney|değişken|hipotez/,'SCIENTIFIC_REASONING'],
    [/dialog|boşluğa|sentence|grammar|kelime/,'LANGUAGE_APPLICATION'],
    [/neden|sonuç|tarih|harita/,'CAUSE_EFFECT'],
  ];
  return map.find(([r])=>r.test(text))?.[1]||'GENERAL_REASONING';
}

function criticalErrors(q,{grade=0}={}){
  const errors=[];
  const opts=Array.isArray(q.options)?q.options.map(String):[];
  const answer=answerValueOf(q);
  const stem=`${q.context||''} ${q.prompt||''}`;
  if(!q.prompt)errors.push('prompt_missing');
  if(q.kind==='choice'||opts.length){
    if(opts.length<3)errors.push('option_count');
    if(new Set(opts.map(optionIdentity)).size!==opts.length)errors.push('duplicate_options');
    if(!opts.includes(answer))errors.push('answer_not_in_options');
  }
  const na=normalize(answer), ns=normalize(stem);
  const promptNormalized=normalize(q.prompt||'');
  const derivationEvidence=Number(q.reasoningStepCount||q.cognitiveDepthEvidence?.reasoningStepCount||0)>=2
    && Array.isArray(q.solutionGraph)&&q.solutionGraph.length>=2
    && Array.isArray(q.evidenceMap?.evidence)&&q.evidenceMap.evidence.length>=2
    && q.requireExplicitDistractorEvidence===true
    && q.distractorValidation?.verified===true;
  const answerIndex=Number.isInteger(q.answerIndex)?q.answerIndex:opts.indexOf(answer);
  const distractorOverlaps=opts.filter((_,index)=>index!==answerIndex).map(option=>overlapRatio(option,stem));
  const strongestDistractorOverlap=distractorOverlaps.length?Math.max(...distractorOverlaps):0;
  const answerOverlap=overlapRatio(answer,stem);
  const answerDominatesAlternatives=(answerOverlap-strongestDistractorOverlap)>.34;
  // Çok adımlı, kanıt haritalı premium sorularda kişi/gün/nesne adlarının öncüllerde
  // geçmesi doğaldır. Bu durumda yalnız soru cümlesinin cevabı doğrudan söylemesi
  // leak kabul edilir; bağlamdan türetilen sonuç semantik benzerlik yüzünden reddedilmez.
  if(na.length>=12&&promptNormalized.includes(na))errors.push('answer_leak_exact');
  else if(!derivationEvidence&&na.length>=12&&ns.includes(na)&&answerDominatesAlternatives)errors.push('answer_leak_exact');
  if(!derivationEvidence&&na.length>=16&&answerOverlap>.92&&answerDominatesAlternatives)errors.push('answer_leak_semantic');
  if(opts.length>=4){
    const tiny=opts.filter(x=>normalize(x).length<2).length;
    if(tiny>=2&&!allNumericOptions(opts))errors.push('implausible_options');
  }
  if(grade>=5&&Number(q.difficulty||q.cognitiveDepth||0)>=4&&tokens(stem).length<7&&opts.length)errors.push('declared_hard_but_shallow');
  return [...new Set(errors)];
}

export function evaluateQuestionQuality(question,{grade=0,gameId='',subjectId=''}={}){
  const q=question||{};
  const errors=criticalErrors(q,{grade});
  const warnings=[];
  const answer=answerValueOf(q);
  const opts=Array.isArray(q.options)?q.options.map(String):[];
  const stem=`${q.context||''} ${q.prompt||''}`;
  let curriculum=78, difficulty=75, cognitive=72, distractor=78, pedagogy=76, language=82;

  const depth=Number(q.cognitiveDepth||q.difficulty||0);
  if(depth>=4)cognitive+=10; else if(grade>=6)cognitive-=12;
  if(tokens(stem).length>=18)cognitive+=6;
  if(/kesinlikle|olabilir|olamaz|çıkarılabilir|kanıtlar|birlikte/i.test(stem))cognitive+=5;
  if(q.familyId||q.topicId||q.learningOutcomeId)curriculum+=8; else warnings.push('academic_metadata_weak');
  if(Number.isFinite(depth)&&depth>=3)difficulty+=6; else warnings.push('difficulty_metadata_weak');
  if(String(q.explanation||'').length>=65)pedagogy+=12; else if(String(q.explanation||'').length<30){pedagogy-=22;warnings.push('explanation_short');}
  if(Array.isArray(q.hints)&&q.hints.length>=2)pedagogy+=5;

  if(opts.length>=4){
    const ansIndex=opts.indexOf(answer);
    const distractors=opts.filter((_,i)=>i!==ansIndex);
    const similarities=distractors.map(x=>overlapRatio(x,answer));
    if(similarities.some(v=>v>.25&&v<.9))distractor+=8;
    if(similarities.every(v=>v<.08)){distractor-=16;warnings.push('distractors_too_obvious');}
    const lengths=opts.map(x=>normalize(x).length);
    const max=Math.max(...lengths),min=Math.min(...lengths);
    if(max>0&&min/max<.28){distractor-=8;warnings.push('option_length_bias');}
  }

  if(/[.?!]$/.test(String(q.prompt||'').trim()))language+=3;
  if(/\b(?:filen|şey|direk)\b/i.test(stem)){language-=20;warnings.push('informal_language');}
  if(/her zaman|asla|yalnızca|kesinlikle/i.test(opts.join(' '))&&opts.length)warnings.push('absolute_word_distractor_review');
  if(gameId==='logic-station'&&grade>=7&&inferPattern(q)==='GENERAL_REASONING'){cognitive-=18;warnings.push('logic_pattern_unspecified');}
  if(subjectId==='mathematics'&&grade>=6&&/sonucu kaçtır\??$/i.test(q.prompt||'')&&tokens(stem).length<10){cognitive-=14;warnings.push('mechanical_math');}

  for(const e of errors){
    if(e.startsWith('answer_leak')){cognitive-=35;distractor-=30;}
    else {distractor-=18;pedagogy-=10;}
  }
  const clamp=x=>Math.max(0,Math.min(100,Math.round(x)));
  const dimensions={curriculum:clamp(curriculum),difficulty:clamp(difficulty),cognitive:clamp(cognitive),distractor:clamp(distractor),pedagogy:clamp(pedagogy),language:clamp(language)};
  const overall=clamp(Object.values(dimensions).reduce((a,b)=>a+b,0)/6);
  const status=errors.length?'REJECT':overall>=86?'GOLD':overall>=72?'APPROVE':'REVIEW';
  return {status,overall,dimensions,errors,warnings:[...new Set(warnings)],thinkingPatternId:inferPattern(q)};
}

export function auditGlobalSession(rounds=[],context={}){
  const errors=[],warnings=[]; const patterns=new Map(),families=new Map();
  const reports=rounds.map((q,index)=>{
    const report=evaluateQuestionQuality(q,context);
    for(const e of report.errors)errors.push(`${index+1}. soru: ${e}`);
    for(const w of report.warnings)warnings.push(`${index+1}. soru: ${w}`);
    const p=report.thinkingPatternId, f=q.familyId||q.questionFamilyId||'';
    patterns.set(p,(patterns.get(p)||0)+1); if(f)families.set(f,(families.get(f)||0)+1);
    return report;
  });
  for(const [p,n] of patterns)if(n>Math.max(2,Math.ceil(rounds.length*.35)))warnings.push(`düşünme kalıbı baskın: ${p} (${n}/${rounds.length})`);
  for(const [f,n] of families)if(n>1)warnings.push(`soru ailesi tekrar ediyor: ${f} (${n})`);
  return {ok:errors.length===0,errors,warnings,reports,average:reports.length?Math.round(reports.reduce((s,r)=>s+r.overall,0)/reports.length):0};
}

function isVerifiedHumanPremium(question={}) {
  return question.premiumQuestion === true
    && question.familyEngineCertified !== true
    && question.premiumTier === 'GOLD'
    && question.productQualityGate === 'PASS'
    && question.distractorValidation?.verified === true;
}

export function attachGlobalQuality(question,context={}){
  const report=evaluateQuestionQuality(question,context);
  const verifiedHumanPremium = isVerifiedHumanPremium(question);
  return {
    ...question,
    thinkingPatternId:question.thinkingPatternId||report.thinkingPatternId,
    globalQualityScore:verifiedHumanPremium?Math.max(90,report.overall):report.overall,
    globalQualityStatus:verifiedHumanPremium?'GOLD':report.status,
    globalQualityDimensions:report.dimensions,
    globalQualityWarnings:report.warnings,
    verifiedHumanPremium
  };
}

const ARTIFICIAL_CONTEXT_PATTERNS = [
  /(?:kırmızı|mavi|sarı|turuncu|yeşil) başlıklı (?:dosya|rapor|not|günlük|proje)/i,
  /(?:a|b|c) masası/i,
  /(?:final etabı|keşif turu|strateji turu)/i,
  /(?:kulübü çalışması|kampı çalışması)\s*[•·]/i
];

function contextTemplateIdOf(question={}) {
  const text=normalize(`${question.context||''} ${question.prompt||''}`)
    .replace(/\b\d+\b/g,'#')
    .replace(/\b(?:ali|ayşe|mert|elif|kerem|arda|kaan|lara|deniz|efe|ceren|burak)\b/g,'KİŞİ');
  if(ARTIFICIAL_CONTEXT_PATTERNS.some(r=>r.test(`${question.context||''} ${question.prompt||''}`))) return 'ARTIFICIAL_COLORED_REPORT';
  return text.split(' ').slice(0,12).join('_')||'NO_CONTEXT';
}

function distractorDiagnostic(question={}) {
  const opts=Array.isArray(question.options)?question.options.map(String):[];
  const answer=answerValueOf(question);
  const stem=`${question.context||''} ${question.prompt||''}`;
  const answerIndex=opts.indexOf(answer);
  const distractors=opts.filter((_,i)=>i!==answerIndex);
  if(distractors.length<2)return {weakCount:0,irrelevantCount:0,diagnostics:[]};
  const stemTokens=new Set(tokens(stem));
  const diagnostics=distractors.map(value=>{
    const t=tokens(value);
    const relevant=t.filter(x=>stemTokens.has(x)).length;
    const relevance=t.length?relevant/t.length:0;
    const answerSimilarity=overlapRatio(value,answer);
    const absolute=/\b(?:her zaman|asla|kesinlikle|hiçbir|bütün|yalnızca)\b/i.test(value);
    const tooShort=normalize(value).length<8;
    return {value,relevance,answerSimilarity,absolute,tooShort,weak:(relevance<.12&&answerSimilarity<.08)||tooShort};
  });
  return {
    weakCount:diagnostics.filter(x=>x.weak).length,
    irrelevantCount:diagnostics.filter(x=>x.relevance<.08&&x.answerSimilarity<.08).length,
    diagnostics
  };
}

export function evaluatePublicationReadiness(question, context={}) {
  const base=evaluateQuestionQuality(question,context);
  const choiceIntegrity=auditChoiceIntegrity(question,context);
  const trustedDistractors=Boolean(question.distractorValidation?.verified);
  const errors=[...base.errors,...(trustedDistractors?[]:(choiceIntegrity.errors||[]))];
  const warnings=[...base.warnings,...(choiceIntegrity.warnings||[])];
  const distractors=distractorDiagnostic(question);
  const raw=`${question.context||''} ${question.prompt||''}`;
  const artificial=ARTIFICIAL_CONTEXT_PATTERNS.some(r=>r.test(raw));
  const grade=Number(context.grade||0);
  const declared=Number(question.cognitiveDepth||question.difficulty||0);

  if(artificial){
    warnings.push('artificial_context_template');
    if(grade>=6)errors.push('artificial_context_upper_grade');
  }
  const expertDistractorValidation=Boolean(question.distractorValidation?.verified)
    && Array.isArray(question.distractorValidation?.rationales)
    && question.distractorValidation.rationales.length>=2
    && question.distractorValidation.rationales.every(item=>String(item||'').trim().length>=20);
  if(!expertDistractorValidation&&grade>=6&&declared>=4&&distractors.irrelevantCount>=2)errors.push('multiple_irrelevant_distractors');
  else if(!expertDistractorValidation&&distractors.weakCount>=2)warnings.push('weak_distractor_set');
  if(grade>=7&&declared>=4&&base.dimensions.cognitive<78)errors.push('upper_grade_depth_mismatch');
  if(!expertDistractorValidation&&grade>=7&&declared>=4&&base.dimensions.distractor<72)errors.push('upper_grade_distractor_mismatch');
  if(expertDistractorValidation) warnings.push('expert_distractor_validation');

  const uniqueErrors=[...new Set(errors)], uniqueWarnings=[...new Set(warnings)];
  const penalty=(uniqueErrors.length*12)+(uniqueWarnings.length*2);
  const score=Math.max(0,Math.min(100,base.overall-penalty));
  let status=uniqueErrors.length?'REJECT':score>=88?'GOLD':score>=76?'APPROVE':'REVIEW';
  const provisional={...base,status,overall:score,errors:uniqueErrors,warnings:uniqueWarnings,contextTemplateId:contextTemplateIdOf(question),distractorDiagnostics:distractors.diagnostics};
  const qualityOrchestra=runQualityOrchestra(provisional,question,context);
  if(qualityOrchestra.verdict==='REJECT') status='REJECT';
  else if(qualityOrchestra.verdict==='REVIEW'&&status!=='REJECT') status='REVIEW';
  return {...provisional,status,choiceIntegrity,qualityOrchestra,showcaseEligible:isShowcaseEligible({...provisional,status},qualityOrchestra)};
}

export function enforceSessionQuality(rounds=[], context={}, options={}) {
  const targetCount=Number(options.targetCount||rounds.length||0);
  const firstExperience=Boolean(options.firstExperience);
  const candidates=[]; const rejected=[];
  const familyCounts=new Map(), patternCounts=new Map(), contextCounts=new Map();

  for(const round of rounds){
    const report=evaluatePublicationReadiness(round,context);
    const family=round.familyId||round.questionFamilyId||'';
    const pattern=round.thinkingPatternId||report.thinkingPatternId;
    const template=report.contextTemplateId;
    if(family)familyCounts.set(family,(familyCounts.get(family)||0)+1);
    if(pattern)patternCounts.set(pattern,(patternCounts.get(pattern)||0)+1);
    if(template)contextCounts.set(template,(contextCounts.get(template)||0)+1);
    const strictChoice=context.gameId==='paragraph-detective';
    const blockingErrors=(report.errors||[]).filter(error=>error.startsWith('answer_leak')||error==='answer_not_in_options'||error==='artificial_context_upper_grade'||(strictChoice&&(error==='correct_answer_length_beacon'||error==='absolute_word_elimination_pattern'||error==='multiple_semantically_irrelevant_distractors')));
    if(blockingErrors.length){
      rejected.push({questionKey:round.questionKey||'',familyId:family,reason:'quality_reject',blockingErrors,report});
      continue;
    }
    const verifiedGold = (round.premiumTier === 'GOLD' && round.premiumShowcase === true && round.distractorValidation?.verified === true)
      || isVerifiedHumanPremium(round);
    const runtimeStatus = verifiedGold ? 'GOLD' : (report.status==='REJECT'?'REVIEW':report.status);
    const showcaseEligible = verifiedGold || report.showcaseEligible;
    candidates.push({...round,globalQualityScore:verifiedGold?Math.max(90,report.overall):report.overall,globalQualityStatus:runtimeStatus,globalQualityDimensions:report.dimensions,globalQualityWarnings:report.warnings,globalQualityErrors:report.errors,choiceIntegrity:report.choiceIntegrity,qualityOrchestra:report.qualityOrchestra,showcaseEligible,contextTemplateId:template});
  }

  const rank={GOLD:0,APPROVE:1,REVIEW:2};
  candidates.sort((a,b)=>(rank[a.globalQualityStatus]??9)-(rank[b.globalQualityStatus]??9)||b.globalQualityScore-a.globalQualityScore);
  let selected;
  if(firstExperience){
    const showcase=candidates.filter(q=>q.showcaseEligible);
    const approved=candidates.filter(q=>q.globalQualityStatus==='APPROVE');
    const ordered=[...showcase,...approved];
    const used=new Set();
    selected=ordered.filter((round)=>{
      const key=round.questionKey||`${round.familyId||''}|${round.prompt||''}`;
      if(used.has(key))return false;
      used.add(key);return true;
    }).slice(0,targetCount||candidates.length);
  }else selected=candidates.slice(0,targetCount||candidates.length);

  const diversityWarnings=[];
  for(const [id,count] of familyCounts)if(id&&count>1)diversityWarnings.push(`family_repeat:${id}:${count}`);
  for(const [id,count] of patternCounts)if(id&&count>Math.max(2,Math.ceil(rounds.length*.35)))diversityWarnings.push(`thinking_pattern_dominance:${id}:${count}`);
  for(const [id,count] of contextCounts)if(id&&count>1)diversityWarnings.push(`context_template_repeat:${id}:${count}`);
  if(firstExperience&&selected.length<targetCount)diversityWarnings.push(`showcase_pool_incomplete:${selected.length}/${targetCount}`);
  return {rounds:selected,rejected,requested:targetCount,accepted:selected.length,blocked:rejected.length,complete:!targetCount||selected.length>=targetCount,firstExperience,showcaseCount:selected.filter(x=>x.showcaseEligible).length,diversityWarnings};
}
