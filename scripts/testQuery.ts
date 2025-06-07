export {}; // 👈 macht die Datei zum ES-Modul

const Gamedig = await import('gamedig'); // ESM-kompatibel

const config = {
  type: 'source',
  host: '161.97.142.242',
  port: 29001
};

console.log('🛰️ Starte Query für:', config);

Gamedig.default.query(config)
  .then((result) => {
    console.log('✅ Ergebnis:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fehler:', err);
    process.exit(1);
  });
