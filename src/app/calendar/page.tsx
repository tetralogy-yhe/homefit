import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import CalendarView from "./CalendarView";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  // 앞뒤 2달치 태스크를 한 번에 가져옴
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: { in: ["PENDING", "DONE"] },
      dueDate: { gte: from, lte: to },
    },
    include: { item: true },
    orderBy: { dueDate: "asc" },
  });

  const spaces = await prisma.space.findMany({
    where: { home: { userId } },
    include: { home: true },
  });
  const spaceMap = Object.fromEntries(spaces.map((s) => [s.id, s]));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← 오늘의 할 일</Link>
            <h1 className="text-xl font-bold text-gray-900 mt-1">캘린더</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/homes" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              집 관리
            </Link>
            <LogoutButton />
          </div>
        </div>

        <CalendarView tasks={tasks} spaceMap={spaceMap} />
      </div>
    </div>
  );
}
