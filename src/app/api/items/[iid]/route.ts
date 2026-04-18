import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ iid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { iid } = await params;
  const { name, lastCleanedAt, lastMaintainedAt } = await req.json();
  const item = await prisma.item.update({
    where: { id: iid },
    data: {
      name,
      lastCleanedAt: lastCleanedAt ? new Date(lastCleanedAt) : undefined,
      lastMaintainedAt: lastMaintainedAt ? new Date(lastMaintainedAt) : undefined,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ iid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { iid } = await params;
  await prisma.item.delete({ where: { id: iid } });
  return NextResponse.json({ ok: true });
}
