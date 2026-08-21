import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { TrendingUp, BookOpen, ChevronRight, Calculator, Sparkles } from "lucide-react";
import { AdSenseUnit } from "./AdSenseUnit";

interface SidebarProps {
  posts: Post[];
  categories: readonly string[];
  activeCategory?: string;
  onNavigate: (page: string) => void;
  views?: Record<string, number>;
  currentPostId?: string;
}

export function Sidebar({
  posts,
  categories,
  activeCategory,
  onNavigate,
  currentPostId,
}: SidebarProps) {
  // Popular posts (exclude current if in post view)
  const popularPosts = posts
    .filter((p) => p.id !== currentPostId)
    .slice(0, 5);

  return (
    <aside className="w-full space-y-6" id="blog-sidebar">
      {/* 1. Category Navigation with Counts */}
      <div className="bg-white border border-[#E2E4F0] rounded-2xl p-5 shadow-xs text-left">
        <h4 className="text-[13px] font-bold text-[#1E1B2E] tracking-tight mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#E8745F]" />
            <span>카테고리</span>
          </span>
          <span className="text-[11px] font-normal text-[#94A3B8]">총 {posts.length}편</span>
        </h4>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
              !activeCategory
                ? "bg-[#1E1B2E] text-white font-bold"
                : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E1B2E]"
            }`}
          >
            <span>전체 글 보기</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full ${!activeCategory ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>
              {posts.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = posts.filter((p) => p.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onNavigate(`category-${cat}`)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#EEF0FB] text-[#B0432F] font-bold"
                    : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E1B2E]"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${isActive ? "bg-[#FFD2BD] text-[#B0432F]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Popular Posts (가장 많이 본 글) */}
      <div className="bg-white border border-[#E2E4F0] rounded-2xl p-5 shadow-xs text-left">
        <h4 className="text-[13px] font-bold text-[#1E1B2E] tracking-tight mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-[#E8745F]" />
          <span>인기 포스팅</span>
        </h4>

        <div className="divide-y divide-[#F1F5F9]">
          {popularPosts.map((post, idx) => (
            <button
              key={post.id}
              type="button"
              onClick={() => onNavigate(`post-${post.id}`)}
              className="group w-full py-2.5 text-left flex items-start gap-2.5 hover:bg-[#F8FAFC] -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
            >
              <span className="w-5 h-5 rounded-md bg-[#F1F5F9] group-hover:bg-[#EEF0FB] text-[#64748B] group-hover:text-[#B0432F] text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[#1E1B2E] group-hover:text-[#E8745F] line-clamp-2 leading-snug break-keep transition-colors">
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#94A3B8]">
                  <span>{post.category}</span>
                  <span>•</span>
                  <span>{formatPostDateTime(post.date, post.id).split(" ")[0]}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Direct Calculators (실전 금융 도구) */}
      <div className="bg-gradient-to-br from-[#FAF5FF] via-white to-[#F5F3FF] border border-[#E9D5FF] rounded-2xl p-5 shadow-xs text-left">
        <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-[#7C3AED] uppercase tracking-wider mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>신혼 맞춤 계산기</span>
        </div>
        <h4 className="text-[14px] font-bold text-[#1E1B2E] mb-3">
          대출 금리 &amp; 청약 가점 모의 계산
        </h4>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onNavigate("tools-didimdol")}
            className="w-full p-2.5 bg-white hover:bg-[#F3E8FF] border border-[#DDD6FE] rounded-xl text-[12.5px] font-bold text-[#5B21B6] transition-colors flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#7C3AED]" />
              <span>디딤돌·버팀목 금리 계산기</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A78BFA]" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("tools-cheongyak")}
            className="w-full p-2.5 bg-white hover:bg-[#F3E8FF] border border-[#DDD6FE] rounded-xl text-[12.5px] font-bold text-[#5B21B6] transition-colors flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#7C3AED]" />
              <span>신혼특공 청약 가점 시뮬레이터</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#A78BFA]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
