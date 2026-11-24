import React, { useState } from "react";
import { Mail, CheckCircle2, Clock, Copy } from "lucide-react";

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
    <div className="max-w-[840px] mx-auto text-left py-4 font-sans pb-14">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12.5px] text-[#64748B] mb-5">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="hover:text-[#0F766E] transition-colors cursor-pointer"
        >
          홈
        </button>
        <span className="text-[#CBD5E1]">/</span>
        <span className="text-[#0F172A] font-medium">문의하기</span>
      </nav>

      {/* Main Header */}
      <header className="pb-6 border-b border-[#E2E8F0] mb-8">
        <p className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#0F766E] mb-2">
          Contact &amp; Editorial Corrections
        </p>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-3">
          문의하기 및 오류 정정 접수
        </h1>
        <p className="text-[15px] leading-[1.75] text-[#475569] break-keep">
          버진로드(virginroad.kr)는 생활가전 관리 매뉴얼과 진단 도구의 정확성을 최우선으로 검증합니다. 콘텐츠 오류 정정 제보, 개인정보 관련 요청 및 운영 문의는 아래 공식 이메일로 접수해 주시면 영업일 기준 24~48시간 이내에 검토 후 회신합니다.
        </p>
      </header>

      {/* Core Contact Card */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 sm:p-7 mb-8">
        <h2 className="text-[17px] font-bold text-[#0F172A] mb-2 flex items-center gap-2">
          <Mail className="w-4.5 h-4.5 text-[#0F766E]" />
          <span>공식 수신 이메일</span>
        </h2>
        <p className="text-[13.5px] text-[#475569] mb-5 leading-relaxed">
          자동 스팸 차단과 안전한 회신을 위해 별도 회원 가입 없이 직접 발송 가능한 공식 이메일 창구를 운영합니다.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white border border-[#E2E8F0] rounded-lg">
          <div>
            <div className="text-[11.5px] font-bold text-[#64748B] uppercase tracking-wider mb-1">
              버진로드 기술편집팀 수신처
            </div>
            <a
              href={`mailto:${contactEmail}`}
              className="text-[18px] sm:text-[20px] font-mono font-bold text-[#0F766E] hover:underline"
            >
              {contactEmail}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 text-[13px] font-semibold bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                  <span>복사 완료</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#64748B]" />
                  <span>주소 복사</span>
                </>
              )}
            </button>
            <a
              href={`mailto:${contactEmail}`}
              className="px-4 py-2 text-[13px] font-semibold bg-[#0F766E] hover:bg-[#115E59] text-white rounded-lg transition-colors"
            >
              메일 쓰기
            </a>
          </div>
        </div>
      </div>

      {/* Response Policy Table */}
      <div className="space-y-6">
        <h2 className="text-[19px] font-bold text-[#0F172A]">접수 유형 및 처리 기준</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-[#E2E8F0] text-[13.5px]">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#0F172A] font-bold">
                <th className="p-3.5 border border-[#E2E8F0] w-[28%]">문의 분류</th>
                <th className="p-3.5 border border-[#E2E8F0] w-[47%]">주요 내용</th>
                <th className="p-3.5 border border-[#E2E8F0] w-[25%]">예상 처리 시간</th>
              </tr>
            </thead>
            <tbody className="text-[#334155]">
              <tr>
                <td className="p-3.5 font-semibold border border-[#E2E8F0]">매뉴얼 오류 및 정정 제보</td>
                <td className="p-3.5 border border-[#E2E8F0]">세척 주기, 에러 코드, 제조사 규격 및 전력 계산식 정정</td>
                <td className="p-3.5 border border-[#E2E8F0] text-[#0F766E] font-semibold">24시간 이내 검토</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold border border-[#E2E8F0]">개인정보 및 광고 정책</td>
                <td className="p-3.5 border border-[#E2E8F0]">쿠키 설정 안내, 이용자 권리 행사 및 정책 관련 문의</td>
                <td className="p-3.5 border border-[#E2E8F0]">영업일 24~48시간</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold border border-[#E2E8F0]">기술적 오류 보고</td>
                <td className="p-3.5 border border-[#E2E8F0]">페이지 로딩 장애, 모바일 화면 깨짐, 링크 오류 제보</td>
                <td className="p-3.5 border border-[#E2E8F0]">영업일 24시간 이내</td>
              </tr>
              <tr>
                <td className="p-3.5 font-semibold border border-[#E2E8F0]">자료 인용 및 협업 제안</td>
                <td className="p-3.5 border border-[#E2E8F0]">가이드 원문 출처 인용 및 기술 자료 제공 협업</td>
                <td className="p-3.5 border border-[#E2E8F0]">영업일 48시간 이내</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl text-[13.5px] text-[#475569] space-y-2">
          <h3 className="font-bold text-[#0F172A] text-[14.5px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#0F766E]" />
            <span>운영 시간 및 개인정보 보호</span>
          </h3>
          <ul className="list-disc list-inside space-y-1.5 pl-1 leading-relaxed">
            <li>운영 시간: 평일 09:30 ~ 18:30 (주말 및 공휴일 접수분은 다음 영업일에 순차 회신합니다.)</li>
            <li>정정 원칙: 제조사 공식 매뉴얼이나 공공 안전 기준에 어긋나는 내용이 확인되면 즉시 수정합니다.</li>
            <li>개인정보 보호: 문의 메일 주소와 본문 내용은 회신 목적 외 제3자에게 제공하지 않으며 처리 완료 후 파기합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
