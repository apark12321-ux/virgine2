import fs from "fs";
import path from "path";
import { expandContentIfNeeded } from "../src/lib/contentExpander";

const localPostsPath = path.join(process.cwd(), "posts-local.json");
const posts = JSON.parse(fs.readFileSync(localPostsPath, "utf-8"));

console.log(`Starting migration of ${posts.length} posts to 1st-person storytelling format...`);

const updatedPosts = posts.map((post: any) => {
  // Always regenerate content with the 1st person storytelling template
  const newContent = expandContentIfNeeded(
    post.title,
    post.category,
    post.hashtags || [],
    "", // force generation
    post.id,
    post.image
  );
  return {
    ...post,
    content: newContent
  };
});

fs.writeFileSync(localPostsPath, JSON.stringify(updatedPosts, null, 2), "utf-8");
console.log(`Successfully updated ${updatedPosts.length} posts in posts-local.json!`);
