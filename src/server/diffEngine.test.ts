import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSearchReplaceBlocks,
  applySearchReplace,
  generateUnifiedDiff,
} from './diffEngine.ts';

test('parseSearchReplaceBlocks parses blocks properly', () => {
  const patch = `
Some intro text
<<<<<<< SEARCH
const a = 1;
=======
const a = 2;
>>>>>>> REPLACE
`;
  const blocks = parseSearchReplaceBlocks(patch);
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].search.trim(), 'const a = 1;');
  assert.equal(blocks[0].replace.trim(), 'const a = 2;');
});

test('applySearchReplace replaces exact matching content', () => {
  const original = `function add(a, b) {\n  return a + b;\n}`;
  const search = `  return a + b;`;
  const replace = `  // add two values\n  return a + b;`;

  const { success, result } = applySearchReplace(original, search, replace);
  assert.equal(success, true);
  assert.ok(result.includes('// add two values'));
});

test('applySearchReplace handles fuzzy whitespace variations', () => {
  const original = `const port = 3000;\n\nconsole.log(port);`;
  const search = `   const port = 3000;   `;
  const replace = `const port = 8080;`;

  const { success, result } = applySearchReplace(original, search, replace);
  assert.equal(success, true);
  assert.ok(result.includes('const port = 8080;'));
});

test('generateUnifiedDiff tracks added and removed lines', () => {
  const orig = `line 1\nline 2\nline 3`;
  const mod = `line 1\nline 2 modified\nline 3\nline 4`;

  const diff = generateUnifiedDiff(orig, mod, 'sample.ts');
  assert.equal(diff.success, true);
  assert.ok(diff.linesAdded >= 1);
  assert.ok(diff.linesRemoved >= 1);
  assert.ok(diff.diffText.includes('--- a/sample.ts'));
});
