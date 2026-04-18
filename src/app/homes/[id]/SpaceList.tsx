"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SpaceAccordion from "./SpaceAccordion";

interface Task {
  id: string;
  name: string;
  status: string;
  dueDate: Date | string;
  cycleUnit: string;
  cycleEvery: number;
  itemId: string | null;
  template: { defaultCycleUnit: string; defaultCycleEvery: number } | null;
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
  order: number;
  items: Item[];
}

const ROOM_TYPES = [
  { value: "LIVING_ROOM", label: "거실", icon: "🛋️" },
  { value: "KITCHEN", label: "주방", icon: "🍳" },
  { value: "BATHROOM", label: "화장실", icon: "🚿" },
  { value: "BEDROOM", label: "방", icon: "🛏️" },
  { value: "BALCONY", label: "베란다", icon: "🌿" },
  { value: "ENTRANCE", label: "현관", icon: "🚪" },
  { value: "LAUNDRY_ROOM", label: "세탁실", icon: "🫧" },
  { value: "STORAGE", label: "창고", icon: "📦" },
  { value: "OTHER", label: "기타", icon: "🏠" },
];

const ROOM_TYPE_VALUES = new Set(ROOM_TYPES.map((t) => t.value));

function isRoomType(type: string) { return ROOM_TYPE_VALUES.has(type); }
function isPetPlantType(type: string) { return type === "PET" || type === "PLANT"; }
function isHomeRoutineType(type: string) { return type === "HOME_ROUTINE"; }

export default function SpaceList({
  homeId,
  initialSpaces,
  spaceTaskMap,
  itemTaskMap,
}: {
  homeId: string;
  initialSpaces: Space[];
  spaceTaskMap: Record<string, Task[]>;
  itemTaskMap: Record<string, Task[]>;
}) {
  const router = useRouter();
  const [spaces, setSpaces] = useState(initialSpaces);
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(initialSpaces.map((s) => s.id))
  );

  // 방 추가 폼
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [newRoomType, setNewRoomType] = useState("LIVING_ROOM");
  const [newRoomName, setNewRoomName] = useState("");
  const [addingRoom, setAddingRoom] = useState(false);

  // 펫/식물 추가 폼
  const [showPetPlantForm, setShowPetPlantForm] = useState(false);
  const [newPetPlantType, setNewPetPlantType] = useState<"PET" | "PLANT">("PET");
  const [newPetPlantName, setNewPetPlantName] = useState("");
  const [addingPetPlant, setAddingPetPlant] = useState(false);

  // 집 루틴 추가 (자동으로 HOME_ROUTINE space 생성)
  const [addingRoutine, setAddingRoutine] = useState(false);

  const rooms = spaces.filter((s) => isRoomType(s.type));
  const petPlants = spaces.filter((s) => isPetPlantType(s.type));
  const routines = spaces.filter((s) => isHomeRoutineType(s.type));

  const allRoomsOpen = rooms.every((s) => openIds.has(s.id));

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAllRooms() {
    if (allRoomsOpen) setOpenIds((p) => { const n = new Set(p); rooms.forEach((s) => n.delete(s.id)); return n; });
    else setOpenIds((p) => new Set([...p, ...rooms.map((s) => s.id)]));
  }

  async function createSpace(name: string, type: string): Promise<Space> {
    const res = await fetch(`/api/homes/${homeId}/spaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, order: spaces.length }),
    });
    return res.json();
  }

  async function addRoom() {
    if (!newRoomName.trim()) return;
    setAddingRoom(true);
    const created = await createSpace(newRoomName.trim(), newRoomType);
    setSpaces((p) => [...p, { ...created, items: [] }]);
    setOpenIds((p) => new Set([...p, created.id]));
    setShowRoomForm(false); setNewRoomName(""); setNewRoomType("LIVING_ROOM");
    setAddingRoom(false);
    router.refresh();
  }

  async function addPetPlant() {
    if (!newPetPlantName.trim()) return;
    setAddingPetPlant(true);
    const created = await createSpace(newPetPlantName.trim(), newPetPlantType);
    setSpaces((p) => [...p, { ...created, items: [] }]);
    setOpenIds((p) => new Set([...p, created.id]));
    setShowPetPlantForm(false); setNewPetPlantName("");
    setAddingPetPlant(false);
    router.refresh();
  }

  async function ensureRoutineSpace() {
    if (routines.length > 0) return routines[0];
    setAddingRoutine(true);
    const created = await createSpace("집 전체 루틴", "HOME_ROUTINE");
    const space = { ...created, items: [] };
    setSpaces((p) => [...p, space]);
    setOpenIds((p) => new Set([...p, created.id]));
    setAddingRoutine(false);
    router.refresh();
    return space;
  }

  async function deleteSpace(spaceId: string) {
    await fetch(`/api/homes/${homeId}/spaces/${spaceId}`, { method: "DELETE" });
    setSpaces((p) => p.filter((s) => s.id !== spaceId));
    router.refresh();
  }

  async function moveRoom(index: number, direction: "up" | "down") {
    const next = [...rooms];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setSpaces((p) => {
      const others = p.filter((s) => !isRoomType(s.type));
      return [...next, ...others];
    });
    await Promise.all([
      fetch(`/api/homes/${homeId}/spaces/${next[index].id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: index }),
      }),
      fetch(`/api/homes/${homeId}/spaces/${next[swapIndex].id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapIndex }),
      }),
    ]);
  }

  return (
    <div className="space-y-8">

      {/* ── 방 섹션 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">방</h2>
          {rooms.length > 1 && (
            <button onClick={toggleAllRooms}
              className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100">
              {allRoomsOpen ? "모두 접기 ↑" : "모두 펼치기 ↓"}
            </button>
          )}
        </div>
        <div className="space-y-3">
          {rooms.map((space, idx) => (
            <SpaceRoomRow key={space.id} space={space} idx={idx} total={rooms.length}
              onMove={moveRoom} onDelete={deleteSpace}
              accordion={
                <SpaceAccordion space={space} homeId={homeId}
                  spaceTasks={spaceTaskMap[space.id] ?? []}
                  itemTaskMap={itemTaskMap}
                  isOpen={openIds.has(space.id)}
                  onToggle={() => toggle(space.id)} />
              } />
          ))}

          {showRoomForm ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <p className="text-sm font-semibold text-gray-800">방 추가</p>
              <div className="grid grid-cols-3 gap-2">
                {ROOM_TYPES.map((t) => (
                  <button key={t.value} onClick={() => { setNewRoomType(t.value); setNewRoomName(t.label); }}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs transition-colors
                      ${newRoomType === t.value ? "border-green-400 bg-green-50 text-green-700" : "border-gray-100 hover:border-gray-200 text-gray-600"}`}>
                    <span className="text-lg">{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="방 이름 (예: 화장실1, 안방)"
                value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRoom()}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex gap-2">
                <button onClick={() => { setShowRoomForm(false); setNewRoomName(""); }}
                  className="flex-1 text-sm border border-gray-200 text-gray-500 py-2 rounded-xl hover:bg-gray-50">취소</button>
                <button onClick={addRoom} disabled={addingRoom || !newRoomName.trim()}
                  className="flex-1 text-sm bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 disabled:bg-green-300 font-medium">
                  {addingRoom ? "추가 중..." : "추가"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowRoomForm(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors">
              + 방 추가
            </button>
          )}
        </div>
      </section>

      {/* ── 반려동물 & 식물 섹션 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">🐾 반려동물 & 식물 🪴</h2>
        </div>
        <div className="space-y-3">
          {petPlants.map((space) => (
            <div key={space.id} className="relative group/row">
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                <DeleteButton onDelete={() => deleteSpace(space.id)} />
              </div>
              <SpaceAccordion space={space} homeId={homeId}
                spaceTasks={spaceTaskMap[space.id] ?? []}
                itemTaskMap={itemTaskMap}
                isOpen={openIds.has(space.id)}
                onToggle={() => toggle(space.id)} />
            </div>
          ))}

          {showPetPlantForm ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex gap-2">
                {[{ value: "PET", label: "반려동물", icon: "🐾" }, { value: "PLANT", label: "식물", icon: "🪴" }].map((t) => (
                  <button key={t.value}
                    onClick={() => setNewPetPlantType(t.value as "PET" | "PLANT")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm transition-colors
                      ${newPetPlantType === t.value ? "border-green-400 bg-green-50 text-green-700" : "border-gray-100 text-gray-600 hover:border-gray-200"}`}>
                    <span>{t.icon}</span>{t.label}
                  </button>
                ))}
              </div>
              <input type="text"
                placeholder={newPetPlantType === "PET" ? "이름 (예: 나비, 초코)" : "이름 (예: 고무나무, 선인장)"}
                value={newPetPlantName} onChange={(e) => setNewPetPlantName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPetPlant()}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500" />
              <div className="flex gap-2">
                <button onClick={() => { setShowPetPlantForm(false); setNewPetPlantName(""); }}
                  className="flex-1 text-xs border border-gray-200 text-gray-500 py-2 rounded-xl hover:bg-gray-50">취소</button>
                <button onClick={addPetPlant} disabled={addingPetPlant || !newPetPlantName.trim()}
                  className="flex-1 text-xs bg-green-500 text-white py-2 rounded-xl hover:bg-green-600 disabled:bg-green-300">
                  {addingPetPlant ? "추가 중..." : "추가"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowPetPlantForm(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors">
              + 반려동물 / 식물 추가
            </button>
          )}
        </div>
      </section>

      {/* ── 집 전체 루틴 섹션 ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">📋 집 전체 루틴</h2>
        </div>
        <div className="space-y-3">
          {routines.map((space) => (
            <SpaceAccordion key={space.id} space={space} homeId={homeId}
              spaceTasks={spaceTaskMap[space.id] ?? []}
              itemTaskMap={itemTaskMap}
              isOpen={openIds.has(space.id)}
              onToggle={() => toggle(space.id)} />
          ))}

          {routines.length === 0 && (
            <button onClick={ensureRoutineSpace} disabled={addingRoutine}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors disabled:opacity-50">
              {addingRoutine ? "생성 중..." : "+ 집 전체 루틴 시작하기"}
            </button>
          )}
        </div>
      </section>

    </div>
  );
}

// ── 방 행 (순서 변경 + 삭제 버튼 포함) ─────────────────────────
function SpaceRoomRow({ space, idx, total, onMove, onDelete, accordion }: {
  space: Space; idx: number; total: number;
  onMove: (i: number, d: "up" | "down") => void;
  onDelete: (id: string) => void;
  accordion: React.ReactNode;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await onDelete(space.id);
    setDeleting(false);
  }

  return (
    <div className="relative group/row">
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button onClick={() => onMove(idx, "up")} disabled={idx === 0}
          className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs shadow-sm">↑</button>
        <button onClick={() => onMove(idx, "down")} disabled={idx === total - 1}
          className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs shadow-sm">↓</button>
      </div>
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
        {confirmDelete ? (
          <div className="flex flex-col gap-0.5">
            <button onClick={handleDelete} disabled={deleting}
              className="w-6 h-6 flex items-center justify-center rounded bg-red-500 text-white text-xs shadow-sm hover:bg-red-600 disabled:opacity-50">✓</button>
            <button onClick={() => setConfirmDelete(false)}
              className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 text-xs shadow-sm">✕</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(true)}
            className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 text-xs shadow-sm">🗑</button>
        )}
      </div>
      {accordion}
    </div>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <div className="flex flex-col gap-0.5">
        <button onClick={onDelete}
          className="w-6 h-6 flex items-center justify-center rounded bg-red-500 text-white text-xs shadow-sm hover:bg-red-600">✓</button>
        <button onClick={() => setConfirm(false)}
          className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 text-xs shadow-sm">✕</button>
      </div>
    );
  }
  return (
    <button onClick={() => setConfirm(true)}
      className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 text-xs shadow-sm">🗑</button>
  );
}
