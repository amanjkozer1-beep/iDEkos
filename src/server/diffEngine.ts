/**
 * Surgical Diff and Patch Engine for K.O.S Autonomous Agent
 * Supports Search & Replace blocks with fuzzy matching and unified diff calculation
 */

export interface PatchBlock {
  search: string;
  replace: string;
}

export interface DiffResult {
  success: boolean;
  originalContent: string;
  modifiedContent: string;
  diffText: string;
  linesAdded: number;
  linesRemoved: number;
  error?: string;
}

export function parseSearchReplaceBlocks(patchString: string): PatchBlock[] {
  const blocks: PatchBlock[] = [];
  const regex = /<<<<<<< SEARCH\r?\n([\s\S]*?)\r?\n=======\r?\n([\s\S]*?)\r?\n>>>>>>> REPLACE/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(patchString)) !== null) {
    blocks.push({
      search: match[1],
      replace: match[2],
    });
  }

  return blocks;
}

export function applySearchReplace(
  content: string,
  search: string,
  replace: string
): { success: boolean; result: string; error?: string } {
  // Normalize line endings
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const normalizedSearch = search.replace(/\r\n/g, '\n');
  const normalizedReplace = replace.replace(/\r\n/g, '\n');

  // Exact match first
  if (normalizedContent.includes(normalizedSearch)) {
    const result = normalizedContent.replace(normalizedSearch, normalizedReplace);
    return { success: true, result };
  }

  // Trimmed line-by-line fuzzy match (ignoring leading/trailing whitespace changes)
  const contentLines = normalizedContent.split('\n');
  const searchLines = normalizedSearch.split('\n');

  for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
    let matches = true;
    for (let j = 0; j < searchLines.length; j++) {
      if (contentLines[i + j].trim() !== searchLines[j].trim()) {
        matches = false;
        break;
      }
    }

    if (matches) {
      // Found fuzzy match! Replace the range [i, i + searchLines.length]
      const before = contentLines.slice(0, i);
      const after = contentLines.slice(i + searchLines.length);
      const replaceLines = normalizedReplace.split('\n');
      const newLines = [...before, ...replaceLines, ...after];
      return { success: true, result: newLines.join('\n') };
    }
  }

  return {
    success: false,
    result: content,
    error: 'Search block not found in target file.',
  };
}

export function generateUnifiedDiff(original: string, modified: string, filename = 'file'): DiffResult {
  const origLines = original.replace(/\r\n/g, '\n').split('\n');
  const modLines = modified.replace(/\r\n/g, '\n').split('\n');

  let linesAdded = 0;
  let linesRemoved = 0;
  const diffRows: string[] = [`--- a/${filename}`, `+++ b/${filename}`];

  let i = 0;
  let j = 0;

  while (i < origLines.length || j < modLines.length) {
    if (i < origLines.length && j < modLines.length && origLines[i] === modLines[j]) {
      diffRows.push(`  ${origLines[i]}`);
      i++;
      j++;
    } else if (j < modLines.length && (i >= origLines.length || !origLines.includes(modLines[j]))) {
      diffRows.push(`+ ${modLines[j]}`);
      linesAdded++;
      j++;
    } else if (i < origLines.length) {
      diffRows.push(`- ${origLines[i]}`);
      linesRemoved++;
      i++;
    }
  }

  return {
    success: true,
    originalContent: original,
    modifiedContent: modified,
    diffText: diffRows.join('\n'),
    linesAdded,
    linesRemoved,
  };
}
