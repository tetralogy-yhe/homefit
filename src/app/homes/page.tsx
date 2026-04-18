import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { HOME_TYPE_LABELS } from "@/lib/constants";

export default async function HomesPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const homes = await prisma.home.findMany({
    where: { userId },
    include: {
      _count: { select: { spaces: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const taskCounts = await prisma.task.groupBy({
    by: ["homeId"],
    where: { userId, status: "PENDING" },
    _count: true,
  });
  const taskCountMap = Object.fromEntries(taskCounts.map((t) => [t.homeId, t._count]));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← 대시보드</Link>
            <h1 className="text-xl font-bold text-gray-900 mt-1">내 집 목록</h1>
          </div>
          <Link href="/onboarding"
            className="text-sm bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-medium transition-colors">
            + 집 추가
          </Link>
        </div>

        {homes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🏠</div>
            <p>등록된 집이 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {homes.map((home) => (
              <Link key={home.id} href={`/homes/${home.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-green-200 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold text-gray-900">{home.name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {HOME_TYPE_LABELS[home.type] ?? home.type}
                      {home.address && ` · ${home.address}`}
                    </p>
                  </div>
                  <span className="text-gray-300 text-lg">›</span>
                </div>
                <div className="flex gap-4 mt-3">
                  <span className="text-xs text-gray-500">공간 {home._count.spaces}개</span>
                  <span className="text-xs text-gray-500">
                    할 일 {taskCountMap[home.id] ?? 0}개
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
