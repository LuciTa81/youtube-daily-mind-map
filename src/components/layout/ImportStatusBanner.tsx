"use client";

type ImportStatusBannerProps = {
  activeSourceName: string;
  totalItemCount: number;
  savedItemCount: number;
  isUsingSample: boolean;
  isStorageReady: boolean;
  importNote?: string;
  onOpenImport: () => void;
  onUseSaved: () => void;
};

export function ImportStatusBanner({
  activeSourceName,
  totalItemCount,
  savedItemCount,
  isUsingSample,
  isStorageReady,
  importNote,
  onOpenImport,
  onUseSaved
}: ImportStatusBannerProps) {
  const hasSavedItems = savedItemCount > 0;
  const canSwitchToSaved = hasSavedItems && isUsingSample;
  const title = !isStorageReady
    ? "저장소 확인 중"
    : canSwitchToSaved
    ? "저장된 내 기록이 있어요"
    : hasSavedItems
    ? "내 기록 저장소 사용 중"
    : "샘플 데이터로 둘러보는 중";
  const description =
    importNote ||
    (canSwitchToSaved
      ? `샘플 대신 저장된 내 시청 기록 ${savedItemCount}개를 볼 수 있습니다.`
      : hasSavedItems
      ? "새 Takeout을 다시 넣어도 이미 저장된 기록은 중복으로 추가하지 않습니다."
      : "내 기록을 보려면 Takeout ZIP을 가져오세요. 파일은 이 기기에서만 읽습니다.");

  return (
    <section className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm 2xl:hidden">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              {activeSourceName}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{description}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-medium text-slate-500">
            <span>현재 {totalItemCount}개 기록</span>
            <span>저장된 내 기록 {savedItemCount}개</span>
          </div>
        </div>
        <div className={`grid gap-2 md:w-56 ${canSwitchToSaved ? "grid-cols-2" : "grid-cols-1"}`}>
          {canSwitchToSaved ? (
            <button
              type="button"
              className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
              onClick={onUseSaved}
            >
              내 기록 보기
            </button>
          ) : null}
          <button
            type="button"
            className={`rounded-md px-3 py-2 text-xs font-semibold shadow-sm ${
              canSwitchToSaved
                ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                : "bg-slate-950 text-white hover:bg-slate-800"
            }`}
            onClick={onOpenImport}
          >
            가져오기
          </button>
        </div>
      </div>
    </section>
  );
}
