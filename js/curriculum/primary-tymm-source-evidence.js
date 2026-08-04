export const PRIMARY_TYMM_SOURCE_EVIDENCE=Object.freeze([
  Object.freeze({sourceId:'meb-tymm-primary-turkish-1-4-2024',courseIds:Object.freeze(['turkce']),grades:Object.freeze([1,2,3]),localDocument:'docs/sources/TURKCE_1_4_TYMM_2024.pdf',sha256:'69e14847f40850c2b6d57fef25728416f6ea57f239b65e14d1262b7402603c86',status:'LOCAL_AUTHORITATIVE_EVIDENCE_VERIFIED'}),
  Object.freeze({sourceId:'meb-tymm-primary-math-1-4-2024',courseIds:Object.freeze(['matematik']),grades:Object.freeze([1,2,3]),localDocument:'docs/sources/MATEMATIK_1_4_TYMM_2024.pdf',sha256:'6410d45d5e779f70adfd8eaa3363a5b57e4d697e4e583f6904de7a8ea59e78e5',status:'LOCAL_AUTHORITATIVE_EVIDENCE_VERIFIED'}),
  Object.freeze({sourceId:'meb-tymm-life-science-1-3-2024',courseIds:Object.freeze(['hayat-bilgisi']),grades:Object.freeze([1,2,3]),localDocument:'docs/sources/HAYAT_BILGISI_1_3_TYMM_2024.pdf',sha256:'cda8d284899da3011842228b034aef60ab07fe986422d43ba952a50b6aa96cb5',status:'LOCAL_AUTHORITATIVE_EVIDENCE_VERIFIED'}),
  Object.freeze({sourceId:'meb-tymm-body-play-1-4-2024',courseIds:Object.freeze(['beden-egitimi-ve-oyun']),grades:Object.freeze([1,2,3]),localDocument:'docs/sources/BEDEN_EGITIMI_VE_OYUN_1_4_TYMM.pdf',sha256:'17f595871c0599c29cbab671a04a28a2f165d75a53466389f5fbc67e5fb76cf0',status:'LOCAL_AUTHORITATIVE_EVIDENCE_VERIFIED'})
]);

export const PRIMARY_TYMM_SOURCE_EVIDENCE_AUDIT=Object.freeze({
  ok:PRIMARY_TYMM_SOURCE_EVIDENCE.length===4&&PRIMARY_TYMM_SOURCE_EVIDENCE.every(row=>row.status==='LOCAL_AUTHORITATIVE_EVIDENCE_VERIFIED'&&/^[a-f0-9]{64}$/.test(row.sha256)),
  metrics:Object.freeze({sourceCount:PRIMARY_TYMM_SOURCE_EVIDENCE.length,gradeCount:3,courseCount:4,localEvidenceCount:PRIMARY_TYMM_SOURCE_EVIDENCE.length})
});
