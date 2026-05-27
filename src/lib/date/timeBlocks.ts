import { formatInTimeZone } from "date-fns-tz";
import type { DateSettings, WatchItem } from "@/types/watch";

export type TimeBlockId = "dawn" | "morning" | "afternoon" | "evening";

export type TimeBlock = {
  id: TimeBlockId;
  name: string;
  rangeLabel: string;
  startHour: number;
  endHour: number;
};

export const TIME_BLOCKS: TimeBlock[] = [
  { id: "dawn", name: "새벽", rangeLabel: "00:00~06:00", startHour: 0, endHour: 6 },
  { id: "morning", name: "오전", rangeLabel: "06:00~12:00", startHour: 6, endHour: 12 },
  { id: "afternoon", name: "오후", rangeLabel: "12:00~18:00", startHour: 12, endHour: 18 },
  { id: "evening", name: "저녁/밤", rangeLabel: "18:00~24:00", startHour: 18, endHour: 24 }
];

function getTimezone(settingsOrTimezone?: DateSettings | string): string {
  if (!settingsOrTimezone) {
    return "Asia/Seoul";
  }

  return typeof settingsOrTimezone === "string" ? settingsOrTimezone : settingsOrTimezone.timezone;
}

export function getTimeBlockForItem(
  item: WatchItem,
  settingsOrTimezone?: DateSettings | string
): TimeBlock {
  const timezone = getTimezone(settingsOrTimezone);
  const watchedAt = new Date(item.watchedAt);
  const hour = Number(formatInTimeZone(watchedAt, timezone, "H"));

  if (hour < 6) {
    return TIME_BLOCKS[0];
  }
  if (hour < 12) {
    return TIME_BLOCKS[1];
  }
  if (hour < 18) {
    return TIME_BLOCKS[2];
  }
  return TIME_BLOCKS[3];
}
