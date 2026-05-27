import { summarizeDay } from "@/lib/analytics/summarizeDay";
import { TIME_BLOCKS, getTimeBlockForItem } from "@/lib/date/timeBlocks";
import type { MindMapBuildOptions, MindMapNode } from "@/types/mindmap";
import type { ClassifiedWatchItem } from "@/types/watch";
import { createVideoChildren } from "./buildTopicMindMap";

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

function getTopCategory(items: ClassifiedWatchItem[]): { name: string; count: number } | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }))[0];
}

export function buildTimelineMindMap(
  items: ClassifiedWatchItem[],
  options: MindMapBuildOptions
): MindMapNode {
  const summary = summarizeDay(items, options.dateSettings);
  const timeGroups = groupBy(items, (item) => getTimeBlockForItem(item, options.dateSettings).id);
  const timeBlockNodes = TIME_BLOCKS.map((block, blockIndex): MindMapNode | undefined => {
    const blockItems = timeGroups.get(block.id) ?? [];
    if (blockItems.length === 0) {
      return undefined;
    }

    const blockId = makeId("timeline", options.dateKey, `${blockIndex}`, block.id);
    const topCategory = getTopCategory(blockItems);
    const categoryNodes = Array.from(groupBy(blockItems, (item) => item.category).entries())
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .map(([category, categoryItems], categoryIndex): MindMapNode => {
        const categoryId = makeId(blockId, `${categoryIndex}`, category);
        return {
          id: categoryId,
          label: `${category} · ${categoryItems.length}개`,
          type: "category",
          count: categoryItems.length,
          percentage:
            blockItems.length > 0 ? Math.round((categoryItems.length / blockItems.length) * 100) : 0,
          meta: {
            items: categoryItems,
            timeBlock: block,
            searchableText: `${category} ${block.name}`
          },
          children: createVideoChildren(categoryItems, categoryId, options)
        };
      });

    return {
      id: blockId,
      label: `${block.name} · ${blockItems.length}개`,
      type: "time-block",
      count: blockItems.length,
      meta: {
        timeBlock: block,
        items: blockItems,
        topCategory,
        searchableText: `${block.name} ${block.rangeLabel} ${topCategory?.name ?? ""}`
      },
      children: categoryNodes
    };
  }).filter((node): node is MindMapNode => Boolean(node));

  return {
    id: makeId("root", options.dateKey, "timeline"),
    label: `${options.dateKey} 시간 흐름`,
    type: "root",
    count: items.length,
    meta: {
      dateKey: options.dateKey,
      viewMode: options.viewMode,
      summary,
      items,
      searchableText: `${options.dateKey} 시간 흐름`
    },
    children: timeBlockNodes
  };
}
