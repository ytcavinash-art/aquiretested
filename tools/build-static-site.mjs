import fs from 'node:fs';
import path from 'node:path';

const workspace = 'C:/Users/MY PC/Downloads/Downloads';
const captures = path.join(workspace, 'static-captures');
const reactProject = path.join(workspace, 'aquiretested');
const output = path.join(workspace, 'aquiretested-static');

function ensureDir(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function matchingDivEnd(html, start) {
  const tokens = /<div\b[^>]*>|<\/div>/gi;
  tokens.lastIndex = start;
  let depth = 0;
  let token;
  while ((token = tokens.exec(html))) {
    if (token[0].startsWith('</')) depth -= 1;
    else depth += 1;
    if (depth === 0) return { closeStart: token.index, end: tokens.lastIndex };
  }
  throw new Error(`Unclosed div at ${start}`);
}

function extractElementInner(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) throw new Error(`Missing marker: ${marker}`);
  const openEnd = html.indexOf('>', start) + 1;
  const match = matchingDivEnd(html, start);
  return html.slice(openEnd, match.closeStart);
}

function removeElementByMarker(html, marker) {
  const start = html.indexOf(marker);
  if (start < 0) return html;
  const match = matchingDivEnd(html, start);
  return html.slice(0, start) + html.slice(match.end);
}

function cleanHead(documentHtml) {
  let head = documentHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  head = head
    .replace(/<script(?![^>]*type=["']application\/ld\+json["'])[\s\S]*?<\/script>/gi, '')
    .replace(/<link[^>]+rel=["'](?:modulepreload|stylesheet)["'][^>]*>/gi, '')
    .replace(/<link[^>]+href=["']\/vite\.svg["'][^>]*>/gi, '')
    .replace(/\sdata-rh=["'][^"']*["']/gi, '')
    .replace(/\n{3,}/g, '\n\n');
  return `${head.trim()}
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/responsive.css">`;
}

function normalizeLinks(html) {
  const cleanRoutes = new Set([
    'about', 'services', 'gallery', 'blog', 'contact', 'news', 'careers',
    'leadership', 'vision', 'mission', 'core-values', 'goals',
    'tenant-management', 'liaisoning', 'iec-activities', 'facility-management',
    'blog-sra-redevelopment', 'blog-community-engagement',
    'blog-regulatory-compliance', 'leadership-manoj-harlikar',
    'leadership-srinivasan-mohan', 'leadership-mayilvanan-pandi',
  ]);

  return html.replace(/href="\/([^"]*)"/g, (full, target) => {
    if (target === '' || target.startsWith('#')) return `href="index.html${target}"`;
    const [route, hash = ''] = target.split('#');
    if (route.endsWith('.html')) return `href="${route}${hash ? `#${hash}` : ''}"`;
    if (cleanRoutes.has(route)) return `href="${route}.html${hash ? `#${hash}` : ''}"`;
    return full;
  });
}

function cleanBody(documentHtml) {
  let body = extractElementInner(documentHtml, '<div id="root"');
  body = removeElementByMarker(body, '<div id="google_translate_element"');
  body = body
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sdata-rh="[^"]*"/gi, '')
    .replace(/\sdata-[a-z0-9_-]+="[^"]*"/gi, '')
    .replace(/<span aria-hidden="true" class="pointer-events-none fixed left-0 top-0 z-\[120\][\s\S]*?<\/span>/i, '')
    .replace(/\sfetchpriority=/gi, ' fetchpriority=');
  body = normalizeLinks(body);
  if (!/<h1\b/i.test(body)) {
    body = body.replace(/<h2\b([^>]*)>([\s\S]*?)<\/h2>/i, '<h1$1>$2</h1>');
  }
  return body.trim();
}

function buildPage(fileName) {
  const source = fs.readFileSync(path.join(captures, fileName), 'utf8');
  const head = cleanHead(source);
  const body = cleanBody(source);
  const pageScripts = [
    'js/navigation.js',
    'js/main.js',
    'js/slider.js',
    fileName === 'news.html' ? 'js/news.js' : '',
    fileName === 'contact.html' || fileName === 'index.html' ? 'js/contact.js' : '',
  ].filter(Boolean);
  const scripts = pageScripts.map((src) => `    <script src="${src}" defer></script>`).join('\n');
  const outputHtml = `<!doctype html>
<html lang="en-IN">
  <head>
    ${head}
  </head>
  <body>
    ${body}
${scripts}
  </body>
</html>
`;
  fs.writeFileSync(path.join(output, fileName), outputHtml, 'utf8');
}

fs.rmSync(output, { recursive: true, force: true });
ensureDir(output);
ensureDir(path.join(output, 'css'));
ensureDir(path.join(output, 'js'));
ensureDir(path.join(output, 'images'));
ensureDir(path.join(output, 'assets'));

for (const entry of fs.readdirSync(captures)) {
  if (entry.endsWith('.html')) buildPage(entry);
}

const cssFile = fs.readdirSync(path.join(reactProject, 'dist', 'assets'))
  .find((file) => /^index-.*\.css$/.test(file));
if (!cssFile) throw new Error('Compiled stylesheet not found.');
fs.copyFileSync(
  path.join(reactProject, 'dist', 'assets', cssFile),
  path.join(output, 'css', 'style.css'),
);

fs.cpSync(path.join(reactProject, 'public', 'images'), path.join(output, 'images'), { recursive: true });

for (const file of fs.readdirSync(path.join(reactProject, 'dist', 'assets'))) {
  if (/\.(?:png|jpe?g|webp|svg|gif|ico)$/i.test(file)) {
    fs.copyFileSync(
      path.join(reactProject, 'dist', 'assets', file),
      path.join(output, 'assets', file),
    );
  }
}

for (const file of fs.readdirSync(path.join(reactProject, 'public'))) {
  const source = path.join(reactProject, 'public', file);
  if (fs.statSync(source).isFile() && !file.endsWith('.mp4')) {
    fs.copyFileSync(source, path.join(output, file));
  }
}

console.log(`Generated ${fs.readdirSync(captures).filter((file) => file.endsWith('.html')).length} static pages in ${output}`);
