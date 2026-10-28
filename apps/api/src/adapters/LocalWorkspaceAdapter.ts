import fs from 'fs';
import path from 'path';
import {
  WorkspaceProvider,
  FileNode,
  ReadFileResult,
} from '../ports/WorkspaceProvider';

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  '.playwright-cli',
  '.cache',
  'build',
]);

export class LocalWorkspaceAdapter implements WorkspaceProvider {
  private rootPath: string;

  constructor(rootPath = (process.env.KOS_WORKSPACE_ROOT || process.cwd())) {
    this.rootPath = path.resolve(rootPath);
  }

  private isSubpath(target: string, root: string): boolean {
    const normalizedTarget = path.resolve(target);
    const normalizedRoot = path.resolve(root);
    return (
      normalizedTarget === normalizedRoot ||
      normalizedTarget.startsWith(normalizedRoot + path.sep)
    );
  }

  private normalizePath(filePath: string): string {
    const trimmed = filePath.trim();
    if (this.isSubpath(trimmed, this.rootPath)) {
      return path.resolve(trimmed);
    }
    // Check if it's an explicit root system path outside root (e.g. /etc, /usr, /bin, /root, /var)
    if (/^\/(etc|usr|var|root|bin|sys|proc|dev|tmp|home|opt)(\/|$)/.test(trimmed)) {
      return trimmed;
    }
    // If it's a sibling or parent on the host filesystem
    const parentDir = path.dirname(this.rootPath);
    if (trimmed.startsWith(parentDir) && !this.isSubpath(trimmed, this.rootPath)) {
      return path.resolve(trimmed);
    }
    // Clean relative or leading slashes for web-style paths (e.g. /src/App.tsx -> src/App.tsx)
    const cleaned = trimmed.replace(/^\/+/, '');
    return path.resolve(this.rootPath, cleaned);
  }

  public isPathSafe(targetPath: string): boolean {
    const resolved = this.normalizePath(targetPath);
    try {
      if (fs.existsSync(resolved)) {
        const real = fs.realpathSync(resolved);
        const realRoot = fs.realpathSync(this.rootPath);
        return this.isSubpath(real, realRoot);
      }
    } catch {}
    return this.isSubpath(resolved, this.rootPath);
  }

  public async getFileTree(dir = this.rootPath): Promise<FileNode> {
    const resolvedDir = this.normalizePath(dir);
    if (!this.isPathSafe(dir)) {
      throw new Error('Access denied: target path is outside workspace root.');
    }

    const stat = fs.statSync(resolvedDir);
    const name = path.basename(resolvedDir);
    const relPath = path.relative(this.rootPath, resolvedDir) || '.';

    if (!stat.isDirectory()) {
      return {
        name,
        path: relPath,
        isDirectory: false,
        size: stat.size,
      };
    }

    const entries = fs.readdirSync(resolvedDir);
    const children: FileNode[] = [];

    for (const entry of entries) {
      if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue;
      const fullPath = path.join(resolvedDir, entry);
      try {
        const childStat = fs.statSync(fullPath);
        if (childStat.isDirectory()) {
          children.push(await this.getFileTree(fullPath));
        } else {
          children.push({
            name: entry,
            path: path.relative(this.rootPath, fullPath),
            isDirectory: false,
            size: childStat.size,
          });
        }
      } catch {
        // Skip unreadable files
      }
    }

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

  public async readFile(
    filePath: string,
    startLine?: number,
    endLine?: number
  ): Promise<ReadFileResult> {
    if (!this.isPathSafe(filePath)) {
      throw new Error('Access denied: path escapes workspace root.');
    }

    const resolved = this.normalizePath(filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`File not found: ${filePath}`);
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

  public async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.isPathSafe(filePath)) {
      throw new Error('Access denied: path escapes workspace root.');
    }

    const resolved = this.normalizePath(filePath);
    const parent = path.dirname(resolved);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }

    fs.writeFileSync(resolved, content, 'utf-8');
  }

  public async createFile(filePath: string, content = ''): Promise<void> {
    await this.writeFile(filePath, content);
  }

  public async createDirectory(dirPath: string): Promise<void> {
    if (!this.isPathSafe(dirPath)) {
      throw new Error('Access denied: path escapes workspace root.');
    }
    const resolved = this.normalizePath(dirPath);
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
  }

  public async deletePath(targetPath: string): Promise<void> {
    if (!this.isPathSafe(targetPath)) {
      throw new Error('Access denied: path escapes workspace root.');
    }
    const resolved = this.normalizePath(targetPath);
    if (resolved === this.rootPath) {
      throw new Error('Access denied: cannot delete workspace root.');
    }
    if (fs.existsSync(resolved)) {
      fs.rmSync(resolved, { recursive: true, force: true });
    }
  }

  public async search(
    query: string,
    isRegex = false,
    maxResults = 50
  ): Promise<{ file: string; line: number; content: string }[]> {
    const results: { file: string; line: number; content: string }[] = [];
    let regExp: RegExp;

    try {
      regExp = isRegex ? new RegExp(query, 'i') : new RegExp(this.escapeRegex(query), 'i');
    } catch {
      regExp = new RegExp(this.escapeRegex(query), 'i');
    }

    const walk = (currentDir: string) => {
      if (results.length >= maxResults) return;
      const entries = fs.readdirSync(currentDir);

      for (const entry of entries) {
        if (IGNORED_DIRS.has(entry) || entry.startsWith('.')) continue;
        const fullPath = path.join(currentDir, entry);
        try {
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (stat.isFile() && this.isTextFile(entry)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (regExp.test(lines[i])) {
                results.push({
                  file: path.relative(this.rootPath, fullPath),
                  line: i + 1,
                  content: lines[i].trim(),
                });
                if (results.length >= maxResults) return;
              }
            }
          }
        } catch {
          // ignore
        }
      }
    };

    walk(this.rootPath);
    return results;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private isTextFile(filename: string): boolean {
    const exts = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.yml', '.yaml', '.txt', '.sql'];
    return exts.some((ext) => filename.endsWith(ext));
  }
}
