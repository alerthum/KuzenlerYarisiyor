import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const inv = JSON.parse(fs.readFileSync('quality-reports/V11_CONTENT_INVENTORY.json','utf8'));
const map = JSON.parse(fs.readFileSync('quality-reports/V11_SKELETON_MAPPING_SUGGESTIONS.json','utf8'));

test('V11 Aşama 2 içerik envanteri gerçek JS kaynaklarını tarar', () => {
  assert.ok(inv.totals.sourceFiles >= 10);
  assert.ok(inv.records.some((r) => r.sourceFile.includes('paragraph-engine-v4.js')));
});

test('envanter kayıtları kaynak dosya ve kaynak türü taşır', () => {
  for (const record of inv.records) {
    assert.equal(typeof record.sourceFile, 'string');
    assert.ok(['support','static-pool','dynamic-generator','mixed'].includes(record.sourceType));
  }
});

test('otomatik iskelet eşleştirmeleri insan onayı zorunluluğu taşır', () => {
  assert.ok(map.mappings.length > 0);
  assert.ok(map.mappings.every((m) => m.humanApprovalRequired === true));
});

test('eşleşme önerileri yalnız mevcut V11 kimlik biçimini kullanır', () => {
  for (const item of map.mappings.filter((m) => m.proposedSkeletonId)) {
    assert.match(item.proposedSkeletonId, /^[A-Z_]+_\d{2}$/);
  }
});
