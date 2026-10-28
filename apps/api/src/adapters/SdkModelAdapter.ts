import { GoogleGenAI, FunctionDeclaration, Type } from '@google/genai';
import dotenv from 'dotenv';
import { ModelProvider, ModelCallResult } from '../ports/ModelProvider';

dotenv.config();

// Tool Declarations for Autonomous Agent Function Calling
const readFileDeclaration: FunctionDeclaration = {
  name: 'read_file',
  description: 'Read contents of a file within the workspace. Supports optional start and end line ranges.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: 'Relative path to the workspace file (e.g. src/App.tsx)',
      },
      start_line: {
        type: Type.INTEGER,
        description: 'Optional 1-based start line number to clip',
      },
      end_line: {
        type: Type.INTEGER,
        description: 'Optional 1-based end line number to clip',
      },
    },
    required: ['path'],
  },
};

const listDirDeclaration: FunctionDeclaration = {
  name: 'list_dir',
  description: 'List directories and files in a workspace folder path.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: 'Relative directory path to inspect (defaults to . for root)',
      },
    },
  },
};

const writePatchDeclaration: FunctionDeclaration = {
  name: 'write_patch',
  description: 'Apply surgical Search & Replace patch block to a workspace file without rewriting the entire file.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: 'Relative file path to modify',
      },
      search_block: {
        type: Type.STRING,
        description: 'Exact block of existing code to search for',
      },
      replace_block: {
        type: Type.STRING,
        description: 'Replacement block of new code',
      },
    },
    required: ['path', 'search_block', 'replace_block'],
  },
};

const runTerminalDeclaration: FunctionDeclaration = {
  name: 'run_terminal',
  description: 'Execute an authorized sandboxed shell command (e.g. npm test, npm run lint, git status, ls).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description: 'The shell command line string to run',
      },
    },
    required: ['command'],
  },
};

const searchCodebaseDeclaration: FunctionDeclaration = {
  name: 'search_codebase',
  description: 'Search across workspace files for a text string or regex pattern. Returns matching files, line numbers, and snippets.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Text string or regex pattern to search for in files',
      },
      is_regex: {
        type: Type.BOOLEAN,
        description: 'Whether to treat the query as a regular expression',
      },
      max_results: {
        type: Type.INTEGER,
        description: 'Maximum number of match entries to return (default: 30)',
      },
    },
    required: ['query'],
  },
};

const createFileDeclaration: FunctionDeclaration = {
  name: 'create_file',
  description: 'Create a new file within the workspace with the specified content.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: 'Relative path for the new file (e.g. src/utils/helpers.ts)',
      },
      content: {
        type: Type.STRING,
        description: 'Full initial content for the new file',
      },
    },
    required: ['path', 'content'],
  },
};

const rollbackFileDeclaration: FunctionDeclaration = {
  name: 'rollback_file',
  description: 'Rollback a modified file to its previous snapshot if a patch introduced defects or errors.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: 'Relative path of the file to revert',
      },
    },
    required: ['path'],
  },
};

const diagnosticsDeclaration: FunctionDeclaration = {
  name: 'check_diagnostics',
  description: 'Run project-wide TypeScript typechecker and build diagnostics to verify zero compilation errors.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      scope: {
        type: Type.STRING,
        description: 'Diagnostics scope: "typecheck" (default) or "build"',
      },
    },
  },
};

const AGENT_TOOLS = [
  {
    functionDeclarations: [
      readFileDeclaration,
      listDirDeclaration,
      writePatchDeclaration,
      createFileDeclaration,
      rollbackFileDeclaration,
      searchCodebaseDeclaration,
      runTerminalDeclaration,
      diagnosticsDeclaration,
    ],
  },
];

export class SdkModelAdapter implements ModelProvider {
  private client: GoogleGenAI;
  private currentModel: string;
  private apiKey: string;

  constructor(defaultModel = process.env.MODEL_NAME || 'gemini-3.5-flash-lite') {
    this.apiKey = process.env.MODEL_API_KEY || process.env.GEMINI_API_KEY || '';
    this.currentModel = defaultModel;
    this.client = new GoogleGenAI({
      apiKey: this.apiKey || 'placeholder-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  public hasKey(): boolean {
    return Boolean(
      this.apiKey &&
      this.apiKey !== 'MY_GEMINI_API_KEY' &&
      this.apiKey !== 'MY_MODEL_API_KEY' &&
      this.apiKey !== 'placeholder-key'
    );
  }

  public getModelName(): string {
    return this.currentModel;
  }

  public setModelName(modelName: string): void {
    this.currentModel = modelName;
  }

  public async askModel(
    contents: any,
    systemInstruction?: string,
    useTools = true
  ): Promise<ModelCallResult> {
    if (!this.hasKey()) {
      return {
        text: '',
        functionCalls: undefined,
        isConfigured: false,
        error: 'API_KEY_REQUIRED: Inference API key is not configured in server environment secrets.',
      };
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.currentModel,
        contents,
        config: {
          systemInstruction:
            systemInstruction ||
            'You are the autonomous agent engine behind K.O.S (Kozer Operating System). Use tools (read_file, write_patch, run_terminal, list_dir) to inspect and modify codebase files surgically. Never rewrite entire files blindly; always use write_patch.',
          tools: useTools ? AGENT_TOOLS : undefined,
        },
      });

      return {
        text: response.text || '',
        functionCalls: response.functionCalls?.map((fc) => ({
          name: fc.name || '',
          args: fc.args || {},
        })),
        isConfigured: true,
      };
    } catch (err: any) {
      return {
        text: '',
        isConfigured: true,
        error: err.message || 'Model inference failed',
      };
    }
  }
}
