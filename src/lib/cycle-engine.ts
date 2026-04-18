import { prisma } from "@/lib/prisma";
import { CYCLE_UNIT_DAYS, CYCLE_ORDER } from "@/lib/constants";

const SHORTEN_THRESHOLDS: Record<string, number> = {
  DAILY: -0.5,
  WEEKLY: -2,
  MONTHLY: -7,
  QUARTERLY: -14,
  BIANNUALLY: -21,
  YEARLY: -30,
};

const LENGTHEN_THRESHOLDS: Record<string, number> = {
  DAILY: 1.5,
  WEEKLY: 4,
  MONTHLY: 10,
  QUARTERLY: 21,
  BIANNUALLY: 30,
  YEARLY: 45,
};

export type CycleSuggestion = {
  direction: "shorten" | "lengthen";
  suggestedCycleUnit: string;
  suggestedCycleEvery: number;
  avgDaysEarlyOrLate: number;
  message: string;
};

export async function checkCycleSuggestion(taskId: string): Promise<CycleSuggestion | null> {
  const logs = await prisma.completionLog.findMany({
    where: { taskId },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  if (logs.length < 3) return null;

  const window = logs.slice(0, Math.min(10, logs.length));
  const avg = window.reduce((sum, l) => sum + l.daysEarlyOrLate, 0) / window.length;
  const cycleUnit = logs[0].cycleUnitAtTime;
  const cycleEvery = logs[0].cycleEveryAtTime;
  const shortenThreshold = SHORTEN_THRESHOLDS[cycleUnit] ?? -7;
  const lengthenThreshold = LENGTHEN_THRESHOLDS[cycleUnit] ?? 10;

  if (avg < shortenThreshold) {
    const idx = CYCLE_ORDER.indexOf(cycleUnit);
    if (idx > 0) {
      const suggested = CYCLE_ORDER[idx - 1];
      return {
        direction: "shorten",
        suggestedCycleUnit: suggested,
        suggestedCycleEvery: 1,
        avgDaysEarlyOrLate: Math.round(avg),
        message: `최근 평균 ${Math.abs(Math.round(avg))}일 일찍 완료하고 있어요. ${suggested === "WEEKLY" ? "매주" : suggested === "MONTHLY" ? "매달" : suggested} 주기로 줄여보는 건 어떨까요?`,
      };
    }
    if (cycleEvery > 1) {
      return {
        direction: "shorten",
        suggestedCycleUnit: cycleUnit,
        suggestedCycleEvery: cycleEvery - 1,
        avgDaysEarlyOrLate: Math.round(avg),
        message: `최근 평균 ${Math.abs(Math.round(avg))}일 일찍 완료하고 있어요. 주기를 조금 줄여보는 건 어떨까요?`,
      };
    }
  }

  if (avg > lengthenThreshold) {
    const idx = CYCLE_ORDER.indexOf(cycleUnit);
    if (idx < CYCLE_ORDER.length - 1) {
      const suggested = CYCLE_ORDER[idx + 1];
      return {
        direction: "lengthen",
        suggestedCycleUnit: suggested,
        suggestedCycleEvery: 1,
        avgDaysEarlyOrLate: Math.round(avg),
        message: `최근 평균 ${Math.round(avg)}일 늦게 완료하고 있어요. ${suggested === "MONTHLY" ? "매달" : suggested === "QUARTERLY" ? "분기별" : suggested} 주기로 늘려보는 건 어떨까요?`,
      };
    }
  }

  return null;
}

export function calcNextDueDate(completedAt: Date, cycleUnit: string, cycleEvery: number): Date {
  const days = (CYCLE_UNIT_DAYS[cycleUnit] ?? 7) * cycleEvery;
  const next = new Date(completedAt);
  next.setDate(next.getDate() + days);
  return next;
}
