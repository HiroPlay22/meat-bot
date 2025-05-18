import {
  APIEmbedField,
  EmbedBuilder,
  User,
  GuildMember
} from "discord.js";
import { getModuleColor } from "./colors.js";
import { getModuleIconURL } from "./icons.js";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function formatPrettyDateTime(date: Date): string {
  const tag = isToday(date)
    ? "heute"
    : date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit"
      });
  const uhr = formatTime(date);
  return `${tag}, ${uhr} Uhr`;
}

function getLatencySymbol(latency: number): string {
  if (latency <= 200) return "🟢";
  if (latency <= 500) return "🟡";
  return "🔴";
}

function buildHeaderLine(module: string): string {
  return `/${module}`;
}

function buildFooterLine(
  botName: string,
  latency: number,
  count: number,
  user: User | GuildMember,
  time: Date
): string {
  const displayName =
    (user as GuildMember)?.displayName || (user as User)?.username;
  const timestamp = formatPrettyDateTime(time);
  const latencySymbol = getLatencySymbol(latency);

  return [
    `${botName}`,
    "    ",
    `${latencySymbol} ${latency}ms`,
    "    ",
    `📶 ${count}x`,
    "    ",
    `📢 Signal by ${displayName}`,
    "    ",
    `⌚ ${timestamp}`
  ].join(" ");
}

export function createStandardEmbed(options: {
  module: string;
  moduleName: string;
  user: User | GuildMember;
  title: string;
  bodyText: string;
  fields?: APIEmbedField[];
  latency?: number;
  usageCount?: number;
  botPersona?: "M.E.A.T." | "Prof. M.E.A.T." | "Sentinel-M.E.A.T.";
}) {
  const now = new Date();
  const color = getModuleColor(options.module);
  const iconURL = getModuleIconURL(options.module);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setAuthor({
      name: buildHeaderLine(options.module),
      iconURL: iconURL
    })
    .setTitle(options.title)
    .setDescription(options.bodyText)
    .setFooter({
      text: buildFooterLine(
        options.botPersona ?? "M.E.A.T.",
        options.latency ?? 0,
        options.usageCount ?? 1,
        options.user,
        now
      ),
      iconURL: "https://i.imgur.com/ay0fkPx.png"
    });

  if (options.fields?.length) {
    embed.addFields(options.fields);
  }

  return embed;
}
