"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { classifyItems } from "@/lib/classify/classify";
import { getAvailableDates, getDateRangeForDateKey, filterItemsByDateKey } from "@/lib/date/dateKeys";
import { summarizeDay } from "@/lib/analytics/summarizeDay";
import { buildMindMap } from "@/lib/mindmap/buildMindMap";
import { sampleWatchItems } from "@/lib/sample/sampleWatchItems";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import type { MindMapBuildOptions, MindMapNode, MindMapViewMode } from "@/types/mindmap";
import type { ClassifiedWatchItem, DateSettings, WatchItem } from "@/types/watch";
import { DetailPanel } from "./DetailPanel";
import { LeftPanel } from "./LeftPanel";
import { TopSummaryCards } from "./TopSummaryCards";

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

export function AppShell() {
  const [watchItems, setWatchItems] = useState<WatchItem[]>(sampleWatchItems);
  const [activeSourceName, setActiveSourceName] = useState("샘플 데이터");
  const [importNote, setImportNote] = useState("");
  const [dateSettings, setDateSettings] = useState<DateSettings>({
    timezone: "Asia/Seoul",
    boundaryMode: "calendar-day",
    lifestyleBoundaryHour: 4
  });
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [viewMode, setViewMode] = useState<MindMapViewMode>("topic");
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

  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimezone) {
      setDateSettings((current) => ({ ...current, timezone: browserTimezone }));
    }
  }, []);

  const availableDates = useMemo(
    () => getAvailableDates(watchItems, dateSettings),
    [dateSettings, watchItems]
  );

  useEffect(() => {
    if (availableDates.length === 0) {
      return;
    }

    if (!selectedDateKey || !availableDates.some((date) => date.dateKey === selectedDateKey)) {
      setSelectedDateKey(availableDates[0].dateKey);
    }
  }, [availableDates, selectedDateKey]);

  const rawDateItems = useMemo(
    () =>
      selectedDateKey
        ? filterItemsByDateKey(watchItems, selectedDateKey, dateSettings)
        : [],
    [selectedDateKey, dateSettings, watchItems]
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
  const buildOptions = useMemo<MindMapBuildOptions>(
    () => ({
      viewMode,
      dateKey: selectedDateKey || "선택 없음",
      dateSettings,
      maxVisibleVideosPerGroup: expandVideosByDefault ? 999 : maxVisibleVideosPerGroup,
      groupVideosBy
    }),
    [dateSettings, expandVideosByDefault, groupVideosBy, maxVisibleVideosPerGroup, selectedDateKey, viewMode]
  );
  const baseRoot = useMemo(
    () => buildMindMap(filteredItems, buildOptions),
    [filteredItems, buildOptions]
  );

  useEffect(() => {
    setSelectedNodeId(baseRoot.id);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, [
    baseRoot.id,
    selectedDateKey,
    viewMode,
    groupVideosBy,
    maxVisibleVideosPerGroup,
    expandVideosByDefault,
    dateSettings.timezone,
    dateSettings.boundaryMode,
    dateSettings.lifestyleBoundaryHour
  ]);

  const displayRoot = useMemo(() => {
    const expandedRoot = expandCollapsedGroups(baseRoot, expandedGroupIds, searchQuery, dateSettings);
    const collapsedRoot = applyBranchCollapse(expandedRoot, collapsedBranchIds);
    return annotateNodeState(collapsedRoot, searchQuery, selectedNodeId);
  }, [baseRoot, collapsedBranchIds, dateSettings, expandedGroupIds, searchQuery, selectedNodeId]);

  const selectedNode = useMemo(
    () => findNode(displayRoot, selectedNodeId) ?? displayRoot,
    [displayRoot, selectedNodeId]
  );
  const dateRange = useMemo(
    () => (selectedDateKey ? getDateRangeForDateKey(selectedDateKey, dateSettings) : undefined),
    [dateSettings, selectedDateKey]
  );

  const handleDateSettingsChange = useCallback((settings: DateSettings) => {
    setDateSettings(settings);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleViewModeChange = useCallback((mode: MindMapViewMode) => {
    setViewMode(mode);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleGroupVideosByChange = useCallback((value: "channel" | "subcategory") => {
    setGroupVideosBy(value);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleDateSelect = useCallback((dateKey: string) => {
    setSelectedDateKey(dateKey);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleItemsImported = useCallback(
    (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => {
      setWatchItems(items);
      setActiveSourceName(sourceName);
      setImportNote(
        `${result.source === "takeout-json" ? "JSON" : "HTML"}에서 ${items.length}개 기록을 불러왔습니다${
          result.skippedCount > 0 ? ` · ${result.skippedCount}개 항목은 건너뜀` : ""
        }`
      );
      setSelectedDateKey("");
      setSearchQuery("");
      setCategoryFilter("");
      setChannelQuery("");
      setLowConfidenceOnly(false);
      setExpandedGroupIds(new Set());
      setCollapsedBranchIds(new Set());
    },
    []
  );

  const handleUseSample = useCallback(() => {
    setWatchItems(sampleWatchItems);
    setActiveSourceName("샘플 데이터");
    setImportNote("샘플 데이터로 돌아왔습니다.");
    setSelectedDateKey("");
    setSearchQuery("");
    setCategoryFilter("");
    setChannelQuery("");
    setLowConfidenceOnly(false);
    setExpandedGroupIds(new Set());
    setCollapsedBranchIds(new Set());
  }, []);

  const handleNodeSelect = useCallback((node: MindMapNode) => {
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
    <div className="flex h-screen min-h-0 bg-slate-100 text-slate-900">
      <LeftPanel
        dates={availableDates}
        activeSourceName={activeSourceName}
        totalItemCount={watchItems.length}
        onItemsImported={handleItemsImported}
        onUseSample={handleUseSample}
        selectedDateKey={selectedDateKey}
        onDateSelect={handleDateSelect}
        dateSettings={dateSettings}
        onDateSettingsChange={handleDateSettingsChange}
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
      <main className="flex min-w-0 flex-1 flex-col gap-4 p-5">
        <TopSummaryCards dateKey={selectedDateKey || "선택 없음"} summary={summary} viewMode={viewMode} />
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">마인드맵</div>
            <div className="mt-1 text-xs text-slate-500">
              {dateRange?.label ?? "날짜 범위를 계산하는 중"} · {dateSettings.boundaryMode === "calendar-day" ? "자정 기준" : "생활일 기준"}
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            {importNote || "검색은 일치 노드를 강조하고 숨겨진 그룹을 자동으로 펼칩니다."}
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <MindMapCanvas
            root={displayRoot}
            selectedNodeId={selectedNode?.id}
            onNodeSelect={handleNodeSelect}
            onToggleBranch={handleToggleBranch}
            onToggleCollapsedGroup={handleToggleCollapsedGroup}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />
        </div>
      </main>
      <DetailPanel node={selectedNode} dateSettings={dateSettings} />
    </div>
  );
}
