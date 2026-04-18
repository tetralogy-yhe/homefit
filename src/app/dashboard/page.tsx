import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TodayTaskList from "./TodayTaskList";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const homes = await prisma.home.findMany({ where: { userId } });

  if (homes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            안녕하세요, {session?.user?.name ?? session?.user?.email} 님!
          </h2>
          <p className="text-gray-500 mb-6">집을 등록하고 가사 관리를 시작해보세요</p>
          <Link href="/onboarding"
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-xl text-sm transition-colors">
            시작하기 →
          </Link>
        </div>
      </div>
    );
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const todayTasks = await prisma.task.findMany({
    where: { userId, status: "PENDING", dueDate: { lte: endOfDay } },
    include: { item: true, template: true },
    orderBy: { dueDate: "asc" },
  });

  const completedTasks = await prisma.task.findMany({
    where: { userId, status: "DONE", completedAt: { gte: startOfDay, lte: endOfDay } },
    include: { item: true },
    orderBy: { completedAt: "desc" },
  });

  const upcomingTasks = await prisma.task.findMany({
    where: {
      userId, status: "PENDING",
      dueDate: { gt: endOfDay, lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8) },
    },
    include: { item: true },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  const spaces = await prisma.space.findMany({
    where: { home: { userId } },
    include: { home: true },
  });

  const spaceMap = Object.fromEntries(spaces.map((s) => [s.id, s]));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {session?.user?.name ?? session?.user?.email?.split("@")[0]} 님의 홈핏
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              캘린더
            </Link>
            <Link href="/homes" className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg">
              집 관리
            </Link>
            <LogoutButton />
          </div>
        </div>

        <TodayTaskList
          tasks={todayTasks}
          completedTasks={completedTasks}
          upcomingTasks={upcomingTasks}
          spaceMap={spaceMap}
          homes={homes}
        />
      </div>
    </div>
  );
}
