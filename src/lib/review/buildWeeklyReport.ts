import { addDays, format } from "date-fns";
import { ko } from "date-fns/locale";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { summarizeDay, type DaySummary } from "@/lib/analytics/summarizeDay";
import { buildMarkedMemoryItems, buildMemorableItems } from "@/lib/review/memorableItems";
import type { DateRange } from "@/types/mindmap";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

export type WeeklyDaySummary = {
  dateKey: string;
  label: string;
  count: number;
  topCategory?: string;
};

export type WeeklyCategoryTrend = {
  category: string;
  count: number;
  percentage: number;
  activeDays: number;
};

export type WeeklyReport = {
  headline: string;
  insight: string;
  summary: DaySummary;
  dailyCounts: WeeklyDaySummary[];
  categoryTrends: WeeklyCategoryTrend[];
  topChannels: Array<{ channelName: string; count: number }>;
  markedMemoryItems: ClassifiedWatchItem[];
  memorableItems: ClassifiedWatchItem[];
  mostActiveDay?: WeeklyDaySummary;
};

function getDateKey(item: ClassifiedWatchItem, settings: DateSettings): string {
  return formatInTimeZone(new Date(item.watchedAt), settings.timezone, "yyyy-MM-dd");
}

function buildDayKeys(range: DateRange, settings: DateSettings): WeeklyDaySummary[] {
  const startZoned = toZonedTime(range.start, settings.timezone);

  return Array.from({ length: 7 }, (_value, index) => {
    const localDate = addDays(startZoned, index);
    const dateKey = format(localDate, "yyyy-MM-dd");
    return {
      dateKey,
      label: format(localDate, "MM.dd EEE", { locale: ko }),
      count: 0
    };
  });
}

function topCategory(items: ClassifiedWatchItem[]): string | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

function buildDailyCounts(
  items: ClassifiedWatchItem[],
  settings: DateSettings,
  range: DateRange
): WeeklyDaySummary[] {
  const dayMap = new Map<string, ClassifiedWatchItem[]>();
  for (const item of items) {
    const dateKey = getDateKey(item, settings);
    const currentItems = dayMap.get(dateKey) ?? [];
    currentItems.push(item);
    dayMap.set(dateKey, currentItems);
  }

  return buildDayKeys(range, settings).map((day) => {
    const dayItems = dayMap.get(day.dateKey) ?? [];
    return {
      ...day,
      count: dayItems.length,
      topCategory: topCategory(dayItems)
    };
  });
}

function buildCategoryTrends(summary: DaySummary, dailyCountsByCategory: Map<string, Set<string>>): WeeklyCategoryTrend[] {
  return summary.categoryCounts.slice(0, 6).map((item) => ({
    category: item.category,
    count: item.count,
    percentage: item.percentage,
    activeDays: dailyCountsByCategory.get(item.category)?.size ?? 0
  }));
}

function buildDailyCountsByCategory(items: ClassifiedWatchItem[], settings: DateSettings): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  for (const item of items) {
    const dateKey = getDateKey(item, settings);
    const days = map.get(item.category) ?? new Set<string>();
    days.add(dateKey);
    map.set(item.category, days);
  }

  return map;
}

function buildHeadline(summary: DaySummary): string {
  if (summary.totalCount === 0) {
    return "이번 주 리포트를 만들 시청 기록이 없습니다.";
  }

  if (summary.topCategory) {
    return `이번 주에는 ${summary.topCategory.name} 기록이 가장 많이 쌓였습니다.`;
  }

  return `이번 주 시청 기록 ${summary.totalCount}개를 정리했습니다.`;
}

function buildInsight(summary: DaySummary, mostActiveDay?: WeeklyDaySummary): string {
  if (summary.totalCount === 0) {
    return "Takeout을 며칠치 쌓으면 관심사 변화와 자주 본 채널을 한눈에 볼 수 있습니다.";
  }

  const topCategory = summary.topCategory?.name ?? "여러 주제";
  const topChannel = summary.topChannel?.name ?? "여러 채널";
  const activeDayText = mostActiveDay ? `${mostActiveDay.label}에 ${mostActiveDay.count}개` : "여러 날에 걸쳐";

  return `${activeDayText} 기록이 있었고, ${topCategory}와 ${topChannel} 흐름이 눈에 띕니다.`;
}

export function buildWeeklyReport(
  items: ClassifiedWatchItem[],
  settings: DateSettings,
  range: DateRange
): WeeklyReport {
  const summary = summarizeDay(items, settings);
  const dailyCounts = buildDailyCounts(items, settings, range);
  const mostActiveDay = [...dailyCounts].sort((a, b) => b.count - a.count || b.dateKey.localeCompare(a.dateKey))[0];
  const dailyCountsByCategory = buildDailyCountsByCategory(items, settings);

  return {
    headline: buildHeadline(summary),
    insight: buildInsight(summary, mostActiveDay && mostActiveDay.count > 0 ? mostActiveDay : undefined),
    summary,
    dailyCounts,
    categoryTrends: buildCategoryTrends(summary, dailyCountsByCategory),
    topChannels: summary.channelCounts.slice(0, 5),
    markedMemoryItems: buildMarkedMemoryItems(items, 6),
    memorableItems: buildMemorableItems(items, 6),
    mostActiveDay: mostActiveDay && mostActiveDay.count > 0 ? mostActiveDay : undefined
  };
}
