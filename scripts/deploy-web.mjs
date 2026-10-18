import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

run('npx expo export --platform web');

// gh-pages "node_modules" adlı klasörleri yayınlamaz. Expo, paketlerden gelen
// görselleri ve yazı tiplerini dist/assets/node_modules altına koyar; bunları
// dist/assets/vendor'a taşıyıp derlenmiş dosyalardaki yolları güncelliyoruz.
const from = 'dist/assets/node_modules';
if (existsSync(from)) {
  renameSync(from, 'dist/assets/vendor');
  const walk = (dir) =>
    readdirSync(dir).flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
  for (const file of walk('dist').filter((p) => /\.(js|html|css|json)$/.test(p))) {
    const text = readFileSync(file, 'utf8');
    if (text.includes('assets/node_modules/')) {
      writeFileSync(file, text.split('assets/node_modules/').join('assets/vendor/'));
    }
  }
}

// GitHub Pages: Jekyll kapalı, bilinmeyen yollar (sayfa yenileme) index.html'e düşsün.
writeFileSync('dist/.nojekyll', '');
copyFileSync('dist/index.html', 'dist/404.html');
run('npx gh-pages -d dist --dotfiles');
