import { useState, useEffect } from "react";
import { Search, X, Menu, Home, BookOpen, ShieldCheck } from "lucide-react";

interface NavbarProps {
  onSearch: (query: string) => void;
  onNavigate: (page: string) => void;
  searchQuery?: string;
  currentPage?: string;
}

export function Navbar({ onSearch, onNavigate, searchQuery = "", currentPage = "home" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Rule 2: Strictly Home + 1 Single Focused Category navigation
  const navItems = [
    { label: "홈", page: "home", isHome: true },
    { label: "가전 관리 매뉴얼", page: "category-신혼가전" },
  ];

  return (
    <header className="w-full bg-white border-b border-[#e2e8f0] font-sans sticky top-0 z-40">
      {/* 1. Main Logo & Search Header */}
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="cursor-pointer flex items-center gap-3" onClick={goHome}>
          <div className="w-10 h-10 rounded bg-[#0f766e] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
            VR
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight hover:text-[#0f766e] transition-colors">
                버진로드
              </span>
              <span className="text-[11px] font-bold text-[#0f766e] bg-[#f0fdfa] border border-[#ccfbf1] px-1.5 py-0.5 rounded">
                가전 매뉴얼
              </span>
            </div>
            <p className="text-[12px] text-[#64748b] hidden sm:block">
              신혼가전 및 생활가전 사용 관리 매뉴얼 · 공식 점검 가이드
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative w-[180px] sm:w-[260px] lg:w-[320px]">
            <input
              type="text"
              placeholder="가전 모델 또는 증상 검색..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-8 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#0f766e] focus:bg-white text-[13px] rounded outline-none transition-all placeholder:text-[#94a3b8]"
            />
            <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0f172a]"
                aria-label="검색어 지우기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-gray-600 hover:text-black border border-gray-200 rounded"
            aria-label="모바일 메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Strict Single Category Horizontal Navigation */}
      <div className="border-t border-[#e2e8f0] bg-[#fafafa]">
        <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
          <nav className="hidden sm:flex items-center gap-2 -mb-px py-1">
            {navItems.map((item) => {
              const isActive =
                (item.page === "home" && currentPage === "home" && !searchQuery) ||
                (item.page.startsWith("category-") && currentPage === item.page);

              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => {
                    onSearch("");
                    onNavigate(item.page);
                  }}
                  className={`px-4 py-2 text-[14px] font-semibold border-b-2 transition-all cursor-pointer ${
                    isActive
                      ? "border-[#0f766e] text-[#0f766e] bg-white"
                      : "border-transparent text-[#475569] hover:text-[#0f172a] hover:bg-gray-100/60"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 3. Mobile Navigation Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-[#e2e8f0] bg-white px-4 py-3 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => {
                onSearch("");
                onNavigate(item.page);
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-[14px] font-semibold text-[#0f172a] hover:bg-[#f1f5f9] rounded transition-colors"
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-[#e2e8f0] flex flex-wrap gap-2 text-[12px] text-[#64748b]">
            <button
              type="button"
              onClick={() => {
                onNavigate("about");
                setIsMobileMenuOpen(false);
              }}
              className="p-1 hover:text-[#0f766e]"
            >
              소개
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                onNavigate("contact");
                setIsMobileMenuOpen(false);
              }}
              className="p-1 hover:text-[#0f766e]"
            >
              문의하기
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => {
                onNavigate("privacy");
                setIsMobileMenuOpen(false);
              }}
              className="p-1 hover:text-[#0f766e]"
            >
              개인정보처리방침
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
