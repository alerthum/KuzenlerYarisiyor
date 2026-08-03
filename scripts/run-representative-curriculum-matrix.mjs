#!/usr/bin/env node
/**
 * Temsilî 16 shard matrisi — LGS sonrası genel doğrulama.
 * Full 23-oyun strict BAŞLATMAZ.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCapacityShard } from '../js/quality/capacity-policy-shard-runner.js';
import { skillsForGradeSubject } from '../js/curriculum/curriculum-graph.js';
import {
  createEmptyLiveState,
  atomicWriteJson,
  pushRecentEvent
} from './lib/strict-audit-live-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'quality-reports', 'representative-curriculum-matrix.json');
const livePath = path.join(root, 'public', 'strict-audit-live.json');

/** grade/subject → birincil oyun (sunum biçimi); müfredat ≠ oyun */
const MATRIX = [
  { grade: 4, subject: 'Matematik', gameId: 'problem-hunter', age: 10 },
  { grade: 4, subject: 'Türkçe', gameId: 'paragraph-detective', age: 10 },
  { grade: 4, subject: 'Fen Bilimleri', gameId: 'science-reasoning', age: 10 },
  { grade: 8, subject: 'Matematik', gameId: 'lgs-foundation', age: 14 },
  { grade: 8, subject: 'Türkçe', gameId: 'paragraph-detective', age: 14 },
  { grade: 8, subject: 'Fen Bilimleri', gameId: 'science-reasoning', age: 14 },
  { grade: 8, subject: 'İngilizce', gameId: 'english-sentence-builder', age: 14 },
  { grade: 10, subject: 'Matematik', gameId: 'problem-hunter', age: 16 },
  { grade: 10, subject: 'Türk Dili ve Edebiyatı', gameId: 'paragraph-detective', age: 16 },
  { grade: 10, subject: 'Fizik', gameId: 'science-reasoning', age: 16 },
  { grade: 10, subject: 'Kimya', gameId: 'science-lab', age: 16 },
  { grade: 10, subject: 'Biyoloji', gameId: 'science-lab', age: 16 },
  { grade: 12, subject: 'Matematik', gameId: 'olympiad-ladder', age: 18, examGroup: 'TYT' },
  { grade: 12, subject: 'Türkçe', gameId: 'paragraph-detective', age: 18, examGroup: 'TYT' },
  { grade: 12, subject: 'Fizik', gameId: 'science-reasoning', age: 18, examGroup: 'AYT' },
  { grade: 12, subject: 'İngilizce', gameId: 'english-cloze', age: 18, examGroup: 'YDT' }
];

function patchLive(patch) {
  let live = createEmptyLiveState();
  if (fs.existsSync(livePath)) {
    try { live = { ...live, ...JSON.parse(fs.readFileSync(livePath, 'utf8')) }; } catch { /* keep */ }
  }
  if (live.status === 'RUNNING' || live.status === 'STARTING') {
    /* audit koşuyorsa status'u bozma */
  } else {
    live.status = 'ABORTED';
  }
  Object.assign(live, patch, {
    workType: patch.workType || 'VALIDATION',
    updatedAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString()
  });
  live.lastActivityMessage = patch.currentTask || live.lastActivityMessage;
  pushRecentEvent(live, 'INFO', patch.currentTask || 'Müfredat matrisi');
  atomicWriteJson(livePath, live);
}

function main() {
  const sessions = 50;
  const results = [];
  patchLive({
    workType: 'VALIDATION',
    currentTask: 'Temsilî 16 shard müfredat matrisi başlıyor',
    rootCause: 'CX lifetime + yüzey banı hatası giderildi; genel motor doğrulanıyor',
    nextShard: `${MATRIX[0].grade}/${MATRIX[0].subject}`
  });

  for (let i = 0; i < MATRIX.length; i += 1) {
    const row = MATRIX[i];
    const skills = skillsForGradeSubject(row.grade, row.subject);
    patchLive({
      workType: 'VALIDATION',
      currentTask: `Matris: ${row.grade}. sınıf ${row.subject} → ${row.gameId}`,
      completedShard: i > 0 ? `${MATRIX[i - 1].grade}/${MATRIX[i - 1].subject}` : null,
      nextShard: `${row.grade}/${row.subject}`,
      currentGameId: row.gameId,
      currentGrade: row.grade
    });
    console.log(`\n=== ${i + 1}/16 ${row.grade} ${row.subject} (${row.gameId}) ===`);
    let shardResult;
    try {
      shardResult = runCapacityShard({
        gameId: row.gameId,
        grade: row.grade,
        age: row.age,
        sessions,
        studentCount: 1,
        repetitionPolicyVersion: 'v2',
        seedBase: 70000 + i * 97
      });
    } catch (err) {
      shardResult = {
        pass: false,
        failReasons: ['runtime_error'],
        metrics: { fillRate: 0, underfillRate: 1, error: String(err.message || err) }
      };
    }

    const entry = {
      index: i + 1,
      grade: row.grade,
      subject: row.subject,
      examGroup: row.examGroup || null,
      presentationGameId: row.gameId,
      curriculumSkillIds: skills.map((s) => s.curriculumSkillId),
      curriculumSkillCount: skills.length,
      sessions,
      pass: Boolean(shardResult.pass),
      metrics: shardResult.metrics || {},
      failReasons: shardResult.failReasons || [],
      topicCoverage: skills.length ? 'PARTIAL_SEED' : 'NOT_MEASURED',
      difficultyFit: 'NOT_MEASURED',
      solverAccuracy: 'NOT_MEASURED',
      distractorEvidence: 'NOT_MEASURED'
    };
    results.push(entry);
    console.log(entry.pass ? 'PASS' : 'FAIL', entry.metrics.fillRate, entry.failReasons);
    patchLive({
      lastRealTestResult: entry.pass ? 'PASS' : `FAIL:${(entry.failReasons || []).join(',')}`,
      previousFillRate: null,
      newFillRate: entry.metrics.fillRate ?? null,
      newUnderfill: entry.metrics.underfillRate ?? null,
      completedShard: `${row.grade}/${row.subject}`,
      nextShard: MATRIX[i + 1] ? `${MATRIX[i + 1].grade}/${MATRIX[i + 1].subject}` : 'coverage-matrix'
    });
  }

  const allPass = results.every((r) => r.pass);
  const doc = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    workName: 'REPRESENTATIVE_CURRICULUM_MATRIX',
    productReady: false,
    fullStrictAllowed: allPass,
    note: 'Full 23-oyun strict yalnız bu matris tamamen PASS ise başlatılır.',
    sessionsPerShard: sessions,
    allPass,
    failedShards: results.filter((r) => !r.pass).map((r) => `${r.grade}/${r.subject}/${r.presentationGameId}`),
    shards: results
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log('\nWrote', outPath);
  console.log('allPass', allPass, 'failed', doc.failedShards);
  patchLive({
    workType: allPass ? 'VALIDATION' : 'DEVELOPMENT',
    currentTask: allPass
      ? 'Temsilî 16 shard PASS — coverage matrisine geçilebilir'
      : `Temsilî matris FAIL — ${doc.failedShards[0] || '?'}`,
    lastRealTestResult: allPass ? 'MATRIX_PASS' : 'MATRIX_FAIL',
    nextShard: allPass ? 'full-coverage-matrix' : doc.failedShards[0]
  });
  process.exitCode = allPass ? 0 : 2;
}

main();
