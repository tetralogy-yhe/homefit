import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const homes = await prisma.home.findMany({
    where: { userId: session.user.id },
    include: { spaces: { include: { items: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(homes);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, type, address } = await req.json();
  const home = await prisma.home.create({
    data: { name, type, address, userId: session.user.id },
  });

  return NextResponse.json(home, { status: 201 });
}
