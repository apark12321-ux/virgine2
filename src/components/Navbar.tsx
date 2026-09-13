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
    <header className="w-full bg-white border-b border-[#e2e8f0] font-sans sticky top-0 z-40">
      {/* 1. Ultra-clean Top Utility Bar */}
      <div className="border-b border-[#f1f5f9] bg-[#f8fafc] text-[12px] text-[#64748b]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0f172a]">버진로드 (Virginroad)</span>
            <span className="text-[#cbd5e1]">|</span>
            <span className="hidden sm:inline text-[#64748b]">신혼생활 질문과 답변 백서 · 2026 개정판</span>
          </div>
          <div className="flex items-center gap-3 text-[11.5px]">
            <button
              onClick={() => onNavigate("about")}
              className="hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              에디터 소개
            </button>
            <span className="text-[#cbd5e1]">|</span>
            <button
              onClick={() => onNavigate("announcement")}
              className="hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              공지사항
            </button>
            <span className="text-[#cbd5e1]">|</span>
            <button
              onClick={() => onNavigate("policy")}
              className="hover:text-[#0f172a] transition-colors cursor-pointer"
            >
              정책 허브
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Logo & Search Header */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4">
        <div className="cursor-pointer flex items-center gap-3" onClick={goHome}>
          <div className="w-10 h-10 rounded bg-[#0f766e] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
            Q&amp;A
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight hover:text-[#0f766e] transition-colors flex items-center gap-2">
              <span>버진로드</span>
              <span className="text-sm font-normal text-[#64748b] hidden sm:inline">질문과 답변</span>
            </h1>
            <p className="text-[12px] text-[#64748b] hidden sm:block">
              예비·신혼부부 주거 독립, 대출, 가전, 청약의 모든 질문과 답변
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-[180px] sm:w-[260px] lg:w-[300px]">
            <input
              type="text"
              placeholder="질문 또는 가이드 검색..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-8 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#0f766e] focus:bg-white text-[13px] rounded outline-none transition-all placeholder:text-[#94a3b8]"
            />
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => onSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-gray-600 hover:text-black border border-gray-200 rounded"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Streamlined Horizontal Category Navigation Bar */}
      <div className="border-t border-[#e2e8f0] bg-white">
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
                  className={`px-4 py-2.5 text-[14px] font-medium border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? "border-[#0f766e] text-[#0f766e] font-bold"
                      : "border-transparent text-[#475569] hover:text-[#0f172a] hover:border-[#cbd5e1]"
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
        <div className="sm:hidden border-t border-[#e2e8f0] bg-white px-4 py-2 space-y-1 shadow-md">
          {navItems.map((item) => (
            <button
              key={item.page}
              onClick={() => {
                onNavigate(item.page);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-[13.5px] font-medium text-gray-700 hover:bg-gray-50 rounded flex items-center justify-between"
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
