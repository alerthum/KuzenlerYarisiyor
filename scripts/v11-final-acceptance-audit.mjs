import fs from 'node:fs';
import { getV11AiContract, buildV11AiGenerationPrompt, validateV11AiOutput } from '../js/engines/v11-ai-generation-contract.js';
import { decideV11Publication } from '../js/engines/v11-publication-gate.js';
import { diagnoseV11ChoiceResponse, updateV11MisconceptionProfile } from '../js/engines/v11-misconception-profile.js';
import { attachV11SilentRemediation } from '../js/engines/v11-misconception-remediation.js';
import { buildV11MisconceptionDevelopmentReport } from '../js/engines/v11-misconception-report.js';
import { composeV11Session } from '../js/engines/v11-session-composer.js';

const contracts=JSON.parse(fs.readFileSync(new URL('../content/v11/ai-generation-contracts.v11.json',import.meta.url),'utf8'));
const skeletons=JSON.parse(fs.readFileSync(new URL('../content/v11/cognitive-skeletons.v11.json',import.meta.url),'utf8'));
const blueprints=JSON.parse(fs.readFileSync(new URL('../content/v11/question-blueprints.v11.json',import.meta.url),'utf8'));
const contract=getV11AiContract(contracts,'INFO_SECME_01');
const output={
 contractId:contract.contractId,skeletonId:contract.skeletonId,difficulty:2,variationAxis:contract.generationInstruction.variationAxes[0],
 source:'Arılar, yiyecek kaynağının yönünü ve uzaklığını kovandaki diğer arılara özel dans hareketleriyle aktarır.',
 prompt:'Metne göre arılar yiyecek kaynağına ilişkin yön bilgisini nasıl paylaşır?',
 options:['Özel dans hareketleriyle paylaşır.','Kovana farklı bir koku bırakarak paylaşır.','Vücut rengini değiştirerek paylaşır.','Kanat sesini tamamen keserek paylaşır.'],correctIndex:0,
 explanation:'Metindeki E1 kanıtı yön ve uzaklık bilgisinin özel dans hareketleriyle aktarıldığını açıkça belirtir.',
 evidenceMap:{evidenceUnits:[{evidenceId:'E1',text:'yönünü ve uzaklığını özel dans hareketleriyle aktarır'}],correctAnswerEvidenceIds:['E1']},
 optionDiagnostics:[
  {optionIndex:0,isCorrect:true,misconceptionId:null,evidenceIds:['E1']},
  {optionIndex:1,isCorrect:false,misconceptionId:'INFO_SECME_01_M1',misconception:'Metinde bulunmayan ayrıntıyı doğru kabul etme',evidenceIds:[]},
  {optionIndex:2,isCorrect:false,misconceptionId:'INFO_SECME_01_M2',misconception:'Yüzeysel çağrışımı kanıt sanma',evidenceIds:[]},
  {optionIndex:3,isCorrect:false,misconceptionId:'INFO_SECME_01_M3',misconception:'İlgisiz ayrıntıyı hedef bilgiyle karıştırma',evidenceIds:[]}],
 qualitySelfCheck:{oneBestAnswer:true,noAnswerLeak:true,skeletonLogicPreserved:true,distinctMisconceptions:true,realVariationUsed:true}
};
const prompt=buildV11AiGenerationPrompt(contract,{difficulty:2,topic:'arıların iletişimi'});
const validation=validateV11AiOutput(output,contract);
const gate=decideV11Publication({output,catalog:contracts,source:'V11_FINAL_AUDIT'});
const round={...output,questionKey:'final-q1',questionFamilyId:'final-family',skeletonFamilyId:'INFO_SECME'};
const diagnosis=diagnoseV11ChoiceResponse(round,1,false);
const state={misconceptionProfiles:{}};
const attempt={profileId:'final-profile',questionKey:'final-q1',questionFamilyId:'final-family',correct:false,answeredAt:'2026-07-30T10:00:00.000Z',...diagnosis};
updateV11MisconceptionProfile(state,attempt);
const attempts=[attempt,{...attempt,questionKey:'final-q2',answeredAt:'2026-07-30T10:01:00.000Z'}];
const remediation=attachV11SilentRemediation([round,{...round,questionKey:'final-q3'}],attempts);
const session=composeV11Session(remediation.rounds,{targetCount:2,misconceptionInterventions:remediation.interventions});
const report=buildV11MisconceptionDevelopmentReport(attempts,{windowSize:4});
const errors=[];
if((skeletons.skeletons||skeletons).length!==40) errors.push('SKELETON_COUNT');
if((blueprints.blueprints||blueprints).length!==40) errors.push('BLUEPRINT_COUNT');
if(contracts.contracts.length!==40) errors.push('CONTRACT_COUNT');
if(!prompt.includes(contract.contractId)) errors.push('PROMPT_CONTRACT_LINK');
if(!validation.accepted) errors.push('AI_OUTPUT_VALIDATION');
if(gate.decision!=='PUBLISH'||!gate.publishable) errors.push('PUBLICATION_GATE');
if(diagnosis.diagnosticStatus!=='MISCONCEPTION_CAPTURED') errors.push('DIAGNOSIS');
if(state.misconceptionProfiles['final-profile']?.totalDiagnosedErrors!==1) errors.push('PROFILE_PERSISTENCE');
if(remediation.audit.attachedRoundCount<1) errors.push('SILENT_REMEDIATION');
if(session.audit.forbiddenViolationCount!==0) errors.push('SESSION_COMPOSER');
if(report.diagnosedErrorCount!==2||report.distinctMisconceptionCount!==1) errors.push('DEVELOPMENT_REPORT');
const result={
 release:'11.0.0',status:errors.length?'FAIL':'PASS',generatedAt:new Date().toISOString(),
 counts:{skeletons:40,blueprints:40,aiContracts:40,publishedFixture:gate.publishable?1:0,diagnosedAttempts:report.diagnosedErrorCount,remediationRounds:remediation.audit.attachedRoundCount},
 pipeline:['cognitive-skeleton','question-blueprint','ai-contract','strict-validation','publication-gate','session-composer','response-diagnosis','misconception-profile','silent-remediation','development-report'],
 errors
};
fs.mkdirSync(new URL('../quality-reports/',import.meta.url),{recursive:true});
fs.writeFileSync(new URL('../quality-reports/V11_FINAL_ACCEPTANCE.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log('V11 Final Acceptance Audit');
console.log(`40 iskelet • 40 blueprint • 40 AI sözleşmesi`);
console.log(`Uçtan uca zincir: ${result.pipeline.length} adım`);
console.log(`Yayın kararı: ${gate.decision} • Tanılanmış hata: ${report.diagnosedErrorCount} • Telafi turu: ${remediation.audit.attachedRoundCount}`);
console.log(`Sonuç: ${result.status}`);
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
