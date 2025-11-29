// FILE: scripts/copy-texts.cjs

const fs = require('node:fs');
const path = require('node:path');

function copyTextJson(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;

  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Rekursiv durch alle Unterordner (z.B. sentinel/datenschutz)
      copyTextJson(srcPath, destPath);
    } else if (
      entry.isFile() &&
      entry.name.startsWith('texte.') &&
      entry.name.endsWith('.json')
    ) {
      // Nur Text-JSON-Dateien kopieren
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const srcRoot = path.join(__dirname, '..', 'src', 'bot', 'functions');
const destRoot = path.join(__dirname, '..', 'dist', 'bot', 'functions');

copyTextJson(srcRoot, destRoot);

console.log('[copy-texts] Texte-JSON-Dateien nach dist kopiert.');
