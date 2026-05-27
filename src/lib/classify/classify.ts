import type { ClassifiedWatchItem, WatchItem } from "@/types/watch";
import { KEYWORD_RULES } from "./keywordRules";

function normalize(value: string): string {
  return value.toLocaleLowerCase("ko-KR");
}

function includesKeyword(text: string, keywords: string[]): string | undefined {
  return keywords.find((keyword) => text.includes(normalize(keyword)));
}

export function classifyOne(item: WatchItem): ClassifiedWatchItem {
  const searchable = normalize(`${item.title} ${item.channelName ?? ""}`);

  for (const rule of KEYWORD_RULES) {
    const strongMatch = includesKeyword(searchable, rule.strongKeywords);
    const regularMatch = includesKeyword(searchable, rule.keywords);

    if (!strongMatch && !regularMatch) {
      continue;
    }

    const subcategory =
      rule.subcategories.find((candidate) => includesKeyword(searchable, candidate.keywords))?.name ??
      `기타 ${rule.category.split("/")[0]}`;
    const matchedKeyword = strongMatch ?? regularMatch;
    const confidence = strongMatch ? 0.9 : 0.72;

    return {
      ...item,
      category: rule.category,
      subcategory,
      confidence,
      reason: `"${matchedKeyword}" 키워드가 제목 또는 채널명에서 발견됨`
    };
  }

  return {
    ...item,
    category: "기타",
    subcategory: "미분류",
    confidence: 0.2,
    reason: "명확한 키워드가 없어 기타로 분류됨"
  };
}

export function classifyItems(items: WatchItem[]): ClassifiedWatchItem[] {
  return items.map(classifyOne);
}
