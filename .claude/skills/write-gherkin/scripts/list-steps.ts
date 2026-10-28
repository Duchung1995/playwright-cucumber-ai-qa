/**
 * Lists every step definition expression with its file:line so new scenarios reuse existing steps.
 *
 * Usage: npx tsx .claude/skills/write-gherkin/scripts/list-steps.ts [filter]
 */
import fs from 'node:fs';
import path from 'node:path';

const root = 'src/steps';
const filter = process.argv[2]?.toLowerCase();
const pattern = /\b(Given|When|Then)\(\s*(['"`])((?:\\.|(?!\2).)*)\2/g;

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const rows: string[] = [];
for (const file of walk(root)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const m of source.matchAll(pattern)) {
    const line = source.slice(0, m.index).split('\n').length;
    const entry = `${m[1].padEnd(5)} ${m[3]}  (${file}:${line})`;
    if (!filter || entry.toLowerCase().includes(filter)) rows.push(entry);
  }
}
console.log(rows.join('\n') || 'No matching step definitions.');
