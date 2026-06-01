import type { WatchItem } from "@/types/watch";
import { getWatchRecordKey } from "@/lib/history/watchRecordKey";

export type WatchHistoryMergeResult = {
  items: WatchItem[];
  addedItems: WatchItem[];
  duplicateItems: WatchItem[];
  existingCount: number;
  incomingCount: number;
  addedCount: number;
  duplicateCount: number;
  cleanedExistingDuplicateCount: number;
};

function sortByNewestFirst(items: WatchItem[]): WatchItem[] {
  return [...items].sort((a, b) => {
    const bTime = new Date(b.watchedAt).getTime();
    const aTime = new Date(a.watchedAt).getTime();
    const safeBTime = Number.isFinite(bTime) ? bTime : 0;
    const safeATime = Number.isFinite(aTime) ? aTime : 0;
    return safeBTime - safeATime || a.id.localeCompare(b.id);
  });
}

export function mergeWatchItems(existingItems: WatchItem[], incomingItems: WatchItem[]): WatchHistoryMergeResult {
  const seenKeys = new Set<string>();
  const mergedItems: WatchItem[] = [];
  const addedItems: WatchItem[] = [];
  const duplicateItems: WatchItem[] = [];
  let cleanedExistingDuplicateCount = 0;

  for (const item of existingItems) {
    const recordKey = getWatchRecordKey(item);
    if (seenKeys.has(recordKey)) {
      cleanedExistingDuplicateCount += 1;
      continue;
    }

    seenKeys.add(recordKey);
    mergedItems.push(item);
  }

  for (const item of incomingItems) {
    const recordKey = getWatchRecordKey(item);
    if (seenKeys.has(recordKey)) {
      duplicateItems.push(item);
      continue;
    }

    seenKeys.add(recordKey);
    mergedItems.push(item);
    addedItems.push(item);
  }

  return {
    items: sortByNewestFirst(mergedItems),
    addedItems: sortByNewestFirst(addedItems),
    duplicateItems,
    existingCount: existingItems.length,
    incomingCount: incomingItems.length,
    addedCount: addedItems.length,
    duplicateCount: duplicateItems.length,
    cleanedExistingDuplicateCount
  };
}
