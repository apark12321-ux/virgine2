/**
 * Smart Search Query Builder & External Search Helper
 * Provides high-precision query formatting, domain refinement, and government portal matching for zero-result states.
 */

export interface SmartSearchOption {
  label: string;
  query: string;
  url: string;
}

export interface OfficialPortalInfo {
  title: string;
  desc: string;
  url: string;
  badge: string;
  agency: string;
}

export interface SmartSearchResult {
  rawQuery: string;
  primaryQuery: string;
  primaryUrl: string;
  intentCategory: "finance" | "housing" | "appliances" | "wedding" | "tax" | "general";
  intentBadge: string;
  refinedSuggestions: SmartSearchOption[];
  officialPortal?: OfficialPortalInfo;
}

function assembleCleanQuery(prefix: string, core: string, suffix: string): string {
  const parts = `${prefix} ${core} ${suffix}`.trim().split(/\s+/);
  const seen = new Set<string>();
  const cleanParts: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      cleanParts.push(part);
    }
  }
  return cleanParts.join(" ");
}

export function buildSmartGoogleSearch(rawQuery: string): SmartSearchResult {
  const query = (rawQuery || "").trim();

  // If query is empty, provide sensible default guidance
  if (!query) {
    const defaultQuery = "2026 신혼부부 디딤돌 버팀목 대출 청약 혜택";
    return {
      rawQuery: "",
      primaryQuery: defaultQuery,
      primaryUrl: `https://www.google.com/search?q=${encodeURIComponent(defaultQuery)}`,
      intentCategory: "general",
      intentBadge: "신혼 종합",
      refinedSuggestions: [
        {
          label: "2026 디딤돌대출 소득 조건 및 금리",
          query: "2026 신혼부부 디딤돌대출 소득 조건 금리",
          url: `https://www.google.com/search?q=${encodeURIComponent("2026 신혼부부 디딤돌대출 소득 조건 금리")}`
        },
        {
          label: "신혼부부 특별공급 가점 및 당첨 기준",
          query: "2026 신혼부부 특별공급 청약 가점 당첨 커트라인",
          url: `https://www.google.com/search?q=${encodeURIComponent("2026 신혼부부 특별공급 청약 가점 당첨 커트라인")}`
        },
        {
          label: "신혼가전 삼성 vs LG 패키지 견적 비교",
          query: "2026 신혼가전 패키지 견적 오픈점 백화점 비교",
          url: `https://www.google.com/search?q=${encodeURIComponent("2026 신혼가전 패키지 견적 오픈점 백화점 비교")}`
        }
      ]
    };
  }

  // Clean special characters and multi-spaces
  const clean = query.replace(/[#@$%^&*()_+=~`[\]{}|\\:;"'<>,.?/]/g, " ").replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();

  const hasWeddingContext = /신혼|결혼|예비부부|웨딩|혼인|부부|신생아|출산|혼수/.test(clean);
  const hasYear = /202[4-9]|2030/.test(clean);

  let intentCategory: SmartSearchResult["intentCategory"] = "general";
  let intentBadge = "신혼 생활";
  const suggestions: SmartSearchOption[] = [];
  let officialPortal: OfficialPortalInfo | undefined;

  const yearPrefix = hasYear ? "" : "2026";

  // 1. Finance & Housing Loan Intent (신혼금융 / 주택대출)
  if (/디딤돌|버팀목|전세|주담대|대출|보금자리|금리|dsr|ltv|한도|상환|신생아특례|생애최초|hug|주택도시기금/.test(lower)) {
    intentCategory = "finance";
    intentBadge = "신혼금융·대출";

    const weddingPrefix = hasWeddingContext ? "" : "신혼부부";
    const primary = assembleCleanQuery(`${yearPrefix} ${weddingPrefix}`, clean, "조건 및 금리 가이드");

    suggestions.push(
      {
        label: `[분석] '${clean}' 2026 신청 자격·소득 요건`,
        query: assembleCleanQuery(clean, "2026 신혼부부 소득 기준 신청 자격", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "2026 신혼부부 소득 기준 신청 자격", ""))}`
      },
      {
        label: `[계산] '${clean}' 우대금리 항목 및 모의 계산`,
        query: assembleCleanQuery(clean, "우대금리 자녀 청약통장 상환 모의계산", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "우대금리 자녀 청약통장 상환 모의계산", ""))}`
      },
      {
        label: `[공식] 주택도시기금 '${clean}' 최신 공식 공고`,
        query: assembleCleanQuery("주택도시기금", clean, "상품 안내 및 신청"),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery("주택도시기금", clean, "상품 안내 및 신청"))}`
      }
    );

    officialPortal = {
      title: "주택도시기금 (NHUF)",
      desc: "국토교통부 공식 디딤돌·버팀목·신생아특례 대출 상품 안내 및 신청 포털",
      url: "https://nhuf.molit.go.kr",
      badge: "주택도시기금 공식",
      agency: "국토교통부 / HUG"
    };

    return {
      rawQuery: query,
      primaryQuery: primary,
      primaryUrl: `https://www.google.com/search?q=${encodeURIComponent(primary)}`,
      intentCategory,
      intentBadge,
      refinedSuggestions: suggestions,
      officialPortal
    };
  }

  // 2. Housing Subscription / Special Supply Intent (주택청약 / 특별공급)
  if (/청약|특공|특별공급|가점|신혼희망타운|공공분양|사전청약|일반공급|당첨|분양가|청약홈|모델하우스/.test(lower)) {
    intentCategory = "housing";
    intentBadge = "주택청약·특공";

    const weddingPrefix = hasWeddingContext ? "" : "신혼부부";
    const primary = assembleCleanQuery(`${yearPrefix} ${weddingPrefix}`, clean, "가점 계산 및 당첨 기준");

    suggestions.push(
      {
        label: `[전략] '${clean}' 신혼부부 가점표 및 커트라인`,
        query: assembleCleanQuery(clean, "신혼부부 특별공급 가점 계산 당첨 커트라인 2026", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "신혼부부 특별공급 가점 계산 당첨 커트라인 2026", ""))}`
      },
      {
        label: `[공고] 청약홈 '${clean}' 2026 입주자 모집 공고`,
        query: assembleCleanQuery("청약홈", clean, "입주자 모집 공고 일정"),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery("청약홈", clean, "입주자 모집 공고 일정"))}`
      },
      {
        label: `[제도] 부부 중복청약 허용 및 신생아 우선공급`,
        query: "신혼부부 청약 부부 중복청약 허용 신생아 우선공급 가점",
        url: `https://www.google.com/search?q=${encodeURIComponent("신혼부부 청약 부부 중복청약 허용 신생아 우선공급 가점")}`
      }
    );

    officialPortal = {
      title: "한국부동산원 청약홈",
      desc: "신혼부부 특별공급 및 일반공급 분양 일정, 경쟁률, 청약 자격 모의 확인",
      url: "https://www.applyhome.co.kr",
      badge: "청약홈 공식",
      agency: "한국부동산원"
    };

    return {
      rawQuery: query,
      primaryQuery: primary,
      primaryUrl: `https://www.google.com/search?q=${encodeURIComponent(primary)}`,
      intentCategory,
      intentBadge,
      refinedSuggestions: suggestions,
      officialPortal
    };
  }

  // 3. Appliances & Interior (신혼가전 / 인테리어 / 혼수)
  if (/가전|냉장고|세탁기|건조기|비스포크|오브제|식기세척기|로봇청소기|tv|올레드|oled|매트리스|침대|쇼파|소파|인테리어|키친핏|빌트인|워시타워|워시콤보|에어컨|스타일러|에어드레서/.test(lower)) {
    intentCategory = "appliances";
    intentBadge = "신혼가전·인테리어";

    const weddingPrefix = hasWeddingContext ? "" : "신혼";
    const primary = assembleCleanQuery(`${yearPrefix} ${weddingPrefix}`, clean, "추천 및 견적 비교");

    suggestions.push(
      {
        label: `[견적] '${clean}' 2026 신혼 졸업 패키지 견적`,
        query: assembleCleanQuery(clean, "신혼가전 패키지 졸업 견적 체감가 2026", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "신혼가전 패키지 졸업 견적 체감가 2026", ""))}`
      },
      {
        label: `[비교] 삼성 vs LG '${clean}' 스펙·실사용 비교`,
        query: assembleCleanQuery(clean, "삼성 비스포크 LG 오브제 스펙 실사용 비교", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "삼성 비스포크 LG 오브제 스펙 실사용 비교", ""))}`
      },
      {
        label: `[실측] 신혼집 평수별 '${clean}' 사이즈·공간 실측`,
        query: assembleCleanQuery(clean, "신혼집 평수 59타입 84타입 빌트인 설치 공간", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "신혼집 평수 59타입 84타입 빌트인 설치 공간", ""))}`
      }
    );

    return {
      rawQuery: query,
      primaryQuery: primary,
      primaryUrl: `https://www.google.com/search?q=${encodeURIComponent(primary)}`,
      intentCategory,
      intentBadge,
      refinedSuggestions: suggestions
    };
  }

  // 4. Wedding Prep & Venue / Studio / Dress (결혼준비 / 스드메 / 웨딩홀)
  if (/스드메|웨딩|베뉴|웨딩홀|예식장|청첩장|본식|드레스|예단|예물|상견례|축의금|스냅|사회자|부케|메이크업|스튜디오|플래너|답례품|혼인서약서|식대|보증인원/.test(lower)) {
    intentCategory = "wedding";
    intentBadge = "결혼준비·스드메";

    const weddingPrefix = hasWeddingContext ? "" : "결혼준비";
    const primary = assembleCleanQuery(`${yearPrefix} ${weddingPrefix}`, clean, "견적 및 꿀팁");

    suggestions.push(
      {
        label: `[견적] '${clean}' 평균 견적 및 필수 추가금 방어`,
        query: assembleCleanQuery(clean, "평균 견적 추가금 원본비 헬퍼비 피팅비 2026", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "평균 견적 추가금 원본비 헬퍼비 피팅비 2026", ""))}`
      },
      {
        label: `[체크] '${clean}' 계약 전 당일 계약 혜택 및 체크리스트`,
        query: assembleCleanQuery(clean, "계약 전 확인사항 당일혜택 위약금 환불", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "계약 전 확인사항 당일혜택 위약금 환불", ""))}`
      },
      {
        label: `[일정] 결혼 6개월 전 '${clean}' 준비 타임라인`,
        query: assembleCleanQuery(clean, "결혼준비 순서 타임라인 D-180", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "결혼준비 순서 타임라인 D-180", ""))}`
      }
    );

    return {
      rawQuery: query,
      primaryQuery: primary,
      primaryUrl: `https://www.google.com/search?q=${encodeURIComponent(primary)}`,
      intentCategory,
      intentBadge,
      refinedSuggestions: suggestions
    };
  }

  // 5. Tax, Subsidy, Allowance, Gift (세제·증여·지원금)
  if (/세액공제|증여|증여세|취득세|연말정산|부모급여|아동수당|도약계좌|절세|지원금|복지로|홈택스|자금조달계획서|출산지원금|첫만남이용권/.test(lower)) {
    intentCategory = "tax";
    intentBadge = "세무·정부지원";

    const weddingPrefix = hasWeddingContext ? "" : "신혼부부";
    const primary = assembleCleanQuery(`${yearPrefix} ${weddingPrefix}`, clean, "공제 한도 및 신청 가이드");

    suggestions.push(
      {
        label: `[세무] '${clean}' 2026 공제 한도 및 신청 방법`,
        query: assembleCleanQuery(clean, "2026년 공제 한도 신청 방법 홈택스", ""),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "2026년 공제 한도 신청 방법 홈택스", ""))}`
      },
      {
        label: `[지원] 신혼·출산 가구 '${clean}' 정부 혜택 총정리`,
        query: assembleCleanQuery("신혼부부 출산", clean, "정부 혜택 지원금 대상"),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery("신혼부부 출산", clean, "정부 혜택 지원금 대상"))}`
      },
      {
        label: `[공식] 복지로·국세청 '${clean}' 공식 가이드`,
        query: assembleCleanQuery("복지로 국세청 홈택스", clean, "공식 신청"),
        url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery("복지로 국세청 홈택스", clean, "공식 신청"))}`
      }
    );

    if (/부모급여|아동수당|지원금|출산/.test(lower)) {
      officialPortal = {
        title: "복지로 (Bokjiro) 정부 복지포털",
        desc: "부모급여, 아동수당, 첫만남이용권 등 영유아·출산 가구 정부 지원금 공식 신청",
        url: "https://www.bokjiro.go.kr",
        badge: "복지로 공식",
        agency: "보건복지부"
      };
    } else {
      officialPortal = {
        title: "국세청 홈택스 (Hometax)",
        desc: "결혼 특별세액공제, 혼인 증여재산 공제(최대 3억 원), 연말정산 모의계산",
        url: "https://www.hometax.go.kr",
        badge: "국세청 공식",
        agency: "국세청"
      };
    }

    return {
      rawQuery: query,
      primaryQuery: primary,
      primaryUrl: `https://www.google.com/search?q=${encodeURIComponent(primary)}`,
      intentCategory,
      intentBadge,
      refinedSuggestions: suggestions,
      officialPortal
    };
  }

  // 6. Default Fallback
  const weddingPrefix = hasWeddingContext ? "" : "신혼부부";
  const primary = assembleCleanQuery(`${yearPrefix} ${weddingPrefix}`, clean, "정보 가이드");

  suggestions.push(
    {
      label: `[가이드] '${clean}' 신혼부부 2026 실전 가이드`,
      query: assembleCleanQuery(clean, "신혼부부 2026 추천 가이드", ""),
      url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "신혼부부 2026 추천 가이드", ""))}`
    },
    {
      label: `[정책] '${clean}' 관련 최신 정부 정책 및 혜택`,
      query: assembleCleanQuery(clean, "신혼 정부 정책 혜택 조건 2026", ""),
      url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "신혼 정부 정책 혜택 조건 2026", ""))}`
    },
    {
      label: `[후기] 예비부부 커뮤니티 '${clean}' 실제 후기 및 팁`,
      query: assembleCleanQuery(clean, "신혼부부 웨딩 실제 후기 팁", ""),
      url: `https://www.google.com/search?q=${encodeURIComponent(assembleCleanQuery(clean, "신혼부부 웨딩 실제 후기 팁", ""))}`
    }
  );

  return {
    rawQuery: query,
    primaryQuery: primary,
    primaryUrl: `https://www.google.com/search?q=${encodeURIComponent(primary)}`,
    intentCategory,
    intentBadge,
    refinedSuggestions: suggestions
  };
}
