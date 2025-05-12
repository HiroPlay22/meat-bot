import { riotApi } from "@api/games/league/riotApi.js";
import { getRegionBaseUrl } from "@api/games/league/config.js";

export async function getSummonerByName(region: string, summonerName: string) {
  const baseURL = getRegionBaseUrl(region);
  try {
    const { data } = await riotApi.get(`/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`, {
      baseURL,
    });
    return data;
  } catch (error) {
    console.error("Error fetching summoner:", error);
    throw error;
  }
}
