import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { days } = await req.json();
  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + (days ?? 1));

  const task = await prisma.task.update({
    where: { id, userId: session.user.id },
    data: { status: "SNOOZED", snoozedUntil, dueDate: snoozedUntil },
  });

  return NextResponse.json(task);
}
