"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  name: string;
  status: string;
  dueDate: Date | string;
  homeId: string;
  spaceId: string;
  cycleUnit: string;
  cycleEvery: number;
  category: string;
  item: { name: string } | null;
}

interface Space {
  id: string;
  name: string;
  type: string;
  home: { name: string };
}

interface Home {
  id: string;
  name: string;
  type: string;
}

interface Props {
  tasks: Task[];
  completedTasks?: Task[];
  upcomingTasks: Task[];
  spaceMap: Record<string, Space>;
  homes: Home[];
}

const CYCLE_LABEL: Record<string, string> = {
  DAILY: "매일", WEEKLY: "매주", MONTHLY: "매월",
  QUARTERLY: "분기별", BIANNUALLY: "6개월", YEARLY: "매년",
};

const TASK_CATEGORY_ICONS: Record<string, string> = {
  CLEANING: "🧹", MAINTENANCE: "🔧", REPLACEMENT: "🔄",
  DAILY_CHORE: "🏠", LAUNDRY: "👕", PET_CARE: "🐾", PLANT_CARE: "🪴",
};

const SPACE_ICONS: Record<string, string> = {
  LIVING_ROOM: "🛋️", KITCHEN: "🍳", BATHROOM: "🚿", BEDROOM: "🛏️",
  BALCONY: "🌿", ENTRANCE: "🚪", LAUNDRY_ROOM: "🫧", STORAGE: "📦", OTHER: "🏠",
};

const HOME_ICONS: Record<string, string> = {
  STUDIO: "🏠", APARTMENT: "🏢", VILLA: "🏘️", HOUSE: "🏡", OFFICETEL: "🏙️",
};

function isOverdue(dueDate: Date | string) {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDueDate(dueDate: Date | string) {
  const d = new Date(dueDate);
  const today = new Date(new Date().toDateString());
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  if (diff === 0) return "오늘";
  return `${diff}일 후`;
}

export default function TodayTaskList({ tasks, completedTasks = [], upcomingTasks, spaceMap, homes }: Props) {
  const router = useRouter();
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [undonIds, setUndonIds] = useState<Set<string>>(new Set());

  const activeTasks = tasks.filter((t) => !doneIds.has(t.id));
  const total = tasks.length + completedTasks.filter((t) => !undonIds.has(t.id)).length;
  const done = doneIds.size + completedTasks.filter((t) => !undonIds.has(t.id)).length;
  const pct = total === 0 ? 100 : Math.round((done / total) * 100);

  // 이번 세션 완료 + DB에서 가져온 완료 목록 (되돌린 것 제외)
  const allDoneTasks = [
    ...tasks.filter((t) => doneIds.has(t.id)),
    ...completedTasks.filter((t) => !undonIds.has(t.id)),
  ];

  async function uncomplete(taskId: string) {
    await fetch(`/api/tasks/${taskId}/uncomplete`, { method: "POST" });
    setDoneIds((prev) => { const n = new Set(prev); n.delete(taskId); return n; });
    setUndonIds((prev) => new Set([...prev, taskId]));
    router.refresh();
  }

  async function complete(taskId: string) {
    if (loadingId) return;
    setLoadingId(taskId);
    await fetch(`/api/tasks/${taskId}/complete`, { method: "POST" });
    setDoneIds((prev) => new Set([...prev, taskId]));
    setLoadingId(null);
    router.refresh();
  }

  async function snooze(taskId: string, days: number) {
    if (loadingId) return;
    setLoadingId(taskId);
    await fetch(`/api/tasks/${taskId}/snooze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    });
    setDoneIds((prev) => new Set([...prev, taskId]));
    setLoadingId(null);
    router.refresh();
  }

  // 집별 그룹핑
  const tasksByHome: Record<string, Task[]> = {};
  for (const t of activeTasks) {
    if (!tasksByHome[t.homeId]) tasksByHome[t.homeId] = [];
    tasksByHome[t.homeId].push(t);
  }

  return (
    <div className="space-y-4">
      {/* 진행률 */}
      <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            오늘 <span className="text-green-600 font-bold">{total}개</span> 중{" "}
            <span className="text-green-600 font-bold">{done}개</span> 완료
          </span>
          <span className="text-xs text-gray-400">
            {total === done ? "모두 완료! 🎉" : `${total - done}개 남음`}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {total === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🎉</div>
          <p className="font-medium text-gray-600">오늘 할 일이 없어요!</p>
        </div>
      )}

      {/* 집별 할 일 */}
      {homes.map((home) => {
        const homeTasks = tasksByHome[home.id];
        if (!homeTasks?.length) return null;

        const overdue = homeTasks.filter((t) => isOverdue(t.dueDate));
        const today = homeTasks.filter((t) => !isOverdue(t.dueDate));

        return (
          <div key={home.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {/* 집 헤더 */}
            <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
              <span>{HOME_ICONS[home.type] ?? "🏠"}</span>
              <span className="text-sm font-semibold text-gray-800">{home.name}</span>
              {overdue.length > 0 && (
                <span className="text-xs text-red-400 bg-red-50 px-2 py-0.5 rounded-full ml-auto">
                  ⚠️ {overdue.length}개 지남
                </span>
              )}
            </div>

            {/* 태스크 목록 */}
            <div className="divide-y divide-gray-50">
              {[...overdue, ...today].map((task) => {
                const space = spaceMap[task.spaceId];
                const overdueTask = isOverdue(task.dueDate);
                const isLoading = loadingId === task.id;

                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    space={space}
                    overdue={overdueTask}
                    loading={isLoading}
                    onComplete={() => complete(task.id)}
                    onSnooze={(d) => snooze(task.id, d)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 완료된 항목 */}
      {allDoneTasks.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-300 px-1">완료</p>
          {allDoneTasks.map((task) => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 group">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-400 line-through flex-1">{task.name}</span>
              <button
                onClick={() => uncomplete(task.id)}
                className="text-xs text-gray-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                title="완료 취소"
              >
                되돌리기
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 이번 주 예정 */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-3">📅 이번 주 예정</h3>
          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">{task.name}</span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{formatDueDate(task.dueDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, space, overdue, loading, onComplete, onSnooze }: {
  task: Task;
  space: Space | undefined;
  overdue: boolean;
  loading: boolean;
  onComplete: () => void;
  onSnooze: (days: number) => void;
}) {
  const [showSnooze, setShowSnooze] = useState(false);

  return (
    <div className={`flex items-center gap-3 px-5 py-3 ${overdue ? "bg-red-50/30" : ""}`}>
      {/* 체크박스 */}
      <button
        onClick={onComplete}
        disabled={loading}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
          ${loading ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-green-400 hover:bg-green-50"}`}
      >
        {loading && <span className="w-2.5 h-2.5 rounded-full bg-green-300 animate-pulse" />}
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
              {SPACE_ICONS[space.type]} {space.name}
            </span>
          )}
          <span className="text-gray-200 text-xs">·</span>
          <span className={`text-xs font-medium ${overdue ? "text-red-400" : "text-orange-400"}`}>
            {formatDueDate(task.dueDate)}
          </span>
          <span className="text-gray-200 text-xs">·</span>
          <span className="text-xs text-gray-300">{CYCLE_LABEL[task.cycleUnit]}</span>
        </div>
      </div>

      {/* 미루기 */}
      {!showSnooze ? (
        <button
          onClick={() => setShowSnooze(true)}
          className="text-xs text-gray-300 hover:text-gray-500 shrink-0 transition-colors"
        >
          미루기
        </button>
      ) : (
        <div className="flex items-center gap-1 shrink-0">
          {[1, 3, 7].map((d) => (
            <button key={d}
              onClick={() => { onSnooze(d); setShowSnooze(false); }}
              className="text-xs border border-gray-200 px-2 py-0.5 rounded-lg hover:bg-gray-50 text-gray-600">
              {d === 1 ? "내일" : d === 3 ? "3일" : "1주"}
            </button>
          ))}
          <button onClick={() => setShowSnooze(false)} className="text-xs text-gray-400 px-1">✕</button>
        </div>
      )}
    </div>
  );
}
