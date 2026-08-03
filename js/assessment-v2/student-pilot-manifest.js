import { assessmentV2PilotItemDescriptors } from './student-pilot-fixture.js';

export const ASSESSMENT_V2_STUDENT_PILOT_MANIFEST=Object.freeze({
  schemaVersion:'1.0',
  pilotId:'ASSESSMENT_V2_CONTROLLED_PILOT_001',
  status:'ENGINE_READY_AWAITING_REAL_PARTICIPANTS',
  productReady:false,
  publicationAllowed:false,
  datasetSourceRequired:'REAL_STUDENT_PILOT',
  privacy:Object.freeze({
    piiCollectionAllowed:false,
    anonymousParticipantIdRequired:true,
    consentRequired:true,
    rawResponseRetentionDays:90,
    aggregateRetentionAllowed:true
  }),
  sampling:Object.freeze({
    minimumUniqueParticipants:100,
    targetUniqueParticipants:150,
    minimumResponsesPerItem:80,
    gradeBands:Object.freeze([8]),
    pilotMode:'CONTROLLED_SCHOOL_OR_INVITED_COHORT'
  }),
  items:assessmentV2PilotItemDescriptors(),
  gates:Object.freeze([
    'human-review-approved',
    'semantic-round-trip-pass',
    'real-student-pilot-evidence',
    'item-difficulty-0.20-0.90',
    'item-discrimination-at-least-0.20',
    'maximum-one-nonfunctional-distractor',
    'omission-rate-at-most-0.10'
  ])
});
