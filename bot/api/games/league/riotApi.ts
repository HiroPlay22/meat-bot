import axios from "axios";
import { RIOT_API_KEY } from "@/config/env.js";

export const riotApi = axios.create({
  headers: {
    "X-Riot-Token": RIOT_API_KEY,
  },
});
