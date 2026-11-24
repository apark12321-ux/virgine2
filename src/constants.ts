import { APPLIANCE_MANUAL_POSTS } from "./data/applianceManualData";
import { Post, Category } from "./types";

export const CATEGORIES = ["신혼가전"] as const;

export type { Post, Category };

export const POST_TIMESTAMPS: string[] = APPLIANCE_MANUAL_POSTS.map((p) => p.date);

export const buildPosts = (): Post[] => {
  return APPLIANCE_MANUAL_POSTS.map((post) => ({
    ...post,
    author: post.author || "버진로드",
  }));
};

export const MOCK_POSTS: Post[] = buildPosts();
