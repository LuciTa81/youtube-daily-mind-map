"use client";

type FilterPanelProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchResultCount: number;
  categories: string[];
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  channelQuery: string;
  onChannelQueryChange: (value: string) => void;
  lowConfidenceOnly: boolean;
  onLowConfidenceOnlyChange: (value: boolean) => void;
  maxVisibleVideosPerGroup: number;
  onMaxVisibleVideosPerGroupChange: (value: number) => void;
  groupVideosBy: "channel" | "subcategory";
  onGroupVideosByChange: (value: "channel" | "subcategory") => void;
  expandVideosByDefault: boolean;
  onExpandVideosByDefaultChange: (value: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
};

export function FilterPanel({
  searchQuery,
  onSearchQueryChange,
  searchResultCount,
  categories,
  categoryFilter,
  onCategoryFilterChange,
  channelQuery,
  onChannelQueryChange,
  lowConfidenceOnly,
  onLowConfidenceOnlyChange,
  maxVisibleVideosPerGroup,
  onMaxVisibleVideosPerGroupChange,
  groupVideosBy,
  onGroupVideosByChange,
  expandVideosByDefault,
  onExpandVideosByDefaultChange,
  onExpandAll,
  onCollapseAll
}: FilterPanelProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">필터</h2>
        <p className="mt-1 text-xs text-slate-500">
          검색 결과 {searchQuery.trim() ? `${searchResultCount}개` : "없음"}
        </p>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-500">검색어</span>
        <input
          value={searchQuery}
          placeholder="제목, 채널, 카테고리"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-500">카테고리 필터</span>
        <select
          value={categoryFilter}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          onChange={(event) => onCategoryFilterChange(event.target.value)}
        >
          <option value="">전체 카테고리</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-slate-500">채널 검색</span>
        <input
          value={channelQuery}
          placeholder="채널명"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400"
          onChange={(event) => onChannelQueryChange(event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={lowConfidenceOnly}
          onChange={(event) => onLowConfidenceOnlyChange(event.target.checked)}
        />
        분류가 애매한 항목만 보기
      </label>
      <div className="space-y-3 border-t border-slate-200 pt-4">
        <h2 className="text-sm font-semibold text-slate-900">표시 설정</h2>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-500">그룹당 영상 노드 표시 개수</span>
          <input
            type="number"
            min={0}
            max={30}
            value={maxVisibleVideosPerGroup}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            onChange={(event) =>
              onMaxVisibleVideosPerGroupChange(Math.max(0, Number(event.target.value) || 0))
            }
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-slate-500">주제별 하위 그룹 기준</span>
          <select
            value={groupVideosBy}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            onChange={(event) => onGroupVideosByChange(event.target.value as "channel" | "subcategory")}
          >
            <option value="subcategory">세부 주제</option>
            <option value="channel">채널</option>
          </select>
        </label>
        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={expandVideosByDefault}
            onChange={(event) => onExpandVideosByDefaultChange(event.target.checked)}
          />
          영상 노드 기본 펼치기
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={onExpandAll}
          >
            전체 펼치기
          </button>
          <button
            type="button"
            className="rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            onClick={onCollapseAll}
          >
            전체 접기
          </button>
        </div>
      </div>
    </section>
  );
}
