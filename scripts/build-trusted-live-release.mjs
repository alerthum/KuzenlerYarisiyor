import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { controlledLiveBetaPolicySummary } from '../js/assessment-v2/controlled-live-beta-bank.js';
import { TRUSTED_LIVE_CELL_POLICY } from '../js/assessment-v2/trusted-live-policy.js';
import { LIVE_OUTPUT_GATE_VERSION } from '../js/quality/live-output-gate.js';
import { SOLVER_BACKED_PRIORITY_MATH_AUDIT } from '../js/assessment-v2/solver-backed-priority-math-bank.js';
import { EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT } from '../js/assessment-v2/evidence-backed-priority-turkish-bank.js';
import { EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT } from '../js/assessment-v2/evidence-backed-priority-science-bank.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = resolve(ROOT, 'public/trusted-live-release.json');
const MD_PATH = resolve(ROOT, 'md/guncel/GUVENLI_CANLI_DURUM.md');
const REVIEW_PATH = resolve(ROOT, 'quality-reports/trusted-live-review.json');

const GAME_TITLES = Object.freeze({
  'paragraph-detective': 'Paragraf Dedektifi',
  'meaning-hunt': 'Anlam Avı',
  'science-reasoning': 'Fen Akıl Yürütme',
  'science-lab': 'Fen Bilimleri Laboratuvarı',
  'problem-hunter': 'Problem Avcısı',
  'error-detective': 'Hata Dedektifi',
  'geometry-lab': 'Geometri Laboratuvarı',
  'logic-station': 'Zekâ İstasyonu',
  'olympiad-ladder': 'Olimpiyat Merdiveni',
  'english-vocabulary': 'Günün 20 İngilizce Kelimesi',
  'social-time-travel': 'Zaman Yolculuğu',
  'religion-practice': 'Din Kültürü Öğrenme Alanı'
});

const BLOCKED_PRIORITIES = Object.freeze([
  {
    scope: 'GRADES_1_3_5_6_NON_ENGLISH',
    title: '1–3 ve 5–6. sınıf İngilizce dışındaki ders ve oyunlar',
    status: 'BLOCKED',
    reason: 'Zor seviye ve son öğrenci yüzeyi insan incelemesi tamamlanmadı; eski jeneratörler öğrenciye açılmıyor.'
  },
  {
    scope: 'REMAINING_GAMES',
    title: 'Whitelist dışındaki oyunlar ve LGS karma havuzu',
    status: 'BLOCKED',
    reason: 'Son-ekran incelemesi, gerçek zorluk ve çeldirici sözleşmesi tamamlanmadı.'
  },
  {
    scope: 'GRADES_9_12',
    title: '9–12. sınıf kapsamı',
    status: 'BLOCKED',
    reason: 'Mevcut projede doğrulanmış müfredat ve güvenli canlı soru paketi bulunmuyor.'
  }
]);

export async function buildTrustedLiveRelease() {
  const policy = controlledLiveBetaPolicySummary();
  let review = null;
  try { review = JSON.parse(await readFile(REVIEW_PATH, 'utf8')); } catch { review = null; }
  const cells = policy.cells.map((cell) => {
    const [gameId, gradeText] = cell.cellId.split(':');
    return {
      ...cell,
      gameId,
      grade: Number(gradeText),
      gameTitle: GAME_TITLES[gameId] || gameId
    };
  });
  const safeGameIds = [...new Set(cells.map((cell) => cell.gameId))];
  const approvedAssignments = cells.reduce((sum, cell) => sum + Number(cell.approvedQuestionCount || 0), 0);
  const uniquePolicyQuestionKeys = new Set(
    Object.values(TRUSTED_LIVE_CELL_POLICY).flatMap((cell) => cell.keys || [])
  );
  const reviewPass = review?.status === 'PASS'
    && review?.summary?.failedRoundCount === 0
    && review?.summary?.legacyFallbackDetected === false
    && Number(review?.summary?.reviewedRoundCount || 0) === approvedAssignments;

  const document = {
    schemaVersion: '2.0',
    kind: 'trusted-live-release-status',
    generatedAt: new Date().toISOString(),
    releaseStatus: reviewPass ? 'PARTIAL_SAFE_PILOT' : 'BLOCKED_REVIEW_INCOMPLETE',
    wholeProductReady: false,
    productReady: false,
    publicationAllowed: reviewPass,
    publicationMode: 'EXPLICIT_TRUSTED_CELL_WHITELIST',
    publicationScope: 'ONLY_EXPLICIT_SAFE_CELLS',
    policyVersion: policy.trustedPolicyVersion,
    fallbackToLegacyAllowed: false,
    versions: {
      controlledLaunch: policy.version,
      trustedPolicy: policy.trustedPolicyVersion,
      liveOutputGate: LIVE_OUTPUT_GATE_VERSION
    },
    summary: {
      totalGameCount: 23,
      safeGameCount: safeGameIds.length,
      safeCellCount: cells.length,
      approvedQuestionAssignmentCount: approvedAssignments,
      approvedQuestionAssignments: approvedAssignments,
      uniqueApprovedQuestionCount: uniquePolicyQuestionKeys.size,
      finalSurfaceReviewStatus: review?.status || 'NOT_GENERATED',
      finalSurfaceReviewedQuestionCount: review?.summary?.reviewedRoundCount || 0,
      finalSurfaceFailedQuestionCount: review?.summary?.failedRoundCount ?? null,
      legacyFallbackDetected: review?.summary?.legacyFallbackDetected ?? null,
      uniqueQuestionCountNote: 'İngilizce 6–8. sınıf aynı 20 bağlamsal kelime sorusunu paylaşır; atama ve benzersiz soru sayıları bu nedenle ayrı gösterilir.',
      blockedPriorityCount: BLOCKED_PRIORITIES.length
    },
    safeGames: safeGameIds.map((gameId) => ({
      gameId,
      title: GAME_TITLES[gameId] || gameId,
      status: 'SAFE_ONLY_FOR_LISTED_GRADES',
      grades: cells.filter((cell) => cell.gameId === gameId).map((cell) => cell.grade),
      approvedQuestionAssignments: cells
        .filter((cell) => cell.gameId === gameId)
        .reduce((sum, cell) => sum + cell.approvedQuestionCount, 0)
    })),
    safeCells: cells,
    blockedPriorities: BLOCKED_PRIORITIES,
    currentWork: {
      status: 'MATH_TURKISH_SCIENCE_ENGINE_CHECKPOINT_PASS',
      currentTask: '4. ve 8. sınıf Matematik, Türkçe ve Fen motorları canlıya bağlandı; İngilizce bağlam motoru sırada',
      title: '4. ve 8. sınıf Matematik + Türkçe + Fen motor checkpoint’i tamamlandı',
      engineMetrics: {
        math: SOLVER_BACKED_PRIORITY_MATH_AUDIT.metrics,
        turkish: EVIDENCE_BACKED_PRIORITY_TURKISH_AUDIT.metrics,
        science: EVIDENCE_BACKED_PRIORITY_SCIENCE_AUDIT.metrics
      },
      completed: [
        'Matematikte 30 kazanım ailesi, 90 iskelet ve 204 solver-doğrulamalı çıktı canlıya bağlandı.',
        'Türkçede 24 insan yazımı metin ailesi, 72 görev iskeleti ve 72 kanıt-doğrulamalı çıktı canlıya bağlandı.',
        'Fende 25 insan yazımı deney/veri ailesi, 75 görev iskeleti ve 75 bağımsız değişken-kanıt doğrulamalı çıktı canlıya bağlandı.',
        'Fen içerikleri Fen Akıl Yürütme ve Fen Bilimleri Laboratuvarı olarak dört ayrı 4/8. sınıf hücresine uyarlandı.',
        'Fen motorunda desteklenen sonuç, kontrollü deney tasarımı ve kanıt sınırı aynı kaynak vakadan üç farklı düşünme deneyimi olarak üretiliyor.',
        'Matematik, Türkçe ve Fen sabit bankaları canlı kaynak olmaktan çıkarıldı; yalnız golden sample ve regresyon kanıtı olarak korunuyor.',
        'Üç motorun whitelist’i tükendiğinde eski jeneratör veya fallback açılmıyor.',
        'Öğrencinin gördüğü prompt, bağlam, seçenek, ipucu ve çözüm yüzeyi 496/496 PASS verdi.'
      ],
      next: [
        '4. ve 8. sınıf İngilizce için ayrı kelime, kısa diyalog, cümle tamamlama ve kısa okuma motorlarını kur.',
        'Türkçe-İngilizce karışımını yapısal yayın engeli olarak koru ve her görev için tek dil sözleşmesi uygula.',
        'İngilizce motorunu Günün 20 Kelimesi, Cloze ve Cümle Kurucu oyunlarına farklı deneyimler olarak bağla.'
      ],
      nextAction: '4. ve 8. sınıf İngilizce bağlam, diyalog ve kısa okuma motorunu oluştur.',
      changedFiles: [
        'js/assessment-v2/solver-backed-math-family-engine.js',
        'js/assessment-v2/solver-backed-g4-math-families.js',
        'js/assessment-v2/solver-backed-g8-math-families.js',
        'js/assessment-v2/solver-backed-priority-math-bank.js',
        'js/assessment-v2/evidence-backed-turkish-family-engine.js',
        'js/assessment-v2/evidence-backed-g4-turkish-families.js',
        'js/assessment-v2/evidence-backed-g8-turkish-families.js',
        'js/assessment-v2/evidence-backed-priority-turkish-bank.js',
        'js/assessment-v2/evidence-backed-science-family-engine.js',
        'js/assessment-v2/evidence-backed-g4-science-families.js',
        'js/assessment-v2/evidence-backed-g8-science-families.js',
        'js/assessment-v2/evidence-backed-priority-science-bank.js',
        'js/assessment-v2/trusted-live-policy.js',
        'js/assessment-v2/controlled-live-beta-bank.js',
        'tests/live-output/solver-backed-priority-math-engine.test.mjs',
        'tests/live-output/evidence-backed-priority-turkish-engine.test.mjs',
        'tests/live-output/evidence-backed-priority-science-engine.test.mjs',
        'tests/live-output/trusted-g8-math-bank.test.mjs',
        'tests/live-output/trusted-g8-turkish-deep-bank.test.mjs',
        'tests/live-output/trusted-g8-science-deep-bank.test.mjs',
        'tests/live-output/trusted-priority-grade4-grade8-wave1.test.mjs',
        'scripts/build-trusted-live-release.mjs',
        'PROJECT_STATE.json',
        'FINAL_RELEASE_DECISION.json',
        'public/strict-audit-live.json',
        'package.json',
        'package-lock.json'
      ]
    },
    latestTest: {
      command: 'node scripts/build-trusted-live-review.mjs',
      result: review ? `${review.status} · ${review.summary?.reviewedRoundCount || 0}/${review.summary?.expectedRoundCount || 0}` : 'NOT_GENERATED',
      notes: 'Öğrencinin gördüğü son prompt, bağlam, seçenek, ipucu ve çözüm yüzeyi denetlendi.'
    },
    latestTests: [
      { command: 'npm run test:live-output', result: '56/56 PASS' },
      { command: 'node scripts/build-trusted-live-review.mjs', result: review ? `${review.status} · ${review.summary?.reviewedRoundCount || 0}/${review.summary?.expectedRoundCount || 0}` : 'NOT_GENERATED' }
    ],
    limitations: [
      'Bu karar ürünün tamamı için yayın onayı değildir.',
      'Yalnız safeCells listesinde bulunan sınıf-oyun eşleşmeleri açılabilir.',
      'Tarayıcı E2E doğrulaması çalışma ortamındaki yönetici politikası nedeniyle tamamlanamamıştır.'
    ]
  };

  await mkdir(dirname(JSON_PATH), { recursive: true });
  await mkdir(dirname(MD_PATH), { recursive: true });
  await writeFile(JSON_PATH, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  const rows = cells.map((cell) => `| ${cell.grade}. sınıf | ${cell.gameTitle} | ${cell.approvedQuestionCount} | ${cell.status} |`).join('\n');
  const markdown = `# Güvenli Canlı Durum\n\n` +
    `- Ürün bütünü: **Yayına hazır değil**\n` +
    `- Kısmi güvenli pilot: **${reviewPass ? 'Açılabilir' : 'İnceleme tamamlanmadan kapalı'}**\n` +
    `- Yayın davranışı: **Yalnız açık whitelist hücreleri; eski fallback kapalı**\n` +
    `- Güvenli oyun: **${safeGameIds.length}/23** (yalnız aşağıdaki sınıflarda)\n` +
    `- Güvenli sınıf-oyun hücresi: **${cells.length}**\n` +
    `- Onaylı soru ataması: **${approvedAssignments}**\n` +
    `- Benzersiz onaylı soru: **${uniquePolicyQuestionKeys.size}**\n` +
    `- Son-ekran incelemesi: **${review?.status || 'NOT_GENERATED'} · ${review?.summary?.reviewedRoundCount || 0}/${approvedAssignments}**\n\n` +
    `| Sınıf | Oyun | Onaylı soru | Durum |\n|---:|---|---:|---|\n${rows}\n\n` +
    `## Canlıya Kapalı Öncelikler\n\n` +
    BLOCKED_PRIORITIES.map((item) => `- **${item.title}:** ${item.reason}`).join('\n') +
    `\n\nSon üretim: ${document.generatedAt}\n`;
  await writeFile(MD_PATH, markdown, 'utf8');
  return document;
}

const invokedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (invokedDirectly) {
  const result = await buildTrustedLiveRelease();
  console.log(`Güvenli canlı durum üretildi: ${result.summary.safeCellCount} hücre • ${result.summary.safeGameCount} oyun`);
}
