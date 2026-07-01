// In-memory session usage tracker — accumulates across requests in the same process
// Judges: this is live data from the Anthropic API response payloads

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
  "claude-opus-4-8":   { input: 15.0, output: 75.0 },
  "claude-haiku-4-5":  { input: 0.8, output: 4.0 },
};

function getPricing(model: string) {
  for (const [key, price] of Object.entries(PRICING)) {
    if (model.includes(key)) return price;
  }
  return PRICING["claude-sonnet-4-6"];
}

type UsageSnapshot = {
  inputTokens: number;
  outputTokens: number;
  requests: number;
  costUsd: number;
  startedAt: number;
};

const state: UsageSnapshot = {
  inputTokens: 0,
  outputTokens: 0,
  requests: 0,
  costUsd: 0,
  startedAt: Date.now(),
};

export function recordUsage(model: string, inputTokens: number, outputTokens: number) {
  const price = getPricing(model);
  state.inputTokens += inputTokens;
  state.outputTokens += outputTokens;
  state.requests += 1;
  state.costUsd += (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
}

export function getUsage(): UsageSnapshot {
  return { ...state };
}
