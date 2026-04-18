import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import SpaceList from "./SpaceList";

export default async function HomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session!.user!.id!;
  const { id } = await params;

  const home = await prisma.home.findFirst({
    where: { id, userId },
    include: {
      spaces: {
        orderBy: { order: "asc" },
        include: {
          items: true,
        },
      },
    },
  });

  if (!home) notFound();

  // tasks를 별도로 가져와서 JS에서 분류
  const tasks = await prisma.task.findMany({
    where: { homeId: id, userId, status: "PENDING" },
    include: { template: true },
    orderBy: { dueDate: "asc" },
  });

  // spaceId + itemId 기준으로 그룹핑
  const tasksBySpaceOnly = tasks.filter((t) => !t.itemId);
  const tasksByItem = tasks.filter((t) => !!t.itemId);

  const spaceTaskMap: Record<string, typeof tasks> = {};
  const itemTaskMap: Record<string, typeof tasks> = {};

  tasksBySpaceOnly.forEach((t) => {
    spaceTaskMap[t.spaceId] = [...(spaceTaskMap[t.spaceId] ?? []), t];
  });
  tasksByItem.forEach((t) => {
    itemTaskMap[t.itemId!] = [...(itemTaskMap[t.itemId!] ?? []), t];
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/homes" className="text-sm text-gray-400 hover:text-gray-600">← 집 목록</Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{home.name}</h1>
          <p className="text-sm text-gray-400">{home.spaces.length}개 공간</p>
        </div>

        {home.spaces.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">🚪</div>
            <p>등록된 공간이 없어요</p>
          </div>
        ) : (
          <div className="pl-8">
            <SpaceList
              homeId={home.id}
              initialSpaces={home.spaces}
              spaceTaskMap={spaceTaskMap}
              itemTaskMap={itemTaskMap}
            />
          </div>
        )}
      </div>
    </div>
  );
}
