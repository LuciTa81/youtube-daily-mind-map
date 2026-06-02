import type { VideoMemoryTag, WatchItem } from "@/types/watch";

export type VideoMemoryTagOption = {
  value: VideoMemoryTag;
  label: string;
  description: string;
};

export type VideoMemoryDraft = {
  tag: VideoMemoryTag;
  note: string;
};

export const VIDEO_MEMORY_TAG_OPTIONS: VideoMemoryTagOption[] = [
  {
    value: "remember",
    label: "기억할 영상",
    description: "오늘의 회고에 남겨둘 영상"
  },
  {
    value: "review",
    label: "나중에 복습",
    description: "다시 볼 가치가 있는 영상"
  },
  {
    value: "saved",
    label: "그냥 저장",
    description: "가볍게 기록만 남기기"
  }
];

export function getVideoMemoryTagLabel(tag?: VideoMemoryTag): string | undefined {
  return VIDEO_MEMORY_TAG_OPTIONS.find((option) => option.value === tag)?.label;
}

export function getVideoMemorySummary(item: Pick<WatchItem, "memoryTag" | "memoryNote">): string | undefined {
  const label = getVideoMemoryTagLabel(item.memoryTag);
  const note = item.memoryNote?.trim();

  if (label && note) {
    return `${label} · ${note}`;
  }

  return label ?? (note || undefined);
}

export function applyVideoMemoryDraft(
  items: WatchItem[],
  itemId: string,
  draft: VideoMemoryDraft,
  updatedAt = new Date().toISOString()
): WatchItem[] | undefined {
  let found = false;
  const trimmedNote = draft.note.trim();

  const nextItems = items.map((item) => {
    if (item.id !== itemId) {
      return item;
    }

    found = true;
    return {
      ...item,
      memoryTag: draft.tag,
      memoryNote: trimmedNote || undefined,
      memoryUpdatedAt: updatedAt
    };
  });

  return found ? nextItems : undefined;
}
