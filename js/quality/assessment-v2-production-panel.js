function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function badge(status) {
  const normalized = String(status || 'NOT_MEASURED');
  const cls = ['PASS', 'FULL_SCOPE_INGESTED', 'EXPANDING', 'PILOT_VALIDATED'].includes(normalized)
    ? 'green'
    : ['LOCKED', 'BLOCKED', 'PARTIAL', 'PILOT_OUTCOMES_ONLY'].includes(normalized)
      ? 'orange'
      : 'cyan';
  return `<span class="badge ${cls}">${esc(normalized)}</span>`;
}

function metric(label, value, note = '') {
  return `<div class="metric-card"><div class="metric-label">${esc(label)}</div><div class="metric-value">${value}</div>${note ? `<div class="metric-note">${esc(note)}</div>` : ''}</div>`;
}

export function renderAssessmentV2ProductionPanelHtml(data = null) {
  if (!data) return `<section class="analytics-section assessment-production-panel" data-testid="assessment-v2-production-panel"><h3>Ders Motorları ve Müfredat Üretim Haritası</h3><div class="empty-state">Üretim portföyü yüklenmedi.</div></section>`;
  if (data.fetchError) return `<section class="analytics-section assessment-production-panel" data-testid="assessment-v2-production-panel"><h3>Ders Motorları ve Müfredat Üretim Haritası</h3><div class="empty-state">Veri okunamadı — ${esc(data.fetchError)}</div></section>`;

  const summary = data.summary || {};
  const engines = Array.isArray(data.engines) ? data.engines : [];
  const rollout = Array.isArray(data.rollout) ? data.rollout : [];
  const pipeline = Array.isArray(data.pipeline) ? data.pipeline : [];
  const milestones = Array.isArray(data.nextMilestones) ? data.nextMilestones : [];

  const engineCards = engines.map(row => {
    const courseCoverage = row.courseCoveragePercent == null ? 'Tam kapsam henüz aktarılmadı' : `%${row.courseCoveragePercent} kazanım kapsandı`;
    return `<article class="assessment-engine-card">
      <div class="assessment-engine-card-head"><div><span class="assessment-engine-grade">${esc(row.grade)}. sınıf</span><h4>${esc(row.courseName)}</h4></div>${badge(row.engineStatus)}</div>
      <div class="assessment-engine-stats">
        <span><strong>${esc(row.canonicalQuestionCount)}</strong> kanonik soru</span>
        <span><strong>${esc(row.coveredOutcomeCount)}</strong> kapsanan kazanım</span>
        <span><strong>${esc(row.humanApprovedQuestionCount)}</strong> insan onaylı</span>
        <span><strong>${esc(row.humanReviewQueueCount)}</strong> inceleme bekliyor</span>
      </div>
      <p>${esc(courseCoverage)} · ${esc(row.programFamily)}</p>
      <div class="assessment-engine-tech"><small><strong>Motor:</strong> ${esc(row.engineType)}</small><small><strong>Doğrulama:</strong> ${esc(row.verifierType)}</small></div>
      <div class="assessment-engine-next"><strong>Sıradaki:</strong> ${esc(row.nextAction)}</div>
      ${(row.blockers || []).length ? `<ul>${row.blockers.map(item => `<li>${esc(item)}</li>`).join('')}</ul>` : ''}
    </article>`;
  }).join('');

  return `<section class="analytics-section assessment-production-panel" data-testid="assessment-v2-production-panel">
    <div class="section-header"><div><span class="badge cyan">Assessment Engineering Engine V2</span><h3>Ders Motorları ve Müfredat Üretim Haritası</h3><p>${esc(data.target)}</p></div>${badge(data.status)}</div>
    <div class="platform-metric-grid assessment-production-metrics">
      ${metric('Aktif sınıf', `${esc(summary.activeGradeCount)} / ${esc(summary.targetGradeCount)}`)}
      ${metric('Aktif ders motoru', `${esc(summary.activeEngineCellCount)} / ${esc(summary.courseScheduleCellCount)}`, `%${esc(summary.activeEngineCellPercent)} ders hücresi`)}
      ${metric('Kanonik soru/görev', esc(summary.canonicalQuestionCount))}
      ${metric('Kapsanan kazanım', esc(summary.coveredOutcomeCount), `${esc(summary.curriculumOutcomeRecordCount)} kayıtlı kazanım/çıktı`)}
      ${metric('İnsan onaylı', esc(summary.humanApprovedQuestionCount), `${esc(summary.humanReviewQueueCount)} inceleme bekliyor`)}
      ${metric('Oyun uyarlaması', esc(summary.gameAdaptedQuestionCount), 'Tam kapsam ve insan onayı öncesi kilitli')}
      ${metric('Legacy karantina', esc(summary.legacyQuarantineCount), 'UNVERIFIED_LEGACY')}
      ${metric('Ürün durumu', data.productReady ? badge('PASS') : badge('productReady=false'))}
    </div>

    <div class="assessment-pipeline" aria-label="Soru üretim hattı">
      ${pipeline.map((step, index) => `<div class="assessment-pipeline-step"><span>${index + 1}</span><div><strong>${esc(step.label)}</strong><small>${esc(step.note)}</small></div>${badge(step.status)}</div>`).join('')}
    </div>

    <div class="assessment-rollout"><h4>2026–2027 program yönlendirmesi</h4><div>${rollout.map(row => `<span title="${esc(row.status)}">${esc(row.grade)}<small>${esc(row.programFamily === 'TYMM' ? 'TYMM' : 'Önceki')}</small></span>`).join('')}</div></div>

    <div class="assessment-engine-grid">${engineCards || '<div class="empty-state">Aktif ders motoru yok.</div>'}</div>

    <div class="assessment-next-work"><h4>Sıradaki kesin geliştirme işleri</h4><ol>${milestones.map(item => `<li><span>${esc(item.order)}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.reason)}</small></div></li>`).join('')}</ol></div>

    <p class="muted mt-12">Ortak olan üretici değil; müfredat kaydı, kanonik sözleşme ve kalite kapılarıdır. Her ders kendi çözücü ve yanılgı kataloğunu kullanır.</p>
  </section>`;
}

export default renderAssessmentV2ProductionPanelHtml;
