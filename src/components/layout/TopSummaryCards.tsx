"use client";

import type { DaySummary } from "@/lib/analytics/summarizeDay";
import { formatDateLabel } from "@/lib/date/dateKeys";
import type { MindMapViewMode } from "@/types/mindmap";
import { getViewModeLabel } from "@/components/filters/ViewModeTabs";

type TopSummaryCardsProps = {
  dateKey: string;
  dateLabel?: string;
  summary: DaySummary;
  viewMode: MindMapViewMode;
  displayModeLabel?: string;
};

export function TopSummaryCards({
  dateKey,
  dateLabel,
  summary,
  viewMode,
  displayModeLabel
}: TopSummaryCardsProps) {
  const cards = [
    { label: "선택 범위", value: dateLabel ?? formatDateLabel(dateKey) },
    { label: "총 기록 수", value: `${summary.totalCount}개 기록` },
    {
      label: "Top 카테고리",
      value: summary.topCategory
        ? `${summary.topCategory.name} · ${summary.topCategory.count}개`
        : "없음"
    },
    {
      label: "Top 채널",
      value: summary.topChannel ? `${summary.topChannel.name} · ${summary.topChannel.count}개` : "없음"
    },
    {
      label: "집중 시간대",
      value: summary.topTimeBlock
        ? `${summary.topTimeBlock.name} · ${summary.topTimeBlock.count}개`
        : "없음"
    },
    { label: "보기 모드", value: displayModeLabel ?? getViewModeLabel(viewMode) }
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:p-4">
          <div className="text-xs font-semibold text-slate-500">{card.label}</div>
          <div className="mt-2 break-keep text-sm font-semibold leading-snug text-slate-900">{card.value}</div>
        </div>
      ))}
    </div>
  );
}
