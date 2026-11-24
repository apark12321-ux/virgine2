// Verified 30 Appliance Technical Maintenance Manual Dataset
import { Post } from "../types";
import { APPLIANCE_MANUAL_POSTS } from "./applianceManualData";

export const POST_TIMESTAMPS: string[] = APPLIANCE_MANUAL_POSTS.map((p) => p.date);

export const ALL_POST_DEFINITIONS: Omit<Post, "content">[] = APPLIANCE_MANUAL_POSTS.map((p) => ({
  id: p.id,
  title: p.title,
  excerpt: p.excerpt,
  category: p.category,
  author: p.author,
  date: p.date,
  image: p.image,
  readTime: p.readTime,
  hashtags: p.hashtags,
}));
