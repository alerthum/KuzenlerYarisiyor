// V11 Stage 10: iskelete özel AI üretim talimatı ve katı JSON çıktı doğrulaması.
export function getV11AiContract(catalog,skeletonId){
  const list=Array.isArray(catalog)?catalog:catalog?.contracts;
  if(!Array.isArray(list)) throw new TypeError('V11 AI sözleşme kataloğu geçersiz.');
  const contract=list.find(x=>x.skeletonId===skeletonId);
  if(!contract) throw new Error(`V11 AI sözleşmesi bulunamadı: ${skeletonId}`);
  return contract;
}

export function buildV11AiGenerationPrompt(contract,{difficulty=2,variationAxis,topic='yaşa uygun özgün bir konu'}={}){
  if(!contract?.contractId) throw new TypeError('Geçerli bir V11 AI sözleşmesi gereklidir.');
  const level=contract.generationInstruction.difficultyLevels.find(x=>x.level===difficulty);
  if(!level) throw new RangeError(`Geçersiz zorluk seviyesi: ${difficulty}`);
  const axes=contract.generationInstruction.variationAxes||[];
  const axis=variationAxis||axes[0];
  if(!axes.includes(axis)) throw new Error(`Sözleşme dışı varyasyon ekseni: ${axis}`);
  return [
    contract.systemInstruction,
    `SÖZLEŞME: ${contract.contractId}`,
    `İSKELET: ${contract.skeletonId} / ${contract.generationInstruction.visibleNameTr}`,
    `HEDEF BECERİ: ${contract.generationInstruction.targetSkill}`,
    `KONU: ${topic}`,
    `ZORLUK: ${level.level}-${level.code}; KURAL: ${level.rule}`,
    `VARYASYON EKSENİ: ${axis}`,
    `KAYNAK YAPISI: ${contract.generationInstruction.sourceStructure}; kaynak sayısı ${contract.generationInstruction.sourceCount.min}-${contract.generationInstruction.sourceCount.max}`,
    `DOĞRU CEVAP MANTIĞI: ${contract.generationInstruction.correctAnswerLogic}`,
    `ÇELDİRİCİLER: ${contract.distractorInstruction.map(x=>`${x.misconceptionId}: ${x.misconception}`).join(' | ')}`,
    `RET NEDENLERİ: ${contract.generationInstruction.rejectReasons.join(' | ')}`,
    `ZORUNLU ALANLAR: ${contract.outputContract.required.join(', ')}`,
    'Yalnız JSON nesnesi döndür.'
  ].join('\n');
}

export function parseV11AiJson(raw){
  if(typeof raw!=='string') throw new TypeError('AI çıktısı metin olmalıdır.');
  const text=raw.trim();
  if(text.startsWith('```')||text.endsWith('```')) throw new Error('MARKDOWN_WRAPPER_FORBIDDEN');
  try{return JSON.parse(text);}catch{throw new Error('INVALID_JSON_OUTPUT');}
}

export function validateV11AiOutput(output,contract){
  const errors=[];
  if(!output||typeof output!=='object'||Array.isArray(output)) return {accepted:false,errors:['OUTPUT_OBJECT_REQUIRED']};
  const required=contract.outputContract.required||[];
  for(const key of required) if(!(key in output)) errors.push(`FIELD_MISSING:${key}`);
  const allowed=new Set(required);
  if(contract.outputContract.additionalPropertiesAllowed===false){
    for(const key of Object.keys(output)) if(!allowed.has(key)) errors.push(`UNKNOWN_FIELD:${key}`);
  }
  if(output.contractId!==contract.contractId) errors.push('CONTRACT_ID_MISMATCH');
  if(output.skeletonId!==contract.skeletonId) errors.push('SKELETON_ID_MISMATCH');
  if(!Number.isInteger(output.difficulty)||output.difficulty<1||output.difficulty>3) errors.push('DIFFICULTY_INVALID');
  if(!contract.generationInstruction.variationAxes.includes(output.variationAxis)) errors.push('VARIATION_AXIS_INVALID');
  const sourceCount=Array.isArray(output.source)?output.source.length:(typeof output.source==='string'&&output.source.trim()?1:0);
  const sc=contract.generationInstruction.sourceCount;
  if(sourceCount<sc.min||sourceCount>sc.max) errors.push('SOURCE_COUNT_INVALID');
  if(!Array.isArray(output.options)||output.options.length!==4||output.options.some(x=>typeof x!=='string'||!x.trim())) errors.push('OPTIONS_INVALID');
  if(!Number.isInteger(output.correctIndex)||output.correctIndex<0||output.correctIndex>3) errors.push('CORRECT_INDEX_INVALID');
  const units=output.evidenceMap?.evidenceUnits;
  const evidenceIds=new Set(Array.isArray(units)?units.map(x=>x?.evidenceId).filter(Boolean):[]);
  if(!Array.isArray(units)||units.length<contract.generationInstruction.evidenceCount.min) errors.push('EVIDENCE_COUNT_INVALID');
  const correctIds=output.evidenceMap?.correctAnswerEvidenceIds;
  if(!Array.isArray(correctIds)||!correctIds.length||correctIds.some(id=>!evidenceIds.has(id))) errors.push('CORRECT_EVIDENCE_INVALID');
  const diagnostics=output.optionDiagnostics;
  if(!Array.isArray(diagnostics)||diagnostics.length!==4) errors.push('OPTION_DIAGNOSTICS_INVALID');
  else {
    const indices=new Set(diagnostics.map(x=>x?.optionIndex));
    if(indices.size!==4||![0,1,2,3].every(x=>indices.has(x))) errors.push('OPTION_DIAGNOSTIC_INDICES_INVALID');
    const correct=diagnostics.filter(x=>x?.isCorrect===true);
    if(correct.length!==1||correct[0].optionIndex!==output.correctIndex) errors.push('CORRECT_DIAGNOSTIC_INVALID');
    const expected=new Set(contract.distractorInstruction.map(x=>x.misconceptionId));
    const actual=new Set(diagnostics.filter(x=>x?.isCorrect===false).map(x=>x?.misconceptionId));
    if(expected.size!==actual.size||[...expected].some(x=>!actual.has(x))) errors.push('MISCONCEPTION_SET_INVALID');
  }
  const checks=output.qualitySelfCheck;
  if(!checks||['oneBestAnswer','noAnswerLeak','skeletonLogicPreserved','distinctMisconceptions','realVariationUsed'].some(k=>checks[k]!==true)) errors.push('QUALITY_SELF_CHECK_FAILED');
  if(typeof output.prompt!=='string'||!output.prompt.trim()) errors.push('PROMPT_MISSING');
  if(typeof output.explanation!=='string'||!output.explanation.trim()) errors.push('EXPLANATION_MISSING');
  return {accepted:errors.length===0,contractId:contract.contractId,skeletonId:contract.skeletonId,errors};
}
