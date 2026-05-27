import { formatInTimeZone } from "date-fns-tz";
import { summarizeDay } from "@/lib/analytics/summarizeDay";
import { getTimeBlockForItem } from "@/lib/date/timeBlocks";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { MindMapBuildOptions, MindMapNode } from "@/types/mindmap";
import type { ClassifiedWatchItem } from "@/types/watch";

function cleanIdPart(value: string): string {
  const cleaned = value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
  return cleaned.length > 0 ? cleaned : "node";
}

function makeId(...parts: string[]): string {
  return parts.map(cleanIdPart).join("__");
}

function sortByWatchedAt(items: ClassifiedWatchItem[]): ClassifiedWatchItem[] {
  return [...items].sort(
    (a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime()
  );
}

function groupBy(items: ClassifiedWatchItem[], getKey: (item: ClassifiedWatchItem) => string) {
  const map = new Map<string, ClassifiedWatchItem[]>();
  for (const item of items) {
    const key = getKey(item);
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

function getTopEntry(map: Map<string, number>): { name: string; count: number } | undefined {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }))[0];
}

function getTopChannel(items: ClassifiedWatchItem[]): { name: string; count: number } | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    const channelName = item.channelName ?? "채널 없음";
    counts.set(channelName, (counts.get(channelName) ?? 0) + 1);
  }
  return getTopEntry(counts);
}

function getTopTimeBlock(items: ClassifiedWatchItem[], options: MindMapBuildOptions) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const timeBlock = getTimeBlockForItem(item, options.dateSettings).name;
    counts.set(timeBlock, (counts.get(timeBlock) ?? 0) + 1);
  }
  return getTopEntry(counts);
}

function createVideoNode(
  item: ClassifiedWatchItem,
  parentId: string,
  index: number,
  options: MindMapBuildOptions
): MindMapNode {
  const watchedTime = formatInTimeZone(
    new Date(item.watchedAt),
    options.dateSettings.timezone,
    "HH:mm"
  );
  const videoMetadata = getVideoMetadata(item);

  return {
    id: makeId(parentId, "video", `${index}`, item.id),
    label: item.title,
    type: "video",
    meta: {
      item,
      watchedTime,
      ...videoMetadata,
      searchableText: `${item.title} ${item.channelName ?? ""} ${item.category} ${
        item.subcategory ?? ""
      }`
    }
  };
}

export function createVideoChildren(
  items: ClassifiedWatchItem[],
  parentId: string,
  options: MindMapBuildOptions
): MindMapNode[] {
  const sortedItems = sortByWatchedAt(items);
  const visibleCount = Math.max(0, options.maxVisibleVideosPerGroup);
  const visibleItems = sortedItems.slice(0, visibleCount);
  const hiddenItems = sortedItems.slice(visibleCount);
  const children = visibleItems.map((item, index) => createVideoNode(item, parentId, index, options));

  if (hiddenItems.length > 0) {
    children.push({
      id: makeId(parentId, "collapsed", `${hiddenItems.length}`),
      label: `+ ${hiddenItems.length}개 더 보기`,
      type: "collapsed-group",
      count: hiddenItems.length,
      meta: {
        hiddenItems,
        parentId,
        searchableText: hiddenItems
          .map((item) => `${item.title} ${item.channelName ?? ""} ${item.category} ${item.subcategory ?? ""}`)
          .join(" ")
      }
    });
  }

  return children;
}

function buildSummaryNode(items: ClassifiedWatchItem[], options: MindMapBuildOptions): MindMapNode {
  const summary = summarizeDay(items, options.dateSettings);
  const topCategory = summary.topCategory?.name ?? "없음";
  const topTimeBlock = summary.topTimeBlock?.name ?? "없음";
  const topChannel = summary.topChannel?.name ?? "없음";

  return {
    id: makeId("summary", options.dateKey, "topic"),
    label: "범위 요약",
    type: "summary",
    count: items.length,
    meta: {
      summary,
      patternText: `${topTimeBlock}에 ${topCategory} 기록 집중`,
      items
    },
    children: [
      {
        id: makeId("summary", options.dateKey, "total"),
        label: `총 ${items.length}개 기록`,
        type: "summary",
        count: items.length
      },
      {
        id: makeId("summary", options.dateKey, "top-category"),
        label: `Top 카테고리: ${topCategory}`,
        type: "summary",
        count: summary.topCategory?.count
      },
      {
        id: makeId("summary", options.dateKey, "top-time"),
        label: `집중 시간대: ${topTimeBlock}`,
        type: "summary",
        count: summary.topTimeBlock?.count
      },
      {
        id: makeId("summary", options.dateKey, "top-channel"),
        label: `가장 많이 본 채널: ${topChannel}`,
        type: "summary",
        count: summary.topChannel?.count
      }
    ]
  };
}

export function buildTopicMindMap(
  items: ClassifiedWatchItem[],
  options: MindMapBuildOptions
): MindMapNode {
  const summary = summarizeDay(items, options.dateSettings);
  const categoryGroups = groupBy(items, (item) => item.category);
  const categoryNodes = Array.from(categoryGroups.entries())
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([category, categoryItems], categoryIndex): MindMapNode => {
      const categoryId = makeId("topic", options.dateKey, `${categoryIndex}`, category);
      const groupGetter =
        options.groupVideosBy === "channel"
          ? (item: ClassifiedWatchItem) => item.channelName ?? "채널 없음"
          : (item: ClassifiedWatchItem) => item.subcategory ?? "기타";
      const groupedChildren = Array.from(groupBy(categoryItems, groupGetter).entries())
        .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
        .map(([groupName, groupItems], groupIndex): MindMapNode => {
          const groupId = makeId(categoryId, `${groupIndex}`, groupName);
          const groupType = options.groupVideosBy === "channel" ? "channel" : "subcategory";
          return {
            id: groupId,
            label: `${groupName} · ${groupItems.length}개`,
            type: groupType,
            count: groupItems.length,
            meta: {
              items: groupItems,
              category,
              groupName,
              searchableText: `${groupName} ${category}`
            },
            children: createVideoChildren(groupItems, groupId, options)
          };
        });
      const topChannel = getTopChannel(categoryItems);
      const topTimeBlock = getTopTimeBlock(categoryItems, options);

      return {
        id: categoryId,
        label: category,
        type: "category",
        count: categoryItems.length,
        percentage: summary.totalCount > 0 ? Math.round((categoryItems.length / summary.totalCount) * 100) : 0,
        meta: {
          items: categoryItems,
          topChannel,
          topTimeBlock,
          searchableText: category
        },
        children: groupedChildren
      };
    });

  return {
    id: makeId("root", options.dateKey, "topic"),
    label: `${options.dateKey} YouTube 기록`,
    type: "root",
    count: items.length,
    meta: {
      dateKey: options.dateKey,
      viewMode: options.viewMode,
      summary,
      items,
      searchableText: `${options.dateKey} YouTube 기록`
    },
    children: [buildSummaryNode(items, options), ...categoryNodes]
  };
}
