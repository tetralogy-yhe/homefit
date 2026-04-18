export const CYCLE_UNIT_DAYS: Record<string, number> = {
  DAILY: 1,
  WEEKLY: 7,
  MONTHLY: 30,
  QUARTERLY: 90,
  BIANNUALLY: 180,
  YEARLY: 365,
};

export const CYCLE_ORDER = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "BIANNUALLY", "YEARLY"];

export const HOME_TYPES = [
  { value: "STUDIO", label: "원룸" },
  { value: "APARTMENT", label: "아파트" },
  { value: "VILLA", label: "빌라" },
  { value: "HOUSE", label: "단독주택" },
  { value: "OFFICETEL", label: "오피스텔" },
];

export const SPACE_TYPES = [
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

// 방이 아닌 특수 섹션 타입
export const SPECIAL_SPACE_TYPES = [
  { value: "HOME_ROUTINE", label: "집 전체 루틴", icon: "📋" },
  { value: "PET", label: "반려동물", icon: "🐾" },
  { value: "PLANT", label: "식물", icon: "🪴" },
];

export const ALL_SPACE_TYPES = [...SPACE_TYPES, ...SPECIAL_SPACE_TYPES];

export const SPACE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ALL_SPACE_TYPES.map((s) => [s.value, s.label])
);

export const SPACE_TYPE_ICONS: Record<string, string> = Object.fromEntries(
  ALL_SPACE_TYPES.map((s) => [s.value, s.icon])
);

export const HOME_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  HOME_TYPES.map((h) => [h.value, h.label])
);

export const ITEM_CATEGORIES = [
  { value: "APPLIANCE", label: "가전" },
  { value: "FURNITURE", label: "가구" },
  { value: "FIXTURE", label: "설비" },
  { value: "PET", label: "반려동물" },
  { value: "PLANT", label: "식물" },
];

export const TASK_CATEGORIES = [
  { value: "CLEANING", label: "청소", icon: "🧹" },
  { value: "MAINTENANCE", label: "유지보수", icon: "🔧" },
  { value: "REPLACEMENT", label: "교체", icon: "🔄" },
  { value: "DAILY_CHORE", label: "일상 가사", icon: "🏠" },
  { value: "LAUNDRY", label: "빨래", icon: "👕" },
  { value: "PET_CARE", label: "펫케어", icon: "🐾" },
  { value: "PLANT_CARE", label: "식물 관리", icon: "🪴" },
];

export const TASK_CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  TASK_CATEGORIES.map((c) => [c.value, c.icon])
);

export const TASK_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  TASK_CATEGORIES.map((c) => [c.value, c.label])
);
