import axios from 'axios';

export async function getYoutubeProfileImage(channelId: string): Promise<string> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/channel/${channelId}&format=json`;

  try {
    const response = await axios.get(url);
    return response.data.thumbnail_url || 'https://www.youtube.com/img/desktop/yt_1200.png';
  } catch (err) {
    console.warn(`[YouTube] ⚠️ Profilbild konnte nicht geladen werden für ${channelId}`);
    return 'https://www.youtube.com/img/desktop/yt_1200.png';
  }
}
