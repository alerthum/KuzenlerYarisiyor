import { PHASE3A_READING_MODELS } from './reading-models-phase3a.js';
import { PHASE3B_READING_MODELS } from './reading-models-phase3b.js';
import { PHASE3C_READING_MODELS } from './reading-models-phase3c.js';

export const PHASE3_READING_IDEAS = Object.freeze([
  'main-idea-coverage',
  'supported-inference',
  'claim-evidence-match',
  'scope-certainty-control',
  'author-purpose',
  'author-attitude',
  'contrast-relation',
  'paragraph-function',
  'necessary-assumption',
  'causal-boundary',
  'cross-text-relation',
  'strongest-evidence'
]);

export const ALL_PHASE3_READING_MODELS = Object.freeze([
  ...PHASE3A_READING_MODELS,
  ...PHASE3B_READING_MODELS,
  ...PHASE3C_READING_MODELS
]);
