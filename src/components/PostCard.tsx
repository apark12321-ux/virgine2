import React from "react";
import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { getApplianceGroup } from "../data/applianceGroups";
import { ArrowRight } from "lucide-react";

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
  featured?: boolean;
  viewMode?: "list" | "card";
  key?: React.Key;
}

export function PostCard({ post, onClick, viewMode = "list" }: PostCardProps) {
  const formattedDateTime = formatPostDateTime(post.date, post.id);
  const group = getApplianceGroup(post.id, post.title);

  if (viewMode === "list") {
    return (
      <article
        onClick={() => onClick(post.id)}
        className="group cursor-pointer py-5 border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-lg transition-colors text-left"
        id={`post-${post.id}`}
      >
        <div className="flex flex-col gap-2">
          {/* Zero-pill editorial metadata line */}
          <div className="flex items-center gap-2 text-[12px] text-[#64748B] flex-wrap tabular-nums">
            <span className="font-bold text-[#0F766E]">{group}</span>
            <span className="text-[#CBD5E1]">·</span>
            <span>{formattedDateTime}</span>
            <span className="text-[#CBD5E1]">·</span>
            <span>{post.readTime || "8분"} 읽기</span>
          </div>

          <h2 className="text-[17px] sm:text-[19px] font-bold text-[#0F172A] group-hover:text-[#0F766E] transition-colors leading-snug break-keep">
            {post.title}
          </h2>

          <p className="text-[14px] leading-[1.65] text-[#475569] line-clamp-2 break-keep">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between pt-1 text-[12px] text-[#64748B]">
            <span className="truncate pr-4">
              {post.hashtags && post.hashtags.length > 0
                ? post.hashtags.slice(0, 3).map((t) => `#${t}`).join("  ")
                : "버진로드 기술편집팀"}
            </span>
            <span className="text-[#0F766E] font-semibold inline-flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
              매뉴얼 읽기 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onClick(post.id)}
      className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#0F766E] rounded-xl p-5 transition-colors flex flex-col justify-between h-full text-left"
      id={`post-${post.id}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2.5 text-[12px] tabular-nums">
          <span className="font-bold text-[#0F766E]">{group}</span>
          <span className="text-[#64748B]">{formattedDateTime}</span>
        </div>

        <h2 className="text-[16px] sm:text-[17px] font-bold text-[#0F172A] group-hover:text-[#0F766E] transition-colors line-clamp-2 leading-snug break-keep mb-2.5">
          {post.title}
        </h2>

        <p className="text-[13.5px] leading-relaxed text-[#475569] line-clamp-3 break-keep mb-4">
          {post.excerpt}
        </p>
      </div>

      <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[12px] text-[#64748B] tabular-nums">
        <span>{post.readTime || "8분"} 읽기</span>
        <span className="text-[#0F766E] font-semibold inline-flex items-center gap-0.5">
          매뉴얼 보기 <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
}
