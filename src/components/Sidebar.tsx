import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { 
  FolderOpen, 
  Trophy, 
  HelpCircle, 
  Bell, 
  Tag, 
  CheckCircle2
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
  const recentPosts = posts
    .filter((p) => p.id !== currentPostId)
    .slice(0, 5);

  const popularPosts = posts
    .filter((p) => p.id !== currentPostId)
    .slice(2, 7);

  const POPULAR_TAGS = [
    "디딤돌대출",
    "버팀목전세",
    "신혼부부특공",
    "신생아특례",
    "혼수가전",
    "키친핏냉장고",
    "식기세척기",
    "로봇청소기",
    "웨딩홀견적",
    "스드메정찰제",
    "부동산전자계약",
  ];

  return (
    <aside className="w-full space-y-5 font-sans text-left" id="blog-sidebar">
      {/* 1. Editor Profile (Clean, minimal knowledge base style) */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-[#f1f5f9]">
          <div className="w-10 h-10 rounded bg-[#0f766e] text-white flex items-center justify-center font-bold text-sm shrink-0">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[15px] text-[#0f172a]">버진로드 편집부</h3>
              <span className="text-[11px] px-1.5 py-0.2 bg-[#f0fdfa] text-[#0f766e] font-semibold border border-[#ccfbf1] rounded">
                공식
              </span>
            </div>
            <p className="text-[12px] text-[#64748b]">2026 주거금융·결혼 실전자료</p>
          </div>
        </div>

        <p className="text-[12.5px] leading-relaxed text-[#475569] my-3 break-keep">
          국토교통부, 주택도시기금, 청약홈 공시 규정을 바탕으로 신혼부부에게 꼭 필요한 주거·대출·가전 정보를 정리합니다.
        </p>

        <button
          type="button"
          onClick={() => onNavigate("about")}
          className="w-full py-1.5 px-3 text-[12px] font-medium text-[#475569] hover:text-[#0f172a] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span>블로그 소개 &amp; 검증 원칙</span>
          <span>&rarr;</span>
        </button>
      </div>

      {/* 2. Most Viewed Questions & Guides (ko.phongnhaexplorer.com Trophy style) */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#0f172a] pb-2.5 mb-3 border-b border-[#f1f5f9] flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#d97706]" />
          <span>가장 많이 본 글 (인기 Q&amp;A)</span>
        </h4>

        <ul className="divide-y divide-gray-100 text-[13px]">
          {popularPosts.map((post, idx) => (
            <li key={post.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
              <span className="font-bold text-[#0f766e] text-xs mt-0.5 w-4 text-center">{idx + 1}</span>
              <button
                type="button"
                onClick={() => onNavigate(`post-${post.id}`)}
                className="text-left group cursor-pointer flex-1"
              >
                <span className="text-[#334155] group-hover:text-[#0f766e] line-clamp-2 leading-snug transition-colors">
                  {post.title}
                </span>
                <div className="text-[11px] text-[#94a3b8] mt-1 flex items-center gap-1.5">
                  <span className="text-[#0284c7]">{post.category}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 3. Category Archive Widget */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#0f172a] pb-2.5 mb-3 border-b border-[#f1f5f9] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-[#0f766e]" />
            <span>카테고리 분류</span>
          </span>
          <span className="text-[11.5px] font-normal text-[#94a3b8]">총 {posts.length}편</span>
        </h4>

        <ul className="space-y-1 text-[13px]">
          <li>
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left cursor-pointer ${
                !activeCategory
                  ? "bg-[#f0fdfa] text-[#0f766e] font-bold"
                  : "text-[#475569] hover:bg-[#f8fafc]"
              }`}
            >
              <span>전체 질문 및 가이드</span>
              <span className="text-xs text-[#94a3b8]">({posts.length})</span>
            </button>
          </li>

          {categories.map((cat) => {
            const count = posts.filter((p) => p.category === cat).length;
            const isActive = activeCategory === cat;
            return (
              <li key={cat}>
                <button
                  type="button"
                  onClick={() => onNavigate(`category-${cat}`)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 pl-4 rounded transition-colors text-left cursor-pointer ${
                    isActive
                      ? "bg-[#f0fdfa] text-[#0f766e] font-bold"
                      : "text-[#475569] hover:bg-[#f8fafc]"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-[#cbd5e1]">&bull;</span>
                    <span>{cat}</span>
                  </span>
                  <span className="text-xs text-[#94a3b8]">({count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 4. Recent Questions & Answers (최신 Q&A) */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#0f172a] pb-2.5 mb-3 border-b border-[#f1f5f9] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#0f766e]" />
          <span>최근 등록된 질문 &amp; 가이드</span>
        </h4>

        <ul className="divide-y divide-gray-100 text-[13px]">
          {recentPosts.map((post) => (
            <li key={post.id} className="py-2.5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => onNavigate(`post-${post.id}`)}
                className="w-full text-left group cursor-pointer"
              >
                <span className="text-[#334155] group-hover:text-[#0f766e] line-clamp-2 leading-snug break-keep transition-colors">
                  {post.title}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#94a3b8]">
                  <span className="text-[#0284c7]">{post.category}</span>
                  <span>·</span>
                  <span>{formatPostDateTime(post.date, post.id)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Clean Sidebar AdSense Unit */}
      {ADSENSE_ENABLED && (
        <div className="bg-white border border-[#e2e8f0] rounded p-3 shadow-2xs">
          <AdSenseUnit slot="sidebar-ad-01" label="광고 / Sponsored" format="rectangle" />
        </div>
      )}

      {/* 6. Tag Cloud */}
      <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#0f172a] pb-2.5 mb-3 border-b border-[#f1f5f9] flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-[#0f766e]" />
          <span>인기 검색 태그</span>
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (onSearch) onSearch(tag);
              }}
              className="text-[12px] text-[#475569] hover:text-[#0f766e] bg-[#f8fafc] hover:bg-[#f0fdfa] border border-[#cbd5e1] hover:border-[#0f766e] px-2 py-1 rounded transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
