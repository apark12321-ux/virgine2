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
  MessageSquare,
  Send,
  User,
  CornerDownRight,
  Copy,
  Calendar,
  Eye,
  FolderOpen
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

  // Reader Comments (Loaded from localStorage, no fake mock comments)
  const [comments, setComments] = useState<ReaderComment[]>(() => {
    try {
      const stored = localStorage.getItem(`virginroad_comments_${post.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newContent.trim()) {
      showToast("닉네임과 댓글 내용을 모두 입력해주세요.", "error");
      return;
    }
    const today = new Date().toISOString().split("T")[0].replace(/-/g, ".");
    const newComment: ReaderComment = {
      id: `c_${Date.now()}`,
      author: newAuthor.trim(),
      date: today,
      content: newContent.trim()
    };
    const updated = [...comments, newComment];
    setComments(updated);
    try {
      localStorage.setItem(`virginroad_comments_${post.id}`, JSON.stringify(updated));
    } catch {}
    setNewAuthor("");
    setNewContent("");
    showToast("댓글이 성공적으로 등록되었습니다.", "success");
  };

  return (
    <div className="w-full bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-10 lg:p-12 shadow-2xs font-sans text-left">
      {/* 1. Breadcrumb (홈 > 카테고리 > 포스트 제목) */}
      <nav aria-label="Breadcrumb" className="text-[12.5px] text-[#6b7280] mb-4 flex items-center gap-1.5 flex-wrap">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="hover:text-rose-600 transition-colors cursor-pointer"
        >
          홈
        </button>
        <span className="text-gray-300">&gt;</span>
        <button
          type="button"
          onClick={() => onNavigate(`category-${post.category}`)}
          className="hover:text-rose-600 font-medium transition-colors cursor-pointer"
        >
          {post.category}
        </button>
        <span className="text-gray-300">&gt;</span>
        <span className="text-gray-400 truncate max-w-[280px] sm:max-w-md">{post.title}</span>
      </nav>

      {/* 2. Article Header (Classic Korean Blog Style) */}
      <header className="pb-6 border-b border-[#e5e7eb] mb-8">
        <div className="mb-2.5">
          <button
            type="button"
            onClick={() => onNavigate(`category-${post.category}`)}
            className="text-[13px] font-bold text-rose-600 hover:underline cursor-pointer"
          >
            [{post.category}]
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#111827] leading-[1.35] tracking-tight break-keep mb-4">
          {post.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-3 text-[13px] text-[#6b7280] pt-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-[#111827]">버진로드</span>
            <span className="text-gray-300">·</span>
            <span>{formattedDate}</span>
            {comments.length > 0 && (
              <>
                <span className="text-gray-300">·</span>
                <span>댓글 {comments.length}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-[12px] text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>URL 복사</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1 text-[12px] text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded transition-colors flex items-center gap-1 cursor-pointer"
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

      {/* 6. Empathy / Like Heart Button (Classic Tistory / Naver "공감" Button) */}
      <div className="py-8 text-center border-t border-b border-[#e5e7eb] my-8 bg-[#fafafa] rounded-lg">
        <p className="text-[13.5px] text-gray-600 mb-3">
          이 글이 도움이 되셨다면 <strong className="text-gray-900">공감(♥)</strong>을 눌러주세요!
        </p>
        <button
          type="button"
          onClick={handleToggleLike}
          className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-[14px] transition-all cursor-pointer shadow-xs ${
            isLiked
              ? "bg-rose-600 text-white hover:bg-rose-700 scale-103"
              : "bg-white text-gray-700 hover:text-rose-600 border border-gray-300 hover:border-rose-300"
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? "fill-white" : "text-rose-500"}`} />
          <span>공감</span>
          {likeCount > 0 && <span className="ml-0.5 text-xs font-semibold">{likeCount}</span>}
        </button>
      </div>

      {/* 7. Author Profile Card (Classic Tistory Author Box) */}
      <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-5 my-8 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
          V
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-[15px] text-[#111827]">버진로드 (Virginroad)</h4>
            <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-medium">
              에디터
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-[#4b5563] break-keep mb-2">
            2026년 기준 정부 최신 공시 및 실무 심사 기준을 바탕으로 직접 검증한 신혼부부 주거·금융·가전 백서를 연재하고 있습니다.
          </p>
          <div className="text-[12px] text-gray-500">
            문의: <a href="mailto:apark12321@gmail.com" className="text-rose-600 hover:underline">apark12321@gmail.com</a>
          </div>
        </div>
      </div>

      {/* 8. Signature Tistory: Other Posts in this Category (카테고리의 다른 글) */}
      <div className="border border-[#e5e7eb] rounded-lg overflow-hidden my-8">
        <div className="bg-[#f3f4f6] px-4 py-2.5 border-b border-[#e5e7eb] font-bold text-[13.5px] text-[#111827] flex items-center justify-between">
          <span>&lsquo;{post.category}&rsquo; 카테고리의 다른 글</span>
          <button
            type="button"
            onClick={() => onNavigate(`category-${post.category}`)}
            className="text-[12px] text-gray-500 hover:text-rose-600 font-normal cursor-pointer"
          >
            전체보기 &rarr;
          </button>
        </div>
        <ul className="divide-y divide-gray-100 text-[13.5px]">
          {categoryPosts.map((cp) => {
            const isCurrent = cp.id === post.id;
            return (
              <li
                key={cp.id}
                onClick={() => onNavigate(`post-${cp.id}`)}
                className={`px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${
                  isCurrent ? "bg-rose-50/50 font-bold text-rose-700" : "text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-4">
                  <span className="text-xs text-gray-400">·</span>
                  <span className="truncate">{cp.title}</span>
                  {isCurrent && (
                    <span className="text-[11px] bg-rose-600 text-white px-1.5 py-0.2 rounded shrink-0">
                      현재글
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400 shrink-0 tabular-nums">
                  {formatPostDateTime(cp.date, cp.id)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 9. Previous / Next Post Navigation (이전글 / 다음글) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-8 border-t border-b border-[#e5e7eb] py-4 text-[13.5px]">
        <div>
          {prevPost ? (
            <button
              type="button"
              onClick={() => onNavigate(`post-${prevPost.id}`)}
              className="w-full text-left p-3 hover:bg-gray-50 rounded transition-colors group cursor-pointer"
            >
              <div className="text-[11.5px] text-gray-400 flex items-center gap-1 mb-1">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>이전 글</span>
              </div>
              <p className="text-gray-800 group-hover:text-rose-600 font-medium line-clamp-1 transition-colors">
                {prevPost.title}
              </p>
            </button>
          ) : (
            <div className="p-3 text-gray-400 text-xs">이전 글이 없습니다.</div>
          )}
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-3">
          {nextPost ? (
            <button
              type="button"
              onClick={() => onNavigate(`post-${nextPost.id}`)}
              className="w-full text-right p-3 hover:bg-gray-50 rounded transition-colors group cursor-pointer"
            >
              <div className="text-[11.5px] text-gray-400 flex items-center justify-end gap-1 mb-1">
                <span>다음 글</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-gray-800 group-hover:text-rose-600 font-medium line-clamp-1 transition-colors">
                {nextPost.title}
              </p>
            </button>
          ) : (
            <div className="p-3 text-gray-400 text-xs text-right">다음 글이 없습니다.</div>
          )}
        </div>
      </div>

      {/* Bottom In-Article AdSense Banner */}
      <div className="my-6">
        <AdSenseUnit slot="article-bottom-01" label="광고 / Sponsored" format="fluid" />
      </div>

      {/* 10. Comments Section (댓글 영역) */}
      <section className="pt-6 border-t border-[#e5e7eb]" id="comments">
        <h3 className="text-[17px] font-bold text-[#111827] mb-6 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-rose-600" />
          <span>댓글 ({comments.length})</span>
        </h3>

        {/* Existing Comments List */}
        <div className="space-y-4 mb-8">
          {comments.length === 0 ? (
            <div className="p-6 text-center text-[13px] text-gray-500 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
              등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[13.5px] text-[#111827]">{comment.author}</span>
                  <span className="text-[11.5px] text-gray-400">{comment.date}</span>
                </div>
                <p className="text-[13.5px] text-gray-700 leading-relaxed break-keep">{comment.content}</p>

                {/* Author Reply */}
                {comment.reply && (
                  <div className="mt-3.5 pt-3.5 border-t border-gray-200 pl-4 border-l-2 border-rose-500 bg-white p-3 rounded">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-[12.5px] text-rose-600 flex items-center gap-1">
                        <CornerDownRight className="w-3.5 h-3.5" />
                        <span>{comment.reply.author}</span>
                      </span>
                      <span className="text-[11px] text-gray-400">{comment.reply.date}</span>
                    </div>
                    <p className="text-[13px] text-gray-600 leading-relaxed break-keep">
                      {comment.reply.content}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Comment Input Form */}
        <form onSubmit={handleAddComment} className="bg-[#fafafa] border border-[#e5e7eb] rounded-lg p-4 sm:p-5">
          <h4 className="font-bold text-[14px] text-[#111827] mb-3">댓글 작성</h4>
          <div className="mb-3">
            <input
              type="text"
              placeholder="작성자 닉네임"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="w-full sm:w-[200px] h-9 px-3 bg-white border border-[#d1d5db] focus:border-rose-600 text-[13px] rounded outline-none"
            />
          </div>
          <div className="mb-3">
            <textarea
              placeholder="건전한 인터넷 문화를 위해 따뜻한 댓글을 남겨주세요."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              className="w-full p-3 bg-white border border-[#d1d5db] focus:border-rose-600 text-[13px] rounded outline-none resize-y"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[13px] rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>댓글 등록</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
