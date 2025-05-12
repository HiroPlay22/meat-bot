import { riotApi } from "@api/games/league/riotApi.js";
import { getRegionBaseUrl } from "@api/games/league/config.js";
import { getSummonerByName } from "@api/games/league/summoner.js";

// Mapping: Plattform → Routing-Region für Match-API
const regionRouting: Record<string, string> = {
  euw: "europe",
  eune: "europe",
  na: "americas",
  br: "americas",
  kr: "asia",
};

export async function getMatchIdsByPUUID(region: string, puuid: string, count = 5) {
  const routingRegion = regionRouting[region];
  const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
  const { data } = await riotApi.get<string[]>(url);
  return data;
}

export async function getMatchDetails(region: string, matchId: string) {
  const routingRegion = regionRouting[region];
  const url = `https://${routingRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
  const { data } = await riotApi.get(url);
  return data;
}

/**
 * Komplettfunktion: Summoner-Name → letzte 5 Matches → komprimierte Stats
 */
export async function getRecentMatchesForSummoner(region: string, summonerName: string) {
  const summoner = await getSummonerByName(region, summonerName);
  const matchIds = await getMatchIdsByPUUID(region, summoner.puuid);

  const matches = await Promise.all(
    matchIds.map((id) => getMatchDetails(region, id))
  );

  const simplified = matches.map((match: any) => {
    const participant = match.info.participants.find(
      (p: any) => p.puuid === summoner.puuid
    );

    return {
      gameMode: match.info.gameMode,
      champion: participant.championName,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      win: participant.win,
      time: match.info.gameDuration,
    };
  });

  return {
    summoner,
    matches: simplified,
  };
}
