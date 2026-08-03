import { PHASE3A_READING_MODELS } from './reading-models-phase3a.js';
import { PHASE3B_READING_MODELS } from './reading-models-phase3b.js';

export const PHASE3_READING_IDEAS = Object.freeze([
  'main-idea-coverage',
  'supported-inference',
  'claim-evidence-match',
  'scope-certainty-control',
  'author-purpose',
  'author-attitude',
  'contrast-relation',
  'paragraph-function'
]);

export const ALL_PHASE3_READING_MODELS = Object.freeze([
  ...PHASE3A_READING_MODELS,
  ...PHASE3B_READING_MODELS
]);
