import { useState, useMemo, useEffect } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Sidebar } from "./components/Sidebar";
import { PostCard } from "./components/PostCard";
import { GuideReader } from "./components/GuideReader";
import { AdSenseUnit } from "./components/AdSenseUnit";
import { PolicyHub } from "./components/PolicyHub";
import { AboutPage } from "./components/AboutPage";
import { SearchConsoleModal } from "./components/SearchConsoleModal";
import { MOCK_POSTS, CATEGORIES } from "./constants";
import { Post } from "./types";
import { expandContentIfNeeded } from "./lib/contentExpander";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Search, 
  LayoutList, 
  LayoutGrid, 
  FolderOpen,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "./lib/firebase";
import { handleFirestoreError, OperationType } from "./lib/views";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { slugify, parsePostTimestamp, normalizeTitle } from "./lib/utils";

type Page = 
  | "home" 
  | "about" 
  | "privacy" 
  | "announcement" 
  | "terms" 
  | "policy" 
  | `category-${string}` 
  | `post-${string}`;

const SITE_URL = "https://virginroad.kr";
const SITE_NAME = "버진로드";
const DEFAULT_TITLE = "버진로드 - 2026 신혼부부 금융·청약·가전 실전 가이드";
const DEFAULT_DESCRIPTION = "디딤돌·버팀목 대출 우대금리, 신혼특공 청약 전략, 혼수가전 견적 노하우를 제공하는 신혼 라이프 전문 정보 블로그입니다.";

const POSTS_PER_PAGE = 10;

function pageFromUrl(): Page {
  if (typeof window === "undefined") return "home";
  const path = window.location.pathname;
  if (path === "/" || path === "") return "home";
  if (path === "/about") return "about";
  if (path === "/privacy") return "privacy";
  if (path === "/announcement") return "announcement";
  if (path === "/terms") return "terms";
  if (path === "/policy") return "policy";
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
  if (page === "announcement") return "/announcement";
  if (page === "terms") return "/terms";
  if (page === "policy") return "/policy";
  if (page.startsWith("category-")) {
    return `/category/${encodeURIComponent(page.replace("category-", ""))}`;
  }
  if (page.startsWith("post-")) {
    const key = page.replace("post-", "");
    const post = posts.find((p) => p.id === key || slugify(p.title) === key);
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
    headline: post.title,
    description: post.excerpt,
    image: [post.image],
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: {
      "@type": "Organization",
      name: "버진로드",
      url: `${SITE_URL}/about`
    },
    publisher: {
      "@type": "Organization",
      name: "상상아트",
      alternateName: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` }
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/post/${slug}` },
    articleSection: post.category,
    inLanguage: "ko-KR"
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
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL + "/" },
      { "@type": "ListItem", position: 2, name: post.category, item: `${SITE_URL}/category/${encodeURIComponent(post.category)}` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/post/${slug}` }
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
  const [feedPage, setFeedPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [realPosts, setRealPosts] = useState<Post[]>([]);
  const [, setUser] = useState<FirebaseUser | null>(null);

  // Hidden admin shortcut for Google Search Console indexing
  const [isSearchConsoleModalOpen, setIsSearchConsoleModalOpen] = useState(false);
  const [selectedPostForIndexing, setSelectedPostForIndexing] = useState<{ slug?: string; title?: string }>({});

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

  // Toast Notification
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

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Browser History & Popstate
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

  // Sync Search Query to URL
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
      setFeedPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  // Fetch API posts & Firestore
  useEffect(() => {
    fetch("/api/posts")
      .then((res) => {
        if (!res.ok) throw new Error("API response error");
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data)) {
          setRealPosts(data);
        }
      })
      .catch((err) => console.error("Failed to fetch merged API posts:", err));

    const q = query(collection(db, "posts"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        })) as Post[];
        setRealPosts((prev) => {
          const merged = [...prev];
          posts.forEach((p) => {
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

  // Merge and Sanitize Posts
  const allPosts = useMemo(() => {
    const seenTitles = new Set<string>();
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    const uniquePosts: Post[] = [];

    const isRelevant = (p: { title?: string; id?: string }) => {
      if (!p || !p.title) return false;
      const title = (p.title || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      const blocked = [
        "유튜브 쇼츠",
        "시청 지속시간",
        "쇼츠 알고리즘",
        "유튜브 조회수",
        "indexing api",
        "[c안]",
        "유튜브 수익화",
        "인스타 릴스 알고리즘"
      ];
      return !blocked.some((b) => title.includes(b) || id.includes(b));
    };

    realPosts.forEach((real) => {
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

    MOCK_POSTS.forEach((mockPost) => {
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

    const sanitized = uniquePosts.map((p) => {
      const author = "버진로드";
      const title = (p.title || "").replace(/홈코노미뉴스/g, "버진로드");
      const excerpt = (p.excerpt || "").replace(/홈코노미뉴스/g, "버진로드");
      let content = (p.content || "")
        .replace(/홈코노미뉴스/g, "버진로드")
        .replace(/버진로드 편집부의 정밀 취재에 따르면/g, "공식 고시 자료를 확인한 결과에 따르면")
        .replace(/버진로드 편집부에서/g, "꼼꼼하게 정리한")
        .replace(/버진로드 편집부/g, "버진로드");

      if (!MOCK_POSTS.some((mp) => mp.id === p.id)) {
        content = expandContentIfNeeded(title, p.category, p.hashtags || [], content, p.id, p.image);
      }
      return { ...p, author, title, excerpt, content };
    });

    return sanitized.sort((a, b) => parsePostTimestamp(b.date, b.id) - parsePostTimestamp(a.date, a.id));
  }, [realPosts]);

  // Filter Posts
  const filteredPosts = useMemo(() => {
    let posts = allPosts;
    if (currentPage.startsWith("category-")) {
      const category = currentPage.replace("category-", "");
      posts = posts.filter((p) => p.category === category);
    }
    if (searchQuery) {
      posts = posts.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return posts;
  }, [currentPage, searchQuery, allPosts]);

  // Pagination Calculation
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const paginatedPosts = useMemo(() => {
    const start = (feedPage - 1) * POSTS_PER_PAGE;
    return filteredPosts.slice(start, start + POSTS_PER_PAGE);
  }, [filteredPosts, feedPage]);

  // Single Post Data
  const currentPost = useMemo(() => {
    if (!currentPage.startsWith("post-")) return null;
    const key = currentPage.replace("post-", "");
    return allPosts.find((p) => p.id === key || slugify(p.title) === key) || null;
  }, [currentPage, allPosts]);

  const { prevPost, nextPost } = useMemo(() => {
    if (!currentPost) return { prevPost: null, nextPost: null };
    const currentIndex = allPosts.findIndex((p) => p.id === currentPost.id);
    const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
    const next = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
    return { prevPost: prev, nextPost: next };
  }, [currentPost, allPosts]);

  const relatedPosts = useMemo(() => {
    if (!currentPost) return [];
    return allPosts
      .filter((p) => p.category === currentPost.category && p.id !== currentPost.id)
      .slice(0, 3);
  }, [currentPost, allPosts]);

  // Dynamic SEO & Title
  useEffect(() => {
    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESCRIPTION;
    let canonical = SITE_URL + "/";
    let ogImage = `${SITE_URL}/og-image.png`;

    if (currentPost) {
      const slug = slugify(currentPost.title) || currentPost.id;
      title = `${currentPost.title} - 버진로드`;
      description = currentPost.excerpt;
      canonical = `${SITE_URL}/post/${slug}`;
      ogImage = currentPost.image || ogImage;
    } else if (currentPage.startsWith("category-")) {
      const category = currentPage.replace("category-", "");
      title = `${category} 글 모음 - 버진로드 블로그`;
      description = `${category}에 관한 실전 팁과 최신 정책 가이드를 모아둔 공간입니다.`;
      canonical = `${SITE_URL}/category/${encodeURIComponent(category)}`;
    } else if (currentPage === "about") {
      title = "블로그 소개 및 편집원칙 - 버진로드";
      canonical = `${SITE_URL}/about`;
    } else if (currentPage === "privacy") {
      title = "개인정보 처리방침 - 버진로드";
      canonical = `${SITE_URL}/privacy`;
    } else if (currentPage === "terms") {
      title = "이용약관 및 면책고지 - 버진로드";
      canonical = `${SITE_URL}/terms`;
    } else if (currentPage === "announcement") {
      title = "공지사항 - 버진로드";
      canonical = `${SITE_URL}/announcement`;
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
    setFeedPage(1);
    window.scrollTo(0, 0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setFeedPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeCategory = currentPage.startsWith("category-")
    ? currentPage.replace("category-", "")
    : undefined;

  return (
    <div className="min-h-screen bg-[#fdfdfd] text-[#1f2937] font-sans antialiased selection:bg-rose-500 selection:text-white flex flex-col justify-between">
      {/* 1. Header Navigation */}
      <Navbar
        onSearch={(q) => {
          setSearchQuery(q);
          setFeedPage(1);
        }}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        currentPage={currentPage}
      />

      {/* 2. Main Content Container (Classic 2-Column Tistory Layout) */}
      <main className="max-w-[1140px] w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ========================================================================= */}
          {/* LEFT / CENTER COLUMN (Col-span-8): Main Blog Feed or Reader or Page       */}
          {/* ========================================================================= */}
          <section className="lg:col-span-8 w-full min-w-0">
            {/* VIEW 1: BLOG POST READER */}
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

            {/* VIEW 2: ABOUT PAGE */}
            {currentPage === "about" && (
              <AboutPage onNavigate={handleNavigate} />
            )}

            {/* VIEW 3: POLICY HUB */}
            {currentPage === "policy" && (
              <PolicyHub compact={false} onNavigate={handleNavigate} />
            )}

            {/* VIEW 4: PRIVACY POLICY */}
            {currentPage === "privacy" && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-10 text-left article-body">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                  개인정보 처리방침 (Privacy Policy)
                </h1>
                <p className="text-[14.5px] leading-relaxed text-gray-700 mb-6">
                  버진로드(Virginroad, 이하 &lsquo;본 블로그&rsquo;)는 이용자의 개인정보를 소중하게 보호하며, 관련 법령 및 구글 애드센스(Google AdSense) 운영 정책을 철저히 준수합니다.
                </p>

                <h2 className="text-[19px] font-bold text-gray-900 mt-6 mb-3">1. 개인정보 수집 항목 및 목적</h2>
                <p className="text-[14px] text-gray-700 leading-relaxed">
                  본 블로그는 별도의 회원가입이나 개인정보 입력 없이 모든 정보와 가이드를 100% 무료로 자유롭게 열람하실 수 있으며, 이용자의 어떠한 개인정보도 수집하거나 저장하지 않습니다.
                </p>

                <h2 className="text-[19px] font-bold text-gray-900 mt-6 mb-3">2. 구글 애드센스 및 제3자 광고 쿠키(Cookie) 고지</h2>
                <p className="text-[14px] text-gray-700 leading-relaxed mb-3">
                  본 블로그는 Google을 비롯한 제3자 광고 공급업체를 통해 광고를 게재합니다.
                </p>
                <ul className="list-disc list-inside text-[13.5px] text-gray-600 space-y-1.5 pl-2 mb-4">
                  <li>Google을 포함한 제3자 공급업체는 쿠키를 사용하여 사용자가 본 웹사이트 또는 다른 웹사이트를 이전에 방문한 기록을 바탕으로 광고를 게재합니다.</li>
                  <li>Google의 광고 쿠키 사용으로 Google 및 파트너는 사용자의 본 사이트 및 인터넷의 다른 사이트 방문 기록을 바탕으로 적절한 광고를 게재할 수 있습니다.</li>
                  <li>사용자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-rose-600 font-semibold underline">Google 광고 설정</a>을 방문하여 맞춤설정 광고를 사용 중지할 수 있습니다.</li>
                </ul>

                <h2 className="text-[19px] font-bold text-gray-900 mt-6 mb-3">3. 개인정보 보호책임자 및 문의처</h2>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-[13px] text-gray-700 space-y-1">
                  <p><strong>운영자:</strong> 박아람 (버진로드 / 상상아트)</p>
                  <p><strong>이메일:</strong> <a href="mailto:apark12321@gmail.com" className="text-rose-600 font-medium">apark12321@gmail.com</a></p>
                  <p><strong>시행일자:</strong> 2026년 1월 1일</p>
                </div>
              </div>
            )}

            {/* VIEW 5: TERMS OF SERVICE */}
            {currentPage === "terms" && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-10 text-left article-body">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                  이용약관 및 면책고지 (Terms of Service)
                </h1>
                <p className="text-[14.5px] leading-relaxed text-gray-700 mb-6">
                  본 약관은 버진로드(Virginroad) 블로그가 제공하는 정보와 가이드의 이용 조건 및 면책 사항을 규정합니다.
                </p>

                <h2 className="text-[19px] font-bold text-gray-900 mt-6 mb-3">1. 저작권 및 팩트체크 기준</h2>
                <p className="text-[14px] text-gray-700 leading-relaxed">
                  본 블로그에 작성된 모든 칼럼, 조견표, 데이터 분석 가이드는 공공기관(국토교통부, 주택도시기금, 한국주택금융공사, 청약홈)의 고시 자료를 철저히 검증하여 작성된 버진로드의 저작물입니다. 무단 전재 및 AI 불법 스크래핑을 엄격히 금합니다.
                </p>

                <h2 className="text-[19px] font-bold text-gray-900 mt-6 mb-3">2. 금융·정책 정보에 대한 면책 고지</h2>
                <p className="text-[14px] text-gray-700 leading-relaxed">
                  본 블로그의 대출 금리, 한도 요건, 청약 자격 정보는 참고용으로 제공되며, 정부 정책 개정 및 수탁 은행 심사 지침에 따라 차이가 발생할 수 있습니다. 대출 실행 및 청약 신청 전 반드시 관계 기관 및 취급 은행을 통해 최종 확인하시기 바랍니다.
                </p>
              </div>
            )}

            {/* VIEW 6: ANNOUNCEMENT */}
            {currentPage === "announcement" && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 sm:p-10 text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
                  공지사항
                </h1>
                <div className="space-y-4">
                  <div className="p-5 border border-gray-200 rounded-lg hover:border-rose-300 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs bg-rose-50 text-rose-600 font-bold px-2 py-0.5 rounded">
                        공지
                      </span>
                      <span className="text-xs text-gray-400">2026.09.09</span>
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">
                      2026년 주거금융·디딤돌 금리 개편안 전면 반영 안내
                    </h2>
                    <p className="text-[13.5px] text-gray-600 leading-relaxed">
                      국토교통부 및 주택도시기금의 최신 신혼부부·신생아 특례 정책 개정 사항이 본 블로그의 86편 전 포스팅에 완벽히 반영되었습니다. 신혼부부 여러분의 많은 성원 바랍니다.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 7: HOME / CATEGORY / SEARCH (MAIN BLOG FEED) */}
            {!currentPost &&
              currentPage !== "about" &&
              currentPage !== "privacy" &&
              currentPage !== "terms" &&
              currentPage !== "announcement" &&
              currentPage !== "policy" && (
                <div className="space-y-6">
                  {/* Category / Search Header Banner */}
                  <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <FolderOpen className="w-3.5 h-3.5 text-[#0f766e]" />
                        <span className="text-[11.5px] font-bold text-[#0f766e] uppercase tracking-wider">
                          {activeCategory ? `분야: ${activeCategory}` : searchQuery ? "검색 결과" : "전체 가이드 목록"}
                        </span>
                      </div>
                      <h2 className="text-[18px] sm:text-[20px] font-bold text-[#0f172a]">
                        {activeCategory ? (
                          <span>{activeCategory}</span>
                        ) : searchQuery ? (
                          <span>&lsquo;{searchQuery}&rsquo; 검색 ({filteredPosts.length}건)</span>
                        ) : (
                          <span>신혼부부 주거·금융·가전 실무 가이드 &amp; Q&amp;A</span>
                        )}
                      </h2>
                      <p className="text-[12.5px] text-[#64748b] mt-0.5">
                        총 <strong className="text-[#0f766e]">{filteredPosts.length}</strong>개의 실전 가이드가 등록되어 있습니다.
                      </p>
                    </div>

                    {/* View Switcher (목록형 / 웹진형) */}
                    <div className="flex items-center gap-1 bg-[#f1f5f9] p-1 rounded shrink-0 border border-[#e2e8f0]">
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                          viewMode === "list"
                            ? "bg-white text-[#0f766e] shadow-2xs font-bold border border-[#cbd5e1]"
                            : "text-[#64748b] hover:text-[#0f172a]"
                        }`}
                        title="목록형 보기"
                      >
                        <LayoutList className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">목록형</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("card")}
                        className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer ${
                          viewMode === "card"
                            ? "bg-white text-[#0f766e] shadow-2xs font-bold border border-[#cbd5e1]"
                            : "text-[#64748b] hover:text-[#0f172a]"
                        }`}
                        title="카드형 보기"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">카드형</span>
                      </button>
                    </div>
                  </div>

                  {/* Feed In-Stream AdSense Slot (Top) */}
                  <AdSenseUnit slot="home-feed-top" label="광고 / Sponsored" format="fluid" />

                  {/* Post Stream */}
                  {filteredPosts.length > 0 ? (
                    <div className="bg-white border border-[#e2e8f0] rounded p-4 sm:p-6 shadow-2xs">
                      {viewMode === "list" ? (
                        <div className="divide-y divide-[#f1f5f9]">
                          {paginatedPosts.map((post, idx) => (
                            <div key={post.id}>
                              <PostCard
                                post={post}
                                onClick={(id) => handleNavigate(`post-${id}`)}
                                viewMode="list"
                              />
                              {/* In-feed middle Ad after 4th post on page */}
                              {idx === 3 && (
                                <div className="py-4">
                                  <AdSenseUnit slot="home-feed-mid" label="광고 / Sponsored" format="fluid" />
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

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="mt-8 pt-5 border-t border-[#e2e8f0] flex items-center justify-center gap-1 text-[13px]">
                          {/* First Page */}
                          <button
                            type="button"
                            onClick={() => handlePageChange(1)}
                            disabled={feedPage === 1}
                            className="p-1.5 rounded text-[#64748b] hover:text-[#0f172a] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="첫 페이지"
                          >
                            <ChevronsLeft className="w-4 h-4" />
                          </button>

                          {/* Prev Page */}
                          <button
                            type="button"
                            onClick={() => handlePageChange(feedPage - 1)}
                            disabled={feedPage === 1}
                            className="p-1.5 rounded text-[#64748b] hover:text-[#0f172a] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="이전 페이지"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {/* Page Numbers */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              (pageNum >= feedPage - 2 && pageNum <= feedPage + 2)
                            ) {
                              const isActive = pageNum === feedPage;
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => handlePageChange(pageNum)}
                                  className={`min-w-[32px] h-[32px] rounded text-[13px] font-bold transition-colors cursor-pointer ${
                                    isActive
                                      ? "bg-[#0f766e] text-white"
                                      : "text-[#334155] hover:bg-[#f1f5f9]"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            }
                            if (pageNum === feedPage - 3 || pageNum === feedPage + 3) {
                              return (
                                <span key={pageNum} className="px-1 text-gray-400">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}

                          {/* Next Page */}
                          <button
                            type="button"
                            onClick={() => handlePageChange(feedPage + 1)}
                            disabled={feedPage === totalPages}
                            className="p-2 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="다음 페이지"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>

                          {/* Last Page */}
                          <button
                            type="button"
                            onClick={() => handlePageChange(totalPages)}
                            disabled={feedPage === totalPages}
                            className="p-2 rounded text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="마지막 페이지"
                          >
                            <ChevronsRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* No Results */
                    <div className="bg-white border border-[#e5e7eb] rounded-lg p-10 text-center space-y-4 shadow-2xs">
                      <Search className="w-10 h-10 text-gray-300 mx-auto" />
                      <h3 className="text-lg font-bold text-gray-900">
                        &lsquo;{searchQuery}&rsquo; 검색 결과가 없습니다
                      </h3>
                      <p className="text-sm text-gray-500">
                        다른 키워드로 검색하시거나 전체 목록으로 돌아가 보세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          handleNavigate("home");
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition-colors"
                      >
                        전체 글 목록으로 돌아가기
                      </button>
                    </div>
                  )}
                </div>
              )}
          </section>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN (Col-span-4): Classic Tistory / Naver Blog Sidebar           */}
          {/* ========================================================================= */}
          <section className="lg:col-span-4 w-full">
            <Sidebar
              posts={allPosts}
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onNavigate={handleNavigate}
              currentPostId={currentPost?.id}
              onSearch={(q) => {
                setSearchQuery(q);
                handleNavigate("home");
              }}
            />
          </section>
        </div>
      </main>

      {/* 3. Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Google Search Console Modal (Admin only) */}
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-xl text-[13.5px] font-semibold"
          >
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
