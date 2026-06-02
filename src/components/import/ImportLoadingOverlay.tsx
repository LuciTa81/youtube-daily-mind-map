"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { NativeDriveImportProgress } from "@/lib/native/nativeDriveFile";

type ImportLoadingOverlayProps = {
  open: boolean;
  progress?: NativeDriveImportProgress;
  statusMessage?: string;
  isNativeDriveImport: boolean;
  onGoHome?: () => void;
};

type ProgressKeyframe = {
  timeMs: number;
  percent: number;
};

type LoadingLine = {
  timeMs: number;
  title: string;
  note: string;
};

type PhaseCopyLine = {
  title: string;
  note: string;
};

type TransferStats = {
  speedBytesPerSecond?: number;
  etaSeconds?: number;
  stalledSeconds?: number;
};

const FALLBACK_PROGRESS_CURVE: ProgressKeyframe[] = [
  { timeMs: 0, percent: 0 },
  { timeMs: 1600, percent: 2 },
  { timeMs: 4200, percent: 6 },
  { timeMs: 9000, percent: 11 },
  { timeMs: 15000, percent: 14 },
  { timeMs: 22000, percent: 17 },
  { timeMs: 30000, percent: 19 },
  { timeMs: 42000, percent: 22 },
  { timeMs: 50000, percent: 23 },
  { timeMs: 60000, percent: 30 },
  { timeMs: 70000, percent: 39 },
  { timeMs: 80000, percent: 51 },
  { timeMs: 95000, percent: 57 },
  { timeMs: 115000, percent: 63 },
  { timeMs: 135000, percent: 67 },
  { timeMs: 155000, percent: 70 },
  { timeMs: 170000, percent: 90 },
  { timeMs: 185000, percent: 97 },
  { timeMs: 210000, percent: 98 }
];

const LOADING_LINES: LoadingLine[] = [
  {
    timeMs: 0,
    title: "시청 기록을 깨우는 중입니다.",
    note: "화면을 끄지 말고 잠시만 기다려 주세요."
  },
  {
    timeMs: 8500,
    title: "Drive에서 하루의 흔적을 꺼내고 있어요.",
    note: "큰 Takeout은 준비에 시간이 조금 걸릴 수 있습니다."
  },
  {
    timeMs: 22000,
    title: "ZIP 안에서 YouTube 기록을 찾는 중입니다.",
    note: "압축을 풀지 않고 필요한 파일만 고르고 있어요."
  },
  {
    timeMs: 38000,
    title: "기록을 날짜별로 정돈하고 있습니다.",
    note: "이미 가져온 기록은 나중에 중복으로 저장하지 않습니다."
  },
  {
    timeMs: 62000,
    title: "잠깐 머물러도 정상입니다.",
    note: "대용량 파일은 Drive에서 읽어오는 단계가 가장 오래 걸립니다."
  },
  {
    timeMs: 92000,
    title: "시청 기록을 앱 안에 안전하게 옮기는 중입니다.",
    note: "원본 ZIP은 분석 후 바로 지워지지 않습니다."
  },
  {
    timeMs: 125000,
    title: "마인드맵으로 바꿀 준비를 하고 있습니다.",
    note: "제목, 채널, 시청 시각을 차례로 정리합니다."
  },
  {
    timeMs: 160000,
    title: "거의 다 왔습니다.",
    note: "마지막 기록을 확인하고 화면에 반영하고 있어요."
  }
];

const DRIVE_OPENING_LINES: Array<LoadingLine & PhaseCopyLine> = [
  {
    timeMs: 0,
    title: "Drive 파일을 준비하는 중입니다.",
    note: "Google Drive가 큰 ZIP을 앱에 넘겨줄 준비를 하고 있어요."
  },
  {
    timeMs: 14000,
    title: "Drive 응답을 기다리고 있습니다.",
    note: "아직 앱이 복사를 시작하기 전입니다. 큰 Takeout은 여기서 오래 머무를 수 있습니다."
  },
  {
    timeMs: 60000,
    title: "Drive가 파일을 여는 중입니다.",
    note: "진행률이 낮게 보여도 정상입니다. 스트림이 열리면 복사는 빠르게 진행될 수 있습니다."
  },
  {
    timeMs: 150000,
    title: "아직 Drive 준비 단계입니다.",
    note: "1GB가 넘는 ZIP은 Drive가 앱에 넘겨주기까지 몇 분 걸릴 수 있습니다."
  }
];

const DRIVE_COPY_LINES: Array<LoadingLine & PhaseCopyLine> = [
  {
    timeMs: 0,
    title: "파일 복사를 시작했습니다.",
    note: "Drive 스트림이 열렸고, 이제 ZIP을 앱 캐시로 옮기고 있습니다."
  },
  {
    timeMs: 14000,
    title: "Drive에서 앱으로 복사하고 있습니다.",
    note: "복사량이 보이기 시작하면 실제 파일 이동이 진행 중입니다."
  },
  {
    timeMs: 45000,
    title: "대용량 Takeout을 옮기는 중입니다.",
    note: "진행률이 천천히 움직여도 앱이 계속 복사 상태를 확인하고 있습니다."
  },
  {
    timeMs: 90000,
    title: "아직 정상적으로 복사 중입니다.",
    note: "1GB가 넘는 ZIP은 몇 분 정도 걸릴 수 있습니다. 화면을 끄지 말고 기다려 주세요."
  }
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

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

function formatRate(bytesPerSecond?: number): string {
  if (!bytesPerSecond || bytesPerSecond <= 0) {
    return "";
  }

  const megabytes = bytesPerSecond / 1024 / 1024;
  if (megabytes >= 1) {
    return `${megabytes.toFixed(1)}MB/s`;
  }

  const kilobytes = bytesPerSecond / 1024;
  return `${Math.max(1, Math.round(kilobytes))}KB/s`;
}

function formatRemaining(seconds?: number): string {
  if (!seconds || seconds <= 0 || !Number.isFinite(seconds)) {
    return "";
  }

  if (seconds < 60) {
    return `약 ${Math.max(1, Math.ceil(seconds))}초 남음`;
  }

  return `약 ${Math.ceil(seconds / 60)}분 남음`;
}

function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}초 경과`;
  }

  return `${minutes}분 ${seconds.toString().padStart(2, "0")}초 경과`;
}

function interpolateProgressCurve(elapsedMs: number): number {
  const keyframes = FALLBACK_PROGRESS_CURVE;
  if (elapsedMs <= keyframes[0].timeMs) {
    return keyframes[0].percent;
  }

  for (let index = 1; index < keyframes.length; index += 1) {
    const previous = keyframes[index - 1];
    const next = keyframes[index];

    if (elapsedMs <= next.timeMs) {
      const segmentProgress = (elapsedMs - previous.timeMs) / (next.timeMs - previous.timeMs);
      const eased = 1 - Math.pow(1 - segmentProgress, 2);
      return previous.percent + (next.percent - previous.percent) * eased;
    }
  }

  return keyframes[keyframes.length - 1].percent;
}

function getTargetProgress(progress: NativeDriveImportProgress | undefined, elapsedMs: number): number {
  const fallbackProgress = interpolateProgressCurve(elapsedMs);

  if (!progress) {
    return clamp(fallbackProgress, 0, 88);
  }

  if (progress.phase === "complete") {
    return 100;
  }

  const measuredProgress = clamp(progress.percent, 0, 98);

  if (progress.phase === "error") {
    return measuredProgress;
  }

  if (progress.phase === "opening") {
    return clamp(Math.max(fallbackProgress, measuredProgress), 0, 8);
  }

  if (progress.phase === "copying") {
    const honestVisualCap = Math.min(78, Math.max(12, measuredProgress + 14));
    return clamp(Math.max(fallbackProgress, measuredProgress), 0, honestVisualCap);
  }

  if (progress.phase === "scanning") {
    return clamp(Math.max(fallbackProgress, measuredProgress, 74), 74, 86);
  }

  if (progress.phase === "parsing" || progress.phase === "reading") {
    return clamp(Math.max(fallbackProgress, measuredProgress, 82), 82, 98);
  }

  if (progress.phase === "finalizing") {
    return clamp(Math.max(fallbackProgress, progress.percent, 98), 98, 99);
  }

  return clamp(Math.max(fallbackProgress, measuredProgress), 0, 98);
}

function getProgressSpeed(current: number, target: number, progress?: NativeDriveImportProgress): number {
  if (progress?.phase === "complete") {
    return 0.09;
  }

  if (target - current > 24) {
    return 0.018;
  }

  if (current < 24) {
    return 0.0058;
  }

  if (current < 72) {
    return 0.009;
  }

  if (current < 94) {
    return 0.0055;
  }

  return 0.0018;
}

function getActiveLoadingLine(elapsedMs: number): LoadingLine {
  let activeLine = LOADING_LINES[0];
  for (const line of LOADING_LINES) {
    if (elapsedMs >= line.timeMs) {
      activeLine = line;
    }
  }

  return activeLine;
}

function getActiveDriveOpeningLine(elapsedMs: number): PhaseCopyLine {
  let activeLine = DRIVE_OPENING_LINES[0];
  for (const line of DRIVE_OPENING_LINES) {
    if (elapsedMs >= line.timeMs) {
      activeLine = line;
    }
  }

  return {
    title: activeLine.title,
    note: activeLine.note
  };
}

function getActiveDriveCopyLine(elapsedMs: number): PhaseCopyLine {
  let activeLine = DRIVE_COPY_LINES[0];
  for (const line of DRIVE_COPY_LINES) {
    if (elapsedMs >= line.timeMs) {
      activeLine = line;
    }
  }

  return {
    title: activeLine.title,
    note: activeLine.note
  };
}

function getDisplayLoadingLine(progress: NativeDriveImportProgress | undefined, elapsedMs: number): LoadingLine | PhaseCopyLine {
  if (progress?.phase === "opening") {
    return getActiveDriveOpeningLine(elapsedMs);
  }

  if (progress?.phase === "copying") {
    return getActiveDriveCopyLine(elapsedMs);
  }

  return getActiveLoadingLine(elapsedMs);
}

function getPhaseLabel(progress: NativeDriveImportProgress | undefined, isNativeDriveImport: boolean): string {
  if (!progress) {
    return isNativeDriveImport ? "Drive 파일 선택을 기다리는 중입니다." : "Takeout 파일을 읽는 중입니다.";
  }

  switch (progress.phase) {
    case "opening":
      return "Drive ZIP을 여는 중입니다.";
    case "copying":
      return "Drive에서 ZIP을 앱 캐시로 복사하는 중입니다.";
    case "scanning":
      return "ZIP 안에서 시청 기록 파일을 찾는 중입니다.";
    case "reading":
    case "parsing":
      return "시청 기록을 정리하는 중입니다.";
    case "finalizing":
      return "마무리 반영 중입니다.";
    case "complete":
      return "분석을 마무리하는 중입니다.";
    default:
      return progress.message;
  }
}

function getDetailLine(
  progress: NativeDriveImportProgress | undefined,
  transferStats: TransferStats,
  elapsedMs: number
): string {
  if (!progress) {
    return "큰 파일은 잠깐 멈춘 것처럼 보여도 계속 처리됩니다.";
  }

  const bytesRead = formatBytes(progress.bytesRead);
  const totalBytes = formatBytes(progress.totalBytes);

  if (progress.phase === "opening" && totalBytes) {
    return `Drive 파일 준비 중 · ${totalBytes} · ${formatElapsed(elapsedMs)}`;
  }

  if (progress.phase === "copying" && totalBytes && !bytesRead) {
    return `파일 복사 시작 중 · ${totalBytes} · ${formatElapsed(elapsedMs)}`;
  }

  if (progress.phase === "copying" && bytesRead && totalBytes) {
    const rate = formatRate(transferStats.speedBytesPerSecond);
    const remaining = formatRemaining(transferStats.etaSeconds);
    const stalled = transferStats.stalledSeconds && transferStats.stalledSeconds >= 8
      ? `${transferStats.stalledSeconds}초째 같은 복사량`
      : "";
    return [`${bytesRead} / ${totalBytes}`, rate, remaining, stalled, formatElapsed(elapsedMs)]
      .filter(Boolean)
      .join(" · ");
  }

  if (progress.itemCount && progress.itemCount > 0) {
    return `${progress.itemCount.toLocaleString("ko-KR")}개 기록 확인`;
  }

  if (progress.entryCount && progress.entryCount > 0) {
    return `${progress.entryCount.toLocaleString("ko-KR")}개 파일 후보 확인`;
  }

  if (totalBytes) {
    return `${totalBytes} 파일 처리 중`;
  }

  return "앱을 닫지 않으면 이어서 완료됩니다.";
}

function getPhaseSupportTitle(progress: NativeDriveImportProgress | undefined): string {
  if (progress?.phase === "opening") {
    return "Drive 준비 상태";
  }

  if (progress?.phase === "finalizing") {
    return "마무리 반영 상태";
  }

  return "Drive 복사 상태";
}

function getPhaseSupportLine(progress: NativeDriveImportProgress | undefined, elapsedMs: number): string | undefined {
  if (progress?.phase !== "opening" && progress?.phase !== "copying" && progress?.phase !== "finalizing") {
    return undefined;
  }

  const totalBytes = formatBytes(progress.totalBytes);
  const bytesRead = formatBytes(progress.bytesRead);

  if (progress.phase === "opening") {
    return `Drive 파일 준비 중 · ${totalBytes || "크기 확인 중"} · ${formatElapsed(elapsedMs)}`;
  }

  if (progress.phase === "finalizing") {
    const count = progress.itemCount && progress.itemCount > 0
      ? `${progress.itemCount.toLocaleString("ko-KR")}개 기록`
      : "시청 기록";
    return `마무리 반영 중 · ${count} · ${formatElapsed(elapsedMs)}`;
  }

  if (!bytesRead) {
    return `파일 복사 시작 중 · ${totalBytes || "크기 확인 중"} · ${formatElapsed(elapsedMs)}`;
  }

  return `복사 단계 · ${bytesRead}${totalBytes ? ` / ${totalBytes}` : ""} · ${formatElapsed(elapsedMs)}`;
}

export function ImportLoadingOverlay({
  open,
  progress,
  statusMessage,
  isNativeDriveImport,
  onGoHome
}: ImportLoadingOverlayProps) {
  const progressRef = useRef<NativeDriveImportProgress | undefined>(progress);
  const transferSampleRef = useRef<{ bytesRead: number; timeMs: number } | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);
  const previousFrameTimeRef = useRef<number | undefined>(undefined);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [visualProgress, setVisualProgress] = useState(0);
  const [transferStats, setTransferStats] = useState<TransferStats>({});
  const [showCompletionAction, setShowCompletionAction] = useState(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (!open || progress?.phase !== "copying" || !progress.bytesRead) {
      transferSampleRef.current = undefined;
      setTransferStats({});
      return;
    }

    const now = Date.now();
    const previous = transferSampleRef.current;
    if (previous && progress.bytesRead > previous.bytesRead && now > previous.timeMs) {
      const speedBytesPerSecond = ((progress.bytesRead - previous.bytesRead) / (now - previous.timeMs)) * 1000;
      const remainingBytes = Math.max(0, (progress.totalBytes ?? 0) - progress.bytesRead);
      setTransferStats({
        speedBytesPerSecond,
        etaSeconds: speedBytesPerSecond > 0 && remainingBytes > 0 ? remainingBytes / speedBytesPerSecond : undefined,
        stalledSeconds: 0
      });
    } else if (previous && progress.bytesRead === previous.bytesRead) {
      setTransferStats((current) => ({
        ...current,
        stalledSeconds: Math.round((now - previous.timeMs) / 1000)
      }));
    }

    transferSampleRef.current = {
      bytesRead: progress.bytesRead,
      timeMs: now
    };
  }, [open, progress?.bytesRead, progress?.phase, progress?.totalBytes]);

  useEffect(() => {
    if (!open) {
      setElapsedMs(0);
      setVisualProgress(0);
      setShowCompletionAction(false);
      transferSampleRef.current = undefined;
      startTimeRef.current = undefined;
      previousFrameTimeRef.current = undefined;
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return undefined;
    }

    const tick = (now: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = now;
        previousFrameTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const deltaMs = Math.max(16, now - (previousFrameTimeRef.current ?? now));
      previousFrameTimeRef.current = now;

      setElapsedMs(elapsed);
      setVisualProgress((current) => {
        const currentProgress = progressRef.current;
        const target = getTargetProgress(currentProgress, elapsed);
        if (current >= target) {
          return current;
        }

        const difference = target - current;
        const easingStep = difference * 0.045;
        const speedStep = deltaMs * getProgressSpeed(current, target, currentProgress);
        const minimumStep = currentProgress?.phase === "complete" ? 0.18 : 0.012;
        const nextStep = clamp(Math.max(minimumStep, Math.min(easingStep, speedStep)), 0, difference);

        return clamp(current + nextStep, 0, 100);
      });

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [open]);

  const activeLine = useMemo(() => getDisplayLoadingLine(progress, elapsedMs), [elapsedMs, progress]);
  const phaseLabel = getPhaseLabel(progress, isNativeDriveImport);
  const detailLine = getDetailLine(progress, transferStats, elapsedMs);
  const phaseSupportLine = getPhaseSupportLine(progress, elapsedMs);
  const isComplete = progress?.phase === "complete" && visualProgress >= 99;
  const nonCompleteProgressCap = progress?.phase === "finalizing" ? 99 : 98;
  const safeProgress = progress?.phase === "complete" ? visualProgress : Math.min(nonCompleteProgressCap, visualProgress);
  const displayProgress = isComplete ? 100 : Math.floor(clamp(safeProgress, 0, 100));
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamp(safeProgress, 0, 100) / 100) * circumference;
  const shouldShowPatienceNote = elapsedMs > 12000 || (progress?.totalBytes ?? 0) > 700 * 1024 * 1024;

  useEffect(() => {
    if (!isComplete) {
      setShowCompletionAction(false);
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setShowCompletionAction(true);
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [isComplete]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-6 py-10 text-slate-950">
      <style>{`
        @keyframes import-blob-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(18px, -20px, 0) scale(1.06); }
        }

        @keyframes import-blob-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-16px, 18px, 0) scale(1.08); }
        }

        @keyframes import-blob-c {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(12px, 16px, 0) scale(1.05); }
        }

        @keyframes import-orbit {
          0% { opacity: 0; transform: scale(0.78) rotate(0deg); }
          32% { opacity: 0.9; }
          100% { opacity: 0; transform: scale(1.36) rotate(260deg); }
        }

        @keyframes import-pop {
          0% { opacity: 0; transform: scale(0.72); }
          72% { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes import-spark {
          0% { opacity: 0; transform: translateY(8px) scale(0.7); }
          50% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-18px) scale(1.15); }
        }
      `}</style>

      <div
        className="pointer-events-none absolute -left-36 top-4 h-[25rem] w-[25rem] rounded-full bg-sky-100/65"
        style={{ animation: "import-blob-a 8s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -right-32 top-12 h-[21rem] w-[21rem] rounded-full bg-violet-100/60"
        style={{ animation: "import-blob-b 9.5s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-16 left-3 h-60 w-60 rounded-full bg-blue-100/55"
        style={{ animation: "import-blob-c 10.5s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-0 h-[23rem] w-[23rem] rounded-full bg-slate-200/42"
        style={{ animation: "import-blob-b 12s ease-in-out infinite" }}
      />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <div className="min-h-[92px]">
          <p className="text-xl font-bold leading-snug text-slate-900">
            {isComplete ? "기록 정리 완료!" : activeLine.title}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            {isComplete ? "마인드맵에 반영했습니다." : activeLine.note}
          </p>
        </div>

        <div className="relative mt-8 h-72 w-72">
          {progress?.phase === "complete" ? (
            <>
              <div
                className="absolute inset-5 rounded-full border border-slate-300/80 border-r-sky-600 border-t-sky-600"
                style={{ animation: "import-orbit 1.25s ease-out forwards" }}
              />
              <div
                className="absolute inset-1 rounded-full border border-slate-300/60 border-b-sky-500"
                style={{ animation: "import-orbit 1.45s ease-out 120ms forwards" }}
              />
            </>
          ) : (
            <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="9"
                className="text-blue-100"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-sky-600 transition-[stroke-dashoffset] duration-200 ease-out"
              />
            </svg>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isComplete ? (
              <div className="relative" style={{ animation: "import-pop 420ms ease-out forwards" }}>
                <svg className="h-28 w-28 text-slate-700" viewBox="0 0 240 240" aria-hidden="true">
                  <path
                    d="M70 124 L104 156 L174 84"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="butt"
                    strokeLinejoin="miter"
                    strokeWidth="12"
                  />
                </svg>
                <span
                  className="absolute -right-1 top-5 h-2.5 w-2.5 rounded-full bg-sky-400"
                  style={{ animation: "import-spark 900ms ease-out 120ms forwards" }}
                />
                <span
                  className="absolute left-2 top-12 h-2 w-2 rounded-full bg-violet-400"
                  style={{ animation: "import-spark 860ms ease-out 220ms forwards" }}
                />
                <span
                  className="absolute bottom-5 right-5 h-2 w-2 rounded-full bg-blue-300"
                  style={{ animation: "import-spark 820ms ease-out 320ms forwards" }}
                />
              </div>
            ) : (
              <>
                <div className="text-5xl font-black tracking-tight text-slate-950">{displayProgress}%</div>
                <div className="mt-3 max-w-64 text-sm font-semibold leading-relaxed text-slate-500">{detailLine}</div>
              </>
            )}
          </div>
        </div>

        <div className="mt-7 w-full rounded-2xl bg-blue-100 px-4 py-3 text-sm font-semibold text-slate-700">
          {phaseLabel}
        </div>

        {phaseSupportLine && !isComplete ? (
          <div className="mt-3 w-full rounded-2xl border border-sky-100 bg-white/90 px-4 py-3 text-left shadow-sm">
            <div className="text-xs font-bold text-sky-700">{getPhaseSupportTitle(progress)}</div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600">{phaseSupportLine}</div>
            <div className="mt-2 text-[11px] leading-relaxed text-slate-400">
              {progress?.phase === "finalizing"
                ? "이 구간은 새 기록을 저장소와 화면에 반영하는 단계라 98% 근처에서 잠시 머무를 수 있습니다."
                : "이 구간은 Drive가 ZIP을 앱에 넘겨주는 단계라 진행률이 잠시 같은 숫자에 머무를 수 있습니다."}
            </div>
          </div>
        ) : null}

        <div className="mt-4 min-h-6 text-sm font-semibold text-sky-700">
          {isComplete ? "완료되었습니다. 아래 버튼으로 홈으로 이동할 수 있습니다." : statusMessage || "조금만 더 기다려 주세요."}
        </div>

        {isComplete && showCompletionAction ? (
          <button
            type="button"
            className="mt-6 min-h-12 rounded-2xl bg-slate-800 px-7 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-700 active:scale-[0.98]"
            onClick={onGoHome}
          >
            홈화면으로 돌아가기
          </button>
        ) : null}

        {shouldShowPatienceNote && !isComplete ? (
          <div className="mt-6 w-full rounded-2xl bg-white/90 px-4 py-3 text-left text-xs leading-relaxed text-slate-500 shadow-sm ring-1 ring-slate-200">
            대용량 Takeout은 Drive에서 앱으로 옮기는 단계가 오래 걸릴 수 있습니다. 진행률이 잠깐 머물러도 앱을 닫지 않으면 계속 처리됩니다.
          </div>
        ) : null}
      </div>
    </div>
  );
}
