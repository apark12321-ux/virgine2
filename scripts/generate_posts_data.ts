import fs from "fs";
import path from "path";
import { ALL_POST_DEFINITIONS } from "../src/data/allPostsData";
import { expandContentIfNeeded } from "../src/lib/contentExpander";

// 1. Generate 115 timestamps for every single day from 2026-06-01 to 2026-09-15
// Double-post days: 8 milestone days (2026-06-01, 2026-06-15, 2026-07-01, 2026-07-15, 2026-08-01, 2026-08-15, 2026-09-01, 2026-09-14)
// Total days: 107 calendar days. Total timestamps: 107 + 8 = 115.

function generate115Timestamps(): string[] {
  const start = new Date("2026-06-01T00:00:00Z");
  const end = new Date("2026-09-15T00:00:00Z");
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const doubleDays = new Set([
    "2026-06-01", "2026-06-15", "2026-07-01", "2026-07-15",
    "2026-08-01", "2026-08-15", "2026-09-01", "2026-09-14"
  ]);

  function pseudoRandom(s: number) {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  }

  let seed = 241;
  const timestamps: string[] = [];

  days.forEach((day, dIdx) => {
    const isDouble = doubleDays.has(day);
    if (isDouble) {
      // Morning post (07:15 - 09:45)
      const mHour = 7 + Math.floor(pseudoRandom(seed++) * 3); // 7, 8, 9
      const mMin = 12 + Math.floor(pseudoRandom(seed++) * 45);
      const mSec = 10 + Math.floor(pseudoRandom(seed++) * 48);
      timestamps.push(`${day} ${String(mHour).padStart(2, "0")}:${String(mMin).padStart(2, "0")}:${String(mSec).padStart(2, "0")}`);

      // Evening post (18:15 - 21:50)
      const eHour = 18 + Math.floor(pseudoRandom(seed++) * 4); // 18, 19, 20, 21
      const eMin = 10 + Math.floor(pseudoRandom(seed++) * 48);
      const eSec = 10 + Math.floor(pseudoRandom(seed++) * 48);
      timestamps.push(`${day} ${String(eHour).padStart(2, "0")}:${String(eMin).padStart(2, "0")}:${String(eSec).padStart(2, "0")}`);
    } else {
      let hour: number;
      if (day === "2026-09-15") {
        // Current day in KST: morning post
        hour = 8;
      } else {
        const slot = dIdx % 3;
        if (slot === 0) {
          hour = 8 + Math.floor(pseudoRandom(seed++) * 3); // 8, 9, 10
        } else if (slot === 1) {
          hour = 12 + Math.floor(pseudoRandom(seed++) * 4); // 12, 13, 14, 15
        } else {
          hour = 18 + Math.floor(pseudoRandom(seed++) * 4); // 18, 19, 20, 21
        }
      }
      const min = 12 + Math.floor(pseudoRandom(seed++) * 45);
      const sec = 10 + Math.floor(pseudoRandom(seed++) * 48);
      timestamps.push(`${day} ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`);
    }
  });

  return timestamps;
}

const timestamps = generate115Timestamps();

// 2. Proportional category interleaving
const finPosts = ALL_POST_DEFINITIONS.filter(p => p.category === "신혼금융");
const appPosts = ALL_POST_DEFINITIONS.filter(p => p.category === "신혼가전");
const wedPosts = ALL_POST_DEFINITIONS.filter(p => p.category === "결혼준비");

const rankedItems: { post: typeof ALL_POST_DEFINITIONS[0]; rank: number }[] = [];

finPosts.forEach((p, i) => rankedItems.push({ post: p, rank: (i + 0.1) / finPosts.length }));
appPosts.forEach((p, i) => rankedItems.push({ post: p, rank: (i + 0.4) / appPosts.length }));
wedPosts.forEach((p, i) => rankedItems.push({ post: p, rank: (i + 0.7) / wedPosts.length }));

rankedItems.sort((a, b) => a.rank - b.rank);

const interleaved = rankedItems.map(item => item.post);

// Assign timestamps chronologically
interleaved.forEach((p, idx) => {
  p.date = timestamps[idx];
});

// 3. Write src/data/allPostsData.ts
const fileContent = `// Automatically generated comprehensive post dataset
// 115 fully curated Korean newlyweds expert guides covering 2026-06-01 through 2026-09-15 (1+ post/day)
import { Post } from "../types";

export const POST_TIMESTAMPS: string[] = ${JSON.stringify(timestamps, null, 2)};

export const ALL_POST_DEFINITIONS: Omit<Post, "content">[] = ${JSON.stringify(
  interleaved.map(p => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    author: p.author || "버진로드",
    date: p.date,
    image: p.image,
    readTime: p.readTime,
    hashtags: p.hashtags
  })),
  null,
  2
)};
`;

fs.writeFileSync(path.join(process.cwd(), "src/data/allPostsData.ts"), fileContent, "utf-8");
console.log("Successfully wrote src/data/allPostsData.ts with proportional category interleaving!");

// 4. Build expanded posts and save to posts-local.json
console.log("Expanding and saving posts to posts-local.json...");
const fullPosts = interleaved.map((p, idx) => {
  const expanded = expandContentIfNeeded(
    p.title,
    p.category,
    p.hashtags || [],
    "",
    p.id,
    p.image
  );
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    content: expanded,
    category: p.category,
    author: "버진로드",
    date: p.date,
    image: p.image,
    readTime: p.readTime,
    hashtags: p.hashtags
  };
});

// Sort descending by date so newest posts are first in JSON
fullPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

fs.writeFileSync(path.join(process.cwd(), "posts-local.json"), JSON.stringify(fullPosts, null, 2), "utf-8");
console.log(`Successfully saved ${fullPosts.length} posts to posts-local.json!`);

// 5. Update auto-schedule.json for recent days
try {
  const schedPath = path.join(process.cwd(), "auto-schedule.json");
  let schedData: any = { schedules: {} };
  if (fs.existsSync(schedPath)) {
    schedData = JSON.parse(fs.readFileSync(schedPath, "utf-8"));
  }
  if (!schedData.schedules) schedData.schedules = {};

  // For each day from 2026-09-01 to 2026-09-15, ensure schedules exist and are marked published
  const recentDays = ["2026-09-12", "2026-09-13", "2026-09-14", "2026-09-15"];
  recentDays.forEach(day => {
    const dayPosts = fullPosts.filter(p => p.date.startsWith(day));
    schedData.schedules[day] = dayPosts.map(p => {
      const timePart = p.date.split(" ")[1]?.slice(0, 5) || "09:00";
      return {
        id: `sched-${day.replace(/-/g, "")}-${p.category}-${p.id}`,
        category: p.category,
        targetTime: timePart,
        published: true,
        postId: p.id
      };
    });
  });

  fs.writeFileSync(schedPath, JSON.stringify(schedData, null, 2), "utf-8");
  console.log("Successfully updated auto-schedule.json for recent dates!");
} catch (e) {
  console.error("Failed to update auto-schedule.json:", e);
}
