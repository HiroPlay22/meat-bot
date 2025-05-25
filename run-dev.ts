// run-dev.ts
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  try {
    // 1. BOT laden (setzt globalThis.discordClient)
    const botPath = path.resolve(__dirname, 'bot/index.ts');
    await import(`file://${botPath}`);

    // 2. Webserver starten (der braucht den Client)
    const serverPath = path.resolve(__dirname, 'server.ts');
    await import(`file://${serverPath}`);
  } catch (err) {
    console.error("❌ Fehler beim Start:", err);
  }
}

start();
