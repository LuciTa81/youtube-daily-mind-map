"use client";

import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import {
  getVideoMemoryTagLabel,
  VIDEO_MEMORY_TAG_OPTIONS
} from "@/lib/share/videoMemory";
import type { VideoMemoryTag, WatchItem } from "@/types/watch";

type SharedMemoryPromptProps = {
  item: WatchItem;
  tag: VideoMemoryTag;
  note: string;
  onTagChange: (tag: VideoMemoryTag) => void;
  onNoteChange: (note: string) => void;
  onSave: () => void | Promise<void>;
  onDismiss: () => void;
};

export function SharedMemoryPrompt({
  item,
  tag,
  note,
  onTagChange,
  onNoteChange,
  onSave,
  onDismiss
}: SharedMemoryPromptProps) {
  const metadata = getVideoMetadata(item);

  return (
    <section
      aria-label="공유한 영상 메모"
      className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-sky-600">YouTube 공유</div>
          <h2 className="mt-1 text-base font-black text-slate-950">왜 저장했는지 남겨둘까요?</h2>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            태그와 한 줄 메모는 기기 안에 저장되고, 나중에 하루 회고에서 다시 볼 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500"
          onClick={onDismiss}
        >
          나중에
        </button>
      </div>

      <div className="mt-4 flex gap-3 rounded-xl bg-slate-50 p-2">
        {metadata.thumbnailUrl ? (
          <img
            src={metadata.thumbnailUrl}
            alt=""
            className="h-16 w-24 shrink-0 rounded-lg object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[11px] font-bold text-slate-400">
            썸네일 없음
          </div>
        )}
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-bold leading-snug text-slate-950">{item.title}</div>
          <div className="mt-2 text-xs text-slate-500">{item.channelName ?? "채널 없음"}</div>
          <div className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
            {getVideoMemoryTagLabel(tag)}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {VIDEO_MEMORY_TAG_OPTIONS.map((option) => {
          const selected = option.value === tag;
          return (
            <button
              key={option.value}
              type="button"
              className={`rounded-xl border px-3 py-2 text-left transition ${
                selected
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => onTagChange(option.value)}
            >
              <div className="text-xs font-black">{option.label}</div>
              <div className={`mt-1 text-[11px] leading-snug ${selected ? "text-slate-200" : "text-slate-500"}`}>
                {option.description}
              </div>
            </button>
          );
        })}
      </div>

      <textarea
        className="mt-3 min-h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder="예: 이 영상은 포트폴리오 만들 때 다시 보기"
      />

      <button
        type="button"
        className="mt-3 w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-sky-600"
        onClick={() => {
          void onSave();
        }}
      >
        메모 저장
      </button>
    </section>
  );
}
