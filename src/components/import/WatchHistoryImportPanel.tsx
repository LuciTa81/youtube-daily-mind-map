"use client";

import { useRef, useState } from "react";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import { TakeoutFileWatchHistorySource } from "@/lib/import/watchHistorySources";
import type { WatchItem } from "@/types/watch";

const GOOGLE_TAKEOUT_YOUTUBE_URL = "https://takeout.google.com/settings/takeout/custom/youtube";
const takeoutFileSource = new TakeoutFileWatchHistorySource();

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
      const result = await takeoutFileSource.import(file);
      if (result.items.length === 0) {
        throw new Error("읽어온 시청 기록이 없습니다. YouTube 시청 기록이 포함된 Takeout 파일인지 확인해주세요.");
      }

      onImported(result.items, result.sourceName, result);
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
        <h2 className="text-sm font-semibold text-slate-900">Takeout 가져오기</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          ZIP을 그대로 선택하면 앱이 시청 기록 파일을 찾아 읽습니다.
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
        accept=".zip,.json,.html,.htm,application/zip,application/x-zip-compressed,application/json,text/html"
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
          {isReading ? "읽는 중" : "ZIP/파일 선택"}
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onUseSample}
        >
          샘플 보기
        </button>
      </div>
      <a
        href={GOOGLE_TAKEOUT_YOUTUBE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Google Takeout 열기
      </a>
      <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        <div className="font-semibold text-slate-700">권장 흐름</div>
        <div>1. Takeout에서 YouTube 기록만 선택</div>
        <div>2. 다운로드한 .zip 파일 선택</div>
        <div>3. 분석 후 샘플 데이터 대신 내 기록으로 전환</div>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        파일은 서버로 업로드하지 않고 현재 기기에서만 읽습니다.
      </p>
      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
