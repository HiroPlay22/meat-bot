import dotenv from "dotenv";
dotenv.config();

export function getDiscordToken(): string {
  if (!process.env.DISCORD_TOKEN) {
    throw new Error("❌ DISCORD_TOKEN fehlt in .env");
  }
  return process.env.DISCORD_TOKEN;
}

export function getClientId(): string {
  if (!process.env.CLIENT_ID) {
    throw new Error("❌ CLIENT_ID fehlt in .env");
  }
  return process.env.CLIENT_ID;
}

export function getGuildId(): string {
  if (!process.env.GUILD_ID) {
    throw new Error("❌ GUILD_ID fehlt in .env");
  }
  return process.env.GUILD_ID;
}

export const discordToken = process.env.DISCORD_TOKEN!;
export const clientId = process.env.CLIENT_ID!;
export const guildId = process.env.GUILD_ID!;
