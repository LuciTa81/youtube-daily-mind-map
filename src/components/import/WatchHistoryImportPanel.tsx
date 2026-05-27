"use client";

import { useRef, useState } from "react";
import { parseTakeoutFile, type ParsedWatchHistory } from "@/lib/import/parseTakeout";
import type { WatchItem } from "@/types/watch";

type WatchHistoryImportPanelProps = {
  activeSourceName: string;
  itemCount: number;
  onImported: (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => void;
  onUseSample: () => void;
};

export function WatchHistoryImportPanel({
  activeSourceName,
  itemCount,
  onImported,
  onUseSample
}: WatchHistoryImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isReading, setIsReading] = useState(false);

  async function handleFileChange(file?: File) {
    setErrorMessage("");
    if (!file) {
      return;
    }

    setIsReading(true);
    try {
      const content = await file.text();
      const result = parseTakeoutFile(file.name, content);
      if (result.items.length === 0) {
        throw new Error("읽어온 시청 기록이 없습니다. YouTube 시청 기록 파일인지 확인해주세요.");
      }

      onImported(result.items, file.name, result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "파일을 읽는 중 문제가 발생했습니다.");
    } finally {
      setIsReading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">시청 기록 불러오기</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Takeout의 watch-history 파일을 브라우저에서만 읽습니다.
        </p>
      </div>
      <div className="rounded-md bg-slate-50 px-3 py-2">
        <div className="text-xs font-medium text-slate-500">현재 데이터</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{activeSourceName}</div>
        <div className="mt-1 text-xs text-slate-500">총 {itemCount}개 기록</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".json,.html,.htm,application/json,text/html"
        className="hidden"
        onChange={(event) => {
          void handleFileChange(event.target.files?.[0]);
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isReading}
          onClick={() => inputRef.current?.click()}
        >
          {isReading ? "읽는 중" : "파일 선택"}
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onUseSample}
        >
          샘플 보기
        </button>
      </div>
      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
