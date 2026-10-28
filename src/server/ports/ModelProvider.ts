export interface ModelCallResult {
  text: string;
  functionCalls?: Array<{
    name: string;
    args: any;
  }>;
  isConfigured: boolean;
  error?: string;
}

export interface ModelProvider {
  hasKey(): boolean;
  askModel(
    contents: any,
    systemInstruction?: string,
    useTools?: boolean
  ): Promise<ModelCallResult>;
  getModelName(): string;
  setModelName(modelName: string): void;
}
