import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { readdirSync, statSync } from "fs";
import path from "path";
import { pathToFileURL } from "url"; // ✅ Für Windows-kompatibles import()
import { clientId, guildId } from "@config/secrets";
import { logSystem } from "@services/internal/log";

const commandMap = new Map<string, Function>();
const commandDataArray: any[] = [];

/**
 * Lädt rekursiv alle Slash-Commands aus /bot/commands
 */
export async function loadSlashCommands(dir = "bot/commands") {
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      await loadSlashCommands(fullPath);
    } else if (entry.endsWith(".ts") || entry.endsWith(".js")) {
      const fullUrl = pathToFileURL(path.resolve(fullPath)); // ✅ Windows-safe
      const commandModule = await import(fullUrl.href);
      const command = commandModule.default ?? commandModule;

      if (command?.data instanceof SlashCommandBuilder && typeof command.execute === "function") {
        commandDataArray.push(command.data.toJSON());
        commandMap.set(command.data.name, command.execute);
        logSystem(`✅ Command geladen: ${command.data.name}`);
      }
    }
  }

  return commandMap;
}

/**
 * Gibt nur die JSON-Daten für Deployment
 */
export async function getSlashCommandData() {
  if (commandDataArray.length === 0) {
    await loadSlashCommands();
  }
  return commandDataArray;
}

/**
 * Registriert Commands bei Discord
 */
export async function registerSlashCommands(token: string, isGlobal = false) {
  const rest = new REST({ version: "10" }).setToken(token);
  const route = isGlobal
    ? Routes.applicationCommands(clientId)
    : Routes.applicationGuildCommands(clientId, guildId);

  const commands = await getSlashCommandData();

  try {
    // 🔥 Schritt 1: Alte Commands entfernen
    logSystem(`🧽 Entferne alte ${isGlobal ? "globalen" : "guild"}-Commands...`);
    await rest.put(route, { body: [] });

    // ✅ Schritt 2: Neue Commands registrieren
    logSystem(`🔁 Slash-Commands werden ${isGlobal ? "global" : "guild-basiert"} registriert...`);
    await rest.put(route, { body: commands });

    logSystem(`✅ Slash-Commands erfolgreich registriert (${commands.length})`);
  } catch (error) {
    console.error("❌ Fehler bei Slash-Command-Registrierung:", error);
  }
}
