"use client";

import { formatInTimeZone } from "date-fns-tz";
import { getTimeBlockForItem } from "@/lib/date/timeBlocks";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

type WatchTimelineProps = {
  items: ClassifiedWatchItem[];
  dateKey: string;
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
        </div>
      </div>
    </button>
  );
}

export function WatchTimeline({
  items,
  dateKey,
  dateSettings,
  selectedItemId,
  onItemSelect
}: WatchTimelineProps) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime()
  );
  const minWidth = Math.max(920, sortedItems.length * 252);

  if (sortedItems.length === 0) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-slate-200 bg-white p-6 text-center">
        <div>
          <div className="text-base font-semibold text-slate-900">타임라인에 표시할 기록이 없습니다.</div>
          <div className="mt-2 text-sm text-slate-500">날짜나 필터 조건을 바꿔보세요.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{dateKey} 시청 타임라인</div>
          <div className="mt-1 text-xs text-slate-500">시청 기록 {sortedItems.length}개를 시간순으로 표시합니다.</div>
        </div>
      </div>

      <div className="hidden h-[calc(100%-57px)] overflow-x-auto md:block">
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
                      className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold shadow-sm transition ${
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

      <div className="h-[calc(100%-57px)] overflow-y-auto p-4 md:hidden">
        <div className="relative space-y-4 pl-7">
          <div className="absolute bottom-0 left-[13px] top-0 w-px bg-slate-300" />
          {sortedItems.map((item, index) => (
            <div key={item.id} className="relative">
              <button
                type="button"
                className={`absolute -left-7 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold ${
                  item.id === selectedItemId
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => onItemSelect(item)}
                title={formatDateTime(item, dateSettings.timezone)}
              >
                {index + 1}
              </button>
              <TimelineCard
                item={item}
                dateSettings={dateSettings}
                selected={item.id === selectedItemId}
                onSelect={() => onItemSelect(item)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
