"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { getVideoLibraryFilterLabel, type VideoLibraryRemoveStatus } from "@/lib/library/videoLibrary";
import {
  getVideoMemorySummary,
  VIDEO_MEMORY_TAG_OPTIONS,
  type VideoMemoryDraft
} from "@/lib/share/videoMemory";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { ClassifiedWatchItem, DateSettings, VideoMemoryTag } from "@/types/watch";

type VideoDetailPageProps = {
  item?: ClassifiedWatchItem;
  dateSettings: DateSettings;
  onBack: () => void;
  onVideoMemorySave?: (itemId: string, draft: VideoMemoryDraft) => void | Promise<void>;
  onVideoMemoryRemove?: (itemId: string) => VideoLibraryRemoveStatus | void | Promise<VideoLibraryRemoveStatus | void>;
};

function formatDateTime(value: string | undefined, timezone: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return formatInTimeZone(date, timezone, "yyyy.MM.dd HH:mm");
}

function getSourceLabel(item: ClassifiedWatchItem): string {
  if (item.source === "manual") {
    return "YouTube 공유";
  }

  if (item.source === "sample") {
    return "샘플";
  }

  return "Takeout";
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 text-sm last:border-b-0">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="min-w-0 text-right font-bold text-slate-900">{value ?? "없음"}</span>
    </div>
  );
}

function isTakeoutBackedRecord(item: ClassifiedWatchItem): boolean {
  return item.source === "takeout-html" || item.source === "takeout-json";
}

function getRemoveActionCopy(item: ClassifiedWatchItem): { label: string; helper: string } | undefined {
  if (item.source === "manual") {
    return {
      label: "저장한 영상 삭제",
      helper: "직접 저장한 기록은 저장함, 홈, 타임라인, 리포트에서 제거됩니다."
    };
  }

  if (isTakeoutBackedRecord(item) && (item.memoryTag || item.memoryNote?.trim())) {
    return {
      label: "저장함에서 제거",
      helper: "Takeout 시청 기록은 날짜별 기록과 리포트에 남고, 저장함 메모만 해제됩니다."
    };
  }

  return undefined;
}

function getRemoveStatusText(status: VideoLibraryRemoveStatus | void): string {
  if (status === "memory-cleared") {
    return "저장함에서 제거했습니다. Takeout 시청 기록은 그대로 남습니다.";
  }

  if (status === "record-deleted") {
    return "저장한 영상을 삭제했습니다.";
  }

  if (status === "not-found") {
    return "이미 삭제되었거나 찾을 수 없는 영상입니다.";
  }

  if (status === "unsupported-source") {
    return "이 샘플 기록은 저장함에서 제거할 수 없습니다.";
  }

  return "요청을 처리했습니다.";
}

function VideoMemoryEditForm({
  item,
  onSave
}: {
  item: ClassifiedWatchItem;
  onSave?: (itemId: string, draft: VideoMemoryDraft) => void | Promise<void>;
}) {
  const [tag, setTag] = useState<VideoMemoryTag>(item.memoryTag ?? "saved");
  const [note, setNote] = useState(item.memoryNote ?? "");
  const [statusText, setStatusText] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const canEdit = Boolean(onSave);

  useEffect(() => {
    setTag(item.memoryTag ?? "saved");
    setNote(item.memoryNote ?? "");
  }, [item.id, item.memoryNote, item.memoryTag]);

  useEffect(() => {
    setStatusText(undefined);
  }, [item.id]);

  return (
    <section className="rounded-lg bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-500">내 메모</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            이 영상을 왜 남겼는지 태그와 한 줄 메모로 정리해둡니다.
          </p>
        </div>
        {item.memoryUpdatedAt ? (
          <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-500">
            저장됨
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {VIDEO_MEMORY_TAG_OPTIONS.map((option) => {
          const selected = option.value === tag;

          return (
            <button
              key={option.value}
              type="button"
              disabled={!canEdit || isSaving}
              className={`min-h-11 rounded-lg border px-2 text-left text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => setTag(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <textarea
        className="mt-3 min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        value={note}
        disabled={!canEdit || isSaving}
        onChange={(event) => setNote(event.target.value)}
        placeholder="나중에 떠올릴 한 줄 메모"
      />

      {canEdit ? (
        <button
          type="button"
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-black text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSaving}
          onClick={() => {
            void (async () => {
              if (!onSave) {
                return;
              }

              setIsSaving(true);
              setStatusText(undefined);
              try {
                await onSave(item.id, { tag, note });
                setStatusText("저장함과 홈에 반영했습니다.");
              } finally {
                setIsSaving(false);
              }
            })();
          }}
        >
          {isSaving ? "저장 중" : "태그와 메모 저장"}
        </button>
      ) : (
        <p className="mt-3 rounded-lg bg-white p-3 text-xs leading-relaxed text-slate-500">
          저장된 기록에서 선택한 영상만 태그와 메모를 수정할 수 있습니다.
        </p>
      )}

      {statusText ? (
        <p className="mt-3 rounded-lg bg-sky-50 p-3 text-xs font-bold leading-relaxed text-sky-700">
          {statusText}
        </p>
      ) : null}
    </section>
  );
}

export function VideoDetailPage({
  item,
  dateSettings,
  onBack,
  onVideoMemorySave,
  onVideoMemoryRemove
}: VideoDetailPageProps) {
  const [removeStatusText, setRemoveStatusText] = useState<string>();
  const [isRemoving, setIsRemoving] = useState(false);
  const metadata = item ? getVideoMetadata(item) : undefined;
  const memorySummary = item
    ? getVideoMemorySummary(item) ?? getVideoLibraryFilterLabel(item.memoryTag ?? "saved")
    : undefined;
  const recordTime = item ? formatDateTime(item.watchedAt, dateSettings.timezone) : undefined;
  const memoryUpdatedTime = item ? formatDateTime(item.memoryUpdatedAt, dateSettings.timezone) : undefined;
  const removeActionCopy = item ? getRemoveActionCopy(item) : undefined;

  useEffect(() => {
    setRemoveStatusText(undefined);
    setIsRemoving(false);
  }, [item?.id]);

  if (!item) {
    return (
      <section className="space-y-4">
        <button
          type="button"
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
          onClick={onBack}
        >
          저장함으로 돌아가기
        </button>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">영상을 찾을 수 없습니다</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            이 항목은 이미 삭제되었거나 현재 저장함 목록에 없습니다.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm"
        onClick={onBack}
      >
        저장함으로 돌아가기
      </button>

      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {metadata?.thumbnailUrl ? (
          <img
            src={metadata.thumbnailUrl}
            alt=""
            className="aspect-video w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-slate-100 text-sm font-bold text-slate-400">
            썸네일 없음
          </div>
        )}

        <div className="space-y-4 p-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                {memorySummary}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {getSourceLabel(item)}
              </span>
            </div>
            <h2 className="mt-3 text-xl font-black leading-snug text-slate-950">{item.title}</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">{item.channelName ?? "채널 없음"}</p>
          </div>

          <div className="rounded-lg border border-slate-200 px-4">
            <DetailRow label="기록 시각" value={recordTime} />
            <DetailRow label="저장/수정 시각" value={memoryUpdatedTime} />
            <DetailRow label="카테고리" value={item.category} />
            <DetailRow label="출처" value={getSourceLabel(item)} />
          </div>

          <VideoMemoryEditForm item={item} onSave={onVideoMemorySave} />

          {removeActionCopy ? (
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div>
                <h3 className="text-xs font-black text-slate-500">저장함 관리</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{removeActionCopy.helper}</p>
              </div>
              <button
                type="button"
                className="mt-3 flex min-h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!onVideoMemoryRemove || isRemoving}
                onClick={() => {
                  void (async () => {
                    if (!onVideoMemoryRemove) {
                      return;
                    }

                    if (
                      item.source === "manual" &&
                      !window.confirm("저장한 영상을 삭제할까요? 이 기록은 저장함과 리포트에서 제거됩니다.")
                    ) {
                      return;
                    }

                    setIsRemoving(true);
                    setRemoveStatusText(undefined);
                    try {
                      const status = await onVideoMemoryRemove(item.id);
                      setRemoveStatusText(getRemoveStatusText(status));
                    } finally {
                      setIsRemoving(false);
                    }
                  })();
                }}
              >
                {isRemoving ? "처리 중" : removeActionCopy.label}
              </button>
              {removeStatusText ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs font-bold leading-relaxed text-slate-600">
                  {removeStatusText}
                </p>
              ) : null}
            </section>
          ) : null}

          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white"
            >
              YouTube에서 열기
            </a>
          ) : (
            <p className="rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
              원본 URL이 없어 YouTube 열기 버튼을 표시하지 않습니다.
            </p>
          )}
        </div>
      </article>
    </section>
  );
}
