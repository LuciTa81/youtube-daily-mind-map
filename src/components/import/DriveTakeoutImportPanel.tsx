"use client";

import { useMemo, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { formatDriveFileSize, getDriveApiUserMessage, trashDriveFile } from "@/lib/drive/googleDriveApi";
import { pickGoogleDriveFile, type PickedDriveFile } from "@/lib/drive/googlePicker";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import { GoogleDriveTakeoutWatchHistorySource } from "@/lib/import/watchHistorySources";
import type { WatchItem } from "@/types/watch";

type DriveTakeoutImportPanelProps = {
  onImported: (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => void | Promise<void>;
};

type DriveImportPhase = "idle" | "auth" | "download" | "parse" | "save" | "done" | "cleanup" | "error";

type DriveImportSummary = {
  fileName: string;
  fileSizeLabel: string;
  itemCount: number;
  skippedCount: number;
  matchedFileName?: string;
  archiveEntryCount?: number;
};

const GOOGLE_TAKEOUT_YOUTUBE_DRIVE_URL = "https://takeout.google.com/settings/takeout/custom/youtube?dest=drive";
const driveTakeoutSource = new GoogleDriveTakeoutWatchHistorySource();

function getDriveConfig() {
  return {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ?? "",
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY ?? "",
    appId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID ?? ""
  };
}

function getMissingConfigLabels(config: ReturnType<typeof getDriveConfig>): string[] {
  const missing: string[] = [];
  if (!config.clientId) {
    missing.push("NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID");
  }
  if (!config.apiKey) {
    missing.push("NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY");
  }
  if (!config.appId) {
    missing.push("NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID");
  }
  return missing;
}

function getPhaseLabel(phase: DriveImportPhase): string {
  switch (phase) {
    case "auth":
      return "Google 권한 확인";
    case "download":
      return "Drive 파일 다운로드";
    case "parse":
      return "Takeout 파싱";
    case "save":
      return "새 기록 저장";
    case "done":
      return "가져오기 완료";
    case "cleanup":
      return "Drive 원본 정리";
    case "error":
      return "확인 필요";
    case "idle":
    default:
      return "대기 중";
  }
}

function getProgressPercent(downloadedBytes: number, totalBytes?: number): number | undefined {
  if (!totalBytes || totalBytes <= 0) {
    return undefined;
  }

  return Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
}

export function DriveTakeoutImportPanel({ onImported }: DriveTakeoutImportPanelProps) {
  const config = useMemo(getDriveConfig, []);
  const isNativeApp = useMemo(() => Capacitor.isNativePlatform(), []);
  const missingConfigLabels = useMemo(() => getMissingConfigLabels(config), [config]);
  const isConfigured = missingConfigLabels.length === 0;
  const isPickerAvailable = isConfigured && !isNativeApp;
  const [phase, setPhase] = useState<DriveImportPhase>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [cleanupTarget, setCleanupTarget] = useState<PickedDriveFile>();
  const [selectedFile, setSelectedFile] = useState<PickedDriveFile>();
  const [downloadProgress, setDownloadProgress] = useState<{ downloadedBytes: number; totalBytes?: number }>();
  const [importSummary, setImportSummary] = useState<DriveImportSummary>();

  const progressPercent = downloadProgress
    ? getProgressPercent(downloadProgress.downloadedBytes, downloadProgress.totalBytes)
    : undefined;

  async function handlePickDriveFile() {
    setErrorMessage("");
    setStatusMessage("Google 계정 권한을 확인하는 중입니다.");
    setCleanupTarget(undefined);
    setImportSummary(undefined);
    setSelectedFile(undefined);
    setDownloadProgress(undefined);
    setPhase("auth");
    setIsPicking(true);

    try {
      const pickedFile = await pickGoogleDriveFile(config);
      if (!pickedFile) {
        setPhase("idle");
        setStatusMessage("Drive 파일 선택을 취소했습니다.");
        return;
      }

      setSelectedFile(pickedFile);
      setStatusMessage(`${pickedFile.name} 파일을 선택했습니다. 다운로드를 시작합니다.`);
      setPhase("download");

      const result = await driveTakeoutSource.import(pickedFile, {
        onStatusChange: (message) => {
          setStatusMessage(message);
          if (message.includes("다운로드")) {
            setPhase("download");
          }
          if (message.includes("파싱") || message.includes("찾는")) {
            setPhase("parse");
          }
        },
        onDownloadProgress: (progress) => {
          setDownloadProgress(progress);
          setPhase("download");
        }
      });

      if (result.items.length === 0) {
        throw new Error("선택한 Drive 파일에서 시청 기록을 찾지 못했습니다.");
      }

      setPhase("save");
      setStatusMessage("새 기록만 저장소에 반영하는 중입니다.");
      await onImported(result.items, result.sourceName, result);

      setCleanupTarget(pickedFile);
      setImportSummary({
        fileName: pickedFile.name,
        fileSizeLabel: formatDriveFileSize(pickedFile.size),
        itemCount: result.items.length,
        skippedCount: result.skippedCount,
        matchedFileName: result.matchedFileName,
        archiveEntryCount: result.archiveEntryCount
      });
      setPhase("done");
      setStatusMessage("가져오기가 끝났습니다. 필요하면 Drive 원본 ZIP을 휴지통으로 이동할 수 있습니다.");
    } catch (error) {
      setPhase("error");
      setErrorMessage(getDriveApiUserMessage(error, "Drive에서 파일을 가져오지 못했습니다."));
    } finally {
      setIsPicking(false);
    }
  }

  async function handleTrashDriveFile() {
    if (!cleanupTarget) {
      return;
    }

    const confirmed = window.confirm(
      `${cleanupTarget.name} 파일을 Google Drive 휴지통으로 이동할까요? 앱에는 분석용 시청 기록만 남습니다.`
    );
    if (!confirmed) {
      return;
    }

    setPhase("cleanup");
    setIsTrashing(true);
    setErrorMessage("");
    setStatusMessage("Drive 원본 파일을 휴지통으로 이동하는 중입니다.");

    try {
      await trashDriveFile(cleanupTarget.accessToken, cleanupTarget.id);
      setStatusMessage("Drive 원본 파일을 휴지통으로 이동했습니다.");
      setCleanupTarget(undefined);
      setPhase("done");
    } catch (error) {
      setPhase("error");
      setErrorMessage(getDriveApiUserMessage(error, "Drive 원본 파일을 휴지통으로 이동하지 못했습니다."));
    } finally {
      setIsTrashing(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <div>
        <div className="text-xs font-semibold text-slate-700">Drive에서 가져오기</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          웹/PWA에서는 Google Picker로 Drive의 Takeout ZIP 하나만 선택할 수 있습니다. Drive 전체를 검색하지
          않습니다.
        </p>
        {isNativeApp ? (
          <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 text-xs leading-relaxed text-amber-800">
            Android 앱에서는 Google 로그인 스크립트가 WebView에서 막힐 수 있습니다. 위의 기기/Drive ZIP 선택이
            더 안정적입니다.
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href={GOOGLE_TAKEOUT_YOUTUBE_DRIVE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Drive로 Takeout 만들기
        </a>
        <button
          type="button"
          className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!isPickerAvailable || isPicking}
          onClick={() => {
            void handlePickDriveFile();
          }}
        >
          {isPicking ? "가져오는 중" : "Drive ZIP 선택"}
        </button>
      </div>

      <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-slate-700">{getPhaseLabel(phase)}</span>
          {progressPercent !== undefined ? <span className="text-slate-500">{progressPercent}%</span> : null}
        </div>
        {progressPercent !== undefined ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-slate-900" style={{ width: `${progressPercent}%` }} />
          </div>
        ) : null}
        {downloadProgress ? (
          <div className="mt-2 text-xs text-slate-500">
            {formatDriveFileSize(downloadProgress.downloadedBytes)}
            {downloadProgress.totalBytes ? ` / ${formatDriveFileSize(downloadProgress.totalBytes)}` : " 다운로드됨"}
          </div>
        ) : null}
        {statusMessage ? <div className="mt-2 text-xs leading-relaxed text-slate-600">{statusMessage}</div> : null}
      </div>

      {!isConfigured ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          Google Cloud 설정이 필요합니다: {missingConfigLabels.join(", ")}
        </div>
      ) : null}

      {selectedFile ? (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">
          <div className="font-semibold text-slate-800">선택한 파일</div>
          <div className="mt-1 truncate">{selectedFile.name}</div>
          <div className="mt-1 text-slate-500">
            {formatDriveFileSize(selectedFile.size)}
            {selectedFile.capabilities?.canTrash === false
              ? " · 앱에서 휴지통 이동 불가"
              : " · 가져오기 후 정리 가능"}
          </div>
        </div>
      ) : null}

      {importSummary ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-800">
          <div className="font-semibold">가져오기 결과</div>
          <div className="mt-1">읽은 시청 기록 {importSummary.itemCount}개</div>
          {importSummary.skippedCount > 0 ? <div>읽지 못한 항목 {importSummary.skippedCount}개</div> : null}
          <div>원본 크기 {importSummary.fileSizeLabel}</div>
          {importSummary.archiveEntryCount ? <div>ZIP 내부 파일 {importSummary.archiveEntryCount}개 확인</div> : null}
          {importSummary.matchedFileName ? <div className="truncate">사용한 파일 {importSummary.matchedFileName}</div> : null}
        </div>
      ) : null}

      {cleanupTarget ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2">
          <div className="text-xs leading-relaxed text-slate-600">
            가져오기 성공 후에는 Drive 공간 정리를 위해 원본 ZIP을 휴지통으로 보낼 수 있습니다.
          </div>
          <button
            type="button"
            className="w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isTrashing || cleanupTarget.capabilities?.canTrash === false}
            onClick={() => {
              void handleTrashDriveFile();
            }}
          >
            {isTrashing ? "휴지통으로 이동 중" : "Drive 원본 ZIP 휴지통으로 이동"}
          </button>
          {cleanupTarget.capabilities?.canTrash === false ? (
            <div className="text-xs leading-relaxed text-slate-500">
              이 파일은 앱에서 휴지통으로 이동할 수 없습니다. Drive에서 직접 삭제해주세요.
            </div>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
