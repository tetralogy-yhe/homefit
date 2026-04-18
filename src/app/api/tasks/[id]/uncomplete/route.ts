import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id, status: "DONE" },
    include: { completionLogs: { orderBy: { completedAt: "desc" }, take: 1 } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const completedAt = task.completedAt;

  // 1. 태스크를 PENDING으로 되돌리기
  await prisma.task.update({
    where: { id },
    data: { status: "PENDING", completedAt: null },
  });

  // 2. 가장 최근 CompletionLog 삭제
  if (task.completionLogs[0]) {
    await prisma.completionLog.delete({ where: { id: task.completionLogs[0].id } });
  }

  // 3. 완료 시 생성된 다음 태스크 삭제 (같은 이름+공간, 완료 이후 생성된 PENDING 태스크)
  if (completedAt) {
    await prisma.task.deleteMany({
      where: {
        userId: session.user.id,
        name: task.name,
        spaceId: task.spaceId,
        status: "PENDING",
        createdAt: { gte: completedAt },
        id: { not: id },
      },
    });
  }

  return NextResponse.json({ ok: true });
}
