import { prisma } from '@/database/client.js';

async function deleteVotesWithoutPoll() {
  const deleted = await prisma.vote.deleteMany({
    where: {
      pollId: null
    }
  });

  console.log(`🗑️ Gelöscht: ${deleted.count} Votes ohne pollId.`);
}

deleteVotesWithoutPoll()
  .then(() => {
    console.log('✅ Bereinigung abgeschlossen.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fehler bei Bereinigung:', error);
    process.exit(1);
  });
