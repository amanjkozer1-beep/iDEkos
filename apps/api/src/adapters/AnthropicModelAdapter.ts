import { ModelProvider, ModelCallResult } from '../ports/ModelProvider';

export class AnthropicModelAdapter implements ModelProvider {
  private apiKey: string;
  private currentModel: string;

  constructor(model = 'claude-3-5-sonnet-20241022') {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    this.currentModel = model;
  }

  public hasKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  public getModelName(): string {
    return `anthropic:${this.currentModel}`;
  }

  public setModelName(modelName: string): void {
    this.currentModel = modelName.replace(/^anthropic:/, '');
  }

  public async askModel(
    contents: any,
    systemInstruction?: string,
    _useTools = false
  ): Promise<ModelCallResult> {
    if (!this.hasKey()) {
      return {
        text: '',
        isConfigured: false,
        error: 'ANTHROPIC_API_KEY is not configured in server environment.',
      };
    }

    try {
      const prompt = Array.isArray(contents)
        ? contents.map((c) => (typeof c === 'string' ? c : JSON.stringify(c))).join('\n')
        : typeof contents === 'string'
        ? contents
        : JSON.stringify(contents);

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.currentModel,
          max_tokens: 4096,
          system: systemInstruction,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        return {
          text: '',
          isConfigured: true,
          error: `Anthropic API error ${res.status}: ${errorBody}`,
        };
      }

      const data: any = await res.json();
      const text = data.content?.[0]?.text || '';
      return {
        text,
        isConfigured: true,
      };
    } catch (err: any) {
      return {
        text: '',
        isConfigured: true,
        error: `Anthropic error: ${err.message}`,
      };
    }
  }
}
