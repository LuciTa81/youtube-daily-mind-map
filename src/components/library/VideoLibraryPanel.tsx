"use client";

import { useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  filterVideoLibraryItems,
  getVideoLibraryFilterCount,
  getVideoLibraryFilterLabel,
  VIDEO_LIBRARY_FILTERS,
  type VideoLibraryFilterKey
} from "@/lib/library/videoLibrary";
import { getVideoMemorySummary } from "@/lib/share/videoMemory";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

type VideoLibraryPanelProps = {
  items: ClassifiedWatchItem[];
  dateSettings: DateSettings;
  onItemSelect: (item: ClassifiedWatchItem) => void;
  onOpenSettings: () => void;
};

function formatSavedDate(item: ClassifiedWatchItem, timezone: string): string {
  const timestamp = item.memoryUpdatedAt ?? item.watchedAt;
  return formatInTimeZone(new Date(timestamp), timezone, "yyyy.MM.dd HH:mm");
}
function LibraryVideoCard({
  item,
  dateSettings,
  onSelect
}: {
  item: ClassifiedWatchItem;
  dateSettings: DateSettings;
  onSelect: () => void;
}) {
  const metadata = getVideoMetadata(item);
  const memorySummary = getVideoMemorySummary(item) ?? getVideoLibraryFilterLabel("saved");

  return (
    <button
      type="button"
      className="flex w-full gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300"
      onClick={onSelect}
    >
      {metadata.thumbnailUrl ? (
        <img
          src={metadata.thumbnailUrl}
          alt=""
          className="h-16 w-24 shrink-0 rounded-md object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-400">
          썸네일 없음
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] font-bold text-sky-700">
          <span className="rounded-full bg-sky-50 px-2 py-1">{memorySummary}</span>
          <span className="truncate text-slate-500">{formatSavedDate(item, dateSettings.timezone)}</span>
        </div>
        <div className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-slate-950">{item.title}</div>
        <div className="mt-2 truncate text-xs text-slate-500">
          {item.channelName ?? "채널 없음"} · {item.category}
        </div>
        {item.memoryNote ? (
          <div className="mt-2 line-clamp-1 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-600">
            {item.memoryNote}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function LibraryEmptyState({
  filterKey,
  hasAnyLibraryItem,
  onOpenSettings
}: {
  filterKey: VideoLibraryFilterKey;
  hasAnyLibraryItem: boolean;
  onOpenSettings: () => void;
}) {
  const title = hasAnyLibraryItem
    ? `${getVideoLibraryFilterLabel(filterKey)}에 해당하는 영상이 없습니다.`
    : "아직 저장한 YouTube 영상이 없습니다.";
  const description = hasAnyLibraryItem
    ? "다른 필터를 선택하거나 타임라인에서 영상을 저장해보세요."
    : "YouTube 공유 버튼에서 이 앱을 선택하면 오늘의 기억으로 저장됩니다. 앱이 보이지 않으면 공유 시트의 더보기를 열어주세요.";

  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-5 text-center">
      <div className="text-sm font-black text-slate-950">{title}</div>
      <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
      <button
        type="button"
        className="mt-4 min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white"
        onClick={onOpenSettings}
      >
        공유 저장 방법 보기
      </button>
    </div>
  );
}

export function VideoLibraryPanel({
  items,
  dateSettings,
  onItemSelect,
  onOpenSettings
}: VideoLibraryPanelProps) {
  const [filterKey, setFilterKey] = useState<VideoLibraryFilterKey>("all");
  const libraryItems = useMemo(() => filterVideoLibraryItems(items, "all"), [items]);
  const filteredItems = useMemo(() => filterVideoLibraryItems(items, filterKey), [filterKey, items]);
  const hasAnyLibraryItem = libraryItems.length > 0;

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-bold text-sky-600">저장함</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              내가 남긴 YouTube 영상
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              공유로 직접 저장했거나, 타임라인에서 태그와 메모를 남긴 영상만 모아봅니다.
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
            {libraryItems.length}개
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {VIDEO_LIBRARY_FILTERS.map((filter) => {
            const selected = filter.key === filterKey;
            const count = getVideoLibraryFilterCount(items, filter.key);

            return (
              <button
                key={filter.key}
                type="button"
                className={`min-h-11 shrink-0 rounded-full border px-3 text-xs font-bold transition ${
                  selected
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
                onClick={() => setFilterKey(filter.key)}
                title={filter.description}
              >
                {filter.label} · {count}개
              </button>
            );
          })}
        </div>
      </div>

      {filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <LibraryVideoCard
              key={item.id}
              item={item}
              dateSettings={dateSettings}
              onSelect={() => onItemSelect(item)}
            />
          ))}
        </div>
      ) : (
        <LibraryEmptyState
          filterKey={filterKey}
          hasAnyLibraryItem={hasAnyLibraryItem}
          onOpenSettings={onOpenSettings}
        />
      )}
    </section>
  );
}
