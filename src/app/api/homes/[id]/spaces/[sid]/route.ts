import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sid } = await params;
  const { name, type, order } = await req.json();
  const space = await prisma.space.update({
    where: { id: sid },
    data: {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(order !== undefined && { order }),
    },
  });
  return NextResponse.json(space);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; sid: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { sid } = await params;
  await prisma.space.delete({ where: { id: sid } });
  return NextResponse.json({ ok: true });
}
