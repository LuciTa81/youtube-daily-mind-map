"use client";

import type { MindMapViewMode } from "@/types/mindmap";

type ViewModeTabsProps = {
  value: MindMapViewMode;
  onChange: (value: MindMapViewMode) => void;
};

const modes: Array<{ value: MindMapViewMode; label: string }> = [
  { value: "topic", label: "주제별" },
  { value: "timeline", label: "시간대별" },
  { value: "channel", label: "채널별" }
];

export function getViewModeLabel(value: MindMapViewMode): string {
  return modes.find((mode) => mode.value === value)?.label ?? "주제별";
}

export function ViewModeTabs({ value, onChange }: ViewModeTabsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-900">보기 모드</h2>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        {modes.map((mode) => (
          <button
            key={mode.value}
            type="button"
            className={`rounded-md px-2 py-2 text-xs font-semibold transition ${
              value === mode.value
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
            onClick={() => onChange(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </section>
  );
}
