import React from "react";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full bg-[#F8FAFC] border-t border-[#E2E8F0] mt-16 font-sans text-left"
      id="blog-footer"
    >
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 pb-8 border-b border-[#E2E8F0]">
          {/* Entity & Editorial Mission */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="flex items-center gap-2">
              <img
                src="/icon.svg"
                alt="버진로드"
                width={22}
                height={22}
                className="w-5.5 h-5.5 rounded"
              />
              <span className="font-extrabold text-[16px] text-[#0F172A]">
                버진로드 (virginroad.kr)
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#475569] max-w-md break-keep">
              생활가전 및 신혼가전의 올바른 사용법, 주기별 필터 세척·교체, 에러 코드 자가 진단, 전력 효율 계산을 공식 기술 규격에 근거해 정리하는 독립 가전 관리 매뉴얼 아카이브입니다.
            </p>
            <div className="text-[12px] text-[#64748B] pt-2 space-y-1">
              <p>운영: 버진로드 생활가전 기술편집팀</p>
              <p>
                문의:{" "}
                <a
                  href="mailto:apark12321@gmail.com"
                  className="text-[#0F766E] hover:underline font-mono"
                >
                  apark12321@gmail.com
                </a>
              </p>
            </div>
          </div>

          {/* Archive & Tools Navigation */}
          <div className="md:col-span-3">
            <h4 className="text-[12.5px] font-bold text-[#0F172A] mb-3 uppercase tracking-wider">
              매뉴얼 및 진단 도구
            </h4>
            <ul className="space-y-2 text-[13px] text-[#475569]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("home")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  전체 매뉴얼 아카이브
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-신혼가전")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  가전 관리 매뉴얼 목록
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("tool-power-cost")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  월간 전기요금 누진제 계산기
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("tool-filter-cycle")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  필터·소모품 교체 주기 진단기
                </button>
              </li>
            </ul>
          </div>

          {/* Policies & Trust Pages */}
          <div className="md:col-span-4">
            <h4 className="text-[12.5px] font-bold text-[#0F172A] mb-3 uppercase tracking-wider">
              운영 원칙 및 정책
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[13px] text-[#475569]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("about")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  사이트 소개 및 편집원칙
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("policy")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  안전·효율 기준 및 검증 정책
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("contact")}
                  className="hover:text-[#0F766E] font-medium text-[#0F172A] transition-colors cursor-pointer"
                >
                  문의 및 오류 정정 접수
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("privacy")}
                  className="hover:text-[#0F766E] font-medium text-[#0F172A] transition-colors cursor-pointer"
                >
                  개인정보처리방침
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("terms")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  이용약관 및 면책고지
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("announcement")}
                  className="hover:text-[#0F766E] transition-colors cursor-pointer"
                >
                  업데이트 이력 및 공지
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[12px] text-[#64748B]">
          <p>&copy; {currentYear} 버진로드 (virginroad.kr). All rights reserved.</p>
          <p>참고 규격: 한국소비자원 · 한국전기안전공사 · 한국전력공사 · 제조사 공식 서비스 매뉴얼</p>
        </div>
      </div>
    </footer>
  );
}
