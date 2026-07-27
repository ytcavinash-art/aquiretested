import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('aquiretested');
const address = '206 Hallmark Business Plaza, Opp. Guru Nanak Hospital, Jagat Vidya Marg, Bandra East, Mumbai 400051';
const encodedAddress = encodeURIComponent(address);
const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
const embedLink = `https://www.google.com/maps?q=${encodedAddress}&output=embed`;

const oldSchemaAddress = '"address":{"@type":"PostalAddress","addressLocality":"Mumbai","addressRegion":"Maharashtra","addressCountry":"IN"}';
const newSchemaAddress = '"address":{"@type":"PostalAddress","streetAddress":"206 Hallmark Business Plaza, Opp. Guru Nanak Hospital, Jagat Vidya Marg, Bandra East","addressLocality":"Mumbai","addressRegion":"Maharashtra","postalCode":"400051","addressCountry":"IN"}';

const mapPin = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin mt-0.5 shrink-0 text-[#eb1f54]" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>';
const footerAddress = `<a data-company-address href="${mapsLink}" target="_blank" rel="noopener noreferrer" class="flex items-start gap-2.5 hover:text-[#eb1f54] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white focus-visible:rounded-sm">${mapPin}<span>${address}</span></a>`;

const htmlFiles = fs.readdirSync(root)
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.join(root, file));
const partialFile = path.join(root, 'partials', 'footer.html');

for (const file of [...htmlFiles, partialFile]) {
  let html = fs.readFileSync(file, 'utf8');

  html = html.replaceAll(oldSchemaAddress, newSchemaAddress);
  html = html.replaceAll(
    'https://www.google.com/maps?q=A%26M%20Advisory%20Mumbai&amp;output=embed',
    embedLink.replace('&', '&amp;'),
  );
  html = html.replaceAll(
    'title="A&amp;M Advisory service area on Google Maps"',
    'title="A&amp;M Advisory office at Hallmark Business Plaza on Google Maps"',
  );

  html = html.replace(
    /<span class="inline-flex items-center gap-2">(<svg[^>]*class="lucide lucide-map-pin[^"]*"[^>]*>[\s\S]*?<\/svg>)Mumbai, Maharashtra<\/span>/g,
    `<a data-office-map-link href="${mapsLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-start gap-2 text-left transition hover:text-white">$1<span>${address}</span></a>`,
  );

  if (!html.includes('data-company-address')) {
    html = html.replace(
      /(<address class="mt-4 space-y-3\.5 not-italic text-\[11px\] text-slate-200">)/,
      `$1${footerAddress}`,
    );
  }

  fs.writeFileSync(file, html, 'utf8');
}

console.log(`Added the office address to ${htmlFiles.length} pages and the shared footer partial.`);
