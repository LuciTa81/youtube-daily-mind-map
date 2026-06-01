"use client";

import { formatInTimeZone } from "date-fns-tz";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { DailyReview } from "@/lib/review/buildDailyReview";
import type { DaySummary } from "@/lib/analytics/summarizeDay";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

type DailyReviewPanelProps = {
  review: DailyReview;
  summary: DaySummary;
  items: ClassifiedWatchItem[];
  dateLabel: string;
  dateSettings: DateSettings;
  note: string;
  onNoteChange: (value: string) => void;
  onItemSelect: (item: ClassifiedWatchItem) => void;
};

function formatTime(item: ClassifiedWatchItem, timezone: string): string {
  return formatInTimeZone(new Date(item.watchedAt), timezone, "HH:mm");
}

function MiniVideoCard({
  item,
  dateSettings,
  onSelect
}: {
  item: ClassifiedWatchItem;
  dateSettings: DateSettings;
  onSelect: () => void;
}) {
  const metadata = getVideoMetadata(item);

  return (
    <button
      type="button"
      className="flex w-full gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-400"
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
        <div className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {item.title}
        </div>
        <div className="mt-2 truncate text-xs text-slate-500">{item.channelName ?? "채널 없음"}</div>
      </div>
    </button>
  );
}

export function DailyReviewPanel({
  review,
  summary,
  items,
  dateLabel,
  dateSettings,
  note,
  onNoteChange,
  onItemSelect
}: DailyReviewPanelProps) {
  const topCategories = summary.categoryCounts.slice(0, 5);
  const hasItems = items.length > 0;

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4 md:px-5">
        <div className="text-xs font-semibold text-slate-500">{dateLabel}</div>
        <h2 className="mt-2 text-xl font-bold leading-snug text-slate-950">{review.headline}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.insight}</p>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1.1fr_0.9fr] md:p-5">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">시청 기록</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{summary.totalCount}개</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Top 주제</div>
              <div className="mt-2 break-keep text-sm font-bold leading-snug text-slate-900">
                {summary.topCategory ? summary.topCategory.name : "없음"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Top 채널</div>
              <div className="mt-2 break-keep text-sm font-bold leading-snug text-slate-900">
                {summary.topChannel ? summary.topChannel.name : "없음"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">집중 시간대</div>
              <div className="mt-2 break-keep text-sm font-bold leading-snug text-slate-900">
                {summary.topTimeBlock ? summary.topTimeBlock.name : "없음"}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">관심사 키워드</h3>
              <span className="text-xs text-slate-500">상위 주제와 채널 기준</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {review.focusKeywords.length > 0 ? (
                review.focusKeywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {keyword}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">아직 키워드가 없습니다.</span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">시간대 흐름</h3>
            <div className="mt-3 space-y-3">
              {review.timeBlocks.length > 0 ? (
                review.timeBlocks.map((block) => (
                  <div key={block.name}>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>{block.name}</span>
                      <span>
                        {block.count}개{block.topCategory ? ` · ${block.topCategory}` : ""}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-800"
                        style={{ width: `${Math.max(8, Math.round((block.count / Math.max(1, summary.totalCount)) * 100))}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">표시할 시간대 흐름이 없습니다.</div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">카테고리 분포</h3>
            <div className="mt-3 space-y-3">
              {topCategories.map((category) => (
                <div key={category.category}>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>{category.category}</span>
                    <span>
                      {category.count}개 · {category.percentage}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-sky-500" style={{ width: `${category.percentage}%` }} />
                  </div>
                </div>
              ))}
              {topCategories.length === 0 ? <div className="text-sm text-slate-500">분포가 없습니다.</div> : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">오늘의 메모</h3>
              <span className="text-xs text-slate-500">기기 안에 저장</span>
            </div>
            <textarea
              className="mt-3 min-h-32 w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="오늘 기억에 남는 영상이나 느낀 점을 짧게 남겨보세요."
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">기억할 영상</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              분류가 애매하거나 최근 본 기록을 우선 보여줍니다.
            </p>
            <div className="mt-3 space-y-3">
              {review.memorableItems.length > 0 ? (
                review.memorableItems.map((item) => (
                  <MiniVideoCard
                    key={item.id}
                    item={item}
                    dateSettings={dateSettings}
                    onSelect={() => onItemSelect(item)}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  {hasItems ? "필터 조건에 맞는 영상이 없습니다." : "시청 기록을 가져오면 영상이 표시됩니다."}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
