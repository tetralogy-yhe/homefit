import { prisma } from "@/lib/prisma";
import { CYCLE_UNIT_DAYS } from "@/lib/constants";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function generateTasksForItem(
  itemId: string,
  spaceId: string,
  homeId: string,
  userId: string,
  templateId: string | null
) {
  if (!templateId) return;

  const taskTemplates = await prisma.taskTemplate.findMany({
    where: { itemTemplateId: templateId },
  });

  const now = new Date();

  await prisma.task.createMany({
    data: taskTemplates.map((tt) => ({
      itemId,
      spaceId,
      homeId,
      userId,
      templateId: tt.id,
      name: tt.name,
      category: tt.category,
      cycleUnit: tt.defaultCycleUnit,
      cycleEvery: tt.defaultCycleEvery,
      dueDate: addDays(now, (CYCLE_UNIT_DAYS[tt.defaultCycleUnit] ?? 7) * tt.defaultCycleEvery),
    })),
  });
}

export async function generateTasksForSpace(
  spaceId: string,
  homeId: string,
  userId: string,
  spaceType: string
) {
  const taskTemplates = await prisma.taskTemplate.findMany({
    where: { spaceType, itemTemplateId: null },
  });

  const now = new Date();

  await prisma.task.createMany({
    data: taskTemplates.map((tt) => ({
      spaceId,
      homeId,
      userId,
      templateId: tt.id,
      name: tt.name,
      category: tt.category,
      cycleUnit: tt.defaultCycleUnit,
      cycleEvery: tt.defaultCycleEvery,
      dueDate: addDays(now, (CYCLE_UNIT_DAYS[tt.defaultCycleUnit] ?? 7) * tt.defaultCycleEvery),
    })),
  });
}
