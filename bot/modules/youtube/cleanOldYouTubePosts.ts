import { prisma } from '@database/client.js';

export async function cleanOldYouTubePosts() {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const deleted = await prisma.youTubePost.deleteMany({
    where: {
      postedAt: { lt: oneWeekAgo }
    }
  });

  console.log(`[M.E.A.T.-CLEANUP] 🧹 Alte YouTubePosts gelöscht: ${deleted.count}`);
}
