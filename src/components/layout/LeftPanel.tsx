"use client";

import { DateList } from "@/components/date/DateList";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ViewModeTabs } from "@/components/filters/ViewModeTabs";
import { WatchHistoryImportPanel } from "@/components/import/WatchHistoryImportPanel";
import type { QuickDateOption } from "@/lib/date/dateKeys";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import type { MindMapViewMode } from "@/types/mindmap";
import type { DateRangeMode, WatchItem } from "@/types/watch";

type LeftPanelProps = {
  dates: QuickDateOption[];
  activeSourceName: string;
  totalItemCount: number;
  onItemsImported: (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => void;
  onUseSample: () => void;
  selectedDateKey: string;
  onDateSelect: (dateKey: string) => void;
  rangeMode: DateRangeMode;
  onRangeModeChange: (mode: DateRangeMode) => void;
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
  rangeMode,
  onRangeModeChange,
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
    <aside className="order-2 w-full shrink-0 border-t border-slate-200 bg-slate-50 p-4 min-[1400px]:order-1 min-[1400px]:h-full min-[1400px]:w-80 min-[1400px]:overflow-y-auto min-[1400px]:border-r min-[1400px]:border-t-0 min-[1400px]:p-5">
      <div className="mb-4 min-[1400px]:mb-6">
        <h1 className="text-xl font-bold text-slate-950">YouTube Daily Mind Map</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          하루의 YouTube 시청 기록을 주제, 시간대, 채널 구조로 살펴봅니다.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 min-[1400px]:block min-[1400px]:space-y-6">
        <WatchHistoryImportPanel
          activeSourceName={activeSourceName}
          itemCount={totalItemCount}
          onImported={onItemsImported}
          onUseSample={onUseSample}
        />
        <DateList
          dates={dates}
          selectedDateKey={selectedDateKey}
          rangeMode={rangeMode}
          onSelect={onDateSelect}
          onRangeModeChange={onRangeModeChange}
        />
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
