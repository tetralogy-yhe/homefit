import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("homeId");
  const range = searchParams.get("range"); // today | week | month | overdue

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  const endOfWeek = new Date(startOfDay);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfMonth = new Date(startOfDay);
  endOfMonth.setDate(endOfMonth.getDate() + 30);

  const dueDateFilter = (() => {
    if (range === "today") return { gte: startOfDay, lt: endOfDay };
    if (range === "week") return { gte: startOfDay, lt: endOfWeek };
    if (range === "month") return { gte: startOfDay, lt: endOfMonth };
    if (range === "overdue") return { lt: startOfDay };
    return undefined;
  })();

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: "PENDING",
      ...(homeId ? { homeId } : {}),
      ...(dueDateFilter ? { dueDate: dueDateFilter } : {}),
    },
    include: { item: true, template: true },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(tasks);
}
