export type VideoMemoryTag = "remember" | "review" | "saved";

export type WatchItem = {
  id: string;
  title: string;
  url?: string;
  channelName?: string;
  channelUrl?: string;
  watchedAt: string;
  rawDateText?: string;
  source: "takeout-html" | "takeout-json" | "manual" | "sample";
  memoryTag?: VideoMemoryTag;
  memoryNote?: string;
  memoryUpdatedAt?: string;
};

export type WatchHistoryImportSummary = {
  sourceName: string;
  sourceLabel: string;
  matchedFileName?: string;
  readCount: number;
  addedCount: number;
  duplicateCount: number;
  savedCount: number;
  skippedCount: number;
  cleanedExistingDuplicateCount: number;
  persisted: boolean;
};

export type ClassifiedWatchItem = WatchItem & {
  category: string;
  subcategory?: string;
  confidence: number;
  reason?: string;
};

export type DateBoundaryMode = "calendar-day" | "lifestyle-day";

export type DateRangeMode = "day" | "week";

export type DateSettings = {
  timezone: string;
  boundaryMode: DateBoundaryMode;
  lifestyleBoundaryHour: number;
};
