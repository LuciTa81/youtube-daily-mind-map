"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import type { DaySummary } from "@/lib/analytics/summarizeDay";
import type { TimeBlock } from "@/lib/date/timeBlocks";
import {
  getVideoMemorySummary,
  VIDEO_MEMORY_TAG_OPTIONS,
  type VideoMemoryDraft
} from "@/lib/share/videoMemory";
import { getVideoMetadata } from "@/lib/youtube/videoMetadata";
import type { MindMapNode } from "@/types/mindmap";
import type { ClassifiedWatchItem, DateSettings, VideoMemoryTag } from "@/types/watch";

type NodeDetailRendererProps = {
  node: MindMapNode;
  dateSettings: DateSettings;
  onVideoMemorySave?: (itemId: string, draft: VideoMemoryDraft) => void | Promise<void>;
};

function getItems(node: MindMapNode): ClassifiedWatchItem[] {
  const value = node.meta?.items;
  return Array.isArray(value) ? (value as ClassifiedWatchItem[]) : [];
}

function getItem(node: MindMapNode): ClassifiedWatchItem | undefined {
  const value = node.meta?.item;
  return value && typeof value === "object" ? (value as ClassifiedWatchItem) : undefined;
}

function getSummary(node: MindMapNode): DaySummary | undefined {
  const value = node.meta?.summary;
  return value && typeof value === "object" ? (value as DaySummary) : undefined;
}

function formatWatchedAt(item: ClassifiedWatchItem, timezone: string): string {
  return formatInTimeZone(new Date(item.watchedAt), timezone, "yyyy-MM-dd HH:mm");
}

function VideoMemorySummary({ item }: { item: ClassifiedWatchItem }) {
  const summary = getVideoMemorySummary(item);

  if (!summary) {
    return null;
  }

  return (
    <div className="mt-2 rounded-md bg-sky-50 px-2 py-1 text-[11px] font-bold leading-relaxed text-sky-700">
      {summary}
    </div>
  );
}

function VideoMemoryEditor({
  item,
  onSave
}: {
  item: ClassifiedWatchItem;
  onSave?: (itemId: string, draft: VideoMemoryDraft) => void | Promise<void>;
}) {
  const [tag, setTag] = useState<VideoMemoryTag>(item.memoryTag ?? "remember");
  const [note, setNote] = useState(item.memoryNote ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTag(item.memoryTag ?? "remember");
    setNote(item.memoryNote ?? "");
  }, [item.id, item.memoryNote, item.memoryTag]);

  const canEdit = Boolean(onSave);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-950">영상 메모</h4>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            이 영상을 왜 남겼는지 짧게 적어두면 하루 회고에서 다시 찾기 쉽습니다.
          </p>
        </div>
        {item.memoryUpdatedAt ? (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
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
              className={`rounded-lg border px-2 py-2 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => setTag(option.value)}
            >
              <div className="font-black">{option.label}</div>
            </button>
          );
        })}
      </div>

      <textarea
        className="mt-3 min-h-24 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
        value={note}
        disabled={!canEdit || isSaving}
        onChange={(event) => setNote(event.target.value)}
        placeholder="나중에 떠올릴 한 줄 메모"
      />

      {canEdit ? (
        <button
          type="button"
          className="mt-3 w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-black text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={isSaving}
          onClick={() => {
            void (async () => {
              if (!onSave) {
                return;
              }
              setIsSaving(true);
              try {
                await onSave(item.id, { tag, note });
              } finally {
                setIsSaving(false);
              }
            })();
          }}
        >
          {isSaving ? "저장 중" : "메모 저장"}
        </button>
      ) : (
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
          저장된 기록에서 선택한 영상만 메모를 수정할 수 있습니다.
        </p>
      )}
    </section>
  );
}

function countChannels(items: ClassifiedWatchItem[]): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = item.channelName ?? "채널 없음";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function VideoList({ items, timezone }: { items: ClassifiedWatchItem[]; timezone: string }) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime()
  );

  return (
    <div className="space-y-2">
      {sortedItems.map((item) => {
        const videoMetadata = getVideoMetadata(item);

        return (
        <div key={item.id} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
          {videoMetadata.thumbnailUrl ? (
            <img
              src={videoMetadata.thumbnailUrl}
              alt=""
              className="h-16 w-24 shrink-0 rounded-md object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-400">
              썸네일 없음
            </div>
          )}
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-500">
              {formatWatchedAt(item, timezone)}
            </div>
            <div className="mt-1 text-sm font-semibold leading-snug text-slate-900">{item.title}</div>
            <div className="mt-1 text-xs text-slate-500">
              {item.channelName ?? "채널 없음"} · {item.category}
            </div>
            <VideoMemorySummary item={item} />
          </div>
        </div>
        );
      })}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 text-sm last:border-b-0">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function RootDetail({ node }: { node: MindMapNode }) {
  const summary = getSummary(node);

  if (!summary) {
    return <p className="text-sm text-slate-500">요약할 기록이 없습니다.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">선택 범위 요약</h3>
        <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4">
          <MetricRow label="총 기록 수" value={`${summary.totalCount}개`} />
          <MetricRow
            label="Top 카테고리"
            value={
              summary.topCategory
                ? `${summary.topCategory.name} · ${summary.topCategory.count}개`
                : "없음"
            }
          />
          <MetricRow
            label="Top 채널"
            value={summary.topChannel ? `${summary.topChannel.name} · ${summary.topChannel.count}개` : "없음"}
          />
          <MetricRow
            label="가장 많이 본 시간대"
            value={
              summary.topTimeBlock
                ? `${summary.topTimeBlock.name} · ${summary.topTimeBlock.count}개`
                : "없음"
            }
          />
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">카테고리별 분포</h4>
        <div className="mt-2 space-y-2">
          {summary.categoryCounts.map((category) => (
            <div key={category.category} className="rounded-md bg-slate-100 px-3 py-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>{category.category}</span>
                <span>
                  {category.count}개 · {category.percentage}%
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                <div
                  className="h-1.5 rounded-full bg-slate-700"
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NodeDetailRenderer({ node, dateSettings, onVideoMemorySave }: NodeDetailRendererProps) {
  const items = getItems(node);
  const item = getItem(node);

  if (node.type === "root") {
    return <RootDetail node={node} />;
  }

  if (node.type === "summary") {
    const patternText = typeof node.meta?.patternText === "string" ? node.meta.patternText : node.label;
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900">{node.label}</h3>
        <p className="rounded-lg bg-cyan-50 p-3 text-sm font-medium text-cyan-950">{patternText}</p>
      </div>
    );
  }

  if (node.type === "category" || node.type === "subcategory") {
    const topChannels = countChannels(items).slice(0, 5);
    const topTimeBlock = node.meta?.topTimeBlock as { name?: string; count?: number } | undefined;
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{node.label}</h3>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4">
            <MetricRow label="기록 개수" value={`${node.count ?? items.length}개`} />
            <MetricRow label="전체 대비 비율" value={`${node.percentage ?? 0}%`} />
            <MetricRow
              label="주요 시간대"
              value={topTimeBlock?.name ? `${topTimeBlock.name} · ${topTimeBlock.count ?? 0}개` : "계산 전"}
            />
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">주요 채널 Top 5</h4>
          <div className="mt-2 space-y-2">
            {topChannels.map((channel) => (
              <div key={channel.name} className="flex justify-between rounded-md bg-slate-100 px-3 py-2 text-sm">
                <span className="text-slate-700">{channel.name}</span>
                <span className="font-semibold text-slate-900">{channel.count}개</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">영상 목록</h4>
          <div className="mt-2">
            <VideoList items={items} timezone={dateSettings.timezone} />
          </div>
        </div>
      </div>
    );
  }

  if (node.type === "time-block") {
    const timeBlock = node.meta?.timeBlock as TimeBlock | undefined;
    const topCategory = node.meta?.topCategory as { name?: string; count?: number } | undefined;
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{timeBlock?.name ?? node.label}</h3>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4">
            <MetricRow label="기록 개수" value={`${node.count ?? items.length}개`} />
            <MetricRow label="대표 카테고리" value={topCategory?.name ?? "없음"} />
            <MetricRow label="시간대" value={timeBlock?.rangeLabel ?? "알 수 없음"} />
          </div>
        </div>
        <VideoList items={items} timezone={dateSettings.timezone} />
      </div>
    );
  }

  if (node.type === "channel") {
    const mainCategory = node.meta?.mainCategory as { name?: string; count?: number } | undefined;
    const channelName = typeof node.meta?.channelName === "string" ? node.meta.channelName : node.label;
    const channelUrl = typeof node.meta?.channelUrl === "string" ? node.meta.channelUrl : undefined;
    const lastWatchedAt = typeof node.meta?.lastWatchedAt === "string" ? node.meta.lastWatchedAt : "없음";
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{channelName}</h3>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4">
            <MetricRow label="기록 개수" value={`${node.count ?? items.length}개`} />
            <MetricRow label="주 카테고리" value={mainCategory?.name ?? "없음"} />
            <MetricRow label="마지막 시청 시각" value={lastWatchedAt} />
          </div>
          {channelUrl ? (
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              채널 열기
            </a>
          ) : null}
        </div>
        <VideoList items={items} timezone={dateSettings.timezone} />
      </div>
    );
  }

  if (node.type === "video" && item) {
    const videoMetadata = getVideoMetadata(item);
    return (
      <div className="space-y-5">
        <div>
          {videoMetadata.thumbnailUrl ? (
            <img
              src={videoMetadata.thumbnailUrl}
              alt=""
              className="mb-4 aspect-video w-full rounded-lg border border-slate-200 object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : null}
          <h3 className="text-lg font-semibold leading-snug text-slate-900">{item.title}</h3>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4">
            <MetricRow label="채널" value={item.channelName ?? "채널 없음"} />
            <MetricRow label="시청 시각" value={formatWatchedAt(item, dateSettings.timezone)} />
            <MetricRow label="카테고리" value={item.category} />
          </div>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              URL 열기
            </a>
          ) : null}
        </div>
        <VideoMemoryEditor item={item} onSave={onVideoMemorySave} />
      </div>
    );
  }

  if (node.type === "collapsed-group") {
    const hiddenItems = Array.isArray(node.meta?.hiddenItems)
      ? (node.meta.hiddenItems as ClassifiedWatchItem[])
      : items;
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">{node.label}</h3>
        <p className="text-sm text-slate-500">이 그룹에는 숨겨진 영상 노드 {hiddenItems.length}개가 있습니다.</p>
        <VideoList items={hiddenItems} timezone={dateSettings.timezone} />
      </div>
    );
  }

  return <p className="text-sm text-slate-500">선택한 노드 정보를 표시할 수 없습니다.</p>;
}
