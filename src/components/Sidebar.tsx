import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { 
  Trophy, 
  HelpCircle, 
  ShieldCheck,
  Mail,
  FileText,
  Clock
} from "lucide-react";
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
  categories,
  activeCategory,
  onNavigate,
  currentPostId,
  onSearch,
}: SidebarProps) {
  const popularPosts = posts
    .filter((p) => p.id !== currentPostId)
    .slice(0, 5);

  const POPULAR_TAGS = [
    "식기세척기",
    "드럼세탁기",
    "건조기필터",
    "인덕션상판",
    "로봇청소기",
    "시스템에어컨",
    "키친핏냉장고",
    "공기청정기",
    "음식물처리기",
    "스타일러"
  ];

  return (
    <aside className="w-full space-y-5 font-sans text-left" id="blog-sidebar">
      {/* 1. Official Technical Manual Center Card */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#f1f5f9]">
          <div className="w-10 h-10 rounded bg-[#0f766e] text-white flex items-center justify-center font-bold text-sm shrink-0">
            VR
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[15px] text-[#0f172a]">버진로드 기술편집팀</h3>
              <span className="text-[11px] px-1.5 py-0.2 bg-[#f0fdfa] text-[#0f766e] font-semibold border border-[#ccfbf1] rounded">
                공식
              </span>
            </div>
            <p className="text-[12px] text-[#64748b]">가전 사용·관리 전문 매뉴얼</p>
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-[#475569] my-3 break-keep">
          제조사 공식 규격과 가전 엔지니어 정밀 점검 매뉴얼을 바탕으로, 신혼부부 및 입주 가구를 위한 고장 방지·세척 주기를 꼼꼼히 검증하여 전달합니다.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onNavigate("about")}
            className="py-1.5 px-2.5 text-[12px] font-medium text-[#475569] hover:text-[#0f172a] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded transition-colors text-center cursor-pointer"
          >
            소개 &amp; 편집원칙
          </button>
          <button
            type="button"
            onClick={() => onNavigate("contact")}
            className="py-1.5 px-2.5 text-[12px] font-medium text-[#0f766e] hover:text-[#115e59] bg-[#f0fdfa] hover:bg-[#ccfbf1] border border-[#ccfbf1] rounded transition-colors text-center cursor-pointer"
          >
            문의하기
          </button>
        </div>
      </div>

      {/* 2. Most Read Technical Guides (No Images, Clean Typography) */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#0f172a] pb-2.5 mb-3 border-b border-[#f1f5f9] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#d97706]" />
          <span>필독 가전 관리 매뉴얼</span>
        </h4>

        <ul className="divide-y divide-gray-100 text-[13px]">
          {popularPosts.map((post, idx) => (
            <li key={post.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
              <span className="font-bold text-[#0f766e] text-xs mt-0.5 w-4 text-center shrink-0">
                {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => onNavigate(`post-${post.id}`)}
                className="text-left group cursor-pointer flex-1"
              >
                <span className="text-[#0f172a] group-hover:text-[#0f766e] font-medium leading-snug line-clamp-2 transition-colors">
                  {post.title}
                </span>
                <span className="text-[11.5px] text-[#94a3b8] mt-1 block">
                  {formatPostDateTime(post.date, post.id)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Core Appliance Tags */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#0f172a] pb-2.5 mb-3 border-b border-[#f1f5f9]">
          주요 가전별 매뉴얼 검색
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onSearch && onSearch(tag)}
              className="text-[12px] bg-[#f8fafc] hover:bg-[#f0fdfa] text-[#475569] hover:text-[#0f766e] border border-[#e2e8f0] hover:border-[#ccfbf1] px-2 py-1 rounded transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Sidebar AdSense Unit */}
      {ADSENSE_ENABLED && (
        <AdSenseUnit slot="sidebar-01" label="광고 / Sponsored" format="rectangle" />
      )}
    </aside>
  );
}
