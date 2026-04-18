import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTasksForSpace } from "@/lib/task-generator";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const spaces = await prisma.space.findMany({
    where: { homeId: id },
    include: { items: { include: { template: true } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(spaces);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { name, type, order } = await req.json();

  const space = await prisma.space.create({
    data: { name, type, order: order ?? 0, homeId: id },
  });

  await generateTasksForSpace(space.id, id, session.user.id, type);

  return NextResponse.json(space, { status: 201 });
}
