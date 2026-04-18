"use client";

import { useState } from "react";

interface Task {
  id: string;
  name: string;
  dueDate: Date | string;
  spaceId: string;
  cycleUnit: string;
  status: string;
  item: { name: string } | null;
}

interface Space {
  id: string;
  name: string;
  type: string;
  home: { name: string };
}

const CYCLE_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  DAILY:      { bg: "bg-blue-100",   text: "text-blue-700",   label: "매일" },
  WEEKLY:     { bg: "bg-green-100",  text: "text-green-700",  label: "매주" },
  MONTHLY:    { bg: "bg-purple-100", text: "text-purple-700", label: "매월" },
  QUARTERLY:  { bg: "bg-orange-100", text: "text-orange-700", label: "분기" },
  BIANNUALLY: { bg: "bg-pink-100",   text: "text-pink-700",   label: "6개월" },
  YEARLY:     { bg: "bg-gray-100",   text: "text-gray-600",   label: "매년" },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isToday(date: Date) {
  return isSameDay(date, new Date());
}

export default function CalendarView({
  tasks,
  spaceMap,
}: {
  tasks: Task[];
  spaceMap: Record<string, Space>;
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDow = getFirstDayOfWeek(year, month);

  // group tasks by date string
  const tasksByDate: Record<string, Task[]> = {};
  for (const t of tasks) {
    const d = new Date(t.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(t);
  }

  const selectedTasks = selectedDate
    ? (tasksByDate[`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`] ?? [])
    : [];

  const monthLabel = new Date(year, month).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CYCLE_COLOR).map(([unit, { bg, text, label }]) => (
          <span key={unit} className={`text-xs px-2 py-0.5 rounded-full ${bg} ${text}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <button onClick={prevMonth} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
            ‹
          </button>
          <span className="text-sm font-semibold text-gray-800">{monthLabel}</span>
          <button onClick={nextMonth} className="text-gray-400 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
            ›
          </button>
        </div>

        {/* DOW headers */}
        <div className="grid grid-cols-7 border-b border-gray-50">
          {DAYS.map((d, i) => (
            <div key={d} className={`text-center text-xs py-2 font-medium ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="min-h-[72px] border-b border-r border-gray-50 last:border-r-0" />;
            }
            const date = new Date(year, month, day);
            const key = `${year}-${month}-${day}`;
            const dayTasks = tasksByDate[key] ?? [];
            const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
            const today = isToday(date);
            const isSun = idx % 7 === 0;
            const isSat = idx % 7 === 6;

            return (
              <div
                key={key}
                onClick={() => setSelectedDate(isSelected ? null : date)}
                className={`min-h-[72px] p-1.5 border-b border-r border-gray-50 last:border-r-0 cursor-pointer transition-colors
                  ${isSelected ? "bg-gray-50" : "hover:bg-gray-50/50"}`}
              >
                <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                  ${today ? "bg-green-500 text-white" : isSun ? "text-red-400" : isSat ? "text-blue-400" : "text-gray-700"}`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((t) => {
                    const c = CYCLE_COLOR[t.cycleUnit] ?? CYCLE_COLOR.MONTHLY;
                    return (
                      <div key={t.id} className={`text-xs px-1 py-0.5 rounded truncate ${c.bg} ${c.text} ${t.status === "DONE" ? "opacity-40 line-through" : ""}`}>
                        {t.name}
                      </div>
                    );
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-gray-400 px-1">+{dayTasks.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">
            {selectedDate.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" })}
            <span className="ml-2 text-xs font-normal text-gray-400">{selectedTasks.length}개</span>
          </p>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-gray-400">할 일 없음</p>
          ) : (
            <div className="space-y-2">
              {selectedTasks.map((t) => {
                const c = CYCLE_COLOR[t.cycleUnit] ?? CYCLE_COLOR.MONTHLY;
                const space = spaceMap[t.spaceId];
                return (
                  <div key={t.id} className={`flex items-center gap-3 ${t.status === "DONE" ? "opacity-50" : ""}`}>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${c.bg} ${c.text}`}>{c.label}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-gray-800 truncate ${t.status === "DONE" ? "line-through" : ""}`}>{t.name}</p>
                      {space && <p className="text-xs text-gray-400">{space.home.name} · {space.name}</p>}
                    </div>
                    {t.status === "DONE" && (
                      <span className="text-xs text-green-500 shrink-0">완료</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
