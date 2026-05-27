"use client";

import { NodeDetailRenderer } from "@/components/mindmap/NodeDetailRenderer";
import type { MindMapNode } from "@/types/mindmap";
import type { DateSettings } from "@/types/watch";

type DetailPanelProps = {
  node?: MindMapNode;
  dateSettings: DateSettings;
};

export function DetailPanel({ node, dateSettings }: DetailPanelProps) {
  return (
    <aside className="h-full w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-900">상세 패널</h2>
        <p className="mt-1 text-xs text-slate-500">노드를 클릭하면 관련 기록을 확인할 수 있습니다.</p>
      </div>
      {node ? (
        <NodeDetailRenderer node={node} dateSettings={dateSettings} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          선택된 노드가 없습니다.
        </div>
      )}
    </aside>
  );
}
