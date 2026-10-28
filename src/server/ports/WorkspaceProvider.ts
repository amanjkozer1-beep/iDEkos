export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

export interface ReadFileResult {
  content: string;
  totalLines: number;
  range: [number, number];
}

export interface WorkspaceProvider {
  getFileTree(dir?: string): Promise<FileNode>;
  readFile(filePath: string, startLine?: number, endLine?: number): Promise<ReadFileResult>;
  writeFile(filePath: string, content: string): Promise<void>;
  createFile(filePath: string, content?: string): Promise<void>;
  createDirectory(dirPath: string): Promise<void>;
  deletePath(targetPath: string): Promise<void>;
  isPathSafe(targetPath: string): boolean;
  search(query: string, isRegex?: boolean, maxResults?: number): Promise<{ file: string; line: number; content: string }[]>;
}
