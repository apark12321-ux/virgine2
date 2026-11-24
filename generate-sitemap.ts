import fs from "fs";
import path from "path";
import { MOCK_POSTS } from "./src/constants.js";

function slugify(title: string): string {
  if (!title) return "";
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\uAC00-\uD7A3\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

function escapeXml(unsafe: string): string {
  if (!unsafe) return "";
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

async function generate() {
  console.log("Generating verified appliance sitemap.xml and rss/feed XML...");
  const baseUrl = "https://virginroad.kr";

  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/category/" + encodeURIComponent("신혼가전"), priority: "0.8", changefreq: "weekly" },
    { path: "/tools/power-cost", priority: "0.9", changefreq: "weekly" },
    { path: "/tools/filter-cycle", priority: "0.9", changefreq: "weekly" },
    { path: "/about", priority: "0.6", changefreq: "monthly" },
    { path: "/policy", priority: "0.7", changefreq: "monthly" },
    { path: "/contact", priority: "0.5", changefreq: "monthly" },
    { path: "/privacy", priority: "0.4", changefreq: "monthly" },
    { path: "/terms", priority: "0.4", changefreq: "monthly" },
    { path: "/announcement", priority: "0.5", changefreq: "weekly" },
  ];

  // Strictly emit ONLY verified appliance manuals (zero boilerplate or off-topic legacy posts)
  const posts = [...MOCK_POSTS]
    .filter((p) => p.id && p.id.startsWith("manual-"))
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date.replace(" ", "T") + "+09:00").getTime() : 0;
      const dateB = b.date ? new Date(b.date.replace(" ", "T") + "+09:00").getTime() : 0;
      return dateB - dateA;
    });

  const currentDate = new Date().toISOString().split("T")[0];

  // --- Sitemap Generation ---
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  staticPages.forEach((p) => {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${p.path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${p.changefreq}</changefreq>\n`;
    xml += `    <priority>${p.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  const seenPostSlugs = new Set<string>();
  posts.forEach((post) => {
    const slug = slugify(post.title) || post.id;
    if (seenPostSlugs.has(slug)) return;
    seenPostSlugs.add(slug);

    let lastModDate = currentDate;
    if (post.updated || post.date) {
      const raw = (post.updated || post.date).split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        lastModDate = raw;
      }
    }

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/post/${slug}</loc>\n`;
    xml += `    <lastmod>${lastModDate}</lastmod>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>\n`;

  const sitemapOutputPath = path.join(process.cwd(), "public", "sitemap.xml");
  fs.writeFileSync(sitemapOutputPath, xml, "utf-8");
  console.log(
    `Static sitemap.xml generated (${staticPages.length + seenPostSlugs.size} clean URLs) at: ${sitemapOutputPath}`
  );

  // --- RSS / Feed Generation ---
  const xmlItems = posts
    .map((post) => {
      const slug = slugify(post.title) || post.id;
      const postUrl = `${baseUrl}/post/${slug}`;
      const escapedTitle = escapeXml(post.title || "무제");
      const escapedExcerpt = escapeXml(post.excerpt || "");
      const escapedAuthor = escapeXml(post.author || "버진로드 생활가전 기술편집팀");
      const escapedCategory = escapeXml("가전 관리 매뉴얼");
      const escapedLink = escapeXml(postUrl);

      let pubDateStr = new Date().toUTCString();
      if (post.date) {
        const parsed = new Date(post.date.replace(" ", "T") + "+09:00");
        if (!Number.isNaN(parsed.getTime())) {
          pubDateStr = parsed.toUTCString();
        }
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
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>버진로드 - 신혼가전 및 생활가전 사용 관리 매뉴얼</title>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <link>${baseUrl}/</link>
    <description>드럼세탁기, 히트펌프 건조기, 냉장고, 식기세척기, 시스템 에어컨, 로봇청소기 등 30종 생활가전의 공식 세척 주기 및 고장 예방 기술 매뉴얼 아카이브</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>ko-KR</language>
${xmlItems}
  </channel>
</rss>
`;

  const rssOutputPath = path.join(process.cwd(), "public", "rss.xml");
  const feedOutputPath = path.join(process.cwd(), "public", "feed.xml");
  fs.writeFileSync(rssOutputPath, rssXml, "utf-8");
  fs.writeFileSync(feedOutputPath, rssXml, "utf-8");
  console.log(`Static rss.xml and feed.xml generated (${posts.length} manuals).`);
}

generate().catch((err) => {
  console.error("Failed to generate static sitemap:", err);
  process.exit(1);
});
