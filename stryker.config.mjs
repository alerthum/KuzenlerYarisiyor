/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // Kritik final kanıt kapısı — sıkı birim testleriyle mutation >=90 hedefi.
  mutate: [
    'js/quality/final-evidence-gate.js'
  ],
  testRunner: 'command',
  commandRunner: {
    command: 'node --test tests/mutation-gate-harness.test.mjs tests/stage14-final-evidence-gate.test.mjs'
  },
  reporters: ['clear-text', 'progress-append-only', 'html', 'json'],
  htmlReporter: { fileName: 'quality-reports/mutation/index.html' },
  jsonReporter: { fileName: 'quality-reports/mutation/mutation-report.json' },
  thresholds: { high: 90, low: 80, break: 90 },
  timeoutMS: 15000,
  concurrency: 4,
  ignoreStatic: true,
  mutator: {
    // Mantık/koşul mutasyonlarına odaklan; yüzeysel literal gürültüsünü ele.
    excludedMutations: ['StringLiteral', 'ObjectLiteral', 'ArrayDeclaration']
  }
};
