"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindMapFlowNode, MindMapReactFlowNodeData } from "@/lib/mindmap/reactFlowAdapter";

const typeLabel: Record<string, string> = {
  root: "날짜",
  summary: "요약",
  category: "카테고리",
  subcategory: "세부 주제",
  "time-block": "시간대",
  channel: "채널",
  video: "영상",
  "collapsed-group": "더 보기"
};

const typeClasses: Record<string, string> = {
  root: "border-slate-900 bg-slate-900 text-white",
  summary: "border-cyan-200 bg-cyan-50 text-cyan-950",
  category: "border-indigo-200 bg-indigo-50 text-indigo-950",
  subcategory: "border-emerald-200 bg-emerald-50 text-emerald-950",
  "time-block": "border-amber-200 bg-amber-50 text-amber-950",
  channel: "border-rose-200 bg-rose-50 text-rose-950",
  video: "border-slate-200 bg-white text-slate-900",
  "collapsed-group": "border-dashed border-slate-300 bg-slate-50 text-slate-600"
};

function getSubtitle(data: MindMapReactFlowNodeData): string {
  const node = data.mindMapNode;

  if (node.type === "root") {
    return `시청 기록 ${node.count ?? 0}개`;
  }

  if (node.type === "category") {
    return `${node.count ?? 0}개 · ${node.percentage ?? 0}%`;
  }

  if (node.type === "video") {
    const watchedTime = node.meta?.watchedTime;
    const item = node.meta?.item as { channelName?: string } | undefined;
    return [typeof watchedTime === "string" ? watchedTime : undefined, item?.channelName ?? "채널 없음"]
      .filter(Boolean)
      .join(" · ");
  }

  if (node.type === "collapsed-group") {
    return "숨겨진 영상 노드";
  }

  return `${node.count ?? 0}개 기록`;
}

export function MindMapNode({ data, selected }: NodeProps<MindMapFlowNode>) {
  const node = data.mindMapNode;
  const thumbnailUrl = typeof node.meta?.thumbnailUrl === "string" ? node.meta.thumbnailUrl : undefined;
  const canCollapseBranch =
    node.type === "category" ||
    node.type === "subcategory" ||
    node.type === "time-block" ||
    node.type === "channel";
  const isCollapsedGroup = node.type === "collapsed-group";
  const baseClass = typeClasses[node.type] ?? typeClasses.video;
  const highlightClass = data.isHighlighted
    ? "ring-4 ring-yellow-300 ring-offset-2"
    : selected || data.isSelected
      ? "ring-4 ring-slate-300 ring-offset-2"
      : "";
  const dimClass = data.isDimmed ? "opacity-45" : "opacity-100";

  return (
    <div
      className={`relative rounded-lg border px-4 py-3 shadow-soft transition ${baseClass} ${highlightClass} ${dimClass}`}
    >
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-slate-400" />
      <div className="flex items-start justify-between gap-3">
        <div className={`min-w-0 ${node.type === "video" ? "flex gap-3" : ""}`}>
          {node.type === "video" && thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt=""
              className="mt-1 h-14 w-20 shrink-0 rounded-md object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase text-current opacity-60">
            {typeLabel[node.type]}
          </div>
          <div
            className={`mt-1 font-semibold leading-snug ${
              node.type === "root" ? "text-xl" : node.type === "video" ? "text-sm" : "text-base"
            } line-clamp-2`}
          >
            {node.label}
          </div>
          <div className="mt-2 text-xs leading-relaxed opacity-75">{getSubtitle(data)}</div>
          </div>
        </div>
        {canCollapseBranch ? (
          <button
            type="button"
            className="shrink-0 rounded-md border border-current px-2 py-1 text-[11px] font-medium opacity-70 hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation();
              data.onToggleBranch?.(node.id);
            }}
          >
            {data.isCollapsed ? "펼치기" : "접기"}
          </button>
        ) : null}
        {isCollapsedGroup ? (
          <button
            type="button"
            className="shrink-0 rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-700"
            onClick={(event) => {
              event.stopPropagation();
              data.onToggleCollapsedGroup?.(node.id);
            }}
          >
            {node.children && node.children.length > 0 ? "접기" : "펼치기"}
          </button>
        ) : null}
      </div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-slate-400" />
    </div>
  );
}
