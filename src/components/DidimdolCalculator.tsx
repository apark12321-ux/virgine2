import { useState, useMemo } from "react";

type IncomeBand = "low" | "mid" | "high";

interface FaqItem {
  question: string;
  answer: string;
}

interface CalcInput {
  income: IncomeBand; // 소득 구간 (기본금리 결정)
  loanAmount: number; // 대출 희망 금액 (만원)
  loanTerm: number; // 만기 (년)
  children: 0 | 1 | 2 | 3; // 자녀 수
  isNewlywed: boolean; // 결혼 7년 이내
  jeongyak: 0 | 1 | 2 | 3 | 4; // 청약통장 가입연수 (>=10년 → 4 등 단계)
  jeongyakMonths: number; // 청약통장 납입 회차
  eContract: boolean; // 부동산 전자계약
  under30pct: boolean; // 가능액의 30% 이하 신청
}

const initialInput: CalcInput = {
  income: "mid",
  loanAmount: 30000,
  loanTerm: 30,
  children: 1,
  isNewlywed: true,
  jeongyak: 2,
  jeongyakMonths: 60,
  eContract: false,
  under30pct: false,
};

// 한국주택금융공사 2026.05.01 공시 기준 (참고용 추정 구간)
function getBaseRate(income: IncomeBand, term: number): number {
  const base: Record<IncomeBand, number> = {
    low: 2.6, // 소득 4천만원 이하
    mid: 3.1, // 소득 4천~7천
    high: 3.45, // 소득 7천~8.5천
  };
  const termAdj = term <= 15 ? -0.1 : term <= 20 ? 0 : term <= 30 ? 0.1 : 0.2;
  return Math.round((base[income] + termAdj) * 100) / 100;
}

// 자녀 우대 (택1: 신혼 0.2 vs 자녀 0.3/0.5/0.7) — 더 큰 쪽 자동 선택
function getChildDiscount(children: number, isNewlywed: boolean): { rate: number; reason: string } {
  const childRate = children === 0 ? 0 : children === 1 ? 0.3 : children === 2 ? 0.5 : 0.7;
  const newlywedRate = isNewlywed ? 0.2 : 0;
  if (childRate >= newlywedRate && childRate > 0) {
    return { rate: childRate, reason: `자녀 ${children}명 우대` };
  }
  if (newlywedRate > 0) {
    return { rate: newlywedRate, reason: "신혼부부 우대 (혼인 7년 이내)" };
  }
  return { rate: 0, reason: "해당 없음" };
}

// 청약통장 추가우대 (가입연수·납입회차 둘 다 만족해야 더 큰 폭 인정)
function getJeongyakDiscount(years: number, months: number): { rate: number; reason: string } {
  if (years >= 4 && months >= 60) {
    return { rate: 0.5, reason: "청약통장 10년+, 60회차+ (최대)" };
  }
  if (years >= 3 && months >= 36) {
    return { rate: 0.3, reason: "청약통장 5~10년, 36회차+" };
  }
  if (years >= 2 && months >= 24) {
    return { rate: 0.2, reason: "청약통장 3~5년, 24회차+" };
  }
  if (years >= 1) {
    return { rate: 0.1, reason: "청약통장 1~3년" };
  }
  return { rate: 0, reason: "청약통장 우대 미적용" };
}

function fmtMoney(won: number): string {
  if (won >= 10000) {
    const eok = Math.floor(won / 10000);
    const rem = won % 10000;
    if (rem === 0) return `${eok}억원`;
    return `${eok}억 ${rem.toLocaleString()}만원`;
  }
  return `${won.toLocaleString()}만원`;
}

// 월 원리금균등상환액 계산 (만원 단위 입력 → 원 단위 출력)
function calcMonthlyPayment(principal: number, annualRate: number, termYears: number): number {
  const P = principal * 10000; // 만원 → 원
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return P / n;
  return (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const FAQ_DATA: FaqItem[] = [
  {
    question: "부부 합산 소득을 산정할 때 성과급이나 명절 보너스 상여금도 전액 포함되나요?",
    answer: "그렇습니다. 디딤돌대출 심사 시 적용하는 부부 소득은 소득세법 제20조에 따른 근로소득 원천징수영수증 상의 '총급여액(세전)'을 기준으로 삼습니다. 따라서 정기 성과급, 경영성과급, 명절 귀향비, 특별 상여금 등 급여 명목으로 원천징수된 일시적인 소득도 모두 합산됩니다. 단, 식대(월 20만원 한도), 자가운전보조금(월 20만원 한도), 자녀양육수당 등 소득세법상 '비과세 근로소득' 항목은 소득 합산액에서 제외되므로, 아슬아슬하게 소득 컷오프를 초과할 위기라면 원천징수영수증의 21번 비과세 소득 합계액을 세밀하게 공제 소명해야 합니다."
  },
  {
    question: "맞벌이 신혼부부의 소득 제한 기준과 혜택 주택 한도는 구체적으로 어떻게 되나요?",
    answer: "신혼부부 전용 디딤돌대출은 맞벌이 부부 기준으로 부부 합산 연소득 8,500만 원 이하까지 신청이 허용됩니다. (일반 가구의 소득 제한인 6,000만 원 대비 대폭 완화된 수준입니다.) 자산 요건은 부부 합산 순자산 가액이 4억 6,200만 원 이하여야 합니다. 또한 일반 가구는 담보 주택 평가액 5억 원 이하 주택만 대상이 되지만, 신혼부부 및 자녀 가구는 담보 주택 가액이 최대 6억 원 이하(수도권 전용 85㎡ 이하)까지 확장 적용되어 선택할 수 있는 아파트의 범위가 한층 넓어집니다."
  },
  {
    question: "부동산 전자계약 우대금리(0.1%p)는 구체적으로 어떻게 신청하고 중복 적용하나요?",
    answer: "국토교통부가 공식 운영하는 '부동산거래 전자계약시스템(irds.molit.go.kr)'을 통해 주택 매매 계약서를 서면이 아닌 태블릿이나 PC 전자서명으로 작성하시면 우대금리 요건이 자동 승인됩니다. 전자계약이 체결되면 국토부 시스템에 실거래 신고와 확정일자가 즉시 전산 처리되며, 대출 신청 시 은행 창구에 별도로 무거운 종이 서류를 제출하지 않아도 연동되어 연 0.1%p의 금리 인하 특전이 즉시 소급 배정됩니다. 이는 다른 자녀 우대, 청약 우대 등과 완전히 중복 적용됩니다."
  },
  {
    question: "대출 실행 및 입주 후에 자녀가 태어나는 경우에도 우대금리 추가 할인이 가능한가요?",
    answer: "네, 대출 실행 이후에 새롭게 태어난 아이가 있는 경우에도 자녀 추가 우대금리를 즉시 적용받으실 수 있습니다. 대출 실행처인 한국주택금융공사나 기금 수탁 은행 창구에 출생신고 완료 후 주민등록등본 및 가족관계증명서를 지참해 '금리 변경 신청서'를 접수하시면 즉시 자녀 추가 할인율이 새로 일할 계산되어 월 원리금이 인하됩니다. 자녀 우대금리는 1자녀 0.3%p, 2자녀 0.5%p, 3자녀 이상 0.7%p가 주어집니다."
  },
  {
    question: "가능 한도의 30% 이하 소액 신청 우대금리(0.1%p)는 정확히 어떤 제도인가요?",
    answer: "이 제도는 주택담보대출 비율(LTV)상 최대로 대출금을 영끌하여 빌리지 않고, 집값 대비 대출 비중을 현격히 낮춰 신청하는 소액 대출 고객을 우대해 주는 제도입니다. 산정된 총 대출 가능 금액(방공제 등을 제한 실제 승인 한도)의 30% 이하 수준으로 매우 낮춰서 소액만 소박하게 빌리는 경우, 금융당국의 가계대출 안정화 기조에 기여한 공로로 연 0.1%p의 추가 금리 인하 인센티브를 부여합니다. 자금이 넉넉하여 소액 대출로 잔금을 치르려는 신혼부부에게 강력 추천하는 꿀팁입니다."
  },
  {
    question: "디딤돌 대출 도중에 이직을 하거나 연봉이 소득 한도를 초과하면 대출 금리가 다시 오르나요?",
    answer: "아닙니다. 디딤돌대출의 소득 자격 심사는 대출 신청 및 실행 시점의 원천징수 소득을 기준으로 최종 판정합니다. 계약서 작성과 심사를 거쳐 정상적으로 대출이 승인되고 실비 입금이 완료된 이후에는, 직장을 이직하거나 승진을 하여 부부 합산 소득이 소득 제한 요건(8,500만원)을 초과하더라도 기존에 고정된 저금리 이율은 만기 상환 시까지 계약대로 완벽하게 유지됩니다. 단, 대출 실행 후 '무주택 유지 의무'를 위반하여 추가 주택을 취득하는 경우에는 즉시 대출금이 회수되거나 고율의 가산금리가 부과되므로 등기 관리에 극도의 주의가 요구됩니다."
  }
];

export function DidimdolCalculator() {
  const [input, setInput] = useState<CalcInput>(initialInput);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const result = useMemo(() => {
    const baseRate = getBaseRate(input.income, input.loanTerm);
    const childPart = getChildDiscount(input.children, input.isNewlywed);
    const jyPart = getJeongyakDiscount(input.jeongyak, input.jeongyakMonths);
    const ePart = input.eContract ? 0.1 : 0;
    const u30Part = input.under30pct ? 0.1 : 0;

    const totalDiscount =
      Math.round((childPart.rate + jyPart.rate + ePart + u30Part) * 100) / 100;
    let finalRate = Math.round((baseRate - totalDiscount) * 100) / 100;
    
    //하한선 1.2% 가정
    const hitFloor = finalRate < 1.2;
    if (hitFloor) finalRate = 1.2;

    const monthly = calcMonthlyPayment(input.loanAmount, finalRate, input.loanTerm);
    const baseMonthly = calcMonthlyPayment(input.loanAmount, baseRate, input.loanTerm);
    const monthlySave = baseMonthly - monthly;
    const totalSave = monthlySave * input.loanTerm * 12;

    return {
      baseRate,
      finalRate,
      totalDiscount,
      hitFloor,
      childPart,
      jyPart,
      ePart,
      u30Part,
      monthly,
      baseMonthly,
      monthlySave,
      totalSave,
    };
  }, [input]);

  return (
    <div className="max-w-[1400px] mx-auto px-5 lg:px-10 py-8 sm:py-10 bg-white">
      <header className="mb-8">
        <span className="badge-coral mb-3">실용 도구</span>
        <h1 className="text-[26px] sm:text-[32px] font-bold tracking-[-0.025em] text-[#151320] leading-[1.25] mt-3">
          디딤돌 우대금리 계산기
        </h1>
        <p className="text-[15px] sm:text-[16px] text-[#5B5870] leading-[1.7] mt-3 break-keep max-w-2xl">
          본인 가구 조건을 입력하시면 한국주택금융공사 2026년 5월 1일 공시 기준으로
          단계별 우대금리 적용 과정과 월 상환액을 시뮬레이션해 드립니다. 평균값이
          아닌 본인 가구 기준의 답을 확인하세요.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        {/* 입력 영역 */}
        <section className="bg-white border border-[#E2E4F0] rounded-[14px] p-5 sm:p-6">
          <h2 className="text-[18px] font-bold text-[#151320] mb-5">조건 입력</h2>

          <div className="space-y-5">
            <div>
              <label className="block text-[13px] font-bold text-[#3F3D56] mb-2">
                부부 합산 연소득
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  ["low", "~4천만원"],
                  ["mid", "4~7천만원"],
                  ["high", "7~8.5천만원"],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInput({ ...input, income: v })}
                    className={`py-2.5 text-[13px] font-medium rounded-[8px] border transition-colors cursor-pointer ${
                      input.income === v
                        ? "bg-[#E8745F] border-[#E8745F] text-white"
                        : "bg-white border-[#E2E4F0] text-[#3F3D56] hover:border-[#FFD2BD]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#3F3D56] mb-2">
                대출 희망 금액: <span className="text-[#E8745F]">{fmtMoney(input.loanAmount)}</span>
              </label>
              <input
                type="range"
                min={5000}
                max={50000}
                step={1000}
                value={input.loanAmount}
                onChange={(e) => setInput({ ...input, loanAmount: Number(e.target.value) })}
                className="w-full accent-[#E8745F]"
              />
              <div className="flex justify-between text-[11px] text-[#8A87A0] mt-1">
                <span>5천만원</span>
                <span>5억원(최대)</span>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#3F3D56] mb-2">
                대출 만기: <span className="text-[#E8745F]">{input.loanTerm}년</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 40].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setInput({ ...input, loanTerm: y })}
                    className={`py-2 text-[13px] font-medium rounded-[8px] border transition-colors cursor-pointer ${
                      input.loanTerm === y
                        ? "bg-[#E8745F] border-[#E8745F] text-white"
                        : "bg-white border-[#E2E4F0] text-[#3F3D56] hover:border-[#FFD2BD]"
                    }`}
                  >
                    {y}년
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-[#3F3D56] mb-2">
                자녀 수
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setInput({ ...input, children: c as 0 | 1 | 2 | 3 })}
                    className={`py-2 text-[13px] font-medium rounded-[8px] border transition-colors cursor-pointer ${
                      input.children === c
                        ? "bg-[#E8745F] border-[#E8745F] text-white"
                        : "bg-white border-[#E2E4F0] text-[#3F3D56] hover:border-[#FFD2BD]"
                    }`}
                  >
                    {c === 3 ? "3명+" : `${c}명`}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={input.isNewlywed}
                onChange={(e) => setInput({ ...input, isNewlywed: e.target.checked })}
                className="mt-1 w-4 h-4 accent-[#E8745F]"
              />
              <span className="text-[13.5px] text-[#1E1B2E] leading-[1.5]">
                <strong className="font-bold">결혼 7년 이내</strong> 신혼부부
                <span className="block text-[12px] text-[#8A87A0] mt-0.5">자녀 우대와 비교해 더 큰 쪽만 적용됩니다</span>
              </span>
            </label>

            <div>
              <label className="block text-[13px] font-bold text-[#3F3D56] mb-2">
                청약통장 가입 기간
              </label>
              <div className="grid grid-cols-4 gap-2">
                {([
                  [0, "1년 미만"],
                  [1, "1~3년"],
                  [2, "3~5년"],
                  [3, "5~10년"],
                ] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setInput({ ...input, jeongyak: v as 0 | 1 | 2 | 3 })}
                    className={`py-2 text-[12.5px] font-medium rounded-[8px] border transition-colors cursor-pointer ${
                      input.jeongyak === v
                        ? "bg-[#E8745F] border-[#E8745F] text-white"
                        : "bg-white border-[#E2E4F0] text-[#3F3D56] hover:border-[#FFD2BD]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-[12px] text-[#5B5870] mb-1">
                  납입 회차: <span className="font-medium text-[#3F3D56]">{input.jeongyakMonths}회</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={6}
                  value={input.jeongyakMonths}
                  onChange={(e) => setInput({ ...input, jeongyakMonths: Number(e.target.value) })}
                  className="w-full accent-[#E8745F]"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={input.eContract}
                onChange={(e) => setInput({ ...input, eContract: e.target.checked })}
                className="mt-1 w-4 h-4 accent-[#E8745F]"
              />
              <span className="text-[13.5px] text-[#1E1B2E] leading-[1.5]">
                <strong className="font-bold">부동산 전자계약</strong> 이용 (0.1%p)
                <span className="block text-[12px] text-[#8A87A0] mt-0.5">국토부 부동산거래 전자계약시스템(irds.kr) 이용 시</span>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={input.under30pct}
                onChange={(e) => setInput({ ...input, under30pct: e.target.checked })}
                className="mt-1 w-4 h-4 accent-[#E8745F]"
              />
              <span className="text-[13.5px] text-[#1E1B2E] leading-[1.5]">
                <strong className="font-bold">가능 한도의 30% 이하 신청</strong> (0.1%p)
                <span className="block text-[12px] text-[#8A87A0] mt-0.5">자기자금 충분히 확보해 소액 대출하는 경우</span>
              </span>
            </label>
          </div>
        </section>

        {/* 결과 영역 */}
        <section className="space-y-4">
          <div className="bg-gradient-to-br from-[#EEF0FB] to-[#F5F6FD] border border-[#FFD2BD] rounded-[14px] p-6 sm:p-7">
            <div className="text-[12px] font-bold text-[#B0432F] uppercase tracking-[0.1em] mb-2">
              최종 적용 예상 금리
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-[44px] sm:text-[52px] font-bold text-[#151320] tracking-[-0.03em] leading-none">
                {result.finalRate.toFixed(2)}
              </span>
              <span className="text-[20px] font-bold text-[#151320]">%</span>
              {result.hitFloor && (
                <span className="text-[11px] text-[#B0432F] bg-white px-2 py-0.5 rounded-full font-medium">
                  하한선 도달
                </span>
              )}
            </div>
            <div className="text-[13px] text-[#5B5870] mt-2">
              기본금리 {result.baseRate.toFixed(2)}%에서 우대 {result.totalDiscount.toFixed(2)}%p 인하
            </div>
          </div>

          <div className="bg-white border border-[#E2E4F0] rounded-[14px] p-5 sm:p-6">
            <h3 className="text-[15px] font-bold text-[#151320] mb-4">단계별 인하 시뮬레이션</h3>
            <div className="space-y-2.5 text-[13.5px]">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#EDEEF7]">
                <span className="text-[#3F3D56]">기본금리 ({input.income === "low" ? "저소득" : input.income === "mid" ? "중간소득" : "고소득"} · {input.loanTerm}년)</span>
                <span className="font-bold text-[#151320]">{result.baseRate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#5B5870]">▼ {result.childPart.reason}</span>
                <span className={result.childPart.rate > 0 ? "font-medium text-[#B0432F]" : "text-[#8A87A0]"}>
                  {result.childPart.rate > 0 ? `-${result.childPart.rate.toFixed(2)}%p` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#5B5870]">▼ {result.jyPart.reason}</span>
                <span className={result.jyPart.rate > 0 ? "font-medium text-[#B0432F]" : "text-[#8A87A0]"}>
                  {result.jyPart.rate > 0 ? `-${result.jyPart.rate.toFixed(2)}%p` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#5B5870]">▼ 부동산 전자계약</span>
                <span className={result.ePart > 0 ? "font-medium text-[#B0432F]" : "text-[#8A87A0]"}>
                  {result.ePart > 0 ? `-${result.ePart.toFixed(2)}%p` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#5B5870]">▼ 30% 이하 신청</span>
                <span className={result.u30Part > 0 ? "font-medium text-[#B0432F]" : "text-[#8A87A0]"}>
                  {result.u30Part > 0 ? `-${result.u30Part.toFixed(2)}%p` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-[#EEF0FB]">
                <span className="font-bold text-[#151320]">최종 금리</span>
                <span className="font-bold text-[#E8745F] text-[16px]">{result.finalRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E4F0] rounded-[14px] p-5 sm:p-6">
            <h3 className="text-[15px] font-bold text-[#151320] mb-4">월 상환액 (원리금균등)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[13px] text-[#5B5870]">우대 적용 후 월 상환액</span>
                <span className="font-bold text-[20px] text-[#151320] tracking-[-0.02em]">
                  {Math.round(result.monthly).toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-baseline text-[12.5px] text-[#8A87A0]">
                <span>기본금리 적용 시</span>
                <span>{Math.round(result.baseMonthly).toLocaleString()}원</span>
              </div>
              <div className="pt-3 mt-3 border-t border-[#EDEEF7] bg-[#F5F6FD] -mx-5 sm:-mx-6 px-5 sm:px-6 pb-3 rounded-b-[14px]">
                <div className="flex justify-between items-baseline">
                  <span className="text-[13px] font-bold text-[#B0432F]">총 절감액 ({input.loanTerm}년)</span>
                  <span className="font-bold text-[18px] text-[#B0432F] tracking-[-0.02em]">
                    {Math.round(result.totalSave / 10000).toLocaleString()}만원
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 신혼부부 디딤돌대출 초정밀 핵심 가이드 & FAQ (AdSense Value Boost) */}
      <section className="mt-12 border-t border-[#EDEEF7] pt-10" itemScope itemType="https://schema.org/FAQPage">
        <div className="max-w-4xl">
          <span className="text-[11px] font-bold text-[#E8745F] tracking-[0.2em] uppercase">Expert Guide</span>
          <h2 className="text-[22px] sm:text-[26px] font-bold text-[#151320] tracking-[-0.02em] mt-2 mb-6">
            내 집 마련의 첫 단추, 신혼부부 디딤돌대출 마스터 바이블
          </h2>
          
          <div className="space-y-6 text-[14.5px] text-[#3F3D56] leading-[1.8] break-keep">
            <p>
              정부가 지원하고 주택도시기금과 한국주택금융공사가 전담하는 <strong>'내집마련 디딤돌대출'</strong>은 
              무주택 세대주인 예비 및 신혼부부에게 현존하는 가장 확실하고 유리한 초저금리 금융 안전망입니다. 
              시중 시중은행의 담보대출 금리가 연 4%대를 훨씬 상회하는 시장 흐름 속에서, 디딤돌 대출은 조건에 따라 
              <strong>최저 연 1.2%에서 최고 연 3%대</strong>의 압도적인 고정금리 혜택을 온전히 누릴 수 있게 설계되었습니다.
            </p>

            <div className="bg-[#F5F6FD] rounded-[12px] p-5 border border-[#E2E4F0] my-6">
              <h4 className="font-bold text-[#151320] text-[15px] mb-3">💡 디딤돌대출 신청 전 자격 자격체크 리스트</h4>
              <ul className="space-y-2 text-[13.5px] text-[#5B5870] list-disc list-inside">
                <li><strong className="text-[#3F3D56]">무주택 세대주 요건:</strong> 세대주를 포함한 세대원 전원이 신청일 기준 무주택 상태여야 합니다.</li>
                <li><strong className="text-[#3F3D56]">맞벌이 연소득 제한:</strong> 신혼부부 가구는 부부 합산 연간 세전 소득 8,500만 원 이하여야 혜택이 적용됩니다.</li>
                <li><strong className="text-[#3F3D56]">순자산 가액 기준:</strong> 2026년 기준 부부 합산 총 순자산이 4억 6,200만 원을 초과하면 대상에서 제외됩니다.</li>
                <li><strong className="text-[#3F3D56]">대상 아파트 규모:</strong> 공부상 전용면적 85㎡ 이하(지방 읍·면 지역은 100㎡ 이하) 및 평가액 6억 원 이하(신혼부부는 최대 9억 원까지 허용 확대) 주택에 한합니다.</li>
              </ul>
            </div>

            <h3 className="text-[17px] font-bold text-[#151320] mt-8 mb-3">1. 우대금리 중복 적용으로 한계 이자까지 깎는 법</h3>
            <p>
              디딤돌대출의 꽃은 바로 <strong>'중복 적용 가능한 우대금리'</strong> 제약입니다. 
              우선 순수 가계 배경(자녀 수)에 따른 혜택과 신혼부부 혜택 중 본인에게 더 유리한 메인 혜택 1종이 자동 적용됩니다. 
              예를 들어 무자녀 신혼부부는 0.2%p를 받고, 1자녀인 경우에는 자녀 우대 0.3%p가 적용되어 더 큰 폭인 0.3%p 할인을 선택하게 됩니다.
            </p>
            <p>
              여기에 <strong>부동산 전자계약 이용(0.1%p)</strong>, <strong>청약통장 장기 가입 우대(최대 0.5%p)</strong>, 
              그리고 <strong>한도 대비 30% 이하 소액 신청(0.1%p)</strong> 우대 항목들을 차례차례 더해 얹으면 
              사실상 대출 하한선인 연 1.2% 고정금리를 쟁취할 수 있는 구조적 기틀이 완성됩니다.
            </p>

            <h3 className="text-[17px] font-bold text-[#151320] mt-8 mb-4">2. 신혼 금융 전문가가 전하는 자주 묻는 질문 (FAQ)</h3>
            
            <div className="space-y-3 mt-4">
              {FAQ_DATA.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div 
                    key={idx} 
                    className="border border-[#E2E4F0] rounded-[10px] overflow-hidden bg-white transition-shadow hover:shadow-sm"
                    itemScope 
                    itemProp="mainEntity" 
                    itemType="https://schema.org/Question"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaq(isOpen ? null : idx)}
                      className="w-full flex justify-between items-center px-5 py-4 text-left cursor-pointer bg-[#FDFDFD]"
                    >
                      <span className="font-bold text-[#1E1B2E] text-[14px] sm:text-[15px] pr-4" itemProp="name">
                        Q. {faq.question}
                      </span>
                      <span className="text-[16px] text-[#8A87A0] shrink-0 font-bold">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div 
                        className="px-5 pb-5 pt-1 text-[13.5px] leading-[1.75] text-[#5B5870] border-t border-[#F1F3FA]"
                        itemScope 
                        itemProp="acceptedAnswer" 
                        itemType="https://schema.org/Answer"
                      >
                        <p itemProp="text">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 면책 및 출처 */}
      <section className="mt-10 bg-[#F5F6FD] border border-[#E2E4F0] rounded-[12px] p-5 sm:p-6">
        <h3 className="text-[13px] font-bold text-[#151320] mb-3 uppercase tracking-[0.08em]">
          이 계산기에 대해
        </h3>
        <div className="space-y-2.5 text-[13px] text-[#5B5870] leading-[1.7]">
          <p>
            본 계산기는 <strong className="text-[#3F3D56]">한국주택금융공사 2026년 5월 1일 공시 기준</strong>과 주택도시기금 디딤돌대출 안내 자료를 토대로 작성됐습니다.
            기본금리·우대금리 적용 폭은 정책에 따라 수시로 변경되며, 본인의 신용평점·담보 주택 평가·소득 산정 결과에 따라
            실제 적용 금리는 본 계산 결과와 다를 수 있습니다.
          </p>
          <p>
            <strong className="text-[#3F3D56]">계산기 한계:</strong> 자녀 우대금리는 2025년 3월 24일 신규 접수분부터
            '자녀 1명당 5년, 최대 15년'으로 적용 기간이 제한됩니다. 본 계산기는 전체 만기에 우대가 유지된다는 단순 가정으로
            계산되므로, 실제로는 자녀 연령에 따라 중도에 우대가 종료될 수 있습니다.
            정확한 정보는 신청 직전 공식 사이트에서 반드시 확인하시기 바랍니다.
          </p>
          <p className="pt-2">
            <strong className="text-[#3F3D56]">참고 출처:</strong>{" "}
            <a href="https://www.hf.go.kr" rel="noopener noreferrer" className="text-[#D45A45] underline underline-offset-2">한국주택금융공사 디딤돌대출 금리안내</a>
            {" · "}
            <a href="https://nhuf.molit.go.kr" rel="noopener noreferrer" className="text-[#D45A45] underline underline-offset-2">주택도시기금포털</a>
            {" · "}
            <a href="https://irds.molit.go.kr" rel="noopener noreferrer" className="text-[#D45A45] underline underline-offset-2">부동산거래 전자계약시스템</a>
          </p>
          <p className="text-[12px] text-[#8A87A0] pt-2">
            버진로드 편집부 · 최종 갱신 2026.05.31
          </p>
        </div>
      </section>
    </div>
  );
}
