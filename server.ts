import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { MOCK_POSTS } from "./src/constants";
import { getApplianceGroup, isVerifiedApplianceManualId } from "./src/data/applianceGroups";
import { expandContentIfNeeded } from "./src/lib/contentExpander";
import { runAutoPublisherService } from "./src/lib/autoPublisher";
import { extractSeoKeywords } from "./src/lib/seoKeywords";
import { generateRealisticPostDateTime, formatPostDateTime, parsePostTimestamp, slugify, matchPostBySlugOrId, normalizeTitle, toIso8601 } from "./src/lib/utils";
import {
  submitUrlsToSearchConsole,
  getIndexingLogs,
  getIndexingConfig,
  saveIndexingConfig,
  pingGoogleSearchConsoleSitemap,
  submitToIndexNow
} from "./src/lib/googleIndexing";

const VIEWS_FILE = path.join(process.cwd(), "views.json");
const EXPOSURES_FILE = path.join(process.cwd(), "exposures.json");

function loadViews(): Record<string, number> {
  try {
    if (fs.existsSync(VIEWS_FILE)) {
      return JSON.parse(fs.readFileSync(VIEWS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read views file:", e);
  }
  return {};
}

function saveViews(views: Record<string, number>) {
  try {
    fs.writeFileSync(VIEWS_FILE, JSON.stringify(views, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write views file:", e);
  }
}

function loadExposures(): Record<string, number> {
  try {
    if (fs.existsSync(EXPOSURES_FILE)) {
      return JSON.parse(fs.readFileSync(EXPOSURES_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read exposures file:", e);
  }
  return {};
}

function saveExposures(exposures: Record<string, number>) {
  try {
    fs.writeFileSync(EXPOSURES_FILE, JSON.stringify(exposures, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write exposures file:", e);
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function markdownToHtml(md: string): string {
  if (!md) return "";
  // If already full HTML and doesn't contain markdown headers or markdown tables
  if ((md.includes("<p>") || md.includes("<h2>") || md.includes("<div")) && !md.includes("## ") && !md.includes("|---")) {
    return md;
  }
  let html = md;
  // Convert markdown tables
  html = html.replace(/\|(.+)\|\n\|[-|\s:]+\|\n((?:\|.+\|\n?)+)/g, (match, headerLine, bodyLines) => {
    const headers = headerLine.split("|").map((h: string) => h.trim()).filter((h: string) => h.length > 0);
    const ths = headers.map((h: string) => `<th class="border border-slate-300 bg-slate-100 px-4 py-2 font-bold text-slate-800">${h}</th>`).join("");
    const rows = bodyLines.trim().split("\n").map((row: string) => {
      const cells = row.split("|").map((c: string) => c.trim()).filter((c: string) => c.length > 0);
      const tds = cells.map((c: string) => `<td class="border border-slate-200 px-4 py-2.5 text-slate-700">${c}</td>`).join("");
      return `<tr class="border-b border-slate-200 hover:bg-slate-50">${tds}</tr>`;
    }).join("");
    return `<div class="overflow-x-auto my-6"><table class="w-full text-left border-collapse border border-slate-300 rounded-lg"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table></div>`;
  });
  // Convert ### Headings
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>');
  // Convert ## Headings
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-extrabold text-slate-900 mt-8 mb-4 border-b border-slate-200 pb-2">$1</h2>');
  // Convert # Headings
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-2xl font-extrabold text-slate-900 mt-8 mb-4 pb-2">$1</h2>');
  // Convert bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-sm border border-slate-200">$1</code>');
  // Convert hr ---
  html = html.replace(/^---$/gim, '<hr class="my-6 border-slate-200" />');
  // Convert list items - item or * item
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="my-1.5 text-slate-700 leading-relaxed">$1</li>');
  html = html.replace(/(<li class="my-1.5.*<\/li>\n?)+/gms, '<ul class="list-disc pl-5 my-4 space-y-1">$&</ul>');
  // Convert paragraphs
  const blocks = html.split(/\n\n+/);
  html = blocks.map(block => {
    const trimmed = block.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("<h2") || trimmed.startsWith("<h3") || trimmed.startsWith("<div") || trimmed.startsWith("<ul") || trimmed.startsWith("<hr") || trimmed.startsWith("<table") || trimmed.startsWith("<li")) {
      return trimmed;
    }
    return `<p class="text-base text-slate-700 leading-relaxed my-4">${trimmed.replace(/\n/g, "<br/>")}</p>`;
  }).join("\n\n");

  return html;
}

function classifyCategory(title: string, content: string): "신혼금융" | "신혼가전" | "결혼준비" {
  const combined = (title + " " + content).toLowerCase();
  
  // 1. 신혼금융 Keywords (Finances, Loans, Rates, savings, taxes, etc.)
  if (
    combined.includes("대출") || 
    combined.includes("금리") || 
    combined.includes("금융") || 
    combined.includes("예금") || 
    combined.includes("적금") || 
    combined.includes("청약") || 
    combined.includes("재테크") || 
    combined.includes("지원") || 
    combined.includes("소득") || 
    combined.includes("월세") || 
    combined.includes("isa") || 
    combined.includes("절세") || 
    combined.includes("부동산") ||
    combined.includes("디딤돌") ||
    combined.includes("보험") ||
    combined.includes("자금") ||
    combined.includes("세금") ||
    combined.includes("지원금") ||
    combined.includes("주택") ||
    combined.includes("전세") ||
    combined.includes("은행") ||
    combined.includes("투자") ||
    combined.includes("자산") ||
    combined.includes("연금") ||
    combined.includes("카드")
  ) {
    return "신혼금융";
  }
  
  // 2. 신혼가전 Keywords (Appliances, Furniture, Interior, Brands, etc.)
  if (
    combined.includes("가전") || 
    combined.includes("인테리어") || 
    combined.includes("삼성") || 
    combined.includes("lg") || 
    combined.includes("빌트인") || 
    combined.includes("가구") || 
    combined.includes("청정") || 
    combined.includes("에어컨") || 
    combined.includes("스타일러") || 
    combined.includes("정수기") || 
    combined.includes("냉장고") || 
    combined.includes("조명") ||
    combined.includes("세탁기") ||
    combined.includes("건조기") ||
    combined.includes("비스포크") ||
    combined.includes("오브제") ||
    combined.includes("식기세척기") ||
    combined.includes("식세기") ||
    combined.includes("인덕션") ||
    combined.includes("티비") ||
    combined.includes("tv") ||
    combined.includes("소파") ||
    combined.includes("침대") ||
    combined.includes("시공") ||
    combined.includes("리모델링") ||
    combined.includes("커튼") ||
    combined.includes("매트리스")
  ) {
    return "신혼가전";
  }
  
  // Default fallback: 결혼준비 (Wedding Prep)
  return "결혼준비";
}

function extractFirstImage(content: string): string | null {
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = content.match(imgRegex);
  return match ? match[1] : null;
}

const LOCAL_POSTS_FILE = path.join(process.cwd(), "posts-local.json");

function isRelevantWeddingPost(post: any): boolean {
  if (!post || !post.title) return false;
  const title = (post.title || "").toLowerCase();
  const id = (post.id || "").toLowerCase();
  
  // Off-topic keywords to strictly exclude
  const blockedTerms = [
    "유튜브 쇼츠", "시청 지속시간", "쇼츠 알고리즘", "유튜브 조회수", 
    "indexing api", "[c안]", "채널 성장", "유튜브 수익화", "인스타 릴스 알고리즘"
  ];
  
  for (const term of blockedTerms) {
    if (title.includes(term) || id.includes(term)) {
      return false;
    }
  }
  return true;
}

function loadLocalPosts(): any[] {
  try {
    if (fs.existsSync(LOCAL_POSTS_FILE)) {
      const raw: any[] = JSON.parse(fs.readFileSync(LOCAL_POSTS_FILE, "utf-8"));
      const seenTitles = new Set<string>();
      const seenIds = new Set<string>();
      const unique: any[] = [];
      for (const p of raw) {
        if (!isRelevantWeddingPost(p)) {
          continue;
        }
        const norm = normalizeTitle(p.title);
        if (!p.id || !p.title || seenTitles.has(norm) || seenIds.has(p.id)) {
          continue;
        }
        seenTitles.add(norm);
        seenIds.add(p.id);
        unique.push(p);
      }
      return unique;
    }
  } catch (e) {
    console.error("Failed to read local posts:", e);
  }
  return [];
}

function saveLocalPosts(posts: any[]) {
  try {
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    const unique: any[] = [];
    for (const p of posts) {
      const norm = normalizeTitle(p.title);
      if (!p.id || !p.title || seenTitles.has(norm) || seenIds.has(p.id)) {
        continue;
      }
      seenTitles.add(norm);
      seenIds.add(p.id);
      unique.push(p);
    }
    fs.writeFileSync(LOCAL_POSTS_FILE, JSON.stringify(unique, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write local posts:", e);
  }
}

function getRequestBaseUrl(req: express.Request): string {
  const forwardedHost = req.headers["x-forwarded-host"] || req.headers["X-Forwarded-Host"];
  const host = forwardedHost || req.get("host") || "virginroad.kr";
  // Force HTTPS for non-localhost environments because Cloud Run forwards requests via HTTP internally
  const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("3000");
  const scheme = isLocal ? "http" : "https";
  return `${scheme}://${host}`;
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function extractChannelId(req: express.Request): string {
  // 1. From body
  if (req.body) {
    if (typeof req.body.channelId === "string" && req.body.channelId.trim()) return req.body.channelId.trim();
    if (typeof req.body.channel_id === "string" && req.body.channel_id.trim()) return req.body.channel_id.trim();
    if (typeof req.body.channelID === "string" && req.body.channelID.trim()) return req.body.channelID.trim();
    if (typeof req.body.channel === "string" && req.body.channel.trim()) return req.body.channel.trim();
    if (req.body.channel && typeof req.body.channel.id === "string" && req.body.channel.id.trim()) return req.body.channel.id.trim();
    if (req.body.channel && typeof req.body.channel.channelId === "string" && req.body.channel.channelId.trim()) return req.body.channel.channelId.trim();
    if (req.body.channel && typeof req.body.channel.channel_id === "string" && req.body.channel.channel_id.trim()) return req.body.channel.channel_id.trim();
    if (typeof req.body.id === "string" && req.body.id.trim()) return req.body.id.trim();
  }
  // 2. From query
  if (req.query) {
    if (typeof req.query.channelId === "string" && req.query.channelId.trim()) return req.query.channelId.trim();
    if (typeof req.query.channel_id === "string" && req.query.channel_id.trim()) return req.query.channel_id.trim();
    if (typeof req.query.channelID === "string" && req.query.channelID.trim()) return req.query.channelID.trim();
    if (typeof req.query.channel === "string" && req.query.channel.trim()) return req.query.channel.trim();
    if (typeof req.query.id === "string" && req.query.id.trim()) return req.query.id.trim();
  }
  // 3. From headers
  const headerKeys = ["x-channel-id", "x-channel", "x-channelid", "X-Channel-Id", "X-Channel-ID"];
  for (const key of headerKeys) {
    const val = req.headers[key] || req.headers[key.toLowerCase()];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string" && val[0].trim()) return val[0].trim();
  }
  
  // Default fallback
  return "virginroad";
}

async function fetchFirestorePosts(): Promise<any[]> {
  const projectId = "gen-lang-client-0326874047";
  const databaseId = "ai-studio-9ae01718-7459-4ac4-90d0-d2a27c2a0cc1";
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/posts`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !data.documents) return [];
    
    return data.documents.map((doc: any) => {
      const fields = doc.fields || {};
      const id = doc.name.split("/").pop() || "";
      const title = fields.title?.stringValue || "";
      const excerpt = fields.excerpt?.stringValue || "";
      const content = fields.content?.stringValue || "";
      const category = "신혼가전";
      const author = fields.author?.stringValue || "버진로드 기술편집팀";
      const date = fields.date?.stringValue || new Date().toISOString().split("T")[0];
      const image = fields.image?.stringValue || "";
      const readTime = fields.readTime?.stringValue || "7분";
      const hashtags = fields.hashtags?.arrayValue?.values?.map((v: any) => v.stringValue).filter(Boolean) || [];
      return { id, title, excerpt, content, category, author, date, image, readTime, hashtags };
    }).filter((p: any) => p.title && isVerifiedApplianceManualId(p.id));
  } catch (e) {
    console.error("fetchFirestorePosts error:", e);
    return [];
  }
}

async function fetchMergedPosts(): Promise<any[]> {
  // Authoritative primary source: 30 verified appliance technical manuals
  const combined: any[] = [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();

  const pushIfUniqueVerified = (p: any) => {
    if (!p || !p.title || !isVerifiedApplianceManualId(p.id)) return;
    if (!isRelevantWeddingPost(p)) return;
    const norm = normalizeTitle(p.title);
    const slug = slugify(p.title) || p.id;
    if (seenIds.has(p.id) || seenSlugs.has(slug) || seenSlugs.has(norm)) return;
    seenIds.add(p.id);
    seenSlugs.add(slug);
    seenSlugs.add(norm);
    combined.push({
      ...p,
      category: "신혼가전",
    });
  };

  // 1. Verified built-in manuals first (always clean regenerated HTML)
  MOCK_POSTS.forEach(pushIfUniqueVerified);

  // 2. Any additional verified manual-* posts from local storage
  loadLocalPosts().forEach(pushIfUniqueVerified);

  // 3. Any additional verified manual-* posts from Firestore (skips legacy fin-/wed-/app- docs)
  try {
    const firestorePosts = await fetchFirestorePosts();
    firestorePosts.forEach(pushIfUniqueVerified);
  } catch (err) {
    console.error("Failed to fetch firestore posts:", err);
  }

  const sorted = combined.sort((a, b) => parsePostTimestamp(b.date, b.id) - parsePostTimestamp(a.date, a.id));

  return sorted.map(post => {
    const hashtags = post.hashtags || [];
    const expandedContent = expandContentIfNeeded(post.title, post.category, hashtags, post.content || "", post.id, post.image);
    return {
      ...post,
      content: expandedContent
    };
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  // 빌드 시 사전 렌더링(scripts/prerender-snapshot.mjs)용으로 띄울 때는 페이지 응답만 필요하므로
  // 자동 발행·색인 핑 같은 백그라운드 작업을 켜지 않는다.
  const isPrerenderSnapshot = process.env.PRERENDER_SNAPSHOT === "1";

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom CORS headers middleware to allow preflight and data transfer from Blog Studio
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, x-api-key, Authorization, X-Channel-ID, X-Channel-Id, x-channel-id, Accept, Origin");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Google Search Console & Search Engine Crawler Support Header
  app.use((req, res, next) => {
    res.setHeader("X-Robots-Tag", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    next();
  });

  // API Route: increment views
  app.post("/api/views", (req, res) => {
    const { id } = req.body;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    const views = loadViews();
    views[id] = (views[id] || 0) + 1;
    saveViews(views);
    res.json({ id, views: views[id] });
  });

  // API Route: fetch views (supports ?ids=a,b or ?id=a)
  app.get("/api/views", (req, res) => {
    const { id, ids } = req.query;
    const views = loadViews();

    if (ids && typeof ids === "string") {
      const idList = ids.split(",");
      const result: Record<string, number> = {};
      idList.forEach((key) => {
        result[key] = views[key] || 0;
      });
      return res.json({ views: result });
    }

    if (id && typeof id === "string") {
      return res.json({ id, views: views[id] || 0 });
    }

    res.json({ views });
  });

  // API Route: increment exposures (single)
  app.post("/api/exposures", (req, res) => {
    const { id } = req.body;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    const exposures = loadExposures();
    exposures[id] = (exposures[id] || 0) + 1;
    saveExposures(exposures);
    res.json({ id, exposures: exposures[id] });
  });

  // API Route: increment exposures in bulk (highly performant list viewing)
  app.post("/api/exposures/bulk", (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Invalid post IDs array" });
    }
    const exposures = loadExposures();
    ids.forEach((id) => {
      if (typeof id === "string" && id.trim()) {
        exposures[id] = (exposures[id] || 0) + 1;
      }
    });
    saveExposures(exposures);
    res.json({ success: true, count: ids.length });
  });

  // API Route: fetch exposures (supports ?ids=a,b or ?id=a)
  app.get("/api/exposures", (req, res) => {
    const { id, ids } = req.query;
    const exposures = loadExposures();

    if (ids && typeof ids === "string") {
      const idList = ids.split(",");
      const result: Record<string, number> = {};
      idList.forEach((key) => {
        result[key] = exposures[key] || 0;
      });
      return res.json({ exposures: result });
    }

    if (id && typeof id === "string") {
      return res.json({ id, exposures: exposures[id] || 0 });
    }

    res.json({ exposures });
  });

  const DEBUG_LOG_FILE = path.join(process.cwd(), "webhook-debug.json");

  const logWebhookRequest = (req: express.Request, errorMsg?: string, responseSent?: any) => {
    try {
      let logs: any[] = [];
      if (fs.existsSync(DEBUG_LOG_FILE)) {
        try {
          logs = JSON.parse(fs.readFileSync(DEBUG_LOG_FILE, "utf-8"));
        } catch (e) {
          logs = [];
        }
      }
      logs.push({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body,
        error: errorMsg || null,
        responseSent: responseSent || null
      });
      // Limit to last 50 logs
      if (logs.length > 50) {
        logs = logs.slice(logs.length - 50);
      }
      fs.writeFileSync(DEBUG_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to log webhook debug info:", err);
    }
  };

  // GET /api/webhook-debug: Endpoint to examine incoming webhook payload structures
  app.get("/api/webhook-debug", (req, res) => {
    try {
      if (fs.existsSync(DEBUG_LOG_FILE)) {
        const fileContent = fs.readFileSync(DEBUG_LOG_FILE, "utf-8");
        res.setHeader("Content-Type", "application/json");
        return res.send(fileContent);
      }
      return res.json({ message: "No webhook traffic logged yet. Trigger a connection test." });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to read debug log", details: err.message });
    }
  });

  // GET/POST /api/auto-publish/run: Manual trigger for daily category randomized publisher
  app.all("/api/auto-publish/run", async (req, res) => {
    try {
      const result = await runAutoPublisherService();
      res.json({
        success: true,
        message: "Auto publisher service executed successfully.",
        publishedCount: result.publishedCount,
        todayStatus: result.todayStatus,
        logs: result.messages
      });
    } catch (err: any) {
      console.error("Auto publisher execution error:", err);
      res.status(500).json({ error: "Failed to execute auto publisher", details: err.message });
    }
  });

  // GET /api/auto-publish/status: Get current schedule, times, and publishing status
  app.get("/api/auto-publish/status", async (req, res) => {
    try {
      const result = await runAutoPublisherService();
      res.json({
        success: true,
        rule: {
          frequency: "1일 1포스팅 (검증된 가전 관리 매뉴얼 스케줄 관리)",
          timing: "골든타임(08:15 ~ 21:45 KST) 중 랜덤 시간 자동 스케줄링",
          categoryCycle: "신혼가전 · 생활가전 사용 및 관리 매뉴얼 아카이브"
        },
        todayStatus: result.todayStatus,
        lastLogs: result.messages
      });
    } catch (err: any) {
      console.error("Auto publisher status error:", err);
      res.status(500).json({ error: "Failed to get auto publisher status", details: err.message });
    }
  });

  // ==========================================
  // GOOGLE SEARCH CONSOLE & INDEXING API ROUTES
  // ==========================================

  // GET /api/indexing/status: Get overall Search Console submission status and config
  app.get("/api/indexing/status", async (req, res) => {
    try {
      const config = getIndexingConfig();
      const logs = getIndexingLogs();
      const hostUrl = getRequestBaseUrl(req);
      const posts = await fetchMergedPosts();

      res.json({
        success: true,
        config: {
          keyConfigured: config.keyConfigured,
          autoIndexOnPublish: config.autoIndexOnPublish,
          clientEmail: config.serviceAccountKey?.client_email || null,
          totalSubmissions: config.totalSubmissions,
          lastPingTime: config.lastPingTime
        },
        stats: {
          totalPosts: posts.length,
          sitemapUrl: `${hostUrl}/sitemap.xml`,
          robotsUrl: `${hostUrl}/robots.txt`,
          rssUrl: `${hostUrl}/rss.xml`
        },
        recentLogs: logs.slice(0, 30)
      });
    } catch (err: any) {
      console.error("Failed to get indexing status:", err);
      res.status(500).json({ error: "Failed to get indexing status", details: err.message });
    }
  });

  // POST /api/indexing/submit: Submit specific post URL or all posts to Google Search Console
  app.post("/api/indexing/submit", async (req, res) => {
    try {
      const hostUrl = getRequestBaseUrl(req);
      const { url, urls, all } = req.body || {};

      let targetUrls: string[] = [];

      if (all === true) {
        // Collect all verified appliance manual URLs, tools, and static pages
        const posts = await fetchMergedPosts();
        targetUrls = [
          "",
          "/category/신혼가전",
          "/tools/power-cost",
          "/tools/filter-cycle",
          "/about",
          "/policy",
          "/contact",
          "/privacy",
          "/terms",
          "/announcement",
          ...posts.map(p => `/post/${slugify(p.title) || p.id}`)
        ];
      } else if (Array.isArray(urls) && urls.length > 0) {
        targetUrls = urls;
      } else if (typeof url === "string" && url.trim().length > 0) {
        targetUrls = [url.trim()];
      } else {
        return res.status(400).json({ error: "No url or urls provided for indexing submission" });
      }

      const result = await submitUrlsToSearchConsole(targetUrls, hostUrl);
      res.json({
        success: true,
        message: result.message,
        submittedCount: result.submittedCount,
        googleApiResults: result.googleApiResults,
        sitemapPingResults: result.sitemapPingResults,
        indexNowResult: result.indexNowResult
      });
    } catch (err: any) {
      console.error("Indexing submission error:", err);
      res.status(500).json({ error: "Failed to submit URLs to Search Console", details: err.message });
    }
  });

  // POST /api/indexing/ping: Immediately ping Google Search Console & Bing Sitemap
  app.post("/api/indexing/ping", async (req, res) => {
    try {
      const hostUrl = getRequestBaseUrl(req);
      const results = await pingGoogleSearchConsoleSitemap(hostUrl);
      res.json({
        success: true,
        message: "Google & Bing Sitemap Ping이 성공적으로 전송되었습니다.",
        sitemapUrl: `${hostUrl}/sitemap.xml`,
        results
      });
    } catch (err: any) {
      console.error("Sitemap ping error:", err);
      res.status(500).json({ error: "Failed to ping sitemap", details: err.message });
    }
  });

  // POST /api/indexing/config: Update Google Service Account key or settings
  app.post("/api/indexing/config", (req, res) => {
    try {
      const { serviceAccountKey, autoIndexOnPublish } = req.body || {};
      let saKey = serviceAccountKey;
      if (typeof saKey === "string") {
        try {
          saKey = JSON.parse(saKey);
        } catch {
          return res.status(400).json({ error: "Invalid JSON format for Service Account Key" });
        }
      }

      const updated = saveIndexingConfig({
        ...(saKey ? { serviceAccountKey: saKey } : {}),
        ...(typeof autoIndexOnPublish === "boolean" ? { autoIndexOnPublish } : {})
      });

      res.json({
        success: true,
        message: "구글 색인 설정이 저장되었습니다.",
        config: {
          keyConfigured: updated.keyConfigured,
          autoIndexOnPublish: updated.autoIndexOnPublish,
          clientEmail: updated.serviceAccountKey?.client_email || null,
          totalSubmissions: updated.totalSubmissions
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to save indexing config", details: err.message });
    }
  });

  // GET /api/indexing/logs: Retrieve recent indexing audit logs
  app.get("/api/indexing/logs", (req, res) => {
    try {
      const logs = getIndexingLogs();
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to get indexing logs", details: err.message });
    }
  });

  // ALL /api/indexing/auto-trigger: Silent background auto-sync for Google Search Console & IndexNow
  app.all("/api/indexing/auto-trigger", async (req, res) => {
    try {
      const hostUrl = getRequestBaseUrl(req);
      const posts = await fetchMergedPosts();
      const topUrls = [
        "",
        "/category/신혼가전",
        "/tools/power-cost",
        "/tools/filter-cycle",
        "/about",
        "/policy",
        "/contact",
        "/privacy",
        "/terms",
        "/announcement",
        ...posts.slice(0, 15).map(p => `/post/${slugify(p.title) || p.id}`)
      ];

      // Execute asynchronously in background so response returns instantaneously
      submitUrlsToSearchConsole(topUrls, hostUrl)
        .then(result => {
          console.log(`[Google Search Console Auto-Engine] Silent auto-trigger complete (${result.submittedCount} URLs synced)`);
        })
        .catch(err => {
          console.warn("[Google Search Console Auto-Engine Warning]:", err.message);
        });

      res.json({ success: true, message: "Search Console silent auto-sync scheduled" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/posts: Serving merged dynamic posts (Local file + Firestore database posts with channelId tracking)
  // "/data/posts.json" 은 Vercel(정적 호스팅)에서 빌드 시 만들어 둔 파일로 서빙되는 주소다.
  app.get(["/api/posts", "/data/posts.json"], async (req, res) => {
    try {
      const posts = await fetchMergedPosts();
      const reqChannelId = extractChannelId(req);
      const hostUrl = getRequestBaseUrl(req);
      
      const postsWithChannel = posts.map(p => {
        const slug = slugify(p.title) || p.id;
        return {
          ...p,
          url: `${hostUrl}/post/${slug}`,
          channelId: reqChannelId,
          channel_id: reqChannelId,
          channel: {
            id: reqChannelId,
            name: "버진로드",
            url: `${hostUrl}/`
          }
        };
      });

      // Robust headers matching the expected channel validations
      res.setHeader("X-Channel-ID", String(reqChannelId));
      res.setHeader("X-Channel-Id", String(reqChannelId));
      res.setHeader("x-channel-id", String(reqChannelId));
      
      logWebhookRequest(req, undefined, { count: postsWithChannel.length });
      res.json(postsWithChannel);
    } catch (err: any) {
      console.error("Failed to serve merged posts:", err);
      logWebhookRequest(req, err.message);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // RSS Feed XML generator
  const handleRssFeed = async (req: express.Request, res: express.Response) => {
    try {
      const posts = await fetchMergedPosts();
      const hostUrl = getRequestBaseUrl(req);
      const channelId = extractChannelId(req);
      
      const xmlItems = posts.map((post) => {
        const slug = slugify(post.title) || post.id;
        const postUrl = `${hostUrl}/post/${encodeURIComponent(slug)}`;
        const escapedTitle = escapeXml(post.title || "무제");
        const escapedExcerpt = escapeXml(post.excerpt || "");
        const escapedAuthor = escapeXml(post.author || "버진로드 기술편집팀");
        const escapedCategory = escapeXml(post.category || "신혼가전");
        const escapedLink = escapeXml(postUrl);
        
        let pubDateStr = new Date().toUTCString();
        if (post.date) {
          try {
            const parsed = new Date(post.date);
            if (!isNaN(parsed.getTime())) pubDateStr = parsed.toUTCString();
          } catch (e) {}
        }

        return `    <item>
      <title>${escapedTitle}</title>
      <link>${escapedLink}</link>
      <guid isPermaLink="true">${escapedLink}</guid>
      <description>${escapedExcerpt}</description>
      <content:encoded><![CDATA[${post.content || post.excerpt || ""}]]></content:encoded>
      <pubDate>${pubDateStr}</pubDate>
      <dc:creator>${escapedAuthor}</dc:creator>
      <category>${escapedCategory}</category>
    </item>`;
      }).join("\n");

      const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:sy="http://purl.org/rss/1.0/modules/syndication/"
  xmlns:slash="http://purl.org/rss/1.0/modules/slash/">
  <channel>
    <title>버진로드 — 생활·신혼가전 기술 매뉴얼 아카이브</title>
    <atom:link href="${hostUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <link>${hostUrl}/</link>
    <description>드럼세탁기·건조기·식기세척기·인덕션·에어컨 등 30종 생활가전 공식 유지관리 매뉴얼과 전기요금 누진제 계산기, 필터 교체 주기 진단기 제공</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>ko-KR</language>
    <sy:updatePeriod>daily</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <generator>Virginroad Archive RSS Engine</generator>
    <image>
      <url>${hostUrl}/icon.svg</url>
      <title>버진로드</title>
      <link>${hostUrl}/</link>
    </image>
${xmlItems}
  </channel>
</rss>`;

      res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
      res.setHeader("X-Channel-ID", String(channelId));
      res.setHeader("X-Channel-Id", String(channelId));
      res.setHeader("x-channel-id", String(channelId));
      
      logWebhookRequest(req, undefined, { count: posts.length, format: "rss-xml" });
      return res.status(200).send(rssXml);
    } catch (err: any) {
      console.error("Failed to generate RSS feed XML:", err);
      logWebhookRequest(req, `RSS Error: ${err.message}`);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(500).send("Failed to generate RSS feed XML");
    }
  };

  // GET /api/blogstudio-webhook: Responding to connectivity tests from Blog Studio
  const handleChannelPing = (req: express.Request, res: express.Response) => {
    const channelId = extractChannelId(req);
    const hostUrl = getRequestBaseUrl(req);
    
    const responsePayload = {
      status: "success",
      message: "Channel verification successful. Ready to receive posts.",
      url: `${hostUrl}/`,
      id: channelId,
      channelId: channelId,
      channel_id: channelId,
      channel: {
        id: channelId,
        name: "버진로드",
        url: `${hostUrl}/`
      },
      data: {
        url: `${hostUrl}/`,
        channelId: channelId,
        channel_id: channelId,
        id: channelId,
        channel: {
          id: channelId,
          name: "버진로드",
          url: `${hostUrl}/`
        }
      }
    };
    
    res.setHeader("X-Channel-ID", String(channelId));
    res.setHeader("X-Channel-Id", String(channelId));
    res.setHeader("x-channel-id", String(channelId));
    logWebhookRequest(req, "GET Ping connection test", responsePayload);
    return res.status(200).json(responsePayload);
  };

  // POST webhook endpoints for Blog Studio: supporting root POST / and specific endpoints /api/posts & /api/blogstudio-webhook
  const handleIncomingPost = async (req: express.Request, res: express.Response) => {
    const rawApiKey = req.headers["x-api-key"] || req.headers["X-API-Key"] || req.query.key || req.query.apiKey;
    const hostUrl = getRequestBaseUrl(req);
    console.log(`Received incoming blog post webhook. API Key header/query: "${rawApiKey || "none"}"`);
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    
    // Support multiple incoming field mappings to ensure the payload parses successfully
    const rawTitle = req.body.title || req.body.subject || req.body.header || req.body.name;
    const rawContent = req.body.content || req.body.body || req.body.text || req.body.description || req.body.desc;
    const status = req.body.status || req.body.postStatus || "published";
    const seoDescription = req.body.summary || req.body.subtitle || req.body.seoDescription || req.body.excerpt || "";
    
    // Support and capture channel IDs from request body, query or headers to pass verification
    const channelId = extractChannelId(req);
    
    const isTestPlaceholder = 
      !rawTitle || 
      typeof rawTitle !== "string" || 
      rawTitle.trim() === "" || 
      rawTitle.includes("{{title}}") || 
      rawTitle.trim().toLowerCase() === "test" || 
      rawTitle.trim().toLowerCase() === "ping";

    if (isTestPlaceholder) {
      console.log("Empty or template placeholder title found. Treating as a connection test / ping.");
      const responseBody = {
        status: "success",
        message: "Connection test successful. Ready to receive posts.",
        url: `${hostUrl}/`,
        id: channelId,
        channelId: channelId,
        channel_id: channelId,
        channel: {
          id: channelId,
          name: "버진로드",
          url: `${hostUrl}/`
        },
        data: {
          url: `${hostUrl}/`,
          channelId: channelId,
          channel_id: channelId,
          id: channelId,
          channel: {
            id: channelId,
            name: "버진로드",
            url: `${hostUrl}/`
          }
        }
      };
      res.setHeader("X-Channel-ID", String(channelId));
      res.setHeader("X-Channel-Id", String(channelId));
      res.setHeader("x-channel-id", String(channelId));
      logWebhookRequest(req, "No title found or template placeholder. connection test.", responseBody);
      return res.status(200).json(responseBody);
    }
    
    const title = rawTitle.trim();
    const rawContentStr = typeof rawContent === "string" ? rawContent : "";
    const htmlContent = markdownToHtml(rawContentStr);
    
    try {
      // 1. Sluggify and sanitize IDs
      const explicitSlug = req.body.slug && typeof req.body.slug === "string" ? req.body.slug.trim() : null;
      const rawSlug = slugify(title);
      const postId = explicitSlug || rawSlug || `post-${Date.now()}`;
      
      // 2. Category is unified to 신혼가전 (Appliance Technical Manual Archive)
      const category = "신혼가전";
      
      // 3. Extract thumbnail / image if explicitly provided (no stock fallback)
      let image = "";
      if (req.body.thumbnail) {
        if (typeof req.body.thumbnail === "object" && req.body.thumbnail.src) {
          image = req.body.thumbnail.src;
        } else if (typeof req.body.thumbnail === "string") {
          image = req.body.thumbnail;
        }
      }
      if (!image && req.body.image && typeof req.body.image === "string") {
        image = req.body.image;
      }
      if (!image) {
        image = extractFirstImage(htmlContent) || "";
      }
      
      const rawTags = req.body.tags || req.body.hashtags || [];
      const hashtags = Array.isArray(rawTags) && rawTags.length > 0
        ? rawTags.map((t: any) => String(t).trim()).filter(Boolean)
        : [category, "가전매뉴얼", "버진로드"];
      
      const author = req.body.author && typeof req.body.author === "string" ? req.body.author.trim() : "버진로드";
      const finalContent = expandContentIfNeeded(title, category, hashtags, htmlContent, postId, image);

      // 4. Calculate reading time (approx 500 characters per minute)
      const plainText = stripHtml(finalContent);
      const readTime = req.body.readTime || `${Math.max(1, Math.ceil(plainText.length / 500))}분`;
      
      // 5. Excerpt extraction fallback
      const excerpt = seoDescription.trim() || (plainText.slice(0, 140) + (plainText.length > 140 ? "..." : ""));
      
      // 6. Assemble beautiful Post object using Korea Standard Time (KST, UTC+9) with realistic randomized posting time
      const postDateTime = generateRealisticPostDateTime(req.body.date, postId);
      
      const newPost = {
        id: postId,
        title,
        excerpt: excerpt.trim(),
        content: finalContent,
        category,
        author,
        date: postDateTime,
        image,
        readTime,
        hashtags
      };
      
      // 7. Save to local posts file (keeps persistent and immediate listing in app)
      const localPosts = loadLocalPosts();
      // Avoid duplicate post ID or completely identical title
      const existingIdx = localPosts.findIndex(p => p.id === postId || normalizeTitle(p.title) === normalizeTitle(newPost.title));
      if (existingIdx !== -1) {
        localPosts[existingIdx] = newPost; // Update existing post
      } else {
        localPosts.unshift(newPost); // Insert as the newest item
      }
      saveLocalPosts(localPosts);
      console.log(`Saved post locally to posts-local.json: ${postId}`);
 
      // 8. ALSO write to Firestore asynchronously so the database syncs if the rules permit
      const apiKey = "AIzaSyDneiaJczNqU2Od6c0lMe3AdSQKar5yGA4";
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/gen-lang-client-0326874047/databases/ai-studio-9ae01718-7459-4ac4-90d0-d2a27c2a0cc1/documents/posts/${postId}?key=${apiKey}`;
      const firestoreBody = {
        fields: {
          title: { stringValue: newPost.title },
          excerpt: { stringValue: newPost.excerpt },
          content: { stringValue: newPost.content },
          category: { stringValue: newPost.category },
          author: { stringValue: newPost.author },
          date: { stringValue: newPost.date },
          image: { stringValue: newPost.image },
          readTime: { stringValue: newPost.readTime },
          hashtags: {
            arrayValue: {
              values: newPost.hashtags.map(t => ({ stringValue: t }))
            }
          },
          secretToken: { stringValue: "virginroad-secure-secret-token-2026" }
        }
      };
      
      fetch(firestoreUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(firestoreBody)
      })
      .then(res => {
        console.log(`Firestore dual-write status for ${postId}:`, res.status);
      })
      .catch(err => {
        console.warn(`Firestore dual-write background warning for ${postId}:`, err.message);
      });

      // Auto-submit webhook published post to Google Search Console
      const postSlug = slugify(newPost.title) || postId;
      submitUrlsToSearchConsole([`/post/${postSlug}`], hostUrl)
        .then(res => console.log(`[Google Indexing Webhook Trigger] Search Console notified for /post/${postSlug}:`, res.message))
        .catch(err => console.warn(`[Google Indexing Webhook Warning]`, err.message));
 
      // 9. Return structured success matching Blog Studio's required output
      const successResponse = {
        status: "success",
        message: "Post published successfully",
        id: postId,
        postId: postId,
        channelId: channelId,
        channel_id: channelId,
        url: `${hostUrl}/post/${postId}`,
        data: {
          url: `${hostUrl}/post/${postId}`,
          postId: postId,
          id: postId,
          channelId: channelId,
          channel_id: channelId,
          channel: {
            id: channelId,
            name: "버진로드",
            url: `${hostUrl}/`
          }
        }
      };
      logWebhookRequest(req, undefined, successResponse);
      res.json(successResponse);
    } catch (e: any) {
      console.error("Error processing incoming webhook:", e);
      logWebhookRequest(req, e.message, { error: "Failed to publish post" });
      res.status(500).json({ error: "Failed to publish post", details: e.message });
    }
  };
 
  // Listen to GET requests for validation & configuration checks from Blog Studio
  app.get("/api/blogstudio-webhook", handleChannelPing);
  app.get("/api/posts-ping", handleChannelPing);
  app.get("/api/publish", handleChannelPing);
  app.get("/api/webhook", handleChannelPing);
  app.get("/publish", handleChannelPing);
  app.get("/webhook", handleChannelPing);
 
  // Serve standard RSS XML fields on multiple standard locations
  app.get("/rss.xml", handleRssFeed);
  app.get("/rss", handleRssFeed);
  app.get("/feed.xml", handleRssFeed);
  app.get("/feed", handleRssFeed);
  app.get("/api/posts/rss", handleRssFeed);

  // Intellectual Root level interceptor:
  // If the request contains Blog Studio verification markers (such as query channelId or JSON accept headers)
  // we return the channel verification JSON immediately instead of rendering the SPA html representation.
  app.get("/", (req, res, next) => {
    const isBotOrValidation = 
      req.query.channelId || 
      req.query.channel_id || 
      req.headers["x-channel-id"] || 
      req.headers["X-Channel-ID"] ||
      (req.headers["accept"] && req.headers["accept"].includes("application/json"));
      
    if (isBotOrValidation) {
      return handleChannelPing(req, res);
    }
    next();
  });

  // Listen to POST requests across all possible configurations of endpoints
  app.post("/", handleIncomingPost);
  app.post("/api/posts", handleIncomingPost);
  app.post("/api/posts/create", handleIncomingPost);
  app.post("/api/blogstudio-webhook", handleIncomingPost);
  app.post("/api/publish", handleIncomingPost);
  app.post("/api/webhook", handleIncomingPost);
  app.post("/publish", handleIncomingPost);
  app.post("/webhook", handleIncomingPost);

  // Serve ads.txt with correct content-type and headers
  app.get("/ads.txt", (req, res) => {
    const adsTxtPath = path.join(process.cwd(), "public", "ads.txt");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
    
    if (fs.existsSync(adsTxtPath)) {
      try {
        const content = fs.readFileSync(adsTxtPath, "utf-8");
        return res.send(content);
      } catch (err) {
        // Fallback to default
      }
    }
    res.send("google.com, pub-9552509372228899, DIRECT, f08c47fec0942fa0");
  });

  // Google Search Console Automated HTML File Verification Endpoint
  // Supports any verification token pattern: /google[a-zA-Z0-9_-]+.html (e.g., /google1234567890abcdef.html)
  app.get(/^\/google([a-zA-Z0-9_-]+)\.html$/, (req, res) => {
    const filename = req.path.replace(/^\//, "");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(`google-site-verification: ${filename}`);
  });

  // Dynamic Robots.txt generator pointing to the sitemap.xml
  app.get("/robots.txt", (req, res) => {
    const hostUrl = getRequestBaseUrl(req);
    const robotsTxtPath = path.join(process.cwd(), "public", "robots.txt");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    
    if (fs.existsSync(robotsTxtPath)) {
      try {
        let content = fs.readFileSync(robotsTxtPath, "utf-8");
        content = content.replace(/https:\/\/virginroad\.kr/g, hostUrl);
        return res.send(content);
      } catch (err) {
        // Fallback to default
      }
    }
    
    res.send(`User-agent: Mediapartners-Google
Allow: /

User-agent: AdsBot-Google
Allow: /

User-agent: Google-Display-Ads-Bot
Allow: /

User-agent: Googlebot
Allow: /

User-agent: *
Allow: /

Sitemap: ${hostUrl}/sitemap.xml
`);
  });

  // Dynamic Sitemap.xml generator mapping all valid static routes, tools, category, and verified manuals
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const hostUrl = getRequestBaseUrl(req);
      const posts = await fetchMergedPosts();
      
      const staticPages = [
        { path: "/", priority: "1.0", changefreq: "daily" },
        { path: "/category/%EC%8B%A0%ED%98%BC%EA%B0%80%EC%A0%84", priority: "0.9", changefreq: "daily" },
        { path: "/tools/power-cost", priority: "0.9", changefreq: "weekly" },
        { path: "/tools/filter-cycle", priority: "0.9", changefreq: "weekly" },
        { path: "/about", priority: "0.6", changefreq: "monthly" },
        { path: "/policy", priority: "0.6", changefreq: "monthly" },
        { path: "/contact", priority: "0.5", changefreq: "monthly" },
        { path: "/privacy", priority: "0.4", changefreq: "monthly" },
        { path: "/terms", priority: "0.4", changefreq: "monthly" },
        { path: "/announcement", priority: "0.5", changefreq: "weekly" },
      ];

      const currentDate = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      staticPages.forEach((p) => {
        xml += `  <url>\n`;
        xml += `    <loc>${hostUrl}${p.path}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
        xml += `    <priority>${p.priority}</priority>\n`;
        xml += `  </url>\n`;
      });

      posts.forEach((post) => {
        const slug = slugify(post.title) || post.id;
        let lastModDate = currentDate;
        if (post.updated || post.date) {
          try {
            const d = new Date(post.updated || post.date);
            if (!isNaN(d.getTime())) {
              lastModDate = d.toISOString().split("T")[0];
            }
          } catch (e) {}
        }
        
        xml += `  <url>\n`;
        xml += `    <loc>${hostUrl}/post/${encodeURIComponent(slug)}</loc>\n`;
        xml += `    <lastmod>${lastModDate}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });

      xml += `</urlset>`;

      res.type("application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
      res.send(xml);
    } catch (err: any) {
      console.error("Failed to generate sitemap.xml:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Vite middleware in dev vs static serving in production
  let vite: any = null;
  const isProduction = process.env.NODE_ENV === "production" && fs.existsSync(path.join(process.cwd(), "dist", "index.html"));

  if (!isProduction) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));
  }

  async function getBaseHtml(url: string): Promise<string> {
    let raw = "";
    if (isProduction) {
      const distHtmlPath = path.join(process.cwd(), "dist", "index.html");
      raw = fs.readFileSync(distHtmlPath, "utf-8");
    } else {
      const devHtmlPath = path.join(process.cwd(), "index.html");
      raw = fs.readFileSync(devHtmlPath, "utf-8");
      if (vite) {
        raw = await vite.transformIndexHtml(url, raw);
      }
    }

    // Google Search Console Dynamic Verification Tag Injection
    const indexingConfig = getIndexingConfig();
    const verificationCode = process.env.GOOGLE_SITE_VERIFICATION || indexingConfig.googleSiteVerification || "f08c47fec0942fa0-virginroad-kr";
    raw = injectOrReplaceMetaInHtml(raw, "google-site-verification", verificationCode);

    return raw;
  }

  function injectOrReplaceMetaInHtml(html: string, nameOrProperty: string, content: string, isProperty = false): string {
    const attr = isProperty ? "property" : "name";
    const regex = new RegExp(`<meta[^>]*(?:${attr}="${nameOrProperty}"|content="[^"]*"[^>]*${attr}="${nameOrProperty}")[^>]*>`, "i");
    const newMetaTag = `<meta ${attr}="${nameOrProperty}" content="${content.replace(/"/g, "&quot;")}" />`;
    if (html.match(regex)) {
      return html.replace(regex, newMetaTag);
    }
    return html.replace("</head>", `  ${newMetaTag}\n</head>`);
  }

  function removeMetaTagFromHtml(html: string, nameOrProperty: string, isProperty = false): string {
    const attr = isProperty ? "property" : "name";
    const regex = new RegExp(`\\s*<meta[^>]*(?:${attr}="${nameOrProperty}"|content="[^"]*"[^>]*${attr}="${nameOrProperty}")[^>]*>`, "gi");
    return html.replace(regex, "");
  }

  // AdSense Policy: Strip Google AdSense auto-ads script from 404, legal, contact, policy, and announcement pages
  function stripAdSenseScript(html: string): string {
    return html.replace(
      /\s*<script[^>]*pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js[^>]*><\/script>\s*/gi,
      "\n"
    );
  }

  function setCanonicalInHtml(html: string, canonicalUrl: string): string {
    const canonicalRegex = /<link[^>]*rel="canonical"[^>]*>/i;
    const newCanonicalElement = `<link rel="canonical" href="${canonicalUrl}" />`;
    if (html.match(canonicalRegex)) {
      return html.replace(canonicalRegex, newCanonicalElement);
    }
    return html.replace("</head>", `  ${newCanonicalElement}\n</head>`);
  }

  function setJsonLdInHtml(html: string, id: string, data: object): string {
    const scriptTag = `<script id="${id}" type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
    const regex = new RegExp(`<script[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/script>`, "i");
    if (html.match(regex)) {
      return html.replace(regex, scriptTag);
    }
    return html.replace("</head>", `  ${scriptTag}\n</head>`);
  }

  function removeJsonLdFromHtml(html: string, id: string): string {
    const regex = new RegExp(`\\s*<script[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/script>`, "gi");
    return html.replace(regex, "");
  }

  function buildNotFoundHtml(baseHtml: string): string {
    let html = stripAdSenseScript(baseHtml);
    html = html.replace(/<title>[^<]*<\/title>/, `<title>요청하신 페이지를 찾을 수 없습니다 (404) | 버진로드</title>`);
    html = injectOrReplaceMetaInHtml(html, "robots", "noindex, nofollow");
    html = injectOrReplaceMetaInHtml(
      html,
      "description",
      "요청하신 가전 관리 매뉴얼 또는 페이지가 이동되었거나 삭제되었습니다. 버진로드 메인 아카이브에서 원하는 가전 매뉴얼을 찾아보세요."
    );
    html = removeJsonLdFromHtml(html, "jsonld-primary");
    html = removeJsonLdFromHtml(html, "jsonld-breadcrumb");

    const ssr404Markup = `
  <div id="ssr-not-found" style="max-width: 780px; margin: 0 auto; padding: 64px 20px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="border-bottom: 1px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; letter-spacing: 0.04em; margin: 0 0 8px 0;">404 NOT FOUND</p>
      <h1 style="font-size: 28px; font-weight: 800; line-height: 1.35; margin: 0 0 12px 0;">요청하신 페이지를 찾을 수 없습니다.</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">입력하신 주소가 변경되었거나 삭제된 문서입니다. 아래 버진로드 공식 생활가전 기술 매뉴얼 아카이브와 실용 도구로 이동해 필요한 정보를 확인하실 수 있습니다.</p>
    </header>
    <nav style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 36px;">
      <a href="/" style="display: block; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: #0f172a; background: #f8fafc;">
        <strong style="display: block; font-size: 15px; margin-bottom: 4px; color: #0f766e;">전체 가전 매뉴얼 (30종)</strong>
        <span style="font-size: 13.5px; color: #475569;">세탁·주방·냉난방·생활가전 유지관리 표준 가이드</span>
      </a>
      <a href="/tools/power-cost" style="display: block; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: #0f172a; background: #f8fafc;">
        <strong style="display: block; font-size: 15px; margin-bottom: 4px; color: #0f766e;">가전 전기요금 계산기</strong>
        <span style="font-size: 13.5px; color: #475569;">2026 한전 주택용 누진제 월간 요금 시뮬레이션</span>
      </a>
      <a href="/tools/filter-cycle" style="display: block; padding: 18px; border: 1px solid #e2e8f0; border-radius: 12px; text-decoration: none; color: #0f172a; background: #f8fafc;">
        <strong style="display: block; font-size: 15px; margin-bottom: 4px; color: #0f766e;">필터 교체 주기 진단기</strong>
        <span style="font-size: 13.5px; color: #475569;">10대 가전 소모품 세척·교체 D-Day 및 연간 예산 점검</span>
      </a>
    </nav>
    <footer style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #64748b;">
      <p>버진로드 기술편집팀 | 문의: apark12321@gmail.com | <a href="/about" style="color: #475569;">소개</a> · <a href="/contact" style="color: #475569;">문의하기</a> · <a href="/privacy" style="color: #475569;">개인정보처리방침</a></p>
    </footer>
  </div>
`;
    return html.replace('<div id="root"></div>', `<div id="root">${ssr404Markup}</div>`);
  }

  const ssrNavHtml = `
      <nav style="display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; font-size: 14px; font-weight: 600;">
        <a href="/" style="color: #0f766e; text-decoration: none;">홈</a>
        <a href="/category/${encodeURIComponent("신혼가전")}" style="color: #334155; text-decoration: none;">가전 매뉴얼</a>
        <a href="/tools/power-cost" style="color: #334155; text-decoration: none;">전기요금 계산기</a>
        <a href="/tools/filter-cycle" style="color: #334155; text-decoration: none;">필터 진단기</a>
        <a href="/about" style="color: #334155; text-decoration: none;">소개</a>
        <a href="/policy" style="color: #334155; text-decoration: none;">안전·검증 기준</a>
      </nav>`;

  const ssrFooterHtml = `
    <footer style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; line-height: 1.7;">
      <p><strong>버진로드 기술편집팀</strong> · 생활·신혼가전 공식 유지관리 기술 아카이브 · 문의: apark12321@gmail.com</p>
      <p>한국소비자원·한국전기안전공사·한국전력공사·한국에너지공단 및 제조사 공식 규격을 대조해 작성·갱신합니다.</p>
      <p style="margin-top: 8px;">
        <a href="/about" style="color: #475569; text-decoration: underline;">소개 및 편집원칙</a> ·
        <a href="/policy" style="color: #475569; text-decoration: underline;">안전·검증 기준</a> ·
        <a href="/contact" style="color: #475569; text-decoration: underline;">문의하기</a> ·
        <a href="/privacy" style="color: #475569; text-decoration: underline;">개인정보 처리방침</a> ·
        <a href="/terms" style="color: #475569; text-decoration: underline;">이용약관</a> ·
        <a href="/announcement" style="color: #475569; text-decoration: underline;">공지사항</a>
      </p>
    </footer>`;

  // Fast-preprocessor HTML routing for individual appliance manuals (Runs in both dev & prod)
  app.get("/post/:slug", async (req, res) => {
    const { slug } = req.params;

    try {
      const posts = await fetchMergedPosts();
      const post = posts.find((p: any) => matchPostBySlugOrId(slug, p));

      if (!post) {
        const baseHtml = await getBaseHtml(req.originalUrl);
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        res.setHeader("Cache-Control", "no-store");
        return res.status(404).send(buildNotFoundHtml(baseHtml));
      }

      const canonicalSlug = slugify(post.title);
      if (slug !== canonicalSlug && decodeURIComponent(slug) !== canonicalSlug) {
        return res.redirect(301, `/post/${encodeURIComponent(canonicalSlug)}`);
      }

      let html = await getBaseHtml(req.originalUrl);
      const groupLabel = getApplianceGroup(post.id, post.title);
      const title = `${post.title} | 버진로드`;
      const description = post.excerpt || "제조사 공식 규격과 안전 기준을 바탕으로 정리한 생활가전 사용 및 유지관리 매뉴얼입니다.";
      const canonical = `https://virginroad.kr/post/${encodeURIComponent(canonicalSlug)}`;

      html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
      html = injectOrReplaceMetaInHtml(html, "description", description);

      const dynamicKeywords = extractSeoKeywords({
        title: post.title,
        content: post.content,
        category: post.category,
        hashtags: post.hashtags
      });
      html = injectOrReplaceMetaInHtml(html, "keywords", dynamicKeywords.join(", "));

      html = injectOrReplaceMetaInHtml(html, "og:title", title, true);
      html = injectOrReplaceMetaInHtml(html, "og:description", description, true);
      html = injectOrReplaceMetaInHtml(html, "og:url", canonical, true);
      html = injectOrReplaceMetaInHtml(html, "og:type", "article", true);
      html = injectOrReplaceMetaInHtml(html, "og:site_name", "버진로드", true);
      html = injectOrReplaceMetaInHtml(html, "og:locale", "ko_KR", true);
      html = removeMetaTagFromHtml(html, "og:image", true);

      html = injectOrReplaceMetaInHtml(html, "twitter:title", title);
      html = injectOrReplaceMetaInHtml(html, "twitter:description", description);
      html = injectOrReplaceMetaInHtml(html, "twitter:card", "summary");
      html = removeMetaTagFromHtml(html, "twitter:image");

      html = setCanonicalInHtml(html, canonical);

      const articleJson = {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        "headline": post.title,
        "description": description,
        "datePublished": toIso8601(post.date),
        "dateModified": toIso8601(post.updated || post.date),
        "author": {
          "@type": "Organization",
          "name": post.author || "버진로드 기술편집팀",
          "url": "https://virginroad.kr/about"
        },
        "publisher": {
          "@type": "Organization",
          "name": "버진로드",
          "url": "https://virginroad.kr",
          "logo": {
            "@type": "ImageObject",
            "url": "https://virginroad.kr/icon.svg"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonical
        },
        "articleSection": `${post.category} · ${groupLabel}`,
        "inLanguage": "ko-KR"
      };

      const breadcrumbJson = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://virginroad.kr/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "가전 관리 매뉴얼",
            "item": `https://virginroad.kr/category/${encodeURIComponent("신혼가전")}`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": post.title,
            "item": canonical
          }
        ]
      };

      html = setJsonLdInHtml(html, "jsonld-primary", articleJson);
      html = setJsonLdInHtml(html, "jsonld-breadcrumb", breadcrumbJson);

      const postContent = expandContentIfNeeded(
        post.title,
        post.category,
        post.hashtags || [],
        post.content || "",
        post.id,
        post.image
      );

      const relatedPosts = posts
        .filter((p: any) => p.id !== post.id && getApplianceGroup(p.id, p.title) === groupLabel)
        .slice(0, 4);

      const relatedListHtml = relatedPosts
        .map(
          (rp: any) =>
            `<li style="margin-bottom: 10px;"><a href="/post/${encodeURIComponent(slugify(rp.title) || rp.id)}" style="color: #0f766e; font-weight: 600; text-decoration: none;">${rp.title}</a></li>`
        )
        .join("");

      const ssrArticleMarkup = `
  <div id="ssr-container" style="max-width: 860px; margin: 0 auto; padding: 28px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif;">
    <header style="margin-bottom: 28px; border-bottom: 1px solid #e2e8f0; padding-bottom: 22px;">
      <nav style="font-size: 13.5px; color: #64748b; margin-bottom: 14px;">
        <a href="/" style="color: #64748b; text-decoration: none;">홈</a> &gt; 
        <a href="/category/${encodeURIComponent("신혼가전")}" style="color: #0f766e; text-decoration: none; font-weight: 600;">가전 관리 매뉴얼</a> &gt; 
        <span style="color: #334155;">${groupLabel}</span>
      </nav>
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 10px 0;">${groupLabel} · 제조사 공식 규격 검증 매뉴얼</p>
      <h1 style="font-size: 26px; line-height: 1.4; font-weight: 800; color: #0f172a; margin: 0 0 14px 0;">${post.title}</h1>
      <p style="font-size: 15.5px; line-height: 1.7; color: #475569; margin: 0 0 16px 0;">${post.excerpt || ""}</p>
      <div style="font-size: 13px; color: #64748b;">
        <span>${post.author || "버진로드 기술편집팀"}</span> · <span>${post.date}</span> · <span>읽기 약 ${post.readTime || "7분"}</span>
      </div>
    </header>
    <main class="article-body" style="color: #334155; line-height: 1.85; font-size: 16px;">
      ${postContent}
    </main>
    <aside style="margin-top: 36px; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">함께 활용하는 가전 점검 도구</h2>
      <p style="font-size: 14px; color: #475569; margin: 0 0 12px 0;">보유 가전의 월간 누진제 전기요금과 소모품·필터 교체 일정을 직접 진단해 보세요.</p>
      <p style="font-size: 14px; margin: 0;">
        <a href="/tools/power-cost" style="color: #0f766e; font-weight: 700; margin-right: 16px;">2026 가전 전기요금 누진제 계산기 &rarr;</a>
        <a href="/tools/filter-cycle" style="color: #0f766e; font-weight: 700;">10대 가전 필터·소모품 교체 주기 진단기 &rarr;</a>
      </p>
    </aside>
    ${relatedListHtml ? `<section style="margin-top: 32px;"><h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">같은 분야(${groupLabel}) 추천 매뉴얼</h2><ul style="padding-left: 18px; margin: 0;">${relatedListHtml}</ul></section>` : ""}
    ${ssrFooterHtml}
  </div>
`;
      html = html.replace('<div id="root"></div>', `<div id="root">${ssrArticleMarkup}</div>`);
      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      res.send(html);
    } catch (err) {
      console.error("Dynamic SEO metadata injection failure:", err);
      const fallback = await getBaseHtml(req.originalUrl);
      res.status(500).send(stripAdSenseScript(fallback));
    }
  });

  // Dynamic HTML route with full SSR markup for all valid routes and strict 404 for unknown paths
  app.get("*", async (req, res) => {
    try {
      let html = await getBaseHtml(req.originalUrl);
      const rawPathname = req.path.length > 1 ? req.path.replace(/\/+$/, "") : "/";
      let decodedPathname = rawPathname;
      try {
        decodedPathname = decodeURIComponent(rawPathname);
      } catch {
        decodedPathname = rawPathname;
      }

      const VALID_STATIC_PATHS = new Set([
        "/",
        "/category/신혼가전",
        "/tools/power-cost",
        "/tools/filter-cycle",
        "/about",
        "/policy",
        "/contact",
        "/privacy",
        "/terms",
        "/announcement",
      ]);

      if (!VALID_STATIC_PATHS.has(decodedPathname)) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        res.setHeader("Cache-Control", "no-store");
        return res.status(404).send(buildNotFoundHtml(html));
      }

      const NO_AD_PATHS = new Set([
        "/policy",
        "/contact",
        "/privacy",
        "/terms",
        "/announcement",
      ]);

      let title = "버진로드 | 생활·신혼가전 사용 관리 매뉴얼 아카이브";
      let description = "드럼세탁기, 건조기, 식기세척기, 인덕션, 시스템에어컨 등 30종 생활가전 공식 유지관리 매뉴얼과 2026 한전 전기요금 계산기·필터 교체 주기 진단기를 제공합니다.";
      let canonical =
        decodedPathname === "/"
          ? "https://virginroad.kr/"
          : decodedPathname === "/category/신혼가전"
          ? `https://virginroad.kr/category/${encodeURIComponent("신혼가전")}`
          : `https://virginroad.kr${decodedPathname}`;
      let primaryJsonLd: any = null;
      let breadcrumbJsonLd: any = null;
      let ssrMarkup = "";

      const allPosts = await fetchMergedPosts();

      if (decodedPathname === "/") {
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "버진로드",
          "alternateName": ["Virginroad"],
          "url": "https://virginroad.kr/",
          "description": description,
          "publisher": {
            "@type": "Organization",
            "name": "버진로드",
            "url": "https://virginroad.kr/",
            "logo": {
              "@type": "ImageObject",
              "url": "https://virginroad.kr/icon.svg"
            }
          },
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://virginroad.kr/?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        };

        const listItems = allPosts
          .map((p: any) => {
            const grp = getApplianceGroup(p.id, p.title);
            return `
            <li style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 12.5px; font-weight: 700; color: #0f766e; margin-bottom: 4px;">${grp} · ${p.date}</div>
              <a href="/post/${encodeURIComponent(slugify(p.title) || p.id)}" style="text-decoration: none; color: #0f172a; font-weight: 800; font-size: 17px; display: block; margin-bottom: 6px; line-height: 1.45;">${p.title}</a>
              <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.65;">${p.excerpt || ""}</p>
            </li>`;
          })
          .join("");

        ssrMarkup = `
  <div id="ssr-home" style="max-width: 920px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;">
    <header style="margin-bottom: 32px; border-bottom: 2px solid #0f172a; padding-bottom: 22px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">생활·신혼가전 기술 매뉴얼 아카이브</p>
      <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0;">버진로드 (Virginroad)</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">제조사 공식 서비스 지침과 한국소비자원·한국전기안전공사 규격을 토대로 정리한 30종 생활가전 유지관리 표준 매뉴얼과 실용 진단 도구를 제공합니다.</p>
      ${ssrNavHtml}
    </header>
    <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 36px;">
      <a href="/tools/power-cost" style="display: block; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; text-decoration: none; color: #0f172a; background: #f8fafc;">
        <strong style="display: block; font-size: 16px; color: #0f766e; margin-bottom: 6px;">2026 가전 전기요금 누진제 계산기</strong>
        <span style="font-size: 13.5px; color: #475569; line-height: 1.6;">12종 핵심 가전의 하루 사용 시간을 입력해 한전 주택용(저압) 1~3구간 누진 요금과 월간 예상 전기료를 시뮬레이션합니다.</span>
      </a>
      <a href="/tools/filter-cycle" style="display: block; padding: 20px; border: 1px solid #cbd5e1; border-radius: 12px; text-decoration: none; color: #0f172a; background: #f8fafc;">
        <strong style="display: block; font-size: 16px; color: #0f766e; margin-bottom: 6px;">10대 가전 필터·소모품 교체 주기 진단기</strong>
        <span style="font-size: 13.5px; color: #475569; line-height: 1.6;">가구 사용 강도와 최근 세척일을 기준으로 필터 세척·교체 D-Day와 연간 유지비를 자동 계산합니다.</span>
      </a>
    </section>
    <main>
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 20px 0;">공식 검증 생활가전 유지관리 매뉴얼 (${allPosts.length}종)</h2>
      <ul style="list-style: none; padding: 0; margin: 0;">${listItems}</ul>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/category/신혼가전") {
        title = "가전 관리 매뉴얼 전체 아카이브 | 버진로드";
        description = "세탁·건조, 주방가전, 냉난방·공조, 청소·생활 4대 분야 30종 생활가전의 올바른 사용법, 필터 세척 주기, 에러코드 대처법을 한곳에 모았습니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": title,
          "url": canonical,
          "description": description
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "가전 관리 매뉴얼", "item": canonical }
          ]
        };

        const catItems = allPosts
          .map((p: any) => {
            const grp = getApplianceGroup(p.id, p.title);
            return `
            <li style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 12.5px; font-weight: 700; color: #0f766e; margin-bottom: 4px;">${grp} · ${p.date}</div>
              <a href="/post/${encodeURIComponent(slugify(p.title) || p.id)}" style="text-decoration: none; color: #0f172a; font-weight: 800; font-size: 17px; display: block; margin-bottom: 6px;">${p.title}</a>
              <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.65;">${p.excerpt || ""}</p>
            </li>`;
          })
          .join("");

        ssrMarkup = `
  <div id="ssr-cat" style="max-width: 920px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; color: #64748b; margin: 0 0 8px 0;"><a href="/" style="color: #64748b; text-decoration: none;">홈</a> &gt; <strong style="color: #0f172a;">가전 관리 매뉴얼</strong></p>
      <h1 style="font-size: 28px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0;">생활·신혼가전 유지관리 매뉴얼 (${allPosts.length}종)</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">${description}</p>
      ${ssrNavHtml}
    </header>
    <main>
      <ul style="list-style: none; padding: 0; margin: 0;">${catItems}</ul>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/tools/power-cost") {
        title = "2026 가전 전기요금 누진제 계산기 | 버진로드";
        description = "한국전력공사 2026년 주택용(저압) 전기요금 누진제 1~3구간(하계·기타 계절) 기준으로 12종 주요 생활가전의 월간 전력량(kWh)과 실제 청구 요금을 계산합니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "2026 가전 전기요금 누진제 계산기",
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All",
          "url": canonical,
          "description": description,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "가전 전기요금 계산기", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-tool-power" style="max-width: 920px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">실용 가전 진단 도구 · 한국전력공사 2026 주택용(저압) 기준</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">2026 가전 전기요금 누진제 계산기</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">${description}</p>
      ${ssrNavHtml}
    </header>
    <main style="line-height: 1.8; color: #334155;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">한국전력공사 주택용(저압) 누진제 구간표</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; text-align: left;">누진 구간</th>
            <th style="padding: 10px; text-align: left;">기타 계절 (1~6월, 9~12월)</th>
            <th style="padding: 10px; text-align: left;">하계 (7~8월)</th>
            <th style="padding: 10px; text-align: right;">기본요금</th>
            <th style="padding: 10px; text-align: right;">전력량요금 (원/kWh)</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">1구간</td><td style="padding: 10px;">200 kWh 이하</td><td style="padding: 10px;">300 kWh 이하</td><td style="padding: 10px; text-align: right;">910원</td><td style="padding: 10px; text-align: right;">120.0원</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">2구간</td><td style="padding: 10px;">201 ~ 400 kWh</td><td style="padding: 10px;">301 ~ 450 kWh</td><td style="padding: 10px; text-align: right;">1,600원</td><td style="padding: 10px; text-align: right;">214.6원</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">3구간</td><td style="padding: 10px;">400 kWh 초과</td><td style="padding: 10px;">450 kWh 초과</td><td style="padding: 10px; text-align: right;">7,300원</td><td style="padding: 10px; text-align: right;">307.3원</td></tr>
        </tbody>
      </table>
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 24px 0 10px 0;">실제 청구 금액 산정 공식 및 절전 관리 포인트</h2>
      <p>최종 청구 금액은 기본요금 + 구간별 전력량요금 + 기후환경요금(9원/kWh) + 연료비조정요금(5원/kWh) 합계에 부가가치세(10%)와 전력산업기반기금(3.7%)을 가산하여 10원 미만 절사로 산정됩니다. 시스템에어컨·제습기·인덕션·건조기·식기세척기 등 소비전력이 큰 12대 가전의 열교환기와 필터를 주기적으로 세척하면 불필요한 압축기 가동을 줄여 누진 3구간 진입을 예방할 수 있습니다.</p>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/tools/filter-cycle") {
        title = "10대 생활가전 필터·소모품 교체 주기 진단기 | 버진로드";
        description = "세탁기·건조기·에어컨·공기청정기·정수기·식기세척기·로봇청소기·가습기·비데·음식물처리기 등 10대 가전의 필터 세척·교체 D-Day와 연간 소모품 예산을 진단합니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "10대 생활가전 필터·소모품 교체 주기 진단기",
          "applicationCategory": "UtilitiesApplication",
          "operatingSystem": "All",
          "url": canonical,
          "description": description,
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "필터 교체 주기 진단기", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-tool-filter" style="max-width: 920px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">실용 가전 진단 도구 · 제조사 공식 권장 주기 기준</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">10대 생활가전 필터·소모품 교체 주기 진단기</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">${description}</p>
      ${ssrNavHtml}
    </header>
    <main style="line-height: 1.8; color: #334155;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">주요 생활가전 필터·소모품 표준 점검 주기</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <thead>
          <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 10px; text-align: left;">가전 품목</th>
            <th style="padding: 10px; text-align: left;">핵심 소모품 / 필터</th>
            <th style="padding: 10px; text-align: left;">표준 주기 (2인 가구)</th>
            <th style="padding: 10px; text-align: left;">관리 방식</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">드럼세탁기</td><td style="padding: 10px;">배수 펌프 거름망·고무패킹</td><td style="padding: 10px;">30일</td><td style="padding: 10px;">잔수 제거 후 물세척</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">히트펌프 건조기</td><td style="padding: 10px;">2중 먼지필터·열교환기</td><td style="padding: 10px;">30일</td><td style="padding: 10px;">미온수 세척 후 24시간 완전 건조</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">시스템에어컨</td><td style="padding: 10px;">프리필터·드레인 점검</td><td style="padding: 10px;">14일 (가동철)</td><td style="padding: 10px;">중성세제 세척 및 그늘 건조</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">공기청정기</td><td style="padding: 10px;">HEPA 집진·탈취 필터</td><td style="padding: 10px;">365일 (프리필터 14일)</td><td style="padding: 10px;">물세척 금지, 정품 교체</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">직수 정수기</td><td style="padding: 10px;">세디먼트·복합 카본 필터</td><td style="padding: 10px;">120일</td><td style="padding: 10px;">정품 교체 후 3~5분 플러싱</td></tr>
          <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px;">식기세척기</td><td style="padding: 10px;">3중 하단 거름망·분사노즐</td><td style="padding: 10px;">14일</td><td style="padding: 10px;">온수 브러시 세척 및 구연산 통세척</td></tr>
        </tbody>
      </table>
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 24px 0 10px 0;">물세척 필터 완전 건조 원칙</h2>
      <p>HEPA 집진필터와 활성탄 탈취필터는 물에 닿으면 정전기 집진 성능이 영구 손상되므로 반드시 교체해야 하며, 물세척이 가능한 프리필터·건조기 먼지망·무선청소기 배기필터는 직사광선을 피해 통풍이 잘되는 그늘에서 최소 24시간 이상 완전히 말린 뒤 장착해야 모터 부식과 곰팡이 악취를 막을 수 있습니다.</p>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/about") {
        title = "소개 및 편집 원칙 | 버진로드";
        description = "버진로드 생활·신혼가전 기술 매뉴얼 아카이브의 설립 취지, 4대 검증 편집 원칙, 공식 출처 기준 및 편집국 연락처를 안내합니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": title,
          "url": canonical,
          "description": description,
          "mainEntity": {
            "@type": "Organization",
            "name": "버진로드",
            "url": "https://virginroad.kr",
            "logo": { "@type": "ImageObject", "url": "https://virginroad.kr/icon.svg" }
          }
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "소개 및 편집원칙", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-about" style="max-width: 860px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">ABOUT VIRGINROAD ARCHIVE</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">버진로드(Virginroad) 소개 및 편집 원칙</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">생활·신혼가전의 올바른 사용법, 정기 유지관리, 안전 점검 기준을 구조화해 제공하는 독립 기술 매뉴얼 아카이브입니다.</p>
      ${ssrNavHtml}
    </header>
    <article style="line-height: 1.85; color: #334155; font-size: 15.5px;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 24px;">1. 아카이브 설립 취지</h2>
      <p>버진로드는 협찬 중심의 단편 리뷰와 검증되지 않은 민간요법 때문에 발생하는 가전 고장, 소모품 조기 손상, 누전·화재 위험을 줄이기 위해 구축되었습니다. 30종 핵심 생활가전의 구조적 원리, 제조사 공식 서비스 지침, 한국소비자원·한국전기안전공사·한국전력공사 공시 자료를 대조해 누구나 현장에서 즉시 적용할 수 있는 표준 매뉴얼과 진단 도구를 제공합니다.</p>
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 24px;">2. 4대 편집 원칙</h2>
      <ul>
        <li><strong>공식 규격 기반 교차 검증:</strong> 제조사 사용설명서, 전기안전 기준, 한전 요금 약관을 교차 대조해 수치와 절차를 검증합니다.</li>
        <li><strong>상업적 협찬 배제:</strong> 특정 브랜드 홍보나 유료 추천을 배제하고 가전 구조와 관리 원리에 집중합니다.</li>
        <li><strong>실용 도구 연계:</strong> 2026 전기요금 누진제 계산기와 10대 가전 필터 교체 주기 진단기를 통해 독자가 직접 가구 상태를 점검할 수 있게 합니다.</li>
        <li><strong>투명한 정정 반영:</strong> 오류 제보 및 안전 규격 개정 시 영업일 기준 24시간 이내 검토 후 매뉴얼을 갱신합니다.</li>
      </ul>
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 24px;">3. 편집국 및 연락처</h2>
      <p>운영: 버진로드 기술편집팀 · 공식 문의 이메일: <a href="mailto:apark12321@gmail.com" style="color: #0f766e; font-weight: 700;">apark12321@gmail.com</a></p>
    </article>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/policy") {
        title = "가전 안전·효율 기준 및 4단계 매뉴얼 검증 정책 | 버진로드";
        description = "버진로드 매뉴얼이 준수하는 한국전기안전공사, 한국소비자원, 한국전력공사, 한국에너지공단의 공식 안전·효율 기준과 4단계 검증 절차를 공개합니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "url": canonical,
          "description": description
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "안전·검증 기준", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-policy" style="max-width: 860px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">SAFETY &amp; VERIFICATION POLICY</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">가전 안전·효율 기준 및 매뉴얼 검증 정책</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">${description}</p>
      ${ssrNavHtml}
    </header>
    <main style="line-height: 1.85; color: #334155; font-size: 15.5px;">
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 20px;">1. 4대 공식 참조 기관 기준</h2>
      <ul>
        <li><strong>한국전기안전공사 (KESCO):</strong> 16A 단독 접지 콘센트 사용 기준, 고전력 주방·건조 가전의 멀티탭 과부하 예방 지침</li>
        <li><strong>한국소비자원 (KCA):</strong> 소비자분쟁해결기준상 가전 품목별 품질보증기간·부품보유기간 및 세척·관리 주의사항</li>
        <li><strong>한국전력공사 (KEPCO):</strong> 2026년 주택용(저압) 전기요금 누진제 구간·기후환경요금·연료비조정단가 공시 약관</li>
        <li><strong>한국에너지공단:</strong> 에너지소비효율등급 산정 방식 및 인버터·히트펌프 가전 절전 운전 권고 기준</li>
      </ul>
      <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 24px;">2. 버진로드 4단계 기술 매뉴얼 검증 프로세스</h2>
      <ol>
        <li><strong>1단계 (1차 원문 대조):</strong> 제조사 공식 사용설명서 및 서비스센터 기술 안내서 확보</li>
        <li><strong>2단계 (안전·세제 적합성 점검):</strong> 구연산·과탄산소다·락스 등 세척제의 금속 부식·염소가스 위험 교차 검토</li>
        <li><strong>3단계 (실전 절차 구조화):</strong> 체크리스트·소요시간·주기표 중심으로 오작동 없이 따라 할 수 있도록 편집</li>
        <li><strong>4단계 (정기 갱신 및 오류 정정):</strong> 요금제 개편 및 독자 제보 접수 시 즉시 반영하고 수정 이력 기록</li>
      </ol>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/contact") {
        title = "문의하기 및 오류 정정 제보 | 버진로드";
        description = "버진로드 편집국 공식 연락처(apark12321@gmail.com). 가전 관리 매뉴얼 오류 정정 제보, 누락 품목 요청 및 운영 문의 접수 안내.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": title,
          "url": canonical,
          "description": description
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "문의하기", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-contact" style="max-width: 860px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">EDITORIAL DESK</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">문의하기 및 오류 정정 제보</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">${description}</p>
      ${ssrNavHtml}
    </header>
    <main style="line-height: 1.85; color: #334155; font-size: 15.5px;">
      <section style="padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
        <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">공식 이메일 접수 창구</h2>
        <p style="margin: 0;"><strong>이메일:</strong> <a href="mailto:apark12321@gmail.com" style="color: #0f766e; font-weight: 700;">apark12321@gmail.com</a><br /><strong>응대 시간:</strong> 평일 09:00 ~ 18:00 (KST) · 영업일 기준 24~48시간 이내 회신</p>
      </section>
      <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">접수 가능 문의 유형</h2>
      <ul>
        <li><strong>매뉴얼 수치·안전 지침 정정 요청:</strong> 모델별 변경된 세척 절차나 에러코드 보완 제보</li>
        <li><strong>신규 가전 품목 매뉴얼 요청:</strong> 아카이브에 추가를 희망하는 생활·주방가전 품목 제안</li>
        <li><strong>저작권 및 사이트 운영 문의:</strong> 인용 출처 표기 확인 및 기술적 오류 신고</li>
      </ul>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/privacy") {
        title = "개인정보 처리방침 | 버진로드";
        description = "버진로드의 개인정보 수집 최소화 원칙, 쿠키 및 Google AdSense 맞춤형 광고 설정 해제 방법, 이용자 권리를 안내합니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "url": canonical,
          "description": description
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "개인정보 처리방침", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-privacy" style="max-width: 860px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">PRIVACY POLICY</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">개인정보 처리방침</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">시행일자: 2026년 1월 1일 · 최종 개정: 2026년 11월</p>
      ${ssrNavHtml}
    </header>
    <main style="line-height: 1.85; color: #334155; font-size: 15.5px;">
      <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 20px;">1. 개인정보 수집 최소화 및 브라우저 로컬 저장</h2>
      <p>버진로드(https://virginroad.kr)는 별도의 회원가입 절차 없이 모든 생활가전 매뉴얼과 전기요금 계산기, 필터 교체 주기 진단기를 무료로 제공합니다. 필터 교체 주기 진단기의 점검 기록은 사용자의 웹 브라우저 로컬 스토리지(localStorage)에만 저장되며 외부 서버로 전송되지 않습니다.</p>
      <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 24px;">2. 쿠키 및 제3자 광고(Google AdSense) 안내</h2>
      <p>본 사이트는 Google AdSense 등 제3자 광고 서비스를 운영할 수 있으며, Google은 쿠키를 사용하여 이용자의 이전 방문 기록을 기반으로 관심사 기반 광고를 제공할 수 있습니다. 이용자는 Google 광고 설정(https://adssettings.google.com) 또는 브라우저 쿠키 차단 설정을 통해 맞춤형 광고를 언제든지 거부할 수 있습니다.</p>
      <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 24px;">3. 개인정보 보호책임자 및 문의처</h2>
      <p>문의 이메일: <a href="mailto:apark12321@gmail.com" style="color: #0f766e; font-weight: 700;">apark12321@gmail.com</a> (버진로드 운영팀)</p>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/terms") {
        title = "이용약관 및 기술 안전 면책 고지 | 버진로드";
        description = "버진로드 서비스 이용 조건, 가전 매뉴얼 저작권 보호 범위 및 분해·수리 관련 안전 면책 고지를 안내합니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "url": canonical,
          "description": description
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "이용약관", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-terms" style="max-width: 860px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">TERMS OF SERVICE</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">이용약관 및 안전 면책 고지</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">버진로드 생활가전 매뉴얼 아카이브 및 계산기·진단 도구 이용에 관한 기본 약관입니다.</p>
      ${ssrNavHtml}
    </header>
    <main style="line-height: 1.85; color: #334155; font-size: 15.5px;">
      <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 20px;">제1조 (목적 및 콘텐츠 성격)</h2>
      <p>버진로드에 게시된 모든 가전 사용 매뉴얼, 전기요금 계산 결과, 필터 교체 주기 진단은 일상적인 유지관리와 정보 제공을 목적으로 합니다. 제품별 세부 구조와 보증 조건은 제조사 모델에 따라 상이할 수 있으므로, 작업 전 반드시 해당 모델의 공식 사용설명서를 함께 확인해야 합니다.</p>
      <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 24px;">제2조 (안전 및 면책)</h2>
      <p>고전압 내부 회로 분해, 가스·냉매 배관 작업, 누전 의심 증상은 반드시 제조사 공식 서비스센터 또는 자격을 갖춘 전문 기사에게 의뢰해야 합니다. 이용자가 임의로 제품을 분해하거나 안전 수칙을 준수하지 않아 발생한 손해에 대해 본 사이트는 책임을 지지 않습니다.</p>
      <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 24px;">제3조 (저작권)</h2>
      <p>버진로드가 자체 작성·편집한 매뉴얼 본문, 비교표, 진단 도구 코드는 저작권법의 보호를 받으며 사전 서면 동의 없는 무단 복제·자동 수집·상업적 재배포를 금합니다.</p>
    </main>
    ${ssrFooterHtml}
  </div>`;
      } else if (decodedPathname === "/announcement") {
        title = "공지사항 및 아카이브 업데이트 이력 | 버진로드";
        description = "버진로드 생활가전 매뉴얼 30종 개편, 2026 전기요금 계산기 및 필터 교체 주기 진단기 출시 등 주요 업데이트 공지사항입니다.";
        primaryJsonLd = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "url": canonical,
          "description": description
        };
        breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
            { "@type": "ListItem", "position": 2, "name": "공지사항", "item": canonical }
          ]
        };
        ssrMarkup = `
  <div id="ssr-announcement" style="max-width: 860px; margin: 0 auto; padding: 32px 18px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #0f172a;">
    <header style="margin-bottom: 28px; border-bottom: 2px solid #0f172a; padding-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 700; color: #0f766e; margin: 0 0 8px 0;">ANNOUNCEMENTS &amp; CHANGELOG</p>
      <h1 style="font-size: 28px; font-weight: 900; margin: 0 0 10px 0;">공지사항 및 아카이브 업데이트</h1>
      <p style="font-size: 15.5px; color: #475569; line-height: 1.7; margin: 0;">${description}</p>
      ${ssrNavHtml}
    </header>
    <main style="line-height: 1.85; color: #334155; font-size: 15.5px;">
      <article style="padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
        <p style="font-size: 13px; color: #0f766e; font-weight: 700; margin: 0 0 4px 0;">2026-11 업데이트</p>
        <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">2026 가전 전기요금 누진제 계산기 및 필터 교체 주기 진단기 정식 오픈</h2>
        <p style="margin: 0;">12종 핵심 가전의 월간 전력량과 누진 구간을 계산하는 전기요금 계산기(/tools/power-cost)와 10대 가전 소모품 D-Day를 관리하는 필터 교체 주기 진단기(/tools/filter-cycle)를 정식 출시했습니다.</p>
      </article>
      <article style="padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0;">
        <p style="font-size: 13px; color: #0f766e; font-weight: 700; margin: 0 0 4px 0;">2026-10 개편</p>
        <h2 style="font-size: 19px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">생활·신혼가전 공식 유지관리 매뉴얼 30종 전면 표준화</h2>
        <p style="margin: 0;">세탁·건조, 주방가전, 냉난방·공조, 청소·생활 4개 분야 30종 가전 매뉴얼의 비교표, 체크리스트, 안전 수칙을 제조사 공식 지침 기준으로 일괄 정비했습니다.</p>
      </article>
    </main>
    ${ssrFooterHtml}
  </div>`;
      }

      if (NO_AD_PATHS.has(decodedPathname)) {
        html = stripAdSenseScript(html);
      }

      html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
      html = injectOrReplaceMetaInHtml(html, "description", description);

      const dynamicKeywords = extractSeoKeywords({
        title,
        category: "신혼가전"
      });
      html = injectOrReplaceMetaInHtml(html, "keywords", dynamicKeywords.join(", "));

      html = injectOrReplaceMetaInHtml(html, "og:title", title, true);
      html = injectOrReplaceMetaInHtml(html, "og:description", description, true);
      html = injectOrReplaceMetaInHtml(html, "og:url", canonical, true);
      html = injectOrReplaceMetaInHtml(html, "og:type", "website", true);
      html = injectOrReplaceMetaInHtml(html, "og:site_name", "버진로드", true);
      html = injectOrReplaceMetaInHtml(html, "og:locale", "ko_KR", true);
      html = removeMetaTagFromHtml(html, "og:image", true);

      html = injectOrReplaceMetaInHtml(html, "twitter:title", title);
      html = injectOrReplaceMetaInHtml(html, "twitter:description", description);
      html = injectOrReplaceMetaInHtml(html, "twitter:card", "summary");
      html = removeMetaTagFromHtml(html, "twitter:image");

      html = setCanonicalInHtml(html, canonical);

      if (primaryJsonLd) {
        html = setJsonLdInHtml(html, "jsonld-primary", primaryJsonLd);
      } else {
        html = removeJsonLdFromHtml(html, "jsonld-primary");
      }
      if (breadcrumbJsonLd) {
        html = setJsonLdInHtml(html, "jsonld-breadcrumb", breadcrumbJsonLd);
      } else {
        html = removeJsonLdFromHtml(html, "jsonld-breadcrumb");
      }

      html = html.replace('<div id="root"></div>', `<div id="root">${ssrMarkup}</div>`);

      res.setHeader("Cache-Control", "public, max-age=300, s-maxage=600");
      res.send(html);
    } catch (err) {
      console.error("Dynamic page SEO metadata injection failure:", err);
      const fallback = await getBaseHtml(req.originalUrl);
      res.status(500).send(stripAdSenseScript(fallback));
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (isPrerenderSnapshot) return;
    
    // Trigger auto-publisher service on server startup
    runAutoPublisherService()
      .then(res => console.log("[AutoPublisher Initial Run]:", res.publishedCount, "posts updated"))
      .catch(err => console.error("[AutoPublisher Startup Error]:", err));

    // Schedule background check every 60 seconds to publish daily posts at randomized times
    setInterval(() => {
      runAutoPublisherService().catch(err => console.error("[AutoPublisher Periodic Error]:", err));
    }, 60000);

    // Google Search Console Invisible Auto-Engine
    // 1. Initial automated sitemap ping & IndexNow submission (5 seconds after boot)
    setTimeout(() => {
      submitUrlsToSearchConsole([
        "",
        "/category/신혼가전",
        "/tools/power-cost",
        "/tools/filter-cycle",
        "/about",
        "/policy",
        "/contact",
        "/privacy",
        "/terms",
        "/announcement"
      ])
        .then(res => console.log(`[Google Search Console Auto-Engine] Initial background sync complete (${res.submittedCount} URLs synced)`))
        .catch(err => console.warn("[Google Search Console Auto-Engine Warning]:", err.message));
    }, 5000);

    // 2. Periodic Google Search Console & IndexNow automated background ping (every 6 hours)
    setInterval(() => {
      fetchMergedPosts().then(posts => {
        const topUrls = [
          "",
          "/category/신혼가전",
          "/tools/power-cost",
          "/tools/filter-cycle",
          "/about",
          ...posts.slice(0, 15).map(p => `/post/${slugify(p.title) || p.id}`)
        ];
        submitUrlsToSearchConsole(topUrls)
          .then(res => console.log(`[Google Search Console Auto-Engine] Periodic sync complete (${res.submittedCount} URLs synced)`))
          .catch(err => console.warn("[Google Search Console Auto-Engine Periodic Warning]:", err.message));
      }).catch(err => console.error("Failed to fetch posts for auto-indexing:", err));
    }, 6 * 60 * 60 * 1000);
  });
}

startServer();
