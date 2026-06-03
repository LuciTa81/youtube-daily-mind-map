import type { ClassifiedWatchItem } from "@/types/watch";

function getMemoryPriority(item: ClassifiedWatchItem): number {
  if (item.memoryTag === "remember") {
    return 2;
  }

  if (item.memoryTag === "review") {
    return 1;
  }

  return 0;
}

function isUserMarkedRecallItem(item: ClassifiedWatchItem): boolean {
  return item.memoryTag === "remember" || item.memoryTag === "review";
}

function isSharedMemoryItem(item: ClassifiedWatchItem): boolean {
  return item.source === "manual";
}

function byReviewPriority(a: ClassifiedWatchItem, b: ClassifiedWatchItem): number {
  const memoryPriorityDiff = getMemoryPriority(b) - getMemoryPriority(a);
  if (memoryPriorityDiff !== 0) {
    return memoryPriorityDiff;
  }

  const confidenceDiff = a.confidence - b.confidence;
  if (confidenceDiff !== 0) {
    return confidenceDiff;
  }

  return new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime();
}

export function buildMemorableItems(
  items: ClassifiedWatchItem[],
  limit: number
): ClassifiedWatchItem[] {
  return [...items].sort(byReviewPriority).slice(0, limit);
}

export function buildMarkedMemoryItems(
  items: ClassifiedWatchItem[],
  limit: number
): ClassifiedWatchItem[] {
  return items.filter(isUserMarkedRecallItem).sort(byReviewPriority).slice(0, limit);
}

export function buildSharedMemoryItems(
  items: ClassifiedWatchItem[],
  limit: number
): ClassifiedWatchItem[] {
  return items.filter(isSharedMemoryItem).sort(byReviewPriority).slice(0, limit);
}
