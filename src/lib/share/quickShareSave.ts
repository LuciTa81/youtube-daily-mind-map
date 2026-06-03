export type QuickShareCompletionInput = {
  quickShareSaveEnabled: boolean;
  persisted: boolean;
};

export function shouldCompleteQuickShare(input: QuickShareCompletionInput): boolean {
  return input.quickShareSaveEnabled && input.persisted;
}

export function getQuickShareCompletionMessage(added: boolean): string {
  return added ? "오늘 기록에 저장했어요" : "이미 오늘 기록에 저장돼 있어요";
}
