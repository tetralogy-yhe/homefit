import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { dueDate, cycleUnit, cycleEvery } = body;

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(dueDate !== undefined && { dueDate: new Date(dueDate) }),
      ...(cycleUnit !== undefined && { cycleUnit }),
      ...(cycleEvery !== undefined && { cycleEvery: Number(cycleEvery), cycleOverridden: true }),
    },
  });

  return NextResponse.json(updated);
}
