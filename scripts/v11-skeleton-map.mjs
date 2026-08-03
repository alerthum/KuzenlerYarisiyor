import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const inventoryPath = path.join(ROOT, 'quality-reports', 'V11_CONTENT_INVENTORY.json');
const skeletonPath = path.join(ROOT, 'content', 'v11', 'cognitive-skeletons.v11.json');
if (!fs.existsSync(inventoryPath)) throw new Error('Önce npm run v11:inventory çalıştırılmalı.');

const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
const skeletonDoc = JSON.parse(fs.readFileSync(skeletonPath, 'utf8'));
const skeletons = Array.isArray(skeletonDoc) ? skeletonDoc : (skeletonDoc.skeletons || []);
const ids = new Set(skeletons.map((s) => s.skeletonId || s.id));

const rules = [
  [/sequence|chronolog|olay-sırası|event-sequence/i, 'INFO_SECME_04'],
  [/meaning|deyim|mecaz|context-meaning|word-meaning/i, 'BAGLAM_ANLAM_01'],
  [/reference|zamir|gönderim/i, 'BAGLAM_ANLAM_02'],
  [/emotion|duygu|atmosfer/i, 'BAGLAM_ANLAM_03'],
  [/blank|transition|bağlaç|akış/i, 'BAGLAM_ANLAM_04'],
  [/experiment|evidence|kanıt|inference|çıkarım/i, 'KANIT_BIRLESTIRME_02'],
  [/rule|condition|constraint|koşul/i, 'KANIT_BIRLESTIRME_03'],
  [/main-idea|ana-fikir|mainidea/i, 'METIN_AMACI_01'],
  [/purpose|amaç|author-intent/i, 'METIN_AMACI_02'],
  [/irrelevant|gereksiz|akışı-bozan/i, 'METIN_YAPISI_02'],
  [/source|reliab|güvenilir|sponsor|authority/i, 'GUVENILIRLIK_02'],
  [/compare|contrast|çeliş|agreement/i, 'CELISKI_KARSILASTIRMA_01'],
  [/table|chart|graph|visual|tablo|görsel/i, 'INFO_SECME_05'],
  [/multi-source|synthesis|sentez/i, 'SENTEZ_COKLU_01']
];

function guess(value) {
  const text = String(value || '');
  for (const [re, id] of rules) if (re.test(text) && ids.has(id)) return { skeletonId: id, confidence: 0.72, basis: re.source };
  return { skeletonId: null, confidence: 0, basis: 'NO_RULE' };
}

const mappings = [];
for (const rec of inventory.records) {
  for (const currentId of [...rec.familyIds, ...rec.factoryIds]) {
    const g = guess(`${currentId} ${rec.sourceFile}`);
    mappings.push({
      sourceFile: rec.sourceFile,
      currentFamilyId: currentId,
      proposedSkeletonId: g.skeletonId,
      matchConfidence: g.confidence,
      mappingBasis: g.basis,
      decision: g.skeletonId ? 'REVIEW_MAPPING' : 'UNMATCHED',
      humanApprovalRequired: true
    });
  }
}

const report = {
  schemaVersion: '11.0.0-stage2',
  generatedAt: new Date().toISOString(),
  warning: 'Bu çıktı otomatik öneridir. Bir soru veya aile, insan incelemesi olmadan V11 iskeletine atanmaz.',
  totals: {
    candidates: mappings.length,
    proposed: mappings.filter((m) => m.proposedSkeletonId).length,
    unmatched: mappings.filter((m) => !m.proposedSkeletonId).length,
    usedSkeletons: new Set(mappings.map((m) => m.proposedSkeletonId).filter(Boolean)).size
  },
  mappings
};
fs.writeFileSync(path.join(ROOT, 'quality-reports', 'V11_SKELETON_MAPPING_SUGGESTIONS.json'), JSON.stringify(report, null, 2));
console.log(`V11 Skeleton Map: ${report.totals.candidates} aday • ${report.totals.proposed} öneri • ${report.totals.unmatched} eşleşmeyen`);
