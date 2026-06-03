"use client";

import { formatInTimeZone } from "date-fns-tz";
import { getTimeBlockForItem, TIME_BLOCKS, type TimeBlock } from "@/lib/date/timeBlocks";
import { getVideoMemorySummary } from "@/lib/share/videoMemory";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { ClassifiedWatchItem, DateRangeMode, DateSettings } from "@/types/watch";

type WatchTimelineProps = {
  items: ClassifiedWatchItem[];
  dateKey: string;
  rangeMode?: DateRangeMode;
  rangeLabel?: string;
  dateSettings: DateSettings;
  selectedItemId?: string;
  onItemSelect: (item: ClassifiedWatchItem) => void;
};

function formatDateTime(item: ClassifiedWatchItem, timezone: string): string {
  return formatInTimeZone(new Date(item.watchedAt), timezone, "yyyy-MM-dd HH:mm");
}

function formatTime(item: ClassifiedWatchItem, timezone: string): string {
  return formatInTimeZone(new Date(item.watchedAt), timezone, "HH:mm");
}

function formatDay(item: ClassifiedWatchItem, timezone: string): string {
  return formatInTimeZone(new Date(item.watchedAt), timezone, "MM.dd");
}

type TimelineGroup = {
  block: TimeBlock;
  items: ClassifiedWatchItem[];
  topCategory?: string;
};

function getTopCategory(items: ClassifiedWatchItem[]): string | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
}

function groupItemsByTimeBlock(
  sortedItems: ClassifiedWatchItem[],
  dateSettings: DateSettings
): TimelineGroup[] {
  return TIME_BLOCKS.map((block) => {
    const blockItems = sortedItems.filter((item) => getTimeBlockForItem(item, dateSettings).id === block.id);
    return {
      block,
      items: blockItems,
      topCategory: getTopCategory(blockItems)
    };
  }).filter((group) => group.items.length > 0);
}

function getTimelineRangeCopy(rangeMode: DateRangeMode): string {
  if (rangeMode === "week") {
    return "선택한 날짜까지 최근 7일의 기록을 시간순으로 이어봅니다.";
  }

  return "선택한 날짜 하루의 기록을 시간순으로 이어봅니다.";
}

function TimelineSummary({ groups }: { groups: TimelineGroup[] }) {
  return (
    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
      {groups.map((group) => (
        <div
          key={group.block.id}
          className="min-w-32 flex-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-900">{group.block.name}</span>
            <span className="text-xs font-bold text-slate-700">{group.items.length}개</span>
          </div>
          <div className="mt-1 text-[11px] leading-relaxed text-slate-500">{group.block.rangeLabel}</div>
          <div className="mt-1 truncate text-[11px] font-semibold text-slate-600">
            {group.topCategory ?? "카테고리 없음"}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineCard({
  item,
  dateSettings,
  selected,
  compact,
  onSelect
}: {
  item: ClassifiedWatchItem;
  dateSettings: DateSettings;
  selected: boolean;
  compact?: boolean;
  onSelect: () => void;
}) {
  const metadata = getVideoMetadata(item);
  const timeBlock = getTimeBlockForItem(item, dateSettings);
  const memorySummary = getVideoMemorySummary(item);

  return (
    <button
      type="button"
      className={`w-full rounded-lg border bg-white p-3 text-left shadow-sm transition hover:border-slate-400 hover:shadow-soft ${
        selected ? "border-slate-900 ring-4 ring-slate-200" : "border-slate-200"
      }`}
      onClick={onSelect}
    >
      <div className="flex gap-3">
        {metadata.thumbnailUrl ? (
          <img
            src={metadata.thumbnailUrl}
            alt=""
            className={`${compact ? "h-16 w-24" : "h-20 w-28"} shrink-0 rounded-md object-cover`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className={`${compact ? "h-16 w-24" : "h-20 w-28"} flex shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-400`}
          >
            썸네일 없음
          </div>
        )}
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500">
            {formatTime(item, dateSettings.timezone)} · {timeBlock.name}
          </div>
          <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
            {item.title}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {item.channelName ?? "채널 없음"} · {item.category}
          </div>
          {memorySummary ? (
            <div className="mt-2 line-clamp-1 rounded-full bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700">
              {memorySummary}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

export function WatchTimeline({
  items,
  dateKey,
  rangeMode = "day",
  rangeLabel,
  dateSettings,
  selectedItemId,
  onItemSelect
}: WatchTimelineProps) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime()
  );
  const timelineGroups = groupItemsByTimeBlock(sortedItems, dateSettings);
  const itemOrderMap = new Map(sortedItems.map((item, index) => [item.id, index + 1]));
  const minWidth = Math.max(920, sortedItems.length * 252);
  const timelineRangeCopy = getTimelineRangeCopy(rangeMode);
  const rangeBadgeLabel = rangeMode === "week" ? "최근 7일치" : "하루치";

  if (sortedItems.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center">
        <div>
          <div className="text-base font-semibold text-slate-900">타임라인에 표시할 기록이 없습니다.</div>
          <div className="mt-2 text-sm text-slate-500">{rangeLabel ?? timelineRangeCopy}</div>
          <div className="mt-1 text-xs text-slate-400">날짜나 필터 조건을 바꿔보세요.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="shrink-0 border-b border-slate-200 px-4 py-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{dateKey} 시청 타임라인</div>
            <div className="mt-1 text-xs text-slate-500">{rangeLabel ?? timelineRangeCopy}</div>
            <div className="mt-1 text-xs text-slate-500">시청 기록 {sortedItems.length}개를 시간순으로 표시합니다.</div>
          </div>
          <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
            {rangeBadgeLabel}
          </span>
        </div>
        <TimelineSummary groups={timelineGroups} />
      </div>

      <div className="hidden min-h-0 flex-1 overflow-x-auto md:block">
        <div className="relative h-full px-8 py-8" style={{ minWidth }}>
          <div className="absolute left-8 right-8 top-1/2 h-px bg-slate-300" />
          <div className="relative flex h-full items-stretch gap-7">
            {sortedItems.map((item, index) => {
              const isTop = index % 2 === 0;
              const selected = item.id === selectedItemId;

              return (
                <div key={item.id} className="grid w-56 shrink-0 grid-rows-[1fr_auto_1fr]">
                  <div className={`flex ${isTop ? "items-end pb-5" : "items-end justify-center pb-5"}`}>
                    {isTop ? (
                      <TimelineCard
                        item={item}
                        dateSettings={dateSettings}
                        selected={selected}
                        compact
                        onSelect={() => onItemSelect(item)}
                      />
                    ) : (
                      <div className="text-center">
                        <div className="text-xs font-semibold text-slate-500">{formatDay(item, dateSettings.timezone)}</div>
                        <div className="text-lg font-bold text-slate-900">{formatTime(item, dateSettings.timezone)}</div>
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center justify-center">
                    <div className="absolute h-10 w-px bg-slate-300" />
                    <button
                      type="button"
                      className={`touch-number relative z-10 flex h-11 w-11 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                      }`}
                      onClick={() => onItemSelect(item)}
                      title={formatDateTime(item, dateSettings.timezone)}
                    >
                      {index + 1}
                    </button>
                  </div>

                  <div className={`flex ${isTop ? "items-start justify-center pt-5" : "items-start pt-5"}`}>
                    {isTop ? (
                      <div className="text-center">
                        <div className="text-lg font-bold text-slate-900">{formatTime(item, dateSettings.timezone)}</div>
                        <div className="text-xs font-semibold text-slate-500">{formatDay(item, dateSettings.timezone)}</div>
                      </div>
                    ) : (
                      <TimelineCard
                        item={item}
                        dateSettings={dateSettings}
                        selected={selected}
                        compact
                        onSelect={() => onItemSelect(item)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 md:hidden">
        <div className="space-y-5">
          {timelineGroups.map((group) => (
            <section key={group.block.id} className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {group.block.name} · {group.items.length}개
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{group.block.rangeLabel}</div>
                  </div>
                  <div className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {group.topCategory ?? "분류 없음"}
                  </div>
                </div>
              </div>
              <div className="relative space-y-4 pl-12">
                <div className="absolute bottom-0 left-[21px] top-0 w-px bg-slate-300" />
                {group.items.map((item) => {
                  const globalIndex = itemOrderMap.get(item.id) ?? 0;
                  return (
                    <div key={item.id} className="relative">
                      <button
                        type="button"
                        className={`touch-number absolute -left-12 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border text-[11px] font-bold ${
                          item.id === selectedItemId
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700"
                        }`}
                        onClick={() => onItemSelect(item)}
                        title={formatDateTime(item, dateSettings.timezone)}
                      >
                        {globalIndex}
                      </button>
                      <TimelineCard
                        item={item}
                        dateSettings={dateSettings}
                        selected={item.id === selectedItemId}
                        onSelect={() => onItemSelect(item)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
