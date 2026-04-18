"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  name: string;
  status: string;
  dueDate: Date | string;
  cycleUnit: string;
  cycleEvery: number;
  category: string;
  itemId: string | null;
  template: {
    defaultCycleUnit: string;
    defaultCycleEvery: number;
  } | null;
}

interface Item {
  id: string;
  name: string;
  category: string;
  lastCleanedAt: Date | string | null;
}

interface Space {
  id: string;
  name: string;
  type: string;
  items: Item[];
}

interface ItemTemplate {
  id: string;
  name: string;
  category: string;
}

const SPACE_ICONS: Record<string, string> = {
  LIVING_ROOM: "🛋️", KITCHEN: "🍳", BATHROOM: "🚿", BEDROOM: "🛏️",
  BALCONY: "🌿", ENTRANCE: "🚪", LAUNDRY_ROOM: "🫧", STORAGE: "📦", OTHER: "🏠",
  HOME_ROUTINE: "📋", PET: "🐾", PLANT: "🪴",
};

const TASK_CATEGORY_ICONS: Record<string, string> = {
  CLEANING: "🧹", MAINTENANCE: "🔧", REPLACEMENT: "🔄",
  DAILY_CHORE: "🏠", LAUNDRY: "👕", PET_CARE: "🐾", PLANT_CARE: "🪴",
};

// 공간 타입별 아이템 카테고리 필터
const SPACE_ITEM_CATEGORIES: Record<string, string[]> = {
  PET: ["PET"],
  PLANT: ["PLANT"],
};

// 공간 타입별 기본 태스크 카테고리
const SPACE_DEFAULT_TASK_CATEGORY: Record<string, string> = {
  PET: "PET_CARE",
  PLANT: "PLANT_CARE",
  HOME_ROUTINE: "DAILY_CHORE",
  LAUNDRY_ROOM: "LAUNDRY",
  KITCHEN: "CLEANING",
};

const CYCLE_LABEL: Record<string, string> = {
  DAILY: "매일", WEEKLY: "매주", MONTHLY: "매월",
  QUARTERLY: "분기별", BIANNUALLY: "6개월", YEARLY: "매년",
};

const CYCLES = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "BIANNUALLY", "YEARLY"];

function dueBadge(dueDate: Date | string) {
  const d = new Date(dueDate);
  const today = new Date(new Date().toDateString());
  const diff = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: `${Math.abs(diff)}일 지남`, color: "text-red-500 bg-red-50" };
  if (diff === 0) return { label: "오늘", color: "text-orange-500 bg-orange-50" };
  if (diff <= 3) return { label: `${diff}일 후`, color: "text-yellow-600 bg-yellow-50" };
  return { label: `${diff}일 후`, color: "text-gray-400 bg-gray-50" };
}

function toDateInputValue(dueDate: Date | string) {
  return new Date(dueDate).toISOString().split("T")[0];
}

// ── 인라인 텍스트 편집 ──────────────────────────────────────────
function InlineEdit({ value, onSave, className }: {
  value: string;
  onSave: (v: string) => Promise<void>;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(value);
    setEditing(true);
  }

  async function handleSave(e?: React.MouseEvent | React.KeyboardEvent) {
    e?.stopPropagation();
    const trimmed = draft.trim();
    if (!trimmed) return;
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditing(false);
  }

  function handleCancel(e?: React.MouseEvent) {
    e?.stopPropagation();
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleSave(e); }
            if (e.key === "Escape") { e.preventDefault(); handleCancel(); }
          }}
          disabled={saving}
          className={`border-b border-green-400 bg-transparent focus:outline-none min-w-0 ${className}`}
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSave(e); }}
          disabled={saving || !draft.trim()}
          className="text-xs text-green-600 hover:text-green-700 font-medium shrink-0 disabled:opacity-40"
        >
          {saving ? "..." : "저장"}
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleCancel(e); }}
          className="text-xs text-gray-400 hover:text-gray-600 shrink-0"
        >
          ✕
        </button>
      </span>
    );
  }

  return (
    <span
      onClick={startEdit}
      className={`cursor-text hover:border-b hover:border-dashed hover:border-gray-300 ${className}`}
      title="클릭하여 이름 변경"
    >
      {value}
    </span>
  );
}

// ── TaskRow ─────────────────────────────────────────────────────
function TaskRow({ task, onComplete, onRefresh }: {
  task: Task;
  onComplete: () => void;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [editDate, setEditDate] = useState(false);
  const [editCycle, setEditCycle] = useState(false);
  const [dateValue, setDateValue] = useState(toDateInputValue(task.dueDate));
  const [cycleUnit, setCycleUnit] = useState(task.cycleUnit);
  const [cycleEvery, setCycleEvery] = useState(task.cycleEvery);
  const badge = dueBadge(task.dueDate);

  const recommended = task.template;
  const isRecommendedDiff =
    recommended &&
    (recommended.defaultCycleUnit !== cycleUnit || recommended.defaultCycleEvery !== cycleEvery);

  async function handleComplete() {
    setLoading(true);
    await fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });
    setLoading(false);
    onComplete();
  }

  async function saveDate() {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: dateValue }),
    });
    setEditDate(false);
    onRefresh();
  }

  async function saveCycle() {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleUnit, cycleEvery }),
    });
    setEditCycle(false);
    onRefresh();
  }

  async function applyRecommended() {
    if (!recommended) return;
    setCycleUnit(recommended.defaultCycleUnit);
    setCycleEvery(recommended.defaultCycleEvery);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cycleUnit: recommended.defaultCycleUnit, cycleEvery: recommended.defaultCycleEvery }),
    });
    onRefresh();
  }

  return (
    <div className="py-2 px-3 rounded-lg hover:bg-gray-50 group space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-gray-300 text-xs shrink-0">└</span>
          {TASK_CATEGORY_ICONS[task.category] && (
            <span className="text-xs shrink-0" title={task.category}>{TASK_CATEGORY_ICONS[task.category]}</span>
          )}
          <span className="text-sm text-gray-700 truncate">{task.name}</span>
        </div>
        <button
          onClick={handleComplete}
          disabled={loading}
          className="text-xs text-green-600 hover:text-green-700 border border-green-200 hover:border-green-300 px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 shrink-0"
        >
          {loading ? "..." : "완료"}
        </button>
      </div>

      <div className="flex items-center gap-2 pl-5 flex-wrap">
        {editDate ? (
          <div className="flex items-center gap-1">
            <input
              type="date" value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            <button onClick={saveDate} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-lg hover:bg-green-600">저장</button>
            <button onClick={() => { setDateValue(toDateInputValue(task.dueDate)); setEditDate(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
          </div>
        ) : (
          <button onClick={() => setEditDate(true)}
            className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${badge.color}`}>
            📅 {badge.label}
          </button>
        )}

        {editCycle ? (
          <div className="flex items-center gap-1 flex-wrap">
            <select value={cycleUnit} onChange={(e) => setCycleUnit(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500">
              {CYCLES.map((c) => <option key={c} value={c}>{CYCLE_LABEL[c]}</option>)}
            </select>
            <select value={cycleEvery} onChange={(e) => setCycleEvery(Number(e.target.value))}
              className="w-16 text-xs border border-gray-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-green-500">
              {[1, 2, 3, 4, 6].map((n) => <option key={n} value={n}>x{n}</option>)}
            </select>
            <button onClick={saveCycle} className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-lg hover:bg-green-600">저장</button>
            <button onClick={() => { setCycleUnit(task.cycleUnit); setCycleEvery(task.cycleEvery); setEditCycle(false); }}
              className="text-xs text-gray-400 hover:text-gray-600 px-1">✕</button>
          </div>
        ) : (
          <button onClick={() => setEditCycle(true)}
            className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
            🔄 {CYCLE_LABEL[task.cycleUnit]}{task.cycleEvery > 1 ? ` x${task.cycleEvery}` : ""}
          </button>
        )}
      </div>

      {isRecommendedDiff && !editCycle && (
        <div className="pl-5 flex items-center gap-2">
          <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
            추천: {CYCLE_LABEL[recommended!.defaultCycleUnit]}
            {recommended!.defaultCycleEvery > 1 ? ` x${recommended!.defaultCycleEvery}` : ""}
          </span>
          <button onClick={applyRecommended} className="text-xs text-blue-600 hover:text-blue-700 underline">
            적용
          </button>
        </div>
      )}
    </div>
  );
}

// ── 가전/가구/펫/식물 추가 버튼 ─────────────────────────────────
function AddItemButton({ spaceId, homeId, spaceType, onAdded }: {
  spaceId: string;
  homeId: string;
  spaceType: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(() =>
    spaceType === "PET" ? "PET" : spaceType === "PLANT" ? "PLANT" : "APPLIANCE"
  );
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<ItemTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  // 공간 타입에 따라 필터링할 카테고리
  const allowedCategories = SPACE_ITEM_CATEGORIES[spaceType] ?? ["APPLIANCE", "FURNITURE", "FIXTURE"];

  const isPetSpace = spaceType === "PET";
  const isPlantSpace = spaceType === "PLANT";

  const buttonLabel = isPetSpace ? "+ 반려동물 추가"
    : isPlantSpace ? "+ 식물 추가"
    : "+ 가전/가구 추가";

  async function openForm() {
    if (templates.length === 0) {
      const res = await fetch("/api/item-templates");
      setTemplates(await res.json());
    }
    setOpen(true);
  }

  function selectTemplate(t: ItemTemplate) {
    setTemplateId(t.id);
    setName(t.name);
    setCategory(t.category);
  }

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch(`/api/spaces/${spaceId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), category, templateId: templateId || null }),
    });
    setName(""); setTemplateId(""); setOpen(false); setLoading(false);
    onAdded();
  }

  if (!open) {
    return (
      <button onClick={openForm}
        className="text-xs text-gray-400 hover:text-green-600 px-3 py-1.5 mt-2 hover:bg-green-50 rounded-lg transition-colors border border-dashed border-gray-200 hover:border-green-300 w-full text-left">
        {buttonLabel}
      </button>
    );
  }

  const CATEGORY_LABELS: Record<string, string> = {
    APPLIANCE: "가전", FURNITURE: "가구", FIXTURE: "설비", PET: "반려동물", PLANT: "식물",
  };

  const filtered = templates.filter((t) => allowedCategories.includes(t.category));
  const grouped = filtered.reduce<Record<string, ItemTemplate[]>>((acc, t) => {
    acc[t.category] = [...(acc[t.category] ?? []), t];
    return acc;
  }, {});

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
      {/* 템플릿 칩 선택 */}
      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat}>
          <p className="text-xs text-gray-400 mb-1.5">{CATEGORY_LABELS[cat] ?? cat}</p>
          <div className="flex flex-wrap gap-1.5">
            {items.map((t) => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors
                  ${templateId === t.id
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-300 hover:text-green-600"}`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 직접 입력 */}
      <div className="space-y-2 pt-1 border-t border-gray-100">
        <input
          autoFocus={!templateId}
          type="text"
          placeholder="직접 입력 (예: 공기청정기)"
          value={name}
          onChange={(e) => { setName(e.target.value); setTemplateId(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
          <option value="APPLIANCE">가전</option>
          <option value="FURNITURE">가구</option>
          <option value="FIXTURE">설비</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setOpen(false); setName(""); setTemplateId(""); }}
          className="flex-1 text-xs border border-gray-200 text-gray-500 py-1.5 rounded-lg hover:bg-gray-100">
          취소
        </button>
        <button onClick={handleAdd} disabled={loading || !name.trim()}
          className="flex-1 text-xs bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 disabled:bg-green-300">
          {loading ? "..." : "추가"}
        </button>
      </div>
    </div>
  );
}

// ── 태스크 추가 버튼 ─────────────────────────────────────────────
const ALL_TASK_CATEGORIES = [
  { value: "CLEANING", label: "🧹 청소" },
  { value: "MAINTENANCE", label: "🔧 유지보수" },
  { value: "REPLACEMENT", label: "🔄 교체" },
  { value: "DAILY_CHORE", label: "🏠 일상 가사" },
  { value: "LAUNDRY", label: "👕 빨래" },
  { value: "PET_CARE", label: "🐾 펫케어" },
  { value: "PLANT_CARE", label: "🪴 식물 관리" },
];

function AddTaskButton({
  itemId, spaceId, homeId, spaceType, onAdded, label,
}: {
  itemId?: string; spaceId: string; homeId: string; spaceType?: string; onAdded: () => void; label?: string;
}) {
  const defaultCategory = spaceType ? (SPACE_DEFAULT_TASK_CATEGORY[spaceType] ?? "CLEANING") : "CLEANING";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [cycleUnit, setCycleUnit] = useState("WEEKLY");
  const [cycleEvery, setCycleEvery] = useState(1);
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/tasks/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, cycleUnit, cycleEvery, itemId, spaceId, homeId, dueDate }),
    });
    setName(""); setOpen(false); setLoading(false);
    onAdded();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-green-600 px-3 py-1 mt-1 hover:bg-green-50 rounded-lg transition-colors">
        + {label ?? "태스크 추가"}
      </button>
    );
  }

  return (
    <div className="mt-2 mx-0 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
      <input
        autoFocus
        type="text" placeholder="태스크 이름 (예: 필터 청소)"
        value={name} onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
        {ALL_TASK_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <input
        type="date" value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <div className="flex gap-2">
        <select value={cycleUnit} onChange={(e) => setCycleUnit(e.target.value)}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
          {CYCLES.map((c) => <option key={c} value={c}>{CYCLE_LABEL[c]}</option>)}
        </select>
        <select value={cycleEvery} onChange={(e) => setCycleEvery(Number(e.target.value))}
          className="w-20 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500">
          {[1, 2, 3, 4, 6].map((n) => <option key={n} value={n}>x{n}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)}
          className="flex-1 text-xs border border-gray-200 text-gray-500 py-1.5 rounded-lg hover:bg-gray-100">
          취소
        </button>
        <button onClick={handleAdd} disabled={loading || !name.trim()}
          className="flex-1 text-xs bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 disabled:bg-green-300">
          {loading ? "..." : "추가"}
        </button>
      </div>
    </div>
  );
}

// ── SpaceAccordion (메인) ────────────────────────────────────────
export default function SpaceAccordion({
  space, homeId, spaceTasks, itemTaskMap, isOpen, onToggle,
}: {
  space: Space;
  homeId: string;
  spaceTasks: Task[];
  itemTaskMap: Record<string, Task[]>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();

  const allTasks = [
    ...spaceTasks,
    ...space.items.flatMap((i) => itemTaskMap[i.id] ?? []),
  ];
  const overdueTasks = allTasks.filter((t) => new Date(t.dueDate) < new Date(new Date().toDateString()));

  function refresh() { router.refresh(); }

  async function saveSpaceName(newName: string) {
    await fetch(`/api/homes/${homeId}/spaces/${space.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, type: space.type }),
    });
    refresh();
  }

  async function saveItemName(itemId: string, newName: string) {
    await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* 공간 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-xl shrink-0">{SPACE_ICONS[space.type] ?? "🏠"}</span>
          <div className="min-w-0">
            <InlineEdit
              value={space.name}
              onSave={saveSpaceName}
              className="font-semibold text-gray-900 text-sm"
            />
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">가전/가구 {space.items.length}개</span>
              {allTasks.length > 0 && (
                <span className="text-xs text-gray-400">· 할 일 {allTasks.length}개</span>
              )}
              {overdueTasks.length > 0 && (
                <span className="text-xs text-red-400 font-medium">· ⚠️ {overdueTasks.length}개 지남</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onToggle}
          className="text-gray-300 hover:text-gray-500 p-1 rounded transition-colors shrink-0">
          <span className={`inline-block transition-transform ${isOpen ? "rotate-90" : ""}`}>›</span>
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-gray-50 px-4 pb-4">
          {/* 공간 레벨 태스크 */}
          {spaceTasks.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium text-gray-400 mb-1 px-3">공간 청소 루틴</p>
              {spaceTasks.map((task) => (
                <TaskRow key={task.id} task={task} onComplete={refresh} onRefresh={refresh} />
              ))}
            </div>
          )}
          <AddTaskButton spaceId={space.id} homeId={homeId} spaceType={space.type} onAdded={refresh} label="공간 태스크 추가" />

          {/* 아이템별 */}
          {space.items.map((item) => {
            const tasks = itemTaskMap[item.id] ?? [];
            return (
              <div key={item.id} className="mt-4 border-t border-gray-50 pt-3">
                <div className="flex items-center justify-between px-3 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <InlineEdit
                      value={item.name}
                      onSave={(v) => saveItemName(item.id, v)}
                      className="text-xs font-semibold text-gray-600"
                    />
                    {item.lastCleanedAt && (
                      <span className="text-gray-300 font-normal text-xs">
                        · 마지막 청소: {new Date(item.lastCleanedAt).toLocaleDateString("ko-KR")}
                      </span>
                    )}
                  </div>
                  {tasks.length === 0 && (
                    <span className="text-xs text-gray-300 shrink-0">등록된 태스크 없음</span>
                  )}
                </div>
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onComplete={refresh} onRefresh={refresh} />
                ))}
                <AddTaskButton itemId={item.id} spaceId={space.id} homeId={homeId} spaceType={space.type} onAdded={refresh} />
              </div>
            );
          })}

          {/* 가전/가구/펫/식물 추가 */}
          <div className="mt-4 border-t border-gray-50 pt-3 px-3">
            <AddItemButton spaceId={space.id} homeId={homeId} spaceType={space.type} onAdded={refresh} />
          </div>
        </div>
      )}
    </div>
  );
}
