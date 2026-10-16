import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
const files = [
  'README.md',
  'CHANGELOG.md',
  'ROADMAP.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'PRIVACY.md',
  'THIRD_PARTY_NOTICES.md',
  ...(await readdir('docs'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `docs/${f}`),
];
let count = 0;
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const [, link] of content.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|#|mailto:)/.test(link)) continue;
    await access(path.resolve(path.dirname(file), link.split('#')[0]));
    count++;
  }
}
console.log(
  `${files.length} documentation files and ${count} local links checked.`,
);
