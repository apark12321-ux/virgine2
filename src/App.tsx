import { useState, useMemo, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Sidebar } from "./components/Sidebar";
import { PostCard } from "./components/PostCard";
import { GuideReader } from "./components/GuideReader";
import { AdSenseUnit, ADSENSE_ENABLED } from "./components/AdSenseUnit";
import { PolicyHub } from "./components/PolicyHub";
import { AboutPage } from "./components/AboutPage";
import { ContactPage } from "./components/ContactPage";
import { AppliancePowerCalculator } from "./components/AppliancePowerCalculator";
import { FilterCycleTracker } from "./components/FilterCycleTracker";
import { SearchConsoleModal } from "./components/SearchConsoleModal";
import { MOCK_POSTS, CATEGORIES } from "./constants";
import { Post } from "./types";
import {
  APPLIANCE_GROUPS,
  ApplianceGroup,
  getApplianceGroup,
  isVerifiedApplianceManualId,
} from "./data/applianceGroups";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  LayoutList,
  LayoutGrid,
  Zap,
  Wrench,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "./lib/firebase";
import { handleFirestoreError, OperationType } from "./lib/views";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import {
  slugify,
  parsePostTimestamp,
  normalizeTitle,
  matchPostBySlugOrId,
  toIso8601,
  formatPostDateTime,
} from "./lib/utils";

type Page =
  | "home"
  | "about"
  | "contact"
  | "privacy"
  | "announcement"
  | "terms"
  | "policy"
  | "tool-power-cost"
  | "tool-filter-cycle"
  | "not-found"
  | `category-${string}`
  | `post-${string}`;

const SITE_URL = "https://virginroad.kr";
const SITE_NAME = "버진로드";
const DEFAULT_TITLE = "버진로드 - 신혼가전 및 생활가전 사용 관리 매뉴얼";
const DEFAULT_DESCRIPTION =
  "드럼세탁기, 히트펌프 건조기, 냉장고, 식기세척기, 시스템 에어컨, 로봇청소기 등 30종 생활가전의 공식 세척 주기, 고장 예방 매뉴얼과 전기요금·필터 교체 주기 진단 도구를 제공합니다.";

const POSTS_PER_PAGE = 10;

function pageFromUrl(): Page {
  if (typeof window === "undefined") return "home";
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/") return "home";
  if (path === "/about") return "about";
  if (path === "/contact") return "contact";
  if (path === "/privacy") return "privacy";
  if (path === "/announcement") return "announcement";
  if (path === "/terms") return "terms";
  if (path === "/policy") return "policy";
  if (path === "/tools/power-cost") return "tool-power-cost";
  if (path === "/tools/filter-cycle") return "tool-filter-cycle";
  const catMatch = path.match(/^\/category\/(.+)$/);
  if (catMatch) {
    const decoded = decodeURIComponent(catMatch[1]);
    if (decoded === "신혼가전") return `category-${decoded}` as Page;
    return "not-found";
  }
  const postMatch = path.match(/^\/post\/(.+)$/);
  if (postMatch) return `post-${decodeURIComponent(postMatch[1])}` as Page;
  return "not-found";
}

function urlFromPage(page: Page, posts: Post[]): string {
  if (page === "home") return "/";
  if (page === "about") return "/about";
  if (page === "contact") return "/contact";
  if (page === "privacy") return "/privacy";
  if (page === "announcement") return "/announcement";
  if (page === "terms") return "/terms";
  if (page === "policy") return "/policy";
  if (page === "tool-power-cost") return "/tools/power-cost";
  if (page === "tool-filter-cycle") return "/tools/filter-cycle";
  if (page === "not-found") return "/404";
  if (page.startsWith("category-")) {
    return `/category/${encodeURIComponent(page.replace("category-", ""))}`;
  }
  if (page.startsWith("post-")) {
    const key = page.replace("post-", "");
    const post = posts.find((p) => matchPostBySlugOrId(key, p));
    if (post) {
      const slug = slugify(post.title) || post.id;
      return `/post/${slug}`;
    }
    return `/post/${encodeURIComponent(key)}`;
  }
  return "/";
}

function setMeta(name: string, content: string, attr: "name" | "property" = "name") {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

function updateStructuredData(page: Page, post: Post | null) {
  const primaryId = "jsonld-primary";
  const breadcrumbId = "jsonld-breadcrumb";
  let primaryEl = document.getElementById(primaryId) as HTMLScriptElement | null;
  if (!primaryEl) {
    primaryEl = document.createElement("script");
    primaryEl.id = primaryId;
    primaryEl.type = "application/ld+json";
    document.head.appendChild(primaryEl);
  }

  let breadcrumbEl = document.getElementById(breadcrumbId) as HTMLScriptElement | null;

  const setBreadcrumb = (items: Array<{ name: string; item: string }>) => {
    if (!breadcrumbEl) {
      breadcrumbEl = document.createElement("script");
      breadcrumbEl.id = breadcrumbId;
      breadcrumbEl.type = "application/ld+json";
      document.head.appendChild(breadcrumbEl);
    }
    breadcrumbEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((entry, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: entry.name,
          item: entry.item,
        })),
      },
      null,
      2
    );
  };

  if (post) {
    const slug = slugify(post.title) || post.id;
    const canonical = `${SITE_URL}/post/${slug}`;
    primaryEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: post.title,
        description: post.excerpt,
        datePublished: toIso8601(post.date),
        dateModified: toIso8601(post.updated || post.date),
        author: {
          "@type": "Organization",
          name: "버진로드 생활가전 기술편집팀",
          url: `${SITE_URL}/about`,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
        articleSection: getApplianceGroup(post.id, post.title),
        inLanguage: "ko-KR",
      },
      null,
      2
    );
    setBreadcrumb([
      { name: "홈", item: `${SITE_URL}/` },
      {
        name: "가전 관리 매뉴얼",
        item: `${SITE_URL}/category/${encodeURIComponent("신혼가전")}`,
      },
      { name: post.title, item: canonical },
    ]);
  } else if (page === "tool-power-cost") {
    const canonical = `${SITE_URL}/tools/power-cost`;
    primaryEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "생활가전 월간 전기요금 누진제 계산기",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "All",
        url: canonical,
        description:
          "2026년 한국전력공사 주택용(저압) 누진 단가 기준으로 가정 내 주요 생활가전의 월간 소비전력과 청구 요금을 시뮬레이션합니다.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      null,
      2
    );
    setBreadcrumb([
      { name: "홈", item: `${SITE_URL}/` },
      { name: "월간 전기요금 계산기", item: canonical },
    ]);
  } else if (page === "tool-filter-cycle") {
    const canonical = `${SITE_URL}/tools/filter-cycle`;
    primaryEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: "가전 필터·소모품 교체 주기 진단기",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "All",
        url: canonical,
        description:
          "세탁기, 건조기, 에어컨, 공기청정기, 식기세척기 등 10대 생활가전의 필터 세척·교체 D-Day와 연간 소모품 유지비를 자동 진단합니다.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
      },
      null,
      2
    );
    setBreadcrumb([
      { name: "홈", item: `${SITE_URL}/` },
      { name: "필터 교체 주기 진단기", item: canonical },
    ]);
  } else if (page === "home") {
    primaryEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        alternateName: ["Virginroad"],
        url: `${SITE_URL}/`,
        description: DEFAULT_DESCRIPTION,
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: `${SITE_URL}/`,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      null,
      2
    );
    if (breadcrumbEl) breadcrumbEl.remove();
  } else if (page.startsWith("category-")) {
    const category = page.replace("category-", "");
    const canonical = `${SITE_URL}/category/${encodeURIComponent(category)}`;
    primaryEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "생활가전 관리 매뉴얼 아카이브 | 버진로드",
        url: canonical,
        description: DEFAULT_DESCRIPTION,
      },
      null,
      2
    );
    setBreadcrumb([
      { name: "홈", item: `${SITE_URL}/` },
      { name: "가전 관리 매뉴얼", item: canonical },
    ]);
  } else if (page === "about") {
    primaryEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: "사이트 소개 및 편집원칙 | 버진로드",
        url: `${SITE_URL}/about`,
        description:
          "버진로드 생활가전 기술편집팀의 설립 취지, 4대 검증 원칙 및 공식 문의 창구를 안내합니다.",
        mainEntity: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
        },
      },
      null,
      2
    );
    setBreadcrumb([
      { name: "홈", item: `${SITE_URL}/` },
      { name: "사이트 소개", item: `${SITE_URL}/about` },
    ]);
  } else {
    const titleMap: Record<string, string> = {
      contact: "문의하기 및 오류 정정 접수",
      privacy: "개인정보 처리방침",
      terms: "이용약관 및 면책고지",
      announcement: "업데이트 이력 및 공지사항",
      policy: "가전 안전·효율 기준 및 검증 정책",
    };
    const pageTitle = titleMap[page] || "안내";
    const canonical = `${SITE_URL}/${page}`;
    primaryEl.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": page === "contact" ? "ContactPage" : "WebPage",
        name: `${pageTitle} | 버진로드`,
        url: canonical,
      },
      null,
      2
    );
    setBreadcrumb([
      { name: "홈", item: `${SITE_URL}/` },
      { name: pageTitle, item: canonical },
    ]);
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => pageFromUrl());
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [activeGroup, setActiveGroup] = useState<ApplianceGroup | "전체">("전체");
  const [feedPage, setFeedPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [realPosts, setRealPosts] = useState<Post[]>([]);
  const [, setUser] = useState<FirebaseUser | null>(null);

  const [isSearchConsoleModalOpen, setIsSearchConsoleModalOpen] = useState(false);
  const [selectedPostForIndexing] = useState<{ slug?: string; title?: string }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setIsSearchConsoleModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("admin") === "seo" || params.get("seo") === "1") {
        setIsSearchConsoleModalOpen(true);
      }
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ id: Math.random().toString(), message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPage(pageFromUrl());
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get("q") || "");
      setFeedPage(1);
      window.scrollTo(0, 0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const currentQ = params.get("q") || "";
    if (currentQ === searchQuery) return;

    if (!searchQuery) {
      params.delete("q");
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
      return;
    }

    const timer = setTimeout(() => {
      params.set("q", searchQuery);
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      if (currentQ) {
        window.history.replaceState({}, "", newUrl);
      } else {
        window.history.pushState({}, "", newUrl);
      }
      setFeedPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  // Fetch verified manuals only (strictly excludes any legacy boilerplate Firestore docs)
  useEffect(() => {
    fetch("/data/posts.json")
      .then((res) => {
        if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) {
          throw new Error("no static posts");
        }
        return res.json();
      })
      .catch(() =>
        fetch("/api/posts").then((res) => {
          if (!res.ok) throw new Error("API response error");
          return res.json();
        })
      )
      .then((data) => {
        if (Array.isArray(data)) {
          setRealPosts(data.filter((p: Post) => isVerifiedApplianceManualId(p?.id)));
        }
      })
      .catch(() => {});

    const q = query(collection(db, "posts"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const verifiedDocs = snapshot.docs
          .map((doc) => ({ ...doc.data(), id: doc.id }) as Post)
          .filter((p) => isVerifiedApplianceManualId(p.id));
        if (verifiedDocs.length === 0) return;
        setRealPosts((prev) => {
          const merged = [...prev];
          verifiedDocs.forEach((p) => {
            if (!merged.some((m) => m.id === p.id)) {
              merged.push(p);
            }
          });
          return merged;
        });
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.GET, "posts");
        } catch (err) {
          console.warn("Handled posts onSnapshot warning:", err);
        }
      }
    );
    return () => unsubscribe();
  }, []);

  // Verified 30 Appliance Manuals Only
  const allPosts = useMemo(() => {
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    const seenTitles = new Set<string>();
    const uniquePosts: Post[] = [];

    const appendVerified = (p: Post) => {
      if (!p || !isVerifiedApplianceManualId(p.id) || !p.title) return;
      const norm = normalizeTitle(p.title);
      const slug = slugify(p.title);
      if (seenIds.has(p.id) || seenTitles.has(norm) || seenSlugs.has(slug)) return;
      seenIds.add(p.id);
      seenTitles.add(norm);
      seenSlugs.add(slug);
      uniquePosts.push({
        ...p,
        author: "버진로드",
        category: "신혼가전",
      });
    };

    // Prioritize bundled verified MOCK_POSTS first so regenerated HTML always takes precedence
    MOCK_POSTS.forEach(appendVerified);
    realPosts.forEach(appendVerified);

    return uniquePosts.sort(
      (a, b) => parsePostTimestamp(b.date, b.id) - parsePostTimestamp(a.date, a.id)
    );
  }, [realPosts]);

  // Live published manuals
  const livePosts = useMemo(() => {
    const now = Date.now();
    return allPosts.filter((p) => parsePostTimestamp(p.date, p.id) <= now);
  }, [allPosts]);

  // Filtered list for feed view
  const filteredPosts = useMemo(() => {
    let posts = livePosts;

    if (activeGroup !== "전체") {
      posts = posts.filter((p) => getApplianceGroup(p.id, p.title) === activeGroup);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          (p.hashtags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return posts;
  }, [livePosts, activeGroup, searchQuery]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: livePosts.length };
    for (const g of APPLIANCE_GROUPS) {
      counts[g] = livePosts.filter((p) => getApplianceGroup(p.id, p.title) === g).length;
    }
    return counts;
  }, [livePosts]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = useMemo(() => {
    const start = (feedPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, feedPage]);

  const currentPost = useMemo(() => {
    if (!currentPage.startsWith("post-")) return null;
    const key = currentPage.replace("post-", "");
    return allPosts.find((p) => matchPostBySlugOrId(key, p)) || null;
  }, [currentPage, allPosts]);

  const isPostNotFound = currentPage.startsWith("post-") && !currentPost;

  const { prevPost, nextPost } = useMemo(() => {
    if (!currentPost) return { prevPost: null, nextPost: null };
    const currentIndex = allPosts.findIndex((p) => p.id === currentPost.id);
    return {
      prevPost: currentIndex > 0 ? allPosts[currentIndex - 1] : null,
      nextPost: currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null,
    };
  }, [currentPost, allPosts]);

  const relatedPosts = useMemo(() => {
    if (!currentPost) return [];
    return allPosts.filter((p) => p.id !== currentPost.id).slice(0, 5);
  }, [currentPost, allPosts]);

  // Dynamic Document Title, Meta & Structured Data
  useEffect(() => {
    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESCRIPTION;
    let canonical = `${SITE_URL}/`;

    if (currentPost) {
      const slug = slugify(currentPost.title) || currentPost.id;
      title = `${currentPost.title} | 버진로드`;
      description = currentPost.excerpt;
      canonical = `${SITE_URL}/post/${slug}`;
    } else if (isPostNotFound || currentPage === "not-found") {
      title = "페이지를 찾을 수 없습니다 | 버진로드";
      description = "요청하신 페이지를 찾을 수 없습니다. 버진로드 생활가전 관리 매뉴얼 목록으로 이동해 주세요.";
      canonical = `${SITE_URL}/404`;
    } else if (currentPage === "tool-power-cost") {
      title = "생활가전 월간 전기요금 누진제 계산기 | 버진로드";
      description =
        "2026년 한국전력공사 주택용(저압) 누진제 단가표 기준으로 12종 생활가전의 월간 소비전력(kWh)과 청구 전기요금을 계산합니다.";
      canonical = `${SITE_URL}/tools/power-cost`;
    } else if (currentPage === "tool-filter-cycle") {
      title = "가전 필터·소모품 교체 주기 진단기 | 버진로드";
      description =
        "드럼세탁기, 건조기, 시스템 에어컨, 공기청정기, 식기세척기 등 10대 가전의 필터 세척·교체 D-Day와 연간 소모품 유지비를 진단합니다.";
      canonical = `${SITE_URL}/tools/filter-cycle`;
    } else if (currentPage.startsWith("category-")) {
      title = "가전 관리 매뉴얼 전체 목록 | 버진로드";
      description = DEFAULT_DESCRIPTION;
      canonical = `${SITE_URL}/category/${encodeURIComponent("신혼가전")}`;
    } else if (currentPage === "about") {
      title = "사이트 소개 및 편집원칙 | 버진로드";
      description =
        "버진로드 생활가전 기술편집팀의 설립 취지, 4대 검증 원칙 및 공식 문의 창구를 안내합니다.";
      canonical = `${SITE_URL}/about`;
    } else if (currentPage === "contact") {
      title = "문의하기 및 오류 정정 접수 | 버진로드";
      description =
        "버진로드 공식 이메일(apark12321@gmail.com) 및 매뉴얼 오류 정정·정책 문의 안내입니다.";
      canonical = `${SITE_URL}/contact`;
    } else if (currentPage === "privacy") {
      title = "개인정보 처리방침 | 버진로드";
      canonical = `${SITE_URL}/privacy`;
    } else if (currentPage === "terms") {
      title = "이용약관 및 면책고지 | 버진로드";
      canonical = `${SITE_URL}/terms`;
    } else if (currentPage === "announcement") {
      title = "업데이트 이력 및 공지사항 | 버진로드";
      canonical = `${SITE_URL}/announcement`;
    } else if (currentPage === "policy") {
      title = "가전 안전·효율 기준 및 검증 정책 | 버진로드";
      description =
        "한국소비자원, 한국전기안전공사, 한국전력공사 공공 기준과 버진로드 4단계 기술 문서 팩트체크 절차를 안내합니다.";
      canonical = `${SITE_URL}/policy`;
    }

    document.title = title;
    setMeta("description", description);
    setCanonical(canonical);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", canonical, "property");
    updateStructuredData(currentPage, currentPost);
  }, [currentPage, currentPost, isPostNotFound]);

  const handleNavigate = (page: string) => {
    const nextPage = page as Page;
    const nextUrl = urlFromPage(nextPage, allPosts);
    if (window.location.pathname !== nextUrl) {
      window.history.pushState({}, "", nextUrl);
    }
    setCurrentPage(nextPage);
    setFeedPage(1);
    window.scrollTo(0, 0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setFeedPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isFeedView =
    !currentPost &&
    !isPostNotFound &&
    (currentPage === "home" || currentPage.startsWith("category-"));

  const isFullWidthView =
    currentPage === "tool-power-cost" ||
    currentPage === "tool-filter-cycle" ||
    currentPage === "about" ||
    currentPage === "policy" ||
    currentPage === "contact";

  const leadManual = livePosts[0] || null;

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] font-sans antialiased selection:bg-[#0F766E] selection:text-white flex flex-col justify-between">
      <Navbar
        onSearch={(q) => {
          setSearchQuery(q);
          setFeedPage(1);
          if (q && !isFeedView) {
            handleNavigate("home");
          }
        }}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        currentPage={currentPage}
      />

      <main className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1">
        {isFullWidthView ? (
          <div>
            {currentPage === "tool-power-cost" && (
              <AppliancePowerCalculator onNavigate={handleNavigate} />
            )}
            {currentPage === "tool-filter-cycle" && (
              <FilterCycleTracker onNavigate={handleNavigate} />
            )}
            {currentPage === "about" && <AboutPage onNavigate={handleNavigate} />}
            {currentPage === "policy" && (
              <PolicyHub compact={false} onNavigate={handleNavigate} />
            )}
            {currentPage === "contact" && <ContactPage onNavigate={handleNavigate} />}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* LEFT / MAIN COLUMN (Col-span-8) */}
            <section className="lg:col-span-8 w-full min-w-0">
              {/* VIEW 1: MANUAL DETAIL READER */}
              {currentPost && (
                <GuideReader
                  post={currentPost}
                  allPosts={allPosts}
                  categories={CATEGORIES}
                  prevPost={prevPost}
                  nextPost={nextPost}
                  relatedPosts={relatedPosts}
                  onNavigate={handleNavigate}
                  showToast={showToast}
                />
              )}

              {/* VIEW 2: 404 NOT FOUND */}
              {(currentPage === "not-found" || isPostNotFound) && (
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 sm:p-12 text-center space-y-4">
                  <p className="text-[12.5px] font-bold text-[#0F766E] uppercase tracking-wider">
                    404 Not Found
                  </p>
                  <h1 className="text-[24px] font-extrabold text-[#0F172A]">
                    요청하신 페이지를 찾을 수 없습니다
                  </h1>
                  <p className="text-[14.5px] text-[#475569] max-w-md mx-auto leading-relaxed break-keep">
                    주소가 변경되었거나 삭제된 문서입니다. 버진로드 생활가전 관리 매뉴얼 아카이브와 무료 진단 도구에서 원하시는 정보를 찾아보세요.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleNavigate("home")}
                      className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-[13.5px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      홈으로 이동
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate("tool-power-cost")}
                      className="px-4 py-2.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] text-[13.5px] font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      전기요금 계산기
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 3: PRIVACY POLICY */}
              {currentPage === "privacy" && (
                <article className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10 text-left space-y-5">
                  <header className="pb-5 border-b border-[#E2E8F0]">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#0F766E] mb-1.5">
                      Privacy Policy
                    </p>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A]">
                      개인정보 처리방침
                    </h1>
                  </header>

                  <p className="text-[14.5px] leading-[1.8] text-[#334155]">
                    버진로드(virginroad.kr, 이하 &lsquo;본 사이트&rsquo;)는 이용자의 개인정보를 중요하게 보호하며, 개인정보 보호법 및 Google AdSense 프로그램 정책을 준수합니다.
                  </p>

                  <section className="space-y-2">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                      1. 개인정보 수집 항목 및 브라우저 로컬 저장
                    </h2>
                    <p className="text-[14px] leading-[1.8] text-[#475569]">
                      본 사이트는 회원가입이나 로그인 없이 모든 생활가전 관리 매뉴얼과 진단 도구를 무료로 제공합니다. 이용자의 성명, 전화번호, 주민등록번호 등 개인 식별 정보를 별도 서버에 수집·저장하지 않습니다. 단, &lsquo;필터 교체 주기 진단기&rsquo;에서 이용자가 입력한 마지막 세척일은 편의를 위해 이용자 본인의 웹 브라우저(localStorage)에만 저장되며 외부로 전송되지 않습니다.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                      2. Google AdSense 및 제3자 광고 쿠키 고지
                    </h2>
                    <ul className="list-disc pl-5 text-[14px] text-[#475569] space-y-2 leading-relaxed">
                      <li>
                        Google을 포함한 제3자 광고 공급업체는 쿠키를 사용하여 이용자의 본 사이트 및 타 웹사이트 과거 방문 기록에 기반한 광고를 게재할 수 있습니다.
                      </li>
                      <li>
                        Google은 광고 쿠키(DART 쿠키 포함)를 통해 이용자에게 적합한 맞춤형 광고를 제공합니다.
                      </li>
                      <li>
                        이용자는 언제든지{" "}
                        <a
                          href="https://www.google.com/settings/ads"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0F766E] font-semibold underline"
                        >
                          Google 광고 설정
                        </a>{" "}
                        또는{" "}
                        <a
                          href="https://www.aboutads.info/choices"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0F766E] font-semibold underline"
                        >
                          aboutads.info
                        </a>
                        에서 맞춤 광고 쿠키 사용을 거부(Opt-Out)할 수 있습니다.
                      </li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                      3. 브라우저 쿠키 차단 안내
                    </h2>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[13.5px] text-[#475569] space-y-1">
                      <p>· Chrome: 설정 &gt; 개인정보 보호 및 보안 &gt; 서드 파티 쿠키</p>
                      <p>· Safari: 설정 &gt; 개인정보 보호 &gt; 모든 쿠키 차단</p>
                      <p>· Edge: 설정 &gt; 쿠키 및 사이트 권한 &gt; 쿠키 관리 및 삭제</p>
                    </div>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                      4. 개인정보 보호 담당자 및 문의처
                    </h2>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[13.5px] text-[#334155] space-y-1">
                      <p>
                        <strong>운영 주체:</strong> 버진로드 생활가전 기술편집팀
                      </p>
                      <p>
                        <strong>공식 이메일:</strong>{" "}
                        <a
                          href="mailto:apark12321@gmail.com"
                          className="text-[#0F766E] font-mono underline"
                        >
                          apark12321@gmail.com
                        </a>
                      </p>
                      <p>
                        <strong>시행 및 최종 개정일:</strong> 2026년 11월 22일
                      </p>
                    </div>
                  </section>
                </article>
              )}

              {/* VIEW 4: TERMS OF SERVICE */}
              {currentPage === "terms" && (
                <article className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10 text-left space-y-5">
                  <header className="pb-5 border-b border-[#E2E8F0]">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#0F766E] mb-1.5">
                      Terms of Service
                    </p>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A]">
                      이용약관 및 기술 면책고지
                    </h1>
                  </header>

                  <section className="space-y-2">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                      1. 콘텐츠 저작권 및 이용 범위
                    </h2>
                    <p className="text-[14px] leading-[1.8] text-[#475569]">
                      버진로드(virginroad.kr)에 게시된 30종의 생활가전 관리 매뉴얼, 비교 표, 전기요금 계산기 및 필터 교체 주기 진단 도구는 버진로드 기술편집팀이 작성·제작한 저작물입니다. 개인적인 가정 내 가전 유지관리 목적의 열람과 인쇄는 자유롭게 허용되나, 출처 표기 없는 무단 복제 및 상업적 재배포를 금지합니다.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                      2. 가전 분해·세척 및 전기요금 계산에 관한 면책 고지
                    </h2>
                    <p className="text-[14px] leading-[1.8] text-[#475569]">
                      본 사이트의 매뉴얼은 제조사 공식 사용설명서와 한국소비자원·한국전기안전공사 안전 지침을 참고해 작성된 일반 기술 안내입니다. 동일한 제품군이라도 제조 연식과 모델에 따라 분해 구조 및 권장 세제가 다를 수 있으므로, 모든 점검 작업 전 전원 플러그를 분리하고 해당 제품의 공식 설명서를 우선 확인해야 합니다. 고전압 기판·냉매 배관 수리는 반드시 공식 서비스센터에 의뢰하시기 바랍니다.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                      3. 오류 정정 요청
                    </h2>
                    <p className="text-[14px] leading-[1.8] text-[#475569]">
                      매뉴얼 본문이나 계산식에서 오류가 발견되면{" "}
                      <button
                        type="button"
                        onClick={() => handleNavigate("contact")}
                        className="text-[#0F766E] font-semibold underline cursor-pointer"
                      >
                        문의하기 페이지
                      </button>{" "}
                      또는{" "}
                      <a
                        href="mailto:apark12321@gmail.com"
                        className="text-[#0F766E] font-mono underline"
                      >
                        apark12321@gmail.com
                      </a>
                      으로 제보해 주시기 바랍니다.
                    </p>
                  </section>
                </article>
              )}

              {/* VIEW 5: ANNOUNCEMENT */}
              {currentPage === "announcement" && (
                <article className="bg-white border border-[#E2E8F0] rounded-xl p-6 sm:p-10 text-left space-y-6">
                  <header className="pb-5 border-b border-[#E2E8F0]">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-[#0F766E] mb-1.5">
                      Editorial Changelog
                    </p>
                    <h1 className="text-[24px] sm:text-[28px] font-extrabold text-[#0F172A]">
                      업데이트 이력 및 공지사항
                    </h1>
                  </header>

                  <div className="divide-y divide-[#E2E8F0]">
                    <div className="py-5 first:pt-0 space-y-1.5">
                      <p className="text-[12.5px] font-semibold text-[#0F766E] tabular-nums">
                        2026.11.22 · 기능 및 아카이브 개편
                      </p>
                      <h2 className="text-[17px] font-bold text-[#0F172A]">
                        생활가전 2대 진단 도구 출시 및 30종 공식 기술 매뉴얼 아카이브 정비
                      </h2>
                      <p className="text-[14px] text-[#475569] leading-relaxed break-keep">
                        2026년 한국전력공사 주택용(저압) 누진제 기준을 반영한 &lsquo;생활가전 월간 전기요금 계산기&rsquo;와 10대 가전의 세척·교체 D-Day를 추적하는 &lsquo;필터 교체 주기 진단기&rsquo;를 정식 오픈했습니다. 아울러 세탁·건조, 주방가전, 냉난방·공조, 청소·생활 4대 영역 30종 매뉴얼의 표 서식과 안전 기준 문서를 전면 점검했습니다.
                      </p>
                    </div>

                    <div className="py-5 space-y-1.5">
                      <p className="text-[12.5px] font-semibold text-[#64748B] tabular-nums">
                        2026.10.16 · 아카이브 개시
                      </p>
                      <h2 className="text-[17px] font-bold text-[#0F172A]">
                        신혼가전·생활가전 30종 유지관리 매뉴얼 시리즈 순차 발행 안내
                      </h2>
                      <p className="text-[14px] text-[#475569] leading-relaxed break-keep">
                        드럼세탁기 고무패킹 관리부터 히트펌프 건조기 콘덴서 청소, 4도어 냉장고 적정 온도, 시스템 에어컨 프리필터·드레인 펌프 점검까지 30개 필수 가전 매뉴얼을 순차 발행 완료했습니다.
                      </p>
                    </div>
                  </div>
                </article>
              )}

              {/* VIEW 6: HOME / CATEGORY FEED */}
              {isFeedView && (
                <div className="space-y-7">
                  {/* Editorial Hero + Lead Featured Manual (only on Home when not searching) */}
                  {currentPage === "home" && !searchQuery && leadManual && (
                    <section className="space-y-6">
                      {/* Lead Featured Manual */}
                      <div
                        onClick={() => handleNavigate(`post-${leadManual.id}`)}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0F766E] rounded-xl p-6 sm:p-7 transition-colors cursor-pointer group text-left"
                      >
                        <div className="flex items-center gap-2 text-[12px] text-[#64748B] mb-2.5 tabular-nums">
                          <span className="font-bold text-[#0F766E]">
                            최신 기술 매뉴얼 · {getApplianceGroup(leadManual.id, leadManual.title)}
                          </span>
                          <span className="text-[#CBD5E1]">·</span>
                          <span>{formatPostDateTime(leadManual.date, leadManual.id)}</span>
                        </div>
                        <h1 className="text-[22px] sm:text-[26px] font-extrabold text-[#0F172A] group-hover:text-[#0F766E] transition-colors leading-snug tracking-tight break-keep mb-3">
                          {leadManual.title}
                        </h1>
                        <p className="text-[14.5px] leading-[1.7] text-[#475569] break-keep mb-4">
                          {leadManual.excerpt}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[13.5px] font-bold text-[#0F766E]">
                          매뉴얼 전문 읽기 <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>

                      {/* 2-Card Interactive Tools Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => handleNavigate("tool-power-cost")}
                          className="text-left p-5 bg-white border border-[#E2E8F0] hover:border-[#0F766E] rounded-xl transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0F766E]">
                              <Zap className="w-3.5 h-3.5" />
                              2026 한전 누진제 계산기
                            </span>
                            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-colors" />
                          </div>
                          <h2 className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0F766E] mb-1">
                            생활가전 월간 전기요금 계산기
                          </h2>
                          <p className="text-[13px] text-[#475569] leading-relaxed break-keep">
                            보유 가전 12종의 가동 시간으로 누진 단계와 예상 청구액을 즉시 계산합니다.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNavigate("tool-filter-cycle")}
                          className="text-left p-5 bg-white border border-[#E2E8F0] hover:border-[#0F766E] rounded-xl transition-colors cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#0F766E]">
                              <Wrench className="w-3.5 h-3.5" />
                              10대 가전 소모품 점검표
                            </span>
                            <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F766E] transition-colors" />
                          </div>
                          <h2 className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0F766E] mb-1">
                            필터·소모품 교체 주기 진단기
                          </h2>
                          <p className="text-[13px] text-[#475569] leading-relaxed break-keep">
                            마지막 청소일로 다음 관리 D-Day와 연간 소모품 유지비를 자동 진단합니다.
                          </p>
                        </button>
                      </div>
                    </section>
                  )}

                  {/* Archive Header + Group Segmented Filter */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                      <div>
                        <h2 className="text-[19px] sm:text-[21px] font-extrabold text-[#0F172A]">
                          {searchQuery
                            ? `'${searchQuery}' 검색 결과 (${filteredPosts.length}건)`
                            : "생활가전 관리 매뉴얼 아카이브"}
                        </h2>
                        <p className="text-[13px] text-[#64748B] mt-0.5 tabular-nums">
                          총 {filteredPosts.length}종의 검증된 가전 사용·세척·고장 예방 매뉴얼
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-lg border border-[#E2E8F0] self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setViewMode("list")}
                          className={`px-2.5 py-1 rounded text-[12px] inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                            viewMode === "list"
                              ? "bg-white text-[#0F766E] border border-[#CBD5E1]"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          <LayoutList className="w-3.5 h-3.5" />
                          <span>목록</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode("card")}
                          className={`px-2.5 py-1 rounded text-[12px] inline-flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                            viewMode === "card"
                              ? "bg-white text-[#0F766E] border border-[#CBD5E1]"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          <span>카드</span>
                        </button>
                      </div>
                    </div>

                    {/* Appliance Group Filter Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {(["전체", ...APPLIANCE_GROUPS] as const).map((grp) => {
                        const isSelected = activeGroup === grp;
                        return (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => {
                              setActiveGroup(grp);
                              setFeedPage(1);
                            }}
                            className={`px-3 py-1.5 text-[13px] font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                              isSelected
                                ? "bg-[#0F766E] text-white border-[#0F766E]"
                                : "bg-white text-[#475569] border-[#E2E8F0] hover:border-[#94A3B8] hover:text-[#0F172A]"
                            }`}
                          >
                            {grp} ({groupCounts[grp] || 0})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {ADSENSE_ENABLED && (
                    <AdSenseUnit slot="home-feed-top" label="광고 / Sponsored" format="fluid" />
                  )}

                  {/* Manual List / Card Stream */}
                  {filteredPosts.length > 0 ? (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 sm:p-6">
                      {viewMode === "list" ? (
                        <div className="divide-y divide-[#F1F5F9]">
                          {paginatedPosts.map((post, idx) => (
                            <div key={post.id}>
                              <PostCard
                                post={post}
                                onClick={(id) => handleNavigate(`post-${id}`)}
                                viewMode="list"
                              />
                              {ADSENSE_ENABLED && idx === 3 && (
                                <div className="py-4">
                                  <AdSenseUnit
                                    slot="home-feed-mid"
                                    label="광고 / Sponsored"
                                    format="fluid"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {paginatedPosts.map((post) => (
                            <PostCard
                              key={post.id}
                              post={post}
                              onClick={(id) => handleNavigate(`post-${id}`)}
                              viewMode="card"
                            />
                          ))}
                        </div>
                      )}

                      {totalPages > 1 && (
                        <div className="mt-7 pt-5 border-t border-[#E2E8F0] flex items-center justify-center gap-1 text-[13px] tabular-nums">
                          <button
                            type="button"
                            onClick={() => handlePageChange(1)}
                            disabled={feedPage === 1}
                            className="p-1.5 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                            aria-label="첫 페이지"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePageChange(feedPage - 1)}
                            disabled={feedPage === 1}
                            className="p-1.5 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                            aria-label="이전 페이지"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                            const isActive = pageNum === feedPage;
                            return (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => handlePageChange(pageNum)}
                                className={`min-w-[32px] h-[32px] rounded-md text-[13px] font-bold transition-colors cursor-pointer ${
                                  isActive
                                    ? "bg-[#0F766E] text-white"
                                    : "text-[#334155] hover:bg-[#F1F5F9]"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => handlePageChange(feedPage + 1)}
                            disabled={feedPage === totalPages}
                            className="p-1.5 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                            aria-label="다음 페이지"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={feedPage === totalPages}
                            className="p-1.5 rounded text-[#64748B] hover:text-[#0F172A] disabled:opacity-30 cursor-pointer"
                            aria-label="마지막 페이지"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-10 text-center space-y-4">
                      <Search className="w-9 h-9 text-[#CBD5E1] mx-auto" />
                      <h3 className="text-[17px] font-bold text-[#0F172A]">
                        &lsquo;{searchQuery}&rsquo; 검색 결과가 없습니다
                      </h3>
                      <p className="text-[13.5px] text-[#64748B]">
                        다른 가전 품목명(예: 드럼세탁기, 식기세척기, 건조기)으로 검색하거나 전체 목록을 확인하세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveGroup("전체");
                          handleNavigate("home");
                        }}
                        className="px-4 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-[13px] rounded-lg transition-colors cursor-pointer"
                      >
                        전체 매뉴얼 보기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* RIGHT COLUMN (Col-span-4): Sidebar */}
            <section className="lg:col-span-4 w-full">
              <Sidebar
                posts={livePosts}
                categories={CATEGORIES}
                onNavigate={handleNavigate}
                currentPostId={currentPost?.id}
                onSearch={(q) => {
                  setSearchQuery(q);
                  setActiveGroup("전체");
                  handleNavigate("home");
                }}
              />
            </section>
          </div>
        )}
      </main>

      <Footer onNavigate={handleNavigate} />

      <SearchConsoleModal
        isOpen={isSearchConsoleModalOpen}
        onClose={() => setIsSearchConsoleModalOpen(false)}
        currentPostSlug={selectedPostForIndexing.slug}
        currentPostTitle={selectedPostForIndexing.title}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-[#0F172A] text-white px-5 py-3 rounded-lg shadow-xl text-[13.5px] font-semibold"
          >
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
