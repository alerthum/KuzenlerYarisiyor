import { PHASE2_MATH_MODELS } from './math-models.js';
import { PHASE2B_MATH_MODELS } from './math-models-phase2b.js';
import { PHASE2C_MATH_MODELS } from './math-models-phase2c.js';

const BASE_IDEAS = Object.freeze([
  'two-stage lattice path counting',
  'modular digit enumeration',
  'ordered compositions/recurrence',
  'two-set inclusion-exclusion'
]);

const PHASE2B_IDEAS = Object.freeze([
  'gcd invariant/reverse Euclidean reachability',
  'parity and checkerboard coloring',
  'extremal maximum-degree bound'
]);

const PHASE2C_IDEAS = Object.freeze([
  'divisor exponent structure',
  'geometric reflection transformation'
]);

export const ALL_PHASE2_MATH_MODELS = Object.freeze([
  ...PHASE2_MATH_MODELS,
  ...PHASE2B_MATH_MODELS,
  ...PHASE2C_MATH_MODELS
]);

export const PHASE2_MATH_IDEAS = Object.freeze([
  ...BASE_IDEAS,
  ...PHASE2B_IDEAS,
  ...PHASE2C_IDEAS
]);
