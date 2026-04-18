import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const templates = await prisma.itemTemplate.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(templates);
}
