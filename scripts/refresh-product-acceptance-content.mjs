#!/usr/bin/env node
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { runContentReviewSamples, evaluateProductAcceptanceDecision } from '../js/quality/product-acceptance-audit.js';

mkdirSync('quality-reports/product-acceptance', { recursive: true });
const contentReview = runContentReviewSamples();
writeFileSync('quality-reports/product-acceptance/content-review-samples.json', `${JSON.stringify(contentReview, null, 2)}\n`);

const annual = JSON.parse(readFileSync('quality-reports/product-acceptance/annual-student.json', 'utf8'));
const class30 = JSON.parse(readFileSync('quality-reports/product-acceptance/class-30.json', 'utf8'));
const perceived = JSON.parse(readFileSync('quality-reports/product-acceptance/perceived-diversity.json', 'utf8'));
const index = JSON.parse(readFileSync('FINAL_EVIDENCE_INDEX.json', 'utf8'));

const decision = evaluateProductAcceptanceDecision({
  technicalEvidenceAdequacy: index.finalEvidenceAdequacy,
  annual,
  class30,
  perceived,
  contentReview
});
decision.updatedAt = new Date().toISOString();
decision.reports = {
  annualStudent: 'quality-reports/product-acceptance/annual-student.json',
  class30: 'quality-reports/product-acceptance/class-30.json',
  perceivedDiversity: 'quality-reports/product-acceptance/perceived-diversity.json',
  contentReviewSamples: 'quality-reports/product-acceptance/content-review-samples.json'
};
decision.nextExactCommand = decision.decision === 'PASS' ? null : 'node scripts/run-product-acceptance-audit.mjs';
writeFileSync('PRODUCT_ACCEPTANCE_DECISION.json', `${JSON.stringify(decision, null, 2)}\n`);

const analysis = JSON.parse(readFileSync('public/question-engine-analysis.json', 'utf8'));
analysis.productAcceptance = {
  decision: decision.decision,
  productReady: decision.productReady,
  dimensions: decision.dimensions,
  technicalQualityScoreLabel: 'Teknik Kalite Puanı',
  note: decision.note,
  failureHighlights: decision.failureHighlights,
  reports: decision.reports,
  updatedAt: decision.updatedAt
};
analysis.productReady = decision.productReady === true;
analysis.technicalQualityScorePercent = analysis.overallQualityScorePercent;
writeFileSync('public/question-engine-analysis.json', `${JSON.stringify(analysis, null, 2)}\n`);

writeFileSync('md/arsiv/CONTEXT_SNAPSHOT.md', `# CONTEXT_SNAPSHOT

**Guncelleme:** ${decision.updatedAt} · **Mevcut asama:** 15 — Final kabul (teknik) · **PRODUCT_ACCEPTANCE:** ${decision.decision}

## Final kanit yeterliligi (teknik): ${index.finalEvidenceAdequacy}
Stage 14 teknik PASS, yillik urun kabulu degildir.

## Urun kabul boyutlari
| Boyut | Sonuc |
|-------|-------|
| Teknik kalite | ${decision.dimensions.technicalQuality} |
| Yillik ogrenci kapasitesi | ${decision.dimensions.annualStudentCapacity} |
| 30 kisilik sinif kapasitesi | ${decision.dimensions.class30Capacity} |
| Algilanan cesitlilik | ${decision.dimensions.perceivedDiversity} |
| Gercek icerik inceleme | ${decision.dimensions.contentReview} |

## Urun Hazir: ${decision.productReady ? 'EVET' : 'HAYIR'}

## Raporlar
- annual: quality-reports/product-acceptance/annual-student.json
- class30: quality-reports/product-acceptance/class-30.json
- perceived: quality-reports/product-acceptance/perceived-diversity.json
- content: quality-reports/product-acceptance/content-review-samples.json
- decision: PRODUCT_ACCEPTANCE_DECISION.json

## Basarisiz kapilar
\`\`\`json
${JSON.stringify(decision.failureHighlights, null, 2)}
\`\`\`

## Sonraki kesin komut
${decision.nextExactCommand ? `\`${decision.nextExactCommand}\`` : 'Yok (PRODUCT_ACCEPTANCE PASS).'}
`);

console.log(JSON.stringify({
  decision: decision.decision,
  productReady: decision.productReady,
  dimensions: decision.dimensions,
  contentGates: contentReview.gates,
  incomplete: contentReview.summary.incompleteFieldCount
}, null, 2));
process.exit(decision.decision === 'PASS' ? 0 : 2);
