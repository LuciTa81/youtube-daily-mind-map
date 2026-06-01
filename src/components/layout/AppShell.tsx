"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { DailyReviewPanel } from "@/components/review/DailyReviewPanel";
import { WatchTimeline } from "@/components/timeline/WatchTimeline";
import { classifyItems } from "@/lib/classify/classify";
import {
  filterItemsByDateRange,
  getDateRangeForSelection,
  getQuickDateOptions,
  getRelativeDateKey
} from "@/lib/date/dateKeys";
import { summarizeDay } from "@/lib/analytics/summarizeDay";
import { buildMindMap } from "@/lib/mindmap/buildMindMap";
import { sampleWatchItems } from "@/lib/sample/sampleWatchItems";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import { mergeWatchItems, type WatchHistoryMergeResult } from "@/lib/history/mergeWatchItems";
import { buildDailyReview } from "@/lib/review/buildDailyReview";
import { indexedDbReviewNoteRepository } from "@/lib/storage/reviewNoteRepository";
import { indexedDbWatchHistoryRepository } from "@/lib/storage/watchHistoryRepository";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import type { MindMapBuildOptions, MindMapNode, MindMapViewMode } from "@/types/mindmap";
import type { ClassifiedWatchItem, DateRangeMode, DateSettings, WatchItem } from "@/types/watch";
import { DetailPanel } from "./DetailPanel";
import { LeftPanel } from "./LeftPanel";
import { TopSummaryCards } from "./TopSummaryCards";

type CanvasMode = "review" | "mindmap" | "timeline";
type DataViewMode = "sample" | "saved";

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function itemMatchesSearch(item: ClassifiedWatchItem, query: string): boolean {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) {
    return false;
  }

  const target = `${item.title} ${item.channelName ?? ""} ${item.category} ${item.subcategory ?? ""}`.toLocaleLowerCase(
    "ko-KR"
  );
  return target.includes(normalizedQuery);
}

function getHiddenItems(node: MindMapNode): ClassifiedWatchItem[] {
  const hiddenItems = node.meta?.hiddenItems;
  return Array.isArray(hiddenItems) ? (hiddenItems as ClassifiedWatchItem[]) : [];
}

function getNodeItems(node: MindMapNode): ClassifiedWatchItem[] {
  const items = node.meta?.items;
  return Array.isArray(items) ? (items as ClassifiedWatchItem[]) : [];
}

function createExpandedVideoNode(
  item: ClassifiedWatchItem,
  parentId: string,
  index: number,
  settings: DateSettings
): MindMapNode {
  return {
    id: `${parentId}__expanded__${index}__${item.id}`,
    label: item.title,
    type: "video",
    meta: {
      item,
      watchedTime: formatInTimeZone(new Date(item.watchedAt), settings.timezone, "HH:mm"),
      ...getVideoMetadata(item),
      searchableText: `${item.title} ${item.channelName ?? ""} ${item.category} ${item.subcategory ?? ""}`
    }
  };
}

function createTimelineVideoNode(item: ClassifiedWatchItem, settings: DateSettings): MindMapNode {
  return {
    id: `timeline-video__${item.id}`,
    label: item.title,
    type: "video",
    meta: {
      item,
      watchedTime: formatInTimeZone(new Date(item.watchedAt), settings.timezone, "HH:mm"),
      ...getVideoMetadata(item),
      searchableText: `${item.title} ${item.channelName ?? ""} ${item.category} ${item.subcategory ?? ""}`
    }
  };
}

function shouldExpandCollapsedGroup(
  node: MindMapNode,
  expandedGroupIds: Set<string>,
  searchQuery: string
): boolean {
  if (expandedGroupIds.has(node.id)) {
    return true;
  }

  return getHiddenItems(node).some((item) => itemMatchesSearch(item, searchQuery));
}

function expandCollapsedGroups(
  node: MindMapNode,
  expandedGroupIds: Set<string>,
  searchQuery: string,
  settings: DateSettings
): MindMapNode {
  if (node.type === "collapsed-group" && shouldExpandCollapsedGroup(node, expandedGroupIds, searchQuery)) {
    const hiddenItems = getHiddenItems(node);
    return {
      ...node,
      label: `${hiddenItems.length}개 펼침`,
      meta: {
        ...node.meta,
        isExpanded: true
      },
      children: hiddenItems.map((item, index) => createExpandedVideoNode(item, node.id, index, settings))
    };
  }

  return {
    ...node,
    children: node.children?.map((child) =>
      expandCollapsedGroups(child, expandedGroupIds, searchQuery, settings)
    )
  };
}

function isCollapsibleBranch(node: MindMapNode): boolean {
  return (
    node.type === "category" ||
    node.type === "subcategory" ||
    node.type === "time-block" ||
    node.type === "channel"
  );
}

function applyBranchCollapse(node: MindMapNode, collapsedBranchIds: Set<string>): MindMapNode {
  if (isCollapsibleBranch(node) && collapsedBranchIds.has(node.id)) {
    return {
      ...node,
      meta: {
        ...node.meta,
        isBranchCollapsed: true,
        hiddenChildCount: node.children?.length ?? 0
      },
      children: []
    };
  }

  return {
    ...node,
    meta: {
      ...node.meta,
      isBranchCollapsed: false
    },
    children: node.children?.map((child) => applyBranchCollapse(child, collapsedBranchIds))
  };
}

function nodeMatchesSearch(node: MindMapNode, searchQuery: string): boolean {
  const query = normalizeSearch(searchQuery);
  if (!query) {
    return false;
  }

  const searchableText =
    typeof node.meta?.searchableText === "string"
      ? node.meta.searchableText
      : `${node.label} ${getNodeItems(node)
          .map((item) => `${item.title} ${item.channelName ?? ""} ${item.category} ${item.subcategory ?? ""}`)
          .join(" ")}`;
  return `${node.label} ${searchableText}`.toLocaleLowerCase("ko-KR").includes(query);
}

function annotateNodeState(node: MindMapNode, searchQuery: string, selectedNodeId?: string): MindMapNode {
  const children = node.children?.map((child) => annotateNodeState(child, searchQuery, selectedNodeId));
  const selfMatches = nodeMatchesSearch(node, searchQuery);
  const childMatches = children?.some((child) => Boolean(child.meta?.hasSearchMatch)) ?? false;
  const hasSearchMatch = selfMatches || childMatches || getHiddenItems(node).some((item) => itemMatchesSearch(item, searchQuery));
  const hasQuery = Boolean(normalizeSearch(searchQuery));

  return {
    ...node,
    meta: {
      ...node.meta,
      isSelected: node.id === selectedNodeId,
      isHighlighted: selfMatches || (hasQuery && childMatches && node.type !== "root"),
      isDimmed: hasQuery && !hasSearchMatch,
      hasSearchMatch
    },
    children
  };
}

function findNode(node: MindMapNode, nodeId?: string): MindMapNode | undefined {
  if (!nodeId) {
    return undefined;
  }

  if (node.id === nodeId) {
    return node;
  }

  for (const child of node.children ?? []) {
    const found = findNode(child, nodeId);
    if (found) {
      return found;
    }
  }

  return undefined;
}

function collectCollapsedGroupIds(node: MindMapNode): string[] {
  const ids = node.type === "collapsed-group" ? [node.id] : [];
  for (const child of node.children ?? []) {
    ids.push(...collectCollapsedGroupIds(child));
  }
  return ids;
}

function collectCollapsibleBranchIds(node: MindMapNode): string[] {
  const ids = isCollapsibleBranch(node) ? [node.id] : [];
  for (const child of node.children ?? []) {
    ids.push(...collectCollapsibleBranchIds(child));
  }
  return ids;
}

function getRangeDisplayLabel(
  dateKey: string,
  rangeMode: DateRangeMode,
  dateRange?: { startLabel: string; endLabel: string }
): string {
  if (!dateRange) {
    return dateKey || "선택 없음";
  }

  if (rangeMode === "week") {
    return `${dateRange.startLabel.slice(0, 10)} ~ ${dateRange.endLabel.slice(0, 10)}`;
  }

  return dateKey;
}

function getImportSourceLabel(result: ParsedWatchHistory): string {
  if (result.source === "takeout-zip") {
    const innerType = result.parserSource === "takeout-html" ? "HTML" : "JSON";
    return `Takeout ZIP · ${innerType}`;
  }

  return result.source === "takeout-json" ? "JSON" : "HTML";
}

function getImportResultNote(
  sourceName: string,
  result: ParsedWatchHistory,
  mergeResult: WatchHistoryMergeResult,
  persisted: boolean
): string {
  const sourceLabel = getImportSourceLabel(result);
  const skippedText = result.skippedCount > 0 ? ` · 읽지 못한 항목 ${result.skippedCount}개` : "";
  const cleanedText =
    mergeResult.cleanedExistingDuplicateCount > 0
      ? ` · 기존 중복 ${mergeResult.cleanedExistingDuplicateCount}개 정리`
      : "";
  const fileText = result.matchedFileName ? ` · ${result.matchedFileName}` : ` · ${sourceName}`;
  const storageText = persisted ? "" : " · 저장소 오류로 이번 화면에만 반영";

  return `${sourceLabel}: 새 기록 ${mergeResult.addedCount}개 추가 · 중복 ${mergeResult.duplicateCount}개 건너뜀 · 저장된 기록 ${mergeResult.items.length}개${skippedText}${cleanedText}${fileText}${storageText}`;
}

function resetWorkspaceState(
  setSelectedDateKey: (value: string) => void,
  setRangeMode: (value: DateRangeMode) => void,
  setSearchQuery: (value: string) => void,
  setCategoryFilter: (value: string) => void,
  setChannelQuery: (value: string) => void,
  setLowConfidenceOnly: (value: boolean) => void,
  setSelectedTimelineNode: (value: MindMapNode | undefined) => void,
  setExpandedGroupIds: (value: Set<string>) => void,
  setCollapsedBranchIds: (value: Set<string>) => void
) {
  setSelectedDateKey("");
  setRangeMode("day");
  setSearchQuery("");
  setCategoryFilter("");
  setChannelQuery("");
  setLowConfidenceOnly(false);
  setSelectedTimelineNode(undefined);
  setExpandedGroupIds(new Set());
  setCollapsedBranchIds(new Set());
}

export function AppShell() {
  const [savedWatchItems, setSavedWatchItems] = useState<WatchItem[]>([]);
  const [dataViewMode, setDataViewMode] = useState<DataViewMode>("sample");
  const [activeSourceName, setActiveSourceName] = useState("샘플 데이터");
  const [importNote, setImportNote] = useState("");
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [dateSettings, setDateSettings] = useState<DateSettings>({
    timezone: "Asia/Seoul",
    boundaryMode: "calendar-day",
    lifestyleBoundaryHour: 4
  });
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [rangeMode, setRangeMode] = useState<DateRangeMode>("day");
  const [viewMode, setViewMode] = useState<MindMapViewMode>("topic");
  const [canvasMode, setCanvasMode] = useState<CanvasMode>("review");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [channelQuery, setChannelQuery] = useState("");
  const [lowConfidenceOnly, setLowConfidenceOnly] = useState(false);
  const [maxVisibleVideosPerGroup, setMaxVisibleVideosPerGroup] = useState(5);
  const [groupVideosBy, setGroupVideosBy] = useState<"channel" | "subcategory">("subcategory");
  const [expandVideosByDefault, setExpandVideosByDefault] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set());
  const [collapsedBranchIds, setCollapsedBranchIds] = useState<Set<string>>(() => new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedTimelineNode, setSelectedTimelineNode] = useState<MindMapNode>();
  const [reviewNote, setReviewNote] = useState("");
  const [loadedReviewNoteKey, setLoadedReviewNoteKey] = useState("");
  const watchItems = dataViewMode === "saved" ? savedWatchItems : sampleWatchItems;

  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimezone) {
      setDateSettings((current) => ({ ...current, timezone: browserTimezone }));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedHistory() {
      try {
        const storedItems = await indexedDbWatchHistoryRepository.load();
        if (cancelled) {
          return;
        }

        setSavedWatchItems(storedItems);
        if (storedItems.length > 0) {
          setDataViewMode("saved");
          setActiveSourceName("내 기록 저장소");
          setImportNote(`저장된 내 기록 ${storedItems.length}개를 불러왔습니다.`);
        }
      } catch {
        if (!cancelled) {
          setImportNote("브라우저 로컬 저장소를 사용할 수 없어 이번 세션에서만 기록을 볼 수 있습니다.");
        }
      } finally {
        if (!cancelled) {
          setIsStorageReady(true);
        }
      }
    }

    void loadSavedHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  const quickDateOptions = useMemo(
    () => getQuickDateOptions(watchItems, dateSettings),
    [dateSettings, watchItems]
  );

  useEffect(() => {
    if (!selectedDateKey || !quickDateOptions.some((date) => date.dateKey === selectedDateKey)) {
      setSelectedDateKey(quickDateOptions[0]?.dateKey ?? getRelativeDateKey(0, dateSettings));
    }
  }, [dateSettings, quickDateOptions, selectedDateKey]);

  const dateRange = useMemo(
    () =>
      selectedDateKey
        ? getDateRangeForSelection(selectedDateKey, dateSettings, rangeMode)
        : undefined,
    [dateSettings, rangeMode, selectedDateKey]
  );

  const rawDateItems = useMemo(
    () => (dateRange ? filterItemsByDateRange(watchItems, dateRange) : []),
    [dateRange, watchItems]
  );
  const classifiedItems = useMemo(() => classifyItems(rawDateItems), [rawDateItems]);
  const categories = useMemo(
    () =>
      Array.from(new Set(classifiedItems.map((item) => item.category))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [classifiedItems]
  );
  const filteredItems = useMemo(
    () =>
      classifiedItems.filter((item) => {
        if (categoryFilter && item.category !== categoryFilter) {
          return false;
        }
        if (lowConfidenceOnly && item.confidence > 0.5) {
          return false;
        }
        if (channelQuery.trim()) {
          const channelName = item.channelName?.toLocaleLowerCase("ko-KR") ?? "";
          if (!channelName.includes(channelQuery.trim().toLocaleLowerCase("ko-KR"))) {
            return false;
          }
        }
        return true;
      }),
    [classifiedItems, categoryFilter, channelQuery, lowConfidenceOnly]
  );
  const searchResultCount = useMemo(
    () => filteredItems.filter((item) => itemMatchesSearch(item, searchQuery)).length,
    [filteredItems, searchQuery]
  );
  const summary = useMemo(
    () => summarizeDay(filteredItems, dateSettings),
    [filteredItems, dateSettings]
  );
  const selectedRangeLabel = useMemo(
    () => getRangeDisplayLabel(selectedDateKey, rangeMode, dateRange),
    [dateRange, rangeMode, selectedDateKey]
  );
  const reviewNoteKey = useMemo(
    () => `${rangeMode}:${selectedRangeLabel}`,
    [rangeMode, selectedRangeLabel]
  );
  const dailyReview = useMemo(
    () => buildDailyReview(filteredItems, summary, dateSettings),
    [dateSettings, filteredItems, summary]
  );
  const buildOptions = useMemo<MindMapBuildOptions>(
    () => ({
      viewMode,
      dateKey: selectedRangeLabel,
      dateSettings,
      maxVisibleVideosPerGroup: expandVideosByDefault ? 999 : maxVisibleVideosPerGroup,
      groupVideosBy
    }),
    [dateSettings, expandVideosByDefault, groupVideosBy, maxVisibleVideosPerGroup, selectedRangeLabel, viewMode]
  );
  const baseRoot = useMemo(
    () => buildMindMap(filteredItems, buildOptions),
    [filteredItems, buildOptions]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadReviewNote() {
      try {
        const note = await indexedDbReviewNoteRepository.load(reviewNoteKey);
        if (!cancelled) {
          setReviewNote(note?.text ?? "");
          setLoadedReviewNoteKey(reviewNoteKey);
        }
      } catch {
        if (!cancelled) {
          setReviewNote("");
          setLoadedReviewNoteKey(reviewNoteKey);
        }
      }
    }

    void loadReviewNote();

    return () => {
      cancelled = true;
    };
  }, [reviewNoteKey]);

  useEffect(() => {
    if (loadedReviewNoteKey !== reviewNoteKey) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const trimmedNote = reviewNote.trim();
      if (trimmedNote) {
        void indexedDbReviewNoteRepository.save({
          key: reviewNoteKey,
          text: reviewNote,
          updatedAt: new Date().toISOString()
        });
      } else {
        void indexedDbReviewNoteRepository.delete(reviewNoteKey);
      }
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [loadedReviewNoteKey, reviewNote, reviewNoteKey]);

  useEffect(() => {
    setSelectedNodeId(baseRoot.id);
    setSelectedTimelineNode(undefined);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, [
    baseRoot.id,
    selectedDateKey,
    rangeMode,
    viewMode,
    groupVideosBy,
    maxVisibleVideosPerGroup,
    expandVideosByDefault,
    dateSettings.timezone
  ]);

  const displayRoot = useMemo(() => {
    const expandedRoot = expandCollapsedGroups(baseRoot, expandedGroupIds, searchQuery, dateSettings);
    const collapsedRoot = applyBranchCollapse(expandedRoot, collapsedBranchIds);
    return annotateNodeState(collapsedRoot, searchQuery, selectedNodeId);
  }, [baseRoot, collapsedBranchIds, dateSettings, expandedGroupIds, searchQuery, selectedNodeId]);

  const selectedNode = useMemo(
    () => selectedTimelineNode ?? findNode(displayRoot, selectedNodeId) ?? displayRoot,
    [displayRoot, selectedNodeId, selectedTimelineNode]
  );
  const handleRangeModeChange = useCallback((mode: DateRangeMode) => {
    setRangeMode(mode);
    setSelectedTimelineNode(undefined);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleViewModeChange = useCallback((mode: MindMapViewMode) => {
    setViewMode(mode);
    setCanvasMode("mindmap");
    setSelectedTimelineNode(undefined);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleCanvasModeChange = useCallback(
    (mode: CanvasMode) => {
      setCanvasMode(mode);
      setSelectedTimelineNode(undefined);
      setSelectedNodeId(baseRoot.id);
    },
    [baseRoot.id]
  );

  const handleGroupVideosByChange = useCallback((value: "channel" | "subcategory") => {
    setGroupVideosBy(value);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleDateSelect = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    setSelectedTimelineNode(undefined);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleItemsImported = useCallback(
    async (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => {
      const mergeResult = mergeWatchItems(savedWatchItems, items);
      let persisted = true;

      try {
        await indexedDbWatchHistoryRepository.save(mergeResult.items);
      } catch {
        persisted = false;
      }

      setSavedWatchItems(mergeResult.items);
      setDataViewMode("saved");
      setActiveSourceName("내 기록 저장소");
      setImportNote(getImportResultNote(sourceName, result, mergeResult, persisted));
      resetWorkspaceState(
        setSelectedDateKey,
        setRangeMode,
        setSearchQuery,
        setCategoryFilter,
        setChannelQuery,
        setLowConfidenceOnly,
        setSelectedTimelineNode,
        setExpandedGroupIds,
        setCollapsedBranchIds
      );
    },
    [savedWatchItems]
  );

  const handleUseSample = useCallback(() => {
    setDataViewMode("sample");
    setActiveSourceName("샘플 데이터");
    setImportNote("샘플 데이터로 돌아왔습니다.");
    resetWorkspaceState(
      setSelectedDateKey,
      setRangeMode,
      setSearchQuery,
      setCategoryFilter,
      setChannelQuery,
      setLowConfidenceOnly,
      setSelectedTimelineNode,
      setExpandedGroupIds,
      setCollapsedBranchIds
    );
  }, []);

  const handleUseSaved = useCallback(() => {
    if (savedWatchItems.length === 0) {
      return;
    }

    setDataViewMode("saved");
    setActiveSourceName("내 기록 저장소");
    setImportNote(`저장된 내 기록 ${savedWatchItems.length}개를 보고 있습니다.`);
    resetWorkspaceState(
      setSelectedDateKey,
      setRangeMode,
      setSearchQuery,
      setCategoryFilter,
      setChannelQuery,
      setLowConfidenceOnly,
      setSelectedTimelineNode,
      setExpandedGroupIds,
      setCollapsedBranchIds
    );
  }, [savedWatchItems.length]);

  const handleClearSaved = useCallback(async () => {
    const confirmed = window.confirm("저장된 내 시청 기록을 모두 삭제할까요? 샘플 데이터는 그대로 남습니다.");
    if (!confirmed) {
      return;
    }

    await indexedDbWatchHistoryRepository.clear();
    setSavedWatchItems([]);
    setDataViewMode("sample");
    setActiveSourceName("샘플 데이터");
    setImportNote("저장된 내 기록을 삭제하고 샘플 데이터로 전환했습니다.");
    resetWorkspaceState(
      setSelectedDateKey,
      setRangeMode,
      setSearchQuery,
      setCategoryFilter,
      setChannelQuery,
      setLowConfidenceOnly,
      setSelectedTimelineNode,
      setExpandedGroupIds,
      setCollapsedBranchIds
    );
  }, []);

  const handleNodeSelect = useCallback((node: MindMapNode) => {
    setSelectedTimelineNode(undefined);
    setSelectedNodeId(node.id);
    if (node.type === "collapsed-group") {
      setExpandedGroupIds((current) => {
        const next = new Set(current);
        if (next.has(node.id)) {
          next.delete(node.id);
        } else {
          next.add(node.id);
        }
        return next;
      });
    }
  }, []);

  const handleTimelineItemSelect = useCallback(
    (item: ClassifiedWatchItem) => {
      setSelectedTimelineNode(createTimelineVideoNode(item, dateSettings));
      setSelectedNodeId(undefined);
    },
    [dateSettings]
  );

  const handleToggleBranch = useCallback((nodeId: string) => {
    setCollapsedBranchIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleToggleCollapsedGroup = useCallback((nodeId: string) => {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedBranchIds(new Set());
    setExpandedGroupIds(new Set(collectCollapsedGroupIds(baseRoot)));
  }, [baseRoot]);

  const handleCollapseAll = useCallback(() => {
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set(collectCollapsibleBranchIds(baseRoot)));
  }, [baseRoot]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 min-[1400px]:h-screen min-[1400px]:min-h-0 min-[1400px]:flex-row min-[1400px]:overflow-hidden">
      <LeftPanel
        dates={quickDateOptions}
        activeSourceName={activeSourceName}
        totalItemCount={watchItems.length}
        savedItemCount={savedWatchItems.length}
        isUsingSample={dataViewMode === "sample"}
        isStorageReady={isStorageReady}
        onItemsImported={handleItemsImported}
        onUseSample={handleUseSample}
        onUseSaved={handleUseSaved}
        onClearSaved={handleClearSaved}
        selectedDateKey={selectedDateKey}
        onDateSelect={handleDateSelect}
        rangeMode={rangeMode}
        onRangeModeChange={handleRangeModeChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResultCount={searchResultCount}
        categories={categories}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        channelQuery={channelQuery}
        onChannelQueryChange={setChannelQuery}
        lowConfidenceOnly={lowConfidenceOnly}
        onLowConfidenceOnlyChange={setLowConfidenceOnly}
        maxVisibleVideosPerGroup={maxVisibleVideosPerGroup}
        onMaxVisibleVideosPerGroupChange={setMaxVisibleVideosPerGroup}
        groupVideosBy={groupVideosBy}
        onGroupVideosByChange={handleGroupVideosByChange}
        expandVideosByDefault={expandVideosByDefault}
        onExpandVideosByDefaultChange={setExpandVideosByDefault}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
      />
      <main className="order-1 flex min-w-0 flex-1 flex-col gap-3 p-3 md:gap-4 md:p-4 min-[1400px]:order-2 min-[1400px]:p-5">
        <TopSummaryCards
          dateKey={selectedDateKey || "선택 없음"}
          dateLabel={selectedRangeLabel}
          summary={summary}
          viewMode={viewMode}
          displayModeLabel={canvasMode === "review" ? "회고" : canvasMode === "timeline" ? "타임라인" : undefined}
        />
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">
              {canvasMode === "review" ? "오늘 회고" : canvasMode === "mindmap" ? "마인드맵" : "시청 타임라인"}
            </div>
            <div className="mt-1 text-xs leading-relaxed text-slate-500">
              {dateRange?.label ?? "날짜 범위를 계산하는 중"} ·{" "}
              {rangeMode === "week" ? "선택일 기준 최근 7일" : "자정 기준 하루"}
            </div>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  canvasMode === "review"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => handleCanvasModeChange("review")}
              >
                회고
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  canvasMode === "mindmap"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => handleCanvasModeChange("mindmap")}
              >
                마인드맵
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  canvasMode === "timeline"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
                onClick={() => handleCanvasModeChange("timeline")}
              >
                타임라인
              </button>
            </div>
            <div className="text-xs leading-relaxed text-slate-500 md:text-right">
              {importNote ||
                (canvasMode === "review"
                  ? "오늘의 관심사 흐름과 기억할 영상을 회고 형태로 정리합니다."
                  : canvasMode === "mindmap"
                  ? "검색은 일치 노드를 강조하고 숨겨진 그룹을 자동으로 펼칩니다."
                  : "시청 기록을 시간순으로 배치합니다. 카드를 누르면 상세 정보를 볼 수 있습니다.")}
            </div>
          </div>
        </div>
        <div className="h-[66svh] min-h-[460px] md:h-[68svh] min-[1400px]:min-h-0 min-[1400px]:flex-1">
          {canvasMode === "review" ? (
            <DailyReviewPanel
              review={dailyReview}
              summary={summary}
              items={filteredItems}
              dateLabel={selectedRangeLabel}
              dateSettings={dateSettings}
              note={reviewNote}
              onNoteChange={setReviewNote}
              onItemSelect={handleTimelineItemSelect}
            />
          ) : canvasMode === "mindmap" ? (
            <MindMapCanvas
              root={displayRoot}
              selectedNodeId={selectedTimelineNode ? undefined : selectedNode?.id}
              onNodeSelect={handleNodeSelect}
              onToggleBranch={handleToggleBranch}
              onToggleCollapsedGroup={handleToggleCollapsedGroup}
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
            />
          ) : (
            <WatchTimeline
              items={filteredItems}
              dateKey={selectedRangeLabel}
              dateSettings={dateSettings}
              selectedItemId={
                (selectedTimelineNode?.meta?.item as ClassifiedWatchItem | undefined)?.id
              }
              onItemSelect={handleTimelineItemSelect}
            />
          )}
        </div>
      </main>
      <DetailPanel node={selectedNode} dateSettings={dateSettings} />
    </div>
  );
}
