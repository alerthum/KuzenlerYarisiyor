/**
 * Komuta Merkezi — Tüm Müfredat Soru Fabrikası paneli (saf HTML).
 */

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

/**
 * @param {object|null} coverage curriculum-question-coverage.json
 * @param {object|null} matrix representative-curriculum-matrix.json
 * @param {object|null} live strict-audit-live.json (current grade/subject)
 */
export function renderCurriculumFactoryPanelHtml(coverage = null, matrix = null, live = null) {
  const summary = coverage?.summary || {};
  const grades = `${summary.gradesCoveredWithAnySkill ?? 0} / ${summary.gradesTotal ?? 12}`;
  const subjects = `${summary.subjectsWithAnySkill ?? 0} / ${summary.subjectsInCatalog ?? 15}`;
  const measured = summary.cellsMeasured ?? 0;
  const notMeasured = summary.cellsNotMeasured ?? 0;
  const sourceGap = summary.cellsSourceGap ?? 0;
  const capGap = summary.cellsCapacityGap ?? 0;

  const current = live?.currentTask
    || (live?.currentGrade != null
      ? `${live.currentGrade}. sınıf · ${live.currentGameName || live.currentGameId || '—'}`
      : '—');

  const matrixLine = matrix
    ? `${matrix.allPass ? 'PASS' : 'FAIL'} · ${matrix.shards?.length || 0} shard · fail: ${(matrix.failedShards || []).slice(0, 3).join(', ') || '—'}`
    : 'Henüz çalıştırılmadı';

  const cells = Array.isArray(coverage?.cells) ? coverage.cells : [];
  const lgsRows = cells.filter((c) => (c.examGroups || []).includes('LGS') || (c.supportingGames || []).includes('lgs-foundation'));
  const verifiedBlueprints = cells.reduce((n, c) => n + (Number(c.blueprintCount) || 0), 0);
  const structural = cells.reduce((n, c) => n + (Number(c.uniqueStructuralIdCount) || 0), 0);
  const cx = cells.reduce((n, c) => n + (Number(c.uniqueCognitiveExperienceIdCount) || 0), 0);
  const realEvidence = cells.reduce((n, c) => n + (Number(c.realSourceQuestionCount) || 0), 0);

  return `<section class="analytics-section curriculum-factory-panel" data-testid="curriculum-factory-panel">
    <div class="section-header">
      <div>
        <h3>Tüm Müfredat Soru Fabrikası</h3>
        <p>1–12. sınıf · bütün dersler · LGS yalnızca bir satır kümesi</p>
      </div>
      <span class="badge cyan">GENEL MOTOR</span>
    </div>
    <div class="platform-metric-grid">
      <div class="metric-card"><div class="metric-label">Kapsanan sınıf</div><div class="metric-value">${esc(grades)}</div></div>
      <div class="metric-card"><div class="metric-label">Kapsanan ders</div><div class="metric-value">${esc(subjects)}</div></div>
      <div class="metric-card"><div class="metric-label">Ölçülen hücre</div><div class="metric-value">${esc(measured)}</div><div class="metric-note">NOT_MEASURED: ${esc(notMeasured)}</div></div>
      <div class="metric-card"><div class="metric-label">Kaynak açığı</div><div class="metric-value">${esc(sourceGap)}</div></div>
      <div class="metric-card"><div class="metric-label">Kapasite açığı</div><div class="metric-value">${esc(capGap)}</div></div>
      <div class="metric-card"><div class="metric-label">Gerçek soru kanıtı</div><div class="metric-value">${esc(realEvidence)}</div></div>
      <div class="metric-card"><div class="metric-label">Blueprint (ölçülen)</div><div class="metric-value">${esc(verifiedBlueprints)}</div></div>
      <div class="metric-card"><div class="metric-label">Yapısal / CX çeşitlilik</div><div class="metric-value" style="font-size:1rem">${esc(structural)} / ${esc(cx)}</div></div>
      <div class="metric-card"><div class="metric-label">Misconception kapsamı</div><div class="metric-value">${esc(cells.reduce((n, c) => n + (Number(c.misconceptionCount) || 0), 0))}</div></div>
      <div class="metric-card"><div class="metric-label">Şu an analiz</div><div class="metric-value" style="font-size:0.95rem">${esc(current)}</div></div>
      <div class="metric-card"><div class="metric-label">Temsilî 16 shard</div><div class="metric-value" style="font-size:0.9rem">${esc(matrixLine)}</div></div>
      <div class="metric-card"><div class="metric-label">LGS satır sayısı</div><div class="metric-value">${esc(lgsRows.length)}</div><div class="metric-note">dashboard LGS’ye göre şekillenmez</div></div>
    </div>
    <p class="muted mt-12">Veri yoksa hücreler PASS sayılmaz → <code>NOT_MEASURED</code> / <code>SOURCE_GAP</code>.</p>
  </section>`;
}

export default renderCurriculumFactoryPanelHtml;
