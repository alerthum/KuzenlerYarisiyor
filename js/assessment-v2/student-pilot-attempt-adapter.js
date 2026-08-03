import { hashString } from '../utils.js';
import { defineStudentPilotResponse } from './student-pilot-contract.js';

export function anonymizePilotParticipant(profileId, pilotSalt) {
  const raw=`${String(pilotSalt||'').trim()}:${String(profileId||'').trim()}`;
  if(!String(profileId||'').trim()||!String(pilotSalt||'').trim())throw new Error('profileId-and-pilotSalt-required');
  return `anon_${hashString(raw).toString(36).padStart(8,'0')}`;
}

export function adaptAttemptToStudentPilotResponse({ attempt = {}, pilotId, pilotSalt, profileId, itemDescriptor, datasetSource = 'REAL_STUDENT_PILOT' } = {}) {
  if(!itemDescriptor?.itemId||!itemDescriptor?.gameId)throw new Error('item-descriptor-required');
  if(attempt.sourceQuestionId&&attempt.sourceQuestionId!==itemDescriptor.itemId)throw new Error('source-question-mismatch');
  if(attempt.gameId&&attempt.gameId!==itemDescriptor.gameId)throw new Error('game-mismatch');
  const submittedAt=attempt.answeredAt||attempt.createdAt||new Date().toISOString();
  const responseTimeMs=Math.max(0,Math.round(Number(attempt.responseTimeMs??Number(attempt.elapsedSeconds||0)*1000)));
  const startedAt=attempt.startedAt||new Date(Date.parse(submittedAt)-responseTimeMs).toISOString();
  const omitted=attempt.omitted===true||attempt.selectedOptionId==null;
  const selectedOptionId=omitted?null:String(attempt.selectedOptionId);
  const correct=!omitted&&itemDescriptor.itemFormat==='single-choice'
    ? selectedOptionId===itemDescriptor.correctOptionId
    : Boolean(attempt.correct);
  return defineStudentPilotResponse({
    responseId:String(attempt.id||`pilot_${hashString(`${profileId}:${itemDescriptor.itemId}:${submittedAt}`).toString(36)}`),
    pilotId,
    datasetSource,
    participantAnonId:anonymizePilotParticipant(profileId,pilotSalt),
    itemId:itemDescriptor.itemId,
    gameId:itemDescriptor.gameId,
    grade:Number(attempt.grade||8),
    selectedOptionId,
    omitted,
    score:correct?1:0,
    maxScore:1,
    responseTimeMs,
    hintsUsed:Number(attempt.hintsUsed??attempt.hintCount??0),
    attemptNumber:Number(attempt.attemptNumber||1),
    startedAt,
    submittedAt
  });
}
