import React, { useMemo, useState } from "react";
import { Zap, RotateCcw, ArrowRight, Info } from "lucide-react";

interface AppliancePowerCalculatorProps {
  onNavigate: (page: string) => void;
}

type SeasonMode = "other" | "summer";

interface ApplianceSpec {
  id: string;
  name: string;
  group: "세탁·건조" | "주방가전" | "냉난방·공조" | "청소·생활";
  watts: number; // Average active power draw in Watts
  unitLabel: string;
  usageType: "dailyHours" | "weeklyRuns";
  runHours?: number; // Duration per cycle when usageType === "weeklyRuns"
  defaultValue: number;
  maxValue: number;
  step: number;
  defaultEnabled: boolean;
  manualId: string;
  note: string;
}

const APPLIANCE_SPECS: ApplianceSpec[] = [
  {
    id: "fridge",
    name: "4도어 냉장고 (850L급 인버터)",
    group: "주방가전",
    watts: 48,
    unitLabel: "시간/일",
    usageType: "dailyHours",
    defaultValue: 24,
    maxValue: 24,
    step: 1,
    defaultEnabled: true,
    manualId: "manual-03-four-door-refrigerator",
    note: "상시 운전 평균 소비전력(월 약 35 kWh 기준)",
  },
  {
    id: "aircon",
    name: "천장형·스탠드 인버터 에어컨",
    group: "냉난방·공조",
    watts: 780,
    unitLabel: "시간/일",
    usageType: "dailyHours",
    defaultValue: 5,
    maxValue: 24,
    step: 0.5,
    defaultEnabled: true,
    manualId: "manual-05-system-aircon-filter",
    note: "초기 강냉 후 인버터 유지 평균 부하 기준",
  },
  {
    id: "dryer",
    name: "히트펌프 의류건조기 (17~20kg)",
    group: "세탁·건조",
    watts: 950,
    unitLabel: "회/주",
    usageType: "weeklyRuns",
    runHours: 1.35,
    defaultValue: 4,
    maxValue: 14,
    step: 1,
    defaultEnabled: true,
    manualId: "manual-02-heatpump-dryer",
    note: "표준 코스 1회 약 1.28 kWh 소요",
  },
  {
    id: "washer",
    name: "드럼세탁기 (21~24kg 표준 40℃)",
    group: "세탁·건조",
    watts: 650,
    unitLabel: "회/주",
    usageType: "weeklyRuns",
    runHours: 1.0,
    defaultValue: 4,
    maxValue: 14,
    step: 1,
    defaultEnabled: true,
    manualId: "manual-01-drum-washer",
    note: "온수 히팅 포함 표준 코스 1회 약 0.65 kWh",
  },
  {
    id: "dishwasher",
    name: "14인용 빌트인 식기세척기",
    group: "주방가전",
    watts: 1100,
    unitLabel: "회/주",
    usageType: "weeklyRuns",
    runHours: 1.1,
    defaultValue: 6,
    maxValue: 14,
    step: 1,
    defaultEnabled: true,
    manualId: "manual-04-dishwasher-maintenance",
    note: "표준 코스 1회 약 1.21 kWh (고온 헹굼 포함)",
  },
  {
    id: "induction",
    name: "3구 인덕션 전기레인지",
    group: "주방가전",
    watts: 1800,
    unitLabel: "시간/일",
    usageType: "dailyHours",
    defaultValue: 1.0,
    maxValue: 6,
    step: 0.5,
    defaultEnabled: true,
    manualId: "manual-07-induction-cooktop",
    note: "중·강화력 조리 평균 1.8 kW 기준",
  },
  {
    id: "airpurifier",
    name: "타워형 공기청정기 (자동모드)",
    group: "냉난방·공조",
    watts: 28,
    unitLabel: "시간/일",
    usageType: "dailyHours",
    defaultValue: 16,
    maxValue: 24,
    step: 1,
    defaultEnabled: true,
    manualId: "manual-08-air-purifier-hepa",
    note: "자동 풍량 기준 월 약 13 kWh",
  },
  {
    id: "ricecooker",
    name: "IH 전기압력밥솥 (취사+보온)",
    group: "주방가전",
    watts: 140,
    unitLabel: "시간/일",
    usageType: "dailyHours",
    defaultValue: 8,
    maxValue: 24,
    step: 1,
    defaultEnabled: true,
    manualId: "manual-21-electric-pressure-cooker",
    note: "1일 취사 1회 + 보온 유지 평균 부하",
  },
  {
    id: "dehumidifier",
    name: "컴프레서 제습기 (16~20L)",
    group: "냉난방·공조",
    watts: 310,
    unitLabel: "시간/일",
    usageType: "dailyHours",
    defaultValue: 4,
    maxValue: 24,
    step: 1,
    defaultEnabled: false,
    manualId: "manual-23-dehumidifier-condenser",
    note: "장마철 실내 습도 50% 유지 가동 기준",
  },
  {
    id: "styler",
    name: "의류관리기 (스타일러·에어드레서)",
    group: "세탁·건조",
    watts: 1200,
    unitLabel: "회/주",
    usageType: "weeklyRuns",
    runHours: 0.65,
    defaultValue: 3,
    maxValue: 14,
    step: 1,
    defaultEnabled: false,
    manualId: "manual-10-clothing-care-styler",
    note: "표준 스팀 코스 1회 약 0.78 kWh",
  },
  {
    id: "robotvac",
    name: "로봇청소기 + 열풍 건조 도크",
    group: "청소·생활",
    watts: 220,
    unitLabel: "회/주",
    usageType: "weeklyRuns",
    runHours: 1.5,
    defaultValue: 5,
    maxValue: 14,
    step: 1,
    defaultEnabled: true,
    manualId: "manual-06-robot-vacuum-lidar",
    note: "충전 및 물걸레 온수 세척·열풍 건조 포함",
  },
  {
    id: "carbonmat",
    name: "카본 온열매트 (퀸 사이즈)",
    group: "냉난방·공조",
    watts: 160,
    unitLabel: "시간/일",
    usageType: "dailyHours",
    defaultValue: 7,
    maxValue: 24,
    step: 1,
    defaultEnabled: false,
    manualId: "manual-28-carbon-mat-storage",
    note: "수면 온도 37~40℃ 유지 기준",
  },
];

// 2026 KEPCO 주택용(저압) 전기요금표 계산
interface TariffBreakdown {
  tier: 1 | 2 | 3;
  baseFee: number;
  energyCharge: number;
  climateCharge: number;
  fuelAdjustment: number;
  subtotal: number;
  vat: number;
  fund: number;
  totalBill: number;
  tier1Limit: number;
  tier2Limit: number;
}

function calculateKepcoBill(totalKwh: number, season: SeasonMode): TariffBreakdown {
  const kwh = Math.max(0, totalKwh);
  const tier1Limit = season === "summer" ? 300 : 200;
  const tier2Limit = season === "summer" ? 450 : 400;

  let tier: 1 | 2 | 3 = 1;
  let baseFee = 910;
  if (kwh > tier2Limit) {
    tier = 3;
    baseFee = 7300;
  } else if (kwh > tier1Limit) {
    tier = 2;
    baseFee = 1600;
  }

  const t1Kwh = Math.min(kwh, tier1Limit);
  const t2Kwh = Math.max(0, Math.min(kwh, tier2Limit) - tier1Limit);
  const t3Kwh = Math.max(0, kwh - tier2Limit);

  const energyCharge = t1Kwh * 120.0 + t2Kwh * 214.6 + t3Kwh * 307.3;
  const climateCharge = kwh * 9.0; // 기후환경요금 9원/kWh
  const fuelAdjustment = kwh * 5.0; // 연료비조정요금 5원/kWh

  const subtotal = Math.floor(baseFee + energyCharge + climateCharge + fuelAdjustment);
  const vat = Math.round(subtotal * 0.1);
  const fund = Math.floor((subtotal * 0.037) / 10) * 10; // 10원 미만 절사
  const totalBill = Math.floor((subtotal + vat + fund) / 10) * 10;

  return {
    tier,
    baseFee,
    energyCharge: Math.round(energyCharge),
    climateCharge: Math.round(climateCharge),
    fuelAdjustment: Math.round(fuelAdjustment),
    subtotal,
    vat,
    fund,
    totalBill,
    tier1Limit,
    tier2Limit,
  };
}

export function AppliancePowerCalculator({ onNavigate }: AppliancePowerCalculatorProps) {
  const [season, setSeason] = useState<SeasonMode>("other");
  const [baseHouseholdKwh, setBaseHouseholdKwh] = useState<number>(65); // 조명·TV·공유기 등 기본 상시부하

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(APPLIANCE_SPECS.map((a) => [a.id, a.defaultEnabled]))
  );
  const [usageMap, setUsageMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(APPLIANCE_SPECS.map((a) => [a.id, a.defaultValue]))
  );

  const handleReset = () => {
    setSeason("other");
    setBaseHouseholdKwh(65);
    setEnabledMap(Object.fromEntries(APPLIANCE_SPECS.map((a) => [a.id, a.defaultEnabled])));
    setUsageMap(Object.fromEntries(APPLIANCE_SPECS.map((a) => [a.id, a.defaultValue])));
  };

  const results = useMemo(() => {
    const itemStats = APPLIANCE_SPECS.map((spec) => {
      const active = Boolean(enabledMap[spec.id]);
      const val = usageMap[spec.id] ?? spec.defaultValue;
      let monthlyKwh = 0;
      if (active) {
        if (spec.usageType === "dailyHours") {
          monthlyKwh = (spec.watts * val * 30) / 1000;
        } else {
          monthlyKwh = (spec.watts * (spec.runHours || 1) * val * 4.33) / 1000;
        }
      }
      return {
        ...spec,
        active,
        usageValue: val,
        monthlyKwh,
      };
    });

    const appliancesKwh = itemStats.reduce((sum, item) => sum + item.monthlyKwh, 0);
    const totalKwh = Math.round((appliancesKwh + baseHouseholdKwh) * 10) / 10;
    const bill = calculateKepcoBill(totalKwh, season);

    const avgRatePerKwh = totalKwh > 0 ? bill.totalBill / totalKwh : 0;
    const itemsWithCost = itemStats
      .map((item) => ({
        ...item,
        estimatedWon: Math.round(item.monthlyKwh * avgRatePerKwh),
      }))
      .sort((a, b) => b.monthlyKwh - a.monthlyKwh);

    const topConsumers = itemsWithCost.filter((i) => i.active && i.monthlyKwh > 0).slice(0, 3);

    return {
      itemStats,
      itemsWithCost,
      appliancesKwh,
      totalKwh,
      bill,
      topConsumers,
    };
  }, [enabledMap, usageMap, baseHouseholdKwh, season]);

  const progressMax = season === "summer" ? 600 : 550;
  const progressPct = Math.min(100, Math.round((results.totalKwh / progressMax) * 100));

  return (
    <div className="max-w-[960px] mx-auto text-left font-sans pb-14">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[12.5px] text-[#64748B] mb-5">
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="hover:text-[#0F766E] transition-colors cursor-pointer"
        >
          홈
        </button>
        <span className="text-[#CBD5E1]">/</span>
        <span className="text-[#0F172A] font-medium">생활가전 월간 전기요금 누진제 계산기</span>
      </nav>

      {/* Editorial Header */}
      <header className="pb-6 border-b border-[#E2E8F0] mb-8">
        <p className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#0F766E] mb-2">
          2026 한국전력공사 주택용(저압) 누진제 기준
        </p>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-[#0F172A] tracking-tight leading-snug break-keep mb-3">
          생활가전 월간 전기요금 계산기
        </h1>
        <p className="text-[15px] leading-[1.7] text-[#475569] max-w-3xl break-keep">
          냉장고, 에어컨, 히트펌프 건조기, 식기세척기, 인덕션 등 가정 내 주요 가전의 실제 사용 시간과 주간 가동 횟수를 입력하면 2026년 주택용 저압 누진 단계별 예상 전력량(kWh)과 부가세·전력산업기반기금을 포함한 최종 청구액을 즉시 산출합니다.
        </p>
      </header>

      {/* Top Summary Metrics Strip */}
      <section aria-label="요금 산출 결과 요약" className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[#334155]">계절 구간 선택</span>
            <div className="inline-flex border border-[#CBD5E1] rounded-lg bg-white p-0.5">
              <button
                type="button"
                onClick={() => setSeason("other")}
                className={`px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  season === "other"
                    ? "bg-[#0F766E] text-white"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                기타 계절 (1~6월 · 9~12월)
              </button>
              <button
                type="button"
                onClick={() => setSeason("summer")}
                className={`px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  season === "summer"
                    ? "bg-[#0F766E] text-white"
                    : "text-[#475569] hover:text-[#0F172A]"
                }`}
              >
                하계 (7~8월 누진 완화)
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-1.5 border border-[#CBD5E1] bg-white rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 초기화</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-5">
          <div>
            <p className="text-[12.5px] font-semibold text-[#64748B] mb-1">예상 월간 총 전력량</p>
            <p className="text-[28px] font-extrabold text-[#0F172A] tabular-nums leading-tight">
              {results.totalKwh.toLocaleString("ko-KR", { maximumFractionDigits: 1 })}
              <span className="text-[15px] font-semibold text-[#64748B] ml-1">kWh</span>
            </p>
            <p className="text-[12px] text-[#64748B] mt-1 tabular-nums">
              선택 가전 {results.appliancesKwh.toFixed(1)} kWh + 조명·기본부하 {baseHouseholdKwh} kWh
            </p>
          </div>

          <div>
            <p className="text-[12.5px] font-semibold text-[#64748B] mb-1">적용 누진 단계</p>
            <p className="text-[28px] font-extrabold text-[#0F766E] tabular-nums leading-tight">
              {results.bill.tier}단계
              <span className="text-[14px] font-semibold text-[#475569] ml-2">
                {results.bill.tier === 1
                  ? "120.0원/kWh"
                  : results.bill.tier === 2
                  ? "214.6원/kWh"
                  : "307.3원/kWh"}
              </span>
            </p>
            <p className="text-[12px] text-[#64748B] mt-1 tabular-nums">
              {season === "summer"
                ? "하계 기준: 1단계 ≤300 · 2단계 ≤450 · 3단계 450초과"
                : "기타 계절: 1단계 ≤200 · 2단계 ≤400 · 3단계 400초과"}
            </p>
          </div>

          <div>
            <p className="text-[12.5px] font-semibold text-[#64748B] mb-1">최종 예상 전기요금 (세금 포함)</p>
            <p className="text-[28px] font-extrabold text-[#0F172A] tabular-nums leading-tight">
              {results.bill.totalBill.toLocaleString("ko-KR")}
              <span className="text-[15px] font-semibold text-[#64748B] ml-1">원</span>
            </p>
            <p className="text-[12px] text-[#64748B] mt-1 tabular-nums">
              기본요금 {results.bill.baseFee.toLocaleString()}원 · 부가세·기금 {(results.bill.vat + results.bill.fund).toLocaleString()}원 포함
            </p>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[12px] text-[#475569] mb-1.5 tabular-nums">
            <span>0 kWh</span>
            <span>1단계 상한 ({results.bill.tier1Limit} kWh)</span>
            <span>2단계 상한 ({results.bill.tier2Limit} kWh)</span>
            <span>{progressMax}+ kWh</span>
          </div>
          <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                results.bill.tier === 3
                  ? "bg-[#B91C1C]"
                  : results.bill.tier === 2
                  ? "bg-[#D97706]"
                  : "bg-[#0F766E]"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        {/* Left: Appliance Selector & Controls */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-[#0F172A]">보유 가전 및 사용 패턴 설정</h2>
            <span className="text-[12.5px] text-[#64748B]">체크박스로 가전을 켜고 사용량을 조절하세요</span>
          </div>

          {/* Base Household Load */}
          <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold text-[#0F172A]">기본 상시 부하 (LED 조명 · TV · 인터넷 공유기 · 충전기)</p>
              <p className="text-[12.5px] text-[#64748B]">1~2인 가구 평균 55~75 kWh, 3~4인 가구 평균 90~130 kWh</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={0}
                max={400}
                step={5}
                value={baseHouseholdKwh}
                onChange={(e) => setBaseHouseholdKwh(Math.max(0, Number(e.target.value) || 0))}
                aria-label="기본 상시 부하 kWh"
                className="w-20 h-9 px-2.5 border border-[#CBD5E1] rounded-lg text-right text-[14px] font-semibold text-[#0F172A] tabular-nums focus:outline-none focus:border-[#0F766E]"
              />
              <span className="text-[13px] text-[#475569] font-medium">kWh/월</span>
            </div>
          </div>

          {/* Appliance List */}
          <div className="border border-[#E2E8F0] rounded-xl bg-white divide-y divide-[#E2E8F0]">
            {results.itemStats.map((item) => (
              <div
                key={item.id}
                className={`p-4 transition-colors ${item.active ? "bg-white" : "bg-[#FAFAFA] opacity-75"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(e) =>
                        setEnabledMap((prev) => ({ ...prev, [item.id]: e.target.checked }))
                      }
                      className="mt-1 w-4 h-4 accent-[#0F766E] rounded cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14.5px] font-bold text-[#0F172A]">{item.name}</span>
                        <span className="text-[11.5px] text-[#64748B] tabular-nums">
                          · {item.watts}W · {item.group}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748B] mt-0.5">{item.note}</p>
                    </div>
                  </label>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-7 sm:pl-0 shrink-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={item.maxValue}
                        step={item.step}
                        disabled={!item.active}
                        value={item.usageValue}
                        onChange={(e) =>
                          setUsageMap((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                        }
                        aria-label={`${item.name} 사용량`}
                        className="w-24 accent-[#0F766E] cursor-pointer disabled:cursor-not-allowed"
                      />
                      <span className="text-[13px] font-semibold text-[#0F172A] tabular-nums w-20 text-right">
                        {item.usageValue} {item.unitLabel}
                      </span>
                    </div>

                    <div className="text-right w-20 tabular-nums">
                      <p className="text-[13.5px] font-bold text-[#0F766E]">
                        {item.monthlyKwh.toFixed(1)} kWh
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Bill Breakdown & Manual Links */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Bill Breakdown Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h3 className="text-[15px] font-bold text-[#0F172A] pb-3 mb-3 border-b border-[#E2E8F0] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#0F766E]" />
              <span>항목별 요금 명세서</span>
            </h3>
            <dl className="space-y-2.5 text-[13.5px] tabular-nums">
              <div className="flex justify-between text-[#475569]">
                <dt>기본요금 ({results.bill.tier}단계)</dt>
                <dd className="font-semibold text-[#0F172A]">{results.bill.baseFee.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between text-[#475569]">
                <dt>전력량요금 (누진 적용)</dt>
                <dd className="font-semibold text-[#0F172A]">{results.bill.energyCharge.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between text-[#475569]">
                <dt>기후환경요금 (9원/kWh)</dt>
                <dd className="font-semibold text-[#0F172A]">{results.bill.climateCharge.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between text-[#475569]">
                <dt>연료비조정요금 (5원/kWh)</dt>
                <dd className="font-semibold text-[#0F172A]">{results.bill.fuelAdjustment.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between text-[#475569] pt-2 border-t border-[#F1F5F9]">
                <dt>전기요금계</dt>
                <dd className="font-bold text-[#0F172A]">{results.bill.subtotal.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between text-[#64748B] text-[12.5px]">
                <dt>부가가치세 (10%)</dt>
                <dd>{results.bill.vat.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between text-[#64748B] text-[12.5px]">
                <dt>전력산업기반기금 (3.7%)</dt>
                <dd>{results.bill.fund.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between items-baseline pt-3 border-t border-[#E2E8F0] text-[#0F172A]">
                <dt className="font-bold text-[14px]">청구 예상 합계</dt>
                <dd className="font-extrabold text-[20px] text-[#0F766E]">
                  {results.bill.totalBill.toLocaleString()}원
                </dd>
              </div>
            </dl>
          </div>

          {/* Top Power Consumers + Direct Maintenance Manuals */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5">
            <h3 className="text-[15px] font-bold text-[#0F172A] pb-3 mb-3 border-b border-[#E2E8F0]">
              전력 소비 상위 3개 가전 · 절전 매뉴얼
            </h3>
            <p className="text-[12.5px] text-[#64748B] mb-3 leading-relaxed">
              필터 막힘이나 열교환기 오염은 동일 가동 시간 대비 소비전력을 15~35% 증가시킵니다. 상위 가전의 공식 점검 매뉴얼을 확인하세요.
            </p>
            <ul className="divide-y divide-[#F1F5F9]">
              {results.topConsumers.map((item, idx) => (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-[13.5px] mb-1">
                    <span className="font-bold text-[#0F172A]">
                      {idx + 1}. {item.name.split(" (")[0]}
                    </span>
                    <span className="font-bold text-[#0F766E] tabular-nums">
                      약 {item.estimatedWon.toLocaleString()}원/월
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] text-[#64748B]">
                    <span className="tabular-nums">{item.monthlyKwh.toFixed(1)} kWh/월</span>
                    <button
                      type="button"
                      onClick={() => onNavigate(`post-${item.manualId}`)}
                      className="text-[#0F766E] font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      관리 매뉴얼 보기 <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] text-[#475569] leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <p>
              아파트 공용 고압 계약이나 대가족·출산가구·복지할인(월 최대 16,000원 한도 30% 감면) 적용 가구는 실제 관리비 고지서 금액이 본 저압 표준 계산액보다 낮게 산출됩니다.
            </p>
          </div>
        </aside>
      </div>

      {/* Editorial Reference Section (High-Value Content Paired Directly With Tool) */}
      <article className="border-t border-[#E2E8F0] pt-10 space-y-8 text-[#334155]">
        <section className="space-y-3">
          <h2 className="text-[21px] font-extrabold text-[#0F172A] tracking-tight">
            1. 2026년 주택용(저압) 전기요금 누진제 구간 및 단가 구조
          </h2>
          <p className="text-[15px] leading-[1.8] break-keep">
            한국전력공사 주택용 전력(저압)은 월간 누적 사용량이 특정 구간을 초과할 때마다 kWh당 단가와 기본요금이 동시에 상승하는 3단계 누진 구조를 적용합니다. 특히 2단계에서 3단계로 넘어가는 순간 기본요금이 1,600원에서 7,300원으로 4.5배 이상 뛰고 전력량 단가도 307.3원으로 급등하므로, 가전제품의 소비전력 관리를 통해 2단계 구간 이내로 사용량을 유지하는 것이 월 전기요금 절감의 핵심입니다.
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-left border-collapse border border-[#E2E8F0] text-[13.5px] tabular-nums">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#0F172A]">
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">누진 단계</th>
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">기타 계절 (1~6월, 9~12월)</th>
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">하계 완화 (7~8월)</th>
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">기본요금 (원/호)</th>
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">전력량 요금 (원/kWh)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">1단계</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">200 kWh 이하</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">300 kWh 이하</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">910원</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">120.0원</td>
                </tr>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">2단계</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">201 ~ 400 kWh</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">301 ~ 450 kWh</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">1,600원</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">214.6원</td>
                </tr>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">3단계</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">400 kWh 초과</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">450 kWh 초과</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">7,300원</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">307.3원</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[21px] font-extrabold text-[#0F172A] tracking-tight">
            2. 가전 유지관리가 실제 전기요금을 20% 이상 낮추는 물리적 원리
          </h2>
          <p className="text-[15px] leading-[1.8] break-keep">
            가정 내 전력 소비의 절반 이상을 차지하는 가전은 냉장고·에어컨·건조기·제습기처럼 열교환기(증발기·응축기)와 인버터 압축기(컴프레서)를 구동하는 기기들입니다. 프리필터와 콘덴서 알루미늄 핀에 보풀과 미세먼지가 쌓이면 공기 풍량이 감소하여 목표 온도에 도달하는 시간이 길어지고, 압축기가 최대 회전수(Peak RPM)로 오래 가동되면서 누진 3단계 진입을 앞당깁니다.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[14.5px] leading-[1.75]">
            <li>
              <strong>시스템·스탠드 에어컨:</strong> 2주 1회 프리필터 먼지 세척만 실시해도 냉방 풍량 저항이 줄어 월간 소비전력이 평균 8~12% 감소합니다.
            </li>
            <li>
              <strong>인버터 히트펌프 건조기:</strong> 2중 보풀 필터를 매회 비우고 10회마다 물세척하면 건조 시간이 30~40분 단축되어 1회당 약 0.5 kWh를 절약합니다.
            </li>
            <li>
              <strong>4도어 냉장고:</strong> 냉장실 적재율을 70% 이하로 유지하고 후면 냉기 토출구를 확보하면 컴프레서 재가동 빈도가 크게 줄어듭니다.
            </li>
          </ul>
        </section>

        <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[14.5px] font-bold text-[#0F172A]">
              우리 집 가전의 필터 세척·교체 시기가 지났는지 바로 점검해 보세요
            </p>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              마지막 청소 날짜를 입력하면 기기별 D-Day와 연간 소모품 유지비를 자동으로 계산합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("tool-filter-cycle")}
            className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            필터·소모품 교체 주기 진단기 &rarr;
          </button>
        </div>
      </article>
    </div>
  );
}
