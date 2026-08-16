import { Post } from "../types";
import { calculateReadTime } from "../lib/utils";
import { Clock, Eye } from "lucide-react";
import { formatViews } from "../lib/views";

interface PostCardProps {
  key?: string | number;
  post: Post;
  onClick: (id: string) => void;
  index?: number;
  views?: number;
  exposures?: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "신혼금융": { bg: "#EEF0FB", text: "#B0432F" },
  "신혼가전": { bg: "#F5F6FD", text: "#5B5870" },
  "결혼준비": { bg: "#FFD2BD", text: "#6B2418" },
};

export function PostCard({ post, onClick, views, exposures }: PostCardProps) {
  const dynamicReadTime = calculateReadTime(post.content);
  const colors = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["신혼금융"];

  return (
    <article
      className="group cursor-pointer card-warm overflow-hidden flex flex-col h-full bg-white"
      onClick={() => onClick(post.id)}
      id={`post-${post.id}`}
    >
      {/* Image */}
      <div className="relative aspect-[5/4] overflow-hidden bg-[#F5F6FD]">
        <img
          src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800"}
          alt={post.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=800";
          }}
        />
        {/* Category badge overlaid on image */}
        <div className="absolute top-3 left-3">
          <span
            style={{ backgroundColor: colors.bg, color: colors.text }}
            className="font-badge inline-flex items-center text-[13px] font-extrabold px-3.5 py-1.5 rounded-full tracking-tight shadow-xs"
          >
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Title */}
        <h3 className="font-heading text-[20px] sm:text-[22px] font-extrabold leading-[1.35] text-[#111827] mb-2.5 break-keep line-clamp-2 group-hover:text-[#E8745F] transition-colors tracking-[-0.025em]">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="font-sans text-[15.5px] sm:text-[16.5px] leading-[1.7] font-medium text-[#374151] line-clamp-2 break-keep mb-4 flex-1 tracking-[-0.012em]">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="font-badge flex items-center gap-2 text-[14px] font-semibold text-[#4B5563] pt-3.5 border-t border-[#EDEEF7]">
          <span>{post.date.replace(/-/g, ". ")}</span>
          <span className="w-[3px] h-[3px] bg-[#9CA3AF] rounded-full" />
          <Clock className="w-4 h-4 text-[#9CA3AF]" />
          <span>{dynamicReadTime}</span>
          {typeof views === "number" && views > 0 && (
            <>
              <span className="w-[3px] h-[3px] bg-[#9CA3AF] rounded-full" />
              <Eye className="w-4 h-4 text-[#9CA3AF]" />
              <span>{formatViews(views)}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
