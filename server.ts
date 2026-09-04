import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { MOCK_POSTS } from "./src/constants";
import { expandContentIfNeeded } from "./src/lib/contentExpander";
import { runAutoPublisherService } from "./src/lib/autoPublisher";
import { extractSeoKeywords } from "./src/lib/seoKeywords";
import { generateRealisticPostDateTime, formatPostDateTime, parsePostTimestamp } from "./src/lib/utils";
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

// 25-char logic slugify to match src/lib/utils.ts perfectly
function slugify(title: string): string {
  if (!title) return "";
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\uAC00-\uD7A3\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 25)
    .replace(/-+$/g, "");
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

function normalizeTitle(str: string): string {
  return (str || "").replace(/[^a-zA-Z0-9가-힣]/g, "").toLowerCase();
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
      const category = fields.category?.stringValue || "결혼준비";
      const author = fields.author?.stringValue || "버진로드";
      const date = fields.date?.stringValue || new Date().toISOString().split("T")[0];
      const image = fields.image?.stringValue || "https://images.unsplash.com/photo-1554224128-3c7f3edcc69f?auto=format&fit=crop&q=80&w=800";
      const readTime = fields.readTime?.stringValue || "3분";
      const hashtags = fields.hashtags?.arrayValue?.values?.map((v: any) => v.stringValue).filter(Boolean) || [];
      return { id, title, excerpt, content, category, author, date, image, readTime, hashtags };
    }).filter((p: any) => p.title && p.id);
  } catch (e) {
    console.error("fetchFirestorePosts error:", e);
    return [];
  }
}

async function fetchMergedPosts(): Promise<any[]> {
  const localPosts = loadLocalPosts();
  let firestorePosts: any[] = [];
  try {
    firestorePosts = await fetchFirestorePosts();
  } catch (err) {
    console.error("Failed to fetch firestore posts:", err);
  }
  
  const combined = [...localPosts];
  firestorePosts.forEach(fp => {
    if (!isRelevantWeddingPost(fp)) return;
    // Prevent duplicated items across files and DB
    if (!combined.some(p => p.id === fp.id || normalizeTitle(p.title) === normalizeTitle(fp.title) || slugify(p.title) === slugify(fp.title))) {
      combined.push(fp);
    }
  });

  // Merge in high-quality default MOCK_POSTS so the REST api feed is never blank
  MOCK_POSTS.forEach(mp => {
    if (!isRelevantWeddingPost(mp)) return;
    if (!combined.some(p => p.id === mp.id || normalizeTitle(p.title) === normalizeTitle(mp.title) || slugify(p.title) === slugify(mp.title))) {
      combined.push(mp);
    }
  });

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
  const PORT = 3000;

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

  // API Route: sitemap.xml (supports both manual, mock, and real-time Firestore database posts)
  app.get("/sitemap.xml", async (req, res) => {
    res.header("Content-Type", "application/xml; charset=utf-8");
    try {
      const baseUrl = "https://virginroad.kr";
      
      const staticPages = [
        "",
        "/about",
        "/privacy",
        "/announcement",
        "/terms",
        "/policy",
        "/tools/didimdol",
        "/tools/cheongyak",
        "/category/신혼금융",
        "/category/신혼가전",
        "/category/결혼준비"
      ];
      
      const postUrls: string[] = [];
      const firestorePosts = await fetchMergedPosts();
      
      // 1. Add firestore raw dynamic posts
      firestorePosts.forEach((post) => {
        const slug = slugify(post.title) || post.id;
        postUrls.push(`/post/${slug}`);
      });
      
      // 2. Add static constant posts
      MOCK_POSTS.forEach((post) => {
        const slug = slugify(post.title) || post.id;
        const path = `/post/${slug}`;
        if (!postUrls.includes(path)) {
          postUrls.push(path);
        }
      });
      
      const allPaths = [...staticPages, ...postUrls];
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
      
      const today = new Date().toISOString().split("T")[0];
      
      allPaths.forEach((p) => {
        const fullUrl = `${baseUrl}${p}`;
        const escapedUrl = fullUrl
          .replace(/&/g, "&amp;")
          .replace(/'/g, "&apos;")
          .replace(/"/g, "&quot;")
          .replace(/>/g, "&gt;")
          .replace(/</g, "&lt;");
          
        let priority = "0.5";
        let changefrequency = "weekly";
        
        if (p === "") {
          priority = "1.0";
          changefrequency = "daily";
        } else if (p.startsWith("/tools/") || p.startsWith("/category/") || p === "/policy") {
          priority = "0.8";
          changefrequency = "daily";
        } else if (p.startsWith("/post/")) {
          priority = "0.7";
          changefrequency = "weekly";
        }
        
        xml += `  <url>\n`;
        xml += `    <loc>${escapedUrl}</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += `    <changefreq>${changefrequency}</changefreq>\n`;
        xml += `    <priority>${priority}</priority>\n`;
        xml += `  </url>\n`;
      });
      
      xml += `</urlset>`;
      res.send(xml);
    } catch (err) {
      console.error("Failed to generate and serve dynamic sitemap:", err);
      res.status(500).send("Internal Server Error");
    }
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
          frequency: "카테고리별 1일 1포스팅 (총 3개/일)",
          interval: "포스팅 간 최소 4시간(240분) 이상 간격 보장",
          timing: "매일 랜덤 시간 자동 스케줄링 (KST 기준)"
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
        // Collect all posts URLs and static pages
        const posts = await fetchMergedPosts();
        targetUrls = [
          "",
          "/about",
          "/policy",
          "/tools/didimdol",
          "/tools/cheongyak",
          "/category/신혼금융",
          "/category/신혼가전",
          "/category/결혼준비",
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

  // GET /api/posts: Serving merged dynamic posts (Local file + Firestore database posts with channelId tracking)
  app.get("/api/posts", async (req, res) => {
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

  // RSS Feed XML generator: Supporting Toss Feed Studio and other RSS blog syndication integrations
  const handleRssFeed = async (req: express.Request, res: express.Response) => {
    try {
      const posts = await fetchMergedPosts();
      const hostUrl = getRequestBaseUrl(req);
      const channelId = extractChannelId(req);
      
      const xmlItems = posts.map((post) => {
        const slug = slugify(post.title) || post.id;
        const postUrl = `${hostUrl}/post/${slug}`;
        const escapedTitle = escapeXml(post.title || "무제");
        const escapedExcerpt = escapeXml(post.excerpt || "");
        const escapedAuthor = escapeXml(post.author || "버진로드");
        const escapedCategory = escapeXml(post.category || "결혼준비");
        const escapedLink = escapeXml(postUrl);
        const escapedImage = escapeXml(post.image || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800");
        
        let pubDateStr = new Date().toUTCString();
        if (post.date) {
          try {
            pubDateStr = new Date(post.date).toUTCString();
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
      <enclosure url="${escapedImage}" length="0" type="image/jpeg" />
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
    <title>버진로드</title>
    <atom:link href="${hostUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <link>${hostUrl}/</link>
    <description>결혼 준비부터 신혼부부 디딤돌대출, 버팀목대출, 신생아 특례대출 금리 계산기, 청약 가점 시뮬레이션까지 함께하는 신혼 금융 생활 백서</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>ko-KR</language>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <generator>Virginroad RSS Engine v1.0</generator>
    <image>
      <url>https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&amp;fit=crop&amp;q=80&amp;w=120</url>
      <title>버진로드</title>
      <link>${hostUrl}/</link>
    </image>
${xmlItems}
  </channel>
</rss>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
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
      
      // 2. Classify Category automatically based on the content, title, or explicit categoryLabel
      let category: "신혼금융" | "신혼가전" | "결혼준비" = "결혼준비";
      if (req.body.category === "신혼금융" || req.body.category === "신혼가전" || req.body.category === "결혼준비") {
        category = req.body.category;
      } else if (req.body.categoryLabel === "신혼금융" || req.body.categoryLabel === "신혼가전" || req.body.categoryLabel === "결혼준비") {
        category = req.body.categoryLabel;
      } else {
        category = classifyCategory(title, htmlContent);
      }
      console.log(`Automatically classified blog category: "${category}" for title: "${title}"`);
      
      // 3. Extract thumbnail / image
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
      if (!image) {
        if (category === "신혼금융") {
          image = "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800";
        } else if (category === "신혼가전") {
          image = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800";
        } else {
          image = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800";
        }
      }
      
      const rawTags = req.body.tags || req.body.hashtags || [];
      const hashtags = Array.isArray(rawTags) && rawTags.length > 0
        ? rawTags.map((t: any) => String(t).trim()).filter(Boolean)
        : [category, "결혼꿀팁", "버진로드"];
      
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

  // Dynamic Robots.txt generator pointing to the sitemap.xml
  app.get("/robots.txt", (req, res) => {
    const hostUrl = getRequestBaseUrl(req);
    const robotsTxtPath = path.join(process.cwd(), "public", "robots.txt");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    
    if (fs.existsSync(robotsTxtPath)) {
      try {
        let content = fs.readFileSync(robotsTxtPath, "utf-8");
        // Update sitemap placeholder with current hostUrl if needed
        content = content.replace(/https:\/\/virginroad\.kr/g, hostUrl);
        return res.send(content);
      } catch (err) {
        // Fallback to default
      }
    }
    
    res.send(`User-agent: Mediapartners-Google
Allow: /

User-agent: Googlebot
Allow: /

User-agent: *
Allow: /

Sitemap: ${hostUrl}/sitemap.xml
`);
  });

  // Dynamic Sitemap.xml generator mapping all static routes, categories, and posts
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const hostUrl = getRequestBaseUrl(req);
      const posts = await fetchMergedPosts();
      
      const staticPages = [
        { path: "/", priority: "1.0", changefreq: "daily" },
        { path: "/about", priority: "0.5", changefreq: "weekly" },
        { path: "/privacy", priority: "0.5", changefreq: "monthly" },
        { path: "/announcement", priority: "0.6", changefreq: "weekly" },
        { path: "/terms", priority: "0.3", changefreq: "monthly" },
        { path: "/policy", priority: "0.8", changefreq: "daily" },
        { path: "/tools/didimdol", priority: "0.9", changefreq: "weekly" },
        { path: "/tools/cheongyak", priority: "0.9", changefreq: "weekly" },
      ];

      const categories = [
        "신혼금융",
        "신혼가전",
        "결혼준비"
      ];

      const currentDate = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // 1. Static Pages
      staticPages.forEach((p) => {
        xml += `  <url>\n`;
        xml += `    <loc>${hostUrl}${p.path}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
        xml += `    <priority>${p.priority}</priority>\n`;
        xml += `  </url>\n`;
      });

      // 2. Categories
      categories.forEach((cat) => {
        xml += `  <url>\n`;
        xml += `    <loc>${hostUrl}/category/${encodeURIComponent(cat)}</loc>\n`;
        xml += `    <lastmod>${currentDate}</lastmod>\n`;
        xml += `    <changefreq>daily</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += `  </url>\n`;
      });

      // 3. Blog Posts (Dynamic + Mock combined)
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
        xml += `    <loc>${hostUrl}/post/${slug}</loc>\n`;
        xml += `    <lastmod>${lastModDate}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      });

      xml += `</urlset>`;

      res.type("application/xml");
      res.send(xml);
    } catch (err: any) {
      console.error("Failed to generate sitemap.xml:", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Vite middleware for development vs routing configuration for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files (with index: false to prevent automatic, un-SEO-optimized index.html routing)
    app.use(express.static(distPath, { index: false }));

    // Fast-preprocessor HTML routing for individual blog posts
    app.get("/post/:slug", async (req, res) => {
      const { slug } = req.params;
      const htmlPath = path.join(distPath, "index.html");

      try {
        if (!fs.existsSync(htmlPath)) {
          return res.status(404).send("Site is building. Please try again soon.");
        }

        let html = fs.readFileSync(htmlPath, "utf-8");

        // Gather list of both Mock posts and Firestore dynamic db posts
        const firestorePosts = await fetchMergedPosts();
        
        const combined = [...firestorePosts, ...MOCK_POSTS];
        const post = combined.find(
          (p: any) => slugify(p.title) === slug || p.id === slug
        );

        if (post) {
          const title = `${post.title} | 버진로드`;
          const description = post.excerpt || "결혼 준비와 신혼부부를 위한 실용 정책, 대출, 특별공급 시뮬레이션을 가구 맞춤으로 쉽게 풀어드립니다.";
          const canonical = `https://virginroad.kr/post/${slug}`;
          const image = post.image || "https://images.unsplash.com/photo-1554224128-3c7f3edcc69f?auto=format&fit=crop&q=80&w=800";

          // Perform meta substitutions for direct crawling efficiency
          html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

          const injectOrReplaceMeta = (metaNameOrProperty: string, content: string, isProperty = false) => {
            const attr = isProperty ? "property" : "name";
            const regex = new RegExp(`<meta[^>]*(?:${attr}="${metaNameOrProperty}"|content="[^"]*"[^>]*${attr}="${metaNameOrProperty}")[^>]*>`, "i");
            const newMetaTag = `<meta ${attr}="${metaNameOrProperty}" content="${content.replace(/"/g, "&quot;")}" />`;
            
            if (html.match(regex)) {
              html = html.replace(regex, newMetaTag);
            } else {
              html = html.replace("</head>", `  ${newMetaTag}\n</head>`);
            }
          };

          // Primary standard and Social SEO OpenGraph optimization variables
          injectOrReplaceMeta("description", description);

          // Extract and inject top 10 dynamic SEO keywords
          const dynamicKeywords = extractSeoKeywords({
            title: post.title,
            content: post.content,
            category: post.category,
            hashtags: post.hashtags
          });
          const keywordContent = dynamicKeywords.join(", ");
          injectOrReplaceMeta("keywords", keywordContent);
          injectOrReplaceMeta("news_keywords", keywordContent);

          injectOrReplaceMeta("og:title", title, true);
          injectOrReplaceMeta("og:description", description, true);
          injectOrReplaceMeta("og:url", canonical, true);
          injectOrReplaceMeta("og:image", image, true);
          injectOrReplaceMeta("og:type", "article", true);
          injectOrReplaceMeta("og:site_name", "버진로드", true);
          injectOrReplaceMeta("og:locale", "ko_KR", true);

          injectOrReplaceMeta("twitter:title", title);
          injectOrReplaceMeta("twitter:description", description);
          injectOrReplaceMeta("twitter:image", image);
          injectOrReplaceMeta("twitter:card", "summary_large_image");

          // Canonical element
          const canonicalRegex = /<link[^>]*rel="canonical"[^>]*>/i;
          const newCanonicalElement = `<link rel="canonical" href="${canonical}" />`;
          if (html.match(canonicalRegex)) {
            html = html.replace(canonicalRegex, newCanonicalElement);
          } else {
            html = html.replace("</head>", `  ${newCanonicalElement}\n</head>`);
          }

          // Inject dynamic Article and Breadcrumb JSON-LD structured schemas on the server-side
          const articleJson = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": description,
            "image": [image],
            "datePublished": post.date,
            "dateModified": post.updated || post.date,
            "author": { "@type": "Person", "name": post.author || "버진로드" },
            "publisher": {
              "@type": "Organization",
              "name": "버진로드",
              "alternateName": "버진로드",
              "url": "https://virginroad.kr",
              "logo": { "@type": "ImageObject", "url": "https://virginroad.kr/icon.svg" }
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": canonical },
            "articleSection": post.category,
            "inLanguage": "ko-KR"
          };

          const breadcrumbJson = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://virginroad.kr/" },
              { "@type": "ListItem", "position": 2, "name": post.category, "item": `https://virginroad.kr/category/${encodeURIComponent(post.category)}` },
              { "@type": "ListItem", "position": 3, "name": post.title, "item": canonical }
            ]
          };

          const jsonLdBlock = `
  <script type="application/ld+json">
  ${JSON.stringify(articleJson, null, 2)}
  </script>
  <script type="application/ld+json">
  ${JSON.stringify(breadcrumbJson, null, 2)}
  </script>
`;
          html = html.replace("</head>", `  ${jsonLdBlock}\n</head>`);
        }

        res.send(html);
      } catch (err) {
        console.error("Dynamic SEO metadata injection failure:", err);
        res.sendFile(htmlPath);
      }
    });

    // Default Fallback SPA route with full dynamic HTML page-specific preprocessors
    app.get("*", async (req, res) => {
      const htmlPath = path.join(distPath, "index.html");
      if (!fs.existsSync(htmlPath)) {
        return res.status(404).send("Site is building. Please try again soon.");
      }

      try {
        let html = fs.readFileSync(htmlPath, "utf-8");
        const pathname = req.path;
        
        let title = "버진로드 - 2026 신혼부부 디딤돌·버팀목대출 금리 계산기 & 청약 가점 시뮬레이터 | 결혼준비 금융 백서";
        let description = "2026년 최신 기준 신혼부부 디딤돌대출·신생아 특례대출·버팀목전세대출 금리 계산기와 신혼특공 청약 가점 시뮬레이터를 무료로 제공합니다. 스드메·웨딩홀 견적 비교 및 혼수가전 패키지 혜택까지 예비·신혼부부를 위한 실전 금융 생활 백서 버진로드입니다.";
        let canonical = `https://virginroad.kr${pathname === "/" ? "" : pathname}`;
        let ogType = "website";
        let image = "https://images.unsplash.com/photo-1554224128-3c7f3edcc69f?auto=format&fit=crop&q=80&w=800";
        let jsonLd: any = null;

        if (pathname === "/about") {
          title = "소개 | 버진로드";
          description = "버진로드는 신혼·출산·주거·세금 정책부터 가전, 결혼준비까지 직접 분석하여 알기 쉽게 정리하는 신혼 전문 블로그입니다.";
        } else if (pathname === "/policy") {
          title = "2026 가정경제·생활정책 핵심 정보 | 버진로드";
          description = "2026년 신혼·출산·주거 대출 금리, 결혼세액공제, 신생아특례, 부모급여 등 가정에 영향을 주는 핵심 정책을 정부 공식 자료 기준으로 정리합니다. 정책 변경 시 신속 반영.";
        } else if (pathname === "/privacy") {
          title = "개인정보 처리방침 | 버진로드";
          description = "버진로드의 개인정보 수집 및 이용에 관한 안내입니다.";
        } else if (pathname === "/announcement") {
          title = "공지사항 | 버진로드";
          description = "버진로드의 서비스 운영 관련 공지사항을 안내합니다.";
        } else if (pathname === "/terms") {
          title = "이용약관 | 버진로드";
          description = "버진로드 서비스 이용에 관한 약관입니다.";
        } else if (pathname === "/tools/didimdol") {
          title = "디딤돌 우대금리 계산기 | 버진로드";
          description = "한국주택금융공사 2026년 5월 1일 공시 기준으로 본인 가구의 디딤돌대출 우대금리와 월 상환액을 시뮬레이션해 드립니다. 자녀·청약통장·전자계약 우대를 단계별로 확인하세요.";
        } else if (pathname === "/tools/cheongyak") {
          title = "신혼부부 특별공급 가점 계산기 | 버진로드";
          description = "「주택공급에 관한 규칙」 별표1 기준으로 신혼부부 특별공급 가점과 일반 청약가점제 점수를 동시에 계산해 드립니다. 자녀·혼인 기간·청약통장·신생아 가산까지 단계별 확인.";
        } else if (pathname.startsWith("/category/")) {
          const rawCat = pathname.replace("/category/", "");
          const decodedCat = decodeURIComponent(rawCat);
          if (decodedCat === "신혼금융") {
            title = "신혼금융 | 버진로드";
            description = "신혼·출산 가구의 주거 대출(디딤돌·보금자리·신생아특례), 청약 전략, 세제 혜택, 자산 형성까지. 가정의 재무 의사결정에 필요한 정책·금융 정보를 정리한 섹션입니다.";
          } else if (decodedCat === "신혼가전") {
            title = "신혼가전 | 버진로드";
            description = "삼성·LG 신혼가전 패키지 비교, 평수별 적정 사이즈, 빌트인 가전 선택 기준, 한샘·이케아·리바트·일룸 가구 비교 등 신혼집 꾸리기 실용 가이드를 모았습니다.";
          } else if (decodedCat === "결혼준비") {
            title = "결혼준비 | 버진로드";
            description = "스드메 견적의 실제, 웨딩홀 종류별 장단점, 결혼 준비 타임라인, 예단·예물 협상 기준 등 결혼을 앞둔 가구를 위한 풍성한 자료가 한가득 수록되어 있습니다.";
          } else {
            title = `${decodedCat} | 버진로드`;
            description = `${decodedCat} 관련 가정경제·생활정책 정보를 한데 모아 제공합니다.`;
          }
        } else if (pathname === "/" || pathname === "") {
          // Homepage gets standard Website JSON-LD
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "버진로드",
            "url": "https://virginroad.kr",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://virginroad.kr/?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          };
        }

        // Perform HTML substitutions
        html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

        const injectOrReplaceMeta = (metaNameOrProperty: string, content: string, isProperty = false) => {
          const attr = isProperty ? "property" : "name";
          const regex = new RegExp(`<meta[^>]*(?:${attr}="${metaNameOrProperty}"|content="[^"]*"[^>]*${attr}="${metaNameOrProperty}")[^>]*>`, "i");
          const newMetaTag = `<meta ${attr}="${metaNameOrProperty}" content="${content.replace(/"/g, "&quot;")}" />`;
          
          if (html.match(regex)) {
            html = html.replace(regex, newMetaTag);
          } else {
            html = html.replace("</head>", `  ${newMetaTag}\n</head>`);
          }
        };

        injectOrReplaceMeta("description", description);

        // Extract and inject top 10 dynamic SEO keywords
        const dynamicKeywords = extractSeoKeywords({
          title,
          category: pathname.startsWith("/category/") ? decodeURIComponent(pathname.replace("/category/", "")) : "신혼금융"
        });
        const keywordContent = dynamicKeywords.join(", ");
        injectOrReplaceMeta("keywords", keywordContent);
        injectOrReplaceMeta("news_keywords", keywordContent);

        injectOrReplaceMeta("og:title", title, true);
        injectOrReplaceMeta("og:description", description, true);
        injectOrReplaceMeta("og:url", canonical, true);
        injectOrReplaceMeta("og:image", image, true);
        injectOrReplaceMeta("og:type", ogType, true);
        injectOrReplaceMeta("og:site_name", "버진로드", true);
        injectOrReplaceMeta("og:locale", "ko_KR", true);

        injectOrReplaceMeta("twitter:title", title);
        injectOrReplaceMeta("twitter:description", description);
        injectOrReplaceMeta("twitter:image", image);
        injectOrReplaceMeta("twitter:card", "summary_large_image");

        // Canonical element
        const canonicalRegex = /<link[^>]*rel="canonical"[^>]*>/i;
        const newCanonicalElement = `<link rel="canonical" href="${canonical}" />`;
        if (html.match(canonicalRegex)) {
          html = html.replace(canonicalRegex, newCanonicalElement);
        } else {
          html = html.replace("</head>", `  ${newCanonicalElement}\n</head>`);
        }

        // If JSON-LD is available, inject it
        if (jsonLd) {
          const jsonLdString = `
  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2)}
  </script>
`;
          html = html.replace("</head>", `  ${jsonLdString}\n</head>`);
        }

        res.send(html);
      } catch (err) {
        console.error("Dynamic page SEO metadata injection failure:", err);
        res.sendFile(htmlPath);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Trigger auto-publisher service on server startup
    runAutoPublisherService()
      .then(res => console.log("[AutoPublisher Initial Run]:", res.publishedCount, "posts updated"))
      .catch(err => console.error("[AutoPublisher Startup Error]:", err));

    // Schedule background check every 60 seconds to publish daily posts at randomized times
    setInterval(() => {
      runAutoPublisherService().catch(err => console.error("[AutoPublisher Periodic Error]:", err));
    }, 60000);
  });
}

startServer();
