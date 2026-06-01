"use client";

import { useRef, useState } from "react";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import { TakeoutFileWatchHistorySource } from "@/lib/import/watchHistorySources";
import type { WatchItem } from "@/types/watch";
import { DriveTakeoutImportPanel } from "./DriveTakeoutImportPanel";

const takeoutFileSource = new TakeoutFileWatchHistorySource();

type WatchHistoryImportPanelProps = {
  activeSourceName: string;
  itemCount: number;
  savedItemCount: number;
  isUsingSample: boolean;
  isStorageReady: boolean;
  onImported: (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => void | Promise<void>;
  onUseSample: () => void;
  onUseSaved: () => void;
  onClearSaved: () => void | Promise<void>;
};

export function WatchHistoryImportPanel({
  activeSourceName,
  itemCount,
  savedItemCount,
  isUsingSample,
  isStorageReady,
  onImported,
  onUseSample,
  onUseSaved,
  onClearSaved
}: WatchHistoryImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isReading, setIsReading] = useState(false);

  async function handleFileChange(file?: File) {
    setErrorMessage("");
    setStatusMessage("");
    if (!file) {
      return;
    }

    setIsReading(true);
    try {
      const result = await takeoutFileSource.import(file, {
        onStatusChange: setStatusMessage
      });
      if (result.items.length === 0) {
        throw new Error(
          "읽어온 시청 기록이 없습니다. YouTube 시청 기록이 포함된 Takeout ZIP/json/html 파일인지 확인해주세요."
        );
      }

      await onImported(result.items, result.sourceName, result);
      setStatusMessage(`${result.items.length}개 기록을 읽었습니다. 기존 기록과 비교해 새 기록만 저장합니다.`);
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
          가장 안정적인 방법은 Takeout ZIP을 그대로 선택하는 것입니다. 압축을 풀 필요 없이 브라우저나 앱 안에서
          시청 기록만 읽습니다.
        </p>
      </div>

      <div className="rounded-md bg-slate-50 px-3 py-2">
        <div className="text-xs font-medium text-slate-500">현재 데이터</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{activeSourceName}</div>
        <div className="mt-1 text-xs text-slate-500">총 {itemCount}개 기록</div>
        <div className="mt-1 text-xs text-slate-500">저장된 내 기록 {savedItemCount}개</div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip,.json,.html,.htm,application/zip,application/x-zip,application/x-zip-compressed,application/octet-stream,application/json,text/html"
        className="hidden"
        onChange={(event) => {
          void handleFileChange(event.target.files?.[0]);
        }}
      />

      <div className="space-y-2">
        <button
          type="button"
          className="w-full rounded-md bg-slate-900 px-3 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isReading}
          onClick={() => inputRef.current?.click()}
        >
          {isReading ? "파일 읽는 중" : "기기/Drive ZIP 선택"}
        </button>
        <p className="text-xs leading-relaxed text-slate-500">
          Android 앱에서는 이 버튼을 먼저 사용하세요. 파일 앱이나 Drive 앱에서 Takeout ZIP을 바로 고르면 Google
          로그인 스크립트 문제를 피할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={onUseSample}
        >
          샘플 보기
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={savedItemCount === 0 || !isUsingSample}
          onClick={onUseSaved}
        >
          내 기록 보기
        </button>
      </div>

      {savedItemCount > 0 ? (
        <button
          type="button"
          className="w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isStorageReady}
          onClick={() => {
            void onClearSaved();
          }}
        >
          저장 기록 삭제
        </button>
      ) : null}

      {statusMessage ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          {statusMessage}
        </div>
      ) : null}

      <DriveTakeoutImportPanel onImported={onImported} />

      <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        <div className="font-semibold text-slate-700">권장 흐름</div>
        <div>1. Drive로 Takeout 만들기</div>
        <div>2. Google 화면에서 내보내기 생성</div>
        <div>3. 완료된 ZIP을 기기/Drive ZIP 선택으로 불러오기</div>
        <div>4. 새 기록만 저장하고 중복은 건너뛰기</div>
      </div>

      <p className="text-xs leading-relaxed text-slate-500">
        파일은 서버로 업로드하지 않고 현재 기기에서만 읽습니다. 가져온 기록은 IndexedDB에 저장됩니다.
      </p>

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
