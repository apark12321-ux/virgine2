import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { 
  FolderOpen, 
  TrendingUp, 
  Clock, 
  Bell, 
  Tag, 
  User, 
  Mail, 
  Calendar,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { AdSenseUnit } from "./AdSenseUnit";

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
    <aside className="w-full space-y-6 font-sans text-left" id="tistory-sidebar">
      {/* 1. Profile Widget (Classic Tistory / Naver Blog Profile) */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-2xs">
        <div className="flex items-center gap-3.5 mb-3.5 pb-3.5 border-b border-[#f3f4f6]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 p-0.5 shrink-0">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-rose-600 font-bold text-xl overflow-hidden">
              <span className="font-serif">V</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-[16px] text-[#111827]">버진로드</h3>
              <span className="text-[10.5px] px-1.5 py-0.2 bg-rose-50 text-rose-600 font-semibold border border-rose-200 rounded">
                에디터
              </span>
            </div>
            <p className="text-[12px] text-[#6b7280] mt-0.5">신혼 주거·금융 전문 에디터</p>
          </div>
        </div>

        <p className="text-[13px] leading-relaxed text-[#4b5563] mb-4 break-keep">
          2026년 신혼부부의 안전한 주거 독립(디딤돌·버팀목·청약)과 현명한 가전·웨딩 소비를 연구하고 기록하는 실전 블로그입니다.
        </p>

        <div>
          <button
            type="button"
            onClick={() => onNavigate("about")}
            className="w-full py-2 px-3 text-[12.5px] font-medium text-[#4b5563] hover:text-[#111827] bg-[#f9fafb] hover:bg-[#f3f4f6] border border-[#e5e7eb] rounded-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>블로그 소개 &amp; 편집 원칙 보기</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* 2. Category Tree Widget (Classic Tistory Format) */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#111827] pb-2.5 mb-3 border-b border-[#f3f4f6] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-rose-600" />
            <span>카테고리 (Category)</span>
          </span>
          <span className="text-[11.5px] font-normal text-gray-400">총 {posts.length}개</span>
        </h4>

        <ul className="space-y-1 text-[13.5px]">
          <li>
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left cursor-pointer ${
                !activeCategory
                  ? "bg-rose-50 text-rose-700 font-bold"
                  : "text-[#374151] hover:bg-gray-50"
              }`}
            >
              <span>분류 전체보기</span>
              <span className="text-xs text-gray-400 font-normal">({posts.length})</span>
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
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 pl-5 rounded transition-colors text-left cursor-pointer ${
                    isActive
                      ? "bg-rose-50 text-rose-700 font-bold"
                      : "text-[#4b5563] hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-300">ㄴ</span>
                    <span>{cat}</span>
                  </span>
                  <span className="text-xs text-gray-400 font-normal">({count})</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 3. Notice / Announcement Widget (공지사항) */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#111827] pb-2.5 mb-3 border-b border-[#f3f4f6] flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-rose-600" />
          <span>공지사항 (Notice)</span>
        </h4>

        <div className="space-y-2.5 text-[13px]">
          <div
            onClick={() => onNavigate("announcement")}
            className="cursor-pointer hover:text-rose-600 transition-colors"
          >
            <p className="font-semibold text-gray-800 line-clamp-1">📢 2026년 주거금융 개편안 전면 반영 안내</p>
            <span className="text-[11.5px] text-gray-400">2026.09.09</span>
          </div>
          <div
            onClick={() => onNavigate("policy")}
            className="cursor-pointer hover:text-rose-600 transition-colors"
          >
            <p className="font-semibold text-gray-800 line-clamp-1">📢 국토부·주택도시기금 최신 고시 링크 허브</p>
            <span className="text-[11.5px] text-gray-400">2026.09.08</span>
          </div>
          <div
            onClick={() => onNavigate("terms")}
            className="cursor-pointer hover:text-rose-600 transition-colors"
          >
            <p className="font-semibold text-gray-800 line-clamp-1">📢 블로그 저작권 및 팩트체크 기준 공지</p>
            <span className="text-[11.5px] text-gray-400">2026.09.01</span>
          </div>
        </div>
      </div>

      {/* 4. Recent Posts (최근에 올라온 글) */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#111827] pb-2.5 mb-3 border-b border-[#f3f4f6] flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-rose-600" />
          <span>최근에 올라온 글</span>
        </h4>

        <ul className="divide-y divide-gray-100 text-[13px]">
          {recentPosts.map((post) => (
            <li key={post.id} className="py-2.5 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => onNavigate(`post-${post.id}`)}
                className="w-full text-left group cursor-pointer"
              >
                <span className="text-gray-800 group-hover:text-rose-600 line-clamp-2 leading-snug break-keep transition-colors">
                  {post.title}
                </span>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                  <span>{post.category}</span>
                  <span>·</span>
                  <span>{formatPostDateTime(post.date, post.id)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 5. Popular Posts (인기 포스팅) */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#111827] pb-2.5 mb-3 border-b border-[#f3f4f6] flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-rose-600" />
          <span>인기 글 (Popular)</span>
        </h4>

        <ul className="divide-y divide-gray-100 text-[13px]">
          {popularPosts.map((post, idx) => (
            <li key={post.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-2.5">
              <span className="font-bold text-rose-600 text-xs mt-0.5">{idx + 1}</span>
              <button
                type="button"
                onClick={() => onNavigate(`post-${post.id}`)}
                className="text-left group cursor-pointer flex-1"
              >
                <span className="text-gray-800 group-hover:text-rose-600 line-clamp-1 transition-colors">
                  {post.title}
                </span>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  <span>{post.category}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 6. Sidebar AdSense Slot */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-3 shadow-2xs">
        <AdSenseUnit slot="sidebar-ad-01" label="광고 / Sponsored" format="rectangle" />
      </div>

      {/* 7. Tag Cloud (태그) */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-5 shadow-2xs">
        <h4 className="text-[14px] font-bold text-[#111827] pb-2.5 mb-3 border-b border-[#f3f4f6] flex items-center gap-1.5">
          <Tag className="w-4 h-4 text-rose-600" />
          <span>태그 클라우드 (Tags)</span>
        </h4>

        <div className="flex flex-wrap gap-1.5">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                if (onSearch) onSearch(tag);
              }}
              className="text-[12px] text-gray-600 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 border border-gray-200 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
