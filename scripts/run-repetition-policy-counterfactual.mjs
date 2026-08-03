#!/usr/bin/env node
/**
 * Eski (V1 lifetime CX) vs Yeni (Policy V2) targeted shard karşılaştırması.
 * Full strict başlatmaz. productReady değiştirmez.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCapacityShard } from '../js/quality/capacity-policy-shard-runner.js';
import { planCapacity, inventoryFromFamilies } from '../js/quality/capacity-planner.js';
import { LGS_FOUNDATION_FAMILIES } from '../js/content/families/lgs-foundation-families.js';
import { SCIENCE_REASONING_FAMILIES } from '../js/content/families/science-reasoning-families.js';
import { ERROR_DETECTIVE_FAMILIES } from '../js/content/families/error-detective-families.js';
import { GAME_CATALOG } from '../js/games/registry.js';
import {
  createEmptyLiveState,
  atomicWriteJson,
  pushRecentEvent
} from './lib/strict-audit-live-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'quality-reports', 'repetition-policy-counterfactual.json');
const livePath = path.join(root, 'public', 'strict-audit-live.json');
const devPath = path.join(root, 'quality-reports', 'capacity-development-live.json');

const SHARDS = [
  { gameId: 'lgs-foundation', grade: 8, age: 14, seedBase: 61001 },
  { gameId: 'science-reasoning', grade: 4, age: 10, seedBase: 62001 },
  { gameId: 'error-detective', grade: '6-8', age: 12, seedBase: 63001 }
];

const FAMILY_MAP = {
  'lgs-foundation': LGS_FOUNDATION_FAMILIES,
  'science-reasoning': SCIENCE_REASONING_FAMILIES,
  'error-detective': ERROR_DETECTIVE_FAMILIES
};

function writeDevLive(patch) {
  const prev = fs.existsSync(devPath)
    ? JSON.parse(fs.readFileSync(devPath, 'utf8'))
    : {};
  const next = {
    ...prev,
    ...patch,
    updatedAt: new Date().toISOString(),
    workName: 'CAPACITY POLICY V2 + BLUEPRINT RECOVERY'
  };
  fs.mkdirSync(path.dirname(devPath), { recursive: true });
  fs.writeFileSync(devPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');

  // Komuta Merkezi canlı kartı — audit ABORTED kalsın, geliştirme alanlarını doldur.
  let live = createEmptyLiveState();
  if (fs.existsSync(livePath)) {
    try {
      live = { ...live, ...JSON.parse(fs.readFileSync(livePath, 'utf8')) };
    } catch { /* keep empty */ }
  }
  live.status = live.status === 'RUNNING' || live.status === 'STARTING' ? live.status : 'ABORTED';
  live.workType = patch.workType || 'DEVELOPMENT';
  live.currentTask = patch.currentTask || null;
  live.rootCause = patch.rootCause || null;
  live.changedFiles = patch.changedFiles || [];
  live.previousFillRate = patch.previousFillRate ?? null;
  live.newFillRate = patch.newFillRate ?? null;
  live.previousUnderfill = patch.previousUnderfill ?? null;
  live.newUnderfill = patch.newUnderfill ?? null;
  live.capacityDeficit = patch.capacityDeficit ?? null;
  live.addedBlueprintCount = patch.addedBlueprintCount ?? 0;
  live.completedShard = patch.completedShard || null;
  live.nextShard = patch.nextShard || null;
  live.lastRealTestResult = patch.lastRealTestResult || null;
  live.lastActivityMessage = patch.currentTask || live.lastActivityMessage;
  live.phaseLabel = patch.workType || 'DEVELOPMENT';
  live.updatedAt = new Date().toISOString();
  live.lastHeartbeatAt = live.updatedAt;
  pushRecentEvent(live, 'INFO', patch.currentTask || 'Geliştirme güncellendi');
  atomicWriteJson(livePath, live);
}

function sessionLengthOf(gameId) {
  return GAME_CATALOG.find((g) => g.id === gameId)?.sessionLength || 5;
}

async function main() {
  writeDevLive({
    workType: 'DEVELOPMENT',
    currentTask: 'Repetition Policy V2 counterfactual shard’ları çalışıyor',
    rootCause: 'CX geçmişi süresiz/oyun bazlı tutuluyordu; akademik zaman ilerlemiyordu',
    changedFiles: [
      'js/quality/repetition-policy-v2.js',
      'js/games/registry.js',
      'js/quality/product-acceptance-audit.js',
      'js/quality/capacity-planner.js',
      'js/quality/capacity-policy-shard-runner.js'
    ],
    nextShard: `${SHARDS[0].gameId} / ${SHARDS[0].grade}`
  });

  const results = [];
  const capacityPlannerResults = [];

  for (let i = 0; i < SHARDS.length; i += 1) {
    const shard = SHARDS[i];
    writeDevLive({
      workType: 'DEVELOPMENT',
      currentTask: `Counterfactual: ${shard.gameId} / ${shard.grade} (V1 vs V2)`,
      completedShard: i > 0 ? `${SHARDS[i - 1].gameId}/${SHARDS[i - 1].grade}` : null,
      nextShard: `${shard.gameId} / ${shard.grade}`
    });

    console.log(`\n=== SHARD ${shard.gameId} grade=${shard.grade} ===`);
    const oldSingle = runCapacityShard({
      ...shard,
      sessions: 100,
      studentCount: 1,
      repetitionPolicyVersion: 'v1'
    });
    console.log('V1 single', oldSingle.pass, oldSingle.metrics.fillRate, oldSingle.metrics.underfillRate, oldSingle.failReasons);

    const newSingle = runCapacityShard({
      ...shard,
      sessions: 100,
      studentCount: 1,
      repetitionPolicyVersion: 'v2'
    });
    console.log('V2 single', newSingle.pass, newSingle.metrics.fillRate, newSingle.metrics.underfillRate, newSingle.failReasons);

    const oldClass = runCapacityShard({
      ...shard,
      sessions: 20,
      studentCount: 30,
      seedBase: shard.seedBase + 5000,
      repetitionPolicyVersion: 'v1'
    });
    const newClass = runCapacityShard({
      ...shard,
      sessions: 20,
      studentCount: 30,
      seedBase: shard.seedBase + 5000,
      repetitionPolicyVersion: 'v2'
    });
    console.log('V2 class30', newClass.pass, newClass.metrics.fillRate, newClass.metrics.underfillRate);

    const inv = inventoryFromFamilies(FAMILY_MAP[shard.gameId] || []);
    const plan = planCapacity({
      gameId: shard.gameId,
      gradeBand: shard.grade,
      sessionLength: sessionLengthOf(shard.gameId),
      usageShare: 1,
      annualSessionsPerStudent: 100
    }, inv);
    capacityPlannerResults.push(plan);

    results.push({
      shard: `${shard.gameId}/${shard.grade}`,
      gameId: shard.gameId,
      grade: shard.grade,
      oldPolicy: { singleStudent100: oldSingle, class30x20: oldClass },
      newPolicy: { singleStudent100: newSingle, class30x20: newClass },
      capacityPlan: plan,
      targetedPass: newSingle.pass && newClass.metrics.fillRate === 1 && newClass.metrics.underfillRate === 0
    });

    writeDevLive({
      workType: 'DEVELOPMENT',
      currentTask: `Shard bitti: ${shard.gameId}/${shard.grade}`,
      completedShard: `${shard.gameId}/${shard.grade}`,
      nextShard: SHARDS[i + 1] ? `${SHARDS[i + 1].gameId}/${SHARDS[i + 1].grade}` : 'Diagnostic Matrix',
      previousFillRate: oldSingle.metrics.fillRate,
      newFillRate: newSingle.metrics.fillRate,
      previousUnderfill: oldSingle.metrics.underfillRate,
      newUnderfill: newSingle.metrics.underfillRate,
      capacityDeficit: plan.capacityDeficit,
      lastRealTestResult: newSingle.pass ? 'PASS' : `FAIL:${(newSingle.failReasons || []).join(',')}`
    });
  }

  const doc = {
    schemaVersion: '1.0',
    workName: 'CAPACITY POLICY V2 + BLUEPRINT RECOVERY',
    generatedAt: new Date().toISOString(),
    note: 'Kalite eşikleri gevşetilmedi. Full strict yeniden başlatılmadı. productReady=false korunur.',
    diagnosisRef: 'quality-reports/capacity-policy-v1-diagnosis.json',
    shards: results,
    capacityPlannerResults,
    stageA: {
      allTargetedPass: results.every((r) => r.targetedPass),
      failedShards: results.filter((r) => !r.targetedPass).map((r) => r.shard)
    }
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${outPath}`);
  console.log('Stage A allTargetedPass:', doc.stageA.allTargetedPass, doc.stageA.failedShards);

  writeDevLive({
    workType: doc.stageA.allTargetedPass ? 'DIAGNOSTIC' : 'DEVELOPMENT',
    currentTask: doc.stageA.allTargetedPass
      ? 'Aşama A PASS — Diagnostic Matrix’e geçiliyor'
      : `Aşama A FAIL — ${doc.stageA.failedShards.join(', ')}`,
    lastRealTestResult: doc.stageA.allTargetedPass ? 'STAGE_A_PASS' : 'STAGE_A_FAIL',
    nextShard: doc.stageA.allTargetedPass ? 'diagnostic-matrix' : doc.stageA.failedShards[0]
  });

  process.exitCode = doc.stageA.allTargetedPass ? 0 : 2;
}

main().catch((err) => {
  console.error(err);
  writeDevLive({
    workType: 'DEVELOPMENT',
    currentTask: `Counterfactual hata: ${err.message}`,
    lastRealTestResult: 'ERROR'
  });
  process.exitCode = 1;
});
