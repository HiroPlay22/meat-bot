import { Client, ActivityType } from "discord.js";

const normalStatusFrames = [
  "🟧🟥⬛⬛⬛⬛",
  "⬛🟧🟥⬛⬛⬛",
  "⬛⬛🟧🟥⬛⬛",
  "⬛⬛⬛🟧🟥⬛",
  "⬛⬛⬛⬛🟥🟧",
  "🟥⬛⬛⬛⬛🟧"
];

export function startNormalStatusLoop(client: Client) {
  let i = 0;

  setInterval(() => {
    const frame = normalStatusFrames[i++ % normalStatusFrames.length];
    client.user?.setActivity(`${frame}`, {
      type: ActivityType.Playing
    });
  }, 4000); // alle 4 Sekunden neuer Frame
}
