"use client";

import { useMemo, useState } from "react";
import { trashDriveFile } from "@/lib/drive/googleDriveApi";
import { pickGoogleDriveFile, type PickedDriveFile } from "@/lib/drive/googlePicker";
import type { ParsedWatchHistory } from "@/lib/import/parseTakeout";
import { GoogleDriveTakeoutWatchHistorySource } from "@/lib/import/watchHistorySources";
import type { WatchItem } from "@/types/watch";

type DriveTakeoutImportPanelProps = {
  onImported: (items: WatchItem[], sourceName: string, result: ParsedWatchHistory) => void | Promise<void>;
};

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
    missing.push("CLIENT_ID");
  }
  if (!config.apiKey) {
    missing.push("API_KEY");
  }
  if (!config.appId) {
    missing.push("APP_ID");
  }
  return missing;
}

export function DriveTakeoutImportPanel({ onImported }: DriveTakeoutImportPanelProps) {
  const config = useMemo(getDriveConfig, []);
  const missingConfigLabels = useMemo(() => getMissingConfigLabels(config), [config]);
  const isConfigured = missingConfigLabels.length === 0;
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPicking, setIsPicking] = useState(false);
  const [isTrashing, setIsTrashing] = useState(false);
  const [cleanupTarget, setCleanupTarget] = useState<PickedDriveFile>();

  async function handlePickDriveFile() {
    setErrorMessage("");
    setStatusMessage("");
    setCleanupTarget(undefined);
    setIsPicking(true);

    try {
      const pickedFile = await pickGoogleDriveFile(config);
      if (!pickedFile) {
        setStatusMessage("Drive 파일 선택을 취소했습니다.");
        return;
      }

      const result = await driveTakeoutSource.import(pickedFile);
      if (result.items.length === 0) {
        throw new Error("선택한 Drive 파일에서 시청 기록을 찾지 못했습니다.");
      }

      await onImported(result.items, result.sourceName, result);
      setCleanupTarget(pickedFile);
      setStatusMessage(`${pickedFile.name} 가져오기가 끝났습니다. Drive 원본을 정리할 수 있습니다.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Drive에서 파일을 가져오지 못했습니다.");
    } finally {
      setIsPicking(false);
    }
  }

  async function handleTrashDriveFile() {
    if (!cleanupTarget) {
      return;
    }

    const confirmed = window.confirm(
      `${cleanupTarget.name} 파일을 Google Drive 휴지통으로 이동할까요? 앱에는 분석용 기록만 남습니다.`
    );
    if (!confirmed) {
      return;
    }

    setIsTrashing(true);
    setErrorMessage("");

    try {
      await trashDriveFile(cleanupTarget.accessToken, cleanupTarget.id);
      setStatusMessage("Drive 원본 파일을 휴지통으로 이동했습니다.");
      setCleanupTarget(undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Drive 원본 파일을 휴지통으로 이동하지 못했습니다.");
    } finally {
      setIsTrashing(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <div>
        <div className="text-xs font-semibold text-slate-700">Drive에서 가져오기</div>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Google Picker에서 선택한 Takeout ZIP 하나만 다운로드합니다.
        </p>
      </div>
      <button
        type="button"
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!isConfigured || isPicking}
        onClick={() => {
          void handlePickDriveFile();
        }}
      >
        {isPicking ? "Drive에서 가져오는 중" : "Drive에서 Takeout 선택"}
      </button>
      {!isConfigured ? (
        <p className="text-xs leading-relaxed text-amber-700">
          Google Cloud 설정이 필요합니다: {missingConfigLabels.join(", ")}
        </p>
      ) : null}
      {cleanupTarget ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2">
          <div className="text-xs leading-relaxed text-slate-600">
            가져오기가 끝났습니다. Drive 공간 정리를 위해 원본 ZIP을 휴지통으로 보낼 수 있습니다.
          </div>
          <button
            type="button"
            className="w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isTrashing || cleanupTarget.capabilities?.canTrash === false}
            onClick={() => {
              void handleTrashDriveFile();
            }}
          >
            {isTrashing ? "휴지통으로 이동 중" : "Drive 원본 휴지통으로 이동"}
          </button>
          {cleanupTarget.capabilities?.canTrash === false ? (
            <div className="text-xs leading-relaxed text-slate-500">
              이 파일은 앱에서 휴지통으로 이동할 수 없습니다. Drive에서 직접 삭제해주세요.
            </div>
          ) : null}
        </div>
      ) : null}
      {statusMessage ? <div className="text-xs leading-relaxed text-slate-600">{statusMessage}</div> : null}
      {errorMessage ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-relaxed text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
