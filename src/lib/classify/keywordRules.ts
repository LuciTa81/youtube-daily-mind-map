export type KeywordRule = {
  category: string;
  strongKeywords: string[];
  keywords: string[];
  subcategories: Array<{
    name: string;
    keywords: string[];
  }>;
};

export const CATEGORY_ORDER = [
  "학습/교육",
  "개발/기술",
  "뉴스/사회",
  "경제/투자",
  "엔터테인먼트",
  "음악",
  "게임",
  "스포츠",
  "운동/건강",
  "요리/음식",
  "여행",
  "쇼핑/리뷰",
  "자기계발",
  "기타"
];

export const KEYWORD_RULES: KeywordRule[] = [
  {
    category: "개발/기술",
    strongKeywords: [
      "react",
      "next.js",
      "python",
      "typescript",
      "javascript",
      "ai",
      "프로그래밍",
      "코딩",
      "개발"
    ],
    keywords: ["app router", "backend", "frontend", "node.js", "llm", "api", "서버", "데이터베이스"],
    subcategories: [
      { name: "AI", keywords: ["ai", "llm", "gpt", "머신러닝", "딥러닝", "프롬프트"] },
      { name: "프론트엔드", keywords: ["react", "next.js", "frontend", "javascript", "typescript", "css"] },
      { name: "백엔드", keywords: ["backend", "node.js", "api", "서버", "데이터베이스", "database"] },
      { name: "Python", keywords: ["python", "파이썬"] }
    ]
  },
  {
    category: "뉴스/사회",
    strongKeywords: ["뉴스", "정치", "속보", "사회", "사건", "외교"],
    keywords: ["이슈", "브리핑", "선거", "국회", "정책", "현장"],
    subcategories: [
      { name: "정치", keywords: ["정치", "선거", "국회", "정책"] },
      { name: "사회", keywords: ["사회", "사건", "현장"] },
      { name: "국제", keywords: ["외교", "국제", "해외"] }
    ]
  },
  {
    category: "경제/투자",
    strongKeywords: ["주식", "부동산", "비트코인", "경제", "투자", "etf", "금리", "환율"],
    keywords: ["코인", "나스닥", "시장", "매크로", "재테크", "분석"],
    subcategories: [
      { name: "주식", keywords: ["주식", "나스닥", "etf", "배당"] },
      { name: "부동산", keywords: ["부동산", "아파트", "전세", "매매"] },
      { name: "코인", keywords: ["비트코인", "코인", "crypto"] },
      { name: "거시경제", keywords: ["경제", "금리", "환율", "매크로"] }
    ]
  },
  {
    category: "운동/건강",
    strongKeywords: ["운동", "헬스", "다이어트", "요가", "러닝", "근력"],
    keywords: ["스트레칭", "홈트", "건강", "식단", "회복"],
    subcategories: [
      { name: "근력", keywords: ["헬스", "근력", "웨이트", "홈트"] },
      { name: "러닝", keywords: ["러닝", "마라톤", "조깅"] },
      { name: "식단", keywords: ["다이어트", "식단", "건강"] }
    ]
  },
  {
    category: "요리/음식",
    strongKeywords: ["먹방", "요리", "레시피", "맛집", "카페"],
    keywords: ["주방", "디저트", "베이킹", "집밥", "커피"],
    subcategories: [
      { name: "레시피", keywords: ["요리", "레시피", "집밥", "베이킹"] },
      { name: "맛집", keywords: ["맛집", "카페", "디저트"] },
      { name: "먹방", keywords: ["먹방"] }
    ]
  },
  {
    category: "음악",
    strongKeywords: ["official mv", "mv", "official audio", "playlist", "음악", "노래", "live clip"],
    keywords: ["music", "lyrics", "cover", "콘서트", "플레이리스트", "라이브"],
    subcategories: [
      { name: "MV", keywords: ["official mv", "mv", "music video"] },
      { name: "플레이리스트", keywords: ["playlist", "플레이리스트"] },
      { name: "라이브", keywords: ["live clip", "라이브", "concert", "콘서트"] }
    ]
  },
  {
    category: "게임",
    strongKeywords: ["게임", "롤", "배그", "발로란트", "minecraft", "nintendo", "steam"],
    keywords: ["gameplay", "플레이", "공략", "이스포츠", "스팀"],
    subcategories: [
      { name: "PC/콘솔", keywords: ["steam", "nintendo", "스팀"] },
      { name: "e스포츠", keywords: ["롤", "발로란트", "이스포츠"] },
      { name: "샌드박스", keywords: ["minecraft", "마인크래프트"] }
    ]
  },
  {
    category: "스포츠",
    strongKeywords: ["축구", "야구", "nba", "mlb", "손흥민", "하이라이트"],
    keywords: ["경기", "골", "득점", "프리미어리그", "농구"],
    subcategories: [
      { name: "축구", keywords: ["축구", "손흥민", "프리미어리그", "골"] },
      { name: "야구", keywords: ["야구", "mlb"] },
      { name: "농구", keywords: ["nba", "농구"] }
    ]
  },
  {
    category: "엔터테인먼트",
    strongKeywords: ["브이로그", "예능", "몰카", "리액션", "토크", "인터뷰"],
    keywords: ["shorts", "클립", "쇼츠", "웃긴", "챌린지", "vlog"],
    subcategories: [
      { name: "예능", keywords: ["예능", "몰카", "웃긴"] },
      { name: "토크", keywords: ["토크", "인터뷰"] },
      { name: "클립", keywords: ["클립", "shorts", "쇼츠"] },
      { name: "브이로그", keywords: ["브이로그", "vlog"] }
    ]
  },
  {
    category: "자기계발",
    strongKeywords: ["공부법", "생산성", "루틴", "자기계발", "동기부여"],
    keywords: ["습관", "집중", "목표", "시간관리", "독서"],
    subcategories: [
      { name: "생산성", keywords: ["생산성", "시간관리", "집중"] },
      { name: "루틴", keywords: ["루틴", "습관"] },
      { name: "동기부여", keywords: ["동기부여", "목표"] }
    ]
  },
  {
    category: "쇼핑/리뷰",
    strongKeywords: ["리뷰", "언박싱", "추천템", "쇼핑", "비교"],
    keywords: ["구매", "제품", "후기", "best", "가성비"],
    subcategories: [
      { name: "제품 리뷰", keywords: ["리뷰", "제품", "후기"] },
      { name: "언박싱", keywords: ["언박싱"] },
      { name: "비교/추천", keywords: ["추천템", "비교", "가성비"] }
    ]
  },
  {
    category: "여행",
    strongKeywords: ["여행", "trip", "travel", "항공", "호텔"],
    keywords: ["일본", "제주", "도쿄", "공항", "숙소"],
    subcategories: [
      { name: "국내", keywords: ["제주", "국내"] },
      { name: "해외", keywords: ["일본", "도쿄", "해외", "travel", "trip"] },
      { name: "준비", keywords: ["항공", "호텔", "숙소", "공항"] }
    ]
  },
  {
    category: "학습/교육",
    strongKeywords: ["강의", "수업", "lecture", "tutorial", "course"],
    keywords: ["역사", "과학", "수학", "영어", "공부"],
    subcategories: [
      { name: "강의", keywords: ["강의", "수업", "lecture", "tutorial", "course"] },
      { name: "어학", keywords: ["영어", "일본어", "회화"] },
      { name: "교양", keywords: ["역사", "과학", "수학"] }
    ]
  }
];
