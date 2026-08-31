import React from "react";
import {
  Heart,
  ShieldCheck,
  Award,
  BookOpen,
  Mail,
  MapPin,
  FileText,
  HelpCircle,
  TrendingUp,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck
} from "lucide-react";

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="max-w-[920px] mx-auto space-y-10 pb-16 animate-fade-in">
      {/* 1. Hero Persona Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#FFF1EE] via-[#F8FAFC] to-transparent rounded-full -mr-20 -mt-20 pointer-events-none opacity-80" />

        <div className="relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FFF1EE] border border-[#FFDCD4] text-[#E8745F] text-[12.5px] font-extrabold rounded-full">
            <Heart className="w-3.5 h-3.5 fill-[#E8745F]" />
            <span>신혼 5년 차 실전 기록자의 진심 담긴 블로그</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-2">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#1E1B2E] via-[#2A243E] to-[#40375E] text-white flex items-center justify-center font-black text-[32px] sm:text-[38px] shadow-md shrink-0 border-2 border-white">
              V
            </div>
            <div>
              <h1 className="text-[26px] sm:text-[34px] font-black text-[#111827] tracking-tight leading-tight">
                "피 같은 돈과 시간을 아껴드리는<br className="hidden sm:inline" /> 100% 실전 신혼 나침반"
              </h1>
              <p className="text-[15px] sm:text-[16px] text-[#475569] font-medium mt-2">
                버진로드(Virginroad) 대표 에디터 &middot; 박아람 올림
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-[14.5px] leading-relaxed text-[#334155] space-y-3">
            <p>
              안녕하세요, 버진로드를 찾아주신 예비·신혼부부 여러분 반갑습니다.
            </p>
            <p>
              저 역시 몇 해 전 결혼을 준비하며 매일 밤 한숨을 쉬던 평범한 신혼부부였습니다. 
              포털을 검색하면 온통 광고와 홍보성 스드메 후기뿐이었고, 정부 정책 대출(디딤돌·버팀목)은 은행 창구마다 담당 직원마다 말이 달라 혼란스러웠습니다.
            </p>
            <p className="font-semibold text-[#1E1B2E]">
              실제로 자산 심사 서류 하나를 잘못 챙겨 디딤돌 대출이 반려될 뻔했고, 하마터면 피 같은 전세계약금 수천만 원을 날릴 뻔했던 아찔한 순간도 겪었습니다.
            </p>
            <p>
              버진로드는 바로 그 <strong>'지독했던 시행착오와 수많은 발품'</strong> 속에서 탄생했습니다. 기계적인 복사-붙여넣기 글이나 영혼 없는 정보 나열 대신, <strong>직접 계약서에 도장 찍고 영수증을 결제하며 체득한 살아있는 팩트</strong>만을 기록합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 2. E-E-A-T Editorial Philosophy */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-2 text-[#E8745F] text-[13px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Google E-E-A-T 기반 작성 원칙</span>
          </div>
          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-[#111827] mt-1">
            버진로드가 독자 여러분과 약속하는 4가지 원칙
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-[#F1F5F9] space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFF1EE] text-[#E8745F] flex items-center justify-center font-bold text-[14px]">
                01
              </div>
              <h3 className="text-[16px] font-bold text-[#111827]">
                Experience (직접 겪은 실전 경험)
              </h3>
            </div>
            <p className="text-[13.5px] text-[#64748B] leading-relaxed">
              단순히 기사나 공고문을 요약하지 않습니다. 직접 은행 3곳을 돌며 상담받고, 가전 오픈점 견적을 깎아보며 겪은 1인칭 실전 경험담을 바탕으로 작성합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-[#F1F5F9] space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-[14px]">
                02
              </div>
              <h3 className="text-[16px] font-bold text-[#111827]">
                Expertise (정부 공식 팩트체크)
              </h3>
            </div>
            <p className="text-[13.5px] text-[#64748B] leading-relaxed">
              국토교통부, 주택도시기금(기금e든든), 한국주택금융공사(HF), LH 청약플러스의 최신 고시 지침과 금리 개정안을 철저히 대조하여 정확한 수치만 전달합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-[#F1F5F9] space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold text-[14px]">
                03
              </div>
              <h3 className="text-[16px] font-bold text-[#111827]">
                Authoritativeness (실패담 & 단점 공개)
              </h3>
            </div>
            <p className="text-[13.5px] text-[#64748B] leading-relaxed">
              "무조건 좋다"는 무책임한 추천을 지양합니다. "이 옵션은 돈 낭비였다", "이 특약은 반드시 넣어야 한다" 등 실제 겪은 실패와 단점까지 투명하게 공개합니다.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#FAFAFC] border border-[#F1F5F9] space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold text-[14px]">
                04
              </div>
              <h3 className="text-[16px] font-bold text-[#111827]">
                Trustworthiness (투명한 소통)
              </h3>
            </div>
            <p className="text-[13.5px] text-[#64748B] leading-relaxed">
              운영사 정보(상상아트)와 담당자 연락처를 전면에 공개하며, 독자 여러분이 남겨주신 질문이나 보완 요청을 확인하여 신속하게 포스팅에 반영합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Core Categories & Interactive Tools */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-2 text-[#5B21B6] text-[13px] font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>버진로드 주요 콘텐츠 & 무료 도구</span>
          </div>
          <h2 className="text-[22px] sm:text-[26px] font-extrabold text-[#111827] mt-1">
            결혼 준비의 모든 과정을 한눈에
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate("category-신혼금융")}
            className="p-5 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-white border border-[#E2E8F0] hover:border-[#1E1B2E] transition-all cursor-pointer group"
          >
            <div className="text-[20px] mb-2">💰</div>
            <h4 className="text-[16px] font-bold text-[#111827] group-hover:text-[#E8745F] transition-colors">
              신혼금융 & 정책대출
            </h4>
            <p className="text-[13px] text-[#64748B] mt-1.5 leading-relaxed">
              디딤돌·버팀목·신생아특례 대출 조건, 부부합산 소득 계산법, 0.1%p 우대금리 영끌 노하우
            </p>
          </div>

          <div
            onClick={() => onNavigate("category-신혼가전")}
            className="p-5 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-white border border-[#E2E8F0] hover:border-[#1E1B2E] transition-all cursor-pointer group"
          >
            <div className="text-[20px] mb-2">📺</div>
            <h4 className="text-[16px] font-bold text-[#111827] group-hover:text-[#E8745F] transition-colors">
              혼수 & 가전 견적
            </h4>
            <p className="text-[13px] text-[#64748B] mt-1.5 leading-relaxed">
              백화점 vs 로드샵 오픈점 체감가 비교, 다품목 패키지 할인 팁, 품목별 실사용 1년 솔직 후기
            </p>
          </div>

          <div
            onClick={() => onNavigate("category-결혼준비")}
            className="p-5 rounded-2xl bg-gradient-to-b from-[#F8FAFC] to-white border border-[#E2E8F0] hover:border-[#1E1B2E] transition-all cursor-pointer group"
          >
            <div className="text-[20px] mb-2">💍</div>
            <h4 className="text-[16px] font-bold text-[#111827] group-hover:text-[#E8745F] transition-colors">
              웨딩 & 청약 로드맵
            </h4>
            <p className="text-[13px] text-[#64748B] mt-1.5 leading-relaxed">
              스드메 추가금 방어법, 웨딩홀 견적 네고 요령, 신혼부부 특별공급 가점 계산 및 전략
            </p>
          </div>
        </div>

        {/* Quick Tools Callout */}
        <div className="p-5 sm:p-6 bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-[14px] font-bold text-[#5B21B6]">무료 금융 시뮬레이터</span>
            </div>
            <p className="text-[13px] text-[#6B21A8]">
              복잡한 우대금리와 청약 가점을 직접 계산해 보세요. 별도 로그인 없이 100% 무료 제공됩니다.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onNavigate("tools-didimdol")}
              className="px-3.5 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12.5px] font-bold rounded-xl transition-colors cursor-pointer"
            >
              디딤돌 계산기
            </button>
            <button
              onClick={() => onNavigate("tools-cheongyak")}
              className="px-3.5 py-2 bg-white hover:bg-[#F3E8FF] text-[#7C3AED] border border-[#DDD6FE] text-[12.5px] font-bold rounded-xl transition-colors cursor-pointer"
            >
              청약 가점 계산기
            </button>
          </div>
        </div>
      </div>

      {/* 4. Verified Business & Contact Information */}
      <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="border-b border-[#F1F5F9] pb-4">
          <div className="flex items-center gap-2 text-[#475569] text-[13px] font-bold uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>운영자 및 사업자 등록 정보</span>
          </div>
          <h2 className="text-[20px] sm:text-[24px] font-extrabold text-[#111827] mt-1">
            신뢰할 수 있는 공식 정보
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-8 text-[13.5px] text-[#475569]">
          <div className="flex items-start gap-2">
            <span className="font-bold text-[#1E1B2E] w-28 shrink-0">블로그 명칭:</span>
            <span>버진로드 (Virginroad)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-[#1E1B2E] w-28 shrink-0">운영사:</span>
            <span>상상아트 (Sangsang Art)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-[#1E1B2E] w-28 shrink-0">대표자 / 에디터:</span>
            <span>박아람</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-[#1E1B2E] w-28 shrink-0">사업자등록번호:</span>
            <span>272-14-01256</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-[#1E1B2E] w-28 shrink-0">통신판매업 신고:</span>
            <span>제2023-화성동탄-1098호</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-[#1E1B2E] w-28 shrink-0">사업장 소재지:</span>
            <span>경기도 화성시 동탄대로</span>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2 pt-2 border-t border-[#F1F5F9]">
            <span className="font-bold text-[#1E1B2E] w-28 shrink-0">문의 및 제휴:</span>
            <a
              href="mailto:apark12321@gmail.com"
              className="text-[#E8745F] font-semibold hover:underline flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>apark12321@gmail.com</span>
            </a>
          </div>
        </div>

        <div className="p-4 bg-[#F8FAFC] rounded-xl text-[12.5px] text-[#64748B] leading-relaxed">
          * 버진로드의 모든 글은 금융소비자 보호 및 정보 제공을 목적으로 작성되었으며, 특정 금융상품의 가입을 강요하지 않습니다. 정부 정책 및 금융기관의 상품 조건은 변동될 수 있으므로 대출 신청 시 반드시 해당 수탁은행 및 공공기관의 공식 지침을 재확인하시기 바랍니다.
        </div>
      </div>
    </div>
  );
}
