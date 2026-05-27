import type { DateSettings } from "./watch";

export type MindMapViewMode = "topic" | "timeline" | "channel";

export type MindMapNodeType =
  | "root"
  | "summary"
  | "category"
  | "subcategory"
  | "time-block"
  | "channel"
  | "video"
  | "collapsed-group";

export type MindMapNode = {
  id: string;
  label: string;
  type: MindMapNodeType;
  count?: number;
  percentage?: number;
  meta?: Record<string, unknown>;
  children?: MindMapNode[];
};

export type MindMapBuildOptions = {
  viewMode: MindMapViewMode;
  dateKey: string;
  dateSettings: DateSettings;
  maxVisibleVideosPerGroup: number;
  groupVideosBy: "channel" | "subcategory";
};

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
  startLabel: string;
  endLabel: string;
};
