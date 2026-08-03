export const AI_PROVIDER_MODES = Object.freeze({ LOCAL: 'local', OPENAI: 'openai', GEMINI: 'gemini', HYBRID: 'hybrid' });
export function resolveProvider(config = {}) {
  const requested = String(config.aiProvider || 'local').toLowerCase();
  return Object.values(AI_PROVIDER_MODES).includes(requested) ? requested : AI_PROVIDER_MODES.LOCAL;
}
export function providerCapabilities(mode) {
  return { mode, localDecisionEngine: true, generativeExplanations: mode !== 'local', remoteQuestionReview: mode !== 'local', gracefulFallback: true };
}
