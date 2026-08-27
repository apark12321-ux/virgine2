interface FooterProps {
  onNavigate: (page: string) => void;
  onOpenSearchConsole?: () => void;
}

export function Footer({ onNavigate, onOpenSearchConsole }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] mt-20" id="site-footer">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
          {/* 1. Blog & Author Identity */}
          <div className="md:col-span-6 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1E1B2E] text-white flex items-center justify-center font-bold text-[15px]">
                V
              </div>
              <span className="text-[18px] font-black text-[#111827] tracking-tight">
                버진로드 (Virginroad)
              </span>
              <span className="text-[11px] font-semibold text-[#E8745F] bg-[#EEF0FB] px-2 py-0.5 rounded">
                정보 블로그
              </span>
            </div>

            <p className="text-[13.5px] leading-relaxed text-[#475569] max-w-md break-keep">
              신혼부부 대출 팁부터 청약 가점, 혼수가전 견적 노하우까지 실속 있는 결혼·주거 정보를 편하게 찾아볼 수 있는 블로그입니다.
            </p>

            <div className="pt-1 text-[12px] text-[#64748B] space-y-1">
              <p>운영: 상상아트 | 대표자: 박아람 | 사업자등록번호: 272-14-01256</p>
              <p>통신판매업 신고번호: 제2023-화성동탄-1098호 | 문의: <a href="mailto:apark12321@gmail.com" className="text-[#1E1B2E] font-medium hover:underline">apark12321@gmail.com</a></p>
            </div>
          </div>

          {/* 2. Quick Navigation */}
          <div className="md:col-span-3">
            <h4 className="text-[12px] font-bold text-[#1E1B2E] uppercase tracking-wider mb-3.5">
              주요 카테고리
            </h4>
            <ul className="space-y-2 text-[13.5px] text-[#475569]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-신혼금융")}
                  className="hover:text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  💰 신혼금융 (대출·청약·세무)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-신혼가전")}
                  className="hover:text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  🏠 신혼가전 (패키지·가구·인테리어)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-결혼준비")}
                  className="hover:text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  💍 결혼준비 (스드메·웨딩홀·타임라인)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("policy")}
                  className="hover:text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  📋 정부 정책정보 한눈에 보기
                </button>
              </li>
            </ul>
          </div>

          {/* 3. Site Navigation & Info */}
          <div className="md:col-span-3">
            <h4 className="text-[12px] font-bold text-[#1E1B2E] uppercase tracking-wider mb-3.5">
              안내
            </h4>
            <ul className="space-y-2 text-[13.5px] text-[#475569]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("privacy")}
                  className="hover:text-[#1E1B2E] font-semibold text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  개인정보 처리방침
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("terms")}
                  className="hover:text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  이용약관 및 면책고지
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("announcement")}
                  className="hover:text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  공지사항
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("partnership")}
                  className="hover:text-[#1E1B2E] transition-colors cursor-pointer"
                >
                  제휴 및 비즈니스 문의
                </button>
              </li>
              {onOpenSearchConsole && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenSearchConsole}
                    className="hover:text-[#E8745F] text-[#64748B] font-medium transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>🔍 구글 서치 콘솔 색인 현황</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer (AdSense & Legal Compliance) */}
        <div className="pt-8 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-[#64748B]">
          <p className="break-keep text-center sm:text-left">
            © {currentYear} 버진로드 (Virginroad). All rights reserved. 본 블로그의 콘텐츠는 저작권법의 보호를 받으며 무단 전재 및 재배포를 금합니다.
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("privacy")}
              className="hover:underline"
            >
              개인정보처리방침
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate("terms")}
              className="hover:underline"
            >
              이용약관
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
