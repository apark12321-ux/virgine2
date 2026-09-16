import { expandContentIfNeeded } from "./lib/contentExpander";
import { ALL_POST_DEFINITIONS, POST_TIMESTAMPS as GENERATED_TIMESTAMPS } from "./data/allPostsData";
import { Post, Category } from "./types";

export const CATEGORIES = ["신혼금융", "신혼가전", "결혼준비"] as const;

export type { Post, Category };

export const POST_TIMESTAMPS: string[] = GENERATED_TIMESTAMPS;

export const buildPosts = (): Post[] => {
  return ALL_POST_DEFINITIONS.map((post, idx) => {
    const postDate = POST_TIMESTAMPS[idx] || post.date;
    const expandedContent = expandContentIfNeeded(
      post.title,
      post.category,
      post.hashtags || [],
      "",
      post.id,
      post.image
    );

    return {
      ...post,
      content: expandedContent,
      date: postDate,
      author: post.author || "버진로드"
    };
  });
};

export const MOCK_POSTS: Post[] = buildPosts();
