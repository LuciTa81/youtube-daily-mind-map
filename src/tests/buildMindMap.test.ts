import { describe, expect, it } from "vitest";
import { classifyItems } from "@/lib/classify/classify";
import { buildChannelMindMap } from "@/lib/mindmap/buildChannelMindMap";
import { buildTimelineMindMap } from "@/lib/mindmap/buildTimelineMindMap";
import { buildTopicMindMap } from "@/lib/mindmap/buildTopicMindMap";
import type { MindMapBuildOptions, MindMapNode } from "@/types/mindmap";
import type { WatchItem } from "@/types/watch";

const baseOptions: MindMapBuildOptions = {
  viewMode: "topic",
  dateKey: "2026-05-27",
  dateSettings: {
    timezone: "Asia/Seoul",
    boundaryMode: "calendar-day",
    lifestyleBoundaryHour: 4
  },
  maxVisibleVideosPerGroup: 5,
  groupVideosBy: "subcategory"
};

function watchItem(id: string, title: string, watchedAt: string, channelName = "생활코딩"): WatchItem {
  return {
    id,
    title,
    channelName,
    watchedAt,
    source: "sample"
  };
}

function findFirst(node: MindMapNode, type: MindMapNode["type"]): MindMapNode | undefined {
  if (node.type === type) {
    return node;
  }

  for (const child of node.children ?? []) {
    const found = findFirst(child, type);
    if (found) {
      return found;
    }
  }

  return undefined;
}

describe("mind map builders", () => {
  it("builds root -> category -> subcategory -> video in topic mode", () => {
    const items = classifyItems([
      watchItem("a", "Next.js App Router 강의", "2026-05-27T09:00:00+09:00"),
      watchItem("b", "React 상태 관리 강의", "2026-05-27T10:00:00+09:00")
    ]);
    const root = buildTopicMindMap(items, baseOptions);
    const category = root.children?.find((child) => child.type === "category");
    const subcategory = category?.children?.find((child) => child.type === "subcategory");
    const video = subcategory?.children?.find((child) => child.type === "video");

    expect(root.type).toBe("root");
    expect(category?.type).toBe("category");
    expect(subcategory?.type).toBe("subcategory");
    expect(video?.type).toBe("video");
  });

  it("builds root -> time-block -> category -> video in timeline mode", () => {
    const items = classifyItems([
      watchItem("a", "Next.js App Router 강의", "2026-05-27T09:00:00+09:00"),
      watchItem("b", "비트코인 ETF 전망", "2026-05-27T20:00:00+09:00", "슈카월드")
    ]);
    const root = buildTimelineMindMap(items, { ...baseOptions, viewMode: "timeline" });
    const timeBlock = root.children?.find((child) => child.type === "time-block");
    const category = timeBlock?.children?.find((child) => child.type === "category");
    const video = category?.children?.find((child) => child.type === "video");

    expect(root.type).toBe("root");
    expect(timeBlock?.type).toBe("time-block");
    expect(category?.type).toBe("category");
    expect(video?.type).toBe("video");
  });

  it("builds root -> channel -> category -> video in channel mode", () => {
    const items = classifyItems([
      watchItem("a", "Next.js App Router 강의", "2026-05-27T09:00:00+09:00"),
      watchItem("b", "React 상태 관리 강의", "2026-05-27T10:00:00+09:00")
    ]);
    const root = buildChannelMindMap(items, { ...baseOptions, viewMode: "channel" });
    const channel = root.children?.find((child) => child.type === "channel");
    const category = channel?.children?.find((child) => child.type === "category");
    const video = category?.children?.find((child) => child.type === "video");

    expect(root.type).toBe("root");
    expect(channel?.type).toBe("channel");
    expect(category?.type).toBe("category");
    expect(video?.type).toBe("video");
  });

  it("creates collapsed-group nodes when a group has too many videos", () => {
    const items = classifyItems(
      Array.from({ length: 6 }, (_, index) =>
        watchItem(
          `a-${index}`,
          `Next.js App Router 강의 ${index}`,
          `2026-05-27T1${index}:00:00+09:00`
        )
      )
    );
    const root = buildTopicMindMap(items, { ...baseOptions, maxVisibleVideosPerGroup: 2 });

    expect(findFirst(root, "collapsed-group")?.type).toBe("collapsed-group");
  });
});
