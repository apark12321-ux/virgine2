import React from "react";
import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { Clock, BookOpen, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
  featured?: boolean;
  viewMode?: "list" | "card";
  key?: React.Key;
}

export function PostCard({ post, onClick, featured = false, viewMode = "list" }: PostCardProps) {
  const formattedDateTime = formatPostDateTime(post.date, post.id);

  // Pure Text & Typography Optimized List View (No Images, Zero CLS)
  if (viewMode === "list") {
    return (
      <article
        onClick={() => onClick(post.id)}
        className="group cursor-pointer py-4 sm:py-5 border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc] px-3 sm:px-4 -mx-3 sm:-mx-4 rounded transition-colors text-left"
        id={`post-${post.id}`}
      >
        <div className="flex flex-col gap-2">
          {/* Header Meta: Category Pill + Date + Status */}
          <div className="flex items-center gap-2 text-[12px] flex-wrap">
            <span className="inline-block px-2 py-0.5 text-[11px] font-bold bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] rounded">
              {post.category || "가전 관리 매뉴얼"}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#475569] bg-[#f1f5f9] px-1.5 py-0.5 rounded">
              <ShieldCheck className="w-3 h-3 text-[#0f766e]" />
              공식 매뉴얼 검증
            </span>
            <span className="text-[#cbd5e1]">·</span>
            <span className="text-[#64748b]">{formattedDateTime}</span>
            <span className="text-[#cbd5e1]">·</span>
            <span className="text-[#64748b] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime || "5분"} 읽기
            </span>
          </div>

          {/* Title */}
          <h2 className="text-[17px] sm:text-[19px] font-bold text-[#0f172a] group-hover:text-[#0f766e] group-hover:underline underline-offset-4 decoration-[#0f766e] transition-colors leading-snug break-keep">
            {post.title}
          </h2>

          {/* Detailed Excerpt */}
          <p className="text-[13.5px] sm:text-[14px] leading-relaxed text-[#475569] line-clamp-2 break-keep">
            {post.excerpt}
          </p>

          {/* Footer Meta & Tag Pills */}
          <div className="flex items-center justify-between pt-1 text-[12px] text-[#64748b]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#334155]">작성: 버진로드 기술편집팀</span>
              {post.hashtags && post.hashtags.length > 0 && (
                <span className="hidden sm:inline text-[#94a3b8]">
                  #{post.hashtags.slice(0, 3).join(" #")}
                </span>
              )}
            </div>
            <span className="text-[#0f766e] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
              전문 읽기 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Pure Text & Typography Optimized Card View (No Images)
  return (
    <article
      onClick={() => onClick(post.id)}
      className="group cursor-pointer bg-white border border-[#e2e8f0] hover:border-[#0f766e] hover:shadow-xs rounded-lg p-5 transition-all duration-200 flex flex-col justify-between h-full text-left"
      id={`post-${post.id}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-2 py-0.5 text-[11px] font-bold bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] rounded">
            {post.category || "가전 관리 매뉴얼"}
          </span>
          <span className="text-[11.5px] text-[#94a3b8] tabular-nums">
            {formattedDateTime}
          </span>
        </div>

        <h2 className="text-[16px] sm:text-[17px] font-bold text-[#0f172a] group-hover:text-[#0f766e] transition-colors line-clamp-2 leading-snug break-keep mb-2.5">
          {post.title}
        </h2>

        <p className="text-[13px] leading-relaxed text-[#475569] line-clamp-3 break-keep mb-4">
          {post.excerpt}
        </p>
      </div>

      <div className="pt-3 border-t border-[#f1f5f9] flex items-center justify-between text-[12px] text-[#64748b]">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#94a3b8]" />
          {post.readTime || "5분"} 소요
        </span>
        <span className="text-[#0f766e] font-bold flex items-center gap-0.5">
          가이드 보기 &rarr;
        </span>
      </div>
    </article>
  );
}
