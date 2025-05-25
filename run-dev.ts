// run-dev.ts
import "dotenv/config";
import "tsconfig-paths/register";

console.log("🟢 Starte M.E.A.T. (Bot + Webserver)...");

// Helper für file://
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  try {
    // 1. Bot starten
    const botPath = path.resolve(__dirname, "./bot/index.ts");
    await import(`file://${botPath}`);
    console.log("✅ Bot-Modul geladen.");

    // 2. Webserver starten
    const serverPath = path.resolve(__dirname, "./server.ts");
    await import(`file://${serverPath}`);
    console.log("✅ Webserver-Modul geladen.");
  } catch (err) {
    console.error("❌ Fehler beim Start:", err);
    process.exit(1);
  }
}

start();
