"use client";

import { DateList } from "@/components/date/DateList";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { ViewModeTabs } from "@/components/filters/ViewModeTabs";
import { WatchHistoryImportPanel } from "@/components/import/WatchHistoryImportPanel";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import type { QuickDateOption } from "@/lib/date/dateKeys";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import type { MindMapViewMode } from "@/types/mindmap";
import type { DateRangeMode, WatchHistoryImportSummary, WatchItem } from "@/types/watch";

type LeftPanelProps = {
  className?: string;
  contentClassName?: string;
  showIntro?: boolean;
  layoutVariant?: "sidebar" | "settings";
  dates: QuickDateOption[];
  activeSourceName: string;
  totalItemCount: number;
  savedItemCount: number;
  isUsingSample: boolean;
  isStorageReady: boolean;
  latestImportSummary?: WatchHistoryImportSummary;
  onItemsImported: (
    items: WatchItem[],
    sourceName: string,
    result: ParsedWatchHistory
  ) => WatchHistoryImportSummary | Promise<WatchHistoryImportSummary>;
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

function SettingsGroupHeader({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-base font-black text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

export function LeftPanel({
  className = "hidden shrink-0 border-slate-200 bg-slate-50 2xl:order-1 2xl:block 2xl:h-full 2xl:w-80 2xl:overflow-y-auto 2xl:border-r 2xl:p-5",
  contentClassName = "space-y-6",
  showIntro = true,
  layoutVariant = "sidebar",
  dates,
  activeSourceName,
  totalItemCount,
  savedItemCount,
  isUsingSample,
  isStorageReady,
  latestImportSummary,
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
  const importPanel = (
    <WatchHistoryImportPanel
      activeSourceName={activeSourceName}
      itemCount={totalItemCount}
      savedItemCount={savedItemCount}
      isUsingSample={isUsingSample}
      isStorageReady={isStorageReady}
      latestImportSummary={latestImportSummary}
      onImported={onItemsImported}
      onUseSample={onUseSample}
      onUseSaved={onUseSaved}
      onClearSaved={onClearSaved}
    />
  );

  const datePanel = (
    <DateList
      dates={dates}
      selectedDateKey={selectedDateKey}
      rangeMode={rangeMode}
      onSelect={onDateSelect}
      onRangeModeChange={onRangeModeChange}
    />
  );

  const viewModePanel = <ViewModeTabs value={viewMode} onChange={onViewModeChange} />;

  const filterPanel = (
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
  );

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
      {layoutVariant === "settings" ? (
        <div className="space-y-6">
          <section className="space-y-3">
            <SettingsGroupHeader
              title="기록 가져오기"
              description="Takeout 파일을 불러오고, Drive 원본 ZIP 정리까지 처리합니다."
            />
            {importPanel}
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="space-y-3">
              <SettingsGroupHeader
                title="날짜와 범위"
                description="오늘, 하루 전, 이틀 전과 최근 7일 보기 기준을 선택합니다."
              />
              {datePanel}
            </section>
            <section className="space-y-3">
              <SettingsGroupHeader
                title="보기 방식"
                description="마인드맵을 주제, 시간대, 채널 기준으로 전환합니다."
              />
              {viewModePanel}
              <PwaInstallPrompt />
            </section>
          </div>

          <section className="space-y-3">
            <SettingsGroupHeader
              title="필터와 표시"
              description="가져오기와 별도로 검색 조건과 마인드맵 표시 방식을 조절합니다."
            />
            {filterPanel}
          </section>
        </div>
      ) : (
        <div className={contentClassName}>
          {importPanel}
          <PwaInstallPrompt />
          {datePanel}
          {viewModePanel}
          {filterPanel}
        </div>
      )}
    </aside>
  );
}
