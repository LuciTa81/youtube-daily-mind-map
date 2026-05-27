import { addDays, addSeconds, format, isValid, parse, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import type { DateRange } from "@/types/mindmap";
import type { DateRangeMode, DateSettings, WatchItem } from "@/types/watch";

const FALLBACK_TIMEZONE = "Asia/Seoul";
const QUICK_DATE_OFFSETS = [
  { id: "today", label: "오늘", offsetDays: 0 },
  { id: "yesterday", label: "하루 전", offsetDays: 1 },
  { id: "two-days-ago", label: "이틀 전", offsetDays: 2 }
] as const;

export type QuickDateOption = {
  id: (typeof QUICK_DATE_OFFSETS)[number]["id"];
  label: string;
  dateKey: string;
  count: number;
  description: string;
};

function getSafeTimezone(timezone: string): string {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return timezone;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

function getSafeBoundaryHour(hour: number): number {
  if (!Number.isFinite(hour)) {
    return 4;
  }

  return Math.min(23, Math.max(0, Math.floor(hour)));
}

export function getDateKeyForItem(item: WatchItem, settings: DateSettings): string {
  const timezone = getSafeTimezone(settings.timezone);
  const watchedAt = new Date(item.watchedAt);

  if (Number.isNaN(watchedAt.getTime())) {
    return "invalid-date";
  }

  if (settings.boundaryMode === "calendar-day") {
    return formatInTimeZone(watchedAt, timezone, "yyyy-MM-dd");
  }

  const boundaryHour = getSafeBoundaryHour(settings.lifestyleBoundaryHour);
  const hour = Number(formatInTimeZone(watchedAt, timezone, "H"));
  const zonedDate = toZonedTime(watchedAt, timezone);
  const adjustedDate = hour < boundaryHour ? subDays(zonedDate, 1) : zonedDate;

  return format(adjustedDate, "yyyy-MM-dd");
}

export function getRelativeDateKey(
  offsetDays: number,
  settings: DateSettings,
  now = new Date()
): string {
  const timezone = getSafeTimezone(settings.timezone);
  const zonedNow = toZonedTime(now, timezone);
  return format(subDays(zonedNow, Math.max(0, Math.floor(offsetDays))), "yyyy-MM-dd");
}

export function formatDateLabel(dateKey: string, count?: number): string {
  const parsed = parse(dateKey, "yyyy-MM-dd", new Date());
  if (!isValid(parsed)) {
    return typeof count === "number" ? `${dateKey} · ${count}개` : dateKey;
  }

  const base = format(parsed, "yyyy-MM-dd EEEE", { locale: ko });

  return typeof count === "number" ? `${base} · ${count}개` : base;
}

export function getAvailableDates(
  items: WatchItem[],
  settings: DateSettings
): Array<{ dateKey: string; count: number; label: string }> {
  const counts = new Map<string, number>();

  for (const item of items) {
    const dateKey = getDateKeyForItem(item, settings);
    if (dateKey === "invalid-date") {
      continue;
    }

    counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([dateKey, count]) => ({
      dateKey,
      count,
      label: formatDateLabel(dateKey, count)
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function filterItemsByDateKey(
  items: WatchItem[],
  dateKey: string,
  settings: DateSettings
): WatchItem[] {
  return items.filter((item) => getDateKeyForItem(item, settings) === dateKey);
}

export function filterItemsByDateRange(items: WatchItem[], range: DateRange): WatchItem[] {
  const startTime = range.start.getTime();
  const endTime = range.end.getTime();

  return items.filter((item) => {
    const watchedTime = new Date(item.watchedAt).getTime();
    return Number.isFinite(watchedTime) && watchedTime >= startTime && watchedTime <= endTime;
  });
}

function buildLocalDateTime(dateKey: string, hour: number, minute: number, second: number): Date {
  const localDate = parse(dateKey, "yyyy-MM-dd", new Date());
  localDate.setHours(hour, minute, second, 0);
  return localDate;
}

export function getDateRangeForDateKey(dateKey: string, settings: DateSettings): DateRange {
  const timezone = getSafeTimezone(settings.timezone);
  const boundaryHour = getSafeBoundaryHour(settings.lifestyleBoundaryHour);
  const startLocal =
    settings.boundaryMode === "calendar-day"
      ? buildLocalDateTime(dateKey, 0, 0, 0)
      : buildLocalDateTime(dateKey, boundaryHour, 0, 0);
  const endLocal =
    settings.boundaryMode === "calendar-day"
      ? buildLocalDateTime(dateKey, 23, 59, 59)
      : addSeconds(addDays(startLocal, 1), -1);

  const start = fromZonedTime(startLocal, timezone);
  const end = fromZonedTime(endLocal, timezone);
  const startLabel = formatInTimeZone(start, timezone, "yyyy-MM-dd HH:mm");
  const endLabel = formatInTimeZone(end, timezone, "yyyy-MM-dd HH:mm");

  return {
    start,
    end,
    label: `${startLabel} ~ ${endLabel}`,
    startLabel,
    endLabel
  };
}

function getCalendarDayRangeForSelection(
  dateKey: string,
  settings: DateSettings,
  now: Date
): DateRange {
  const timezone = getSafeTimezone(settings.timezone);
  const startLocal = buildLocalDateTime(dateKey, 0, 0, 0);
  const fullEndLocal = buildLocalDateTime(dateKey, 23, 59, 59);
  const start = fromZonedTime(startLocal, timezone);
  const fullEnd = fromZonedTime(fullEndLocal, timezone);
  const todayKey = getRelativeDateKey(0, settings, now);
  const isTodayRange =
    dateKey === todayKey && now.getTime() >= start.getTime() && now.getTime() <= fullEnd.getTime();
  const end = isTodayRange ? now : fullEnd;
  const startLabel = formatInTimeZone(start, timezone, "yyyy-MM-dd HH:mm");
  const endLabel = formatInTimeZone(end, timezone, "yyyy-MM-dd HH:mm");

  return {
    start,
    end,
    label: `${startLabel} ~ ${endLabel}`,
    startLabel,
    endLabel
  };
}

export function getDateRangeForSelection(
  dateKey: string,
  settings: DateSettings,
  rangeMode: DateRangeMode,
  now = new Date()
): DateRange {
  if (rangeMode === "day") {
    return getCalendarDayRangeForSelection(dateKey, settings, now);
  }

  const timezone = getSafeTimezone(settings.timezone);
  const parsed = parse(dateKey, "yyyy-MM-dd", new Date());
  const startDateKey = isValid(parsed) ? format(subDays(parsed, 6), "yyyy-MM-dd") : dateKey;
  const startLocal = buildLocalDateTime(startDateKey, 0, 0, 0);
  const start = fromZonedTime(startLocal, timezone);
  const end = getCalendarDayRangeForSelection(dateKey, settings, now).end;
  const startLabel = formatInTimeZone(start, timezone, "yyyy-MM-dd HH:mm");
  const endLabel = formatInTimeZone(end, timezone, "yyyy-MM-dd HH:mm");

  return {
    start,
    end,
    label: `${startLabel} ~ ${endLabel}`,
    startLabel,
    endLabel
  };
}

export function getQuickDateOptions(
  items: WatchItem[],
  settings: DateSettings,
  now = new Date()
): QuickDateOption[] {
  return QUICK_DATE_OFFSETS.map((option) => {
    const dateKey = getRelativeDateKey(option.offsetDays, settings, now);
    const range = getDateRangeForSelection(dateKey, settings, "day", now);
    const count = filterItemsByDateRange(items, range).length;
    const description = option.id === "today" ? "00:00부터 현재까지" : "00:00부터 23:59까지";

    return {
      id: option.id,
      label: option.label,
      dateKey,
      count,
      description
    };
  });
}
