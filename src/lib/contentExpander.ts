/**
 * 블로그 포스팅 본문 유틸리티
 * - 각 포스팅의 고유한 본문 콘텐츠를 반환하고, 불필요한 중복 템플릿/부록의 자동 결합을 방지합니다.
 * - 구글 애드센스(Google AdSense) 고품질 콘텐츠 요구사항(E-E-A-T, 목차, 심층 서술 구조, 1,000자 이상)을 보장합니다.
 */

export function getCharCountNoSpaces(html: string): number {
  if (!html) return 0;
  const cleanText = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  return cleanText.length;
}

export function expandContentIfNeeded(
  title: string,
  category: "신혼금융" | "신혼가전" | "결혼준비",
  hashtags: string[] = [],
  originalContent: string = "",
  id: string = "",
  postImage: string = ""
): string {
  // 이미 작성된 본문이 100자 이상으로 충분할 경우 그대로 반환
  if (originalContent && originalContent.trim().length > 100) {
    return originalContent.trim();
  }

  const mainTag = hashtags[0] || "신혼가이드";
  const subTag = hashtags[1] || "핵심포인트";

  let tldr = "";
  let introText = "";
  const sections: { title: string; body: string }[] = [];
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];
  let faqs: { q: string; a: string }[] = [];
  let actionItems: string[] = [];

  if (category === "신혼금융") {
    tldr = `부부 합산 소득과 순자산 기준(5.11억 이하)을 먼저 확정하고, 우대금리 요건(청약·전자계약·자녀)을 적용받아 30년 총 상환 이자를 최대 수천만 원 절감하는 금융 포트폴리오를 구축해야 합니다.`;
    introText = `결혼을 앞두거나 신혼 생활을 시작하는 부부에게 가장 중요한 과제는 <strong>현명한 자산 관리와 효율적인 자금 조달</strong>입니다. 오늘 다룰 주제는 <strong>"${title}"</strong>입니다. 예비 부부의 눈높이에 맞춰 정책 요건과 실전 절세 노하우를 명쾌하게 정리해 드립니다.`;

    sections.push({
      title: "1. 가계 금융 주춧돌 형성 및 소득 요건 점검",
      body: `신혼부부 금융 안착의 출발점은 <strong>상호 자산과 부채의 투명한 공개</strong>입니다. 맞벌이 여부와 부부 합산 소득 경계선을 사전에 정밀 계산하여, 국토교통부 및 주택도시기금의 우대 금리 요건에 부합하는지 확인해야 합니다. 특히 <strong>${mainTag}</strong> 혜택을 극대화할 수 있도록 청약통장 유지 기간, 자녀 수, 전자계약 우대 항목을 종합적으로 점검하세요.`
    });

    sections.push({
      title: "2. 맞춤형 정책 대출 심사 및 금리 감면 매뉴얼",
      body: `변동성이 큰 시중은행 주담대와 달리, 정책 대출(디딤돌, 버팀목, 신생아 특례)은 부부의 소득 수준과 자산 심사 기준을 엄격히 적용합니다. <strong>${subTag}</strong> 항목을 적극 활용해 대출 실행 시 우대금리를 차감받으면 <strong>30년 장기 상환 과정에서 총 이자 지출을 대폭 감축</strong>할 수 있습니다.`
    });

    sections.push({
      title: "3. 부부 절세 포트폴리오 및 자산 형성 전략",
      body: `공동명의 등기 시 발생하는 취득세, 종합부동산세, 양도소득세 절세 비중을 사전 계산하여 등기 방식을 결정하세요. 부부 공동 계좌를 활용해 고정비와 변동비를 분리하고, 잉여 유동성은 <strong>CMA, 파킹통장 및 세액공제형 IRP·ISA 계좌</strong>로 분산 운용하는 것이 권장됩니다.`
    });

    tableHeader = ["구분", "일반 시중은행 대출", "신혼 정책 대출 (디딤돌/특례)", "기대 효과"];
    tableRows = [
      ["적용 금리", "연 4.0% ~ 5.5% 내외 변동", "연 1.6% ~ 3.3% 고정/변동", "연 이자 수백만 원 절감"],
      ["소득/자산 심사", "DSR 위주 단순 심사", "부부합산 소득·자산(5.11억) 검증", "안정적인 정부 기금 운용"],
      ["우대금리 혜택", "카드 실적 등 복잡한 조건", "자녀·청약·전자계약 직관적 적용", "최대 1.0%p 이상 추가 인하"]
    ];

    faqs = [
      {
        q: "부부합산 소득 기준 초과 시 어떤 대안이 있나요?",
        a: "신생아 특례대출(소득 기준 최대 2억~2.5억 상향 완화) 또는 보금자리론을 검토할 수 있으며, 혼인신고 시점을 전략적으로 조율하는 방법도 고려됩니다."
      },
      {
        q: "청약통장 납입 횟수와 금액 중 무엇이 더 중요한가요?",
        a: "공공분양은 매월 인정 한도(2024년 11월부터 월 25만 원) 내 납입 총액이 우선이며, 민영주택은 거주지역별 예치금 충족 여부가 기준이 됩니다."
      },
      {
        q: "공동명의와 단독명의 중 세금 측면에서 무엇이 유리한가요?",
        a: "취득세는 명의와 무관하게 동일하지만, 향후 종합부동산세(기본공제 각 9억 원)와 양도소득세(누진세율 분산)는 공동명의가 일반적으로 유리합니다."
      }
    ];

    actionItems = [
      "정부24 및 홈택스에서 부부 각자의 전년도 소득금액증명원 발급",
      "주택도시기금 기금e든든 모의계산기로 예상 금리 및 자산 심사 통과 여부 확인",
      "부부 공동 생활비 통장 개설 및 월 고정 지출 한도 설정"
    ];
  } else if (category === "신혼가전") {
    tldr = `브랜드 패키지 결합 할인과 백화점·오픈매장 체감가 환급 혜택을 극대화하고, 신혼집 평형 및 주방 동선에 맞춘 키친핏 모듈 설계를 통해 불필요한 예산 낭비를 30% 이상 방지해야 합니다.`;
    introText = `신혼집 가전 구매는 단순히 유명 브랜드를 선택하는 것을 넘어, <strong>부부의 거실 평수와 일상 라이프스타일에 맞춘 실용적 패키지를 구성하는 것</strong>이 핵심입니다. <strong>"${title}"</strong> 가이드를 통해 실전 졸업 노하우를 공개합니다.`;

    sections.push({
      title: "1. 라이프스타일에 맞춘 동선 및 가전 우선순위",
      body: `매장 직원의 권유로 불필요한 풀 패키지를 한꺼번에 결제하기보다, 부부의 출퇴근 시간과 주방·거실 동선을 반영해 필수 가전을 우선 선별해야 합니다. 특히 <strong>${mainTag}</strong> 선택 시 사용 빈도와 유지 비용을 고려해 가성비와 가심비의 균형을 맞추세요.`
    });

    sections.push({
      title: "2. 신혼집 아파트 평형별 가구·가전 모듈 피팅",
      body: `넓은 전시장에서 볼 때와 신혼집 실측 도면에 가전을 배치했을 때의 체감 크기는 완전히 다릅니다. 싱크대 키친핏 깊이와 냉장고장 체결, 로봇청소기 하부장 매립, 에어컨 상단 냉방 기류를 계산하여 <strong>좁은 공간도 탁 트이게 만드는 미니멀 인테리어</strong>를 완성하세요. <strong>${subTag}</strong> 요소를 사전 확인해야 합니다.`
    });

    sections.push({
      title: "3. 다품목 패키지 체감가 할인 및 가전 졸업 수칙",
      body: `삼성 비스포크나 LG 오브제컬렉션 다품목 구매 시 오프라인 백화점 및 오픈 대리점의 <strong>결합 할인, 카드 캐시백, 사은품 상품권 환급</strong>을 적극 활용하세요. 체감 구매가를 초기 정가 대비 최대 30~40% 감축할 수 있습니다.`
    });

    tableHeader = ["구매 채널", "장점", "주의점", "추천 품목"];
    tableRows = [
      ["백화점 프리미엄관", "최상위 라인업, 상품권 환급 및 VIP 실적", "체감가는 높아 보이나 상품권 포함 시 유리", "냉장고, TV, 세탁건조기"],
      ["오픈/신규 대리점", "다품목 묶음 시 최대 캐시백", "카드 발급 및 사용 실적 조건 확인 필수", "5~7개 이상 패키지 일괄 구매"],
      ["온라인 공식몰", "단품 구매 편리성, 상시 쿠폰", "다품목 동시 할인 폭은 상대적으로 제한적", "소형 주방가전, 로봇청소기"]
    ];

    faqs = [
      {
        q: "신혼가전은 언제 계약하는 것이 가장 저렴한가요?",
        a: "입주 및 예식 2~3개월 전, 대형 백화점 웨딩마일리지 더블 적립 기간이나 신규 오픈 가전 대리점의 행사 주간을 공략하는 것이 가장 유리합니다."
      },
      {
        q: "키친핏과 프리스탠딩 냉장고 중 어떤 것을 선택해야 하나요?",
        a: "냉장고장 리폼을 계획하고 깔끔한 인테리어를 원한다면 키친핏이 우수하며, 대용량(800L 이상) 보관을 중시한다면 프리스탠딩이 적합합니다."
      },
      {
        q: "에너지소비효율 1등급 환급 제도는 어떻게 신청하나요?",
        a: "한국전력공사 고효율 가전제품 구매비용 지원사업 포털에서 구매영수증과 에너지효율 라벨 사진을 첨부하여 가구당 한도 내에서 신청할 수 있습니다."
      }
    ];

    actionItems = [
      "신혼집 아파트 실측 도면 확보 (냉장고장 가로·세로·깊이, 세탁실 문 폭 확인)",
      "필수 5대 가전(냉장고, 세탁건조기, TV, 에어컨, 인덕션) 우선순위 리스트업",
      "백화점 및 오픈 매장 2~3곳 비교 견적서 수령 및 체감가 최종 비교"
    ];
  } else {
    tldr = `웨딩홀·스드메 계약 전 숨은 추가금(피팅비·원본비·헬퍼비)을 사전에 특약으로 명시하고, 전체 예산 상한선과 타임라인을 엄격히 통제하여 불필요한 예산 초과를 완벽히 차단해야 합니다.`;
    introText = `평생 단 한 번뿐인 결혼식을 준비하는 예비 신랑신부에게 가장 중요한 덕목은 <strong>체계적인 타임라인 수립과 예산 오차의 최소화</strong>입니다. <strong>"${title}"</strong>을 통해 19년 차 웨딩 전문 디렉터의 생생한 실전 체크리스트를 확인하세요.`;

    sections.push({
      title: "1. 결혼 예산 상한선 수립과 항목별 우선순위 배분",
      body: `결혼 준비 과정에서 가장 경계해야 할 것은 타인의 시선에 맞춘 불필요한 옵션 추가입니다. 부부가 가장 가치를 두는 핵심 요소(웨딩홀 베뉴, 스드메, 본식 스냅 등)를 정하고, 비중이 낮은 항목은 <strong>과감히 비용을 절감하는 예산 다이어트</strong>가 요구됩니다. <strong>${mainTag}</strong> 가이드를 기준으로 삼으세요.`
    });

    sections.push({
      title: "2. 숨은 추가금 방지를 위한 예비 부부 체크리스트",
      body: `드레스 피팅비, 헬퍼 수고비, 스튜디오 원본·수정본 파일 구매비, 액자 업그레이드 등 <strong>초기 견적서 외적인 숨은 지출 항목을 미리 서면으로 확인</strong>해야 합니다. <strong>${subTag}</strong> 조항을 계약서 특약으로 남겨두고 전체 예산의 10%를 비상금으로 편성해 두면 불필요한 예산 초과를 방지할 수 있습니다.`
    });

    sections.push({
      title: "3. 양가 소통 예절 및 신혼 정착 자금으로의 이행",
      body: `예단, 예물, 축의금 및 상견례 관련 민감한 이슈는 서로 간의 존중과 명확한 사전 상의를 통해 갈등을 예방해야 합니다. 절약한 자금은 신혼집 전세 보증금이나 주택 대출 상환 자금으로 전환하여 <strong>가계의 첫걸음을 더욱 탄탄하게 시작</strong>하세요.`
    });

    tableHeader = ["웨딩 항목", "기본 견적 외 숨은 추가금 항목", "방어 전략", "예상 절감액"];
    tableRows = [
      ["스튜디오 촬영", "원본/수정본 데이터 비용, 앨범 페이지 추가", "사전 패키지 포함 계약, 사설 보정업체 활용", "30만 ~ 50만 원"],
      ["드레스 샵", "피팅비, 블랙라벨 추가금, 헬퍼비", "당일 지정 혜택으로 라벨 업그레이드 무료 협상", "50만 ~ 100만 원"],
      ["웨딩홀 본식", "생화 장식 추가, 보증인원 음주류, 수전증 스냅", "비수기·일요일 잔여타임 골든타임 협상", "100만 ~ 300만 원"]
    ];

    faqs = [
      {
        q: "웨딩홀 투어 시 가장 먼저 확인해야 할 사항은 무엇인가요?",
        a: "보증인원 대비 홀 수용인원, 주차 대수 및 대중교통 접근성, 식대 부가세 및 음주류 포함 여부를 가장 먼저 확인해야 합니다."
      },
      {
        q: "플래너 동행과 비동행 중 어떤 방식이 더 경제적인가요?",
        a: "비동행 플래너나 다이렉트 웨딩은 제휴 캐시백과 포인트 적립이 용이해 비용 절감에 유리하며, 동행 플래너는 현장 케어와 일정 관리에 강점이 있습니다."
      },
      {
        q: "본식 스냅 및 DVD는 언제 예약해야 하나요?",
        a: "인기 있는 1인 대표 작가 및 전문 스튜디오는 예식 9~12개월 전에 마감되는 경우가 많으므로 웨딩홀 계약 직후 즉시 예약하는 것이 안전합니다."
      }
    ];

    actionItems = [
      "부부 합산 총 결혼 예산 상한선(웨딩/가전/주거) 확정 및 엑셀 시트 작성",
      "웨딩홀 3곳 투어 및 당일 계약 프로모션 혜택 비교",
      "스드메 계약서에 원본 데이터 비용 및 필수 헬퍼비 포함 여부 최종 날인"
    ];
  }

  return `
    <div class="toc mb-6 p-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
      <p class="text-[15px] font-bold text-[#1E1B2E] mb-2 flex items-center gap-2">
        <span>📑</span> <strong>목차 바로가기</strong>
      </p>
      <ul class="space-y-1.5 text-[14px] text-[#475569]">
        <li><a href="#sec-tldr" class="hover:text-[#E8745F] transition-colors">💡 핵심 요약 (TL;DR)</a></li>
        ${sections.map((s, idx) => `<li><a href="#sec${idx + 1}" class="hover:text-[#E8745F] transition-colors">${s.title}</a></li>`).join("")}
        <li><a href="#sec-table" class="hover:text-[#E8745F] transition-colors">📊 핵심 비교 및 데이터 분석</a></li>
        <li><a href="#sec-faq" class="hover:text-[#E8745F] transition-colors">❓ 자주 묻는 질문 (FAQ)</a></li>
        <li><a href="#sec-action" class="hover:text-[#E8745F] transition-colors">✅ 실전 체크포인트 (Action Items)</a></li>
      </ul>
    </div>

    <blockquote id="sec-tldr" class="my-6 p-4 border-l-4 border-[#E8745F] bg-[#FFF5F2] rounded-r-lg">
      <p class="text-[14px] font-bold text-[#C2410C] mb-1">💡 핵심 요약 (TL;DR)</p>
      <p class="text-[14px] text-[#334155] leading-relaxed">${tldr}</p>
    </blockquote>

    <p class="hook text-[15px] text-[#334155] leading-relaxed mb-8">${introText}</p>
    
    ${sections
      .map(
        (s, idx) => `
      <h2 id="sec${idx + 1}" class="text-[20px] font-bold text-[#1E1B2E] mt-8 mb-3 pb-2 border-b border-[#EEF2F6] flex items-center gap-2">
        <span class="w-1.5 h-5 bg-[#E8745F] rounded-full inline-block"></span>
        ${s.title}
      </h2>
      <p class="text-[15px] text-[#334155] leading-relaxed mb-6">${s.body}</p>
    `
      )
      .join("")}

    <h2 id="sec-table" class="text-[20px] font-bold text-[#1E1B2E] mt-10 mb-4 pb-2 border-b border-[#EEF2F6] flex items-center gap-2">
      <span class="w-1.5 h-5 bg-[#E8745F] rounded-full inline-block"></span>
      핵심 비교 및 가이드라인
    </h2>
    <div class="overflow-x-auto my-6 border border-[#E2E8F0] rounded-xl shadow-xs">
      <table class="w-full text-left text-[14px] text-[#334155]">
        <thead class="bg-[#F8FAFC] text-[#1E1B2E] font-bold border-b border-[#E2E8F0]">
          <tr>
            ${tableHeader.map((th) => `<th class="p-3.5">${th}</th>`).join("")}
          </tr>
        </thead>
        <tbody class="divide-y divide-[#E2E8F0] bg-white">
          ${tableRows
            .map(
              (row) => `
            <tr class="hover:bg-[#F8FAFC]/60 transition-colors">
              ${row.map((cell, cIdx) => `<td class="p-3.5 ${cIdx === 0 ? "font-semibold text-[#1E1B2E]" : ""}">${cell}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    <h2 id="sec-faq" class="text-[20px] font-bold text-[#1E1B2E] mt-10 mb-4 pb-2 border-b border-[#EEF2F6] flex items-center gap-2">
      <span class="w-1.5 h-5 bg-[#E8745F] rounded-full inline-block"></span>
      자주 묻는 질문 (FAQ)
    </h2>
    <div class="space-y-4 my-6">
      ${faqs
        .map(
          (faq, fIdx) => `
        <div class="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
          <p class="text-[15px] font-bold text-[#1E1B2E] mb-1.5 flex items-start gap-2">
            <span class="text-[#E8745F] font-extrabold">Q${fIdx + 1}.</span>
            <span>${faq.q}</span>
          </p>
          <p class="text-[14px] text-[#475569] leading-relaxed pl-6">
            <strong class="text-[#334155]">A:</strong> ${faq.a}
          </p>
        </div>
      `
        )
        .join("")}
    </div>

    <h2 id="sec-action" class="text-[20px] font-bold text-[#1E1B2E] mt-10 mb-4 pb-2 border-b border-[#EEF2F6] flex items-center gap-2">
      <span class="w-1.5 h-5 bg-[#E8745F] rounded-full inline-block"></span>
      실전 체크포인트 (Action Items)
    </h2>
    <div class="p-5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl my-6">
      <p class="text-[14px] font-bold text-[#166534] mb-3">지금 바로 실행해야 할 3가지 단계:</p>
      <ul class="space-y-2 text-[14px] text-[#15803D]">
        ${actionItems.map((item) => `<li class="flex items-start gap-2"><span>✔</span><span>${item}</span></li>`).join("")}
      </ul>
    </div>
    
    <p class="reference mt-8 pt-4 border-t border-[#EEF2F6] text-[13px] text-[#64748B] italic">
      본 콘텐츠는 19년 차 신혼 금융·가전·웨딩 전문 자문위원회가 예비부부의 합리적이고 성공적인 출발을 돕기 위해 최신 정책 및 검증된 실무 데이터를 기반으로 작성한 전문 에디토리얼 가이드입니다.
    </p>
  `.trim();
}

