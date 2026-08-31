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
  Layers,
  Calendar,
  Globe,
  Heart,
  MessageSquare,
  Send,
  User,
  CornerDownRight,
  ShieldCheck,
  Mail
} from "lucide-react";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ReaderComment {
  id: string;
  author: string;
  date: string;
  content: string;
  reply?: {
    author: string;
    date: string;
    content: string;
  };
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
  onOpenSearchConsole?: (slug?: string, title?: string) => void;
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
  showToast,
  onOpenSearchConsole
}: GuideReaderProps) {
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [activeHeadingId, setActiveHeadingId] = useState<string>("");
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);
  const articleContentRef = useRef<HTMLDivElement>(null);
  const tocNavRef = useRef<HTMLElement>(null);
  const isUserClickingRef = useRef<boolean>(false);
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Heart / Reaction State with local persistence
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`virginroad_liked_${post.id}`) === "true";
    } catch {
      return false;
    }
  });

  const [likeCount, setLikeCount] = useState<number>(() => {
    // Stable pseudo-realistic initial count based on post id
    let base = 28;
    for (let i = 0; i < post.id.length; i++) {
      base += post.id.charCodeAt(i);
    }
    const seed = 12 + (base % 37);
    try {
      const stored = localStorage.getItem(`virginroad_likes_${post.id}`);
      return stored ? parseInt(stored, 10) : seed;
    } catch {
      return seed;
    }
  });

  const handleToggleLike = () => {
    const nextState = !isLiked;
    setIsLiked(nextState);
    const nextCount = nextState ? likeCount + 1 : Math.max(0, likeCount - 1);
    setLikeCount(nextCount);
    try {
      localStorage.setItem(`virginroad_liked_${post.id}`, String(nextState));
      localStorage.setItem(`virginroad_likes_${post.id}`, String(nextCount));
    } catch {}
    if (nextState) {
      showToast("이 글에 공감해 주셔서 감사합니다! ❤️", "success");
    }
  };

  // Reader Comments State
  const initialDefaultComments: ReaderComment[] = useMemo(() => [
    {
      id: "c1",
      author: "동탄예비신부",
      date: "2일 전",
      content: "실제 경험담 위주로 솔직하게 풀어주셔서 머리에 쏙쏙 들어오네요! 특히 놓치기 쉬운 특약 사항 꿀팁 덕분에 계약할 때 큰 도움 받았습니다. 감사합니다.",
      reply: {
        author: "박아람 (버진로드)",
        date: "1일 전",
        content: "도움이 되셨다니 정말 기쁩니다! 계약서 작성하실 때 끝까지 꼼꼼히 확인하시고, 행복한 신혼집 마련되시길 진심으로 응원합니다 :)"
      }
    },
    {
      id: "c2",
      author: "마포새댁",
      date: "5일 전",
      content: "은행 창구에서도 잘 안 알려주던 디테일한 차이점을 이렇게 깔끔하게 짚어주시니 속이 다 시원하네요. 북마크해 두고 정독 중입니다!",
      reply: {
        author: "박아람 (버진로드)",
        date: "4일 전",
        content: "감사합니다! 앞으로도 발품 팔아 건진 진짜 꿀팁들만 모아서 업데이트하겠습니다. 궁금한 점 있으시면 언제든 편하게 물어보세요!"
      }
    }
  ], []);

  const [comments, setComments] = useState<ReaderComment[]>(() => {
    try {
      const stored = localStorage.getItem(`virginroad_comments_${post.id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return initialDefaultComments;
  });

  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [newCommentText, setNewCommentText] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentAuthor.trim() || !newCommentText.trim()) {
      showToast("닉네임과 댓글 내용을 모두 입력해 주세요.", "error");
      return;
    }
    const newComment: ReaderComment = {
      id: `c_${Date.now()}`,
      author: newCommentAuthor.trim(),
      date: "방금 전",
      content: newCommentText.trim()
    };
    const updated = [newComment, ...comments];
    setComments(updated);
    try {
      localStorage.setItem(`virginroad_comments_${post.id}`, JSON.stringify(updated));
    } catch {}
    setNewCommentText("");
    showToast("소중한 의견과 질문이 등록되었습니다!", "success");
  };

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

          // Precise article-based reading progress calculation
          let progress = 0;
          if (articleContentRef.current) {
            const rect = articleContentRef.current.getBoundingClientRect();
            const articleTop = rect.top + scrollTop;
            const articleHeight = rect.height;
            const windowHeight = window.innerHeight;

            const startOffset = Math.max(0, articleTop - 120);
            const endOffset = articleTop + articleHeight - windowHeight * 0.7;
            const totalDistance = endOffset - startOffset;

            if (scrollTop <= startOffset) {
              progress = startOffset > 0 ? Math.min(10, Math.round((scrollTop / startOffset) * 10)) : 0;
            } else if (scrollTop >= endOffset || (scrollHeight > 0 && scrollTop >= scrollHeight - 80)) {
              progress = 100;
            } else if (totalDistance > 0) {
              const currentDistance = scrollTop - startOffset;
              progress = Math.min(100, Math.max(10, Math.round(10 + (currentDistance / totalDistance) * 90)));
            }
          } else if (scrollHeight > 0) {
            progress = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));
          }

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
      {/* TOP FIXED READING PROGRESS BAR                                            */}
      {/* ========================================================================= */}
      <div
        className="fixed top-0 left-0 right-0 h-[3.5px] bg-black/5 z-[100] pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="relative h-full bg-gradient-to-r from-[#E8745F] via-[#FF8A65] to-[#E8745F] transition-[width] duration-150 ease-out shadow-[0_1px_8px_rgba(232,116,95,0.5)]"
          style={{ width: `${readingProgress}%` }}
        >
          {readingProgress > 0 && readingProgress < 100 && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#E8745F]" />
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MAIN ARTICLE READING COLUMN (col-span-8)                               */}
      {/* ========================================================================= */}
      <div className="lg:col-span-8 bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xs">
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
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-[#F8FAFC] mb-8 border border-[#F1F5F9]">
          <img
            src={post.image || "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=1200"}
            alt={post.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/75 backdrop-blur-xs text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg shadow-sm border border-white/10">
            <Calendar className="w-3.5 h-3.5 text-[#FFB199]" />
            <span className="tabular-nums">{formatPostDateTime(post.date, post.id)}</span>
          </div>
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

        {/* Reader Reaction & Like Bar */}
        <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLike}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[14px] transition-all cursor-pointer shadow-xs ${
                isLiked
                  ? "bg-[#FFF1EE] text-[#E8745F] border-2 border-[#E8745F] scale-102"
                  : "bg-white text-[#475569] hover:text-[#E8745F] border border-[#E2E8F0] hover:border-[#CBD5E1]"
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-[#E8745F] text-[#E8745F]" : ""}`} />
              <span>공감해요</span>
              <span className="bg-[#F1F5F9] px-2 py-0.5 rounded-full text-[12px] tabular-nums font-semibold text-[#1E1B2E]">
                {likeCount}
              </span>
            </button>
            <span className="text-[12.5px] text-[#64748B]">
              {isLiked ? "응원해 주셔서 감사합니다!" : "이 글이 도움이 되셨다면 공감을 눌러주세요"}
            </span>
          </div>

          <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[12.5px] text-[#475569] font-semibold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>공유</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[12.5px] text-[#475569] font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄</span>
            </button>
          </div>
        </div>

        {/* Author Persona Signature Box */}
        <div className="mt-8 p-6 sm:p-7 bg-[#FFFDFB] border border-[#FED7AA]/60 rounded-2xl text-left space-y-4 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#1E1B2E] via-[#2A243E] to-[#E8745F] text-white flex items-center justify-center font-black text-[22px] shadow-sm shrink-0 border border-white">
              V
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[15.5px] font-bold text-[#111827]">에디터 박아람 (Virginroad)</span>
                <span className="text-[11px] font-extrabold bg-[#FFF1EE] text-[#E8745F] px-2 py-0.5 rounded-full border border-[#FFD2BD]">
                  실전 기록자
                </span>
              </div>
              <p className="text-[13.5px] text-[#475569] leading-relaxed break-keep">
                직접 계약서에 도장 찍고 발품 팔아 겪은 100% 실전 경험과 공식 정책 지침만을 정직하게 공유합니다. 포털에 넘쳐나는 복사-붙여넣기 글 대신, 신혼부부의 든든한 나침반이 되어 드리겠습니다.
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-[#FEE2E2] flex items-center justify-between text-[12.5px] text-[#64748B]">
            <span className="italic">"궁금한 점이나 추가로 다뤄주었으면 하는 주제가 있다면 아래 댓글로 편하게 남겨주세요."</span>
            <button
              type="button"
              onClick={() => onNavigate("about")}
              className="text-[#E8745F] hover:underline font-bold shrink-0 ml-2"
            >
              블로그 소개 보기 &rarr;
            </button>
          </div>
        </div>

        {/* Interactive Reader Comments & Discussion */}
        <div className="mt-10 pt-8 border-t border-[#F1F5F9] text-left">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#E8745F]" />
              <h3 className="text-[16.5px] font-bold text-[#111827]">
                독자 댓글 & 질문 <span className="text-[#E8745F] text-[14px]">({comments.length})</span>
              </h3>
            </div>
            <span className="text-[12px] text-[#94A3B8]">
              클린하고 따뜻한 소통 공간입니다
            </span>
          </div>

          {/* Comment Input Form */}
          <form onSubmit={handleAddComment} className="mb-6 p-4 sm:p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="닉네임 (예: 마포새댁)"
                value={newCommentAuthor}
                onChange={(e) => setNewCommentAuthor(e.target.value)}
                maxLength={20}
                className="w-48 px-3 py-1.5 text-[13px] bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:border-[#E8745F] focus:ring-1 focus:ring-[#E8745F]"
              />
              <span className="text-[11.5px] text-[#94A3B8]">로그인 없이 바로 작성 가능합니다</span>
            </div>
            <textarea
              rows={3}
              placeholder="글을 읽고 궁금한 점이나 의견을 남겨주시면 에디터가 직접 답변해 드립니다."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="w-full p-3 text-[13.5px] leading-relaxed bg-white border border-[#CBD5E1] rounded-xl focus:outline-none focus:border-[#E8745F] focus:ring-1 focus:ring-[#E8745F] resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E1B2E] hover:bg-[#E8745F] text-white text-[13px] font-bold rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>댓글 등록</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-white border border-[#E2E8F0] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <div className="flex items-center gap-2 font-bold text-[#1E1B2E]">
                    <div className="w-6 h-6 rounded-full bg-[#F1F5F9] text-[#475569] flex items-center justify-center text-[11px] font-extrabold">
                      {comment.author.charAt(0)}
                    </div>
                    <span>{comment.author}</span>
                  </div>
                  <span className="text-[#94A3B8] text-[11.5px]">{comment.date}</span>
                </div>
                <p className="text-[13.5px] text-[#334155] leading-relaxed break-keep pl-8">
                  {comment.content}
                </p>

                {/* Author Reply (if present) */}
                {comment.reply && (
                  <div className="mt-3 ml-6 pl-4 border-l-2 border-[#E8745F] bg-[#FFF8F6] p-3 rounded-r-xl space-y-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-[#E8745F]">
                        {comment.reply.author}
                      </span>
                      <span className="text-[11px] text-[#94A3B8]">{comment.reply.date}</span>
                    </div>
                    <p className="text-[13px] text-[#475569] leading-relaxed break-keep">
                      {comment.reply.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

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
                    {formatPostDateTime(rPost.date, rPost.id)}
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

              {onOpenSearchConsole && (
                <button
                  type="button"
                  onClick={() => {
                    const slug = post.id;
                    onOpenSearchConsole(slug, post.title);
                  }}
                  className="inline-flex items-center gap-1 text-[#E8745F] hover:text-[#D6634F] font-semibold cursor-pointer py-1 px-2 rounded-lg hover:bg-[#FFF5F3] transition-colors"
                  title="이 글을 구글 서치 콘솔에 즉시 색인 요청"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>색인 요청</span>
                </button>
              )}

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
