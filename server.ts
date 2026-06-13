import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { MOCK_POSTS } from "./src/constants";

const VIEWS_FILE = path.join(process.cwd(), "views.json");

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

function loadLocalPosts(): any[] {
  try {
    if (fs.existsSync(LOCAL_POSTS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_POSTS_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read local posts:", e);
  }
  return [];
}

function saveLocalPosts(posts: any[]) {
  try {
    fs.writeFileSync(LOCAL_POSTS_FILE, JSON.stringify(posts, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write local posts:", e);
  }
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
      const author = fields.author?.stringValue || "버진로드 에디터";
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
    // Prevent duplicated items across files and DB
    if (!combined.some(p => p.id === fp.id || p.title.trim() === fp.title.trim() || slugify(p.title) === slugify(fp.title))) {
      combined.push(fp);
    }
  });

  // Merge in high-quality default MOCK_POSTS so the REST api feed is never blank
  MOCK_POSTS.forEach(mp => {
    if (!combined.some(p => p.id === mp.id || p.title.trim() === mp.title.trim() || slugify(p.title) === slugify(mp.title))) {
      combined.push(mp);
    }
  });

  return combined;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom CORS headers middleware to allow preflight and data transfer from Blog Studio
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key, Authorization");
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
        "/partnership",
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

  // GET /api/posts: Serving merged dynamic posts (Local file + Firestore database posts)
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await fetchMergedPosts();
      logWebhookRequest(req, undefined, { count: posts.length });
      res.json(posts);
    } catch (err: any) {
      console.error("Failed to serve merged posts:", err);
      logWebhookRequest(req, err.message);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  // POST webhook endpoints for Blog Studio: supporting root POST / and specific endpoints /api/posts & /api/blogstudio-webhook
  const handleIncomingPost = async (req: express.Request, res: express.Response) => {
    const rawApiKey = req.headers["x-api-key"] || req.headers["X-API-Key"] || req.query.key || req.query.apiKey;
    console.log(`Received incoming blog post webhook. API Key header/query: "${rawApiKey || "none"}"`);
    console.log("Request Body:", JSON.stringify(req.body, null, 2));
    
    // Support multiple incoming field mappings to ensure the payload parses successfully
    const rawTitle = req.body.title || req.body.subject || req.body.header || req.body.name;
    const rawContent = req.body.content || req.body.body || req.body.text || req.body.description || req.body.desc;
    const status = req.body.status || req.body.postStatus || "published";
    const seoDescription = req.body.seoDescription || req.body.excerpt || req.body.summary || "";
    
    // Support and capture channel IDs from request body, query or headers to pass verification
    const channelId = req.body.channelId || req.body.channel_id || req.body.channelID || req.query.channelId || req.headers["x-channel-id"] || "";
    
    if (!rawTitle || typeof rawTitle !== "string") {
      console.log("No title found in incoming webhook request. Treating as a connection test / ping.");
      const responseBody = {
        status: "success",
        message: "Connection test successful. Ready to receive posts.",
        url: "https://virginroad.kr/",
        id: channelId || "virginroad-api",
        channelId: channelId,
        channel_id: channelId,
        data: {
          url: "https://virginroad.kr/",
          channelId: channelId
        }
      };
      logWebhookRequest(req, "No title found. connection test.", responseBody);
      return res.status(200).json(responseBody);
    }
    
    const title = rawTitle.trim();
    const content = typeof rawContent === "string" ? rawContent : "";
    
    try {
      // 1. Sluggify and sanitize IDs
      const rawSlug = slugify(title);
      const postId = rawSlug || `post-${Date.now()}`;
      
      // 2. Classify Category automatically based on the content and title keywords
      const category = classifyCategory(title, content);
      console.log(`Automatically classified blog category: "${category}" for title: "${title}"`);
      
      // 3. Extract first image from HTML body, or assign high-quality category default illustrations
      let image = extractFirstImage(content);
      if (!image) {
        if (category === "신혼금융") {
          image = "https://images.unsplash.com/photo-1554224155-1696413565d3?auto=format&fit=crop&q=80&w=800";
        } else if (category === "신혼가전") {
          image = "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&q=80&w=800";
        } else {
          image = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800";
        }
      }
      
      // 4. Calculate reading time (approx 500 characters per minute)
      const plainText = stripHtml(content);
      const readTime = `${Math.max(1, Math.ceil(plainText.length / 500))}분`;
      
      // 5. Excerpt extraction fallback
      const excerpt = seoDescription.trim() || (plainText.slice(0, 140) + (plainText.length > 140 ? "..." : ""));
      
      // 6. Assemble beautiful Post object using Korea Standard Time (KST, UTC+9)
      const kstDate = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split("T")[0];
      
      const newPost = {
        id: postId,
        title,
        excerpt: excerpt.trim(),
        content,
        category,
        author: "버진로드 에디터",
        date: kstDate,
        image,
        readTime,
        hashtags: [category, "결혼꿀팁", "버진로드"]
      };
      
      // 7. Save to local posts file (keeps persistent and immediate listing in app)
      const localPosts = loadLocalPosts();
      // Avoid duplicate post ID or completely identical title
      const existingIdx = localPosts.findIndex(p => p.id === postId || p.title === newPost.title);
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

      // 9. Return structured success matching Blog Studio's required output
      const successResponse = {
        status: "success",
        message: "Post published successfully",
        id: postId,
        postId: postId,
        channelId: channelId,
        channel_id: channelId,
        url: `https://virginroad.kr/post/${postId}`,
        data: {
          url: `https://virginroad.kr/post/${postId}`,
          postId: postId,
          id: postId,
          channelId: channelId,
          channel_id: channelId
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

  // Listen to POST requests across all possible configurations of endpoints
  app.post("/", handleIncomingPost);
  app.post("/api/posts", handleIncomingPost);
  app.post("/api/blogstudio-webhook", handleIncomingPost);

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
        }

        res.send(html);
      } catch (err) {
        console.error("Dynamic SEO metadata injection failure:", err);
        res.sendFile(htmlPath);
      }
    });

    // Default Fallback SPA route for home, categories, tools, static pages
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
