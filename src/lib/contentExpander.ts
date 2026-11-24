// Verified Appliance Technical Content Resolver
// Zero template/boilerplate synthesis — returns only verified authored manuals.

import { EXPERT_POSTS_CONTENT } from "../data/expertPostsContent";

export function getCharCountNoSpaces(html: string): number {
  if (!html) return 0;
  const cleanText = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  return cleanText.length;
}

export function expandContentIfNeeded(
  title: string,
  _category: "신혼금융" | "신혼가전" | "결혼준비",
  _hashtags: string[] = [],
  originalContent: string = "",
  id: string = "",
  _postImage: string = ""
): string {
  if (id && EXPERT_POSTS_CONTENT[id]?.content) {
    return EXPERT_POSTS_CONTENT[id].content;
  }

  const normalizedTitle = title.replace(/\s+/g, "").toLowerCase();
  const matchedPost = Object.values(EXPERT_POSTS_CONTENT).find(
    (p) => p.title.replace(/\s+/g, "").toLowerCase() === normalizedTitle
  );
  if (matchedPost?.content) {
    return matchedPost.content;
  }

  return (originalContent || "").trim();
}
