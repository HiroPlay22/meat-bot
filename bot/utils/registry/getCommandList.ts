// utils/registry/getCommandList.ts
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SlashCommandBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commandsDir = path.resolve(__dirname, '../../commands');
const blacklist = ['poll montag', 'interface'];

type CommandEntry = {
  name: string;
  description: string;
  category: string;
};

function getAllCommandFiles(dir: string): string[] {
  const files = readdirSync(dir, { withFileTypes: true });
  return files.flatMap((file) => {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) return getAllCommandFiles(fullPath);
    if (file.isFile() && file.name.endsWith('.ts')) return [fullPath];
    return [];
  });
}

export async function getCommandList(): Promise<Record<string, CommandEntry[]>> {
  const commandFiles = getAllCommandFiles(commandsDir);

  const commandMap: Record<string, CommandEntry[]> = {};

  for (const file of commandFiles) {
    const relative = path.relative(commandsDir, file);
    const category = relative.includes(path.sep) ? relative.split(path.sep)[0] : 'general';

    const imported = await import(pathToFileUrl(file).href);
    const data: SlashCommandBuilder = imported.data;

    if (!data) continue;
    const name = data.name;
    if (blacklist.includes(name)) continue;

    const entry: CommandEntry = {
      name,
      description: data.description ?? '',
      category,
    };

    if (!commandMap[category]) commandMap[category] = [];
    commandMap[category].push(entry);
  }

  return commandMap;
}

// Hilfsfunktion für dynamisches import() mit ESM
function pathToFileUrl(filePath: string): URL {
  const absolutePath = path.resolve(filePath).replace(/\\/g, '/');
  return new URL(`file://${absolutePath}`);
}
