const fs = require('fs');
const path = require('path');

const root = __dirname;
const outputDirectory = path.join(root, 'dist');
const pages = ['index.html', 'tentang.html', 'galeri.html'];
const sharedFiles = ['style.css', 'class-ui.js', 'music.js'];
const classAssets = [
  'logokampus.png',
  'fotokamii.jpeg',
  'fotokami2.jpg',
  'fotokami3.jpg',
  'fotokami4.jpg',
  'fotokami5.jpg',
  'fotokami6.jpg',
  'fotokami7.jpg',
  'fotokami8.jpg',
  'fotokami9.jpg',
  'penggantibacksound1.mp3.mp3',
  'penggantibacksound2.mp.mp3',
  'backsound3.mp3',
  '2112.mp3',
  'A Sorrowful Reunion.mp3',
  'anything you want.mp3',
  'magnolia.mp3'
];

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(path.join(outputDirectory, 'assets'), { recursive: true });

[...pages, ...sharedFiles].forEach((file) => {
  fs.copyFileSync(path.join(root, file), path.join(outputDirectory, file));
});

classAssets.forEach((file) => {
  const nestedAsset = path.join(root, 'assets', file);
  const rootAsset = path.join(root, file);
  const sourceAsset = fs.existsSync(nestedAsset) ? nestedAsset : rootAsset;
  if (!fs.existsSync(sourceAsset)) throw new Error(`Missing class asset: ${file}`);
  fs.copyFileSync(sourceAsset, path.join(outputDirectory, 'assets', file));
});

const siteUrl = (process.env.URL || '').replace(/\/$/, '');
const sitemapPages = ['/', '/tentang.html', '/galeri.html'];
const sitemap = siteUrl
  ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPages.map((page) => `  <url><loc>${siteUrl}${page}</loc></url>`).join('\n')}\n</urlset>\n`
  : '';
const robotsLines = ['User-agent: *', 'Allow: /'];
if (siteUrl) robotsLines.push(`Sitemap: ${siteUrl}/sitemap.xml`);
fs.writeFileSync(path.join(outputDirectory, 'robots.txt'), `${robotsLines.join('\n')}\n`);
if (sitemap) fs.writeFileSync(path.join(outputDirectory, 'sitemap.xml'), sitemap);

console.log(`Built class site in ${path.relative(root, outputDirectory)}`);
