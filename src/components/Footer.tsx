import React from "react";
import { Mail, ShieldCheck, BookOpen, ExternalLink } from "lucide-react";

interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#f8fafc] border-t border-[#e2e8f0] mt-16 font-sans text-left" id="blog-footer">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 pb-8 border-b border-[#e2e8f0]">
          {/* 1. Blog Mission & Entity Information */}
          <div className="md:col-span-6 space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[16px] text-[#0f172a]">버진로드 (Virginroad)</span>
              <span className="text-[11px] bg-[#f0fdfa] text-[#0f766e] font-semibold px-2 py-0.5 rounded border border-[#ccfbf1]">
                가전 관리 매뉴얼 센터
              </span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-[#475569] max-w-lg break-keep">
              신혼가전 및 생활가전의 올바른 사용법, 주기별 필터 세척·교체, 고장 예방 점검 요령, 전력 효율 가이드를 전문 기술 매뉴얼 형태로 체계적으로 정리하여 제공합니다.
            </p>
            <div className="text-[12px] text-[#64748b] pt-2 space-y-1">
              <p>운영 주체: 버진로드 편집국 | 기술 매뉴얼 및 생활 가이드 연구팀</p>
              <p>
                공식 이메일:{" "}
                <a href="mailto:apark12321@gmail.com" className="text-[#0f766e] hover:underline font-mono">
                  apark12321@gmail.com
                </a>
              </p>
              <p>원문 출처: 한국소비자원, 산업통상자원부 에너지효율 가이드, 제조사 공식 사용설명서 규격 준수</p>
            </div>
          </div>

          {/* 2. Core Category Navigation */}
          <div className="md:col-span-3">
            <h4 className="text-[13px] font-bold text-[#0f172a] mb-3 uppercase tracking-wider">
              핵심 매뉴얼
            </h4>
            <ul className="space-y-2 text-[13px] text-[#475569]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("home")}
                  className="hover:text-[#0f766e] transition-colors cursor-pointer"
                >
                  전체 매뉴얼 목록 (Home)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("category-신혼가전")}
                  className="hover:text-[#0f766e] transition-colors cursor-pointer font-medium"
                >
                  가전 관리 매뉴얼
                </button>
              </li>
            </ul>
          </div>

          {/* 3. Mandatory Trust & Legal 3 Pages (About, Contact, Privacy) */}
          <div className="md:col-span-3">
            <h4 className="text-[13px] font-bold text-[#0f172a] mb-3 uppercase tracking-wider">
              신뢰도 및 정책 (Policies)
            </h4>
            <ul className="space-y-2 text-[13px] text-[#475569]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("about")}
                  className="hover:text-[#0f766e] transition-colors cursor-pointer"
                >
                  사이트 소개 및 편집원칙 (About Us)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("contact")}
                  className="hover:text-[#0f766e] font-semibold text-[#0f766e] transition-colors cursor-pointer"
                >
                  문의하기 (Contact Us)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("privacy")}
                  className="hover:text-[#0f766e] font-semibold text-[#0f172a] transition-colors cursor-pointer"
                >
                  개인정보처리방침 (Privacy Policy)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("terms")}
                  className="hover:text-[#0f766e] transition-colors cursor-pointer"
                >
                  이용약관 및 면책고지 (Terms)
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[12px] text-[#94a3b8]">
          <p>
            &copy; {currentYear} 버진로드 (virginroad.kr). All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0f766e]" />
              구글 애드센스 프로그램 정책 및 웹마스터 품질 가이드라인 준수
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
