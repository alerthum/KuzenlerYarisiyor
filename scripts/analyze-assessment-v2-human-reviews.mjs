import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditHumanReviewDecisions } from '../js/assessment-v2/human-review-decision-contract.js';
import { buildHumanReviewBatch, auditHumanReviewBatch } from '../js/assessment-v2/human-review-batch.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inputArg=process.argv[2];
if(!inputArg){
  console.error('Kullanım: node scripts/analyze-assessment-v2-human-reviews.mjs <kararlar.json> [cikti.json]');
  process.exit(2);
}
const inputPath=path.resolve(process.cwd(),inputArg);
const outputPath=path.resolve(process.cwd(),process.argv[3]||'quality-reports/assessment-engine-v2-phase4p-human-review-consensus.json');
const raw=JSON.parse(fs.readFileSync(inputPath,'utf8'));
const decisions=Array.isArray(raw)?raw:(raw.decisions||[]);
const decisionAudit=auditHumanReviewDecisions(decisions);
const batch=buildHumanReviewBatch({decisions:decisionAudit.rows});
const batchAudit=auditHumanReviewBatch(batch);
const report={
  schemaVersion:'1.0',
  generatedAt:new Date().toISOString(),
  inputFile:path.relative(root,inputPath),
  status:decisionAudit.ok&&batchAudit.ok?'HUMAN_REVIEW_CONSENSUS_COMPUTED':'HUMAN_REVIEW_INPUT_REJECTED',
  productReady:false,
  publicationAllowed:false,
  decisionAudit,
  batchAudit,
  consensus:batch.consensus
};
fs.mkdirSync(path.dirname(outputPath),{recursive:true});
fs.writeFileSync(outputPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,output:outputPath,metrics:batch.consensus.metrics,errors:[...decisionAudit.errors,...batchAudit.errors]},null,2));
if(!decisionAudit.ok||!batchAudit.ok)process.exitCode=1;
