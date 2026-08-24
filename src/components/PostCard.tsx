import React from "react";
import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { Clock, Calendar } from "lucide-react";

interface PostCardProps {
  post: Post;
  onClick: (id: string) => void;
  featured?: boolean;
  key?: React.Key;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "신혼금융": { bg: "#EFF6FF", text: "#1D4ED8", border: "#DBEAFE" },
  "신혼가전": { bg: "#F0FDF4", text: "#15803D", border: "#DCFCE7" },
  "결혼준비": { bg: "#FFF1F2", text: "#BE123C", border: "#FFE4E6" },
};

export function PostCard({ post, onClick, featured = false }: PostCardProps) {
  const colors = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["신혼금융"];
  const formattedDate = formatPostDateTime(post.date, post.id).split(" ")[0];

  if (featured) {
    return (
      <article
        onClick={() => onClick(post.id)}
        className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-0"
        id={`featured-post-${post.id}`}
      >
        <div className="md:col-span-6 relative aspect-[16/10] md:aspect-auto overflow-hidden bg-[#F1F5F9]">
          <img
            src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800"}
            alt={post.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
          />
          {/* Top category badges */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            <span className="bg-[#1E1B2E] text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
              추천 포스팅
            </span>
            <span
              style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
              className="text-[12px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs"
            >
              {post.category}
            </span>
          </div>

          {/* Thumbnail Date Overlay Badge */}
          <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs text-white text-[11.5px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#FFB199]" />
            <span className="tabular-nums">{formattedDate}</span>
          </div>
        </div>

        <div className="md:col-span-6 p-6 sm:p-7 flex flex-col justify-between">
          <div>
            <h2 className="text-[20px] sm:text-[23px] font-bold text-[#111827] leading-[1.38] mb-3 break-keep group-hover:text-[#E8745F] transition-colors tracking-tight">
              {post.title}
            </h2>
            <p className="text-[14.5px] leading-[1.7] text-[#475569] line-clamp-3 break-keep mb-5">
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between text-[12.5px] text-[#64748B] pt-4 border-t border-[#F1F5F9]">
            <div className="flex items-center gap-1.5 font-semibold text-[#1E1B2E]">
              <span className="w-4 h-4 rounded-md bg-[#1E1B2E] text-white text-[9px] font-bold flex items-center justify-center">
                V
              </span>
              <span>버진로드</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums font-medium text-[#475569]">{formattedDate}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{post.readTime || "5분"}</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onClick(post.id)}
      className="group cursor-pointer bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-2xl overflow-hidden shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col h-full text-left"
      id={`post-${post.id}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#F8FAFC]">
        <img
          src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800"}
          alt={post.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-104"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800";
          }}
        />
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            style={{ backgroundColor: colors.bg, color: colors.text, borderColor: colors.border }}
            className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs"
          >
            {post.category}
          </span>
        </div>

        {/* Thumbnail Date Overlay Badge */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm">
          <Calendar className="w-3 h-3 text-[#FFB199]" />
          <span className="tabular-nums">{formattedDate}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="text-[17px] sm:text-[18.5px] font-bold leading-[1.4] text-[#111827] mb-2.5 break-keep line-clamp-2 group-hover:text-[#E8745F] transition-colors tracking-tight">
            {post.title}
          </h3>

          <p className="text-[13.5px] leading-[1.65] text-[#475569] line-clamp-2 break-keep mb-4">
            {post.excerpt}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[12px] text-[#64748B] pt-3.5 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-1.5 font-medium text-[#1E1B2E]">
            <span className="w-3.5 h-3.5 rounded-sm bg-[#1E1B2E] text-white text-[8px] font-bold flex items-center justify-center">
              V
            </span>
            <span>버진로드</span>
          </div>
          <div className="flex items-center gap-2 tabular-nums text-[#64748B]">
            <span className="font-medium text-[#334155]">{formattedDate}</span>
            <span>•</span>
            <span>{post.readTime || "5분"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
