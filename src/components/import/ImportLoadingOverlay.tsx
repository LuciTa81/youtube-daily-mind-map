"use client";

import { useEffect, useMemo, useState } from "react";
import type { NativeDriveImportProgress } from "@/lib/native/nativeDriveFile";

type ImportLoadingOverlayProps = {
  open: boolean;
  progress?: NativeDriveImportProgress;
  statusMessage?: string;
  isNativeDriveImport: boolean;
};

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) {
    return "";
  }

  const gigabytes = bytes / 1024 / 1024 / 1024;
  if (gigabytes >= 1) {
    return `${gigabytes.toFixed(2)}GB`;
  }

  const megabytes = bytes / 1024 / 1024;
  return `${Math.max(1, Math.round(megabytes))}MB`;
}

function getFallbackMessage(isNativeDriveImport: boolean, statusMessage?: string): string {
  if (statusMessage && !statusMessage.includes("선택해주세요")) {
    return statusMessage;
  }

  return isNativeDriveImport
    ? "Drive ZIP에서 YouTube 시청 기록을 찾는 중입니다."
    : "Takeout 파일을 읽는 중입니다.";
}

export function ImportLoadingOverlay({
  open,
  progress,
  statusMessage,
  isNativeDriveImport
}: ImportLoadingOverlayProps) {
  const [estimatedProgress, setEstimatedProgress] = useState(7);

  useEffect(() => {
    if (!open) {
      setEstimatedProgress(7);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setEstimatedProgress((current) => {
        if (current >= 88) {
          return current;
        }

        const nextStep = current < 45 ? 3 : current < 72 ? 2 : 1;
        return Math.min(88, current + nextStep);
      });
    }, 950);

    return () => window.clearInterval(intervalId);
  }, [open]);

  const measuredProgress = progress?.phase === "complete" ? 100 : progress?.percent ?? 0;
  const displayProgress = Math.max(2, Math.min(100, Math.max(measuredProgress, estimatedProgress)));
  const radius = 96;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (displayProgress / 100) * circumference;

  const fileSizeLabel = useMemo(() => {
    const bytesRead = formatBytes(progress?.bytesRead);
    const totalBytes = formatBytes(progress?.totalBytes);
    if (bytesRead && totalBytes) {
      return `${bytesRead} / ${totalBytes}`;
    }

    return totalBytes;
  }, [progress?.bytesRead, progress?.totalBytes]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-10 text-slate-950">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-100/80" />
      <div className="pointer-events-none absolute -right-20 top-20 h-56 w-56 rounded-full bg-violet-100/70" />
      <div className="pointer-events-none absolute bottom-24 left-8 h-44 w-44 rounded-full bg-blue-100/70" />
      <div className="pointer-events-none absolute bottom-0 right-6 h-72 w-72 rounded-full bg-slate-200/50" />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <p className="text-lg font-semibold leading-snug text-slate-800">
          {isNativeDriveImport
            ? "Drive에서 시청 기록을 꺼내는 중입니다."
            : "Takeout 파일을 분석하는 중입니다."}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          앱을 닫지 말고 잠시만 기다려주세요.
        </p>

        <div className="relative mt-12 h-64 w-64">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-blue-100"
            />
            <circle
              cx="120"
              cy="120"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-sky-600 transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-black text-slate-950">{displayProgress}%</div>
            <div className="mt-3 text-sm font-semibold text-slate-500">
              {progress?.itemCount ? `${progress.itemCount}개 기록 확인` : progress?.entryCount ? `${progress.entryCount}개 파일 확인` : "기록 찾는 중"}
            </div>
          </div>
        </div>

        <div className="mt-8 w-full rounded-xl bg-blue-100 px-4 py-3 text-sm font-semibold text-slate-700">
          {getFallbackMessage(isNativeDriveImport, progress?.message ?? statusMessage)}
        </div>

        <div className="mt-4 min-h-6 text-sm font-semibold text-sky-700">
          {fileSizeLabel || "큰 ZIP은 몇 분 정도 걸릴 수 있습니다."}
        </div>
      </div>
    </div>
  );
}
