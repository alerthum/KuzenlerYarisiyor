export function evaluateStudentPilotPublicationGate({ analysis, humanReviewApproved = false, semanticRoundTripPassed = false } = {}) {
  const blockers=[];
  if(!analysis||analysis.status!=='PILOT_PASS')blockers.push('real-student-pilot-not-passed');
  if(analysis?.evidenceType!=='REAL_STUDENT_PILOT')blockers.push('real-student-evidence-required');
  if(humanReviewApproved!==true)blockers.push('human-review-required');
  if(semanticRoundTripPassed!==true)blockers.push('semantic-round-trip-required');
  if(analysis?.items?.some(item=>item.status!=='PILOT_PASS'))blockers.push('item-analysis-failure');
  return Object.freeze({
    schemaVersion:'1.0',
    status:blockers.length?'BLOCKED':'PUBLICATION_ELIGIBLE',
    productReady:false,
    publicationAllowed:blockers.length===0,
    blockers:Object.freeze([...new Set(blockers)]),
    note:blockers.length?'Gerçek öğrenci pilotu ve bütün kanıt kapıları tamamlanmadan yayın açılamaz.':'Bu kapı yalnız içerik uygunluğunu gösterir; genel ürün kararı ayrıca verilmelidir.'
  });
}
