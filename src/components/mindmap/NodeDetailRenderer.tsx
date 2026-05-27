"use client";

import { formatInTimeZone } from "date-fns-tz";
import type { DaySummary } from "@/lib/analytics/summarizeDay";
import type { TimeBlock } from "@/lib/date/timeBlocks";
import type { MindMapNode } from "@/types/mindmap";
import type { ClassifiedWatchItem, DateSettings } from "@/types/watch";

type NodeDetailRendererProps = {
  node: MindMapNode;
  dateSettings: DateSettings;
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
      {sortedItems.map((item) => (
        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="text-xs font-semibold text-slate-500">{formatWatchedAt(item, timezone)}</div>
          <div className="mt-1 text-sm font-semibold leading-snug text-slate-900">{item.title}</div>
          <div className="mt-1 text-xs text-slate-500">
            {item.channelName ?? "채널 없음"} · {item.category}
          </div>
        </div>
      ))}
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
        <h3 className="text-lg font-semibold text-slate-900">선택 날짜 요약</h3>
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

export function NodeDetailRenderer({ node, dateSettings }: NodeDetailRendererProps) {
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
    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold leading-snug text-slate-900">{item.title}</h3>
          <div className="mt-3 rounded-lg border border-slate-200 bg-white px-4">
            <MetricRow label="채널" value={item.channelName ?? "채널 없음"} />
            <MetricRow label="시청 시각" value={formatWatchedAt(item, dateSettings.timezone)} />
            <MetricRow label="카테고리" value={item.category} />
            <MetricRow label="confidence" value={item.confidence.toFixed(2)} />
            <MetricRow label="분류 이유" value={item.reason ?? "없음"} />
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
