import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

export type YouTubeVideo = {
  videoId: string;
  title: string;
  link: string;
  publishedAt: string;
  thumbnail: string;
  channelTitle: string;
};

export async function fetchLatestFromRSS(channelId: string): Promise<YouTubeVideo[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  try {
    const response = await axios.get(url);
    const parser = new XMLParser({
      ignoreAttributes: false
    });

    const parsed = parser.parse(response.data);

    const entries = parsed.feed?.entry ?? [];
    const channelTitle = parsed.feed?.author?.name ?? 'Unbekannter Kanal';

    return entries.map((entry: any) => ({
      videoId: entry['yt:videoId'],
      title: entry['title'],
      link: entry['link']['@_href'],
      publishedAt: entry['published'],
      thumbnail: entry['media:group']['media:thumbnail']['@_url'],
      channelTitle
    }));
  } catch (error) {
    console.error(`Fehler beim Abrufen von YouTube-RSS für ${channelId}:`, error);
    return [];
  }
}
