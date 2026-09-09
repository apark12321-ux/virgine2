interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#f9fafb] border-t border-[#e5e7eb] mt-16 font-sans text-left" id="blog-footer">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 pb-8 border-b border-[#e5e7eb]">
          {/* 1. Blog Info */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[16px] text-[#111827]">버진로드 (Virginroad)</span>
              <span className="text-[11px] bg-rose-50 text-rose-600 font-semibold px-1.5 py-0.2 rounded border border-rose-200">
                공식 블로그
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#6b7280] max-w-md break-keep">
              2026년 신혼부부의 주거 독립과 금융·가전·결혼준비를 체계적으로 연구하고 기록하는 실전 정보 블로그입니다.
            </p>
            <div className="text-[12px] text-[#9ca3af] pt-2 space-y-1">
              <p>운영사: 상상아트 | 대표자: 박아람 | 사업자등록번호: 272-14-01256</p>
              <p>통신판매업신고: 제2023-화성동탄-1098호 | 이메일: <a href="mailto:apark12321@gmail.com" className="text-gray-700 hover:underline">apark12321@gmail.com</a></p>
            </div>
          </div>

          {/* 2. Menu Links */}
          <div className="md:col-span-3">
            <h4 className="text-[13px] font-bold text-[#111827] mb-3">주요 카테고리</h4>
            <ul className="space-y-1.5 text-[13px] text-[#6b7280]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-신혼금융")}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  신혼금융 (대출·청약)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-신혼가전")}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  신혼가전 (패키지·인테리어)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-결혼준비")}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  결혼준비 (스드메·웨딩홀)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("policy")}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  2026 정부 정책 허브
                </button>
              </li>
            </ul>
          </div>

          {/* 3. Policy & Legal */}
          <div className="md:col-span-3">
            <h4 className="text-[13px] font-bold text-[#111827] mb-3">블로그 정보 및 약관</h4>
            <ul className="space-y-1.5 text-[13px] text-[#6b7280]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("privacy")}
                  className="font-bold text-gray-800 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  개인정보 처리방침
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("terms")}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  이용약관 및 면책고지
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("about")}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  블로그 소개 및 편집원칙
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("announcement")}
                  className="hover:text-rose-600 transition-colors cursor-pointer"
                >
                  공지사항
                </button>
              </li>
              <li>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-rose-600 transition-colors"
                >
                  사이트맵 (Sitemap)
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-[12px] text-[#9ca3af] gap-2">
          <div>
            Copyright &copy; {currentYear} <strong>버진로드(Virginroad)</strong>. All rights reserved.
          </div>
          <div>
            Designed with Tistory Editorial Clean Blog Skin
          </div>
        </div>
      </div>
    </footer>
  );
}
