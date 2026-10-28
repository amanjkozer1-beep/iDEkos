import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

export interface CodeSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'variable' | 'export';
  line: number;
}

export interface SearchMatch {
  file: string;
  line: number;
  content: string;
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.playwright-cli',
  '.cache',
  'build',
]);

export function getFileTree(dir: string, baseDir = dir): FileNode {
  const stat = fs.statSync(dir);
  const name = path.basename(dir);
  const relPath = path.relative(baseDir, dir) || '.';

  if (!stat.isDirectory()) {
    return {
      name,
      path: relPath,
      isDirectory: false,
      size: stat.size,
    };
  }

  const entries = fs.readdirSync(dir);
  const children: FileNode[] = [];

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue;
    const fullPath = path.join(dir, entry);
    try {
      const childStat = fs.statSync(fullPath);
      if (childStat.isDirectory()) {
        children.push(getFileTree(fullPath, baseDir));
      } else {
        children.push({
          name: entry,
          path: path.relative(baseDir, fullPath),
          isDirectory: false,
          size: childStat.size,
        });
      }
    } catch {
      // Ignore unreadable entries
    }
  }

  // Sort folders first, then alphabetical
  children.sort((a, b) => {
    if (a.isDirectory === b.isDirectory) {
      return a.name.localeCompare(b.name);
    }
    return a.isDirectory ? -1 : 1;
  });

  return {
    name,
    path: relPath,
    isDirectory: true,
    children,
  };
}

export function searchCodebase(
  query: string,
  rootPath: string,
  isRegex = false,
  maxResults = 50
): SearchMatch[] {
  const results: SearchMatch[] = [];
  let regExp: RegExp;

  try {
    regExp = isRegex ? new RegExp(query, 'i') : new RegExp(escapeRegex(query), 'i');
  } catch {
    regExp = new RegExp(escapeRegex(query), 'i');
  }

  function walk(currentDir: string) {
    if (results.length >= maxResults) return;
    const entries = fs.readdirSync(currentDir);

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue;
      const fullPath = path.join(currentDir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && isTextFile(entry)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            if (regExp.test(lines[i])) {
              results.push({
                file: path.relative(rootPath, fullPath),
                line: i + 1,
                content: lines[i].trim(),
              });
              if (results.length >= maxResults) return;
            }
          }
        } catch {
          // Skip unreadable files
        }
      }
    }
  }

  walk(rootPath);
  return results;
}

export function readFileClip(
  filePath: string,
  rootPath: string,
  startLine?: number,
  endLine?: number
): { content: string; totalLines: number; range: [number, number] } {
  const resolved = path.resolve(rootPath, filePath);
  if (!resolved.startsWith(path.resolve(rootPath))) {
    throw new Error('Access denied: path outside workspace.');
  }

  const fileContent = fs.readFileSync(resolved, 'utf-8');
  const lines = fileContent.split('\n');
  const totalLines = lines.length;

  const start = startLine ? Math.max(1, startLine) : 1;
  const end = endLine ? Math.min(totalLines, endLine) : totalLines;

  const clipped = lines.slice(start - 1, end).join('\n');
  return {
    content: clipped,
    totalLines,
    range: [start, end],
  };
}

export function extractCodeSymbols(content: string): CodeSymbol[] {
  const symbols: CodeSymbol[] = [];
  const lines = content.split('\n');

  const patterns = [
    { kind: 'function' as const, regex: /(?:function\s+([A-Za-z0-9_]+)|const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/ },
    { kind: 'class' as const, regex: /class\s+([A-Za-z0-9_]+)/ },
    { kind: 'interface' as const, regex: /interface\s+([A-Za-z0-9_]+)/ },
    { kind: 'export' as const, regex: /export\s+(?:default\s+)?(?:const|function|class|interface|type)\s+([A-Za-z0-9_]+)/ },
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of patterns) {
      const match = pat.regex.exec(line);
      if (match) {
        const name = match[1] || match[2];
        if (name && !symbols.some((s) => s.name === name && s.line === i + 1)) {
          symbols.push({
            name,
            kind: pat.kind,
            line: i + 1,
          });
        }
      }
    }
  }

  return symbols;
}

export async function runDiagnostics(rootPath: string): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout } = await execPromise('npm run lint', { cwd: rootPath, timeout: 25000 });
    return { success: true, output: stdout || 'Clean build: No TypeScript or lint errors detected.' };
  } catch (err: any) {
    return {
      success: false,
      output: err.stdout || err.stderr || err.message || 'Diagnostic errors detected.',
    };
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isTextFile(filename: string): boolean {
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.yml', '.yaml', '.txt'];
  return exts.some((ext) => filename.endsWith(ext));
}
