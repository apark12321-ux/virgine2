import React from "react";
import { ShieldCheck, Zap, CheckCircle2, ArrowRight } from "lucide-react";

interface PolicyHubProps {
  compact?: boolean;
  onNavigate?: (page: string) => void;
}

const SAFETY_STANDARDS = [
  {
    agency: "한국전기안전공사 (KESCO)",
    topic: "고출력 주방·세탁 가전 단독 콘센트 규격",
    detail:
      "인덕션(3.4kW), 식기세척기(1.8kW), 전기압력밥솥(1.4kW), 의류건조기(1.0~1.5kW) 등 고전력 가전은 멀티탭 문어발 연결을 금지하고 접지형 벽면 단독 콘센트(정격 16A 이상)에 직결해야 화재와 누전차단기 트립을 예방할 수 있습니다.",
  },
  {
    agency: "한국소비자원 (KCA)",
    topic: "세척제 화학 혼합 금지 및 코팅 보호 수칙",
    detail:
      "염소계 표백제(차아염소산나트륨)와 산성 세정제(구연산·식초)를 혼합하면 유독성 염소 가스가 발생합니다. 세탁조·주방가전 세척 시에는 반드시 단일 성분만 정량 사용하고, 스테인리스 열판이나 테프론 바스켓에는 연마제·철수세미 사용을 금지합니다.",
  },
  {
    agency: "한국전력공사 (KEPCO)",
    topic: "2026 주택용(저압) 전기요금 누진 단계 및 대기전력 관리",
    detail:
      "주택용 저압 전력은 기타 계절 200/400 kWh, 하계(7~8월) 300/450 kWh를 기준으로 3단계 누진 단가(120.0 / 214.6 / 307.3원)가 적용됩니다. 열교환기·필터 정기 청소로 압축기 부하를 낮추면 누진 3단계 진입을 효과적으로 억제할 수 있습니다.",
  },
  {
    agency: "산업통상자원부 · 한국에너지공단",
    topic: "에너지소비효율 1등급 가전 유지 기준",
    detail:
      "인버터 컴프레서를 탑재한 1등급 냉장고·에어컨·제습기라도 방열판 통풍 이격거리(벽면 최소 10cm)가 확보되지 않거나 필터가 막히면 실제 소비효율이 3~4등급 수준으로 저하됩니다.",
  },
];

const VERIFICATION_STEPS = [
  {
    step: "1단계",
    title: "제조사 공식 사용설명서 원문 수집",
    desc: "국내 보급률이 높은 주요 모델의 공식 매뉴얼에서 세척 주기, 에러 코드 정의, 금지 세제 항목을 추출합니다.",
  },
  {
    step: "2단계",
    title: "공공 안전·전력 기준 교차 대조",
    desc: "한국소비자원 안전 주의보, 한국전기안전공사 전기화재 예방 지침, 한전 요금표 수치와 불일치 여부를 검토합니다.",
  },
  {
    step: "3단계",
    title: "현장 자가 조치 가능 범위 분리",
    desc: "소비자가 전원을 차단한 상태에서 안전하게 수행할 수 있는 관리 절차와 공식 서비스센터 접수가 필요한 수리 영역을 명확히 구분합니다.",
  },
  {
    step: "4단계",
    title: "독자 제보 반영 및 정기 개정",
    desc: "오류 정정 메일 접수 시 영업일 기준 24시간 내 검토하며, 규격 변경 사항은 본문에 반영합니다.",
  },
];

export function PolicyHub({ onNavigate }: PolicyHubProps) {
  return (
    <div className="max-w-[920px] mx-auto text-left font-sans pb-14 space-y-10">
      {/* Breadcrumb */}
      {onNavigate && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12.5px] text-[#64748B]">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="hover:text-[#0F766E] transition-colors cursor-pointer"
          >
            홈
          </button>
          <span className="text-[#CBD5E1]">/</span>
          <span className="text-[#0F172A] font-medium">가전 안전·효율 기준 및 검증 정책</span>
        </nav>
      )}

      {/* Header */}
      <header className="pb-6 border-b border-[#E2E8F0]">
        <p className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#0F766E] mb-2">
          Safety &amp; Verification Standards
        </p>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-[#0F172A] tracking-tight leading-snug break-keep mb-3">
          가전 안전·효율 기준 및 콘텐츠 검증 정책
        </h1>
        <p className="text-[15px] leading-[1.75] text-[#475569] break-keep">
          버진로드에 발행되는 모든 생활가전 관리 매뉴얼과 진단 도구가 준수하는 공공 안전 규격, 전력 효율 기준, 그리고 4단계 팩트체크 절차를 투명하게 공개합니다.
        </p>
      </header>

      {/* Public Safety & Efficiency Standards */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-[20px] font-extrabold text-[#0F172A]">
            1. 핵심 참조 공공 안전·전력 기준
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAFETY_STANDARDS.map((item) => (
            <div
              key={item.topic}
              className="p-5 bg-white border border-[#E2E8F0] rounded-xl space-y-2"
            >
              <p className="text-[12px] font-bold text-[#0F766E]">{item.agency}</p>
              <h3 className="text-[15.5px] font-bold text-[#0F172A] break-keep">{item.topic}</h3>
              <p className="text-[13.5px] leading-[1.7] text-[#475569] break-keep">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4-Step Editorial Verification Process */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[#0F766E]" />
          <h2 className="text-[20px] font-extrabold text-[#0F172A]">
            2. 버진로드 4단계 기술 문서 검증 프로세스
          </h2>
        </div>

        <div className="border border-[#E2E8F0] rounded-xl bg-white divide-y divide-[#E2E8F0]">
          {VERIFICATION_STEPS.map((v) => (
            <div key={v.step} className="p-5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-5">
              <span className="text-[13px] font-extrabold text-[#0F766E] w-16 shrink-0">
                {v.step}
              </span>
              <div className="space-y-1">
                <h3 className="text-[15px] font-bold text-[#0F172A]">{v.title}</h3>
                <p className="text-[13.5px] text-[#475569] leading-relaxed break-keep">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      {onNavigate && (
        <section className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[14.5px] font-bold text-[#0F172A]">
              <Zap className="w-4 h-4 text-[#0F766E]" />
              <span>안전 기준에 맞춰 우리 집 가전 상태를 점검해 보세요</span>
            </div>
            <p className="text-[13px] text-[#64748B]">
              전기요금 누진 단계 계산기와 필터 교체 주기 진단기를 무료로 이용할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate("tool-power-cost")}
              className="px-3.5 py-2 bg-[#0F766E] hover:bg-[#115E59] text-white text-[13px] font-semibold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              전기요금 계산기 <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("tool-filter-cycle")}
              className="px-3.5 py-2 bg-white hover:bg-[#F0FDFA] text-[#0F766E] border border-[#99F6E4] text-[13px] font-semibold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              필터 진단기 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
