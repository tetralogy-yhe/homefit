import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTasksForItem } from "@/lib/task-generator";

export async function GET(_req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sid } = await params;
  const items = await prisma.item.findMany({
    where: { spaceId: sid },
    include: { template: true },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: Promise<{ sid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sid } = await params;
  const { name, category, templateId, lastCleanedAt, purchaseDate } = await req.json();

  const space = await prisma.space.findUnique({ where: { id: sid }, include: { home: true } });
  if (!space) return NextResponse.json({ error: "Space not found" }, { status: 404 });

  const item = await prisma.item.create({
    data: {
      name,
      category: category ?? "APPLIANCE",
      templateId: templateId ?? null,
      spaceId: sid,
      lastCleanedAt: lastCleanedAt ? new Date(lastCleanedAt) : null,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
    },
  });

  await generateTasksForItem(item.id, sid, space.homeId, session.user.id, templateId ?? null);

  return NextResponse.json(item, { status: 201 });
}
