import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";
import { getTimeBlockForItem } from "@/lib/date/timeBlocks";

export type DaySummary = {
  totalCount: number;
  topCategory?: { name: string; count: number; percentage: number };
  topChannel?: { name: string; count: number };
  topTimeBlock?: { name: string; count: number };
  categoryCounts: Array<{ category: string; count: number; percentage: number }>;
  channelCounts: Array<{ channelName: string; count: number }>;
  timeBlockCounts: Array<{ timeBlock: string; count: number }>;
};

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedCounts(map: Map<string, number>): Array<[string, number]> {
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function percentage(count: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 100);
}

export function summarizeDay(
  items: ClassifiedWatchItem[],
  settings?: DateSettings
): DaySummary {
  const categoryMap = new Map<string, number>();
  const channelMap = new Map<string, number>();
  const timeBlockMap = new Map<string, number>();

  for (const item of items) {
    increment(categoryMap, item.category);
    increment(channelMap, item.channelName ?? "채널 없음");
    increment(timeBlockMap, getTimeBlockForItem(item, settings).name);
  }

  const totalCount = items.length;
  const categoryCounts = sortedCounts(categoryMap).map(([category, count]) => ({
    category,
    count,
    percentage: percentage(count, totalCount)
  }));
  const channelCounts = sortedCounts(channelMap).map(([channelName, count]) => ({
    channelName,
    count
  }));
  const timeBlockCounts = sortedCounts(timeBlockMap).map(([timeBlock, count]) => ({
    timeBlock,
    count
  }));

  return {
    totalCount,
    topCategory: categoryCounts[0]
      ? {
          name: categoryCounts[0].category,
          count: categoryCounts[0].count,
          percentage: categoryCounts[0].percentage
        }
      : undefined,
    topChannel: channelCounts[0]
      ? { name: channelCounts[0].channelName, count: channelCounts[0].count }
      : undefined,
    topTimeBlock: timeBlockCounts[0]
      ? { name: timeBlockCounts[0].timeBlock, count: timeBlockCounts[0].count }
      : undefined,
    categoryCounts,
    channelCounts,
    timeBlockCounts
  };
}
