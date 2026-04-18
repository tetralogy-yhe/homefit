import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TodayList from "@/components/TodayList";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const homes = await prisma.home.findMany({ where: { userId } });
  if (homes.length === 0) redirect("/onboarding");

  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const tasks = await prisma.task.findMany({
    where: { userId, status: "PENDING", dueDate: { lte: endOfDay } },
    include: { item: true },
    orderBy: { dueDate: "asc" },
  });

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const completedTasks = await prisma.task.findMany({
    where: { userId, status: "DONE", completedAt: { gte: startOfDay, lte: endOfDay } },
    include: { item: true },
    orderBy: { completedAt: "desc" },
  });

  const spaces = await prisma.space.findMany({
    where: { home: { userId } },
    include: { home: true },
  });
  const spaceMap = Object.fromEntries(spaces.map((s) => [s.id, s]));

  const todayStr = now.toLocaleDateString("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">오늘의 할 일</h1>
            <p className="text-sm text-gray-400 mt-0.5">{todayStr}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              대시보드
            </Link>
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              캘린더
            </Link>
            <Link href="/homes" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              집 관리
            </Link>
            <LogoutButton />
          </div>
        </div>

        <TodayList tasks={tasks} completedTasks={completedTasks} spaceMap={spaceMap} />
      </div>
    </div>
  );
}
