import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, category, cycleUnit, cycleEvery, itemId, spaceId, homeId, dueDate } = await req.json();

  const task = await prisma.task.create({
    data: {
      name,
      category: category ?? "CLEANING",
      cycleUnit,
      cycleEvery: cycleEvery ?? 1,
      cycleOverridden: true,
      itemId: itemId ?? null,
      spaceId,
      homeId,
      userId: session.user.id,
      dueDate: new Date(dueDate),
    },
  });

  return NextResponse.json(task, { status: 201 });
}
