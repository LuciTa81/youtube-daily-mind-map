"use client";

import { Panel, useReactFlow } from "@xyflow/react";

type MindMapControlsProps = {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  visibleNodeCount: number;
};

export function MindMapControls({
  onExpandAll,
  onCollapseAll,
  visibleNodeCount
}: MindMapControlsProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  return (
    <Panel position="top-right" className="max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white/95 p-2 shadow-soft">
      <div className="flex flex-wrap items-center justify-end gap-2">
      <span className="px-2 text-xs font-medium text-slate-500">{visibleNodeCount}개 노드</span>
      <button
        type="button"
        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => zoomOut()}
        title="축소"
      >
        -
      </button>
      <button
        type="button"
        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => zoomIn()}
        title="확대"
      >
        +
      </button>
      <button
        type="button"
        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => fitView({ padding: 0.18, duration: 400 })}
      >
        맞춤
      </button>
      <button
        type="button"
        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={onExpandAll}
      >
        전체 펼치기
      </button>
      <button
        type="button"
        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
        onClick={onCollapseAll}
      >
        전체 접기
      </button>
      </div>
    </Panel>
  );
}
