// bot/services/feedback/createFeedback.ts
import { prisma } from "@database/client.js";

interface CreateFeedbackInput {
  userId: string;
  username: string;
  serverId: string;
  title: string;
  description: string;
  category: string;
  importance: string;
  module?: string;
  fileUrl?: string;
}

export async function createFeedback(data: CreateFeedbackInput) {
  const last = await prisma.feedback.findFirst({
    orderBy: { protocolNo: "desc" },
    select: { protocolNo: true },
  });

  const newProtocolNo = (last?.protocolNo ?? 0) + 1;

  const feedback = await prisma.feedback.create({
    data: {
      protocolNo: newProtocolNo,
      userId: data.userId,
      username: data.username,
      serverId: data.serverId,
      title: data.title,
      description: data.description,
      category: data.category,
      importance: data.importance,
      module: data.module,
      fileUrl: data.fileUrl,
    },
  });

  return feedback;
}
