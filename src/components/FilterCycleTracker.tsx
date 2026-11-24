import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, Clock, ArrowRight, RotateCcw } from "lucide-react";

interface FilterCycleTrackerProps {
  onNavigate: (page: string) => void;
}

type HouseholdIntensity = "light" | "standard" | "heavy";

interface MaintenanceItem {
  id: string;
  appliance: string;
  partName: string;
  group: "세탁·건조" | "주방가전" | "냉난방·공조" | "청소·생활";
  baseCycleDays: number;
  annualConsumableWon: number;
  consumableNote: string;
  manualId: string;
  defaultDaysAgo: number;
  defaultOwned: boolean;
}

const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: "washer-tub",
    appliance: "드럼세탁기",
    partName: "고무패킹·통살균 및 하단 배수 거름망",
    group: "세탁·건조",
    baseCycleDays: 30,
    annualConsumableWon: 24000,
    consumableNote: "전용 세탁조 클리너 연 12회 기준",
    manualId: "manual-01-drum-washer",
    defaultDaysAgo: 26,
    defaultOwned: true,
  },
  {
    id: "dryer-filter",
    appliance: "히트펌프 의류건조기",
    partName: "외부 2차 미세필터 물세척 및 콘덴서 케어",
    group: "세탁·건조",
    baseCycleDays: 21,
    annualConsumableWon: 12000,
    consumableNote: "보풀 필터 예비품·세척 브러시",
    manualId: "manual-02-heatpump-dryer",
    defaultDaysAgo: 19,
    defaultOwned: true,
  },
  {
    id: "aircon-prefilter",
    appliance: "천장형·스탠드 에어컨",
    partName: "프리필터 분해 물세척 및 송풍 건조 점검",
    group: "냉난방·공조",
    baseCycleDays: 14,
    annualConsumableWon: 0,
    consumableNote: "중성세제 물세척 (추가 소모품비 없음)",
    manualId: "manual-05-system-aircon-filter",
    defaultDaysAgo: 18,
    defaultOwned: true,
  },
  {
    id: "airpurifier-hepa",
    appliance: "타워형 공기청정기",
    partName: "헤파(HEPA) 일체형 필터 교체 및 PM 센서 청소",
    group: "냉난방·공조",
    baseCycleDays: 365,
    annualConsumableWon: 65000,
    consumableNote: "정품 H13 헤파+탈취 일체형 필터 연 1회",
    manualId: "manual-08-air-purifier-hepa",
    defaultDaysAgo: 310,
    defaultOwned: true,
  },
  {
    id: "dishwasher-filter",
    appliance: "빌트인 식기세척기",
    partName: "하부 3중 거름망 세척 및 린스·구연산 통세척",
    group: "주방가전",
    baseCycleDays: 14,
    annualConsumableWon: 36000,
    consumableNote: "식기세척기 린스 및 전용 클리너",
    manualId: "manual-04-dishwasher-maintenance",
    defaultDaysAgo: 10,
    defaultOwned: true,
  },
  {
    id: "water-purifier",
    appliance: "직수형 정수기",
    partName: "출수 코크 살균 및 자가교체 필터 카트리지",
    group: "주방가전",
    baseCycleDays: 120,
    annualConsumableWon: 96000,
    consumableNote: "4개월 주기 복합 필터 카트리지 기준",
    manualId: "manual-09-direct-water-purifier",
    defaultDaysAgo: 95,
    defaultOwned: true,
  },
  {
    id: "robot-vacuum",
    appliance: "로봇청소기",
    partName: "라이다 센서·메인 브러시 및 오수통 살균",
    group: "청소·생활",
    baseCycleDays: 14,
    annualConsumableWon: 48000,
    consumableNote: "더스트백·헤파필터·물걸레 패드 교체",
    manualId: "manual-06-robot-vacuum-lidar",
    defaultDaysAgo: 15,
    defaultOwned: true,
  },
  {
    id: "stick-vacuum",
    appliance: "무선 스틱 청소기",
    partName: "사이클론 먼지통·프리필터 물세척 및 24시간 건조",
    group: "청소·생활",
    baseCycleDays: 30,
    annualConsumableWon: 18000,
    consumableNote: "연 1회 배기 미세먼지 필터 교체",
    manualId: "manual-11-cordless-stick-vacuum",
    defaultDaysAgo: 20,
    defaultOwned: true,
  },
  {
    id: "bidet-filter",
    appliance: "전자식 비데",
    partName: "스테인리스 노즐 석회 세척 및 세디먼트 필터 교체",
    group: "청소·생활",
    baseCycleDays: 180,
    annualConsumableWon: 22000,
    consumableNote: "6개월 주기 정수 세디먼트 필터 연 2개",
    manualId: "manual-22-bidet-nozzle-filter",
    defaultDaysAgo: 150,
    defaultOwned: true,
  },
  {
    id: "humidifier-scale",
    appliance: "복합 가습기",
    partName: "진동자 석회 스케일 구연산 세척 및 기화 필터",
    group: "냉난방·공조",
    baseCycleDays: 7,
    annualConsumableWon: 28000,
    consumableNote: "식품첨가물 구연산 및 시즌 기화 필터",
    manualId: "manual-14-hybrid-humidifier",
    defaultDaysAgo: 5,
    defaultOwned: false,
  },
];

const STORAGE_KEY = "virginroad_filter_cycle_v1";

function formatDateInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return formatDateInput(d);
}

const INTENSITY_MULTIPLIER: Record<HouseholdIntensity, number> = {
  light: 1.15,
  standard: 1.0,
  heavy: 0.75,
};

export function FilterCycleTracker({ onNavigate }: FilterCycleTrackerProps) {
  const [intensity, setIntensity] = useState<HouseholdIntensity>("standard");
  const [ownedMap, setOwnedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ownedMap) return parsed.ownedMap;
      }
    } catch {}
    return Object.fromEntries(MAINTENANCE_ITEMS.map((item) => [item.id, item.defaultOwned]));
  });

  const [lastCleanedMap, setLastCleanedMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lastCleanedMap) return parsed.lastCleanedMap;
      }
    } catch {}
    return Object.fromEntries(
      MAINTENANCE_ITEMS.map((item) => [item.id, getDateDaysAgo(item.defaultDaysAgo)])
    );
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ intensity, ownedMap, lastCleanedMap })
      );
    } catch {}
  }, [intensity, ownedMap, lastCleanedMap]);

  const handleMarkDoneToday = (id: string) => {
    const today = formatDateInput(new Date());
    setLastCleanedMap((prev) => ({ ...prev, [id]: today }));
  };

  const handleReset = () => {
    setIntensity("standard");
    setOwnedMap(Object.fromEntries(MAINTENANCE_ITEMS.map((item) => [item.id, item.defaultOwned])));
    setLastCleanedMap(
      Object.fromEntries(
        MAINTENANCE_ITEMS.map((item) => [item.id, getDateDaysAgo(item.defaultDaysAgo)])
      )
    );
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const diagnostics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mult = INTENSITY_MULTIPLIER[intensity];

    const rows = MAINTENANCE_ITEMS.map((item) => {
      const owned = Boolean(ownedMap[item.id]);
      const adjustedCycle = Math.max(3, Math.round(item.baseCycleDays * mult));
      const lastStr = lastCleanedMap[item.id] || getDateDaysAgo(item.defaultDaysAgo);
      const lastDate = new Date(`${lastStr}T00:00:00`);
      const elapsedDays = Number.isNaN(lastDate.getTime())
        ? 0
        : Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = adjustedCycle - elapsedDays;

      let status: "overdue" | "dueSoon" | "healthy" = "healthy";
      if (remainingDays <= 0) {
        status = "overdue";
      } else if (remainingDays <= Math.max(3, Math.round(adjustedCycle * 0.2))) {
        status = "dueSoon";
      }

      const nextDueDate = new Date(lastDate.getTime() + adjustedCycle * 24 * 60 * 60 * 1000);
      const nextDueStr = Number.isNaN(nextDueDate.getTime())
        ? "-"
        : formatDateInput(nextDueDate);

      return {
        ...item,
        owned,
        adjustedCycle,
        lastStr,
        remainingDays,
        nextDueStr,
        status,
      };
    });

    const ownedRows = rows.filter((r) => r.owned);
    const overdueCount = ownedRows.filter((r) => r.status === "overdue").length;
    const dueSoonCount = ownedRows.filter((r) => r.status === "dueSoon").length;
    const annualBudget = ownedRows.reduce((sum, r) => sum + r.annualConsumableWon, 0);

    return {
      rows,
      ownedCount: ownedRows.length,
      overdueCount,
      dueSoonCount,
      annualBudget,
    };
  }, [intensity, ownedMap, lastCleanedMap]);

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
        <span className="text-[#0F172A] font-medium">가전 필터·소모품 교체 주기 진단기</span>
      </nav>

      {/* Editorial Header */}
      <header className="pb-6 border-b border-[#E2E8F0] mb-8">
        <p className="text-[12px] font-bold tracking-[0.06em] uppercase text-[#0F766E] mb-2">
          제조사 공식 서비스 표준 주기 기반
        </p>
        <h1 className="text-[26px] sm:text-[32px] font-extrabold text-[#0F172A] tracking-tight leading-snug break-keep mb-3">
          가전 필터·소모품 교체 주기 진단기
        </h1>
        <p className="text-[15px] leading-[1.7] text-[#475569] max-w-3xl break-keep">
          보유 중인 생활가전과 마지막 세척·교체 일자를 입력하면 가구 사용 강도에 맞춘 다음 관리 D-Day와 예상 연간 소모품 유지비를 자동 산출합니다. 입력 기록은 브라우저에 자동 저장되며 외부 서버로 전송되지 않습니다.
        </p>
      </header>

      {/* Top Controls & Diagnostic Summary */}
      <section className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 sm:p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-bold text-[#334155]">가구 사용 강도</span>
            <div className="inline-flex border border-[#CBD5E1] rounded-lg bg-white p-0.5">
              {(
                [
                  { id: "light", label: "1~2인 맞벌이 (여유)" },
                  { id: "standard", label: "표준 가정 (권장)" },
                  { id: "heavy", label: "3~4인·반려동물 (집중)" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setIntensity(opt.id)}
                  className={`px-3 py-1.5 text-[12.5px] font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    intensity === opt.id
                      ? "bg-[#0F766E] text-white"
                      : "text-[#475569] hover:text-[#0F172A]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-1.5 border border-[#CBD5E1] bg-white rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>초기화</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 pt-5 tabular-nums">
          <div>
            <p className="text-[12.5px] font-semibold text-[#64748B] mb-1">관리 대상 가전</p>
            <p className="text-[24px] font-extrabold text-[#0F172A]">{diagnostics.ownedCount}대</p>
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-[#64748B] mb-1">즉시 관리 필요</p>
            <p className={`text-[24px] font-extrabold ${diagnostics.overdueCount > 0 ? "text-[#B91C1C]" : "text-[#0F766E]"}`}>
              {diagnostics.overdueCount}건
            </p>
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-[#64748B] mb-1">점검 권장 임박</p>
            <p className="text-[24px] font-extrabold text-[#B45309]">{diagnostics.dueSoonCount}건</p>
          </div>
          <div>
            <p className="text-[12.5px] font-semibold text-[#64748B] mb-1">예상 연간 소모품비</p>
            <p className="text-[24px] font-extrabold text-[#0F172A]">
              {diagnostics.annualBudget.toLocaleString("ko-KR")}
              <span className="text-[13px] font-semibold text-[#64748B] ml-1">원</span>
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Checklist Table */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-[#0F172A]">가전별 필터·부품 점검 현황</h2>
          <span className="text-[12.5px] text-[#64748B]">마지막 관리일을 수정하면 상태가 즉시 갱신됩니다</span>
        </div>

        <div className="border border-[#E2E8F0] rounded-xl bg-white divide-y divide-[#E2E8F0]">
          {diagnostics.rows.map((row) => (
            <div
              key={row.id}
              className={`p-4 sm:p-5 transition-colors ${row.owned ? "bg-white" : "bg-[#FAFAFA] opacity-65"}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Checkbox + Appliance Info */}
                <label className="flex items-start gap-3 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={row.owned}
                    onChange={(e) =>
                      setOwnedMap((prev) => ({ ...prev, [row.id]: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 accent-[#0F766E] rounded cursor-pointer shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-bold text-[#0F172A]">{row.appliance}</span>
                      <span className="text-[12px] text-[#64748B] tabular-nums">
                        · {row.group} · 권장 주기 {row.adjustedCycle}일
                      </span>
                    </div>
                    <p className="text-[13.5px] text-[#334155] font-medium mt-0.5">{row.partName}</p>
                    <p className="text-[12px] text-[#64748B] mt-0.5 tabular-nums">
                      {row.consumableNote}
                      {row.annualConsumableWon > 0 && ` (연 약 ${row.annualConsumableWon.toLocaleString()}원)`}
                    </p>
                  </div>
                </label>

                {/* Right: Date Picker + Status + Actions */}
                <div className="flex flex-wrap items-center gap-3 pl-7 lg:pl-0 shrink-0">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold text-[#64748B] mb-0.5">마지막 관리일</span>
                    <input
                      type="date"
                      disabled={!row.owned}
                      value={row.lastStr}
                      onChange={(e) =>
                        setLastCleanedMap((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      aria-label={`${row.appliance} 마지막 관리일`}
                      className="h-8.5 px-2.5 border border-[#CBD5E1] rounded-lg text-[12.5px] text-[#0F172A] tabular-nums focus:outline-none focus:border-[#0F766E] disabled:bg-[#F1F5F9]"
                    />
                  </div>

                  {/* Status Label (explicit text + icon, not color-only) */}
                  <div className="min-w-[116px] text-left sm:text-right tabular-nums">
                    {!row.owned ? (
                      <span className="text-[12.5px] text-[#94A3B8] font-medium">미보유 제외</span>
                    ) : row.status === "overdue" ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#B91C1C]">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          즉시 관리 ({Math.abs(row.remainingDays)}일 경과)
                        </span>
                        <p className="text-[11px] text-[#64748B]">권장일 {row.nextDueStr}</p>
                      </div>
                    ) : row.status === "dueSoon" ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#B45309]">
                          <Clock className="w-3.5 h-3.5" />
                          점검 권장 (D-{row.remainingDays})
                        </span>
                        <p className="text-[11px] text-[#64748B]">예정일 {row.nextDueStr}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[#0F766E]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          정상 (D-{row.remainingDays})
                        </span>
                        <p className="text-[11px] text-[#64748B]">예정일 {row.nextDueStr}</p>
                      </div>
                    )}
                  </div>

                  {row.owned && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkDoneToday(row.id)}
                        className="px-2.5 py-1.5 text-[12px] font-semibold text-[#334155] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      >
                        오늘 완료
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate(`post-${row.manualId}`)}
                        className="px-2.5 py-1.5 text-[12px] font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                      >
                        매뉴얼 <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Editorial Reference Guide Paired With Tool */}
      <article className="border-t border-[#E2E8F0] pt-10 space-y-8 text-[#334155]">
        <section className="space-y-3">
          <h2 className="text-[21px] font-extrabold text-[#0F172A] tracking-tight">
            1. 제조사 공식 권장 소모품 관리 주기 및 미관리 시 고장 유형
          </h2>
          <p className="text-[15px] leading-[1.8] break-keep">
            가전제품 서비스센터 출장 접수 사례 중 상당수는 부품 결함이 아니라 필터 막힘, 물때(탄산칼슘 스케일) 누적, 유연제 유막 고착으로 인한 센서 오작동에서 비롯됩니다. 아래 표준 주기표를 참고하여 무상 보증 기간 이후에도 기기 수명을 안정적으로 유지하시기 바랍니다.
          </p>
          <div className="overflow-x-auto my-4">
            <table className="w-full text-left border-collapse border border-[#E2E8F0] text-[13.5px]">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#0F172A]">
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">가전 품목</th>
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">핵심 점검 부품</th>
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">표준 주기</th>
                  <th className="border border-[#E2E8F0] px-4 py-3 font-bold">미관리 시 대표 장애</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">드럼세탁기</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">도어 고무패킹 · 배수 거름망</td>
                  <td className="border border-[#E2E8F0] px-4 py-3 tabular-nums">월 1회</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">배수 지연(OE/5E 에러), 흑곰팡이 악취</td>
                </tr>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">히트펌프 건조기</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">2중 보풀필터 · 콘덴서 핀</td>
                  <td className="border border-[#E2E8F0] px-4 py-3 tabular-nums">3주 / 분기</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">건조 시간 2배 증가, 컴프레서 과열 정지</td>
                </tr>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">시스템 에어컨</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">흡입 프리필터 · 드레인 펌프</td>
                  <td className="border border-[#E2E8F0] px-4 py-3 tabular-nums">2주 / 연 1회</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">냉방 효율 저하, 응축수 천장 누수</td>
                </tr>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">타워형 공기청정기</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">H13 헤파필터 · PM 먼지센서</td>
                  <td className="border border-[#E2E8F0] px-4 py-3 tabular-nums">12개월 / 2개월</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">청정 수치 오표시, 탈취 필터 산패 악취</td>
                </tr>
                <tr>
                  <td className="border border-[#E2E8F0] px-4 py-3 font-semibold text-[#0F172A]">식기세척기</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">3중 거름망 · 상하단 분사 노즐</td>
                  <td className="border border-[#E2E8F0] px-4 py-3 tabular-nums">2주 / 월 1회</td>
                  <td className="border border-[#E2E8F0] px-4 py-3">물 얼룩 백화 현상, 배수 펌프 이물 끼임</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-[21px] font-extrabold text-[#0F172A] tracking-tight">
            2. 물세척 필터 완전 건조 원칙과 주의사항
          </h2>
          <p className="text-[15px] leading-[1.8] break-keep">
            건조기 2차 필터, 무선청소기 프리필터, 에어컨 프리필터처럼 물세척이 가능한 부품이라도 수분이 남은 상태에서 본체에 재장착하면 내부 모터 침수 및 곰팡이 포자 확산의 직접 원인이 됩니다. 반드시 직사광선을 피한 그늘에서 최소 24시간 이상 완전히 건조한 뒤 결합해야 하며, H13 등급 헤파(HEPA) 필터는 섬유 정전 구조가 파괴되므로 절대 물세척하지 않고 교체해야 합니다.
          </p>
        </section>

        <div className="p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[14.5px] font-bold text-[#0F172A]">
              우리 집 가전 전체의 월간 전기요금 누진 단계도 함께 확인해 보세요
            </p>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              2026년 한전 주택용(저압) 단가표로 가전별 월간 소비전력과 청구액을 시뮬레이션할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("tool-power-cost")}
            className="px-4 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            전기요금 누진제 계산기 &rarr;
          </button>
        </div>
      </article>
    </div>
  );
}
