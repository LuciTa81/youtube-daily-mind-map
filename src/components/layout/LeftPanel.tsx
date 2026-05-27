"use client";

import { DateList } from "@/components/date/DateList";
import { DateSettingsPanel } from "@/components/date/DateSettingsPanel";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ViewModeTabs } from "@/components/filters/ViewModeTabs";
import { WatchHistoryImportPanel } from "@/components/import/WatchHistoryImportPanel";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import type { MindMapViewMode } from "@/types/mindmap";
import type { DateSettings, WatchItem } from "@/types/watch";

type LeftPanelProps = {
  dates: Array<{ dateKey: string; count: number; label: string }>;
  activeSourceName: string;
  totalItemCount: number;
  onItemsImported: (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => void;
  onUseSample: () => void;
  selectedDateKey: string;
  onDateSelect: (dateKey: string) => void;
  dateSettings: DateSettings;
  onDateSettingsChange: (settings: DateSettings) => void;
  viewMode: MindMapViewMode;
  onViewModeChange: (value: MindMapViewMode) => void;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchResultCount: number;
  categories: string[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  channelQuery: string;
  onChannelQueryChange: (value: string) => void;
  lowConfidenceOnly: boolean;
  onLowConfidenceOnlyChange: (value: boolean) => void;
  maxVisibleVideosPerGroup: number;
  onMaxVisibleVideosPerGroupChange: (value: number) => void;
  groupVideosBy: "channel" | "subcategory";
  onGroupVideosByChange: (value: "channel" | "subcategory") => void;
  expandVideosByDefault: boolean;
  onExpandVideosByDefaultChange: (value: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

export function LeftPanel({
  dates,
  activeSourceName,
  totalItemCount,
  onItemsImported,
  onUseSample,
  selectedDateKey,
  onDateSelect,
  dateSettings,
  onDateSettingsChange,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchQueryChange,
  searchResultCount,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  channelQuery,
  onChannelQueryChange,
  lowConfidenceOnly,
  onLowConfidenceOnlyChange,
  maxVisibleVideosPerGroup,
  onMaxVisibleVideosPerGroupChange,
  groupVideosBy,
  onGroupVideosByChange,
  expandVideosByDefault,
  onExpandVideosByDefaultChange,
  onExpandAll,
  onCollapseAll
}: LeftPanelProps) {
  return (
    <aside className="h-full w-80 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 p-5">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-950">YouTube Daily Mind Map</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          하루의 YouTube 시청 기록을 주제, 시간대, 채널 구조로 살펴봅니다.
        </p>
      </div>
      <div className="space-y-6">
        <WatchHistoryImportPanel
          activeSourceName={activeSourceName}
          itemCount={totalItemCount}
          onImported={onItemsImported}
          onUseSample={onUseSample}
        />
        <DateList dates={dates} selectedDateKey={selectedDateKey} onSelect={onDateSelect} />
        <DateSettingsPanel settings={dateSettings} onChange={onDateSettingsChange} />
        <ViewModeTabs value={viewMode} onChange={onViewModeChange} />
        <FilterPanel
          searchQuery={searchQuery}
          onSearchQueryChange={onSearchQueryChange}
          searchResultCount={searchResultCount}
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={onCategoryFilterChange}
          channelQuery={channelQuery}
          onChannelQueryChange={onChannelQueryChange}
          lowConfidenceOnly={lowConfidenceOnly}
          onLowConfidenceOnlyChange={onLowConfidenceOnlyChange}
          maxVisibleVideosPerGroup={maxVisibleVideosPerGroup}
          onMaxVisibleVideosPerGroupChange={onMaxVisibleVideosPerGroupChange}
          groupVideosBy={groupVideosBy}
          onGroupVideosByChange={onGroupVideosByChange}
          expandVideosByDefault={expandVideosByDefault}
          onExpandVideosByDefaultChange={onExpandVideosByDefaultChange}
          onExpandAll={onExpandAll}
          onCollapseAll={onCollapseAll}
        />
      </div>
    </aside>
  );
}
