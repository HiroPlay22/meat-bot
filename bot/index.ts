import * as Discord from 'discord.js';
import { registerInteractions } from './interactions/handler.js';
import { registerPrefixCommands } from '@modules/message/prefixRouter';
import { getDiscordToken } from '@config/secrets';
import { logSystem } from '@services/internal/log';
import { handleMemberJoin } from '@modules/join/index.js';
import { loadSlashCommands } from './loader/commandLoader.js';
import presenceUpdate from './listeners/presenceUpdate.js';
import { writeBotStatus } from "./utils/writeBotStatus.js";
import { startTwitchLivePoll } from '@/modules/live/twitchLivePoll.js';

// 🟢 Initialisierung (nur Konsole)
logSystem('🟢 M.E.A.T. wird initialisiert...');

// ✅ Botstatus: online
writeBotStatus("online");

// Graceful Shutdown
process.on("exit", () => writeBotStatus("offline"));
process.on("SIGINT", () => {
  writeBotStatus("offline");
  process.exit();
});
process.on("SIGTERM", () => {
  writeBotStatus("offline");
  process.exit();
});

// Discord-Client Setup
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.GuildPresences,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.GuildEmojisAndStickers,
    Discord.GatewayIntentBits.GuildIntegrations,
    Discord.GatewayIntentBits.GuildWebhooks,
    Discord.GatewayIntentBits.GuildInvites,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.GuildMessagePolls
  ],
  partials: [Discord.Partials.Channel]
});

// ✅ Online-Log
client.once('ready', async () => {
  const tag = client.user?.tag ?? 'unbekannt';
  await logSystem(`✅ ${tag} ist online`, client);

  // 🔁 Slash-Commands laden & registrieren
  const commandMap = await loadSlashCommands();
  await registerInteractions(client);
  await logSystem(`✅ Interaktionen registriert (${commandMap.size} Slash-Commands geladen)`, client);

  // 🔁 Prefix-Kommandos registrieren
  registerPrefixCommands(client);
  await logSystem(`✅ Prefix-Commands registriert`, client);
  startTwitchLivePoll();
});

// 🟢 Registriere Join-Handler
client.on('guildMemberAdd', async (member) => {
  const user = `<@${member.id}>`;
  await logSystem(`➕ ${user} ist dem Server beigetreten`, client);
  handleMemberJoin(member);
});

client.on('guildMemberRemove', async (member) => {
  const user = `<@${member.id}>`;
  await logSystem(`➖ ${user} hat den Server verlassen`, client);
});

// 🗑️ Nachricht gelöscht → loggen
client.on('messageDelete', async (message) => {
  if (!message.guild || !message.channel) return;

  const author = `<@${message.author?.id ?? "?"}>`;
  const channel = `<#${message.channel?.id ?? "?"}>`;
  const content = message.content?.trim().replace(/\n/g, ' ') || "*[Inhalt nicht verfügbar]*";

  await logSystem(
    `🗑️ Nachricht gelöscht von ${author} in ${channel}:\n> ${content}`,
    client
  );
});

// 🟢 Präsenz-Update-Listener
client.on('presenceUpdate', presenceUpdate.execute);

// 🚀 Bot starten
client.login(getDiscordToken());

// 🌐 Global verfügbar für API-Routen wie /api/stats
globalThis.discordClient = client;
