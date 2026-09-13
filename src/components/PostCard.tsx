import React from "react";
import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { Calendar, User, MessageSquare, Clock } from "lucide-react";

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
  featured?: boolean;
  viewMode?: "list" | "card";
  key?: React.Key;
}

export function PostCard({ post, onClick, featured = false, viewMode = "list" }: PostCardProps) {
  const formattedDateTime = formatPostDateTime(post.date, post.id);
  const readTime = Math.max(3, Math.ceil(((post.content || "").length || 2200) / 450));

  // Benchmark: ko.phongnhaexplorer.com style list item (dwqa-question-item)
  if (viewMode === "list") {
    return (
      <article
        onClick={() => onClick(post.id)}
        className="group cursor-pointer py-4 sm:py-5 border-b border-[#e2e8f0] last:border-b-0 hover:bg-[#f8fafc] px-3 sm:px-4 -mx-3 sm:-mx-4 rounded transition-colors text-left"
        id={`post-${post.id}`}
      >
        <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-4">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 pr-0 sm:pr-4">
            {/* Meta status & category (ko.phongnhaexplorer dwqa-question-meta style) */}
            <div className="flex items-center gap-2 mb-1.5 text-[12px]">
              <span className="inline-block px-1.5 py-0.5 text-[11px] font-bold bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] rounded">
                답변 완료
              </span>
              <span className="font-semibold text-[#0284c7]">
                {post.category}
              </span>
              <span className="text-[#cbd5e1]">·</span>
              <span className="text-[#64748b]">{formattedDateTime}</span>
            </div>

            {/* Title */}
            <h2 className="text-[16px] sm:text-[18px] font-bold text-[#0f172a] group-hover:text-[#0f766e] group-hover:underline underline-offset-4 decoration-[#0f766e] transition-colors leading-snug break-keep mb-1.5">
              {post.title}
            </h2>

            {/* Excerpt */}
            <p className="text-[13px] sm:text-[13.5px] leading-relaxed text-[#475569] line-clamp-2 break-keep mb-2">
              {post.excerpt}
            </p>

            {/* Stats: Read time and Author (ko.phongnhaexplorer dwqa-question-stats style) */}
            <div className="flex items-center gap-3 text-[12px] text-[#94a3b8]">
              <span className="text-[#64748b]">작성자: 버진로드</span>
              <span>·</span>
              <span className="text-[#0f766e] font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{readTime}분 읽기</span>
              </span>
            </div>
          </div>

          {/* Right Thumbnail */}
          <div className="w-full sm:w-[130px] lg:w-[140px] aspect-[16/10] sm:aspect-[4/3] rounded overflow-hidden bg-gray-100 shrink-0 border border-[#e2e8f0]">
            <img
              src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800"}
              alt={post.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600";
              }}
            />
          </div>
        </div>
      </article>
    );
  }

  // Card View Mode
  return (
    <article
      onClick={() => onClick(post.id)}
      className="group cursor-pointer bg-white border border-[#e2e8f0] hover:border-[#0f766e] rounded overflow-hidden transition-all duration-200 flex flex-col h-full text-left"
      id={`post-${post.id}`}
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800"}
          alt={post.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
          onError={(e) => {
            const target = e.currentTarget;
            target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600";
          }}
        />
      </div>

      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="px-1.5 py-0.2 text-[10.5px] font-bold bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] rounded">
              답변
            </span>
            <span className="text-[11.5px] font-semibold text-[#0284c7]">
              {post.category}
            </span>
          </div>
          <h2 className="text-[15.5px] font-bold text-[#0f172a] group-hover:text-[#0f766e] line-clamp-2 leading-snug break-keep mb-2 transition-colors">
            {post.title}
          </h2>
          <p className="text-[12.5px] leading-relaxed text-[#475569] line-clamp-2 break-keep mb-3">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11.5px] text-[#94a3b8] pt-2.5 border-t border-[#f1f5f9]">
          <span>{formattedDateTime}</span>
          <span className="text-[#0f766e] font-medium">{readTime}분 읽기</span>
        </div>
      </div>
    </article>
  );
}
