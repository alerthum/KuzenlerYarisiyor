import { seededRandom } from '../utils.js';
import { canBuildWord } from '../engines/word-engine.js';
import { validateTargetExpression } from '../engines/math-engine.js';
import { isPremiumGradeEligible, normalizeStudentGrade } from './premium-grade-band.js';

function required(value, field, id) {
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${id || 'premium-task'}: ${field} is required`);
  return text;
}

function stableHash(value = '') {
  let hash = 2166136261;
  for (const ch of String(value)) {
    hash ^= ch.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function shuffle(entries, random) {
  const out = entries.map((entry) => typeof entry === 'object' ? { ...entry } : entry);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function normalizeWord(value = '') {
  return String(value).toLocaleLowerCase('tr-TR').trim();
}

function oneLetterDifferent(a, b) {
  const left = [...normalizeWord(a)];
  const right = [...normalizeWord(b)];
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) if (left[i] !== right[i]) diff += 1;
  return diff === 1;
}

function validateDiagnostics(diagnostics, id) {
  if (!Array.isArray(diagnostics) || diagnostics.length < 3) {
    throw new Error(`${id}: at least three diagnostic rules are required`);
  }
  const ids = diagnostics.map((entry) => required(entry?.id, 'diagnostic.id', id));
  if (new Set(ids).size !== ids.length) throw new Error(`${id}: diagnostic ids must be distinct`);
  for (const entry of diagnostics) {
    required(entry?.why, 'diagnostic.why', id);
    required(entry?.detectionRule, 'diagnostic.detectionRule', id);
  }
}

export function definePremiumTask({
  id, gameId, kind, familyId, skeletonId, reasoningPathId = 'constraint-first',
  subjectId, topicId, learningOutcomeId, gradeBand = '6-8', prompt, context = '',
  explanation, hints = [], cognitiveTraits, reasoningStepCount = 2, evidence,
  diagnostics, difficulty = 4, task
}) {
  const itemId = required(id, 'id', id);
  const taskKind = required(kind, 'kind', itemId);
  if (!['wordLadder', 'wordOrder', 'story', 'wordMine', 'expression'].includes(taskKind)) {
    throw new Error(`${itemId}: unsupported premium task kind ${taskKind}`);
  }
  if (!Array.isArray(cognitiveTraits) || cognitiveTraits.length < 2) {
    throw new Error(`${itemId}: at least two cognitive traits are required`);
  }
  if (!Array.isArray(evidence) || evidence.length < 2) {
    throw new Error(`${itemId}: at least two evidence steps are required`);
  }
  if (Number(reasoningStepCount) < 2) throw new Error(`${itemId}: reasoningStepCount must be at least 2`);
  validateDiagnostics(diagnostics, itemId);
  if (!task || typeof task !== 'object') throw new Error(`${itemId}: task config is required`);

  if (taskKind === 'wordLadder') {
    const path = [task.start, ...(task.steps || []), task.end].map(normalizeWord);
    if (path.length < 3) throw new Error(`${itemId}: word ladder requires at least one intermediate word`);
    if (path.some((word) => word.length < 3 || word.length > 6)) throw new Error(`${itemId}: word length must be 3-6`);
    if (new Set(path.map((word) => [...word].length)).size !== 1) throw new Error(`${itemId}: all ladder words must have equal length`);
    for (let i = 1; i < path.length; i += 1) {
      if (!oneLetterDifferent(path[i - 1], path[i])) throw new Error(`${itemId}: invalid ladder step ${path[i - 1]} -> ${path[i]}`);
    }
    const dictionary = new Set((task.dictionary || path).map(normalizeWord));
    if (path.some((word) => !dictionary.has(word))) throw new Error(`${itemId}: ladder path must be in dictionary`);
  }

  if (taskKind === 'wordOrder') {
    if (!Array.isArray(task.answerTokens) || task.answerTokens.length < 5) {
      throw new Error(`${itemId}: wordOrder requires at least five answer tokens`);
    }
    if (task.answerTokens.some((token) => !String(token).trim())) throw new Error(`${itemId}: blank wordOrder token`);
  }

  if (taskKind === 'story') {
    const letter = required(task.forbiddenLetter, 'task.forbiddenLetter', itemId);
    if ([...letter].length !== 1) throw new Error(`${itemId}: forbiddenLetter must be one character`);
    if (Number(task.minSentences) < 3) throw new Error(`${itemId}: story requires at least three sentences`);
    if (Number(task.minUniqueWords) < 15) throw new Error(`${itemId}: story requires at least 15 unique words`);
    if (!Array.isArray(task.rubric) || task.rubric.length < 4) throw new Error(`${itemId}: story rubric requires four criteria`);
  }

  if (taskKind === 'wordMine') {
    const source = required(task.source, 'task.source', itemId);
    if (!Array.isArray(task.allowed) || task.allowed.length < 8) throw new Error(`${itemId}: wordMine requires at least eight verified words`);
    const words = task.allowed.map(normalizeWord);
    if (new Set(words).size !== words.length) throw new Error(`${itemId}: wordMine words must be distinct`);
    if (words.some((word) => word.length < 3 || !canBuildWord(source, word))) {
      throw new Error(`${itemId}: every wordMine word must be buildable from source letters`);
    }
  }

  if (taskKind === 'expression') {
    if (!Array.isArray(task.numbers) || task.numbers.length < 4 || task.numbers.some((value) => !Number.isFinite(Number(value)))) {
      throw new Error(`${itemId}: expression requires at least four finite numbers`);
    }
    if (!Number.isFinite(Number(task.target))) throw new Error(`${itemId}: expression target must be finite`);
    const solution = required(task.solution, 'task.solution', itemId);
    const verdict = validateTargetExpression(solution, task.numbers.map(Number), Number(task.target));
    if (!verdict.valid) throw new Error(`${itemId}: expression solution is invalid — ${verdict.reason}`);
  }

  return Object.freeze({
    id: itemId,
    gameId: required(gameId, 'gameId', itemId),
    kind: taskKind,
    familyId: required(familyId, 'familyId', itemId),
    skeletonId: required(skeletonId, 'skeletonId', itemId),
    reasoningPathId: required(reasoningPathId, 'reasoningPathId', itemId),
    subjectId: required(subjectId, 'subjectId', itemId),
    topicId: required(topicId, 'topicId', itemId),
    learningOutcomeId: required(learningOutcomeId, 'learningOutcomeId', itemId),
    gradeBand: required(gradeBand, 'gradeBand', itemId),
    prompt: required(prompt, 'prompt', itemId),
    context: String(context || '').trim(),
    explanation: required(explanation, 'explanation', itemId),
    hints: Array.isArray(hints) ? hints.filter(Boolean) : [],
    cognitiveTraits: [...cognitiveTraits],
    reasoningStepCount: Number(reasoningStepCount),
    evidence: [...evidence],
    diagnostics: diagnostics.map((entry) => Object.freeze({ ...entry })),
    difficulty: Number(difficulty),
    task: Object.freeze({ ...task })
  });
}

export function createPremiumTaskPack({ version, sourceLabel, items }) {
  if (!Array.isArray(items) || !items.length) throw new Error('premium task pack must contain items');
  const byGame = new Map();
  for (const item of items) {
    if (!byGame.has(item.gameId)) byGame.set(item.gameId, []);
    byGame.get(item.gameId).push(item);
  }
  const gameIds = Object.freeze([...byGame.keys()]);

  function materialize(item, random) {
    const base = {
      kind: item.kind,
      prompt: item.prompt,
      context: item.context,
      explanation: item.explanation,
      hints: item.hints.length ? item.hints : ['Görevin kısıtlarını tek tek işaretle.', 'Cevabını göndermeden önce her kısıtı yeniden kontrol et.'],
      skill: item.subjectId,
      subjectId: item.subjectId,
      topicId: item.topicId,
      learningOutcomeId: item.learningOutcomeId,
      gradeBand: item.gradeBand,
      difficulty: item.difficulty,
      cognitiveDepth: item.difficulty,
      reasoningStepCount: item.reasoningStepCount,
      cognitiveTraits: item.cognitiveTraits,
      questionKey: `premium-task:${version}:${item.gameId}:${item.id}:${stableHash(`${item.prompt}|${item.context}`)}`,
      familyId: item.familyId,
      skeletonId: item.skeletonId,
      reasoningPathId: item.reasoningPathId,
      sourceLabel,
      premiumTier: 'GOLD',
      premiumQuestion: true,
      premiumTask: true,
      premiumPilot: true,
      premiumBankVersion: version,
      taskValidation: {
        verified: true,
        diagnosticCount: item.diagnostics.length,
        diagnostics: item.diagnostics
      },
      evidenceMap: {
        evidence: item.evidence.map((text, index) => ({ id: `${item.id}:e${index + 1}`, text })),
        correctAnswerEvidenceIds: item.evidence.map((_, index) => `${item.id}:e${index + 1}`)
      },
      cognitiveDepthEvidence: {
        reasoningStepCount: item.reasoningStepCount,
        highCognitiveTraits: item.cognitiveTraits,
        source: 'premium-human-authored-task'
      },
      solutionGraph: item.evidence.map((text, index) => ({ step: index + 1, evidence: text }))
    };

    if (item.kind === 'wordLadder') {
      const path = [item.task.start, ...(item.task.steps || []), item.task.end].map(normalizeWord);
      return {
        ...base,
        start: path[0],
        end: path.at(-1),
        steps: path.slice(1, -1),
        suggestedStepCount: path.length - 2,
        minSteps: Number(item.task.minSteps ?? Math.max(1, path.length - 3)),
        maxSteps: Number(item.task.maxSteps ?? Math.min(7, path.length)),
        dictionary: [...new Set((item.task.dictionary || path).map(normalizeWord))],
        evaluationRubric: item.task.rubric || ['Her adım gerçek kelimedir.', 'Her adımda tek harf değişir.', 'Kelime uzunluğu korunur.', 'Hedef kelimeye ulaşılır.']
      };
    }

    if (item.kind === 'wordOrder') {
      const answerTokens = item.task.answerTokens.map(String);
      const tokens = shuffle(answerTokens.map((value, index) => ({ id: `${item.id}:${index}`, value })), random);
      return {
        ...base,
        tokens,
        answerTokens,
        evaluationRubric: item.task.rubric || ['Bütün kelimeler kullanılır.', 'Özne-yüklem sırası doğrudur.', 'Zaman ve bağlaç yapısı korunur.', 'Cümle anlamlıdır.']
      };
    }

    if (item.kind === 'wordMine') {
      const allowed = [...new Set(item.task.allowed.map(normalizeWord))];
      return {
        ...base,
        source: normalizeWord(item.task.source),
        allowed,
        dictionary: allowed,
        evaluationRubric: item.task.rubric || ['Kelime en az üç harflidir.', 'Yalnız ana kelimedeki harfleri kullanır.', 'Bir harfi envanterdekinden fazla kullanmaz.', 'Doğrulanmış kelime listesinde yer alır.']
      };
    }

    if (item.kind === 'expression') {
      return {
        ...base,
        rule: item.task.rule || 'Verilen sayıların her birini yalnız bir kez kullan; dört işlem ve parantezlerden yararlan.',
        numbers: item.task.numbers.map(Number),
        target: Number(item.task.target),
        solution: String(item.task.solution),
        evaluationRubric: item.task.rubric || ['Bütün sayılar birer kez kullanılır.', 'Başka sayı eklenmez.', 'İşlem sırası ve parantezler geçerlidir.', 'Sonuç hedef sayıya eşittir.']
      };
    }

    return {
      ...base,
      forbiddenLetter: String(item.task.forbiddenLetter).toLocaleLowerCase('tr-TR'),
      minSentences: Number(item.task.minSentences),
      minUniqueWords: Number(item.task.minUniqueWords),
      evaluationRubric: [...item.task.rubric],
      modelPlan: item.task.modelPlan || []
    };
  }

  function generate(gameId, { seed = 1, count = 20, seenQuestionKeys = new Set(), grade = null } = {}) {
    const gameItems = byGame.get(gameId) || [];
    if (!gameItems.length) return { rounds: [], audit: { supported: false, gameId, available: 0, produced: 0 } };
    const normalizedGrade = normalizeStudentGrade(grade);
    const eligibleItems = gameItems.filter((item) => isPremiumGradeEligible(item.gradeBand, normalizedGrade));
    const random = seededRandom(`${gameId}:${seed}:${version}:${normalizedGrade ?? 'all'}`);
    const candidates = eligibleItems
      .map((item) => materialize(item, random))
      .filter((round) => !seenQuestionKeys.has(round.questionKey));
    const rounds = shuffle(candidates, random).slice(0, Math.max(0, Number(count) || 0));
    return {
      rounds,
      audit: {
        supported: true,
        gameId,
        version,
        available: gameItems.length,
        gradeRequested: normalizedGrade,
        gradeFilterApplied: normalizedGrade !== null,
        gradeEligibleAvailable: eligibleItems.length,
        gradeBandsAvailable: [...new Set(gameItems.map((item) => item.gradeBand))],
        unseenAvailable: candidates.length,
        requested: count,
        produced: rounds.length,
        fallbackToLegacy: false,
        taskKinds: [...new Set(gameItems.map((item) => item.kind))]
      }
    };
  }

  function inventory() {
    return Object.fromEntries([...byGame.entries()].map(([gameId, gameItems]) => [gameId, {
      questionCount: gameItems.length,
      familyCount: new Set(gameItems.map((item) => item.familyId)).size,
      topicCount: new Set(gameItems.map((item) => item.topicId)).size,
      subjectCount: new Set(gameItems.map((item) => item.subjectId)).size,
      gradeBands: [...new Set(gameItems.map((item) => item.gradeBand))],
      taskKinds: [...new Set(gameItems.map((item) => item.kind))],
      allHaveThreeMisconceptions: true,
      allHaveDiagnosticRules: gameItems.every((item) => item.diagnostics.length >= 3)
    }]));
  }

  return Object.freeze({ version, sourceLabel, gameIds, generate, inventory });
}

export function validatePremiumTaskRound(round = {}) {
  const errors = [];
  if (!round.premiumTask) errors.push('premium_task_flag_missing');
  if (!round.taskValidation?.verified) errors.push('task_validation_missing');
  if (!Array.isArray(round.taskValidation?.diagnostics) || round.taskValidation.diagnostics.length < 3) errors.push('diagnostic_rules_missing');
  if (!Array.isArray(round.solutionGraph) || round.solutionGraph.length < 2) errors.push('solution_graph_missing');
  if (round.kind === 'wordLadder') {
    const path = [round.start, ...(round.steps || []), round.end];
    if (path.length < 3) errors.push('word_ladder_path_missing');
    for (let i = 1; i < path.length; i += 1) if (!oneLetterDifferent(path[i - 1], path[i])) errors.push('word_ladder_invalid_step');
  } else if (round.kind === 'wordOrder') {
    if (!Array.isArray(round.answerTokens) || round.answerTokens.length < 5) errors.push('word_order_answer_missing');
    if (!Array.isArray(round.tokens) || round.tokens.length !== round.answerTokens?.length) errors.push('word_order_tokens_mismatch');
  } else if (round.kind === 'story') {
    if (![...String(round.forbiddenLetter || '')].length) errors.push('story_forbidden_letter_missing');
    if (Number(round.minSentences) < 3 || Number(round.minUniqueWords) < 15) errors.push('story_threshold_too_low');
    if (!Array.isArray(round.evaluationRubric) || round.evaluationRubric.length < 4) errors.push('story_rubric_missing');
  }
  else if (round.kind === 'wordMine') {
    const source = String(round.source || '');
    const allowed = Array.isArray(round.allowed) ? round.allowed : [];
    if (!source || allowed.length < 8) errors.push('word_mine_contract_missing');
    if (allowed.some((word) => !canBuildWord(source, word))) errors.push('word_mine_invalid_word');
  } else if (round.kind === 'expression') {
    if (!Array.isArray(round.numbers) || round.target == null || !round.solution) errors.push('expression_contract_missing');
    else {
      const verdict = validateTargetExpression(round.solution, round.numbers, round.target);
      if (!verdict.valid) errors.push('expression_solution_invalid');
    }
  }
  return { ok: errors.length === 0, errors };
}
