if (!process.env.RIOT_API_KEY) {
    throw new Error("RIOT_API_KEY fehlt in der .env-Datei");
  }
  
  export const RIOT_API_KEY = process.env.RIOT_API_KEY;
  