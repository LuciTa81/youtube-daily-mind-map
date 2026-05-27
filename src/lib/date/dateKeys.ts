import { addDays, addSeconds, format, isValid, parse, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import type { DateRange } from "@/types/mindmap";
import type { DateSettings, WatchItem } from "@/types/watch";

const FALLBACK_TIMEZONE = "Asia/Seoul";

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
