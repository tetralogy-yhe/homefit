import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkCycleSuggestion, calcNextDueDate } from "@/lib/cycle-engine";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { completedAt: completedAtStr, notes } = await req.json().catch(() => ({}));
  const completedAt = completedAtStr ? new Date(completedAtStr) : new Date();

  const task = await prisma.task.findUnique({ where: { id, userId: session.user.id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const daysEarlyOrLate = Math.round(
    (completedAt.getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  await prisma.task.update({
    where: { id },
    data: { status: "DONE", completedAt },
  });

  await prisma.completionLog.create({
    data: {
      taskId: id,
      userId: session.user.id,
      completedAt,
      scheduledDueDate: task.dueDate,
      daysEarlyOrLate,
      cycleUnitAtTime: task.cycleUnit,
      cycleEveryAtTime: task.cycleEvery,
    },
  });

  const nextDueDate = calcNextDueDate(completedAt, task.cycleUnit, task.cycleEvery);

  const nextTask = await prisma.task.create({
    data: {
      itemId: task.itemId,
      spaceId: task.spaceId,
      homeId: task.homeId,
      userId: task.userId,
      templateId: task.templateId,
      name: task.name,
      category: task.category,
      cycleUnit: task.cycleUnit,
      cycleEvery: task.cycleEvery,
      cycleOverridden: task.cycleOverridden,
      dueDate: nextDueDate,
    },
  });

  const suggestion = await checkCycleSuggestion(id);

  return NextResponse.json({ nextTask, nextDueDate, suggestion, notes });
}
