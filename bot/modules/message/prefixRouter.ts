import { Client, Message } from "discord.js";
import { execute as pingExecute } from "@commands/general/ping";

/**
 * Registriert einfache Textkommandos mit !prefix
 */
const prefix = "!";

export function registerPrefixCommands(client: Client) {
  client.on("messageCreate", async (msg: Message) => {
    if (msg.author.bot || !msg.guild) return;
    if (!msg.content.startsWith(prefix)) return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    switch (commandName) {
      case "ping": {
        // Pseudo-Interaction bauen
        const fakeInteraction: any = {
          user: msg.author,
          member: msg.member,
          reply: (input: any) => msg.reply(input)
        };
        await pingExecute(fakeInteraction);
        break;
      }

      // Weitere prefix-Commands hier ergänzen
    }
  });
}
