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

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case "\"": return "&quot;";
      default: return c;
    }
  });
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
  console.log("Generating static sitemap.xml and rss/feed XML...");
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

  // Sort posts by date descending for RSS
  posts.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const currentDate = new Date().toISOString().split("T")[0];

  // --- Sitemap Generation ---
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

  const sitemapOutputPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(sitemapOutputPath, xml, "utf-8");
  console.log(`Static sitemap.xml generated successfully at: ${sitemapOutputPath}`);

  // --- RSS/Feed Generation ---
  const xmlItems = posts.map((post) => {
    const slug = slugify(post.title) || post.id;
    const postUrl = `${baseUrl}/post/${slug}`;
    const escapedTitle = escapeXml(post.title || "무제");
    const escapedExcerpt = escapeXml(post.excerpt || "");
    const escapedAuthor = escapeXml(post.author || "버진로드 에디터");
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
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <link>${baseUrl}/</link>
    <description>결혼 준비부터 신혼부부 디딤돌대출, 버팀목대출, 신생아 특례대출 금리 계산기, 청약 가점 시뮬레이션까지 함께하는 신혼 금융 생활 백서</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>ko-KR</language>
    <sy:updatePeriod>hourly</sy:updatePeriod>
    <sy:updateFrequency>1</sy:updateFrequency>
    <generator>Virginroad RSS Engine v1.0</generator>
    <image>
      <url>https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&amp;fit=crop&amp;q=80&amp;w=120</url>
      <title>버진로드</title>
      <link>${baseUrl}/</link>
    </image>
${xmlItems}
  </channel>
</rss>`;

  const rssOutputPath = path.join(process.cwd(), "public", "rss.xml");
  const feedOutputPath = path.join(process.cwd(), "public", "feed.xml");
  
  fs.writeFileSync(rssOutputPath, rssXml, "utf-8");
  fs.writeFileSync(feedOutputPath, rssXml, "utf-8");
  
  console.log(`Static rss.xml generated successfully at: ${rssOutputPath}`);
  console.log(`Static feed.xml generated successfully at: ${feedOutputPath}`);
}

generate().catch(err => {
  console.error("Failed to generate static sitemap:", err);
  process.exit(1);
});
