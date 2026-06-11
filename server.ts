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

interface FirestorePost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
}

async function fetchFirestorePosts(): Promise<FirestorePost[]> {
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
      const image = fields.image?.stringValue || "https://images.unsplash.com/photo-1554224128-3c7f3edcc69f?auto=format&fit=crop&q=80&w=800";
      return { id, title, excerpt, image };
    }).filter((p: any) => p.title && p.id);
  } catch (e) {
    console.error("fetchFirestorePosts error:", e);
    return [];
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
      const firestorePosts = await fetchFirestorePosts();
      
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
        const firestorePosts = await fetchFirestorePosts();
        
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
