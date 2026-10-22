import React, { useState } from "react";
import { Mail, CheckCircle2, Shield, Clock, HelpCircle, AlertCircle, Copy } from "lucide-react";

interface ContactPageProps {
  onNavigate: (page: string) => void;
}

export function ContactPage({ onNavigate }: ContactPageProps) {
  const [copied, setCopied] = useState(false);
  const contactEmail = "apark12321@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(contactEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-[840px] mx-auto text-left py-6 px-4 sm:px-0 font-sans">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-[#64748b] mb-6">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="hover:text-[#0f766e] transition-colors cursor-pointer"
        >
          홈
        </button>
        <span>&gt;</span>
        <span className="text-[#0f172a] font-medium">문의하기</span>
      </nav>

      {/* Main Header */}
      <header className="pb-6 border-b border-[#e2e8f0] mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#f0fdfa] border border-[#ccfbf1] text-[#0f766e] text-xs font-bold mb-3">
          <Mail className="w-3.5 h-3.5" />
          <span>공식 문의 창구 및 오류 정정 접수</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight mb-3">
          문의하기 (Contact Us)
        </h1>
        <p className="text-[15px] leading-relaxed text-[#475569]">
          버진로드(Virginroad)는 가전 관리 매뉴얼 및 생활 가이드의 정확성을 최우선으로 검증합니다. 콘텐츠 정정 제보, 제휴 및 운영 문의는 아래 공식 이메일 창구로 접수해 주시면 영업일 기준 24~48시간 이내에 상세히 검토 후 회신해 드립니다.
        </p>
      </header>

      {/* Core Contact Card */}
      <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-lg p-6 sm:p-8 mb-8">
        <h2 className="text-lg font-bold text-[#0f172a] mb-2 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#0f766e]" />
          <span>공식 이메일 안내</span>
        </h2>
        <p className="text-[14px] text-[#475569] mb-5 leading-relaxed">
          스팸 방지 및 시스템 안정성을 위해 웹 제출 폼 대신 직접 확인 가능한 이메일 전송 방식을 운영하고 있습니다.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-[#e2e8f0] rounded-md">
          <div>
            <div className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1">
              편집국 공식 수신 이메일
            </div>
            <a
              href={`mailto:${contactEmail}`}
              className="text-lg sm:text-xl font-mono font-bold text-[#0f766e] hover:underline"
            >
              {contactEmail}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#64748b]" />
                  <span>이메일 주소 복사</span>
                </>
              )}
            </button>
            <a
              href={`mailto:${contactEmail}`}
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-[#0f766e] hover:bg-[#115e59] text-white rounded transition-colors cursor-pointer"
            >
              메일 쓰기
            </a>
          </div>
        </div>
      </div>

      {/* Information & Response Policy Table */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-[#0f172a]">접수 유형 및 처리 안내</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#cbd5e1] text-[13.5px]">
            <thead>
              <tr className="bg-[#f1f5f9] text-[#0f172a] font-bold border-b border-[#cbd5e1]">
                <th className="p-3 border-r border-[#cbd5e1] w-[28%]">문의 분류</th>
                <th className="p-3 border-r border-[#cbd5e1] w-[47%]">주요 내용</th>
                <th className="p-3 w-[25%]">예상 처리 시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] text-[#334155]">
              <tr className="hover:bg-[#f8fafc]">
                <td className="p-3 font-semibold border-r border-[#e2e8f0]">콘텐츠 오류 및 정정 제보</td>
                <td className="p-3 border-r border-[#e2e8f0]">가전제품 사용 매뉴얼, 세척 주기, 제조사 공식 규격 오류 정정</td>
                <td className="p-3 text-emerald-700 font-medium">24시간 이내 즉시 검토</td>
              </tr>
              <tr className="hover:bg-[#f8fafc]">
                <td className="p-3 font-semibold border-r border-[#e2e8f0]">개인정보 및 애드센스 정책</td>
                <td className="p-3 border-r border-[#e2e8f0]">쿠키 수집 동의 철회, 이용자 권리 행사, 광고 정책 관련 문의</td>
                <td className="p-3">영업일 기준 24~48시간</td>
              </tr>
              <tr className="hover:bg-[#f8fafc]">
                <td className="p-3 font-semibold border-r border-[#e2e8f0]">사이트 기술적 결함 보고</td>
                <td className="p-3 border-r border-[#e2e8f0]">페이지 로딩 장애, 모바일 렌더링 깨짐, 링크 오류 제보</td>
                <td className="p-3">영업일 기준 24시간 이내</td>
              </tr>
              <tr className="hover:bg-[#f8fafc]">
                <td className="p-3 font-semibold border-r border-[#e2e8f0]">원고 인용 및 라이선스 제휴</td>
                <td className="p-3 border-r border-[#e2e8f0]">전문 가이드 원문 인용 출처 승인 및 제휴 제안</td>
                <td className="p-3">영업일 기준 48시간 이내</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Operating Guideline Notice */}
        <div className="p-5 bg-white border border-[#e2e8f0] rounded-lg text-[13.5px] text-[#475569] space-y-2 mt-6">
          <h3 className="font-bold text-[#0f172a] text-[14.5px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#0f766e]" />
            <span>운영 시간 및 원칙</span>
          </h3>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>운영 시간: 평일 09:30 ~ 18:30 (주말 및 공휴일 접수분은 다음 영업일에 순차 처리됩니다.)</li>
            <li>정정보도 원칙: 제조사(삼성전자, LG전자 등) 및 정부 공공기관의 공식 매뉴얼에 위배되는 오류가 확인될 경우, 수정 이력을 해당 글 상단에 명확히 표기합니다.</li>
            <li>개인정보 보호: 문의 접수 시 송신된 이메일 주소 및 내용은 질의 답변 목적 외에 제3자에게 제공되지 않으며, 사안 종결 시 파기됩니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
