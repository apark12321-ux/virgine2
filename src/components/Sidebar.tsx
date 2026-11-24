import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { Zap, Wrench, ArrowRight } from "lucide-react";
import { AdSenseUnit, ADSENSE_ENABLED } from "./AdSenseUnit";

interface SidebarProps {
  posts: Post[];
  categories: readonly string[];
  activeCategory?: string;
  onNavigate: (page: string) => void;
  currentPostId?: string;
  onSearch?: (q: string) => void;
}

export function Sidebar({
  posts,
  onNavigate,
  currentPostId,
  onSearch,
}: SidebarProps) {
  const popularPosts = posts
    .filter((p) => p.id !== currentPostId)
    .slice(0, 6);

  const POPULAR_TAGS = [
    "드럼세탁기",
    "히트펌프건조기",
    "식기세척기",
    "시스템에어컨",
    "로봇청소기",
    "인덕션",
    "공기청정기",
    "냉장고",
    "제습기",
    "전기압력밥솥",
  ];

  return (
    <aside className="w-full space-y-5 font-sans text-left" id="blog-sidebar">
      {/* 1. Interactive Care Tools Box */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <h3 className="text-[13.5px] font-bold text-[#0F172A] pb-3 mb-3 border-b border-[#F1F5F9]">
          가전 자가 진단 도구
        </h3>
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onNavigate("tool-power-cost")}
            className="w-full text-left p-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-[#E2E8F0] hover:border-[#99F6E4] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#0F766E]">
                <Zap className="w-3.5 h-3.5 text-[#0F766E]" />
                월간 전기요금 계산기
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0F766E]" />
            </div>
            <p className="text-[12px] text-[#64748B] leading-snug">
              2026 한전 누진제 구간·가전별 전력량 계산
            </p>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("tool-filter-cycle")}
            className="w-full text-left p-3 rounded-lg bg-[#F8FAFC] hover:bg-[#F0FDFA] border border-[#E2E8F0] hover:border-[#99F6E4] transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#0F172A] group-hover:text-[#0F766E]">
                <Wrench className="w-3.5 h-3.5 text-[#0F766E]" />
                필터 교체 주기 진단기
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#0F766E]" />
            </div>
            <p className="text-[12px] text-[#64748B] leading-snug">
              10대 가전 청소 D-Day·연간 소모품비 진단
            </p>
          </button>
        </div>
      </div>

      {/* 2. Most Read Technical Guides */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <h4 className="text-[13.5px] font-bold text-[#0F172A] pb-3 mb-3 border-b border-[#F1F5F9]">
          주요 가전 관리 매뉴얼
        </h4>
        <ul className="divide-y divide-[#F1F5F9] text-[13px]">
          {popularPosts.map((post, idx) => (
            <li key={post.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
              <span className="font-bold text-[#0F766E] text-[12px] mt-0.5 w-4 text-center shrink-0 tabular-nums">
                {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => onNavigate(`post-${post.id}`)}
                className="text-left group cursor-pointer flex-1"
              >
                <span className="text-[#0F172A] group-hover:text-[#0F766E] font-medium leading-snug line-clamp-2 transition-colors">
                  {post.title}
                </span>
                <span className="text-[11.5px] text-[#94A3B8] mt-1 block tabular-nums">
                  {formatPostDateTime(post.date, post.id)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Quick Appliance Keyword Index */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
        <h4 className="text-[13.5px] font-bold text-[#0F172A] pb-3 mb-3 border-b border-[#F1F5F9]">
          품목별 빠른 검색
        </h4>
        <div className="flex flex-wrap gap-x-3 gap-y-2 text-[12.5px]">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSearch && onSearch(tag)}
              className="text-[#475569] hover:text-[#0F766E] hover:underline transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Editorial Desk Box */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5">
        <h3 className="font-bold text-[14px] text-[#0F172A] mb-1.5">버진로드 기술편집팀</h3>
        <p className="text-[12.5px] leading-relaxed text-[#475569] mb-3.5 break-keep">
          제조사 공식 서비스 규격과 안전 기준을 교차 검토하여 가정용 기기 유지관리 지침을 발행합니다.
        </p>
        <div className="flex items-center gap-3 text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={() => onNavigate("about")}
            className="text-[#0F172A] hover:text-[#0F766E] transition-colors cursor-pointer"
          >
            편집원칙
          </button>
          <span className="text-[#CBD5E1]">·</span>
          <button
            type="button"
            onClick={() => onNavigate("policy")}
            className="text-[#0F172A] hover:text-[#0F766E] transition-colors cursor-pointer"
          >
            안전기준
          </button>
          <span className="text-[#CBD5E1]">·</span>
          <button
            type="button"
            onClick={() => onNavigate("contact")}
            className="text-[#0F766E] hover:underline transition-colors cursor-pointer"
          >
            정정 제보
          </button>
        </div>
      </div>

      {ADSENSE_ENABLED && (
        <AdSenseUnit slot="sidebar-01" label="광고 / Sponsored" format="rectangle" />
      )}
    </aside>
  );
}
