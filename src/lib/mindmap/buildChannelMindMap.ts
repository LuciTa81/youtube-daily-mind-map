import { formatInTimeZone } from "date-fns-tz";
import { summarizeDay } from "@/lib/analytics/summarizeDay";
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

function getMainCategory(items: ClassifiedWatchItem[]): { name: string; count: number } | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }))[0];
}

function getLastWatchedAt(items: ClassifiedWatchItem[], timezone: string): string | undefined {
  const last = [...items].sort(
    (a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
  )[0];

  if (!last) {
    return undefined;
  }

  return formatInTimeZone(new Date(last.watchedAt), timezone, "yyyy-MM-dd HH:mm");
}

export function buildChannelMindMap(
  items: ClassifiedWatchItem[],
  options: MindMapBuildOptions
): MindMapNode {
  const summary = summarizeDay(items, options.dateSettings);
  const channelGroups = Array.from(
    groupBy(items, (item) => item.channelName ?? "채널 없음").entries()
  ).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  const topChannels = channelGroups.slice(0, 10);
  const rest = channelGroups.slice(10).flatMap(([, channelItems]) => channelItems);
  const normalizedChannels =
    rest.length > 0 ? [...topChannels, ["기타 채널", rest] as [string, ClassifiedWatchItem[]]] : topChannels;

  const channelNodes = normalizedChannels.map(([channelName, channelItems], channelIndex): MindMapNode => {
    const channelId = makeId("channel", options.dateKey, `${channelIndex}`, channelName);
    const mainCategory = getMainCategory(channelItems);
    const categoryNodes = Array.from(groupBy(channelItems, (item) => item.category).entries())
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
      .map(([category, categoryItems], categoryIndex): MindMapNode => {
        const categoryId = makeId(channelId, `${categoryIndex}`, category);
        return {
          id: categoryId,
          label: `${category} · ${categoryItems.length}개`,
          type: "category",
          count: categoryItems.length,
          percentage:
            channelItems.length > 0 ? Math.round((categoryItems.length / channelItems.length) * 100) : 0,
          meta: {
            items: categoryItems,
            channelName,
            searchableText: `${category} ${channelName}`
          },
          children: createVideoChildren(categoryItems, categoryId, options)
        };
      });
    const firstChannelUrl = channelItems.find((item) => item.channelUrl)?.channelUrl;

    return {
      id: channelId,
      label: `${channelName} · ${channelItems.length}개`,
      type: "channel",
      count: channelItems.length,
      meta: {
        items: channelItems,
        channelName,
        channelUrl: firstChannelUrl,
        mainCategory,
        lastWatchedAt: getLastWatchedAt(channelItems, options.dateSettings.timezone),
        searchableText: `${channelName} ${mainCategory?.name ?? ""}`
      },
      children: categoryNodes
    };
  });

  return {
    id: makeId("root", options.dateKey, "channel"),
    label: `${options.dateKey} 채널별 기록`,
    type: "root",
    count: items.length,
    meta: {
      dateKey: options.dateKey,
      viewMode: options.viewMode,
      summary,
      items,
      searchableText: `${options.dateKey} 채널별 기록`
    },
    children: channelNodes
  };
}
