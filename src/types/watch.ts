export type WatchItem = {
  id: string;
  title: string;
  url?: string;
  channelName?: string;
  channelUrl?: string;
  watchedAt: string;
  rawDateText?: string;
  source: "takeout-html" | "takeout-json" | "manual" | "sample";
};

export type ClassifiedWatchItem = WatchItem & {
  category: string;
  subcategory?: string;
  confidence: number;
  reason?: string;
};

export type DateBoundaryMode = "calendar-day" | "lifestyle-day";

export type DateSettings = {
  timezone: string;
  boundaryMode: DateBoundaryMode;
  lifestyleBoundaryHour: number;
};
