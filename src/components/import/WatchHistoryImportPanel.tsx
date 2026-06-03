"use client";

import { useRef, useState } from "react";
import { WATCH_HISTORY_MISSING_TAKEOUT_MESSAGE, type ParsedWatchHistory } from "@/lib/import/parseTakeout";
import { TakeoutFileWatchHistorySource } from "@/lib/import/watchHistorySources";
import {
  cancelNativeDriveTakeoutZipImport,
  importNativeDriveTakeoutZipWithProgressTimeout,
  isNativeDriveFilePickerAvailable,
  NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE,
  type NativeDriveImportProgress
} from "@/lib/native/nativeDriveFile";
import type { WatchHistoryImportSummary, WatchItem } from "@/types/watch";
import { DriveTakeoutImportPanel } from "./DriveTakeoutImportPanel";
import { ImportSummaryCard } from "./ImportSummaryCard";
import { ImportLoadingOverlay } from "./ImportLoadingOverlay";

const takeoutFileSource = new TakeoutFileWatchHistorySource();
const GOOGLE_TAKEOUT_YOUTUBE_DRIVE_URL = "https://takeout.google.com/settings/takeout/custom/youtube?dest=drive";
const GO_HOME_EVENT_NAME = "youtubeMindMap:goHome";

type WatchHistoryImportPanelProps = {
  activeSourceName: string;
  itemCount: number;
  savedItemCount: number;
  isUsingSample: boolean;
  isStorageReady: boolean;
  latestImportSummary?: WatchHistoryImportSummary;
  onImported: (
    items: WatchItem[],
    sourceName: string,
    result: ParsedWatchHistory
  ) => WatchHistoryImportSummary | Promise<WatchHistoryImportSummary>;
  onUseSample: () => void;
  onUseSaved: () => void;
  onClearSaved: () => void | Promise<void>;
};

type NativeImportOutcome = {
  kind: "success" | "error" | "cancelled";
  message: string;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function getImportErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "파일을 읽는 중 문제가 발생했습니다.";
  }

  return error.message;
}

function formatCount(count: number): string {
  return count.toLocaleString("ko-KR");
}

function getImportSummaryStatus(summary: WatchHistoryImportSummary): string {
  return `가져오기 완료: 새 기록 ${formatCount(summary.addedCount)}개 추가 · 중복 ${formatCount(
    summary.duplicateCount
  )}개 건너뜀`;
}

export function WatchHistoryImportPanel({
  activeSourceName,
  itemCount,
  savedItemCount,
  isUsingSample,
  isStorageReady,
  latestImportSummary,
  onImported,
  onUseSample,
  onUseSaved,
  onClearSaved
}: WatchHistoryImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isNativeDrivePicker = isNativeDriveFilePickerAvailable();
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [importSummary, setImportSummary] = useState<WatchHistoryImportSummary>();
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isCancellingNativeImport, setIsCancellingNativeImport] = useState(false);
  const [nativeProgress, setNativeProgress] = useState<NativeDriveImportProgress | undefined>();
  const [nativeImportOutcome, setNativeImportOutcome] = useState<NativeImportOutcome>();
  const visibleImportSummary = importSummary ?? latestImportSummary;

  function closeImportOverlay() {
    setNativeProgress(undefined);
    setIsSelectingFile(false);
    setIsReading(false);
    setIsCancellingNativeImport(false);
  }

  function handleGoHomeAfterImport() {
    closeImportOverlay();
    window.dispatchEvent(new Event(GO_HOME_EVENT_NAME));
  }

  async function handleNativeDrivePick() {
    setErrorMessage("");
    setImportSummary(undefined);
    setNativeImportOutcome(undefined);
    setStatusMessage("Google Drive에서 Takeout ZIP을 선택해 주세요.");
    setIsSelectingFile(true);
    setIsReading(false);
    setIsCancellingNativeImport(false);
    setNativeProgress(undefined);

    let completedSuccessfully = false;

    try {
      const result = await importNativeDriveTakeoutZipWithProgressTimeout({
        onProgress: (progress) => {
          setIsSelectingFile(false);
          setIsReading(true);
          setNativeProgress(progress);
          setStatusMessage(progress.message);
        }
      });
      if (result.items.length === 0) {
        throw new Error(WATCH_HISTORY_MISSING_TAKEOUT_MESSAGE);
      }

      const finalizingProgress: NativeDriveImportProgress = {
        phase: "finalizing",
        percent: 99,
        message: "시청 기록을 저장소와 화면에 반영하는 중입니다.",
        fileName: result.nativeFile.fileName,
        bytesRead: result.nativeFile.size,
        totalBytes: result.nativeFile.size,
        entryCount: result.archiveEntryCount,
        itemCount: result.items.length
      };
      setNativeProgress(finalizingProgress);
      setStatusMessage(finalizingProgress.message);
      const summary = await onImported(result.items, result.sourceName, result);
      const successMessage = getImportSummaryStatus(summary);
      setImportSummary(summary);
      setStatusMessage(successMessage);
      setNativeImportOutcome({ kind: "success", message: successMessage });
      setNativeProgress({
        ...finalizingProgress,
        phase: "complete",
        percent: 100,
        message: `${formatCount(result.items.length)}개 시청 기록을 반영했습니다.`
      });
      completedSuccessfully = true;
    } catch (error) {
      const message = getImportErrorMessage(error);
      if (message === NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE) {
        setStatusMessage(NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE);
        setNativeImportOutcome({ kind: "cancelled", message: NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE });
        return;
      }

      if (message.includes("취소")) {
        setStatusMessage("파일 선택을 취소했습니다.");
        setNativeImportOutcome({ kind: "cancelled", message: "파일 선택을 취소했습니다." });
      } else {
        setStatusMessage(message);
        setErrorMessage(message);
        setNativeImportOutcome({ kind: "error", message });
      }
    } finally {
      if (!completedSuccessfully) {
        closeImportOverlay();
      }
    }
  }

  async function handleCancelNativeImport() {
    if (isCancellingNativeImport) {
      return;
    }

    setIsCancellingNativeImport(true);
    setStatusMessage(NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE);
    setNativeProgress((current) =>
      current
        ? {
            ...current,
            phase: "cancelled",
            message: NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE
          }
        : {
            phase: "cancelled",
            percent: 0,
            message: NATIVE_DRIVE_IMPORT_CANCELLED_MESSAGE
          }
    );

    try {
      const result = await cancelNativeDriveTakeoutZipImport();
      if (!result.cancelled) {
        setStatusMessage("진행 중인 가져오기가 없습니다.");
        setIsCancellingNativeImport(false);
      }
    } catch (error) {
      const message = getImportErrorMessage(error);
      setStatusMessage(message);
      setErrorMessage(message);
      setIsCancellingNativeImport(false);
    }
  }

  async function handleFileChange(file?: File) {
    setErrorMessage("");
    setImportSummary(undefined);
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
        throw new Error(WATCH_HISTORY_MISSING_TAKEOUT_MESSAGE);
      }

      const summary = await onImported(result.items, result.sourceName, result);
      setImportSummary(summary);
      setStatusMessage(getImportSummaryStatus(summary));
      await wait(700);
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
        onGoHome={handleGoHomeAfterImport}
        onCancel={
          isNativeDrivePicker && isReading && nativeProgress?.phase !== "finalizing" && nativeProgress?.phase !== "complete"
            ? () => {
                void handleCancelNativeImport();
              }
            : undefined
        }
        isCancelling={isCancellingNativeImport}
      />

      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Takeout 가져오기</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {isNativeDrivePicker
              ? "Android 앱에서는 Google Drive에 있는 Takeout ZIP을 선택합니다. ZIP 안에서 필요한 시청 기록만 찾아 읽습니다."
              : "Takeout ZIP을 그대로 선택하면 압축을 풀지 않고 시청 기록만 읽습니다."}
          </p>
        </div>

        <div className="rounded-md bg-slate-50 px-3 py-2">
          <div className="text-xs font-medium text-slate-500">현재 데이터</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{activeSourceName}</div>
          <div className="mt-1 text-xs text-slate-500">총 {itemCount.toLocaleString("ko-KR")}개 기록</div>
          <div className="mt-1 text-xs text-slate-500">
            저장된 내 기록 {savedItemCount.toLocaleString("ko-KR")}개
          </div>
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

        <div className="space-y-2 rounded-md border border-sky-100 bg-sky-50 px-3 py-3 text-xs leading-relaxed text-slate-700">
          <div className="text-sm font-bold text-slate-900">YouTube 공유로 바로 저장</div>
          <ol className="list-decimal space-y-1 pl-4">
            <li>YouTube 앱에서 기억하고 싶은 영상의 공유를 누릅니다.</li>
            <li>공유 시트 첫 화면에 앱이 안 보이면 더보기를 누릅니다.</li>
            <li>YouTube Daily Mind Map을 선택하면 오늘 기록에 저장됩니다.</li>
          </ol>
          <p className="text-slate-500">
            처음에는 더보기 안에 있을 수 있습니다. 한 번 선택하면 기기 공유 목록에서 더 빨리 찾을 수 있습니다.
          </p>
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
            {isReading
              ? "가져오는 중"
              : isSelectingFile
                ? "파일 선택 중"
                : isNativeDrivePicker
                  ? "Google Drive ZIP 선택"
                  : "ZIP/파일 선택"}
          </button>
          <p className="text-xs leading-relaxed text-slate-500">
            {isNativeDrivePicker
              ? "Android 파일 선택기에서 Google Drive를 열고 Takeout ZIP을 고르세요. 다음 선택 때는 마지막 Drive 위치를 먼저 엽니다."
              : "웹에서는 ZIP, watch-history.json, watch-history.html을 선택할 수 있습니다."}
          </p>
        </div>

        {nativeImportOutcome ? (
          <div
            data-testid="native-import-outcome"
            className={
              nativeImportOutcome.kind === "success"
                ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800"
                : nativeImportOutcome.kind === "cancelled"
                  ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600"
                  : "rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700"
            }
          >
            <div className="font-semibold">마지막 Drive 가져오기 결과</div>
            <div className="mt-1">{nativeImportOutcome.message}</div>
          </div>
        ) : null}

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


        {statusMessage ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
            {statusMessage}
          </div>
        ) : null}

        {visibleImportSummary ? <ImportSummaryCard summary={visibleImportSummary} /> : null}

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
