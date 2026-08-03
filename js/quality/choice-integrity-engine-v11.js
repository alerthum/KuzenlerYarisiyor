const STOP = new Set(['ve','veya','ile','bir','bu','şu','o','için','gibi','daha','en','olan','olarak','ise','de','da','ki','mi','mı','mu','mü']);
const ABSOLUTE = /\b(?:her zaman|asla|kesinlikle|hiçbir|bütün|yalnızca|tamamen|mutlaka)\b/i;

function normalize(value=''){return String(value).toLocaleLowerCase('tr-TR').replace(/[^a-zçğıöşü0-9]+/g,' ').trim();}
function tokens(value=''){return normalize(value).split(/\s+/).filter(x=>x.length>2&&!STOP.has(x));}
function overlap(a,b){const A=new Set(tokens(a)),B=new Set(tokens(b));if(!A.size||!B.size)return 0;let n=0;for(const x of A)if(B.has(x))n++;return n/Math.min(A.size,B.size);}
function median(values){const a=[...values].sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;}
function optionKey(value){const raw=String(value).toLocaleLowerCase('tr-TR').trim();return /[\d×÷+−*/]/.test(raw)?raw.replace(/\s+/g,''):normalize(raw);}
function numericSet(options){return options.every(x=>/^[-+]?\d+(?:[.,]\d+)?(?:\s*(?:°c|cm|m|kg|tl|%))?$/i.test(String(x).trim()));}
function labelSet(options){return options.every(x=>tokens(x).length<=3);}

export function auditChoiceIntegrity(round={}, context={}){
  const options=Array.isArray(round.options)?round.options.map(String):[];
  if(round.kind!=='choice'&&options.length===0)return {applicable:false,passed:true,score:100,errors:[],warnings:[],metrics:{}};
  const answerIndex=Number.isInteger(round.answerIndex)?round.answerIndex:options.indexOf(String(round.answerValue??round.answer??''));
  const answer=options[answerIndex]||'';
  const distractors=options.filter((_,i)=>i!==answerIndex);
  const errors=[],warnings=[];
  if(options.length!==4)errors.push('choice_option_count_not_four');
  if(answerIndex<0||answerIndex>=options.length)errors.push('choice_answer_index_invalid');
  if(new Set(options.map(optionKey)).size!==options.length)errors.push('choice_duplicate_options');
  if(errors.length)return {applicable:true,passed:false,score:0,errors,warnings,metrics:{}};

  const quantitative=numericSet(options);
  const compactLabels=labelSet(options);
  const answerWords=tokens(answer).length;
  const distractorWords=distractors.map(x=>tokens(x).length);
  const medianDistractor=Math.max(1,median(distractorWords));
  const lengthRatio=answerWords/medianDistractor;
  const absoluteDistractors=distractors.filter(x=>ABSOLUTE.test(x)).length;
  const answerAbsolute=ABSOLUTE.test(answer);
  const stem=`${round.context||''} ${round.prompt||''}`;
  const relevance=distractors.map(x=>Math.max(overlap(x,stem),overlap(x,answer)));
  const answerRelevance=overlap(answer,stem);
  const irrelevantCount=relevance.filter(x=>x<.07).length;

  if(!quantitative&&!compactLabels&&answerWords>=6&&lengthRatio>1.55)errors.push('correct_answer_length_beacon');
  if(!quantitative&&absoluteDistractors>=2&&!answerAbsolute)errors.push('absolute_word_elimination_pattern');
  const titleQuestion=/başlık/i.test(String(round.prompt||''));
  if(!titleQuestion&&!quantitative&&!compactLabels&&answerWords>=5&&answerRelevance>.12&&irrelevantCount>=2)errors.push('multiple_semantically_irrelevant_distractors');
  const wordSpread=Math.max(answerWords,...distractorWords)-Math.min(answerWords,...distractorWords);
  if(!quantitative&&!compactLabels&&wordSpread>10)warnings.push('option_word_count_spread');
  if(distractors.every(x=>overlap(x,answer)<.04)&&!quantitative&&!compactLabels)warnings.push('distractors_lexically_remote');

  const penalty=errors.length*30+warnings.length*8;
  return {applicable:true,passed:errors.length===0,score:Math.max(0,100-penalty),errors,warnings,metrics:{answerWords,medianDistractorWords:medianDistractor,lengthRatio:Number(lengthRatio.toFixed(2)),absoluteDistractors,irrelevantCount,answerRelevance:Number(answerRelevance.toFixed(2)),quantitative,compactLabels}};
}

export function attachChoiceIntegrity(round,context={}){
  const report=auditChoiceIntegrity(round,context);
  return {...round,choiceIntegrity:report,choiceIntegrityStatus:report.passed?'PASS':'BLOCK'};
}
