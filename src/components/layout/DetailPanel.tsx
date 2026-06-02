"use client";

import { NodeDetailRenderer } from "@/components/mindmap/NodeDetailRenderer";
import type { VideoMemoryDraft } from "@/lib/share/videoMemory";
import type { MindMapNode } from "@/types/mindmap";
import type { DateSettings } from "@/types/watch";

type DetailPanelProps = {
  className?: string;
  showIntro?: boolean;
  node?: MindMapNode;
  dateSettings: DateSettings;
  onVideoMemorySave?: (itemId: string, draft: VideoMemoryDraft) => void | Promise<void>;
};

export function DetailPanel({
  className = "hidden shrink-0 overflow-y-auto border-slate-200 bg-slate-50 2xl:order-3 2xl:block 2xl:h-full 2xl:w-80 2xl:border-l 2xl:p-5",
  showIntro = true,
  node,
  dateSettings,
  onVideoMemorySave
}: DetailPanelProps) {
  return (
    <aside className={className}>
      {showIntro ? (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">상세 패널</h2>
          <p className="mt-1 text-xs text-slate-500">노드를 클릭하면 관련 기록을 확인할 수 있습니다.</p>
        </div>
      ) : null}
      {node ? (
        <NodeDetailRenderer node={node} dateSettings={dateSettings} onVideoMemorySave={onVideoMemorySave} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">
          선택된 노드가 없습니다.
        </div>
      )}
    </aside>
  );
}
