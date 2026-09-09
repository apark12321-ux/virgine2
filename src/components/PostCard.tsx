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

  // Classic Tistory / Naver Blog List Item (Default)
  if (viewMode === "list") {
    return (
      <article
        onClick={() => onClick(post.id)}
        className="group cursor-pointer py-5 sm:py-6 border-b border-[#e5e7eb] last:border-b-0 hover:bg-[#fafafa]/80 -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-md transition-colors text-left"
        id={`post-${post.id}`}
      >
        <div className="flex flex-col-reverse sm:flex-row items-start justify-between gap-4">
          {/* Left / Main Text Area */}
          <div className="flex-1 min-w-0 pr-0 sm:pr-4">
            {/* Category tag */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] font-bold text-rose-600">
                {post.category}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-[12px] text-gray-500">실전 가이드</span>
            </div>

            {/* Post Title */}
            <h2 className="text-[17px] sm:text-[19px] font-bold text-[#111827] group-hover:text-rose-600 group-hover:underline underline-offset-4 decoration-rose-400 transition-colors leading-[1.4] break-keep mb-2">
              {post.title}
            </h2>

            {/* Post Excerpt */}
            <p className="text-[13.5px] sm:text-[14px] leading-relaxed text-[#4b5563] line-clamp-2 sm:line-clamp-3 break-keep mb-3">
              {post.excerpt}
            </p>

            {/* Meta info (Author, Date, Category) */}
            <div className="flex items-center gap-3 text-[12px] text-[#9ca3af]">
              <span className="font-medium text-[#4b5563]">버진로드</span>
              <span>·</span>
              <span>{formattedDateTime}</span>
            </div>
          </div>

          {/* Right Thumbnail Image (Classic 120x100 / 140x110) */}
          <div className="w-full sm:w-[150px] lg:w-[160px] aspect-[16/10] sm:aspect-[4/3] rounded-md overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
            <img
              src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800"}
              alt={post.title}
              referrerPolicy="no-referrer"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
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

  // Card View Mode (Classic Naver Blog / Tistory Grid Card)
  return (
    <article
      onClick={() => onClick(post.id)}
      className="group cursor-pointer bg-white border border-[#e5e7eb] hover:border-gray-400 rounded-lg overflow-hidden transition-all duration-200 flex flex-col h-full text-left"
      id={`post-${post.id}`}
    >
      <div className="aspect-[16/10] overflow-hidden bg-gray-100">
        <img
          src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800"}
          alt={post.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          onError={(e) => {
            const target = e.currentTarget;
            target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=600";
          }}
        />
      </div>

      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
        <div>
          <span className="text-[11.5px] font-bold text-rose-600 uppercase tracking-wider mb-1 block">
            {post.category}
          </span>
          <h2 className="text-[16px] font-bold text-[#111827] group-hover:text-rose-600 line-clamp-2 leading-snug break-keep mb-2 transition-colors">
            {post.title}
          </h2>
          <p className="text-[13px] leading-relaxed text-[#4b5563] line-clamp-2 break-keep mb-3">
            {post.excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11.5px] text-[#9ca3af] pt-3 border-t border-gray-100">
          <span>버진로드</span>
          <span>{formattedDateTime}</span>
        </div>
      </div>
    </article>
  );
}
