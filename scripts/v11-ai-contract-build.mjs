import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const catalog=JSON.parse(fs.readFileSync(new URL('content/v11/question-blueprints.v11.json',root),'utf8'));
const contracts=catalog.blueprints.map(b=>({
  schemaVersion:'11.0.0',
  contractId:`AI_${b.skeletonId}`,
  blueprintId:b.blueprintId,
  skeletonId:b.skeletonId,
  familyId:b.familyId,
  systemInstruction:[
    'Türkçe, ölçülebilir ve tek doğru cevaplı bir bilişsel soru üret.',
    `Yalnız ${b.skeletonId} bilişsel iskeletini uygula; başka iskelet mantığına kayma.`,
    'Çıktıyı yalnız geçerli JSON olarak ver; açıklama, markdown veya kod bloğu ekleme.',
    'Metin, kanıt, doğru cevap ve çeldiriciler birbirleriyle izlenebilir olmalıdır.'
  ].join(' '),
  generationInstruction:{
    visibleNameTr:b.identity.visibleNameTr,
    targetSkill:b.questionContract.targetSkill,
    cognitiveOperationSequence:b.questionContract.cognitiveOperationSequence,
    sourceStructure:b.sourceContract.textStructure,
    sourceCount:b.sourceContract.allowedSourceCount,
    evidenceCount:b.evidenceContract.evidenceCount,
    correctAnswerLogic:b.questionContract.correctAnswerLogic,
    difficultyLevels:b.difficultyContract.levels.map(x=>({level:x.level,code:x.code,rule:x.transformationRule})),
    variationAxes:b.variationContract.realVariationAxes,
    forbiddenCosmeticVariations:b.variationContract.forbiddenCosmeticOnlyVariations,
    rejectReasons:b.qualityGate.rejectReasons
  },
  distractorInstruction:b.optionContract.distractors.map(d=>({
    optionRole:d.optionRole,
    misconceptionId:d.misconceptionId,
    misconception:d.misconception,
    requirements:['Yanlış ama makul olmalı','Diğer çeldiricilerden farklı bir düşünme hatasını temsil etmeli','Doğru cevabı biçim veya uzunlukla ele vermemeli']
  })),
  outputContract:{
    format:'STRICT_JSON',
    additionalPropertiesAllowed:false,
    required:['contractId','skeletonId','difficulty','variationAxis','source','prompt','options','correctIndex','explanation','evidenceMap','optionDiagnostics','qualitySelfCheck'],
    optionCount:4,
    correctOptionCount:1,
    fields:{
      contractId:'string',skeletonId:'string',difficulty:'integer:1..3',variationAxis:'string',source:'string|string[]',prompt:'string',options:'string[4]',correctIndex:'integer:0..3',explanation:'string',
      evidenceMap:'{evidenceUnits:[{evidenceId,text,sourceIndex?}],correctAnswerEvidenceIds:string[]}',
      optionDiagnostics:'[{optionIndex,isCorrect,misconceptionId|null,evidenceIds:string[]}]',
      qualitySelfCheck:'{oneBestAnswer,noAnswerLeak,skeletonLogicPreserved,distinctMisconceptions,realVariationUsed}'
    }
  },
  hardRules:{
    oneBestAnswer:true,
    answerLeakForbidden:true,
    exactOptionCount:4,
    distinctMisconceptionsRequired:true,
    correctAnswerEvidenceRequired:true,
    sourceMustBeNecessary:true,
    cosmeticVariationOnlyForbidden:true,
    skeletonLogicMustBePreserved:true
  }
}));
const out={version:'11.0.0-stage10',generatedAt:new Date().toISOString(),sourceBlueprintVersion:catalog.version,contractCount:contracts.length,familyCount:new Set(contracts.map(x=>x.familyId)).size,contracts};
fs.writeFileSync(new URL('content/v11/ai-generation-contracts.v11.json',root),JSON.stringify(out,null,2)+'\n');
console.log(`V11 AI Contract Build: ${out.contractCount} sözleşme • ${out.familyCount} aile`);
