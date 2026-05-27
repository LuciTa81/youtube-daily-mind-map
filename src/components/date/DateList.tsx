"use client";

type DateListProps = {
  dates: Array<{ dateKey: string; count: number; label: string }>;
  selectedDateKey: string;
  onSelect: (dateKey: string) => void;
};

export function DateList({ dates, selectedDateKey, onSelect }: DateListProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">날짜 목록</h2>
        <p className="mt-1 text-xs text-slate-500">기록이 있는 날짜만 표시됩니다.</p>
      </div>
      <div className="space-y-2">
        {dates.map((date) => {
          const selected = date.dateKey === selectedDateKey;
          return (
            <button
              key={date.dateKey}
              type="button"
              className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                selected
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => onSelect(date.dateKey)}
            >
              <span className="block text-sm font-semibold">{date.dateKey}</span>
              <span className={`mt-1 block text-xs ${selected ? "text-slate-200" : "text-slate-500"}`}>
                {date.label.split(" · ")[1] ?? `${date.count}개`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
