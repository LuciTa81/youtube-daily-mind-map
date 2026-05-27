import type { ClassifiedWatchItem } from "@/types/watch";
import type { MindMapBuildOptions, MindMapNode } from "@/types/mindmap";
import { buildChannelMindMap } from "./buildChannelMindMap";
import { buildTimelineMindMap } from "./buildTimelineMindMap";
import { buildTopicMindMap } from "./buildTopicMindMap";

export function buildMindMap(
  items: ClassifiedWatchItem[],
  options: MindMapBuildOptions
): MindMapNode {
  if (options.viewMode === "timeline") {
    return buildTimelineMindMap(items, options);
  }

  if (options.viewMode === "channel") {
    return buildChannelMindMap(items, options);
  }

  return buildTopicMindMap(items, options);
}
