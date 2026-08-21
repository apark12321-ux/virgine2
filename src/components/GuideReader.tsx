import React, { useState, useEffect, useMemo, useRef } from "react";
import { Post } from "../types";
import { POST_EXTRA_MAP } from "../postMeta";
import { formatPostDateTime } from "../lib/utils";
import { AdSenseUnit } from "./AdSenseUnit";
import { Sidebar } from "./Sidebar";
import {
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List,
  ArrowUp,
  BookOpen,
  Hash,
  Sparkles,
  Layers
} from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface GuideReaderProps {
  post: Post;
  allPosts: Post[];
  categories: readonly string[];
  prevPost: Post | null;
  nextPost: Post | null;
  relatedPosts: Post[];
  onNavigate: (page: string) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

/**
 * Parses raw HTML content, extracts H2 and H3 tags,
 * and ensures each heading in the rendered HTML has a unique ID and scroll-margin.
 */
function processHeadings(rawHtml: string): {
  processedHtml: string;
  tocItems: TocItem[];
} {
  if (!rawHtml) return { processedHtml: "", tocItems: [] };

  const tocItems: TocItem[] = [];
  let index = 0;

  // Regular expression matching <h2>...</h2> and <h3>...</h3>
  const headingRegex = /<(h[23])(\s+[^>]*)?>([\s\S]*?)<\/\1>/gi;

  const processedHtml = rawHtml.replace(headingRegex, (match, tag, existingAttrs, innerContent) => {
    const level = tag.toLowerCase() === "h2" ? 2 : 3;
    // Strip nested HTML tags for TOC text
    const cleanText = innerContent.replace(/<[^>]+>/g, "").trim();
    if (!cleanText) return match;

    const safeSlug = cleanText
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9가-힣]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const id = `toc-heading-${index++}-${safeSlug || "section"}`;
    tocItems.push({
      id,
      text: cleanText,
      level
    });

    // Remove any existing id from existingAttrs to avoid duplicates
    const sanitizedAttrs = (existingAttrs || "")
      .replace(/\bid="[^"]*"/gi, "")
      .trim();

    return `<${tag} id="${id}" class="scroll-mt-28 group relative font-extrabold ${sanitizedAttrs}">
      <span class="inline-flex items-center gap-1.5">${innerContent}</span>
    </${tag}>`;
  });

  return { processedHtml, tocItems };
}

export function GuideReader({
  post,
  allPosts,
  categories,
  prevPost,
  nextPost,
  relatedPosts,
  onNavigate,
  showToast
}: GuideReaderProps) {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);
  const articleContentRef = useRef<HTMLDivElement>(null);
  const tocNavRef = useRef<HTMLElement>(null);
  const isUserClickingRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Extract headings and inject IDs
  const { processedHtml, tocItems } = useMemo(() => {
    return processHeadings(post.content);
  }, [post.content]);

  // Set initial active heading when post or headings change
  useEffect(() => {
    if (tocItems.length > 0) {
      setActiveHeadingId(tocItems[0].id);
    }
  }, [tocItems]);

  // ScrollSpy & Reading Progress Tracker
  useEffect(() => {
    if (tocItems.length === 0) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docEl = document.documentElement;
          const scrollTop = window.scrollY || docEl.scrollTop;
          const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
          const progress = scrollHeight > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100))) : 0;
          setReadingProgress(progress);

          // If a click navigation is currently in progress, let the click handler control active state
          if (isUserClickingRef.current) {
            ticking = false;
            return;
          }

          // If user scrolled almost to the very bottom, activate the last heading
          if (scrollHeight > 0 && scrollTop >= scrollHeight - 60) {
            const lastItem = tocItems[tocItems.length - 1];
            if (lastItem) {
              setActiveHeadingId(lastItem.id);
            }
            ticking = false;
            return;
          }

          // Calculate current active heading with sticky navbar threshold
          const offsetThreshold = 130; // Navbar height (~64px) + comfortable trigger buffer
          let currentActive = tocItems[0].id;

          for (let i = 0; i < tocItems.length; i++) {
            const item = tocItems[i];
            const el = document.getElementById(item.id);
            if (el) {
              const top = el.getBoundingClientRect().top;
              if (top <= offsetThreshold) {
                currentActive = item.id;
              } else {
                break;
              }
            }
          }

          setActiveHeadingId(currentActive);
          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial evaluation
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [tocItems]);

  // Automatically scroll TOC container so the active item is always visible
  useEffect(() => {
    if (!activeHeadingId || !tocNavRef.current) return;
    const activeBtn = tocNavRef.current.querySelector<HTMLElement>(`[data-heading-id="${activeHeadingId}"]`);
    if (activeBtn) {
      const container = tocNavRef.current;
      const btnTop = activeBtn.offsetTop;
      const btnHeight = activeBtn.offsetHeight;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      if (btnTop < containerScrollTop || btnTop + btnHeight > containerScrollTop + containerHeight) {
        container.scrollTo({
          top: Math.max(0, btnTop - containerHeight / 2 + btnHeight / 2),
          behavior: "smooth"
        });
      }
    }
  }, [activeHeadingId]);

  // Smooth scroll to target heading with precise offset & visual highlight
  const scrollToHeading = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    // Prevent ScrollSpy from overriding during the smooth scroll animation
    isUserClickingRef.current = true;
    setActiveHeadingId(id);
    setMobileTocOpen(false);

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isUserClickingRef.current = false;
    }, 850);

    const NAVBAR_HEIGHT = 80;
    const targetRect = target.getBoundingClientRect();
    const absoluteTop = targetRect.top + window.pageYOffset - NAVBAR_HEIGHT;

    window.scrollTo({
      top: Math.max(0, absoluteTop),
      behavior: "smooth"
    });

    // Brief subtle highlight on arrival
    target.classList.add("ring-2", "ring-[#E8745F]/40", "rounded-lg", "transition-all", "duration-500");
    setTimeout(() => {
      target.classList.remove("ring-2", "ring-[#E8745F]/40");
    }, 1500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
      {/* ========================================================================= */}
      {/* 1. MAIN ARTICLE READING COLUMN (col-span-8)                               */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xs">
        {/* Top Reading Progress Line */}
        <div
          className="fixed top-0 left-0 right-0 h-1 bg-[#E8745F] z-50 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />

        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="text-[12.5px] font-medium text-[#64748B] mb-5">
          <ol className="flex items-center gap-1.5">
            <li>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="hover:text-[#111827] cursor-pointer"
              >
                홈
              </button>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate(`category-${post.category}`)}
                className="text-[#E8745F] font-semibold hover:underline cursor-pointer"
              >
                {post.category}
              </button>
            </li>
          </ol>
        </nav>

        {/* Article Headline */}
        <h1 className="text-[26px] sm:text-[34px] lg:text-[38px] font-extrabold text-[#111827] leading-[1.3] tracking-tight mb-4 break-keep">
          {post.title}
        </h1>

        {/* Subtitle / Excerpt */}
        <p className="text-[16px] sm:text-[17.5px] leading-relaxed text-[#475569] mb-6 break-keep">
          {post.excerpt}
        </p>

        {/* Meta Bar */}
        <div className="flex items-center justify-between py-4 border-y border-[#F1F5F9] mb-8 text-[13px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E1B2E] text-white flex items-center justify-center font-black text-[15px] shadow-xs">
              V
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#111827]">버진로드</span>
                <span className="text-[11px] text-[#E8745F] font-semibold bg-[#EEF0FB] px-1.5 py-0.5 rounded">
                  포스팅
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#94A3B8] mt-0.5 tabular-nums">
                <span>{formatPostDateTime(post.date, post.id)}</span>
                <span>•</span>
                <span>{post.readTime || "5분"} 읽기</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="포스트 링크 복사"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  showToast("포스트 주소가 복사되었습니다!", "success");
                } catch {
                  showToast("주소 복사에 실패했습니다.", "error");
                }
              }}
              className="p-2 text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="포스트 인쇄"
              onClick={() => window.print()}
              className="p-2 text-[#64748B] hover:text-[#111827] hover:bg-[#F1F5F9] rounded-lg transition-colors hidden sm:block cursor-pointer"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Featured Image */}
        <div className="aspect-[16/10] overflow-hidden rounded-xl bg-[#F8FAFC] mb-8 border border-[#F1F5F9]">
          <img
            src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=1200"}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* In-Article Mobile/Tablet Quick TOC Box */}
        {tocItems.length > 0 && (
          <div className="mb-8 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl lg:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[14px] font-bold text-[#1E1B2E]">
                <List className="w-4 h-4 text-[#E8745F]" />
                <span>글 목차 (빠른 이동)</span>
              </div>
              <span className="text-[11px] font-bold text-[#64748B] bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                총 {tocItems.length}개 섹션
              </span>
            </div>
            <nav className="space-y-1.5">
              {tocItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  data-heading-id={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className={`w-full text-left py-1.5 px-2.5 rounded-lg text-[13px] leading-snug transition-all flex items-start gap-2 cursor-pointer ${
                    activeHeadingId === item.id
                      ? "bg-[#EEF0FB] text-[#E8745F] font-bold shadow-2xs border-l-3 border-[#E8745F]"
                      : "text-[#475569] hover:bg-white hover:text-[#111827]"
                  } ${item.level === 3 ? "pl-5 text-[12.5px]" : ""}`}
                >
                  <span className="text-[11px] opacity-60 mt-0.5 shrink-0">
                    {item.level === 2 ? `${idx + 1}.` : "•"}
                  </span>
                  <span className="break-keep">{item.text}</span>
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Top In-Article AdSense Slot */}
        <AdSenseUnit slot="article-top-01" label="광고 / Ad" format="auto" />

        {/* Article Body Content with Injected Heading IDs */}
        <div
          ref={articleContentRef}
          className="article-body text-[16.5px] sm:text-[17.5px] leading-[1.85] text-[#24292f]"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />

        {/* Middle In-Article AdSense Slot */}
        <AdSenseUnit slot="article-mid-02" label="광고 / Ad" format="auto" />

        {/* Key Takeaway Card */}
        {POST_EXTRA_MAP[post.id] && (
          <div className="mt-8 p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-left space-y-2">
            <div className="flex items-center gap-2 text-[#E8745F] font-bold text-[14px]">
              <span>💡</span>
              <span>한줄 요약</span>
            </div>
            <p className="text-[14.5px] text-[#334155] leading-relaxed break-keep">
              &ldquo;{POST_EXTRA_MAP[post.id].persona.message}&rdquo;
            </p>
          </div>
        )}

        {/* Reference Source Note (Simple & Clean) */}
        {POST_EXTRA_MAP[post.id]?.geoSource && (
          <div className="mt-4 px-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-left text-[12.5px] text-[#64748B] flex items-center gap-2">
            <span className="font-semibold text-[#475569]">참고:</span>
            <span className="break-keep">
              {POST_EXTRA_MAP[post.id].geoSource.agency} ({POST_EXTRA_MAP[post.id].geoSource.basis})
            </span>
          </div>
        )}

        {/* FAQ Section */}
        {POST_EXTRA_MAP[post.id] && POST_EXTRA_MAP[post.id].aeoFaq.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#F1F5F9]">
            <h3 className="text-[16px] font-bold text-[#111827] mb-3">
              💬 자주 묻는 질문 (FAQ)
            </h3>
            <div className="space-y-2.5">
              {POST_EXTRA_MAP[post.id].aeoFaq.map((faq, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div key={idx} className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                    >
                      <span className="text-[14px] font-semibold text-[#111827] break-keep">
                        <span className="text-[#E8745F] font-bold mr-1">Q.</span> {faq.q}
                      </span>
                      <span className="text-[12px] text-[#64748B] shrink-0 ml-2">
                        {isOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="p-4 bg-white border-t border-[#E2E8F0] text-[13.5px] text-[#475569] leading-relaxed break-keep">
                        <strong className="text-[#16A34A] mr-1">A.</strong> {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Hashtags */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex flex-wrap gap-2">
            {post.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-[12px] font-medium text-[#475569] bg-[#F1F5F9] px-3 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Bottom In-Article AdSense Slot */}
        <AdSenseUnit slot="article-bottom-03" label="스폰서 추천 광고" format="auto" />

        {/* Prev / Next Post Navigation */}
        <div className="mt-8 pt-6 border-t border-[#F1F5F9] grid grid-cols-1 sm:grid-cols-2 gap-4">
          {prevPost ? (
            <button
              type="button"
              onClick={() => onNavigate(`post-${prevPost.id}`)}
              className="p-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-left transition-colors cursor-pointer group"
            >
              <span className="text-[11px] text-[#94A3B8] font-bold flex items-center gap-1 mb-1">
                <ChevronLeft className="w-3.5 h-3.5" /> 이전 글
              </span>
              <p className="text-[13.5px] font-bold text-[#111827] group-hover:text-[#E8745F] line-clamp-1 transition-colors">
                {prevPost.title}
              </p>
            </button>
          ) : (
            <div />
          )}

          {nextPost && (
            <button
              type="button"
              onClick={() => onNavigate(`post-${nextPost.id}`)}
              className="p-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-right transition-colors cursor-pointer group"
            >
              <span className="text-[11px] text-[#94A3B8] font-bold flex items-center justify-end gap-1 mb-1">
                다음 글 <ChevronRight className="w-3.5 h-3.5" />
              </span>
              <p className="text-[13.5px] font-bold text-[#111827] group-hover:text-[#E8745F] line-clamp-1 transition-colors">
                {nextPost.title}
              </p>
            </button>
          )}
        </div>

        {/* Related Posts in same category */}
        {relatedPosts.length > 0 && (
          <div className="mt-10 pt-8 border-t border-[#F1F5F9]">
            <h3 className="text-[16px] font-bold text-[#111827] mb-4">
              📌 &lsquo;{post.category}&rsquo; 관련 인기 글
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((rPost) => (
                <button
                  key={rPost.id}
                  type="button"
                  onClick={() => onNavigate(`post-${rPost.id}`)}
                  className="group p-4 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between"
                >
                  <h4 className="text-[13.5px] font-bold text-[#111827] group-hover:text-[#E8745F] leading-snug line-clamp-2 break-keep mb-3 transition-colors">
                    {rPost.title}
                  </h4>
                  <span className="text-[11px] text-[#94A3B8] tabular-nums">
                    {formatPostDateTime(rPost.date, rPost.id).split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. STICKY RIGHT COLUMN WITH DYNAMIC TABLE OF CONTENTS (col-span-4)       */}
      {/* ========================================================================= */}
      <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
        {/* Dynamic Table of Contents Widget (Desktop) */}
        {tocItems.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs text-left" id="article-toc-card">
            {/* Header & Reading Progress */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-[#E8745F]" />
                <h3 className="text-[14.5px] font-bold text-[#111827]">
                  본문 목차
                </h3>
              </div>
              <span className="text-[11.5px] font-bold text-[#E8745F] bg-[#EEF0FB] px-2 py-0.5 rounded-full border border-[#FFD2BD]">
                {readingProgress}% 읽음
              </span>
            </div>

            {/* Reading Progress Mini Bar */}
            <div className="w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden my-3">
              <div
                className="bg-[#E8745F] h-full rounded-full transition-all duration-150"
                style={{ width: `${readingProgress}%` }}
              />
            </div>

            {/* TOC Items List */}
            <nav
              ref={tocNavRef}
              className="space-y-1 max-h-[380px] overflow-y-auto pr-1 hide-scrollbar scroll-smooth"
            >
              {tocItems.map((item, idx) => {
                const isActive = activeHeadingId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-heading-id={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className={`w-full text-left py-2 px-3 rounded-xl text-[13px] leading-snug transition-all flex items-start gap-2 cursor-pointer ${
                      isActive
                        ? "bg-[#1E1B2E] text-white font-bold shadow-xs translate-x-1 border-l-3 border-[#E8745F]"
                        : "text-[#475569] hover:bg-[#F8FAFC] hover:text-[#111827]"
                    } ${item.level === 3 ? "pl-5 text-[12.5px] opacity-90" : ""}`}
                  >
                    <span
                      className={`text-[11px] mt-0.5 shrink-0 ${
                        isActive ? "text-[#E8745F]" : "text-[#94A3B8]"
                      }`}
                    >
                      {item.level === 2 ? `${idx + 1}.` : "•"}
                    </span>
                    <span className="break-keep line-clamp-2">{item.text}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#F1F5F9] text-[12px] text-[#64748B]">
              <button
                type="button"
                onClick={scrollToTop}
                className="inline-flex items-center gap-1 hover:text-[#111827] font-semibold cursor-pointer py-1 px-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>맨 위로</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    showToast("글 주소가 복사되었습니다!", "success");
                  } catch {
                    showToast("복사에 실패했습니다.", "error");
                  }
                }}
                className="inline-flex items-center gap-1 hover:text-[#111827] font-semibold cursor-pointer py-1 px-2 rounded-lg hover:bg-[#F8FAFC] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>공유</span>
              </button>
            </div>
          </div>
        )}

        {/* Regular Sidebar Content (Calculators, Popular Posts, Categories) */}
        <Sidebar
          posts={allPosts}
          categories={categories}
          activeCategory={post.category}
          onNavigate={onNavigate}
          currentPostId={post.id}
        />
      </div>
    </div>
  );
}
