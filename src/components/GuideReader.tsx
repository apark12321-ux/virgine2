import React, { useState, useMemo } from "react";
import { Post } from "../types";
import { formatPostDateTime } from "../lib/utils";
import { getApplianceGroup } from "../data/applianceGroups";
import { AdSenseUnit, ADSENSE_ENABLED } from "./AdSenseUnit";
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  List,
  Copy,
  Zap,
  Wrench,
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

  const processedHtml = rawHtml.replace(
    headingRegex,
    (match, tag, existingAttrs, innerContent) => {
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
    }
  );

  return { processedHtml, tocItems };
}

export function GuideReader({
  post,
  allPosts,
  prevPost,
  nextPost,
  relatedPosts,
  onNavigate,
  showToast,
}: GuideReaderProps) {
  const [isTocOpen, setIsTocOpen] = useState(true);
  const formattedDate = formatPostDateTime(post.date, post.id);
  const group = getApplianceGroup(post.id, post.title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("매뉴얼 링크가 클립보드에 복사되었습니다.", "success");
    } catch {
      showToast("링크 복사에 실패했습니다.", "error");
    }
  };

  const { processedHtml, tocItems } = useMemo(
    () => processHeadings(post.content),
    [post.content]
  );

  const sameGroupPosts = useMemo(() => {
    const inGroup = allPosts.filter(
      (p) => p.id !== post.id && getApplianceGroup(p.id, p.title) === group
    );
    if (inGroup.length >= 4) return inGroup.slice(0, 5);
    const fallback = relatedPosts.filter((p) => p.id !== post.id);
    const merged = [...inGroup];
    for (const p of fallback) {
      if (!merged.some((m) => m.id === p.id)) merged.push(p);
      if (merged.length >= 5) break;
    }
    return merged;
  }, [allPosts, post.id, group, relatedPosts]);

  return (
    <article className="w-full bg-white border border-[#E2E8F0] rounded-xl p-5 sm:p-8 lg:p-10 font-sans text-left">
      {/* 1. Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="text-[12.5px] text-[#64748B] mb-4 flex items-center gap-1.5 flex-wrap"
      >
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="hover:text-[#0F766E] transition-colors cursor-pointer"
        >
          홈
        </button>
        <span className="text-[#CBD5E1]">/</span>
        <button
          type="button"
          onClick={() => onNavigate("category-신혼가전")}
          className="hover:text-[#0F766E] font-medium transition-colors cursor-pointer"
        >
          가전 관리 매뉴얼
        </button>
        <span className="text-[#CBD5E1]">/</span>
        <span className="text-[#475569]">{group}</span>
      </nav>

      {/* 2. Article Header */}
      <header className="pb-6 border-b border-[#E2E8F0] mb-6">
        <p className="text-[12.5px] font-bold text-[#0F766E] mb-2">{group} 기술 매뉴얼</p>

        <h1 className="text-[22px] sm:text-[28px] font-extrabold text-[#0F172A] leading-snug tracking-tight break-keep mb-4">
          {post.title}
        </h1>

        <div className="flex items-center justify-between flex-wrap gap-3 text-[12.5px] text-[#64748B]">
          <div className="flex items-center gap-2 flex-wrap tabular-nums">
            <span className="font-semibold text-[#0F172A]">버진로드 기술편집팀</span>
            <span className="text-[#CBD5E1]">·</span>
            <time dateTime={post.date}>{formattedDate}</time>
            <span className="text-[#CBD5E1]">·</span>
            <span>{post.readTime || "8분"} 읽기</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-[12px] text-[#475569] hover:text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>URL 복사</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-2.5 py-1 text-[12px] text-[#475569] hover:text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Table of Contents */}
      {tocItems.length > 0 && (
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 mb-8 text-left">
          <button
            type="button"
            className="w-full flex items-center justify-between cursor-pointer"
            onClick={() => setIsTocOpen(!isTocOpen)}
            aria-expanded={isTocOpen}
          >
            <div className="flex items-center gap-2 font-bold text-[14px] text-[#0F172A]">
              <List className="w-4 h-4 text-[#0F766E]" />
              <span>목차</span>
            </div>
            <span className="text-[12px] text-[#64748B]">
              {isTocOpen ? "접기" : "열기"}
            </span>
          </button>

          {isTocOpen && (
            <ol className="mt-3.5 pt-3.5 border-t border-[#E2E8F0] space-y-2 text-[13.5px]">
              {tocItems.map((item, idx) => (
                <li
                  key={item.id}
                  className={
                    item.level === 3
                      ? "pl-4 text-[13px] text-[#475569]"
                      : "font-semibold text-[#0F172A]"
                  }
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
                    className="hover:text-[#0F766E] transition-colors"
                  >
                    <span className="text-[#0F766E] mr-1.5 tabular-nums">{idx + 1}.</span>
                    <span>{item.text}</span>
                  </a>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {ADSENSE_ENABLED && (
        <div className="my-6">
          <AdSenseUnit slot="article-top-01" label="광고 / Sponsored" format="fluid" />
        </div>
      )}

      {/* 4. Article Body */}
      <div
        className="article-body font-sans text-[16px] leading-[1.85] text-[#1E293B] space-y-5 break-keep"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />

      {ADSENSE_ENABLED && (
        <div className="my-8">
          <AdSenseUnit slot="article-mid-01" label="광고 / Sponsored" format="fluid" />
        </div>
      )}

      {/* 5. Linked Interactive Tools CTA */}
      <div className="my-8 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
        <p className="text-[13px] font-bold text-[#0F766E] mb-1">매뉴얼 연계 자가 진단 도구</p>
        <p className="text-[14.5px] font-bold text-[#0F172A] mb-3 break-keep">
          이 가전의 월간 예상 전기요금과 다음 필터 세척 D-Day를 바로 확인해 보세요
        </p>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate("tool-power-cost")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>전기요금 누진제 계산기</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("tool-filter-cycle")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] text-[13px] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>필터 교체 주기 진단기</span>
          </button>
        </div>
      </div>

      {/* 6. Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div className="pt-6 pb-5 border-t border-[#E2E8F0] flex flex-wrap gap-x-3 gap-y-1.5 items-center text-[13px] text-[#64748B]">
          <span className="font-bold text-[#334155]">관련 키워드</span>
          {post.hashtags.map((tag) => (
            <span key={tag} className="text-[#475569]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 7. Editorial Integrity Box (100% Appliance Technical Standards) */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 my-6 text-left">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h4 className="font-bold text-[14px] text-[#0F172A]">버진로드 생활가전 기술편집팀</h4>
          <button
            type="button"
            onClick={() => onNavigate("policy")}
            className="text-[12px] font-semibold text-[#0F766E] hover:underline cursor-pointer"
          >
            검증 기준 보기
          </button>
        </div>
        <p className="text-[13px] leading-relaxed text-[#475569] break-keep mb-2">
          본 매뉴얼은 제조사 공식 사용설명서, 한국소비자원 가전 관리 권고 및 한국전기안전공사 안전 수칙을 대조하여 작성되었습니다. 모델별 세부 구조나 분해 절차가 다를 수 있으므로, 전원 차단 및 분해 전 해당 제품의 공식 서비스 가이드를 함께 확인하시기 바랍니다.
        </p>
        <div className="text-[12.5px] text-[#64748B]">
          오류 정정 제보:{" "}
          <a href="mailto:apark12321@gmail.com" className="text-[#0F766E] underline font-mono">
            apark12321@gmail.com
          </a>
        </div>
      </div>

      {/* 8. Related Manuals in Same Appliance Group */}
      <div className="border border-[#E2E8F0] rounded-xl overflow-hidden my-7">
        <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] font-bold text-[13.5px] text-[#0F172A] flex items-center justify-between">
          <span>{group} 분야의 다른 관리 매뉴얼</span>
          <button
            type="button"
            onClick={() => onNavigate("category-신혼가전")}
            className="text-[12px] text-[#64748B] hover:text-[#0F766E] font-medium cursor-pointer"
          >
            전체보기 &rarr;
          </button>
        </div>
        <ul className="divide-y divide-[#F1F5F9] text-[13.5px]">
          {sameGroupPosts.map((cp) => (
            <li
              key={cp.id}
              onClick={() => onNavigate(`post-${cp.id}`)}
              className="px-4 py-3 flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer transition-colors text-[#334155]"
            >
              <span className="truncate pr-4 hover:text-[#0F766E]">{cp.title}</span>
              <span className="text-[12px] text-[#94A3B8] shrink-0 tabular-nums">
                {formatPostDateTime(cp.date, cp.id)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 9. Prev / Next Manual Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7 border-t border-[#E2E8F0] pt-4 text-[13px]">
        <div>
          {prevPost ? (
            <button
              type="button"
              onClick={() => onNavigate(`post-${prevPost.id}`)}
              className="w-full text-left p-2.5 hover:bg-[#F8FAFC] rounded-lg transition-colors group cursor-pointer"
            >
              <div className="text-[11.5px] text-[#64748B] flex items-center gap-1 mb-1">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>이전 매뉴얼</span>
              </div>
              <p className="text-[#0F172A] group-hover:text-[#0F766E] font-medium line-clamp-1 transition-colors">
                {prevPost.title}
              </p>
            </button>
          ) : (
            <div className="p-2.5 text-[#94A3B8] text-xs">이전 매뉴얼이 없습니다.</div>
          )}
        </div>

        <div className="border-t sm:border-t-0 sm:border-l border-[#E2E8F0] sm:pl-3">
          {nextPost ? (
            <button
              type="button"
              onClick={() => onNavigate(`post-${nextPost.id}`)}
              className="w-full text-right p-2.5 hover:bg-[#F8FAFC] rounded-lg transition-colors group cursor-pointer"
            >
              <div className="text-[11.5px] text-[#64748B] flex items-center justify-end gap-1 mb-1">
                <span>다음 매뉴얼</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
              <p className="text-[#0F172A] group-hover:text-[#0F766E] font-medium line-clamp-1 transition-colors">
                {nextPost.title}
              </p>
            </button>
          ) : (
            <div className="p-2.5 text-[#94A3B8] text-xs text-right">다음 매뉴얼이 없습니다.</div>
          )}
        </div>
      </div>

      {ADSENSE_ENABLED && (
        <div className="my-6">
          <AdSenseUnit slot="article-bottom-01" label="광고 / Sponsored" format="fluid" />
        </div>
      )}
    </article>
  );
}
