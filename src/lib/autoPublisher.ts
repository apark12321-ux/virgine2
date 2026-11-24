import fs from "fs";
import path from "path";
import { MOCK_POSTS } from "../constants";
import { parsePostTimestamp } from "./utils";

const LOCAL_POSTS_FILE = path.join(process.cwd(), "posts-local.json");
const SCHEDULE_FILE = path.join(process.cwd(), "auto-schedule.json");

export type PostCategory = "신혼금융" | "신혼가전" | "결혼준비";

export const CATEGORIES: PostCategory[] = ["신혼가전"];

export function normalizeTitle(str: string): string {
  return (str || "").replace(/[^a-zA-Z0-9가-힣]/g, "").toLowerCase();
}

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: PostCategory;
  author: string;
  date: string;
  image: string;
  readTime: string;
  hashtags: string[];
}

export interface DayScheduleItem {
  id: string;
  category: PostCategory;
  targetTime: string;
  published: boolean;
  publishedAt?: string;
  postId?: string;
  postTitle?: string;
}

export interface ScheduleStore {
  schedules: Record<string, DayScheduleItem[]>;
  lastCheck?: string;
}

function secondsToTimeStr(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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
  const sec = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${min}:${sec}`;
}

export function getRandomPeakTime(seedStr?: string): string {
  let rand = Math.random();
  if (seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    rand = Math.abs(Math.sin(hash));
  }
  const totalSeconds = 29700 + Math.floor(rand * (78300 - 29700));
  return secondsToTimeStr(totalSeconds);
}

export function generateDailyCategorySchedules(dateStr: string): DayScheduleItem[] {
  const category: PostCategory = "신혼가전";
  const targetTime = getRandomPeakTime(`${dateStr}-${category}`);

  return [
    {
      id: `sched-${dateStr.replace(/-/g, "")}-${category}-1`,
      category,
      targetTime,
      published: false,
    },
  ];
}

export function loadLocalPosts(): Post[] {
  try {
    if (fs.existsSync(LOCAL_POSTS_FILE)) {
      const raw: Post[] = JSON.parse(fs.readFileSync(LOCAL_POSTS_FILE, "utf-8"));
      const seenTitles = new Set<string>();
      const seenIds = new Set<string>();
      const unique: Post[] = [];
      for (const p of raw) {
        if (!p.id || !p.id.startsWith("manual-")) continue;
        const norm = normalizeTitle(p.title);
        if (!p.title || seenTitles.has(norm) || seenIds.has(p.id)) continue;
        seenTitles.add(norm);
        seenIds.add(p.id);
        unique.push(p);
      }
      return unique;
    }
  } catch (e) {
    console.error("Failed to load local posts:", e);
  }
  return [];
}

export function saveLocalPosts(posts: Post[]) {
  try {
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    const unique: Post[] = [];
    for (const p of posts) {
      if (!p.id || !p.id.startsWith("manual-")) continue;
      const norm = normalizeTitle(p.title);
      if (!p.title || seenTitles.has(norm) || seenIds.has(p.id)) continue;
      seenTitles.add(norm);
      seenIds.add(p.id);
      unique.push(p);
    }
    fs.writeFileSync(LOCAL_POSTS_FILE, JSON.stringify(unique, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save local posts:", e);
  }
}

export function loadScheduleStore(): ScheduleStore {
  try {
    if (fs.existsSync(SCHEDULE_FILE)) {
      return JSON.parse(fs.readFileSync(SCHEDULE_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to load schedule store:", e);
  }
  return { schedules: {} };
}

export function saveScheduleStore(store: ScheduleStore) {
  try {
    fs.writeFileSync(SCHEDULE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save schedule store:", e);
  }
}

/**
 * Editorial Publishing Guard:
 * Never synthesizes low-value template backfill posts.
 * Tracks only verified appliance technical manuals in 1-post/day randomized schedule slots.
 */
export async function runAutoPublisherService(): Promise<{
  publishedCount: number;
  messages: string[];
  todayStatus: {
    date: string;
    currentTimeKST: string;
    schedules: DayScheduleItem[];
  };
}> {
  const kstNow = getKSTNow();
  const todayStr = getKSTDateString(kstNow);
  const currentTimeStr = getKSTTimeString(kstNow);
  const store = loadScheduleStore();
  const messages: string[] = [];

  if (!store.schedules[todayStr] || store.schedules[todayStr].length === 0) {
    store.schedules[todayStr] = generateDailyCategorySchedules(todayStr);
  }

  const todaySchedules = store.schedules[todayStr] || [];
  const existingToday = MOCK_POSTS.find(
    (p) =>
      p.date &&
      p.date.startsWith(todayStr) &&
      parsePostTimestamp(p.date, p.id) <= kstNow.getTime()
  );

  if (existingToday && todaySchedules[0] && !todaySchedules[0].published) {
    todaySchedules[0].published = true;
    todaySchedules[0].postId = existingToday.id;
    todaySchedules[0].postTitle = existingToday.title;
    todaySchedules[0].publishedAt = existingToday.date;
    if (existingToday.date.includes(" ")) {
      todaySchedules[0].targetTime = existingToday.date.split(" ")[1];
    }
  }

  store.lastCheck = kstNow.toISOString();
  saveScheduleStore(store);

  return {
    publishedCount: 0,
    messages,
    todayStatus: {
      date: todayStr,
      currentTimeKST: currentTimeStr,
      schedules: todaySchedules,
    },
  };
}
