import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('aquiretested-static');

for (const file of fs.readdirSync(root).filter((entry) => entry.endsWith('.html'))) {
  const filePath = path.join(root, file);
  const html = fs.readFileSync(filePath, 'utf8');
  if (/<h1\b/i.test(html)) continue;
  const updated = html.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/i, '<h1$1>$2</h1>');
  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`Promoted the primary heading in ${file}`);
}
