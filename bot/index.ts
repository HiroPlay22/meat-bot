import * as Discord from 'discord.js';

import { registerInteractions } from './interactions/handler.js';
import { registerPrefixCommands } from '@modules/message/prefixRouter';
import { getDiscordToken } from '@config/secrets';
import { logSystem } from '@services/internal/log';
import { handleMemberJoin } from '@/modules/join/index.js';

// 🟢 Initialisierung
logSystem('🟢 M.E.A.T. wird initialisiert...');

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
client.once('ready', () => {
  logSystem(`✅ M.E.A.T. ist online als ${client.user?.tag}`);
});

// 🟢 Registriere Join-Handler
client.on('guildMemberAdd', handleMemberJoin);

// 🔁 Registriere alle Interaktionen & Prefix-Kommandos
registerInteractions(client);
registerPrefixCommands(client);

// 🚀 Bot starten
client.login(getDiscordToken());
