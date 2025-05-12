export const platformRouting: Record<string, string> = {
    euw: "euw1",
    na: "na1",
    eune: "eun1",
    kr: "kr",
  };
  
  export const getRegionBaseUrl = (regionCode: string) => {
    return `https://${platformRouting[regionCode]}.api.riotgames.com`;
  };
  