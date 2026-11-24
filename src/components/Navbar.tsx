import { useState } from "react";
import { Search, X, Menu } from "lucide-react";

interface NavbarProps {
  onSearch: (query: string) => void;
  onNavigate: (page: string) => void;
  searchQuery?: string;
  currentPage?: string;
}

export function Navbar({
  onSearch,
  onNavigate,
  searchQuery = "",
  currentPage = "home",
}: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const goHome = () => {
    onSearch("");
    onNavigate("home");
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { label: "홈", page: "home" },
    { label: "가전 매뉴얼", page: "category-신혼가전" },
    { label: "전기요금 계산기", page: "tool-power-cost" },
    { label: "필터 진단기", page: "tool-filter-cycle" },
    { label: "소개", page: "about" },
  ];

  const handleNavClick = (page: string) => {
    onSearch("");
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="w-full bg-white border-b border-[#E2E8F0] font-sans sticky top-0 z-40">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={goHome}
          className="flex items-center gap-2.5 cursor-pointer shrink-0 whitespace-nowrap group"
        >
          <img
            src="/icon.svg"
            alt="버진로드"
            width={30}
            height={30}
            className="w-7.5 h-7.5 rounded-md shrink-0"
          />
          <span className="text-[19px] font-black text-[#0F172A] tracking-tight group-hover:text-[#0F766E] transition-colors">
            버진로드
          </span>
        </button>

        {/* Zone 2: Primary Navigation (Desktop) */}
        <nav aria-label="주 메뉴" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              (item.page === "home" && currentPage === "home" && !searchQuery) ||
              (item.page !== "home" && currentPage === item.page);

            return (
              <button
                key={item.page}
                type="button"
                onClick={() => handleNavClick(item.page)}
                className={`px-3 py-2 text-[14px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 rounded-md ${
                  isActive
                    ? "text-[#0F766E] bg-[#F0FDFA]"
                    : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search Input & Mobile Drawer Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative w-[170px] sm:w-[220px] lg:w-[240px]">
            <input
              type="search"
              placeholder="가전·증상 검색"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="가전 매뉴얼 검색"
              className="w-full h-9 pl-8 pr-7 bg-[#F8FAFC] border border-[#CBD5E1] focus:border-[#0F766E] focus:bg-white text-[13px] text-[#0F172A] rounded-lg outline-none transition-colors placeholder:text-[#94A3B8]"
            />
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                aria-label="검색어 지우기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] rounded-lg cursor-pointer"
            aria-label="메뉴 열기"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              (item.page === "home" && currentPage === "home" && !searchQuery) ||
              (item.page !== "home" && currentPage === item.page);
            return (
              <button
                key={item.page}
                type="button"
                onClick={() => handleNavClick(item.page)}
                className={`w-full text-left py-2.5 px-3 text-[14px] font-semibold rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#F0FDFA] text-[#0F766E]"
                    : "text-[#0F172A] hover:bg-[#F8FAFC]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2.5 mt-2 border-t border-[#E2E8F0] flex flex-wrap gap-3 px-3 text-[12.5px] text-[#64748B]">
            <button
              type="button"
              onClick={() => handleNavClick("policy")}
              className="hover:text-[#0F766E] cursor-pointer"
            >
              안전·검증 기준
            </button>
            <button
              type="button"
              onClick={() => handleNavClick("contact")}
              className="hover:text-[#0F766E] cursor-pointer"
            >
              문의하기
            </button>
            <button
              type="button"
              onClick={() => handleNavClick("privacy")}
              className="hover:text-[#0F766E] cursor-pointer"
            >
              개인정보처리방침
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
