import { useState, useEffect } from "react";
import { Search, X, Menu, BookOpen, Calculator, User, Globe } from "lucide-react";

interface NavbarProps {
  onSearch: (query: string) => void;
  onNavigate: (page: string) => void;
  onOpenSearchConsole?: () => void;
  searchQuery?: string;
  currentPage?: string;
}

export function Navbar({ onSearch, onNavigate, onOpenSearchConsole, searchQuery = "", currentPage = "home" }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goHome = () => {
    onSearch("");
    onNavigate("home");
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: "전체글", page: "home" },
    { label: "소개", page: "about" },
    { label: "신혼금융", page: "category-신혼금융" },
    { label: "신혼가전", page: "category-신혼가전" },
    { label: "결혼준비", page: "category-결혼준비" },
    { label: "정책정보", page: "policy" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md transition-all duration-200 ${
          isScrolled ? "border-b border-[#E2E8F0] shadow-xs" : "border-b border-[#F1F5F9]"
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[64px] sm:h-[70px]">
            {/* 1. Blog Title & Author Identity Logo */}
            <button
              onClick={goHome}
              className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer"
              id="site-logo"
              aria-label="버진로드 블로그 홈"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E1B2E] to-[#332D4E] flex items-center justify-center text-white font-bold text-[18px] shadow-xs shrink-0">
                V
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-heading text-[20px] sm:text-[22px] font-black tracking-tight text-[#111827]">
                    버진로드
                  </span>
                  <span className="text-[11px] font-extrabold text-[#E8745F] bg-[#EEF0FB] px-1.5 py-0.5 rounded tracking-wider uppercase">
                    BLOG
                  </span>
                </div>
                <span className="text-[11px] sm:text-[12px] font-medium text-[#64748B] mt-1 tracking-tight">
                  신혼부부 금융·청약·가전 실전 가이드
                </span>
              </div>
            </button>

            {/* 2. Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const isActive =
                  (item.page === "home" && currentPage === "home") ||
                  (item.page.startsWith("category-") && currentPage === item.page) ||
                  (item.page === "policy" && currentPage === "policy") ||
                  (item.page === "about" && currentPage === "about");

                return (
                  <button
                    key={item.page}
                    onClick={() => {
                      onNavigate(item.page);
                      if (item.page === "home") onSearch("");
                    }}
                    className={`px-3.5 py-2 text-[14.5px] font-semibold rounded-lg transition-all cursor-pointer ${
                      isActive
                        ? "text-[#1E1B2E] bg-[#F1F5F9] font-bold"
                        : "text-[#475569] hover:text-[#1E1B2E] hover:bg-[#F8FAFC]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* 3. Search & Quick Tool */}
            <div className="flex items-center gap-2">
              {/* Search Bar / Trigger */}
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  placeholder="블로그 내 검색..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-[180px] lg:w-[220px] h-9 pl-8 pr-3 bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#1E1B2E] focus:bg-white text-[13px] rounded-full outline-none transition-all placeholder:text-[#94A3B8]"
                />
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => onSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="sm:hidden p-2 text-[#475569] hover:text-[#1E1B2E] rounded-lg"
                aria-label="검색창 열기"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Calculator Shortcut */}
              <button
                onClick={() => onNavigate("tools-didimdol")}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold text-[#5B21B6] bg-[#F5F3FF] hover:bg-[#EDE9FE] border border-[#DDD6FE] rounded-lg transition-colors cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>금리 계산기</span>
              </button>

              {/* Google Search Console Auto Indexing Shortcut */}
              {onOpenSearchConsole && (
                <button
                  onClick={onOpenSearchConsole}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold text-[#1E1B2E] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer"
                  title="구글 서치 콘솔 자동 등록 및 색인 관리"
                >
                  <Globe className="w-3.5 h-3.5 text-[#E8745F]" />
                  <span>서치콘솔 색인</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-[#475569] hover:text-[#1E1B2E] rounded-lg"
                aria-label="메뉴 열기"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Dropdown */}
          {isSearchOpen && (
            <div className="sm:hidden pb-3 pt-1 border-t border-[#F1F5F9]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="포스팅 검색어 입력..."
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-8 bg-[#F8FAFC] border border-[#E2E8F0] text-[14px] rounded-lg outline-none"
                  autoFocus
                />
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => onSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Nav Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  onNavigate(item.page);
                  setIsMobileMenuOpen(false);
                  if (item.page === "home") onSearch("");
                }}
                className="w-full text-left px-3 py-2.5 text-[15px] font-semibold text-[#1E1B2E] hover:bg-[#F8FAFC] rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 mt-3 border-t border-[#F1F5F9] flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onNavigate("tools-didimdol");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-center text-[13px] font-bold text-[#5B21B6] bg-[#F5F3FF] rounded-lg"
                >
                  디딤돌 금리 계산기
                </button>
                <button
                  onClick={() => {
                    onNavigate("tools-cheongyak");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 text-center text-[13px] font-bold text-[#5B21B6] bg-[#F5F3FF] rounded-lg"
                >
                  청약 가점 계산기
                </button>
              </div>
              {onOpenSearchConsole && (
                <button
                  onClick={() => {
                    onOpenSearchConsole();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center text-[13px] font-bold text-[#1E1B2E] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Globe className="w-4 h-4 text-[#E8745F]" />
                  <span>구글 서치 콘솔 자동 색인 관리</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
