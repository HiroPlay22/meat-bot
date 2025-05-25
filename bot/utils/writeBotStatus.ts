import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const statusPath = path.resolve(__dirname, "../../web/pages/bot-status.json");

export function writeBotStatus(status: "online" | "offline") {
  const json = JSON.stringify({ status });
  try {
    fs.writeFileSync(statusPath, json);
    console.log(`[BOT-STATUS] Gesetzt: ${status}`);
  } catch (err) {
    console.error("[BOT-STATUS] Fehler beim Schreiben:", err);
  }
}
