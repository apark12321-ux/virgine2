import React from "react";
import { Mail, ArrowRight } from "lucide-react";

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  const principles = [
    {
      num: "01",
      title: "제조사 공식 규격 및 안전 기준 대조",
      body: "삼성전자·LG전자 등 주요 제조사의 서비스 매뉴얼, 한국소비자원 가전 관리 지침, 한국전기안전공사 안전 수칙을 교차 검증하여 정확한 수치와 절차만 수록합니다.",
    },
    {
      num: "02",
      title: "고장 원인의 물리·화학적 구조 설명",
      body: "단순한 청소 팁 나열을 지양하고, 열교환기 핀 막힘·고무패킹 경화·탄산칼슘 스케일 침착 등 부품이 손상되는 근본 원인과 예방 절차를 명확히 제시합니다.",
    },
    {
      num: "03",
      title: "금지 행위와 주의사항 우선 안내",
      body: "락스 원액 접촉, 젖은 필터 장착, 열판 연마제 사용 등 기기 부식과 누전을 유발하는 위험 행위를 매뉴얼마다 별도로 명시합니다.",
    },
    {
      num: "04",
      title: "오류 정정 및 지속적 개정 투명화",
      body: "공식 문의 창구를 상시 개방하며, 독자의 제보나 안전 기준 변경이 확인되면 매뉴얼 본문과 업데이트 이력을 신속하게 반영합니다.",
    },
  ];

  return (
    <div className="max-w-[880px] mx-auto text-left font-sans pb-14 space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12.5px] text-[#64748B]">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="hover:text-[#0F766E] transition-colors cursor-pointer"
        >
          홈
        </button>
        <span className="text-[#CBD5E1]">/</span>
        <span className="text-[#0F172A] font-medium">사이트 소개 및 편집원칙</span>
      </nav>

      {/* Editorial Intro */}
      <header className="pb-8 border-b border-[#E2E8F0] space-y-4">
        <p className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#0F766E]">
          About Virginroad
        </p>
        <h1 className="text-[26px] sm:text-[34px] font-extrabold text-[#0F172A] tracking-tight leading-snug break-keep">
          생활가전의 수명과 효율을 지키는<br className="hidden sm:inline" /> 기술 관리 매뉴얼 아카이브
        </h1>
        <p className="text-[15.5px] leading-[1.8] text-[#334155] break-keep">
          버진로드(virginroad.kr)는 신혼집과 일반 가정에서 매일 사용하는 30종의 핵심 생활가전을 대상으로, 주기별 필터·부품 세척 규격, 에러 코드 자가 진단, 전력 소비 최적화 방법을 체계적으로 정리하는 독립 기술 정보 플랫폼입니다.
        </p>
        <p className="text-[15px] leading-[1.8] text-[#475569] break-keep">
          가전제품은 구매 순간보다 설치 이후 수년간의 유지관리가 성능과 전기요금, 실내 위생을 좌우합니다. 버진로드 기술편집팀은 흩어져 있는 제품별 사용설명서와 공공 안전 지침을 가정에서 바로 실행할 수 있는 표준 점검표 형태로 재구성하여 제공합니다.
        </p>
      </header>

      {/* 4 Editorial Principles */}
      <section className="space-y-5">
        <div>
          <h2 className="text-[21px] font-extrabold text-[#0F172A] tracking-tight">
            버진로드 4대 편집 원칙
          </h2>
          <p className="text-[14px] text-[#64748B] mt-1">
            모든 매뉴얼과 계산 도구는 아래 기준을 통과한 항목만 발행합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {principles.map((p) => (
            <div
              key={p.num}
              className="p-5 bg-white border border-[#E2E8F0] rounded-xl space-y-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-extrabold text-[#0F766E] tabular-nums">
                  {p.num}
                </span>
                <h3 className="text-[15.5px] font-bold text-[#0F172A]">{p.title}</h3>
              </div>
              <p className="text-[13.5px] leading-[1.7] text-[#475569] break-keep">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Coverage & Interactive Tools */}
      <section className="space-y-5">
        <h2 className="text-[21px] font-extrabold text-[#0F172A] tracking-tight">
          제공 아카이브 및 무료 진단 도구
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigate("category-신혼가전")}
            className="text-left p-5 bg-white border border-[#E2E8F0] hover:border-[#0F766E] rounded-xl transition-colors cursor-pointer group"
          >
            <p className="text-[12px] font-bold text-[#0F766E] mb-1.5">30종 기술 문서</p>
            <h3 className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0F766E] mb-1.5">
              생활가전 관리 매뉴얼
            </h3>
            <p className="text-[13px] text-[#475569] leading-relaxed mb-3 break-keep">
              세탁·건조, 주방가전, 냉난방·공조, 청소·생활 4대 영역별 분해 세척 및 에러 코드 대응 가이드.
            </p>
            <span className="text-[12.5px] font-semibold text-[#0F766E] inline-flex items-center gap-1">
              아카이브 보기 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("tool-power-cost")}
            className="text-left p-5 bg-white border border-[#E2E8F0] hover:border-[#0F766E] rounded-xl transition-colors cursor-pointer group"
          >
            <p className="text-[12px] font-bold text-[#0F766E] mb-1.5">2026 한전 누진제</p>
            <h3 className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0F766E] mb-1.5">
              월간 전기요금 계산기
            </h3>
            <p className="text-[13px] text-[#475569] leading-relaxed mb-3 break-keep">
              가전별 가동 시간을 입력해 하계·기타 계절 누진 단계와 예상 청구 요금을 산출합니다.
            </p>
            <span className="text-[12.5px] font-semibold text-[#0F766E] inline-flex items-center gap-1">
              계산기 열기 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate("tool-filter-cycle")}
            className="text-left p-5 bg-white border border-[#E2E8F0] hover:border-[#0F766E] rounded-xl transition-colors cursor-pointer group"
          >
            <p className="text-[12px] font-bold text-[#0F766E] mb-1.5">자가 점검표</p>
            <h3 className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0F766E] mb-1.5">
              필터 교체 주기 진단기
            </h3>
            <p className="text-[13px] text-[#475569] leading-relaxed mb-3 break-keep">
              마지막 세척일을 기준으로 10대 가전의 점검 D-Day와 연간 소모품 유지비를 자동 진단합니다.
            </p>
            <span className="text-[12.5px] font-semibold text-[#0F766E] inline-flex items-center gap-1">
              진단기 열기 <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>
      </section>

      {/* Operating Entity & Disclaimer */}
      <section className="p-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-4">
        <h2 className="text-[17px] font-bold text-[#0F172A]">운영 주체 및 공식 연락처</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 gap-x-8 text-[13.5px] text-[#475569]">
          <div className="flex gap-3">
            <dt className="font-bold text-[#0F172A] w-24 shrink-0">사이트명</dt>
            <dd>버진로드 (virginroad.kr)</dd>
          </div>
          <div className="flex gap-3">
            <dt className="font-bold text-[#0F172A] w-24 shrink-0">운영 주체</dt>
            <dd>버진로드 생활가전 기술편집팀</dd>
          </div>
          <div className="flex gap-3">
            <dt className="font-bold text-[#0F172A] w-24 shrink-0">주요 근거</dt>
            <dd>한국소비자원 · 한국전기안전공사 · 한국전력공사</dd>
          </div>
          <div className="flex gap-3">
            <dt className="font-bold text-[#0F172A] w-24 shrink-0">공식 이메일</dt>
            <dd>
              <a
                href="mailto:apark12321@gmail.com"
                className="text-[#0F766E] font-mono font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" />
                apark12321@gmail.com
              </a>
            </dd>
          </div>
        </dl>
        <p className="text-[12.5px] leading-relaxed text-[#64748B] pt-3 border-t border-[#E2E8F0] break-keep">
          면책 고지: 버진로드의 모든 기술 매뉴얼과 계산 결과는 소비자의 안전한 가전 관리를 돕기 위한 참고 자료입니다. 특정 제조사나 판매처의 후원을 받지 않으며, 내부 기판 분해나 냉매·고전압 수리가 필요한 경우에는 반드시 제조사 공식 서비스센터를 이용하시기 바랍니다.
        </p>
      </section>
    </div>
  );
}
