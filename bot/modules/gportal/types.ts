// bot/modules/gportal/types.ts

export interface GportalServerConfig {
  id: string;
  name: string;
  type: string;
  host: string;
  queryPort: number;
  game?: string;
  query?: boolean;
  display?: boolean;
  link?: string;            // optionaler Link zu Mods
  maxPlayers?: number;      // fallback für maxPlayers, wenn Query nichts liefert
  roleId?: string;          // Discord-Rolle (wird nicht gepingt)
  modIds?: number[];        // Liste der Mod-IDs
  buttonLabel?: string;     // Optional: Label für Button in der Übersicht
}

export interface LiveServerData {
  serverName: string;
  map?: string;
  players: number;
  maxPlayers: number;
  version?: string;
  ping: number;
}
