import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'aquiretested-static');
const pages = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
const errors = [];
const warnings = [];
const pageResults = [];

const localTarget = (page, reference) => {
  const withoutHash = reference.split('#')[0].split('?')[0];
  if (!withoutHash || /^(?:https?:|mailto:|tel:|javascript:|data:)/i.test(withoutHash)) return null;
  return withoutHash.startsWith('/')
    ? path.join(root, withoutHash.slice(1))
    : path.resolve(root, path.dirname(page), withoutHash);
};

for (const page of pages) {
  const pagePath = path.join(root, page);
  const html = fs.readFileSync(pagePath, 'utf8');
  const pageErrorsBefore = errors.length;
  const checks = {
    navigation: false,
    css: false,
    javascript: false,
    responsiveness: false,
    seo: false,
    links: false,
  };
  const required = [
    ['title', /<title>[^<]+<\/title>/i],
    ['description', /<meta\s+name="description"\s+content="[^"]+"/i],
    ['robots', /<meta\s+name="robots"\s+content="[^"]+"/i],
    ['canonical URL', /<link\s+rel="canonical"\s+href="https?:\/\//i],
    ['Open Graph title', /<meta\s+property="og:title"\s+content="[^"]+"/i],
    ['JSON-LD', /<script\s+type="application\/ld\+json">/i],
    ['main landmark', /<main\b/i],
    ['primary heading', /<h1\b/i],
  ];
  required.forEach(([label, expression]) => {
    if (!expression.test(html)) errors.push(`${page}: missing ${label}`);
  });
  checks.seo = required.every(([, expression]) => expression.test(html));

  const hasEmbeddedNavigation = /<header\b[\s\S]*?aria-label="Primary navigation"/i.test(html);
  const hasHeaderPartial = /data-partial="partials\/header\.html"/i.test(html);
  checks.navigation = hasEmbeddedNavigation || hasHeaderPartial;
  if (!checks.navigation) errors.push(`${page}: missing primary navigation`);

  const stylesheets = [...html.matchAll(/<link\s+rel="stylesheet"\s+href="([^"]+)"/gi)]
    .map((match) => match[1]);
  checks.css = ['css/style.css', 'css/responsive.css'].every((stylesheet) => stylesheets.includes(stylesheet));
  if (!checks.css) errors.push(`${page}: missing required shared stylesheets`);

  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/gi)].map((match) => match[1]);
  checks.javascript = ['js/navigation.js', 'js/main.js'].every((script) => scripts.includes(script));
  if (!checks.javascript) errors.push(`${page}: missing required shared JavaScript`);

  checks.responsiveness = /<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1(?:\.0)?"/i.test(html)
    && stylesheets.includes('css/responsive.css');
  if (!checks.responsiveness) errors.push(`${page}: missing responsive viewport or stylesheet`);

  if (/<style\b/i.test(html) || /\sstyle="/i.test(html)) errors.push(`${page}: contains inline CSS`);
  if (/<script(?![^>]*(?:src=|type="application\/ld\+json"))/i.test(html)) {
    errors.push(`${page}: contains inline JavaScript`);
  }
  if (/\b(?:react(?:-dom)?|vite|typescript|jsx)\b/i.test(html)) {
    errors.push(`${page}: contains a framework/build-tool reference`);
  }

  const brokenReferences = [];
  for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/gi)) {
    const reference = match[1].replaceAll('&amp;', '&');
    const target = localTarget(page, reference);
    if (target && !fs.existsSync(target)) {
      brokenReferences.push(reference);
      errors.push(`${page}: missing local target ${reference}`);
    }
  }
  checks.links = brokenReferences.length === 0;

  for (const match of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${page}: invalid JSON-LD (${error.message})`);
    }
  }

  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  images.forEach((image, index) => {
    if (!/\balt="/i.test(image)) errors.push(`${page}: image ${index + 1} is missing alt text`);
    if (!/\bloading="lazy"/i.test(image) && index > 2) {
      warnings.push(`${page}: image ${index + 1} is not lazy-loaded`);
    }
  });

  pageResults.push({
    page,
    checks,
    passed: errors.length === pageErrorsBefore,
  });
}

for (const script of fs.readdirSync(path.join(root, 'js')).filter((file) => file.endsWith('.js'))) {
  const source = fs.readFileSync(path.join(root, 'js', script), 'utf8');
  if (/\b(?:React|createRoot|useState|useEffect|jsx|typescript)\b/.test(source)) {
    errors.push(`js/${script}: contains a React/TypeScript reference`);
  }
}

for (const result of pageResults.sort((first, second) => first.page.localeCompare(second.page))) {
  const details = Object.entries(result.checks)
    .map(([name, passed]) => `${name}=${passed ? 'PASS' : 'FAIL'}`)
    .join(' ');
  console.log(`${result.page}: ${details}`);
}
console.log(`Validated ${pages.length} HTML pages.`);
console.log(`${warnings.length} non-blocking image-loading observations.`);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('No broken local references, SEO omissions, inline code, or framework references found.');
}
