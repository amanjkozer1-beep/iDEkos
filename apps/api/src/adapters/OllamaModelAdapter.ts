import { ModelProvider, ModelCallResult } from '../ports/ModelProvider';

export class OllamaModelAdapter implements ModelProvider {
  private baseUrl: string;
  private currentModel: string;

  constructor(model = 'llama3.2', baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434') {
    this.currentModel = model;
    this.baseUrl = baseUrl;
  }

  public hasKey(): boolean {
    return true; // Local inference doesn't require cloud key
  }

  public getModelName(): string {
    return `ollama:${this.currentModel}`;
  }

  public setModelName(modelName: string): void {
    this.currentModel = modelName.replace(/^ollama:/, '');
  }

  public async askModel(
    contents: any,
    systemInstruction?: string,
    _useTools = false
  ): Promise<ModelCallResult> {
    try {
      const prompt = Array.isArray(contents)
        ? contents.map((c) => (typeof c === 'string' ? c : JSON.stringify(c))).join('\n')
        : typeof contents === 'string'
        ? contents
        : JSON.stringify(contents);

      const res = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.currentModel,
          prompt,
          system: systemInstruction,
          stream: false,
        }),
      });

      if (!res.ok) {
        return {
          text: '',
          isConfigured: false,
          error: `Ollama error HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data: any = await res.json();
      return {
        text: data.response || '',
        isConfigured: true,
      };
    } catch (err: any) {
      return {
        text: '',
        isConfigured: false,
        error: `Ollama unavailable at ${this.baseUrl}: ${err.message}`,
      };
    }
  }
}
