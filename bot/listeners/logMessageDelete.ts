import { Events, Message, PartialMessage } from 'discord.js';
import { logSystem } from '@services/internal/log';

export const name = Events.MessageDelete;
export const once = false;

export async function execute(message: Message | PartialMessage) {
  // Nur Guild-Messages (kein DM-Log)
  if (!message.guild || !message.channel) return;

  const author = message.member?.displayName || message.author?.tag || "Unbekannt";
  const channelName = (message.channel as any).name || "Unbekannt";
  const content = message.content?.trim() || "*[Inhalt nicht verfügbar]*";

  await logSystem(
    `🗑️ Nachricht gelöscht von ${author} im #${channelName}:\n„${content}”`,
    message.client
  );
}
