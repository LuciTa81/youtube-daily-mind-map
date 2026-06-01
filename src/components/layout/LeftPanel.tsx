"use client";

import { DateList } from "@/components/date/DateList";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ViewModeTabs } from "@/components/filters/ViewModeTabs";
import { WatchHistoryImportPanel } from "@/components/import/WatchHistoryImportPanel";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import type { QuickDateOption } from "@/lib/date/dateKeys";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import type { MindMapViewMode } from "@/types/mindmap";
import type { DateRangeMode, WatchItem } from "@/types/watch";

type LeftPanelProps = {
  className?: string;
  contentClassName?: string;
  showIntro?: boolean;
  dates: QuickDateOption[];
  activeSourceName: string;
  totalItemCount: number;
  savedItemCount: number;
  isUsingSample: boolean;
  isStorageReady: boolean;
  onItemsImported: (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => void | Promise<void>;
  onUseSample: () => void;
  onUseSaved: () => void;
  onClearSaved: () => void | Promise<void>;
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
  className = "hidden shrink-0 border-slate-200 bg-slate-50 2xl:order-1 2xl:block 2xl:h-full 2xl:w-80 2xl:overflow-y-auto 2xl:border-r 2xl:p-5",
  contentClassName = "space-y-6",
  showIntro = true,
  dates,
  activeSourceName,
  totalItemCount,
  savedItemCount,
  isUsingSample,
  isStorageReady,
  onItemsImported,
  onUseSample,
  onUseSaved,
  onClearSaved,
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
    <aside className={className}>
      {showIntro ? (
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-950">YouTube Daily Mind Map</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            하루의 YouTube 시청 기록을 주제, 시간대, 채널 구조로 살펴봅니다.
          </p>
        </div>
      ) : null}
      <div className={contentClassName}>
        <WatchHistoryImportPanel
          activeSourceName={activeSourceName}
          itemCount={totalItemCount}
          savedItemCount={savedItemCount}
          isUsingSample={isUsingSample}
          isStorageReady={isStorageReady}
          onImported={onItemsImported}
          onUseSample={onUseSample}
          onUseSaved={onUseSaved}
          onClearSaved={onClearSaved}
        />
        <PwaInstallPrompt />
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
