export interface GportalServerConfig {
  id: string;
  name: string;
  type: string;
  host: string;
  queryPort: number;
  game?: string;
  query?: boolean;
  display?: boolean;
}

export interface LiveServerData {
  serverName: string;
  map?: string;
  players: number;
  maxPlayers: number;
  version?: string;
  ping: number;
}
