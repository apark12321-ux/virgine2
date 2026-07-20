import fs from "fs";
import path from "path";
import { MOCK_POSTS } from "./src/constants.js";

// Slugify matching server.ts & src/lib/utils.ts
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

async function generate() {
  console.log("Generating static sitemap.xml...");
  const baseUrl = "https://virginroad.kr";
  
  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/about", priority: "0.5", changefreq: "weekly" },
    { path: "/privacy", priority: "0.5", changefreq: "monthly" },
    { path: "/partnership", priority: "0.6", changefreq: "weekly" },
    { path: "/announcement", priority: "0.6", changefreq: "weekly" },
    { path: "/terms", priority: "0.3", changefreq: "monthly" },
    { path: "/policy", priority: "0.8", changefreq: "daily" },
    { path: "/tools/didimdol", priority: "0.9", changefreq: "weekly" },
    { path: "/tools/cheongyak", priority: "0.9", changefreq: "weekly" },
  ];

  const categories = ["신혼금융", "신혼가전", "결혼준비"];

  const localPosts = loadLocalPosts();
  let firestorePosts: any[] = [];
  try {
    firestorePosts = await fetchFirestorePosts();
  } catch (err) {
    console.error("Failed to fetch firestore posts:", err);
  }

  const posts = [...localPosts];
  firestorePosts.forEach(fp => {
    if (!posts.some(p => p.id === fp.id || p.title.trim() === fp.title.trim() || slugify(p.title) === slugify(fp.title))) {
      posts.push(fp);
    }
  });

  MOCK_POSTS.forEach(mp => {
    if (!posts.some(p => p.id === mp.id || p.title.trim() === mp.title.trim() || slugify(p.title) === slugify(mp.title))) {
      posts.push(mp);
    }
  });

  const currentDate = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 1. Static Pages
  staticPages.forEach((p) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${p.path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  // 2. Categories
  categories.forEach((cat) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/category/${encodeURIComponent(cat)}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  });

  // 3. Blog Posts
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
    xml += `    <loc>${baseUrl}/post/${slug}</loc>\n`;
    xml += `    <lastmod>${lastModDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  const outputPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(outputPath, xml, "utf-8");
  console.log(`Static sitemap.xml generated successfully at: ${outputPath}`);
}

generate().catch(err => {
  console.error("Failed to generate static sitemap:", err);
  process.exit(1);
});
