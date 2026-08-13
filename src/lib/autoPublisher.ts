import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const LOCAL_POSTS_FILE = path.join(process.cwd(), "posts-local.json");
const SCHEDULE_FILE = path.join(process.cwd(), "auto-schedule.json");

interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: "신혼금융" | "신혼가전" | "결혼준비";
  author: string;
  date: string;
  image: string;
  readTime: string;
  hashtags: string[];
}

interface DaySchedule {
  targetTime: string; // "HH:MM" in KST
  published: boolean;
  postId?: string;
}

interface ScheduleStore {
  schedules: Record<string, DaySchedule[]>; // key: "YYYY-MM-DD"
  lastCheck?: string;
}

// Get current date/time in KST (UTC+9)
export function getKSTNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60 * 1000);
}

export function getKSTDateString(d: Date = getKSTNow()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function getKSTTimeString(d: Date = getKSTNow()): string {
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${min}`;
}

// Generate a random time between 07:30 and 22:30 KST
function generateRandomTime(minHour = 8, maxHour = 22): string {
  const hour = Math.floor(Math.random() * (maxHour - minHour + 1)) + minHour;
  const minute = Math.floor(Math.random() * 60);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function loadLocalPosts(): Post[] {
  try {
    if (fs.existsSync(LOCAL_POSTS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_POSTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load local posts:", e);
  }
  return [];
}

function saveLocalPosts(posts: Post[]) {
  try {
    fs.writeFileSync(LOCAL_POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save local posts:", e);
  }
}

function loadScheduleStore(): ScheduleStore {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      return JSON.parse(fs.readFileSync(SCHEDULE_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load schedule store:", e);
  }
  return { schedules: {} };
}

function saveScheduleStore(store: ScheduleStore) {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save schedule store:", e);
  }
}

// Topic Pool for rich fallback generation
const TOPIC_POOL = [
  {
    category: "신혼금융" as const,
    title: "2026년 하반기 신혼부부 디딤돌대출 우대금리 항목별 극대화 전략",
    excerpt: "청약통장 가입 기간, 전자계약 우대, 신생아 특례 중복 우대까지 적용하여 대출 금리를 연 1%대까지 낮추는 실전 자금 조달 가이드.",
    image: "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800",
    hashtags: ["디딤돌대출", "우대금리", "신혼금융", "내집마련"]
  },
  {
    category: "신혼금융" as const,
    title: "신혼부부 버팀목 전세자금대출 수도권 3억 원 한도 증액 및 보증금 조건 가이드",
    excerpt: "2026년 기준 신혼 전용 버팀목 전세대출의 수도권 한도 증액 요건과 HUG 보증보험 가입 가이드라인 및 반환보증료 지원 환급 절차.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
    hashtags: ["버팀목전세대출", "전세보증금", "HUG보증", "신혼부부대출"]
  },
  {
    category: "신혼금융" as const,
    title: "2026년 신생아 특례 자녀수별 대출 우대금리 및 5년 연장 가이드",
    excerpt: "자녀 1인당 추가 금리 인하 혜택과 특례 금리 적용 기간 연장 조항 분석. 둘째 출산 시 금리 및 한도 우대 조건 완벽 정리.",
    image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
    hashtags: ["신생아특례대출", "출산지원", "우대금리", "주택구입자금"]
  },
  {
    category: "신혼가전" as const,
    title: "2026년 맞벌이 신혼부부를 위한 로봇청소기 직수형 vs 집진형 완벽 스펙 비교",
    excerpt: "자동 오수 정수 직수 시스템과 고온 스팀 세척 기능을 갖춘 최신 로봇청소기(로보락, 삼성, LG) 브랜드별 설치 조건 및 실무 후기.",
    image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800",
    hashtags: ["로봇청소기", "신혼가전", "직수형로청", "가전졸업"]
  },
  {
    category: "신혼가전" as const,
    title: "신혼집 거실 인테리어 아트월 타공 없이 무타공 벽걸이 TV 시공 가이드",
    excerpt: "전세집이나 신축 아파트 대리석 아트월에 구멍을 뚫지 않고 75인치~85인치 대형 TV를 안전하게 고정하는 무타공 벽걸이 브라켓 비교.",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=800",
    hashtags: ["무타공TV", "벽걸이TV", "거실인테리어", "신혼집꾸미기"]
  },
  {
    category: "결혼준비" as const,
    title: "2026년 웨딩드레스 스드메 견적 비교 및 추가금 없는 정찰제 숍 고르는 법",
    excerpt: "드레스 투어 피팅비, 헬퍼비, 얼리 스타트비, 원본 수정본 파일 구매비 등 계약서 작성 시 추가금을 원천 차단하는 실전 가이드.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800",
    hashtags: ["스드메견적", "웨딩드레스", "드레스투어", "결혼준비팁"]
  },
  {
    category: "결혼준비" as const,
    title: "신혼여행 허니문 휴양지 vs 휴양+쇼핑 추천 코스 — 발리, 칸쿤, 하와이 2026 비교",
    excerpt: "비행시간, 예산, 풀빌라 리조트 퀄리티, 액티비티 요소를 토대로 분석한 신혼부부 맞춤형 2026년 베스트 허니문 리조트 완벽 비교.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
    hashtags: ["신혼여행", "허니문추천", "발리신혼여행", "하와이허니문"]
  },
  {
    category: "신혼금융" as const,
    title: "2026년 신혼부부 주택청약 특별공급 가점 계산 및 우선공급 자격 체크리스트",
    excerpt: "신혼부부 특공 우선공급, 일반공급 비율 개편안 적용! 자녀 수, 혼인 기간, 당해 지역 거주 조건에 따른 최적 청약 신청 전략.",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
    hashtags: ["신혼부부특별공급", "청약가점", "아파트청약", "신혼청약"]
  },
  {
    category: "신혼가전" as const,
    title: "신혼집 주방 인테리어 식기세척기 빌트인 장내림 시공 및 전기 용량 체크포인트",
    excerpt: "싱크대 하부장 공사 시 무문선 라인 매칭, 단독 전기 누전차단기 증설, 온수 직수관 연결 시 물튐 방지 조치 가이드.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800",
    hashtags: ["식기세척기빌트인", "주방인테리어", "싱크대장내림", "신혼가전"]
  },
  {
    category: "결혼준비" as const,
    title: "2026년 예단·예물 절차와 비용 간소화 가이드 — 현물 예단 대신 가전·가구 실속 대체",
    excerpt: "양가 부모님과의 마찰 없이 예단 이불, 삼서, 봉채비를 합리적인 현금 봉투와 실용 가전제품 선물로 대처하는 현명한 협상 에티켓.",
    image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    hashtags: ["예단예물", "봉채비", "결혼예절", "양가인사"]
  }
];

// Generate an article using Gemini API if key exists, otherwise procedural fallback
async function generatePostContent(topic: typeof TOPIC_POOL[0], dateStr: string): Promise<Post> {
  const apiKey = process.env.GEMINI_API_KEY;
  const slugId = `auto-${topic.category === "신혼금융" ? "fin" : topic.category === "신혼가전" ? "app" : "wed"}-${dateStr.replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
당신은 대한민국 대표 신혼가정·주거정책 전문 미디어 '버진로드'의 수석 에디터입니다.
다음 주제에 대해 예비부부와 신혼부부를 위한 고품질, 전문적, 실용적인 블로그 포스트를 작성해 주세요.

- 제목: ${topic.title}
- 카테고리: ${topic.category}
- 작성 날짜: ${dateStr}

[작성 가이드라인]
1. HTML 태그(<h3>, <p>, <ul>, <li>, <strong>)만을 사용하여 정갈하고 시각적으로 구조화된 본문을 작성하세요.
2. <h3> 소제목 3~4개로 구분을 명확히 하고, 각 단락마다 풍부한 정보(구체적 조건, 우대 이율, 세부 체크리스트, 절차 등)를 1,200자 이상으로 친절하고 명확하게 서술하세요.
3. 광고성 멘트나 거짓 정보 없이 2026년 최신 공식 정책 및 실무 기준을 준수하세요.
4. JSON 형식으로만 응답하세요. Markdown 코드 블록(\`\`\`json) 없이 순수 JSON 객체여야 합니다.

응답 JSON 구조:
{
  "title": "${topic.title}",
  "excerpt": "요약문 2~3문장",
  "content": "HTML 본문 내용"
}
`;

      const generatePromise = ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout")), 18000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      const text = response.text || "";
      const cleanedText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      let parsed: any;
      try {
        parsed = JSON.parse(cleanedText);
      } catch {
        // Fix unescaped control characters/newlines inside JSON strings
        const sanitized = cleanedText.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
        parsed = JSON.parse(sanitized);
      }

      if (parsed.title && parsed.content) {
        return {
          id: slugId,
          title: parsed.title,
          excerpt: parsed.excerpt || topic.excerpt,
          content: parsed.content,
          category: topic.category,
          author: "버진로드 에디터",
          date: dateStr,
          image: topic.image,
          readTime: `${Math.max(8, Math.ceil(parsed.content.length / 300))}분`,
          hashtags: topic.hashtags
        };
      }
    } catch (e) {
      console.warn("Gemini API post generation fallback triggered:", e);
    }
  }

  // High quality procedural fallback article
  const fallbackHtml = `
<h3>1. ${topic.title} — 핵심 개요 및 배경</h3>
<p>결혼을 앞둔 예비부부와 신혼 가구에게 있어 가장 중요한 과제는 합리적인 의사결정과 예산 배분입니다. 오늘 버진로드에서 집중 분석하는 <strong>"${topic.title}"</strong> 정보는 2026년 최신 공식 가이드라인을 토대로 가계 부담을 덜고 주거 안정을 돕기 위해 마련되었습니다.</p>
<p>버진로드 편집부의 정밀 취재에 따르면, 사전에 준비 단계를 꼼꼼히 체크한 가구일수록 비용 절감 및 혜택 신청 시 오류를 대폭 줄일 수 있었습니다.</p>

<h3>2. 단계별 실전 가이드 및 체크리스트</h3>
<ul>
  <li><strong>1단계 (사전 조건 확인):</strong> 신청 가구의 자격 요건(소득 한도, 자산 기준, 세대주 여부 등)을 공식 기관 자료를 통해 서류 단위로 검증합니다.</li>
  <li><strong>2단계 (서류 준비 및 세부 비교):</strong> 필요 증빙 서류(혼인관계증명서, 소득금액증명원, 자격 입증 서류)를 미리 원스톱 발급하여 지연을 방지합니다.</li>
  <li><strong>3단계 (우대 혜택 및 추가 가산 적용):</strong> 중복 수혜 가능 항목(전자계약 우대, 청약통장 유지 기간, 자녀 수 가산 등)을 적용하여 최종 이점 극대화.</li>
</ul>

<h3>3. 전문가가 조언하는 주의사항 및 성공 팁</h3>
<p>접수 및 진행 과정에서 발생하기 쉬운 단골 실수 중 하나는 서류 제출 시 유효기간(주로 최근 1개월 이내 발급분)을 넘기거나 특약 조항을 누락하는 것입니다. 계약서나 신청서 서명 전 반드시 전문 담당자와 2차 확인을 거치는 습관이 요구됩니다.</p>
<p>버진로드는 앞으로도 신혼 가구의 안정적인 출발을 위해 가장 신뢰할 수 있는 실무 정보만을 엄선하여 전해드리겠습니다.</p>
`.trim();

  return {
    id: slugId,
    title: topic.title,
    excerpt: topic.excerpt,
    content: fallbackHtml,
    category: topic.category,
    author: "버진로드 에디터",
    date: dateStr,
    image: topic.image,
    readTime: "10분",
    hashtags: topic.hashtags
  };
}

// Sync new post to Firestore asynchronously without blocking local publish
function syncToFirestore(post: Post) {
  const apiKey = "AIzaSyDneiaJczNqU2Od6c0lMe3AdSQKar5yGA4";
  const firestoreUrl = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0326874047/databases/ai-studio-9ae01718-7459-4ac4-90d0-d2a27c2a0cc1/documents/posts/${post.id}?key=${apiKey}`;
  const firestoreBody = {
    fields: {
      title: { stringValue: post.title },
      excerpt: { stringValue: post.excerpt },
      content: { stringValue: post.content },
      category: { stringValue: post.category },
      author: { stringValue: post.author },
      date: { stringValue: post.date },
      image: { stringValue: post.image },
      readTime: { stringValue: post.readTime },
      hashtags: {
        arrayValue: {
          values: post.hashtags.map(t => ({ stringValue: t }))
        }
      },
      secretToken: { stringValue: "virginroad-secure-secret-token-2026" }
    }
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  fetch(firestoreUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(firestoreBody),
    signal: controller.signal
  })
  .then(res => console.log(`[AutoPublisher] Dual-wrote post ${post.id} to Firestore. Status: ${res.status}`))
  .catch(err => console.warn(`[AutoPublisher] Firestore write skipped for ${post.id}:`, err.message))
  .finally(() => clearTimeout(timeoutId));
}

// Main Scheduler Execution Function
export async function runAutoPublisherService(): Promise<{ publishedCount: number; messages: string[] }> {
  const kstNow = getKSTNow();
  const todayStr = getKSTDateString(kstNow);
  const currentTimeStr = getKSTTimeString(kstNow);

  const localPosts = loadLocalPosts();
  const store = loadScheduleStore();
  const messages: string[] = [];
  let publishedCount = 0;

  // 1. Backfill past missing dates up to today to ensure EVERY SINGLE DAY HAS AT LEAST 1 POST!
  // Determine dates from 5 days ago up to today
  const checkDates: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(kstNow.getTime() - i * 24 * 60 * 60 * 1000);
    checkDates.push(getKSTDateString(d));
  }

  for (const dateStr of checkDates) {
    const existingForDate = localPosts.filter(p => p.date === dateStr);

    if (existingForDate.length === 0) {
      console.log(`[AutoPublisher] No post found for ${dateStr}. Generating daily post now!`);
      // Pick a topic not used recently
      const usedTitles = new Set(localPosts.map(p => p.title));
      const availableTopics = TOPIC_POOL.filter(t => !usedTitles.has(t.title));
      const selectedTopic = availableTopics.length > 0 
        ? availableTopics[Math.floor(Math.random() * availableTopics.length)]
        : TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];

      const newPost = await generatePostContent(selectedTopic, dateStr);
      localPosts.unshift(newPost);
      saveLocalPosts(localPosts);
      syncToFirestore(newPost);

      // Record schedule
      if (!store.schedules[dateStr]) {
        store.schedules[dateStr] = [];
      }
      const randomTime = generateRandomTime();
      store.schedules[dateStr].push({
        targetTime: randomTime,
        published: true,
        postId: newPost.id
      });

      publishedCount++;
      const msg = `[AutoPublisher] Published post for ${dateStr} at randomized time (${randomTime}): "${newPost.title}"`;
      console.log(msg);
      messages.push(msg);
    }
  }

  // 2. Ensure Schedule exists for Today & Tomorrow with randomized upload times
  const tomorrow = new Date(kstNow.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = getKSTDateString(tomorrow);

  [todayStr, tomorrowStr].forEach(dStr => {
    if (!store.schedules[dStr] || store.schedules[dStr].length === 0) {
      const randTime1 = generateRandomTime(9, 14); // Morning/Early Afternoon
      const randTime2 = generateRandomTime(15, 21); // Late Afternoon/Evening
      
      store.schedules[dStr] = [
        { targetTime: randTime1, published: false },
        { targetTime: randTime2, published: false }
      ];
      console.log(`[AutoPublisher] Created randomized schedules for ${dStr}: ${randTime1}, ${randTime2}`);
    }
  });

  // 3. Check today's schedules and trigger if current time >= targetTime
  const todaySchedules = store.schedules[todayStr] || [];
  for (const item of todaySchedules) {
    if (!item.published && currentTimeStr >= item.targetTime) {
      console.log(`[AutoPublisher] Target time ${item.targetTime} reached for ${todayStr}. Triggering random post update!`);
      
      const usedTitles = new Set(localPosts.map(p => p.title));
      const availableTopics = TOPIC_POOL.filter(t => !usedTitles.has(t.title));
      const selectedTopic = availableTopics.length > 0 
        ? availableTopics[Math.floor(Math.random() * availableTopics.length)]
        : TOPIC_POOL[Math.floor(Math.random() * TOPIC_POOL.length)];

      const newPost = await generatePostContent(selectedTopic, todayStr);
      localPosts.unshift(newPost);
      saveLocalPosts(localPosts);
      syncToFirestore(newPost);

      item.published = true;
      item.postId = newPost.id;

      publishedCount++;
      const msg = `[AutoPublisher] Auto-published daily post at randomized target time ${item.targetTime} (KST): "${newPost.title}"`;
      console.log(msg);
      messages.push(msg);
    }
  }

  store.lastCheck = kstNow.toISOString();
  saveScheduleStore(store);

  return { publishedCount, messages };
}
