import { Presence, ActivityType, type Activity } from 'discord.js';

export function extractStreamingActivity(presence: Presence): Activity | null {
  return presence.activities.find(
    (a) =>
      a.type === ActivityType.Streaming &&
      typeof a.url === 'string' &&
      (
        a.url.includes('twitch.tv') ||
        a.url.includes('youtube.com') ||
        a.url.includes('youtu.be')
      )
  ) ?? null;
}
