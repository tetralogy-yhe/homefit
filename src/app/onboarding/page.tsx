"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_TYPES, SPACE_TYPES } from "@/lib/constants";

type Step = "home" | "spaces" | "items" | "done";

interface ItemInput {
  name: string;
  templateId: string | null;
  category: string;
}

const DEFAULT_ITEMS: Record<string, { name: string; templateId: string | null; category: string }[]> = {
  KITCHEN: [
    { name: "냉장고", templateId: "냉장고", category: "APPLIANCE" },
    { name: "가스레인지", templateId: "가스레인지", category: "APPLIANCE" },
    { name: "인덕션", templateId: null, category: "APPLIANCE" },
    { name: "전자레인지", templateId: "전자레인지", category: "APPLIANCE" },
    { name: "에어프라이어", templateId: null, category: "APPLIANCE" },
    { name: "오븐", templateId: null, category: "APPLIANCE" },
    { name: "후드", templateId: null, category: "APPLIANCE" },
    { name: "식기세척기", templateId: null, category: "APPLIANCE" },
  ],
  LIVING_ROOM: [
    { name: "TV", templateId: "TV", category: "APPLIANCE" },
    { name: "에어컨", templateId: "에어컨", category: "APPLIANCE" },
    { name: "소파", templateId: "소파", category: "FURNITURE" },
    { name: "공기청정기", templateId: "공기청정기", category: "APPLIANCE" },
  ],
  BATHROOM: [
    { name: "변기", templateId: "변기", category: "FIXTURE" },
    { name: "샤워기", templateId: "샤워기", category: "FIXTURE" },
  ],
  LAUNDRY_ROOM: [
    { name: "세탁기", templateId: "세탁기", category: "APPLIANCE" },
  ],
  BEDROOM: [
    { name: "에어컨", templateId: "에어컨", category: "APPLIANCE" },
    { name: "공기청정기", templateId: "공기청정기", category: "APPLIANCE" },
  ],
};

const SPACE_ICONS: Record<string, string> = {
  LIVING_ROOM: "🛋️", KITCHEN: "🍳", BATHROOM: "🚿", BEDROOM: "🛏️",
  BALCONY: "🌿", ENTRANCE: "🚪", LAUNDRY_ROOM: "🫧", STORAGE: "📦", OTHER: "🏠",
};

// 수량 기반으로 공간 인스턴스 배열 생성 (key: "BATHROOM_0", "BATHROOM_1" 등)
function expandSpaces(counts: Record<string, number>) {
  const result: { type: string; name: string; key: string }[] = [];
  const order = ["LIVING_ROOM", "KITCHEN", "BATHROOM", "BEDROOM", "BALCONY", "ENTRANCE", "LAUNDRY_ROOM", "STORAGE", "OTHER"];
  order.forEach((type) => {
    const count = counts[type] ?? 0;
    const label = SPACE_TYPES.find((s) => s.value === type)?.label ?? type;
    for (let i = 0; i < count; i++) {
      result.push({
        type,
        key: `${type}_${i}`,
        name: count > 1 ? `${label}${i + 1}` : label,
      });
    }
  });
  return result;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("home");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [homeName, setHomeName] = useState("");
  const [homeType, setHomeType] = useState("APARTMENT");
  const [homeAddress, setHomeAddress] = useState("");

  // 수량 카운터: { LIVING_ROOM: 1, BATHROOM: 2, ... }
  const [spaceCounts, setSpaceCounts] = useState<Record<string, number>>({
    LIVING_ROOM: 1, KITCHEN: 1, BATHROOM: 1,
  });

  // 아이템: { "BATHROOM_0": [...], "BATHROOM_1": [...] }
  const [spaceItems, setSpaceItems] = useState<Record<string, ItemInput[]>>({});
  // 직접 입력 텍스트: { "BATHROOM_0": "세면대", ... }
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  function setCount(type: string, delta: number) {
    setSpaceCounts((prev) => {
      const next = Math.max(0, Math.min(4, (prev[type] ?? 0) + delta));
      return { ...prev, [type]: next };
    });
  }

  function initItems() {
    const spaces = expandSpaces(spaceCounts);
    const init: Record<string, ItemInput[]> = {};
    spaces.forEach(({ type, key }) => {
      init[key] = (DEFAULT_ITEMS[type] ?? []).map((i) => ({ ...i }));
    });
    setSpaceItems(init);
  }

  function toggleItem(key: string, item: { name: string; templateId: string; category: string }) {
    setSpaceItems((prev) => {
      const current = prev[key] ?? [];
      const exists = current.some((i) => i.name === item.name);
      return {
        ...prev,
        [key]: exists ? current.filter((i) => i.name !== item.name) : [...current, item],
      };
    });
  }

  function isItemSelected(key: string, name: string) {
    return (spaceItems[key] ?? []).some((i) => i.name === name);
  }

  function addCustomItem(key: string) {
    const name = (customInputs[key] ?? "").trim();
    if (!name) return;
    if (isItemSelected(key, name)) {
      setCustomInputs((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    setSpaceItems((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), { name, templateId: null, category: "APPLIANCE" }],
    }));
    setCustomInputs((prev) => ({ ...prev, [key]: "" }));
  }

  const totalSpaces = Object.values(spaceCounts).reduce((a, b) => a + b, 0);

  async function handleFinish() {
    if (!homeName.trim()) { setError("집 이름을 입력해주세요."); return; }
    setLoading(true); setError("");
    try {
      const homeRes = await fetch("/api/homes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: homeName, type: homeType, address: homeAddress }),
      });
      const homeData = await homeRes.json();
      if (!homeRes.ok) { setError(homeData.error ?? "오류가 발생했습니다."); setLoading(false); return; }

      const spaces = expandSpaces(spaceCounts);
      for (let i = 0; i < spaces.length; i++) {
        const s = spaces[i];
        const spaceRes = await fetch(`/api/homes/${homeData.id}/spaces`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: s.name, type: s.type, order: i }),
        });
        const spaceData = await spaceRes.json();

        for (const item of (spaceItems[s.key] ?? [])) {
          await fetch(`/api/spaces/${spaceData.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: item.name, category: item.category, templateId: item.templateId }),
          });
        }
      }

      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch {
      setError("오류가 발생했습니다. 다시 시도해주세요.");
    }
    setLoading(false);
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900">설정 완료!</h2>
          <p className="text-gray-500 mt-2">오늘의 할 일을 확인해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-2 mb-8">
          {(["home", "spaces", "items"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s ? "bg-green-500 text-white" :
                  (step === "items" && i < 2) || (step === "spaces" && i < 1)
                    ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                {i + 1}
              </div>
              {i < 2 && <div className="h-0.5 w-8 bg-gray-100" />}
            </div>
          ))}
          <span className="ml-2 text-xs text-gray-400">
            {step === "home" ? "집 정보" : step === "spaces" ? "공간 선택" : "가전/가구"}
          </span>
        </div>

        {/* Step 1: 집 등록 */}
        {step === "home" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">내 집을 등록해요</h2>
            <p className="text-gray-500 text-sm mb-6">집 이름과 유형을 알려주세요</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">집 이름</label>
                <input type="text" placeholder="우리집, 본가, 자취방..."
                  value={homeName} onChange={(e) => setHomeName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">집 유형</label>
                <div className="grid grid-cols-3 gap-2">
                  {HOME_TYPES.map((t) => (
                    <button key={t.value} onClick={() => setHomeType(t.value)}
                      className={`py-2 px-3 rounded-lg text-sm border transition-colors
                        ${homeType === t.value ? "border-green-500 bg-green-50 text-green-700 font-medium" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <input type="text" placeholder="서울시 강남구..."
                  value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <button onClick={() => { if (!homeName.trim()) { setError("집 이름을 입력해주세요."); return; } setError(""); setStep("spaces"); }}
              className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
              다음 →
            </button>
          </div>
        )}

        {/* Step 2: 공간 수량 선택 */}
        {step === "spaces" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">어떤 공간이 있나요?</h2>
            <p className="text-gray-500 text-sm mb-6">공간별 개수를 설정해주세요</p>

            <div className="space-y-2">
              {SPACE_TYPES.map((s) => {
                const count = spaceCounts[s.value] ?? 0;
                return (
                  <div key={s.value}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors
                      ${count > 0 ? "border-green-200 bg-green-50" : "border-gray-100 bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{SPACE_ICONS[s.value]}</span>
                      <div>
                        <span className="text-sm font-medium text-gray-800">{s.label}</span>
                        {count > 1 && (
                          <span className="ml-2 text-xs text-green-600">
                            {Array.from({ length: count }, (_, i) => `${s.label}${i + 1}`).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCount(s.value, -1)}
                        disabled={count === 0}
                        className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-sm font-bold transition-colors">
                        −
                      </button>
                      <span className={`w-5 text-center text-sm font-semibold ${count > 0 ? "text-green-600" : "text-gray-300"}`}>
                        {count}
                      </span>
                      <button onClick={() => setCount(s.value, 1)}
                        disabled={count >= 4}
                        className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 text-sm font-bold transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep("home")}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50">
                ← 이전
              </button>
              <button
                onClick={() => {
                  if (totalSpaces === 0) { setError("공간을 하나 이상 선택해주세요."); return; }
                  setError(""); initItems(); setStep("items");
                }}
                disabled={totalSpaces === 0}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                다음 → <span className="opacity-70 text-xs">({totalSpaces}개)</span>
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        )}

        {/* Step 3: 아이템 선택 */}
        {step === "items" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">가전·가구를 추가해요</h2>
            <p className="text-gray-500 text-sm mb-6">공간별로 있는 항목을 선택해주세요</p>

            <div className="space-y-5 max-h-96 overflow-y-auto pr-1">
              {expandSpaces(spaceCounts).map(({ type, key, name }) => {
                const defaults = DEFAULT_ITEMS[type] ?? [];
                const customItems = (spaceItems[key] ?? []).filter(
                  (ci) => !defaults.some((d) => d.name === ci.name)
                );
                return (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {SPACE_ICONS[type]} {name}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {defaults.map((item) => (
                        <button key={item.name} onClick={() => toggleItem(key, item)}
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors
                            ${isItemSelected(key, item.name)
                              ? "bg-green-500 text-white border-green-500"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                          {item.name}
                        </button>
                      ))}
                      {customItems.map((item) => (
                        <button key={item.name} onClick={() => toggleItem(key, item)}
                          className="px-3 py-1.5 rounded-full text-xs border bg-blue-500 text-white border-blue-500 transition-colors">
                          {item.name} ✕
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="직접 입력..."
                        value={customInputs[key] ?? ""}
                        onChange={(e) => setCustomInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && addCustomItem(key)}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button onClick={() => addCustomItem(key)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors">
                        추가
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep("spaces")}
                className="flex-1 border border-gray-200 text-gray-600 font-medium py-2.5 rounded-lg text-sm hover:bg-gray-50">
                ← 이전
              </button>
              <button onClick={handleFinish} disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2.5 rounded-lg text-sm transition-colors">
                {loading ? "생성 중..." : "완료 🎉"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
