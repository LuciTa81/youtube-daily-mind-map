import type { DaySummary } from "@/lib/analytics/summarizeDay";
import { getTimeBlockForItem } from "@/lib/date/timeBlocks";
import { buildMarkedMemoryItems, buildMemorableItems, buildSharedMemoryItems } from "@/lib/review/memorableItems";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

export type ReviewTimeBlock = {
  name: string;
  count: number;
  topCategory?: string;
  items: ClassifiedWatchItem[];
};

export type DailyReview = {
  headline: string;
  insight: string;
  focusKeywords: string[];
  timeBlocks: ReviewTimeBlock[];
  sharedMemoryItems: ClassifiedWatchItem[];
  markedMemoryItems: ClassifiedWatchItem[];
  memorableItems: ClassifiedWatchItem[];
};

function byOldestFirst(a: ClassifiedWatchItem, b: ClassifiedWatchItem): number {
  return new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime();
}

function countBy<T>(items: T[], getKey: (item: T) => string): Map<string, number> {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = getKey(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function topKey(map: Map<string, number>): string | undefined {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

function buildHeadline(summary: DaySummary): string {
  if (summary.totalCount === 0) {
    return "아직 정리할 시청 기록이 없습니다.";
  }

  if (summary.topCategory && summary.topTimeBlock) {
    return `${summary.topTimeBlock.name}에 ${summary.topCategory.name} 쪽 기록이 가장 두드러졌습니다.`;
  }

  if (summary.topCategory) {
    return `${summary.topCategory.name} 기록이 가장 많았습니다.`;
  }

  return `${summary.totalCount}개의 시청 기록을 정리했습니다.`;
}

function buildInsight(summary: DaySummary): string {
  if (summary.totalCount === 0) {
    return "Takeout을 가져오면 오늘의 관심사 흐름을 회고 형태로 볼 수 있습니다.";
  }

  const topCategory = summary.topCategory?.name ?? "여러 주제";
  const topChannel = summary.topChannel?.name ?? "다양한 채널";
  const topTimeBlock = summary.topTimeBlock?.name ?? "여러 시간대";

  return `${topTimeBlock}에 ${topCategory} 기록이 많았고, ${topChannel} 채널이 눈에 띕니다.`;
}

function buildFocusKeywords(summary: DaySummary): string[] {
  const categories = summary.categoryCounts.slice(0, 3).map((item) => item.category);
  const channels = summary.channelCounts
    .filter((item) => item.channelName !== "채널 없음")
    .slice(0, 2)
    .map((item) => item.channelName);

  return [...categories, ...channels].slice(0, 5);
}

function buildTimeBlocks(items: ClassifiedWatchItem[], settings: DateSettings): ReviewTimeBlock[] {
  const grouped = new Map<string, ClassifiedWatchItem[]>();

  for (const item of items) {
    const block = getTimeBlockForItem(item, settings);
    const currentItems = grouped.get(block.name) ?? [];
    currentItems.push(item);
    grouped.set(block.name, currentItems);
  }

  return Array.from(grouped.entries())
    .map(([name, blockItems]) => ({
      name,
      count: blockItems.length,
      topCategory: topKey(countBy(blockItems, (item) => item.category)),
      items: [...blockItems].sort(byOldestFirst)
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildDailyReview(
  items: ClassifiedWatchItem[],
  summary: DaySummary,
  settings: DateSettings
): DailyReview {
  return {
    headline: buildHeadline(summary),
    insight: buildInsight(summary),
    focusKeywords: buildFocusKeywords(summary),
    timeBlocks: buildTimeBlocks(items, settings),
    sharedMemoryItems: buildSharedMemoryItems(items, 5),
    markedMemoryItems: buildMarkedMemoryItems(items, 5),
    memorableItems: buildMemorableItems(items, 5)
  };
}
