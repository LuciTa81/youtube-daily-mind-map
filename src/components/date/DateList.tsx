"use client";

import type { QuickDateOption } from "@/lib/date/dateKeys";
import type { DateRangeMode } from "@/types/watch";

type DateListProps = {
  dates: QuickDateOption[];
  selectedDateKey: string;
  rangeMode: DateRangeMode;
  onSelect: (dateKey: string) => void;
  onRangeModeChange: (mode: DateRangeMode) => void;
};

export function DateList({
  dates,
  selectedDateKey,
  rangeMode,
  onSelect,
  onRangeModeChange
}: DateListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">날짜 선택</h2>
        <p className="mt-1 text-xs text-slate-500">최근 Takeout 확인에 맞춰 오늘, 하루 전, 이틀 전을 바로 봅니다.</p>
      </div>
      <div className="space-y-2">
        {dates.map((date) => {
          const selected = date.dateKey === selectedDateKey;
          return (
            <button
              key={date.dateKey}
              type="button"
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => onSelect(date.dateKey)}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{date.label}</span>
                <span className={`text-xs font-semibold ${selected ? "text-slate-200" : "text-slate-500"}`}>
                  {date.count}개
                </span>
              </span>
              <span className={`mt-1 block text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                {date.dateKey} · {date.description}
              </span>
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500">표시 범위</div>
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
              rangeMode === "day"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => onRangeModeChange("day")}
          >
            하루치
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
              rangeMode === "week"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => onRangeModeChange("week")}
          >
            최근 7일치
          </button>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          최근 7일치는 선택한 날짜를 끝으로 이전 6일을 함께 보여줍니다.
        </p>
      </div>
    </section>
  );
}
