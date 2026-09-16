import React, { useState, useEffect, useMemo, useRef } from "react";
import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { AdSenseUnit } from "./AdSenseUnit";
import {
  Share2,
  Printer,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  List,
  Heart,
  Copy,
  Calendar,
  Eye,
  FolderOpen,
  ThumbsUp,
  ThumbsDown,
  Info,
  HelpCircle
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

function processHeadings(rawHtml: string): {
  processedHtml: string;
  tocItems: TocItem[];
} {
  if (!rawHtml) return { processedHtml: "", tocItems: [] };

  const tocItems: TocItem[] = [];
  let index = 0;

  const headingRegex = /<(h[23])(\s+[^>]*)?>([\s\S]*?)<\/\1>/gi;

  const processedHtml = rawHtml.replace(headingRegex, (match, tag, existingAttrs, innerContent) => {
    const level = tag.toLowerCase() === "h2" ? 2 : 3;
    const cleanText = innerContent.replace(/<[^>]+>/g, "").trim();
    if (!cleanText) return match;

    const safeSlug = cleanText
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9가-힣]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const id = `toc-${index++}-${safeSlug || "section"}`;
    tocItems.push({ id, text: cleanText, level });

    const sanitizedAttrs = (existingAttrs || "").replace(/\bid="[^"]*"/gi, "").trim();
    return `<${tag} id="${id}" class="scroll-mt-20 ${sanitizedAttrs}">${innerContent}</${tag}>`;
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
  const [isTocOpen, setIsTocOpen] = useState(true);
  const formattedDate = formatPostDateTime(post.date, post.id);

  // Benchmark: ko.phongnhaexplorer.com reader feedback system
  const [feedbackGiven, setFeedbackGiven] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`virginroad_feedback_${post.id}`);
    } catch {
      return null;
    }
  });
  const [feedbackType, setFeedbackType] = useState<"useful" | "not-useful" | "improve" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string>("");
  const [feedbackNote, setFeedbackNote] = useState<string>("");

  const handleSelectFeedbackType = (type: "useful" | "not-useful" | "improve") => {
    setFeedbackType(type);
    if (type === "useful") {
      try {
        localStorage.setItem(`virginroad_feedback_${post.id}`, JSON.stringify({ type: "useful", date: new Date().toISOString() }));
      } catch {}
      setFeedbackGiven("useful");
      showToast("의견을 주셔서 감사합니다! 가이드 품질 개선에 큰 힘이 됩니다.", "success");
    }
  };

  const handleSubmitDetailedFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackReason && !feedbackNote.trim()) {
      showToast("이유를 선택하시거나 의견을 입력해주세요.", "error");
      return;
    }
    try {
      localStorage.setItem(
        `virginroad_feedback_${post.id}`,
        JSON.stringify({
          type: feedbackType,
          reason: feedbackReason,
          note: feedbackNote.trim(),
          date: new Date().toISOString()
        })
      );
    } catch {}
    setFeedbackGiven(feedbackType);
    showToast("소중한 의견이 등록되었습니다. 가이드 개선에 적극 반영하겠습니다!", "success");
  };

  // Heart / Reaction State
  const [isLiked, setIsLiked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`virginroad_liked_${post.id}`) === "true";
    } catch {
      return false;
    }
  });

  const [likeCount, setLikeCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`virginroad_likes_${post.id}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
      try {
        localStorage.removeItem(`virginroad_liked_${post.id}`);
        localStorage.setItem(`virginroad_likes_${post.id}`, String(Math.max(0, likeCount - 1)));
      } catch {}
      showToast("공감이 취소되었습니다.", "info");
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      try {
        localStorage.setItem(`virginroad_liked_${post.id}`, "true");
        localStorage.setItem(`virginroad_likes_${post.id}`, String(likeCount + 1));
      } catch {}
      showToast("이 포스팅을 공감하셨습니다. 감사합니다!", "success");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("포스팅 링크가 클립보드에 복사되었습니다.", "success");
    } catch {
      showToast("링크 복사에 실패했습니다.", "error");
    }
  };

  // Process Headings for TOC
  const { processedHtml, tocItems } = useMemo(() => {
    return processHeadings(post.content);
  }, [post.content]);

  // Signature Tistory: Other posts in same category (카테고리의 다른 글)
  const categoryPosts = useMemo(() => {
    return allPosts.filter((p) => p.category === post.category).slice(0, 5);
  }, [allPosts, post.category]);

  return (
    <div className="w-full bg-white border border-[#e2e8f0] rounded p-5 sm:p-8 lg:p-10 shadow-2xs font-sans text-left">
      {/* 1. Breadcrumb (홈 > 카테고리 > 질문 제목) */}
      <nav aria-label="Breadcrumb" className="text-[12.5px] text-[#64748b] mb-3 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="hover:text-[#0f766e] transition-colors cursor-pointer"
        >
          홈
        </button>
        <span className="text-[#cbd5e1]">&gt;</span>
        <button
          type="button"
          onClick={() => onNavigate(`category-${post.category}`)}
          className="hover:text-[#0f766e] font-medium transition-colors cursor-pointer"
        >
          {post.category}
        </button>
        <span className="text-[#cbd5e1]">&gt;</span>
        <span className="text-[#94a3b8] truncate max-w-[280px] sm:max-w-md">{post.title}</span>
      </nav>

      {/* 2. Article Header (ko.phongnhaexplorer.com Q&A Style) */}
      <header className="pb-5 border-b border-[#e2e8f0] mb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="inline-block px-2 py-0.5 text-[11px] font-bold bg-[#f0fdfa] text-[#0f766e] border border-[#ccfbf1] rounded">
            답변 완료
          </span>
          <button
            type="button"
            onClick={() => onNavigate(`category-${post.category}`)}
            className="text-[12.5px] font-semibold text-[#0284c7] hover:underline cursor-pointer"
          >
            {post.category}
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-[28px] font-black text-[#0f172a] leading-snug tracking-tight break-keep mb-3.5">
          {post.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-3 text-[12.5px] text-[#64748b] pt-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-semibold text-[#0f172a]">버진로드 편집부</span>
            <span className="text-[#cbd5e1]">·</span>
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-[12px] text-[#475569] hover:text-[#0f172a] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>URL 복사</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1 text-[12px] text-[#475569] hover:text-[#0f172a] bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1] rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Table of Contents (Classic Tistory TOC Plugin Style) */}
      {tocItems.length > 0 && (
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 mb-8 text-left">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsTocOpen(!isTocOpen)}>
            <div className="flex items-center gap-2 font-bold text-[14px] text-[#111827]">
              <List className="w-4 h-4 text-rose-600" />
              <span>목차 (Table of Contents)</span>
            </div>
            <span className="text-[12px] text-gray-500 hover:underline">
              {isTocOpen ? "접기 ▲" : "열기 ▼"}
            </span>
          </div>

          {isTocOpen && (
            <ol className="mt-3.5 pt-3.5 border-t border-gray-200 space-y-2 text-[13.5px]">
              {tocItems.map((item, idx) => (
                <li
                  key={item.id}
                  className={`${item.level === 3 ? "pl-4 text-[13px] text-gray-600" : "font-medium text-gray-800"}`}
                >
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const target = document.getElementById(item.id);
                      if (target) {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                    className="hover:text-rose-600 transition-colors"
                  >
                    <span className="text-rose-600 mr-1.5">{idx + 1}.</span>
                    <span>{item.text}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* Top In-Article AdSense Banner */}
      <div className="my-6">
        <AdSenseUnit slot="article-top-01" label="광고 / Sponsored" format="fluid" />
      </div>

      {/* 4. Article Body (Tistory / Naver SmartEditor ONE Typography) */}
      <div
        className="article-body font-sans text-[16.5px] leading-[1.85] text-[#2c3e50] space-y-6 break-keep"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      {/* Mid In-Article AdSense Banner */}
      <div className="my-8">
        <AdSenseUnit slot="article-mid-01" label="광고 / Sponsored" format="fluid" />
      </div>

      {/* 5. Tag Cloud / Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="pt-8 pb-6 border-t border-[#e5e7eb] flex flex-wrap gap-2 items-center">
          <span className="text-[13px] font-bold text-gray-500 mr-1">태그:</span>
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className="text-[12.5px] text-gray-700 bg-gray-100 hover:bg-rose-50 hover:text-rose-600 px-2.5 py-1 rounded transition-colors"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 6. Benchmark: ko.phongnhaexplorer.com Feedback Box (답변에 대한 의견) */}
      <div className="my-8 p-5 sm:p-6 bg-[#f8fafc] border border-[#cbd5e1] rounded text-left">
        <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0f172a] mb-1.5 flex items-center gap-2">
          <span>답변(가이드)에 대한 의견:</span>
        </h3>
        <p className="text-[13px] text-[#475569] mb-4 leading-relaxed">
          의견을 주셔서 감사합니다! 여러분의 의견은 향후 가이드 품질을 개선하는 데 매우 중요합니다.
        </p>

        {feedbackGiven ? (
          <div className="p-3 bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f766e] text-[13px] font-medium rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              소중한 의견이 정상적으로 등록되었습니다. 감사합니다!
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 3 Buttons */}
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectFeedbackType("useful")}
                className={`px-3.5 py-2 text-[13px] font-semibold rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  feedbackType === "useful"
                    ? "bg-[#0f766e] text-white border-[#0f766e]"
                    : "bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>유용함</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeedbackType("not-useful")}
                className={`px-3.5 py-2 text-[13px] font-semibold rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  feedbackType === "not-useful"
                    ? "bg-[#e11d48] text-white border-[#e11d48]"
                    : "bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>유용하지 않음</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectFeedbackType("improve")}
                className={`px-3.5 py-2 text-[13px] font-semibold rounded border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  feedbackType === "improve"
                    ? "bg-[#0284c7] text-white border-[#0284c7]"
                    : "bg-white text-[#334155] border-[#cbd5e1] hover:bg-[#f1f5f9]"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>개선 필요</span>
              </button>
            </div>

            {/* Additional Options when "not-useful" or "improve" is selected */}
            {(feedbackType === "not-useful" || feedbackType === "improve") && (
              <form onSubmit={handleSubmitDetailedFeedback} className="mt-3 pt-3 border-t border-[#e2e8f0] space-y-3">
                <p className="text-[12.5px] font-semibold text-[#0f172a]">이유를 알려주세요:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12.5px] text-[#475569]">
                  {[
                    "정보 부족",
                    "정확하지 않음",
                    "이해하기 어려움",
                    "관련 없음"
                  ].map((reason) => (
                    <label key={reason} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="feedback-reason"
                        value={reason}
                        checked={feedbackReason === reason}
                        onChange={(e) => setFeedbackReason(e.target.value)}
                        className="text-[#0f766e] focus:ring-[#0f766e]"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    placeholder="추가 의견이 있으시면 적어주세요 (선택 사항)"
                    className="w-full p-2.5 bg-white border border-[#cbd5e1] focus:border-[#0f766e] text-[12.5px] rounded outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#0f766e] hover:bg-[#115e59] text-white text-[12.5px] font-bold rounded transition-colors cursor-pointer"
                >
                  의견 제출하기
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 7. Author / Editorial Integrity Box */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded p-4 my-6 flex items-start gap-3.5 text-left">
        <div className="w-10 h-10 rounded bg-[#0f766e] text-white flex items-center justify-center font-bold text-sm shrink-0">
          V
        </div>
        <div className="flex-1 text-[12.5px]">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-[14px] text-[#0f172a]">버진로드 편집부</h4>
            <span className="text-[10.5px] bg-[#f0fdfa] text-[#0f766e] px-1.5 py-0.2 rounded border border-[#ccfbf1] font-semibold">
              검증 완료
            </span>
          </div>
          <p className="leading-relaxed text-[#475569] break-keep mb-1.5">
            본 가이드는 공공 고시 자료(국토부, 주택도시기금, 청약홈)를 대조·검토하여 정기적으로 갱신됩니다. 금융기관 및 심사 기관의 세부 내규에 따라 조건이 상이할 수 있으므로 최종 신청 전 공식 창구를 확인하시기 바랍니다.
          </p>
          <div className="text-[#64748b]">
            편집부 문의: <a href="mailto:apark12321@gmail.com" className="text-[#0f766e] underline">apark12321@gmail.com</a>
          </div>
        </div>
      </div>

      {/* 8. Other Questions/Guides in this Category */}
      <div className="border border-[#e2e8f0] rounded overflow-hidden my-7">
        <div className="bg-[#f8fafc] px-4 py-2.5 border-b border-[#e2e8f0] font-bold text-[13px] text-[#0f172a] flex items-center justify-between">
          <span>&lsquo;{post.category}&rsquo; 분야의 다른 질문 &amp; 가이드</span>
          <button
            type="button"
            onClick={() => onNavigate(`category-${post.category}`)}
            className="text-[12px] text-[#64748b] hover:text-[#0f766e] font-normal cursor-pointer"
          >
            전체보기 &rarr;
          </button>
        </div>
        <ul className="divide-y divide-gray-100 text-[13px]">
          {categoryPosts.map((cp) => {
            const isCurrent = cp.id === post.id;
            return (
              <li
                key={cp.id}
                onClick={() => onNavigate(`post-${cp.id}`)}
                className={`px-4 py-2.5 flex items-center justify-between hover:bg-[#f8fafc] cursor-pointer transition-colors ${
                  isCurrent ? "bg-[#f0fdfa] font-bold text-[#0f766e]" : "text-[#334155]"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className="text-xs text-[#94a3b8]">&bull;</span>
                  <span className="truncate">{cp.title}</span>
                  {isCurrent && (
                    <span className="text-[10.5px] bg-[#0f766e] text-white px-1.5 py-0.2 rounded shrink-0">
                      현재글
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#94a3b8] shrink-0 tabular-nums">
                  {formatPostDateTime(cp.date, cp.id)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 9. Previous / Next Post Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-7 border-t border-b border-[#e2e8f0] py-3 text-[13px]">
        <div>
          {prevPost ? (
            <button
              type="button"
              onClick={() => onNavigate(`post-${prevPost.id}`)}
              className="w-full text-left p-2.5 hover:bg-[#f8fafc] rounded transition-colors group cursor-pointer"
            >
              <div className="text-[11.5px] text-[#94a3b8] flex items-center gap-1 mb-1">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>이전 질문</span>
              </div>
              <p className="text-[#334155] group-hover:text-[#0f766e] font-medium line-clamp-1 transition-colors">
                {prevPost.title}
              </p>
            </button>
          ) : (
            <div className="p-2.5 text-[#94a3b8] text-xs">이전 질문이 없습니다.</div>
          )}
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-3">
          {nextPost ? (
            <button
              type="button"
              onClick={() => onNavigate(`post-${nextPost.id}`)}
              className="w-full text-right p-2.5 hover:bg-[#f8fafc] rounded transition-colors group cursor-pointer"
            >
              <div className="text-[11.5px] text-[#94a3b8] flex items-center justify-end gap-1 mb-1">
                <span>다음 질문</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[#334155] group-hover:text-[#0f766e] font-medium line-clamp-1 transition-colors">
                {nextPost.title}
              </p>
            </button>
          ) : (
            <div className="p-2.5 text-[#94a3b8] text-xs text-right">다음 질문이 없습니다.</div>
          )}
        </div>
      </div>

      {/* Bottom In-Article AdSense Banner */}
      <div className="my-6">
        <AdSenseUnit slot="article-bottom-01" label="광고 / Sponsored" format="fluid" />
      </div>
    </div>
  );
}
