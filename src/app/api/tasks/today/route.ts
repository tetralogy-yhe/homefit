import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: "PENDING",
      dueDate: { lte: endOfDay },
    },
    include: {
      item: true,
      template: true,
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(tasks);
}
