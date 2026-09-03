import { useState, useMemo, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Sidebar } from "./components/Sidebar";
import { PostCard } from "./components/PostCard";
import { GuideReader } from "./components/GuideReader";
import { AdSenseUnit } from "./components/AdSenseUnit";
import { PolicyHub } from "./components/PolicyHub";
import { DidimdolCalculator } from "./components/DidimdolCalculator";
import { CheongyakCalculator } from "./components/CheongyakCalculator";
import { AboutPage } from "./components/AboutPage";
import { SearchConsoleModal } from "./components/SearchConsoleModal";
import { MOCK_POSTS, CATEGORIES } from "./constants";
import { POST_EXTRA_MAP, PostExtra } from "./postMeta";
import { Post } from "./types";
import { expandContentIfNeeded } from "./lib/contentExpander";
import { Share2, Printer, ArrowRight, TrendingUp, ArrowUpRight, Copy, ExternalLink, User, ChevronLeft, ChevronRight, CheckCircle2, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "./lib/firebase";
import { handleFirestoreError, OperationType } from "./lib/views";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { slugify, formatPostDateTime, parsePostTimestamp, normalizeTitle } from "./lib/utils";
import { buildSmartGoogleSearch } from "./lib/searchHelper";

type Page = "home" | "about" | "privacy" | "partnership" | "announcement" | "terms" | "policy" | "tools-didimdol" | "tools-cheongyak" | `category-${string}` | `post-${string}`;

const SITE_URL = "https://virginroad.kr";
const SITE_NAME = "버진로드";
const DEFAULT_TITLE = "버진로드 - 2026 신혼부부 금융·청약·가전 실전 가이드";
const DEFAULT_DESCRIPTION = "디딤돌·버팀목 대출 우대금리, 신혼특공 청약 전략, 혼수가전 견적 노하우와 계산기를 제공하는 신혼 라이프 전문 정보 블로그입니다.";

function pageFromUrl(): Page {
  if (typeof window === "undefined") return "home";
  const path = window.location.pathname;
  if (path === "/" || path === "") return "home";
  if (path === "/about") return "about";
  if (path === "/privacy") return "privacy";
  if (path === "/partnership") return "partnership";
  if (path === "/announcement") return "announcement";
  if (path === "/terms") return "terms";
  if (path === "/policy") return "policy";
  if (path === "/tools/didimdol") return "tools-didimdol";
  if (path === "/tools/cheongyak") return "tools-cheongyak";
  const catMatch = path.match(/^\/category\/(.+)$/);
  if (catMatch) return `category-${decodeURIComponent(catMatch[1])}` as Page;
  const postMatch = path.match(/^\/post\/(.+)$/);
  if (postMatch) return `post-${decodeURIComponent(postMatch[1])}` as Page;
  return "home";
}

function urlFromPage(page: Page, posts: Post[]): string {
  if (page === "home") return "/";
  if (page === "about") return "/about";
  if (page === "privacy") return "/privacy";
  if (page === "partnership") return "/partnership";
  if (page === "announcement") return "/announcement";
  if (page === "terms") return "/terms";
  if (page === "policy") return "/policy";
  if (page === "tools-didimdol") return "/tools/didimdol";
  if (page === "tools-cheongyak") return "/tools/cheongyak";
  if (page.startsWith("category-")) {
    return `/category/${encodeURIComponent(page.replace("category-", ""))}`;
  }
  if (page.startsWith("post-")) {
    const key = page.replace("post-", "");
    const post = posts.find(p => p.id === key || slugify(p.title) === key);
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

function setArticleJsonLd(post: Post | null) {
  const id = "article-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!post) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  const slug = slugify(post.title) || post.id;
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": [post.image],
    "datePublished": post.date,
    "dateModified": post.updated || post.date,
    "author": {
      "@type": "Organization",
      "name": "버진로드",
      "url": `${SITE_URL}/about`
    },
    "publisher": {
      "@type": "Organization",
      "name": "상상아트",
      "alternateName": SITE_NAME,
      "url": SITE_URL,
      "logo": { "@type": "ImageObject", "url": `${SITE_URL}/icon.svg` }
    },
    "mainEntityOfPage": { "@type": "WebPage", "@id": `${SITE_URL}/post/${slug}` },
    "articleSection": post.category,
    "inLanguage": "ko-KR"
  };
  el.textContent = JSON.stringify(data);
}

function setBreadcrumbJsonLd(post: Post | null) {
  const id = "breadcrumb-jsonld";
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!post) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  const slug = slugify(post.title) || post.id;
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "홈", "item": SITE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": post.category, "item": `${SITE_URL}/category/${encodeURIComponent(post.category)}` },
      { "@type": "ListItem", "position": 3, "name": post.title, "item": `${SITE_URL}/post/${slug}` }
    ]
  };
  el.textContent = JSON.stringify(data);
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>(() => pageFromUrl());
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  });
  const [realPosts, setRealPosts] = useState<Post[]>([]);
  const [, setUser] = useState<FirebaseUser | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  
  // Google Search Console Auto-Indexing Modal State (Hidden from regular visitors)
  const [isSearchConsoleModalOpen, setIsSearchConsoleModalOpen] = useState(false);
  const [selectedPostForIndexing, setSelectedPostForIndexing] = useState<{ slug?: string; title?: string }>({});

  const handleOpenSearchConsole = (slug?: string, title?: string) => {
    setSelectedPostForIndexing({ slug, title });
    setIsSearchConsoleModalOpen(true);
  };

  // Hidden admin shortcut: accessible via URL (?admin=seo) or keyboard shortcut (Ctrl+Shift+S)
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
  
  // Custom Toast Notification State
  const [toast, setToast] = useState<{
    id: string;
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({
      id: Math.random().toString(),
      message,
      type
    });
  };

  const smartSearch = useMemo(() => buildSmartGoogleSearch(searchQuery), [searchQuery]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const onPopState = () => {
      setCurrentPage(pageFromUrl());
      const params = new URLSearchParams(window.location.search);
      setSearchQuery(params.get("q") || "");
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
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      window.history.replaceState({}, "", newUrl);
      return;
    }

    const timer = setTimeout(() => {
      params.set("q", searchQuery);
      const newSearch = params.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
      const wasSearching = !!currentQ;
      if (wasSearching) {
        window.history.replaceState({}, "", newUrl);
      } else {
        window.history.pushState({}, "", newUrl);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // 1. Fetch from our backend REST API
    fetch("/api/posts")
      .then(res => {
        if (!res.ok) throw new Error("API response error");
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          setRealPosts(data);
        }
      })
      .catch(err => console.error("Failed to fetch merged API posts:", err));

    // 2. Firestore live subscription
    const q = query(collection(db, "posts"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Post[];
      setRealPosts(prev => {
        const merged = [...prev];
        posts.forEach(p => {
          if (!merged.some(m => m.id === p.id)) {
            merged.push(p);
          }
        });
        return merged;
      });
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, "posts");
      } catch (err) {
        console.warn("Handled posts onSnapshot warning:", err);
      }
    });
    return () => unsubscribe();
  }, []);

  const allPosts = useMemo(() => {
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    const uniquePosts: Post[] = [];

    const isRelevant = (p: { title?: string; id?: string }) => {
      if (!p || !p.title) return false;
      const title = (p.title || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      const blocked = ["유튜브 쇼츠", "시청 지속시간", "쇼츠 알고리즘", "유튜브 조회수", "indexing api", "[c안]", "유튜브 수익화", "인스타 릴스 알고리즘"];
      return !blocked.some(b => title.includes(b) || id.includes(b));
    };

    realPosts.forEach(real => {
      if (real && real.id && real.title && isRelevant(real)) {
        const norm = normalizeTitle(real.title);
        const slug = slugify(real.title);
        if (!seenTitles.has(norm) && !seenIds.has(real.id) && !seenSlugs.has(slug)) {
          seenTitles.add(norm);
          seenIds.add(real.id);
          seenSlugs.add(slug);
          uniquePosts.push(real as Post);
        }
      }
    });

    MOCK_POSTS.forEach(mockPost => {
      if (!isRelevant(mockPost)) return;
      const norm = normalizeTitle(mockPost.title);
      const slug = slugify(mockPost.title);
      if (!seenTitles.has(norm) && !seenIds.has(mockPost.id) && !seenSlugs.has(slug)) {
        seenTitles.add(norm);
        seenIds.add(mockPost.id);
        seenSlugs.add(slug);
        uniquePosts.push(mockPost);
      }
    });

    const sanitized = uniquePosts.map(p => {
      const author = "버진로드";
      const title = (p.title || "").replace(/홈코노미뉴스/g, "버진로드");
      const excerpt = (p.excerpt || "").replace(/홈코노미뉴스/g, "버진로드");
      let content = (p.content || "")
        .replace(/홈코노미뉴스/g, "버진로드")
        .replace(/버진로드 편집부의 정밀 취재에 따르면/g, "공식 고시 자료를 확인한 결과에 따르면")
        .replace(/버진로드 편집부에서/g, "꼼꼼하게 정리한")
        .replace(/버진로드 편집부/g, "버진로드");

      if (!MOCK_POSTS.some(mp => mp.id === p.id)) {
        content = expandContentIfNeeded(title, p.category, p.hashtags || [], content, p.id, p.image);
      }
      return { ...p, author, title, excerpt, content };
    });

    return sanitized.sort((a, b) => parsePostTimestamp(b.date, b.id) - parsePostTimestamp(a.date, a.id));
  }, [realPosts]);

  const filteredPosts = useMemo(() => {
    let posts = allPosts;
    if (currentPage.startsWith("category-")) {
      const category = currentPage.replace("category-", "");
      posts = posts.filter(p => p.category === category);
    }
    if (searchQuery) {
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return posts;
  }, [currentPage, searchQuery, allPosts]);

  const currentPost = useMemo(() => {
    if (!currentPage.startsWith("post-")) return null;
    const key = currentPage.replace("post-", "");
    return allPosts.find(p => p.id === key || slugify(p.title) === key) || null;
  }, [currentPage, allPosts]);

  // Current Post Navigation (Prev / Next)
  const { prevPost, nextPost } = useMemo(() => {
    if (!currentPost) return { prevPost: null, nextPost: null };
    const currentIndex = allPosts.findIndex(p => p.id === currentPost.id);
    const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    const next = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
    return { prevPost: prev, nextPost: next };
  }, [currentPost, allPosts]);

  // Related Posts in same category
  const relatedPosts = useMemo(() => {
    if (!currentPost) return [];
    return allPosts
      .filter(p => p.category === currentPost.category && p.id !== currentPost.id)
      .slice(0, 3);
  }, [currentPost, allPosts]);

  // Dynamic SEO & Title
  useEffect(() => {
    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESCRIPTION;
    let canonical = SITE_URL + "/";
    let ogImage = `${SITE_URL}/og-image.png`;
    let ogImageAlt = "버진로드 블로그";

    if (currentPost) {
      const slug = slugify(currentPost.title) || currentPost.id;
      title = `${currentPost.title} - 버진로드`;
      description = currentPost.excerpt;
      canonical = `${SITE_URL}/post/${slug}`;
      ogImage = currentPost.image || ogImage;
      ogImageAlt = currentPost.title;
    } else if (currentPage.startsWith("category-")) {
      const category = currentPage.replace("category-", "");
      title = `${category} 글 모음 - 버진로드 블로그`;
      description = `${category}에 관한 실전 팁과 최신 정책 가이드를 모아둔 공간입니다.`;
      canonical = `${SITE_URL}/category/${encodeURIComponent(category)}`;
    } else if (currentPage === "about") {
      title = "블로그 소개 및 안내 - 버진로드";
      description = "예비·신혼부부의 주거 마련과 현명한 자산 관리를 위한 실전 가이드 블로그 버진로드 소개입니다.";
      canonical = `${SITE_URL}/about`;
    } else if (currentPage === "privacy") {
      title = "개인정보 처리방침 - 버진로드";
      canonical = `${SITE_URL}/privacy`;
    } else if (currentPage === "terms") {
      title = "이용약관 및 면책고지 - 버진로드";
      canonical = `${SITE_URL}/terms`;
    }

    document.title = title;
    setMeta("description", description);
    setCanonical(canonical);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:image", ogImage, "property");
    setMeta("og:url", canonical, "property");
    setArticleJsonLd(currentPost);
    setBreadcrumbJsonLd(currentPost);
  }, [currentPage, currentPost]);

  const handleNavigate = (page: string) => {
    const nextPage = page as Page;
    const nextUrl = urlFromPage(nextPage, allPosts);
    if (window.location.pathname !== nextUrl) {
      window.history.pushState({}, "", nextUrl);
    }
    setCurrentPage(nextPage);
    window.scrollTo(0, 0);
  };

  const activeCategory = currentPage.startsWith("category-") ? currentPage.replace("category-", "") : undefined;

  return (
    <div className="min-h-screen bg-[#FDFDFE] text-[#1E1B2E] font-sans antialiased selection:bg-[#E8745F] selection:text-white">
      <Navbar
        onSearch={setSearchQuery}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        currentPage={currentPage}
      />

      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* 1. HOME / CATEGORY / SEARCH (2-COLUMN EDITORIAL BLOG LAYOUT)             */}
          {/* ========================================================================= */}
          {!currentPost &&
            currentPage !== "about" &&
            currentPage !== "privacy" &&
            currentPage !== "terms" &&
            currentPage !== "announcement" &&
            currentPage !== "partnership" &&
            currentPage !== "policy" &&
            currentPage !== "tools-didimdol" &&
            currentPage !== "tools-cheongyak" && (
              <motion.div
                key="blog-feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
              >
                {/* Main Article Stream (col-span-8) */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Blog Channel Greeting Banner (When on Home without search) */}
                  {currentPage === "home" && !searchQuery && (
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-7 shadow-xs">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 text-[12px] font-bold text-[#E8745F]">
                          <span className="w-2 h-2 rounded-full bg-[#E8745F]" />
                          <span>버진로드 &middot; 에디터 박아람의 실전 노트</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNavigate("about")}
                          className="text-[12px] font-semibold text-[#64748B] hover:text-[#E8745F] transition-colors"
                        >
                          에디터 소개 &rarr;
                        </button>
                      </div>
                      <h1 className="text-[20px] sm:text-[24px] font-extrabold text-[#111827] leading-[1.38] tracking-tight mb-2.5 break-keep">
                        신혼부부를 위한 실전 금융 &middot; 청약 &middot; 가전 &middot; 웨딩 가이드
                      </h1>
                      <p className="text-[14px] leading-relaxed text-[#475569] break-keep">
                        디딤돌·버팀목 정책 대출, 청약 특별공급, 가전 견적 비교 및 결혼식 예산 절감 노하우를 명확하고 체계적으로 전해드립니다.
                      </p>
                    </div>
                  )}

                  {/* Category Header (When on specific category) */}
                  {activeCategory && !searchQuery && (
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#E8745F] uppercase tracking-wider">
                          카테고리
                        </span>
                        <h1 className="text-[24px] font-bold text-[#111827] mt-0.5 tracking-tight">
                          {activeCategory}
                        </h1>
                        <p className="text-[13.5px] text-[#64748B] mt-1">
                          총 {filteredPosts.length}편의 실전 가이드가 등록되어 있습니다.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigate("home")}
                        className="text-[12.5px] font-semibold text-[#64748B] hover:text-[#111827] px-3 py-1.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]"
                      >
                        전체글 보기
                      </button>
                    </div>
                  )}

                  {/* Search Query Header */}
                  {searchQuery && (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[12px] font-medium text-[#64748B]">검색어</p>
                        <h2 className="text-[18px] font-bold text-[#111827]">
                          &lsquo;{searchQuery}&rsquo; 검색 결과 ({filteredPosts.length}건)
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          handleNavigate("home");
                        }}
                        className="text-[13px] font-semibold text-[#E8745F] hover:underline shrink-0"
                      >
                        검색 초기화
                      </button>
                    </div>
                  )}

                  {/* Category Filter Tabs & Sort Indicator */}
                  <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 hide-scrollbar">
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleNavigate("home")}
                        className={`px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-colors cursor-pointer shrink-0 ${
                          currentPage === "home" && !searchQuery
                            ? "bg-[#1E1B2E] text-white"
                            : "bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
                        }`}
                      >
                        전체 ({allPosts.length})
                      </button>
                      {CATEGORIES.map((cat) => {
                        const count = allPosts.filter((p) => p.category === cat).length;
                        const isActive = activeCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleNavigate(`category-${cat}`)}
                            className={`px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-colors cursor-pointer shrink-0 ${
                              isActive
                                ? "bg-[#1E1B2E] text-white"
                                : "bg-white text-[#475569] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
                            }`}
                          >
                            {cat} ({count})
                          </button>
                        );
                      })}
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-[12px] font-medium text-[#64748B] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-lg shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                      <span>최신순 정렬</span>
                    </div>
                  </div>

                  {/* Posts Grid & In-feed Ads */}
                  {filteredPosts.length > 0 ? (
                    <div className="space-y-6">
                      {/* Featured 1st Post (Only on clean home) */}
                      {currentPage === "home" && !searchQuery && filteredPosts.length > 0 && (
                        <PostCard
                          post={filteredPosts[0]}
                          onClick={(id) => handleNavigate(`post-${id}`)}
                          featured={true}
                        />
                      )}

                      {/* Top In-feed AdSense Slot */}
                      <AdSenseUnit slot="home-feed-01" label="광고 / Ad" format="fluid" />

                      {/* Main Posts 2-column Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {(currentPage === "home" && !searchQuery ? filteredPosts.slice(1, 7) : filteredPosts.slice(0, 6)).map(
                          (post) => (
                            <PostCard
                              key={post.id}
                              post={post}
                              onClick={(id) => handleNavigate(`post-${id}`)}
                            />
                          )
                        )}
                      </div>

                      {/* Middle In-feed AdSense Slot */}
                      <AdSenseUnit slot="home-feed-02" label="광고 / Ad" format="fluid" />

                      {/* Remaining Posts */}
                      {(currentPage === "home" && !searchQuery ? filteredPosts.slice(7) : filteredPosts.slice(6)).length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          {(currentPage === "home" && !searchQuery ? filteredPosts.slice(7) : filteredPosts.slice(6)).map(
                            (post) => (
                              <PostCard
                                key={post.id}
                                post={post}
                                onClick={(id) => handleNavigate(`post-${id}`)}
                              />
                            )
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Clean No-Result & Smart Google Search Section */
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-6 shadow-xs">
                      <div className="max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-full bg-[#F1F5F9] text-[#64748B] flex items-center justify-center mx-auto mb-3">
                          <Search className="w-5 h-5 text-[#64748B]" />
                        </div>
                        <h3 className="text-[19px] font-bold text-[#111827] mb-2">
                          &lsquo;{searchQuery}&rsquo; 검색 결과가 없습니다
                        </h3>
                        <p className="text-[13.5px] text-[#64748B] leading-relaxed mb-5">
                          단어의 철자를 확인하시거나, 아래의 맞춤형 구글 검색을 활용해 관련 정책 자료를 탐색해 보세요.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            handleNavigate("home");
                          }}
                          className="px-5 py-2.5 bg-[#1E1B2E] text-white text-[13px] font-bold rounded-xl hover:bg-[#332D4E] transition-colors"
                        >
                          전체 포스팅 목록으로 돌아가기
                        </button>
                      </div>

                      {/* Smart Google Search Card */}
                      <div className="mt-6 p-5 bg-[#F8FAFC] border border-[#BFDBFE] rounded-xl text-left">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
                          <div>
                            <span className="text-[11px] font-extrabold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded">
                              구글 맞춤 연계 검색
                            </span>
                            <h4 className="text-[15px] font-bold text-[#1E1B2E] mt-1">
                              구글에서 &lsquo;{searchQuery}&rsquo; 추천 검색어로 검색하기
                            </h4>
                          </div>
                          <a
                            href={smartSearch.primaryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-[#2563EB] text-white text-[12.5px] font-bold rounded-lg inline-flex items-center gap-1.5 hover:bg-[#1D4ED8] transition-colors shrink-0"
                          >
                            <span>구글 검색</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <div className="pt-3 flex items-center justify-between text-[13px] text-[#475569]">
                          <span className="font-mono font-medium truncate">{smartSearch.primaryQuery}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(smartSearch.primaryQuery);
                                showToast("검색어가 클립보드에 복사되었습니다.", "success");
                              } catch {
                                showToast("복사에 실패했습니다.", "error");
                              }
                            }}
                            className="text-[11.5px] text-[#64748B] hover:text-[#111827] flex items-center gap-1 shrink-0 ml-3"
                          >
                            <Copy className="w-3 h-3" />
                            <span>복사</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky Sidebar (col-span-4) */}
                <div className="lg:col-span-4 lg:sticky lg:top-24">
                  <Sidebar
                    posts={allPosts}
                    categories={CATEGORIES}
                    activeCategory={activeCategory}
                    onNavigate={handleNavigate}
                  />
                </div>
              </motion.div>
            )}

          {/* ========================================================================= */}
          {/* 2. POST DETAIL VIEW (EDITORIAL ARTICLE + TABLE OF CONTENTS + SIDEBAR)     */}
          {/* ========================================================================= */}
          {currentPost && (
            <motion.article
              key="post-detail"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
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
            </motion.article>
          )}

          {/* ========================================================================= */}
          {/* 3. POLICY HUB VIEW                                                        */}
          {/* ========================================================================= */}
          {currentPage === "policy" && (
            <motion.div
              key="policy-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <PolicyHub compact={false} onNavigate={handleNavigate} />
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* 4. CALCULATORS (DIDIMDOL & CHEONGYAK)                                     */}
          {/* ========================================================================= */}
          {currentPage === "tools-didimdol" && (
            <motion.div
              key="tools-didimdol-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <DidimdolCalculator />
            </motion.div>
          )}

          {currentPage === "tools-cheongyak" && (
            <motion.div
              key="tools-cheongyak-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CheongyakCalculator />
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* 5. ABOUT / PRIVACY / TERMS PAGES                                          */}
          {/* ========================================================================= */}
          {currentPage === "about" && (
            <motion.div
              key="about-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AboutPage onNavigate={handleNavigate} />
            </motion.div>
          )}

          {currentPage === "privacy" && (
            <motion.div
              key="privacy-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-[860px] mx-auto bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xs article-body"
            >
              <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#111827] mb-6">
                개인정보 처리방침 (Privacy Policy)
              </h1>
              <p className="text-[14.5px] leading-relaxed text-[#475569] mb-8">
                버진로드(Virginroad, 이하 &lsquo;본 블로그&rsquo;)는 이용자의 개인정보를 소중하게 보호하며, 관련 법령 및 구글 애드센스(Google AdSense) 정책을 철저히 준수합니다.
              </p>

              <h2>1. 개인정보 수집 및 이용 목적</h2>
              <p>본 블로그는 회원가입 없이 모든 정보와 계산기 기능을 100% 무료로 이용하실 수 있습니다. 이용자가 이메일 문의 또는 댓글 등록 시 입력하는 닉네임과 연락처는 답변 및 원활한 소통 목적으로만 사용되며 외부에 무단 제공되지 않습니다.</p>

              <h2>2. 구글 애드센스 및 제3자 광고 쿠키(Cookie) 고지</h2>
              <p>
                본 블로그는 구글(Google)을 비롯한 제3자 광고 공급업체를 통해 광고를 게재할 수 있습니다.
              </p>
              <ul>
                <li>Google을 포함한 제3자 공급업체는 쿠키를 사용하여 사용자가 본 웹사이트 또는 다른 웹사이트를 이전에 방문한 기록을 바탕으로 광고를 게재합니다.</li>
                <li>Google의 광고 쿠키 사용으로 Google 및 파트너는 사용자의 본 사이트 및 인터넷의 다른 사이트 방문 기록을 바탕으로 적절한 광고를 사용자에게 표시할 수 있습니다.</li>
                <li>사용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#E8745F] font-semibold underline">Google 광고 설정</a>을 방문하여 맞춤설정 광고를 사용 중지할 수 있습니다. (또는 <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-[#E8745F] font-semibold underline">aboutads.info</a>를 방문하여 맞춤설정 광고에 사용되는 제3자 공급업체의 쿠키 사용을 선택 해제할 수 있습니다.)</li>
              </ul>

              <h2>3. 로그 데이터 및 웹 분석 도구</h2>
              <p>
                웹사이트의 품질 향상 및 서비스 최적화를 위해 방문자의 브라우저 종류, 방문 일시, 참조 페이지 등 비식별 통계 정보가 자동 수집될 수 있으며, 이는 개인을 특정할 수 없습니다.
              </p>

              <h2>4. 개인정보 보호책임자 및 문의처</h2>
              <p>
                개인정보 처리 및 블로그 운영에 관한 모든 문의는 아래로 연락 주시면 신속하고 성실하게 답변드리겠습니다.
              </p>
              <div className="p-4 bg-[#F8FAFC] rounded-xl text-[13.5px] text-[#334155] mt-3">
                <p><strong>운영자/책임자:</strong> 박아람 (버진로드 / 상상아트)</p>
                <p><strong>이메일 문의:</strong> <a href="mailto:apark12321@gmail.com" className="text-[#E8745F] font-semibold">apark12321@gmail.com</a></p>
                <p><strong>시행일자:</strong> 2026년 1월 1일</p>
              </div>
            </motion.div>
          )}

          {currentPage === "terms" && (
            <motion.div
              key="terms-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-[860px] mx-auto bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xs article-body"
            >
              <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#111827] mb-6">
                이용약관 및 면책고지 (Terms of Service & Disclaimer)
              </h1>
              <p className="text-[14.5px] leading-relaxed text-[#475569] mb-8">
                본 약관은 버진로드(Virginroad) 블로그가 제공하는 모든 콘텐츠, 계산 도구 및 정보 서비스의 이용에 관한 조건과 책임을 규정합니다.
              </p>

              <h2>1. 저작권 및 지적재산권 보호</h2>
              <p>본 블로그에 게시된 모든 텍스트, 직접 가공한 표/데이터, 자체 개발 계산기 로직 및 디자인 저작권은 버진로드(상상아트)에 있습니다. 저작권자의 서면 동의 없는 무단 복제, AI 크롤링 스크래핑, 2차 저작물 상업 배포를 엄격히 금합니다.</p>

              <h2>2. 금융 및 정책 정보에 대한 면책 고지</h2>
              <p>
                본 블로그에서 다루는 디딤돌대출, 신생아특례, 버팀목전세자금, 신혼부부 특별공급 청약 등의 모든 정보는 국토교통부, 한국주택금융공사(HF), 주택도시기금(HUG), 한국부동산원 청약홈의 최신 공시자료를 근거로 성실히 작성되었습니다.
              </p>
              <p>
                그러나 정부 정책 및 수탁 시중은행의 심사 기준, 금리 우대 항목은 수시로 개정될 수 있습니다. 본 블로그의 계산 결과 및 가이드는 참고용이며 법적 효력을 갖지 않으므로, 최종 계약 및 대출 실행 전 반드시 관계 기관 및 취급 은행 창구를 통해 확인하시기 바랍니다. 본 블로그는 이용자의 개별 금융 결정에 따른 결과에 대해 법적 책임을 지지 않습니다.
              </p>

              <h2>3. 서비스의 변경 및 중단</h2>
              <p>
                본 블로그는 정보의 정확성을 위해 지속적으로 콘텐츠를 업데이트하며, 사전 고지 없이 게시물의 수정이나 보완이 이루어질 수 있습니다.
              </p>
            </motion.div>
          )}

          {currentPage === "announcement" && (
            <motion.div
              key="announcement-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-[860px] mx-auto bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xs article-body"
            >
              <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#111827] mb-6">
                공지사항
              </h1>
              <h2>버진로드 블로그 운영 안내</h2>
              <p>2026년 기준 최신 신혼부부 정책 및 디딤돌 대출 조건 개정안이 전 포스팅에 반영되었습니다.</p>
            </motion.div>
          )}

          {currentPage === "partnership" && (
            <motion.div
              key="partnership-page"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-[860px] mx-auto bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 lg:p-12 shadow-xs article-body"
            >
              <h1 className="text-[28px] sm:text-[34px] font-extrabold text-[#111827] mb-6">
                제휴 및 비즈니스 문의
              </h1>
              <p>신혼 금융, 인테리어, 가전 및 웨딩 관련 협업 및 기고 제보는 아래 이메일로 연락주시면 검토 후 회신드리겠습니다.</p>
              <p>이메일: <a href="mailto:apark12321@gmail.com">apark12321@gmail.com</a></p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer
        onNavigate={handleNavigate}
      />

      {/* Google Search Console Auto-Indexing Modal */}
      <SearchConsoleModal
        isOpen={isSearchConsoleModalOpen}
        onClose={() => setIsSearchConsoleModalOpen(false)}
        currentPostSlug={selectedPostForIndexing.slug}
        currentPostTitle={selectedPostForIndexing.title}
      />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 bg-[#1E1B2E] text-white px-5 py-3 rounded-xl shadow-xl border border-[#3E385C]/60 text-[13.5px] font-semibold"
          >
            {toast.type === "success" && <span className="text-emerald-400">✓</span>}
            {toast.type === "error" && <span className="text-rose-400">✕</span>}
            {toast.type === "info" && <span className="text-indigo-400">ℹ</span>}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
