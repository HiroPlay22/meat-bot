export {}; // ← notwendig, damit die Datei ein Modul ist

const { query } = await import('gamedig');

const config = {
  type: 'source',
  host: '161.97.142.242',
  port: 29001,
};

console.log('🛰️ Starte Query für:', config);

query(config)
  .then((result) => {
    console.log('✅ Ergebnis:', result);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fehler:', err);
    process.exit(1);
  });
