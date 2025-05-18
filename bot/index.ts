import {
  Client,
  GatewayIntentBits,
  Partials
} from "discord.js";
import { registerInteractions } from "./interactions/handler.js";
import { registerPrefixCommands } from "@modules/message/prefixRouter";
import { getDiscordToken } from "@config/secrets";
import { logSystem } from "@services/internal/log";


// 🟢 Initialisierung
logSystem("🟢 M.E.A.T. wird initialisiert...");

// Discord-Client Setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
     GatewayIntentBits.GuildMessagePolls
  ],
  partials: [Partials.Channel]
});

// ✅ Online-Log
client.once("ready", () => {
  logSystem(`✅ M.E.A.T. ist online als ${client.user?.tag}`);
});

// 🔁 Registriere alle Interaktionen & Prefix-Kommandos
registerInteractions(client);
registerPrefixCommands(client);

// 🚀 Bot starten
client.login(getDiscordToken());
