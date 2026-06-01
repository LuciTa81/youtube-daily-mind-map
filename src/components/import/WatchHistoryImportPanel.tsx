"use client";

import { useRef, useState } from "react";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import { TakeoutFileWatchHistorySource } from "@/lib/import/watchHistorySources";
import {
  addNativeDriveImportProgressListener,
  importNativeDriveTakeoutZip,
  isNativeDriveFilePickerAvailable,
  type NativeDriveImportProgress
} from "@/lib/native/nativeDriveFile";
import type { WatchItem } from "@/types/watch";
import { DriveTakeoutImportPanel } from "./DriveTakeoutImportPanel";
import { ImportLoadingOverlay } from "./ImportLoadingOverlay";

const takeoutFileSource = new TakeoutFileWatchHistorySource();
const GOOGLE_TAKEOUT_YOUTUBE_DRIVE_URL = "https://takeout.google.com/settings/takeout/custom/youtube?dest=drive";

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

function getImportErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "파일을 읽는 중 문제가 발생했습니다.";
  }

  return error.message;
}

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
  const isNativeDrivePicker = isNativeDriveFilePickerAvailable();
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [nativeProgress, setNativeProgress] = useState<NativeDriveImportProgress | undefined>();

  async function handleNativeDrivePick() {
    setErrorMessage("");
    setStatusMessage("Google Drive의 Takeout ZIP을 선택해주세요.");
    setIsSelectingFile(true);
    setIsReading(false);
    setNativeProgress(undefined);

    let progressListener: { remove: () => Promise<void> } | undefined;
    try {
      progressListener = await addNativeDriveImportProgressListener((progress) => {
        setIsSelectingFile(false);
        setIsReading(true);
        setNativeProgress(progress);
        setStatusMessage(progress.message);
      });
      const result = await importNativeDriveTakeoutZip();
      if (result.items.length === 0) {
        throw new Error("선택한 Takeout ZIP에서 YouTube 시청 기록을 찾지 못했습니다.");
      }

      setStatusMessage("시청 기록을 저장소에 반영하는 중입니다.");
      await onImported(result.items, result.sourceName, result);
      setStatusMessage(`${result.items.length}개 기록을 읽었습니다. 기존 기록과 비교해 새 기록만 저장합니다.`);
    } catch (error) {
      const message = getImportErrorMessage(error);
      if (message.includes("취소")) {
        setStatusMessage("파일 선택을 취소했습니다.");
      } else {
        setErrorMessage(message);
      }
    } finally {
      void progressListener?.remove();
      setNativeProgress(undefined);
      setIsSelectingFile(false);
      setIsReading(false);
    }
  }

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
      setErrorMessage(getImportErrorMessage(error));
    } finally {
      setIsReading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <>
      <ImportLoadingOverlay
        open={isReading}
        progress={nativeProgress}
        statusMessage={statusMessage}
        isNativeDriveImport={isNativeDrivePicker}
      />
      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Takeout 가져오기</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          {isNativeDrivePicker
            ? "Android 앱에서는 Google Drive의 Takeout ZIP만 선택합니다. 큰 ZIP도 앱 안에서 필요한 기록만 찾아 읽습니다."
            : "Takeout ZIP을 그대로 선택하면 압축을 풀지 않고 시청 기록만 읽습니다."}
        </p>
      </div>

      <div className="rounded-md bg-slate-50 px-3 py-2">
        <div className="text-xs font-medium text-slate-500">현재 데이터</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{activeSourceName}</div>
        <div className="mt-1 text-xs text-slate-500">총 {itemCount}개 기록</div>
        <div className="mt-1 text-xs text-slate-500">저장된 내 기록 {savedItemCount}개</div>
      </div>

      <a
        href={GOOGLE_TAKEOUT_YOUTUBE_DRIVE_URL}
        target="_blank"
        rel="noreferrer"
        className="flex w-full items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        Drive로 Takeout 만들기
      </a>

      {!isNativeDrivePicker ? (
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.json,.html,.htm,application/zip,application/x-zip,application/x-zip-compressed,application/octet-stream,application/json,text/html"
          className="hidden"
          onChange={(event) => {
            void handleFileChange(event.target.files?.[0]);
          }}
        />
      ) : null}

      <div className="space-y-2">
        <button
          type="button"
          className="w-full rounded-md bg-slate-900 px-3 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isReading || isSelectingFile}
          onClick={() => {
            if (isNativeDrivePicker) {
              void handleNativeDrivePick();
              return;
            }

            inputRef.current?.click();
          }}
        >
          {isReading ? "가져오는 중" : isSelectingFile ? "파일 선택 중" : isNativeDrivePicker ? "Google Drive ZIP 선택" : "ZIP/파일 선택"}
        </button>
        <p className="text-xs leading-relaxed text-slate-500">
          {isNativeDrivePicker
            ? "Android 파일 선택기에서 Google Drive를 열고 Takeout ZIP을 고르세요. 한 번 선택한 뒤에는 가능한 경우 마지막 Drive 위치를 먼저 엽니다."
            : "웹에서는 ZIP, watch-history.json, watch-history.html을 선택할 수 있습니다."}
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

      {!isNativeDrivePicker ? <DriveTakeoutImportPanel onImported={onImported} /> : null}

      <div className="space-y-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        <div className="font-semibold text-slate-700">권장 흐름</div>
        <div>1. Drive로 Takeout 만들기</div>
        <div>2. Google 화면에서 내보내기 생성</div>
        <div>3. 완료된 Takeout ZIP을 Google Drive에서 선택</div>
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
    </>
  );
}
