// scripts/testQuery.ts
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Gamedig ist ein CJS-Modul, also klassisch per require()
const Gamedig = require('gamedig');

const config = {
  type: 'source',
  host: '161.97.142.242',
  port: 29001,
};

console.log('🛰️ Starte Query für:', config);

Gamedig.query(config)
  .then((result: any) => {
    console.log('✅ Ergebnis:', result);
    process.exit(0);
  })
  .catch((err: any) => {
    console.error('❌ Fehler:', err);
    process.exit(1);
  });
