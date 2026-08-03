import fs from 'node:fs';
import path from 'node:path';
import { analyzeStudentPilot } from '../js/assessment-v2/item-analysis-engine.js';
import { assessmentV2PilotItemDescriptors } from '../js/assessment-v2/student-pilot-fixture.js';
import { evaluateStudentPilotPublicationGate } from '../js/assessment-v2/student-pilot-publication-gate.js';

const input=process.argv[2];
if(!input){console.error('Kullanım: node scripts/analyze-assessment-v2-student-pilot.mjs <responses.json> [output.json]');process.exit(2);}
const raw=JSON.parse(fs.readFileSync(path.resolve(input),'utf8'));
const responses=Array.isArray(raw)?raw:raw.responses;
if(!Array.isArray(responses))throw new Error('JSON responses dizisi içermelidir.');
const pilotId=raw.pilotId||responses[0]?.pilotId||'ASSESSMENT_V2_IMPORTED_PILOT';
const analysis=analyzeStudentPilot({pilotId,responses,itemDescriptors:assessmentV2PilotItemDescriptors()});
const gate=evaluateStudentPilotPublicationGate({analysis,humanReviewApproved:true,semanticRoundTripPassed:true});
const report={schemaVersion:'1.0',generatedAt:new Date().toISOString(),analysis,publicationGate:gate,productReady:false};
const output=path.resolve(process.argv[3]||'quality-reports/assessment-v2-student-pilot-import-analysis.json');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2));
console.log(JSON.stringify({status:analysis.status,evidenceType:analysis.evidenceType,participants:analysis.metrics.participantCount,responses:analysis.metrics.responseCount,publicationAllowed:gate.publicationAllowed,blockers:gate.blockers,output},null,2));
if(analysis.errors.length)process.exit(1);
