import { useState, useEffect } from "react";
import { Search, X, Menu, BookOpen, User, Bell, Home } from "lucide-react";

interface NavbarProps {
  onSearch: (query: string) => void;
  onNavigate: (page: string) => void;
  searchQuery?: string;
  currentPage?: string;
}

export function Navbar({ onSearch, onNavigate, searchQuery = "", currentPage = "home" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goHome = () => {
    onSearch("");
    onNavigate("home");
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: "홈", page: "home", isHome: true },
    { label: "신혼금융", page: "category-신혼금융" },
    { label: "신혼가전", page: "category-신혼가전" },
    { label: "결혼준비", page: "category-결혼준비" },
    { label: "블로그 소개", page: "about" },
    { label: "공지사항", page: "announcement" },
    { label: "2026 정책안내", page: "policy" },
  ];

  return (
    <header className="w-full bg-white border-b border-[#e5e7eb] font-sans">
      {/* 1. Tistory/Naver Blog Classic Top Bar */}
      <div className="border-b border-[#f3f4f6] bg-[#fafafa]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-8 flex items-center justify-between text-[11.5px] text-[#6b7280]">
          <div className="flex items-center gap-3">
            <span className="font-medium text-[#374151]">버진로드 공식 블로그</span>
            <span className="text-[#d1d5db]">|</span>
            <span className="hidden sm:inline text-[#9ca3af]">2026년 신혼부부 주거·금융·가전 실전 백서</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("about")}
              className="hover:text-[#111827] transition-colors cursor-pointer"
            >
              에디터 소개
            </button>
            <span className="text-[#d1d5db]">|</span>
            <button
              onClick={() => onNavigate("announcement")}
              className="hover:text-[#111827] transition-colors cursor-pointer"
            >
              공지사항
            </button>
            <span className="text-[#d1d5db]">|</span>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#111827] transition-colors"
            >
              사이트맵
            </a>
          </div>
        </div>
      </div>

      {/* 2. Main Blog Header (Clean Logo & Subtitle) */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="cursor-pointer" onClick={goHome}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-block px-2 py-0.5 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-sm">
                EDITORIAL BLOG
              </span>
              <span className="text-[12px] text-gray-400">Since 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-[#111827] tracking-tight hover:text-rose-600 transition-colors">
              버진로드 <span className="text-lg sm:text-xl font-normal text-gray-400">· Virginroad</span>
            </h1>
            <p className="text-[13px] sm:text-[14px] text-[#6b7280] mt-1.5 font-normal tracking-tight">
              예비·신혼부부의 안전한 주거 독립과 합리적인 소비를 위한 실전 가이드
            </p>
          </div>

          {/* Right Header: Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[260px]">
              <input
                type="text"
                placeholder="블로그 내 검색..."
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-8 bg-white border border-[#d1d5db] focus:border-[#111827] text-[13px] rounded-md outline-none transition-all placeholder:text-[#9ca3af]"
              />
              <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Mobile menu hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 text-gray-600 hover:text-black border border-gray-200 rounded-md"
              aria-label="메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Horizontal Navigation Menu Bar (Classic Tistory/Naver Style) */}
      <div className={`border-t border-[#e5e7eb] bg-white ${isScrolled ? "shadow-xs" : ""}`}>
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <nav className="hidden sm:flex items-center gap-1 -mb-px">
            {navItems.map((item) => {
              const isActive =
                (item.page === "home" && currentPage === "home" && !searchQuery) ||
                (item.page.startsWith("category-") && currentPage === item.page) ||
                (item.page === "about" && currentPage === "about") ||
                (item.page === "policy" && currentPage === "policy") ||
                (item.page === "announcement" && currentPage === "announcement");

              return (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    if (item.page === "home") onSearch("");
                  }}
                  className={`px-4 py-3 text-[14.5px] font-semibold border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? "border-rose-600 text-rose-600 font-bold bg-rose-50/30"
                      : "border-transparent text-[#4b5563] hover:text-[#111827] hover:border-gray-300"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1 shadow-md">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => {
                onNavigate(item.page);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 text-[14px] font-medium text-gray-700 hover:bg-gray-50 rounded-md flex items-center justify-between"
            >
              <span>{item.label}</span>
              <span className="text-gray-400 text-xs">&rarr;</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
