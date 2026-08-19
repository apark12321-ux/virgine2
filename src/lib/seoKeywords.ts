/**
 * Korean SEO Keyword Extractor for Google Search & Meta Tags Optimization
 * Analyzes article title, headings, bold keywords, tags, and body content
 * to dynamically extract the top 10 most relevant, high-impact SEO keywords.
 */

// Common Korean stopwords, particles, and low-value generic terms
const STOPWORDS = new Set([
  "그리고", "하지만", "또한", "따라서", "그런데", "때문에", "통하여", "통해", "위하여", "위해",
  "대하여", "대해", "따르면", "따른", "관하여", "관한", "있습니다", "없습니다", "합니다",
  "됩니다", "입니다", "합니다", "있어서", "없어서", "하는", "되는", "있는", "없는",
  "이것", "저것", "그것", "무엇", "어떤", "모든", "각종", "여러", "매우", "가장", "더욱",
  "정말", "진짜", "약간", "조금", "바로", "항상", "자주", "가끔", "다시", "함께", "서로",
  "경우", "때문", "사항", "내용", "부분", "방법", "이유", "사실", "생각", "기준", "확인",
  "주의", "정리", "소개", "안내", "추천", "비교", "정보", "가이드", "포인트", "효과",
  "중요", "필수", "가능", "불가", "최근", "올해", "이번", "지난", "다음", "하나", "두개",
  "오늘", "내일", "지금", "현재", "이상", "이하", "미만", "초과", "약간", "전체", "일부",
  "클릭", "링크", "참고", "사진", "출처", "글쓴이", "작성자", "작성일", "조회수", "댓글",
  "vs", "and", "the", "for", "with"
]);

// Common Korean postpositional particles (조사) to trim from word endings
const PARTICLES = [
  "에게서", "한테서", "으로부터", "로부터", "에서는", "에게는", "한테는", "에서는",
  "에서", "에게", "한테", "으로", "로써", "로서", "보다", "처럼", "만큼", "마저",
  "조차", "까지", "부터", "이나", "이나", "이나", "이란", "라는", "따라", "마다",
  "은", "는", "이", "가", "을", "를", "의", "에", "로", "와", "과", "도", "만", "나", "란"
];

// High-value domain seed phrases for wedding / finance / government policy SEO
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  "신혼금융": ["디딤돌대출", "신생아특례대출", "버팀목전세대출", "우대금리", "청약가점", "신혼부부 특별공급", "스트레스 DSR", "LTV 한도", "생애최초 주택구입", "결혼세액공제"],
  "신혼가전": ["신혼가전 패키지", "혼수가전 견적", "삼성 비스포크", "LG 오브제컬렉션", "가전 졸업", "오픈점 할인", "로봇청소기 추천", "혼수 리스트", "식기세척기", "시스템에어컨"],
  "결혼준비": ["결혼준비 체크리스트", "스드메 견적", "웨딩홀 투어", "본식 스냅", "웨딩드레스 대여", "결혼 예산표", "예단 예물", "웨딩플래너", "청첩장 모바일", "신혼여행 준비"],
  "정책정보": ["2026 신혼 정책", "부모급여 신청", "아동수당", "신생아 특례대출", "첫만남이용권", "청년도약계좌", "출산지원금", "육아휴직급여", "신혼희망타운", "주택청약 1순위"]
};

const DEFAULT_SEO_KEYWORDS = [
  "버진로드",
  "디딤돌대출 계산기",
  "신생아특례대출",
  "버팀목전세대출",
  "신혼부부 특별공급",
  "청약가점 시뮬레이터",
  "우대금리 조건",
  "결혼준비 체크리스트",
  "스드메 견적비교",
  "혼수가전 패키지"
];

/**
 * Strips Korean particles and non-alphanumeric noise from word endings
 */
function cleanKoreanWord(raw: string): string {
  let word = raw.replace(/^[^\w\uAC00-\uD7A3]+|[^\w\uAC00-\uD7A3]+$/g, "").trim();
  if (word.length <= 1) return "";

  // Check if it is a pure number or single letter
  if (/^\d+$/.test(word) || /^[a-zA-Z]$/.test(word)) return "";

  for (const p of PARTICLES) {
    if (word.length > p.length + 1 && word.endsWith(p)) {
      word = word.slice(0, -p.length);
      break;
    }
  }
  return word.trim();
}

/**
 * Extracts top 10 SEO-favorable meta keywords from post content, title, headings, and tags
 */
export function extractSeoKeywords(options: {
  title?: string;
  content?: string;
  category?: string;
  hashtags?: string[];
}): string[] {
  const { title = "", content = "", category = "", hashtags = [] } = options;

  if (!title && !content && hashtags.length === 0) {
    return [...DEFAULT_SEO_KEYWORDS];
  }

  const scores: Map<string, number> = new Map();

  const addScore = (rawTerm: string, weight: number) => {
    if (!rawTerm) return;
    const term = cleanKoreanWord(rawTerm);
    if (!term || term.length < 2 || STOPWORDS.has(term.toLowerCase())) return;
    if (/^\d+$/.test(term) || /^[a-zA-Z]$/.test(term)) return;

    const current = scores.get(term) || 0;
    scores.set(term, current + weight);
  };

  // 1. Explicit hashtags (Highest initial priority)
  hashtags.forEach(tag => {
    const cleanTag = tag.replace(/^#/, "").trim();
    if (cleanTag && cleanTag.length >= 2 && !STOPWORDS.has(cleanTag.toLowerCase())) {
      addScore(cleanTag, 20);
    }
  });

  // 2. Title analysis (Weight: 12x)
  const cleanTitle = title.replace(/[:|·\-()[\]<>"]/g, " ");
  const titleTokens = cleanTitle.split(/\s+/).filter(Boolean);
  titleTokens.forEach(token => {
    addScore(token, 12);
  });

  // Bigrams from title
  for (let i = 0; i < titleTokens.length - 1; i++) {
    const w1 = cleanKoreanWord(titleTokens[i]);
    const w2 = cleanKoreanWord(titleTokens[i + 1]);
    if (w1 && w2 && !STOPWORDS.has(w1.toLowerCase()) && !STOPWORDS.has(w2.toLowerCase()) && w1.length >= 2 && w2.length >= 2) {
      addScore(`${w1} ${w2}`, 14);
    }
  }

  // 3. HTML & Markdown Headings (h2, h3, ##, ###) analysis (Weight: 8x)
  const headingTexts: string[] = [];
  const headingMatches = content.match(/<h[23][^>]*>(.*?)<\/h[23]>/gi) || [];
  headingMatches.forEach(h => {
    headingTexts.push(h.replace(/<[^>]*>/g, " "));
  });
  const mdHeadingMatches = content.match(/^(?:##|###)\s+([^\n]+)/gm) || [];
  mdHeadingMatches.forEach(h => {
    headingTexts.push(h.replace(/^#+\s+/, " "));
  });

  headingTexts.forEach(text => {
    const cleanText = text.replace(/[0-9.단계포인트:|·\-()[\]<>"]/g, " ");
    const toks = cleanText.split(/\s+/).filter(Boolean);
    toks.forEach(tok => addScore(tok, 8));
    for (let i = 0; i < toks.length - 1; i++) {
      const w1 = cleanKoreanWord(toks[i]);
      const w2 = cleanKoreanWord(toks[i + 1]);
      if (w1 && w2 && !STOPWORDS.has(w1.toLowerCase()) && !STOPWORDS.has(w2.toLowerCase()) && w1.length >= 2 && w2.length >= 2) {
        addScore(`${w1} ${w2}`, 9);
      }
    }
  });

  // 4. Strong / Bold text analysis (Weight: 5x)
  const boldTexts: string[] = [];
  const boldMatches = content.match(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi) || [];
  boldMatches.forEach(b => boldTexts.push(b.replace(/<[^>]*>/g, " ")));
  const mdBoldMatches = content.match(/\*\*([^*]+)\*\*/g) || [];
  mdBoldMatches.forEach(b => boldTexts.push(b.replace(/\*\*/g, " ")));

  boldTexts.forEach(text => {
    const toks = text.replace(/[:|·\-()[\]<>"]/g, " ").split(/\s+/).filter(Boolean);
    toks.forEach(tok => addScore(tok, 5));
  });

  // 5. Category matching boost (Weight: 6x)
  if (category && DOMAIN_KEYWORDS[category]) {
    DOMAIN_KEYWORDS[category].forEach((seed, idx) => {
      addScore(seed, 6 - idx * 0.3);
    });
  }

  // 6. General body content frequency (Weight: 1x)
  const plainBody = content.replace(/<[^>]*>/g, " ").replace(/[*#`_~\[\]()|]/g, " ");
  const bodyTokens = plainBody.split(/[\s,·/|()\[\]<>"-.:;!?'"\n\r\t]+/).filter(Boolean);
  bodyTokens.slice(0, 800).forEach(tok => {
    addScore(tok, 1);
  });

  // Sort by score descending
  const sorted = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  const uniqueKeywords: string[] = [];
  
  for (const kw of sorted) {
    if (uniqueKeywords.length >= 10) break;
    // Check if this keyword is an exact duplicate or space-normalized duplicate
    const isDuplicate = uniqueKeywords.some(existing => 
      existing === kw || 
      existing.replace(/\s+/g, "") === kw.replace(/\s+/g, "")
    );
    if (!isDuplicate) {
      uniqueKeywords.push(kw);
    }
  }

  // If fewer than 10 extracted, fill with category or default seeds
  if (uniqueKeywords.length < 10) {
    const pool = (category && DOMAIN_KEYWORDS[category]) ? DOMAIN_KEYWORDS[category] : DEFAULT_SEO_KEYWORDS;
    for (const item of pool) {
      if (uniqueKeywords.length >= 10) break;
      if (!uniqueKeywords.some(e => e.replace(/\s+/g, "") === item.replace(/\s+/g, ""))) {
        uniqueKeywords.push(item);
      }
    }
  }

  return uniqueKeywords.slice(0, 10);
}
