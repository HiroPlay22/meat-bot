// FILE: src/bot/general/style/emoji.ts

export const emoji = {
  // 🧠 M.E.A.T. Core & System
  meat_dev: '<:meat_dev:1373670733607338015>',
  meat_website: '<:meat_link:1373694062586236948>',
  meat_discord: '<:meat_discord:1373694059352166522>',
  meat_github: '<:meat_hub:1373697340556447865>',
  meat_avatar: '<:meat_core:1373697438073884692>',
  meat_version: '<:meat_version:1373694029539184870>',
  meat_boss: '<:meat_boss:1374064288997576805>',
  meat_boost: '<:meat_boost:1374064286208495757>',
  meat_calendar: '<:meat_calendar:1374064287751864481>',

  // 📊 Globale Bot-Stats
  meat_servers: '<:meat_servers:1373694046194761779>',
  meat_users: '<:meat_users:1373694044449804359>',
  meat_channels: '<:meat_channels:1373694042985992272>',
  meat_commands: '<:meat_commands:1373694040176070779>',

  // 🏠 Server Stats
  meat_members: '<:meat_user:1373694031124627478>',
  meat_online: '<:meat_online:1373697659478478888>',
  meat_offline: '<:meat_offline:1373694051840299048>',
  meat_text: '<:meat_text:1373694036614971484>',
  meat_voice: '<:meat_voice:1373694035151028417>',
  meat_roles: '<:meat_roles:1373694032462614528>',
  meat_threads: '<:meat_threads:ID>',
  meat_afk: '<:meat_afk:ID>',
  meat_lock: '<:meat_lock:ID>',
  meat_nsfw: '<:meat_roles:1373694032462614528>',
  meat_feature: '<:meat_feature:ID>',

  // 🦖 Aktivität & Features
  meat_dinos: '<:meat_dinos:ID>',
  meat_approved: '<:meat_approved:ID>',
  meat_feedback: '<:meat_feedback:ID>',
  meat_votings: '<:meat_votings:ID>',
  meat_votes: '<:meat_votes:ID>',
  meat_fungames: '<:meat_fungames:ID>',

  // 📺 Plattformen
  meat_twitch: '<:meat_twitch:1377296796937748601>',
  meat_youtube: '<:meat_youtube:1379379864741613648>',

  // 🎥 Stream-Embed-Icons
  meat_stream: '<:meat_game:1380239036987215962>',
  meat_game: '<:meat_game:1380239036987215962>',

  // 🎲 Roll-System
  meat_dice: '<:meat_dice:1376947755376705568>',    // Klassischer Würfel
  meat_dnd: '<:meat_dnd:1376947757285380197>',      // DnD-Würfel
  meat_gm: '<:meat_boss:ID>',                       // 🧙 GM-Channel-Modus (Platzhalter)

  // 🔙 Fallback
  meat_leer: '<:meat_leer:1373700191294722058>',
};

// 🔒 Sicheres Einfügen von Emojis
export function safe(
  icon: string | undefined,
  fallback = emoji.meat_leer,
): string {
  return icon && !icon.includes(':ID') ? icon : fallback;
}
