import type { WatchHistoryImportSummary } from "@/types/watch";

type ImportSummaryCardProps = {
  summary: WatchHistoryImportSummary;
};

function formatCount(count: number): string {
  return count.toLocaleString("ko-KR");
}

export function ImportSummaryCard({ summary }: ImportSummaryCardProps) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-xs leading-relaxed text-emerald-900">
      <div className="font-semibold text-emerald-950">가져오기 결과</div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <div className="rounded-md bg-white/75 px-2 py-2">
          <div className="text-[11px] text-emerald-700">읽은 기록</div>
          <div className="mt-1 text-sm font-black text-emerald-950">{formatCount(summary.readCount)}개</div>
        </div>
        <div className="rounded-md bg-white/75 px-2 py-2">
          <div className="text-[11px] text-emerald-700">새로 추가</div>
          <div className="mt-1 text-sm font-black text-emerald-950">{formatCount(summary.addedCount)}개</div>
        </div>
        <div className="rounded-md bg-white/75 px-2 py-2">
          <div className="text-[11px] text-emerald-700">중복 건너뜀</div>
          <div className="mt-1 text-sm font-black text-emerald-950">{formatCount(summary.duplicateCount)}개</div>
        </div>
      </div>
      <div className="mt-2 text-emerald-800">
        저장된 기록 {formatCount(summary.savedCount)}개 · {summary.sourceLabel}
      </div>
      {summary.skippedCount > 0 ? <div>읽지 못한 항목 {formatCount(summary.skippedCount)}개</div> : null}
      {summary.cleanedExistingDuplicateCount > 0 ? (
        <div>기존 중복 {formatCount(summary.cleanedExistingDuplicateCount)}개 정리</div>
      ) : null}
      {!summary.persisted ? <div>저장소 오류로 이번 화면에만 반영되었습니다.</div> : null}
    </div>
  );
}
