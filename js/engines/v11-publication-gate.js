import { getV11AiContract, parseV11AiJson, validateV11AiOutput } from './v11-ai-generation-contract.js';

export const V11_PUBLICATION_DECISIONS=Object.freeze({PUBLISH:'PUBLISH',REVIEW:'REVIEW',QUARANTINE:'QUARANTINE',REJECT:'REJECT'});

const HARD_REJECT_CODES=new Set(['UNKNOWN_CONTRACT','CONTRACT_ID_MISMATCH','SKELETON_ID_MISMATCH']);
const REVIEW_WARNING_CODES=new Set(['SOURCE_TOO_SHORT','PROMPT_TOO_SHORT','EXPLANATION_TOO_SHORT','OPTION_LENGTH_IMBALANCE','EVIDENCE_TEXT_TOO_SHORT']);

function textLength(value){return typeof value==='string'?value.trim().length:0;}
function normalizeSource(source){return Array.isArray(source)?source.join(' '):String(source||'');}

export function inspectV11PublicationWarnings(output){
  const warnings=[];
  const source=normalizeSource(output?.source);
  if(textLength(source)<45) warnings.push('SOURCE_TOO_SHORT');
  if(textLength(output?.prompt)<18) warnings.push('PROMPT_TOO_SHORT');
  if(textLength(output?.explanation)<24) warnings.push('EXPLANATION_TOO_SHORT');
  const options=Array.isArray(output?.options)?output.options:[];
  if(options.length===4){
    const lengths=options.map(textLength);
    const max=Math.max(...lengths),min=Math.min(...lengths);
    if(max>0&&min>0&&max/min>3.5) warnings.push('OPTION_LENGTH_IMBALANCE');
    if(new Set(options.map(x=>x.trim().toLocaleLowerCase('tr-TR'))).size!==4) warnings.push('DUPLICATE_OPTIONS');
  }
  const evidence=output?.evidenceMap?.evidenceUnits;
  if(Array.isArray(evidence)&&evidence.some(x=>textLength(x?.text)<8)) warnings.push('EVIDENCE_TEXT_TOO_SHORT');
  return [...new Set(warnings)];
}

export function decideV11Publication({rawOutput,output,catalog,source='AI',generatedAt=new Date().toISOString()}={}){
  let parsed=output;
  const errors=[];
  if(parsed==null){
    try{parsed=parseV11AiJson(rawOutput);}catch(error){
      const code=error?.message||'OUTPUT_PARSE_FAILED';
      return buildDecision(V11_PUBLICATION_DECISIONS.QUARANTINE,{errors:[code],warnings:[],output:null,contract:null,source,generatedAt});
    }
  }
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)){
    return buildDecision(V11_PUBLICATION_DECISIONS.QUARANTINE,{errors:['OUTPUT_OBJECT_REQUIRED'],warnings:[],output:parsed,contract:null,source,generatedAt});
  }
  const contractId=parsed.contractId;
  const skeletonId=parsed.skeletonId;
  let contract;
  try{
    const contracts=Array.isArray(catalog)?catalog:catalog?.contracts;
    contract=contracts?.find(x=>x.contractId===contractId);
    if(!contract&&skeletonId) contract=getV11AiContract(catalog,skeletonId);
  }catch{}
  if(!contract){
    return buildDecision(V11_PUBLICATION_DECISIONS.REJECT,{errors:['UNKNOWN_CONTRACT'],warnings:[],output:parsed,contract:null,source,generatedAt});
  }
  const validation=validateV11AiOutput(parsed,contract);
  errors.push(...validation.errors);
  if(errors.length){
    const hard=errors.some(code=>HARD_REJECT_CODES.has(code));
    return buildDecision(hard?V11_PUBLICATION_DECISIONS.REJECT:V11_PUBLICATION_DECISIONS.QUARANTINE,{errors,warnings:[],output:parsed,contract,source,generatedAt});
  }
  const warnings=inspectV11PublicationWarnings(parsed);
  const requiresHumanReview=warnings.some(code=>REVIEW_WARNING_CODES.has(code));
  return buildDecision(requiresHumanReview?V11_PUBLICATION_DECISIONS.REVIEW:V11_PUBLICATION_DECISIONS.PUBLISH,{errors:[],warnings,output:parsed,contract,source,generatedAt});
}

function buildDecision(decision,{errors,warnings,output,contract,source,generatedAt}){
  const publishable=decision===V11_PUBLICATION_DECISIONS.PUBLISH;
  return {
    gateVersion:'11.0.0-stage11',decision,publishable,
    requiresHumanReview:decision===V11_PUBLICATION_DECISIONS.REVIEW,
    quarantined:decision===V11_PUBLICATION_DECISIONS.QUARANTINE,
    rejected:decision===V11_PUBLICATION_DECISIONS.REJECT,
    contractId:contract?.contractId||output?.contractId||null,
    skeletonId:contract?.skeletonId||output?.skeletonId||null,
    errors:[...new Set(errors)],warnings:[...new Set(warnings)],source,generatedAt,
    fingerprint:createV11QuestionFingerprint(output),
    auditTrail:{validated:true,studentVisible:publishable,manualApprovalRequired:decision===V11_PUBLICATION_DECISIONS.REVIEW}
  };
}

export function createV11QuestionFingerprint(output){
  if(!output||typeof output!=='object') return null;
  const value=[output.contractId,output.skeletonId,normalizeSource(output.source),output.prompt,...(output.options||[])].join('|').toLocaleLowerCase('tr-TR');
  let hash=2166136261;
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return `v11q_${(hash>>>0).toString(16).padStart(8,'0')}`;
}

export function routeV11PublicationDecision(decision,queues={}){
  const key=decision.decision.toLowerCase();
  const target=queues[key]||(queues[key]=[]);
  target.push(decision);
  return queues;
}
