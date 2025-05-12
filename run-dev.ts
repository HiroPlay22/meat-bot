import "dotenv/config";                 // Lädt .env-Variablen
import "tsconfig-paths/register";       // Aktiviert Pfad-Aliase wie @config/*

console.log("🟢 Starte M.E.A.T. über run-dev.ts ...");

// ✅ "file://" URL erzeugen – damit Windows & Node den Pfad verstehen
const entryUrl = new URL("./bot/index.ts", import.meta.url);

import(entryUrl.href)
  .then(() => console.log("✅ Bot gestartet."))
  .catch((err) => {
    console.error("❌ Fehler beim Start:", err);
    process.exit(1);
  });
