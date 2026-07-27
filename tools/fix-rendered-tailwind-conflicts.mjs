import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(process.argv[2] || 'homepage-rendered.html');
const source = fs.readFileSync(file, 'utf8');

const replacements = [
  [
    'border-l border-white/15 border-t border-white/15 lg:border-t-0',
    'border-l border-white/15 border-t lg:border-t-0',
  ],
  [
    'class="flex min-h-72 flex-col border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hidden md:flex"',
    'class="min-h-72 flex-col border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hidden md:flex"',
  ],
  [
    'class="flex min-h-72 flex-col border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hidden lg:flex"',
    'class="min-h-72 flex-col border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hidden lg:flex"',
  ],
];

let output = source;
let replacementCount = 0;
for (const [before, after] of replacements) {
  const occurrences = output.split(before).length - 1;
  if (occurrences > 1) {
    throw new Error(`Expected at most one occurrence, found ${occurrences}: ${before}`);
  }
  if (occurrences === 1) {
    output = output.replace(before, after);
    replacementCount += 1;
  }
}

fs.writeFileSync(file, output, 'utf8');
console.log(`Removed ${replacementCount} Tailwind class conflicts from ${file}.`);
