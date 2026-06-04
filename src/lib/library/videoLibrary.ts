import type { ClassifiedWatchItem, VideoMemoryTag, WatchItem } from "@/types/watch";

export type VideoLibraryFilterKey = "all" | VideoMemoryTag;

export type VideoLibraryFilterOption = {
  key: VideoLibraryFilterKey;
  label: string;
  description: string;
};

export type VideoLibraryRemoveStatus =
  | "memory-cleared"
  | "record-deleted"
  | "not-found"
  | "unsupported-source";

export type VideoLibraryRemoveResult<TItem extends WatchItem = WatchItem> = {
  status: VideoLibraryRemoveStatus;
  items: TItem[];
  updatedItem?: TItem;
  removedItem?: TItem;
};

export const VIDEO_LIBRARY_FILTERS: VideoLibraryFilterOption[] = [
  {
    key: "all",
    label: "전체",
    description: "저장한 모든 YouTube 영상"
  },
  {
    key: "remember",
    label: "기억할 영상",
    description: "하루 회고에서 다시 떠올릴 영상"
  },
  {
    key: "review",
    label: "나중에 복습",
    description: "다시 보거나 정리할 영상"
  },
  {
    key: "saved",
    label: "그냥 저장",
    description: "가볍게 보관한 영상"
  }
];

function getMemorySortTime(item: Pick<WatchItem, "memoryUpdatedAt" | "watchedAt">): number {
  const updatedTime = item.memoryUpdatedAt ? new Date(item.memoryUpdatedAt).getTime() : Number.NaN;
  if (Number.isFinite(updatedTime)) {
    return updatedTime;
  }

  const watchedTime = new Date(item.watchedAt).getTime();
  return Number.isFinite(watchedTime) ? watchedTime : 0;
}

function isTakeoutRecord(item: Pick<WatchItem, "source">): boolean {
  return item.source === "takeout-html" || item.source === "takeout-json";
}

function clearMemoryMetadata<TItem extends WatchItem>(item: TItem): TItem {
  const record = { ...item };
  delete record.memoryTag;
  delete record.memoryNote;
  delete record.memoryUpdatedAt;
  return record as TItem;
}

export function isVideoLibraryItem(
  item: Pick<WatchItem, "source" | "memoryTag" | "memoryNote">
): boolean {
  return item.source === "manual" || Boolean(item.memoryTag) || Boolean(item.memoryNote?.trim());
}

export function getVideoLibraryFilterLabel(filterKey: VideoLibraryFilterKey): string {
  return VIDEO_LIBRARY_FILTERS.find((filter) => filter.key === filterKey)?.label ?? "전체";
}

export function getVideoLibraryFilterCount(
  items: ClassifiedWatchItem[],
  filterKey: VideoLibraryFilterKey
): number {
  return filterVideoLibraryItems(items, filterKey).length;
}

export function filterVideoLibraryItems(
  items: ClassifiedWatchItem[],
  filterKey: VideoLibraryFilterKey
): ClassifiedWatchItem[] {
  return items
    .filter(isVideoLibraryItem)
    .filter((item) => {
      if (filterKey === "all") {
        return true;
      }

      if (filterKey === "saved") {
        return item.memoryTag === "saved" || (item.source === "manual" && !item.memoryTag);
      }

      return item.memoryTag === filterKey;
    })
    .sort((a, b) => getMemorySortTime(b) - getMemorySortTime(a) || a.id.localeCompare(b.id));
}

export function removeVideoLibraryMemory<TItem extends WatchItem>(
  items: readonly TItem[],
  itemId: string
): VideoLibraryRemoveResult<TItem> {
  const targetIndex = items.findIndex((item) => item.id === itemId);
  if (targetIndex === -1) {
    return {
      status: "not-found",
      items: [...items]
    };
  }

  const target = items[targetIndex];

  if (target.source === "manual") {
    return {
      status: "record-deleted",
      items: items.filter((item) => item.id !== itemId),
      removedItem: target
    };
  }

  if (isTakeoutRecord(target)) {
    const updatedItem = clearMemoryMetadata(target);
    return {
      status: "memory-cleared",
      items: items.map((item, index) => (index === targetIndex ? updatedItem : item)),
      updatedItem
    };
  }

  return {
    status: "unsupported-source",
    items: [...items]
  };
}
