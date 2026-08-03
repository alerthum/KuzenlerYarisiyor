#!/usr/bin/env node
/**
 * quality-reports/curriculum-question-coverage.json
 * Veri yoksa PASS yazılmaz → NOT_MEASURED | SOURCE_GAP
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCurriculumGraph, listCoverageCells, SUBJECT_CATALOG } from '../js/curriculum/curriculum-graph.js';
import { planCapacity, inventoryFromFamilies } from '../js/quality/capacity-planner.js';
import { LGS_FOUNDATION_FAMILIES } from '../js/content/families/lgs-foundation-families.js';
import { SCIENCE_REASONING_FAMILIES } from '../js/content/families/science-reasoning-families.js';
import { ERROR_DETECTIVE_FAMILIES } from '../js/content/families/error-detective-families.js';
import { GAME_CATALOG } from '../js/games/registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'quality-reports', 'curriculum-question-coverage.json');

const FAMILY_BY_GAME = {
  'lgs-foundation': LGS_FOUNDATION_FAMILIES,
  'science-reasoning': SCIENCE_REASONING_FAMILIES,
  'error-detective': ERROR_DETECTIVE_FAMILIES
};

function sessionLength(gameId) {
  return GAME_CATALOG.find((g) => g.id === gameId)?.sessionLength || 5;
}

function cellCapacity(cell) {
  const games = cell.supportedGames || [];
  if (!games.length) {
    return {
      minimumAnnualNeed: null,
      safeCapacity: null,
      capacityDeficit: null,
      structuralCount: 0,
      cognitiveExperienceCount: 0,
      blueprintCount: 0,
      status: 'NOT_MEASURED'
    };
  }
  let blueprintCount = 0;
  let structuralCount = 0;
  let cxCount = 0;
  let deficit = 0;
  let annualNeed = 0;
  let safe = 0;
  let measured = false;
  for (const gameId of games) {
    const fams = FAMILY_BY_GAME[gameId];
    if (!fams) continue;
    measured = true;
    const inv = inventoryFromFamilies(fams);
    const plan = planCapacity({
      gameId,
      gradeBand: cell.grade,
      sessionLength: sessionLength(gameId),
      usageShare: 1 / Math.max(1, games.length),
      annualSessionsPerStudent: 36
    }, inv);
    blueprintCount += inv.skeletonCount;
    structuralCount += inv.structuralCount;
    cxCount += inv.cognitiveExperienceCount;
    deficit += plan.capacityDeficit;
    annualNeed += plan.annualDemand;
    safe += plan.safeCapacity.structural || 0;
  }
  if (!measured) {
    return {
      minimumAnnualNeed: null,
      safeCapacity: null,
      capacityDeficit: null,
      structuralCount: 0,
      cognitiveExperienceCount: 0,
      blueprintCount: 0,
      status: 'SOURCE_GAP'
    };
  }
  return {
    minimumAnnualNeed: annualNeed,
    safeCapacity: safe,
    capacityDeficit: deficit,
    structuralCount,
    cognitiveExperienceCount: cxCount,
    blueprintCount,
    status: deficit > 0 ? 'CAPACITY_GAP' : 'MEASURED'
  };
}

function main() {
  const graph = getCurriculumGraph();
  const cells = listCoverageCells().map((cell) => {
    const cap = cellCapacity(cell);
    return {
      grade: cell.grade,
      subject: cell.subject,
      unit: cell.unit,
      topic: cell.topic,
      curriculumSkillId: cell.curriculumSkillId,
      realSourceQuestionCount: 0,
      verifiedQuestionCount: 0,
      blueprintCount: cap.blueprintCount,
      uniqueStructuralIdCount: cap.structuralCount,
      uniqueCognitiveExperienceIdCount: cap.cognitiveExperienceCount,
      misconceptionCount: 0,
      distractorPlanCount: 0,
      minimumAnnualNeed: cap.minimumAnnualNeed,
      safeCapacity: cap.safeCapacity,
      capacityDeficit: cap.capacityDeficit,
      qualityStatus: cap.status,
      supportingGames: cell.supportedGames,
      examGroups: cell.examGroups,
      missingSourceTypes: cap.status === 'SOURCE_GAP' || cap.status === 'NOT_MEASURED'
        ? ['OFFICIAL', 'AUTHORIZED_PREVIEW', 'ACADEMIC']
        : []
    };
  });

  // Tam sınıf × ders iskeleti — veri yoksa NOT_MEASURED satırları
  const matrixSkeleton = [];
  for (let grade = 1; grade <= 12; grade += 1) {
    for (const sub of SUBJECT_CATALOG) {
      const existing = cells.filter((c) => c.grade === grade && c.subject === sub.label);
      if (existing.length) {
        matrixSkeleton.push(...existing);
      } else {
        matrixSkeleton.push({
          grade,
          subject: sub.label,
          unit: null,
          topic: null,
          curriculumSkillId: null,
          realSourceQuestionCount: 0,
          verifiedQuestionCount: 0,
          blueprintCount: 0,
          uniqueStructuralIdCount: 0,
          uniqueCognitiveExperienceIdCount: 0,
          misconceptionCount: 0,
          distractorPlanCount: 0,
          minimumAnnualNeed: null,
          safeCapacity: null,
          capacityDeficit: null,
          qualityStatus: 'NOT_MEASURED',
          supportingGames: [],
          examGroups: [],
          missingSourceTypes: ['OFFICIAL', 'AUTHORIZED_PREVIEW', 'ACADEMIC']
        });
      }
    }
  }

  const summary = {
    gradesCoveredWithAnySkill: graph.gradesCovered,
    gradesTotal: 12,
    subjectsInCatalog: SUBJECT_CATALOG.length,
    subjectsWithAnySkill: graph.subjectsCovered,
    cellsMeasured: matrixSkeleton.filter((c) => c.qualityStatus === 'MEASURED').length,
    cellsNotMeasured: matrixSkeleton.filter((c) => c.qualityStatus === 'NOT_MEASURED').length,
    cellsSourceGap: matrixSkeleton.filter((c) => c.qualityStatus === 'SOURCE_GAP').length,
    cellsCapacityGap: matrixSkeleton.filter((c) => c.qualityStatus === 'CAPACITY_GAP').length,
    note: 'Veri yokken PASS yazılmaz. LGS yalnızca bir satır kümesidir.'
  };

  const doc = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    curriculumGraphVersion: graph.version,
    productReady: false,
    summary,
    cells: matrixSkeleton
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log('Wrote', outPath);
  console.log(summary);
}

main();
