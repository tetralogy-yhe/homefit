"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  name: string;
  dueDate: Date | string;
  spaceId: string;
  cycleUnit: string;
  category: string;
  item: { name: string } | null;
}

interface Space {
  id: string;
  name: string;
  type: string;
  home: { name: string };
}

const CYCLE_LABEL: Record<string, string> = {
  DAILY: "매일", WEEKLY: "매주", MONTHLY: "매월",
  QUARTERLY: "분기별", BIANNUALLY: "6개월", YEARLY: "매년",
};

const TASK_CATEGORY_ICONS: Record<string, string> = {
  CLEANING: "🧹", MAINTENANCE: "🔧", REPLACEMENT: "🔄",
  DAILY_CHORE: "🏠", LAUNDRY: "👕", PET_CARE: "🐾", PLANT_CARE: "🪴",
};

function isOverdue(dueDate: Date | string) {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function TodayList({
  tasks,
  completedTasks = [],
  spaceMap,
}: {
  tasks: Task[];
  completedTasks?: Task[];
  spaceMap: Record<string, Space>;
}) {
  const router = useRouter();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [undonIds, setUndonIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const total = tasks.length + completedTasks.filter((t) => !undonIds.has(t.id)).length;
  const doneCount = doneIds.size + completedTasks.filter((t) => !undonIds.has(t.id)).length;

  const pending = tasks.filter((t) => !doneIds.has(t.id));
  const done = [
    ...tasks.filter((t) => doneIds.has(t.id)),
    ...completedTasks.filter((t) => !undonIds.has(t.id)),
  ];

  async function handleUncomplete(taskId: string) {
    await fetch(`/api/tasks/${taskId}/uncomplete`, { method: "POST" });
    setDoneIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
    setUndonIds((prev) => new Set([...prev, taskId]));
    router.refresh();
  }

  async function handleCheck(taskId: string) {
    if (loadingId) return;
    setLoadingId(taskId);
    await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
    setDoneIds((prev) => new Set([...prev, taskId]));
    setLoadingId(null);
    router.refresh();
  }

  if (total === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-medium text-gray-600">오늘 할 일이 없어요!</p>
        <p className="text-sm mt-1">모든 집안일이 완료됐습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 진행 상황 */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            오늘 <span className="text-green-600 font-bold">{total}개</span> 중{" "}
            <span className="text-green-600 font-bold">{doneCount}개</span> 완료
          </span>
          <span className="text-xs text-gray-400">
            {total === doneCount ? "모두 완료! 🎉" : `${total - doneCount}개 남음`}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: total > 0 ? `${Math.round((doneCount / total) * 100)}%` : "0%" }}
          />
        </div>
      </div>

      {/* 미완료 목록 */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((task) => {
            const space = spaceMap[task.spaceId];
            const overdue = isOverdue(task.dueDate);
            const isLoading = loadingId === task.id;

            return (
              <div key={task.id}
                className={`bg-white rounded-2xl border px-5 py-4 flex items-center gap-4 transition-all
                  ${overdue ? "border-red-100" : "border-gray-100"}`}>
                {/* 체크박스 */}
                <button
                  onClick={() => handleCheck(task.id)}
                  disabled={!!loadingId}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                    ${isLoading
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 hover:border-green-400 hover:bg-green-50"}`}
                >
                  {isLoading && (
                    <span className="w-2.5 h-2.5 rounded-full bg-green-300 animate-pulse" />
                  )}
                </button>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {TASK_CATEGORY_ICONS[task.category] && (
                      <span className="mr-1">{TASK_CATEGORY_ICONS[task.category]}</span>
                    )}
                    {task.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {space && (
                      <span className="text-xs text-gray-400">
                        {space.home.name} · {space.name}
                      </span>
                    )}
                    {overdue && (
                      <>
                        <span className="text-gray-200">·</span>
                        <span className="text-xs text-red-400 font-medium">기간 지남</span>
                      </>
                    )}
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-300">{CYCLE_LABEL[task.cycleUnit]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 완료된 목록 */}
      {done.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-300 px-1">완료</p>
          {done.map((task) => {
            const space = spaceMap[task.spaceId];
            return (
              <div key={task.id}
                className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-4 group">
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0 opacity-50">
                  <p className="text-sm text-gray-400 line-through truncate">{task.name}</p>
                  {space && (
                    <p className="text-xs text-gray-300 mt-0.5">{space.home.name} · {space.name}</p>
                  )}
                </div>
                <button
                  onClick={() => handleUncomplete(task.id)}
                  className="text-xs text-gray-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="완료 취소"
                >
                  되돌리기
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
