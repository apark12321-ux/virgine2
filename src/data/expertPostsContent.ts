// Verified 30 Appliance Maintenance Manual Content Index
import { APPLIANCE_MANUAL_POSTS } from "./applianceManualData";

export const EXPERT_POSTS_CONTENT: Record<
  string,
  { id: string; title: string; excerpt: string; category: string; content: string }
> = Object.fromEntries(
  APPLIANCE_MANUAL_POSTS.map((post) => [
    post.id,
    {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      category: post.category,
      content: post.content,
    },
  ])
);
