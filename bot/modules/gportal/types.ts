// bot/modules/gportal/types.ts

export interface GportalServerConfig {
  id: string;               // interne ID
  name: string;             // Anzeigename im Bot
  type: string;             // z. B. 'valheim', 'source', etc.
  host: string;             // IP-Adresse oder Domain
  queryPort: number;        // UDP-Port für GameDig
  game?: string;            // z. B. 'Valheim', 'Palworld' etc.
  query?: boolean;          // ob der Server live abgefragt werden soll
  display?: boolean;        // ob dieser Server angezeigt werden soll
}

export interface LiveServerData {
  serverName: string;       // Name des Servers laut Query
  map?: string;             // Name der aktuellen Map
  players: number;          // Aktuelle Spielerzahl
  maxPlayers: number;       // Maximale Slots
  version?: string;         // Spielversion (falls verfügbar)
  ping: number;             // Antwortzeit in ms
}
