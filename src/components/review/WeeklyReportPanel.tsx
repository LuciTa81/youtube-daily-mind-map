"use client";

import { formatInTimeZone } from "date-fns-tz";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { WeeklyReport } from "@/lib/review/buildWeeklyReport";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

type WeeklyReportPanelProps = {
  report: WeeklyReport;
  dateLabel: string;
  dateSettings: DateSettings;
  note: string;
  onNoteChange: (value: string) => void;
  onItemSelect: (item: ClassifiedWatchItem) => void;
};

function formatTime(item: ClassifiedWatchItem, timezone: string): string {
  return formatInTimeZone(new Date(item.watchedAt), timezone, "MM.dd HH:mm");
}

function ReportVideoCard({
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

export function WeeklyReportPanel({
  report,
  dateLabel,
  dateSettings,
  note,
  onNoteChange,
  onItemSelect
}: WeeklyReportPanelProps) {
  const maxDailyCount = Math.max(1, ...report.dailyCounts.map((day) => day.count));

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4 md:px-5">
        <div className="text-xs font-semibold text-slate-500">{dateLabel}</div>
        <h2 className="mt-2 text-xl font-bold leading-snug text-slate-950">{report.headline}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{report.insight}</p>
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[1.05fr_0.95fr] md:p-5">
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">주간 기록</div>
              <div className="mt-2 text-lg font-bold text-slate-900">{report.summary.totalCount}개</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Top 주제</div>
              <div className="mt-2 break-keep text-sm font-bold leading-snug text-slate-900">
                {report.summary.topCategory ? report.summary.topCategory.name : "없음"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">Top 채널</div>
              <div className="mt-2 break-keep text-sm font-bold leading-snug text-slate-900">
                {report.summary.topChannel ? report.summary.topChannel.name : "없음"}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-slate-500">가장 많았던 날</div>
              <div className="mt-2 break-keep text-sm font-bold leading-snug text-slate-900">
                {report.mostActiveDay ? `${report.mostActiveDay.label} · ${report.mostActiveDay.count}개` : "없음"}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">요일별 기록 수</h3>
              <span className="text-xs text-slate-500">선택일 기준 최근 7일</span>
            </div>
            <div className="mt-4 grid grid-cols-7 items-end gap-2">
              {report.dailyCounts.map((day) => (
                <div key={day.dateKey} className="flex min-w-0 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end rounded-md bg-slate-50 px-1">
                    <div
                      className="w-full rounded-md bg-slate-800"
                      style={{ height: `${Math.max(day.count > 0 ? 8 : 2, Math.round((day.count / maxDailyCount) * 100))}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold leading-tight text-slate-700">{day.label}</div>
                    <div className="mt-1 text-[11px] text-slate-500">{day.count}개</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">관심사 변화</h3>
            <div className="mt-3 space-y-3">
              {report.categoryTrends.length > 0 ? (
                report.categoryTrends.map((trend) => (
                  <div key={trend.category}>
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
                      <span>{trend.category}</span>
                      <span>
                        {trend.count}개 · {trend.percentage}% · {trend.activeDays}일
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-sky-500" style={{ width: `${trend.percentage}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">표시할 관심사 흐름이 없습니다.</div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">주간 메모</h3>
              <span className="text-xs text-slate-500">기기 안에 저장</span>
            </div>
            <textarea
              className="mt-3 min-h-32 w-full resize-y rounded-md border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
              value={note}
              onChange={(event) => onNoteChange(event.target.value)}
              placeholder="이번 주에 기억하고 싶은 관심사나 영상 흐름을 남겨보세요."
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">자주 본 채널</h3>
            <div className="mt-3 space-y-2">
              {report.topChannels.length > 0 ? (
                report.topChannels.map((channel) => (
                  <div key={channel.channelName} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                    <span className="truncate text-sm font-semibold text-slate-700">{channel.channelName}</span>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">{channel.count}개</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">채널 기록이 없습니다.</div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">주간 기억할 영상</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              이번 주 기록 중 다시 볼 만한 후보를 모았습니다.
            </p>
            <div className="mt-3 space-y-3">
              {report.memorableItems.length > 0 ? (
                report.memorableItems.map((item) => (
                  <ReportVideoCard
                    key={item.id}
                    item={item}
                    dateSettings={dateSettings}
                    onSelect={() => onItemSelect(item)}
                  />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  시청 기록을 가져오면 영상이 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
