"use client";

import { formatInTimeZone } from "date-fns-tz";
import { ImportSummaryCard } from "@/components/import/ImportSummaryCard";
import type { DaySummary } from "@/lib/analytics/summarizeDay";
import type { QuickDateOption } from "@/lib/date/dateKeys";
import type { DailyReview } from "@/lib/review/buildDailyReview";
import { getVideoMemorySummary } from "@/lib/share/videoMemory";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { ClassifiedWatchItem, DateRangeMode, DateSettings, WatchHistoryImportSummary } from "@/types/watch";

type HomeDashboardProps = {
  dateLabel: string;
  rangeLabel?: string;
  dates: QuickDateOption[];
  selectedDateKey: string;
  rangeMode: DateRangeMode;
  summary: DaySummary;
  review: DailyReview;
  dateSettings: DateSettings;
  latestImportSummary?: WatchHistoryImportSummary;
  note: string;
  onNoteChange: (value: string) => void;
  onDateSelect: (dateKey: string) => void;
  onRangeModeChange: (mode: DateRangeMode) => void;
  onOpenSettings: () => void;
  onOpenTimeline: () => void;
  onOpenMindMap: () => void;
  onOpenWeekly: () => void;
  onItemSelect: (item: ClassifiedWatchItem) => void;
};

function formatTime(item: ClassifiedWatchItem, timezone: string): string {
  return formatInTimeZone(new Date(item.watchedAt), timezone, "HH:mm");
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-slate-200 px-3 first:border-l-0 first:pl-0 last:pr-0">
      <div className="text-xs font-semibold text-slate-500">{label}</div>
      <div className="mt-2 break-keep text-base font-bold leading-snug text-slate-950">{value}</div>
    </div>
  );
}

function ActionButton({
  label,
  description,
  accent,
  onClick
}: {
  label: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
      onClick={onClick}
    >
      <div className={`mb-3 h-2 w-10 rounded-full ${accent}`} />
      <div className="text-sm font-bold text-slate-950">{label}</div>
      <div className="mt-1 text-xs leading-relaxed text-slate-500">{description}</div>
    </button>
  );
}

function ShareMemoryPrompt({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <button
      type="button"
      className="flex min-h-24 w-full items-center justify-between gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-left shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
      onClick={onOpenSettings}
    >
      <span className="min-w-0">
        <span className="block text-sm font-black text-sky-700">YouTube 공유 저장</span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-600">
          공유한 영상은 Takeout을 기다리지 않고 오늘의 기억에 따로 모입니다.
        </span>
      </span>
      <span className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-bold text-sky-700 shadow-sm">
        공유 방법 보기
      </span>
    </button>
  );
}

function VideoRow({
  item,
  dateSettings,
  onSelect
}: {
  item: ClassifiedWatchItem;
  dateSettings: DateSettings;
  onSelect: () => void;
}) {
  const metadata = getVideoMetadata(item);
  const memorySummary = getVideoMemorySummary(item);

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
      <div className="min-w-0">
        <div className="text-xs font-semibold text-slate-500">
          {formatTime(item, dateSettings.timezone)} · {item.category}
        </div>
        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-950">{item.title}</div>
        <div className="mt-2 truncate text-xs text-slate-500">{item.channelName ?? "채널 없음"}</div>
        {memorySummary ? (
          <div className="mt-2 line-clamp-1 rounded-full bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-700">
            {memorySummary}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function getReviewRangeGuide(rangeMode: DateRangeMode): {
  title: string;
  description: string;
  timelineLabel: string;
} {
  if (rangeMode === "week") {
    return {
      title: "최근 7일 회고",
      description: "선택한 날짜까지 최근 7일의 기록 흐름과 반복된 관심사를 함께 봅니다.",
      timelineLabel: "7일 타임라인 보기"
    };
  }

  return {
    title: "하루 회고",
    description: "선택한 날짜 하루의 기록 개수, 집중 시간대, 기억할 영상을 빠르게 정리합니다.",
    timelineLabel: "하루 타임라인 보기"
  };
}

export function HomeDashboard({
  dateLabel,
  rangeLabel,
  dates,
  selectedDateKey,
  rangeMode,
  summary,
  review,
  dateSettings,
  latestImportSummary,
  note,
  onNoteChange,
  onDateSelect,
  onRangeModeChange,
  onOpenSettings,
  onOpenTimeline,
  onOpenMindMap,
  onOpenWeekly,
  onItemSelect
}: HomeDashboardProps) {
  const categoryTotal = Math.max(1, summary.totalCount);
  const sharedMemoryItems = review.sharedMemoryItems.slice(0, 3);
  const sharedMemoryItemIds = new Set(sharedMemoryItems.map((item) => item.id));
  const markedMemoryItems = review.markedMemoryItems
    .filter((item) => !sharedMemoryItemIds.has(item.id))
    .slice(0, 3);
  const highlightedMemoryItemIds = new Set([
    ...sharedMemoryItems.map((item) => item.id),
    ...markedMemoryItems.map((item) => item.id)
  ]);
  const memorableItems = review.memorableItems
    .filter((item) => !highlightedMemoryItemIds.has(item.id))
    .slice(0, 4);
  const reviewRangeGuide = getReviewRangeGuide(rangeMode);

  return (
    <div className="space-y-4">
      {latestImportSummary ? <ImportSummaryCard summary={latestImportSummary} /> : null}

      {sharedMemoryItems.length === 0 ? <ShareMemoryPrompt onOpenSettings={onOpenSettings} /> : null}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-sky-600">선택 범위</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{dateLabel}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{rangeLabel ?? "날짜 범위를 계산하는 중"}</p>
          </div>
          <button
            type="button"
            className="touch-chip shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
            onClick={onOpenSettings}
          >
            가져오기
          </button>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {dates.map((date) => {
            const selected = date.dateKey === selectedDateKey;
            return (
              <button
                key={date.id}
                type="button"
                className={`min-w-24 rounded-lg border px-3 py-2 text-left transition ${
                  selected
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
                onClick={() => onDateSelect(date.dateKey)}
              >
                <div className="text-xs font-bold">{date.label}</div>
                <div className={`mt-1 text-[11px] ${selected ? "text-slate-200" : "text-slate-500"}`}>
                  {date.count}개
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            className={`touch-chip rounded-md px-3 py-2 text-xs font-bold ${
              rangeMode === "day" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
            }`}
            onClick={() => onRangeModeChange("day")}
          >
            하루치
          </button>
          <button
            type="button"
            className={`touch-chip rounded-md px-3 py-2 text-xs font-bold ${
              rangeMode === "week" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
            }`}
            onClick={() => onRangeModeChange("week")}
          >
            최근 7일치
          </button>
        </div>

        <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5">
          <div className="text-[11px] font-bold text-sky-700">회고 범위</div>
          <div className="mt-1 text-sm font-bold text-slate-950">{reviewRangeGuide.title}</div>
          <p className="mt-1 text-xs leading-snug text-slate-600">{reviewRangeGuide.description}</p>
          <button
            type="button"
            className="mt-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-sky-700 shadow-sm touch-chip"
            onClick={onOpenTimeline}
          >
            {reviewRangeGuide.timelineLabel}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-semibold text-slate-500">오늘의 기록</div>
        <div className="mt-2 text-4xl font-black tracking-tight text-slate-950">{summary.totalCount}개</div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.insight}</p>
        <div className="mt-5 grid grid-cols-3">
          <StatBlock label="Top 주제" value={summary.topCategory?.name ?? "없음"} />
          <StatBlock label="Top 채널" value={summary.topChannel?.name ?? "없음"} />
          <StatBlock label="집중 시간대" value={summary.topTimeBlock?.name ?? "없음"} />
        </div>
      </section>

      {sharedMemoryItems.length > 0 ? (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-950">직접 저장한 영상</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                YouTube 공유로 남긴 영상입니다. Takeout으로 보충된 기록과 구분해서 다시 볼 수 있습니다.
              </p>
            </div>
            <button type="button" className="touch-link shrink-0 text-xs font-bold text-sky-700" onClick={onOpenTimeline}>
              타임라인
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {sharedMemoryItems.map((item) => (
              <VideoRow
                key={item.id}
                item={item}
                dateSettings={dateSettings}
                onSelect={() => onItemSelect(item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {markedMemoryItems.length > 0 ? (
        <section className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-950">오늘 남긴 영상</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                직접 기억하거나 복습하려고 표시한 영상입니다.
              </p>
            </div>
            <button type="button" className="touch-link shrink-0 text-xs font-bold text-sky-700" onClick={onOpenTimeline}>
              타임라인
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {markedMemoryItems.map((item) => (
              <VideoRow
                key={item.id}
                item={item}
                dateSettings={dateSettings}
                onSelect={() => onItemSelect(item)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <ActionButton
          label="타임라인"
          description="언제 어떤 영상을 봤는지 시간순으로 보기"
          accent="bg-sky-500"
          onClick={onOpenTimeline}
        />
        <ActionButton
          label="마인드맵"
          description="주제와 채널 흐름을 구조로 보기"
          accent="bg-emerald-500"
          onClick={onOpenMindMap}
        />
        <ActionButton
          label="주간 리포트"
          description="최근 7일 관심사 변화 보기"
          accent="bg-indigo-500"
          onClick={onOpenWeekly}
        />
        <ActionButton
          label="기록 가져오기"
          description="Takeout ZIP으로 내 기록 업데이트"
          accent="bg-slate-700"
          onClick={onOpenSettings}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-950">관심사 분포</h3>
          <span className="text-xs font-semibold text-slate-500">기록 수 기준</span>
        </div>
        <div className="mt-4 space-y-3">
          {summary.categoryCounts.slice(0, 5).map((category) => (
            <div key={category.category}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{category.category}</span>
                <span>
                  {category.count}개 · {category.percentage}%
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-800"
                  style={{ width: `${Math.max(6, Math.round((category.count / categoryTotal) * 100))}%` }}
                />
              </div>
            </div>
          ))}
          {summary.categoryCounts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              시청 기록을 가져오면 관심사 분포가 표시됩니다.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-950">기억할 영상</h3>
          <button type="button" className="touch-link text-xs font-bold text-sky-600" onClick={onOpenTimeline}>
            전체 보기
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {memorableItems.length > 0 ? (
            memorableItems.map((item) => (
              <VideoRow
                key={item.id}
                item={item}
                dateSettings={dateSettings}
                onSelect={() => onItemSelect(item)}
              />
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              시청 기록을 가져오면 영상 목록이 표시됩니다.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold text-slate-950">오늘의 메모</h3>
          <span className="text-xs font-semibold text-slate-500">기기 안에 저장</span>
        </div>
        <textarea
          className="mt-3 min-h-28 w-full resize-y rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="오늘 기억에 남는 영상이나 느낀 점을 남겨보세요."
        />
      </section>
    </div>
  );
}
