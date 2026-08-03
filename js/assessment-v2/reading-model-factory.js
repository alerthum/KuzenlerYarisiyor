import { defineItemModel } from './contracts.js';
import { solveReadingEvidenceTask, verifyReadingEvidenceAnswer } from './reading-evidence-solver.js';

function freezeTask(task) {
  return structuredClone(task);
}

export function defineReadingEvidenceModel(config) {
  return defineItemModel({
    ...config,
    domain: 'reading',
    interactionType: config.interactionType || 'choice',
    generateTask: input => freezeTask(config.createTask(input || {})),
    solve: task => solveReadingEvidenceTask(task),
    verify: (task, value) => verifyReadingEvidenceAnswer(task, value),
    render: task => ({
      context: task.passages ? task.passages.join('\n\n') : task.passage,
      prompt: task.prompt,
      formatOption: value => value?.text || String(value)
    }),
    misconceptions: config.misconceptions.map(misconception => ({
      ...misconception,
      apply: task => task.options.find(option => option.role === misconception.optionRole)
    }))
  });
}

export function option(id, role, text, semantic) {
  return Object.freeze({ id, role, text, semantic: Object.freeze(semantic) });
}

export function proposition({ subject, predicate, object, polarity = 'positive', relation = 'statement', modality = 'certain', quantifier = 'all', scope = [], causeId } = {}) {
  return Object.freeze({ subject, predicate, object, polarity, relation, modality, quantifier, scope: Object.freeze([...scope]), ...(causeId ? { causeId } : {}) });
}
