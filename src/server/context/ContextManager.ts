/**
 * Context Window & Token Management for K.O.S Autonomous Agent
 * Prevents token overflow, tracks inference costs, and compacts message histories.
 */

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export class ContextManager {
  private maxTokens: number;
  private reservedTokens: number;
  private totalPromptTokens = 0;
  private totalCompletionTokens = 0;

  constructor(maxTokens = 128000, reservedTokens = 4000) {
    this.maxTokens = maxTokens;
    this.reservedTokens = reservedTokens;
  }

  /**
   * Fast character-based token estimator (~4 chars per token)
   */
  public estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 3.8);
  }

  public countHistoryTokens(history: any[]): number {
    let count = 0;
    for (const msg of history) {
      if (typeof msg === 'string') {
        count += this.estimateTokens(msg);
      } else if (msg.parts && Array.isArray(msg.parts)) {
        for (const p of msg.parts) {
          if (p.text) count += this.estimateTokens(p.text);
          if (p.functionCall) count += this.estimateTokens(JSON.stringify(p.functionCall));
          if (p.functionResponse) count += this.estimateTokens(JSON.stringify(p.functionResponse));
        }
      }
    }
    return count;
  }

  /**
   * Truncates or compacts message history to strictly stay within token budget
   */
  public truncateHistory(history: any[], currentPrompt = ''): any[] {
    const promptTokens = this.estimateTokens(currentPrompt);
    const budget = this.maxTokens - this.reservedTokens - promptTokens;

    if (history.length <= 2) return history;

    let currentTokens = this.countHistoryTokens(history);
    if (currentTokens <= budget) {
      return history;
    }

    const initialObjective = history[0];
    const tail = [...history.slice(1)];

    // Drop oldest non-essential interactions from front of tail until budget is met
    while (tail.length > 2 && currentTokens > budget) {
      const dropped = tail.shift();
      if (dropped) {
        currentTokens -= this.countHistoryTokens([dropped]);
      }
    }

    const summaryMarker = {
      role: 'user',
      parts: [
        {
          text: `[Context Compactor]: Older execution iterations were compacted. Current objective remains active.`,
        },
      ],
    };

    return [initialObjective, summaryMarker, ...tail];
  }

  public recordUsage(promptText: string, completionText: string, modelName = 'gemini-2.5-flash'): TokenUsage {
    const promptTokens = this.estimateTokens(promptText);
    const completionTokens = this.estimateTokens(completionText);

    this.totalPromptTokens += promptTokens;
    this.totalCompletionTokens += completionTokens;

    // Pricing estimation per 1M tokens ($0.15 / 1M prompt, $0.60 / 1M completion)
    const cost = (promptTokens / 1_000_000) * 0.15 + (completionTokens / 1_000_000) * 0.60;

    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
      estimatedCostUsd: Math.round(cost * 10000) / 10000,
    };
  }

  public getCumulativeMetrics() {
    return {
      totalPromptTokens: this.totalPromptTokens,
      totalCompletionTokens: this.totalCompletionTokens,
      totalTokens: this.totalPromptTokens + this.totalCompletionTokens,
    };
  }
}
