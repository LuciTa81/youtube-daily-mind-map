"use client";

import type { DateSettings } from "@/types/watch";

type DateSettingsPanelProps = {
  settings: DateSettings;
  onChange: (settings: DateSettings) => void;
};

const BASE_TIMEZONES = ["Asia/Seoul", "UTC", "America/Los_Angeles", "America/New_York", "Europe/London"];

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function parseHour(value: string): number {
  const hour = Number(value.split(":")[0]);
  return Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 4;
}

export function DateSettingsPanel({ settings, onChange }: DateSettingsPanelProps) {
  const timezones = BASE_TIMEZONES.includes(settings.timezone)
    ? BASE_TIMEZONES
    : [settings.timezone, ...BASE_TIMEZONES];

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">날짜 기준</h2>
        <p className="mt-1 text-xs text-slate-500">생활일 기준은 새벽 기록을 전날로 묶습니다.</p>
      </div>
      <div className="space-y-2 text-sm text-slate-700">
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
          <input
            type="radio"
            checked={settings.boundaryMode === "calendar-day"}
            onChange={() => onChange({ ...settings, boundaryMode: "calendar-day" })}
          />
          자정 기준 하루
        </label>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
          <input
            type="radio"
            checked={settings.boundaryMode === "lifestyle-day"}
            onChange={() => onChange({ ...settings, boundaryMode: "lifestyle-day" })}
          />
          생활일 기준 하루
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-500">생활일 시작 시간</span>
        <input
          type="time"
          value={formatHour(settings.lifestyleBoundaryHour)}
          step={3600}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          onChange={(event) =>
            onChange({ ...settings, lifestyleBoundaryHour: parseHour(event.target.value) })
          }
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-500">시간대</span>
        <select
          value={settings.timezone}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          onChange={(event) => onChange({ ...settings, timezone: event.target.value })}
        >
          {timezones.map((timezone) => (
            <option key={timezone} value={timezone}>
              {timezone}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
