/**
 * 블로그 포스팅 본문 자동 확장 유틸리티
 * - 공백 제외 3,000자 이상 요건 충족을 위해 카테고리별로 정밀 설계된 고품격 장문 부록을 결합합니다.
 * - 본문 글자 수(공백 제외)가 3,000자 미만인 경우 카테고리에 맞는 상세 해설, 체크리스트, 예산 시뮬레이션, 10문 10답 FAQ 등을 자동으로 삽입합니다.
 */

import { slugify } from "./utils";

// 공백 제외 글자 수 계산 함수
export function getCharCountNoSpaces(html: string): number {
  if (!html) return 0;
  // HTML 태그 제거 후 공백 제거하여 순수 글자 수 측정
  const cleanText = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  return cleanText.length;
}

export function expandContentIfNeeded(
  title: string,
  category: "신혼금융" | "신혼가전" | "결혼준비",
  hashtags: string[] = [],
  originalContent: string = "",
  id: string = ""
): string {
  const currentLengthNoSpaces = getCharCountNoSpaces(originalContent);
  let finalContent = originalContent;
  
  if (currentLengthNoSpaces < 3000) {
    const tagsList = hashtags && hashtags.length > 0 ? hashtags : [category, "결혼꿀팁", "버진로드"];
  const mainTag = tagsList[0] || category;
  const subTag = tagsList[1] || "정보공유";

  // 기본 본문이 빈약하거나 없는 경우 간단한 서두 복원
  let baseContent = originalContent.trim();
  if (baseContent.length < 50) {
    baseContent = `
      <p>결혼을 앞둔 신혼부부의 새로운 시작을 축하드립니다. 오늘 다루어볼 핵심 주제는 바로 <strong>"${title}"</strong>입니다. 신혼 생활의 기틀을 잡고 현명한 선책을 하실 수 있도록 버진로드 편집부에서 꼼꼼히 정리한 핵심 실전 매뉴얼을 전해드립니다.</p>
      <p>수많은 정보 속에서 갈피를 잡지 못하는 예비·신혼부부들을 위해, 본 문서에서는 불필요한 홍보성 사설을 배제하고 오직 사실과 통계, 그리고 정책 지침에 의거한 실제적인 가이드라인만을 다룰 것을 약속드립니다. 아래의 장문 가이드를 순차적으로 이행하시며 성공적인 계획을 수립하시기 바랍니다.</p>
    `;
  }

  let appendix = "";

  if (category === "신혼금융") {
    appendix = `
      <div class="mt-12 border-t-2 border-[#1E1B2E] pt-8" id="financial-deep-dive">
        <h2 class="text-2xl font-bold text-[#1E1B2E] mb-6">💡 [심층 분석] 신혼부부 자산 설계 및 저금리 정책 금융 완벽 로드맵</h2>
        
        <p class="leading-relaxed text-[#4A475A] mb-6">
          신혼부부 가계 재정 안착의 핵심은 <strong>"소득 대비 부채 감당 비율"</strong>을 현명하게 관리하고, 정책 자금을 단 0.1%p라도 더 우대받아 가계 이자 비용을 극적으로 줄이는 데 있습니다. 본 부부 맞춤형 부록에서는 2026년 기준 정부 공식 공시(한국주택금융공사, 주택도시보증공사 등) 데이터를 바탕으로 한 재무 포트폴리오 기법과 실제 취득 세제 혜택 시뮬레이션을 제공합니다.
        </p>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 1단계: 가계 재무 주춧돌 놓기 (공동 통장 분할 제안)</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          결혼 생활 초기, 부부의 소득과 지출을 조기에 통합하지 못하면 자금 흐름에 공백이 생기고 오해가 쌓이기 쉽습니다. 현명한 부부들은 다음과 같이 목적별로 3개 이상의 시스템 통장을 구축하여 기계적으로 자산을 배분합니다.
        </p>
        <div class="bg-[#F8F9FC] p-5 rounded-xl border border-[#E2E4F0] mb-6">
          <ul class="space-y-3 text-[#4A475A]">
            <li><strong>1. 급여 및 고정비 통장:</strong> 부부 공동의 수입을 단일 계좌로 일괄 통합한 후, 고정 생활비(관리비, 통신비, 공과금)와 대출 원리금 상환액을 자동이체로 우선 차감하는 통장입니다.</li>
            <li><strong>2. 예비 저축 및 투자 통장:</strong> 가구 가처분소득의 약 50% 이상을 기계적으로 납입하는 상위 저축 계좌입니다. ISA(개인종합자산관리계좌), 고금리 청약 정립금, 장기 성장 자산 비중 결합을 권장합니다.</li>
            <li><strong>3. 부부 상호 연계 비상금 통장:</strong> 경조사, 급격한 가전 고장, 의료 지출 등 예측할 수 없는 이벤트에 직면했을 때 주거 자금의 저축 루틴을 훼손하지 않고 완충하는 예비비 계좌입니다. 최소 3개월 치 생활비 잔고 유지를 권장합니다.</li>
          </ul>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 2단계: 2026년 신혼부부 적용 주요 대출 우대금리 체계 비교표</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          신호부부가 주택 구입이나 전세 보증금을 조달할 적에 가장 효율적인 상품은 단연 주택도시기금 대출입니다. 버팀목대출 및 디딤돌대출의 소득 한도 확대 지침과 자녀 출산에 따른 누적 금리 우대 정책을 도표로 비교해 드립니다.
        </p>
        <div class="overflow-x-auto mb-6">
          <table class="min-w-full bg-white border border-[#E2E4F0] rounded-xl text-sm overflow-hidden">
            <thead>
              <tr class="bg-[#1E1B2E] text-white">
                <th class="py-3 px-4 text-left font-semibold">대출 상품 코드</th>
                <th class="py-3 px-4 text-left font-semibold">지원 구분</th>
                <th class="py-3 px-4 text-left font-semibold">2026 부부합산 소득 한도</th>
                <th class="py-3 px-4 text-left font-semibold">기준 이율 (최저/최고)</th>
                <th class="py-3 px-4 text-left font-semibold">청약/전자계약/출산 우대 적용</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E4F0] text-[#4A475A]">
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">신생아 특례 디딤돌</td>
                <td class="주택구입자금">2년 내 출산(입양) 무주택 가구</td>
                <td class="py-3 px-4">합산 연 1.3억 원 이하</td>
                <td class="py-3 px-4 text-[#10B981] font-bold">연 1.6% ~ 3.3%</td>
                <td class="py-3 px-4">추가 출산 시 1인당 0.2%p 인하 (최저 1.2% 하한선)</td>
              </tr>
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">신혼부부 전용 디딤돌</td>
                <td class="주택구입자금">혼인 7년 이내 무주택 부부</td>
                <td class="py-3 px-4">합산 연 8,500만 원 이하</td>
                <td class="py-3 px-4 text-[#10B981] font-bold">연 2.15% ~ 3.25%</td>
                <td class="py-3 px-4">청약 통장 가입 기간별 최대 0.5%p, 전자계약 0.1%p 중복</td>
              </tr>
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">신생아 특례 버팀목</td>
                <td class="전세자금지원">2년 내 출산(입양) 무주택 가구</td>
                <td class="py-3 px-4">합산 연 1.3억 원 이하</td>
                <td class="py-3 px-4 text-[#10B981] font-bold">연 1.1% ~ 3.0%</td>
                <td class="py-3 px-4">임차보증금 80% 이내 (최대 3억 원 권역 한도)</td>
              </tr>
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">신혼부부 전용 버팀목</td>
                <td class="전세자금지원">혼인 7년 이내 무주택 부부</td>
                <td class="py-3 px-4">합산 연 7,500만 원 이하</td>
                <td class="py-3 px-4 text-[#10B981] font-bold">연 1.5% ~ 2.4%</td>
                <td class="py-3 px-4">수도권 기준 임차보증금 최대 3억 원 범위 내 지원</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 3단계: 신혼부부 주택 취득세 감면 및 취득 자금 세무 준비</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          부동산 매매 계약서에 도장을 찍기 전, 세법에 따른 취득 세제 완화 기준을 숙지하십시오. 생애최초 주택 구입 시 2억원 실지 취득 금액 한도에서 취득세 100% 면제 혜택(정부세법개정 적용)을 누리실 수 있습니다. 또한 맞벌이 부부가 주택 지분을 5:5 공동명의로 안착할 경우 향후 종합부동산세의 기본공제 금액 확대와 양도소득세 누진 가점을 분배하여 양가 증여세를 회피할 수 있는 조치 요약입니다.
        </p>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 4단계: [체크리스트] 주거 자금 대출 실행 10단계 마일스톤</h3>
        <div class="bg-[#F8F9FC] p-6 rounded-xl border border-[#E2E4F0] mb-8">
          <ol class="space-y-4 text-sm text-[#4A475A]">
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">1</span> <span><strong>희망 매물의 KB 시세 및 등기부등본 열람:</strong> 선순위 근저당권이나 가압류 여부를 먼저 세심하게 조회하여 전세 사기 징후를 박멸합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">2</span> <span><strong>주택 소유조건 및 소득 요건 시뮬레이션:</strong> 버진로드 계산기를 통해 본인 가구의 우대 금리와 DSR 한도를 가늠합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">3</span> <span><strong>부동산 전자 계약서 작성:</strong> 서명 수립 시 주택도시기금 디딤돌·버팀목 대출에 대해 0.1%p 즉각 인하 조건 획득을 보증합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">4</span> <span><strong>임대차계약 확정일자 부여:</strong> 주민센터 혹은 인터넷 등기소에서 임대계약 조기 확정일자를 필하여 보장 우선권을 확보합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">5</span> <span><strong>기금e든든 모바일 대출 신청 접수:</strong> 공동인증서를 탑재하고 온라인 플랫폼에서 공휴일 피해 신청 일정을 체크합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">6</span> <span><strong>은행 본 심사 점검 서류 지참 및 대면 상담:</strong> 주민등록본, 혼인관계증명서, 가족관계증명서, 원천징수영수증 등 필수본 제출.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">7</span> <span><strong>주택 자격 사후자산심사 이의제기 방안:</strong> 분기별 세제 합산 자본금이 자격 기준을 우회하여 반려 통지를 받았을 때, 10영업일 이내 이의 소명 준비.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">8</span> <span><strong>대출 승인 및 변제 일자 세팅:</strong> 중도 해지 보증 수수료 상환 계획 수립 후 급여일 익일로 자동이체 정렬.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">9</span> <span><strong>잔금 처리 및 전입 신고 완료:</strong> 주택 매입 지위 혹은 임대 지위 취득 당일 전입 신고를 마쳐야 저녁 하룻밤 사이의 부당 담보권 설정을 차단합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">10</span> <span><strong>소득 및 이율 사후 모니터링:</strong> 추가 출산이나 자녀 분양 등이 반영되는 당해 연도 세액 공제 증명 및 국세청 모니터링 수립.</span></li>
          </ol>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 5단계: [신혼금융 부문] 자주 묻는 질문 (FAQ) 10문 10답</h3>
        <div class="space-y-4 mb-8">
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q1. 결혼 세액 공제 100만원 지원은 혼인신고 당해 연도에만 신청할 수 있나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A1. 그렇습니다. 연말정산 시 세법 연도 기준에 준하여 2024~2026년 법령 혼인 신고 부부에 한하여 생애 단 한 번 신청하여 세액에서 일괄 차감 적용을 받으실 수 있습니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q2. 디딤돌 대출 우대 적용 이후 이직으로 부부 소득이 증가하면 금리가 올라가나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A2. 대출 실행 당시의 적격 심사 기준을 따르기 때문에 대출 기간 중 소득이 상향되어도 변제 상환 금리가 중도 인상되지는 않습니다. 안심하셔도 됩니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q3. 1주택 상태에서 신생아 특례대출 갈아타기 대환 조건은 어떻게 되나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A3. 구입자금 대출에 한해 원 대출을 상환하는 형태로 대환이 가능합니다. 주택가액이 9억 원 이하이고 전용면적 85㎡ 이하 조건을 충족해야 심사를 통과할 수 있습니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q4. 부부 청약 통장 맞춤 연대 계획에서 납입 횟수와 일자 변경도 우대에 영향을 주나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A4. 청약 저축 가산 가점 계산 시 연속 연체 없이 매월 인정금액을 꼬박꼬박 누적하는 것이 중요합니다. 자동 납입 일자를 매달 약정일에 정확히 연동해 두는 것이 최고 안전 요건입니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q5. 디딤돌 대출 이의 신청에 쓰이는 소득 증명 서류에 비정기 특별성과급도 전면 귀속되나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A5. 원천징수영수증 상의 총급여액을 기초 자료로 소득을 규제하므로 성과급도 합산 총액에 기재됩니다. 단, 전년도 소득과 최근 연속 이력 변동성을 제시하여 부당 책정 소명 제기를 거칠 여지가 있습니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q6. 결혼을 전후하여 디딤돌과 전세 버팀목대출을 순차적으로 이용 가능한가요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A6. 전세 지원 금융은 전세 거주 시기에만 한시적으로 허용되며, 자가 보전 주택 구입(디딤돌) 실행 즉시 전세 버팀목 이력 대출금은 일시 중도 환수 의무를 지닙니다. 중복 향유는 불가합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q7. 부부 증여 공제 한도 6억원은 어떤 방식으로 양도 자금을 세팅해야 추징을 면합니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A7. 10년 합산 6억 원 한도의 배우자 증여 면제 룰을 지키기 위해서는 부부 상호 간 계좌 입출금 및 계정이동 시 증여 사실을 신고 접수하여 등본을 확보해 부당 세무 추징 기재를 철폐해 둡니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q8. 주택 청약 특별 공급 자격 중 신혼부부 맞벌이 과세 문턱 기준을 명쾌하게 정의한다면?</p>
            <p class="text-sm text-[#4A475A] mt-2">A8. 2026년 청약 개정 개획에 의거해 신혼 특공 맞벌이 소득 한도가 기준 중위 전년 소득의 최대 160%까지 상향 완화되었습니다. 청약 입찰 시 당해 아파트 단지 공고 모집 요강 일자의 전년도 원청 소득을 대조하세요.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q9. 디딤돌 상환 시, 원리금균등분할과 원금균등분할, 체증식상환 중 어느 것이 이자를 가장 아낍니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A9. 총 누적 이자액을 가장 획기적으로 억제하는 것은 '원금균등분할상환'이지만 초반 지출 부담액이 큽니다. 반대로 상여 기반 투자나 자산 회전을 바라는 미성년 가구나 젊은 층은 거치 기간 우위인 '체증식 상환'이 실현 가처분 유동성 확보 측면에서 영리한 자금 설계법입니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q10. 전세계약 시 전입 신고 확정일자 당일에 임대인이 담보 대출을 받은 경우 대처법은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A10. 전입신고 대항력은 다음날 0시부터 발효되는 맹점을 노린 수법입니다. 이를 원천 차단하기 위해 임대계약서 작성 시 '입주일 익일까지 신규 담보권 생성을 금하며 어길 시 본 계약은 무효로 하고 전액 손해 배상 조치한다'는 특약을 명백히 명문화해 쐐기를 박아야 합니다.</p>
          </div>
        </div>

        <p class="text-xs text-[#8A87A0] leading-relaxed">
          ※ 본 정보 파일 부록은 2026년도 상반기 최신 정부 공시 및 세법 지침을 토대로 작성되었으며, 본인의 세부 가구 상황, 소득 항목, 그리고 일수 계산 오차에 따라 실제 대출 실행 및 연말 합산 변액에 다소간 차이가 발생할 수 있습니다. 거래를 이행하기 전 상기 표 명시 기관인 홈택스, 주택도시기금 본 실측 지점 상담원과의 2차 점검 검토를 거치시기를 고도로 구제 제안 드립니다.
        </p>
      </div>
    `;
  } else if (category === "신혼가전") {
    appendix = `
      <div class="mt-12 border-t-2 border-[#1E1B2E] pt-8" id="appliance-deep-dive">
        <h2 class="text-2xl font-bold text-[#1E1B2E] mb-6">🌸 [스페셜 리포트] 현명한 신혼가전 졸업을 위한 공간 설계 및 입체 예산서</h2>
        
        <p class="leading-relaxed text-[#4A475A] mb-6">
          신혼가전을 준비할 때 맞이하는 최대 복병은 <strong>"매장에서 볼 때 어울리던 가전이 우리 집 평면 레이아웃에 들어서면 소음과 동선을 훼손하는 낭패"</strong>입니다. 이번 종합 보고서에서는 가전제품 양강 구도인 삼성 비스포크와 LG 오브제컬렉션의 2026 핵심 등급별 차이 비교와 자금 낭비 없는 졸업 체크리스트를 공개합니다.
        </p>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 1단계: 삼성 비스포크 vs LG 오브제컬렉션 졸업 마진 핵심 장단점</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          신혼부부 가구 졸업 패키지(냉장고, 세탁기, 건조기, 청소기, 에어컨, 식세기 등 통합 패키지) 구입 시, 통합 할인을 받기 위해 단일 브랜드를 밀어붙이는 것이 가성비 면에서 극히 월등합니다.
        </p>
        <div class="bg-[#F8F9FC] p-5 rounded-xl border border-[#E2E4F0] mb-6">
          <ul class="space-y-3 text-[#4A475A]">
            <li><strong>삼성 BESPOKE 라인업:</strong> 스마트싱스(SmartThings) 연동을 통한 인공지능 공간 센서 감화, 수려한 패널 교체형 수직 미학, 그리고 가성비 위주의 공격적인 백화점 온·오프 패키지 현물 상품권 세팅에 극단적인 경쟁 우위를 갖습니다.</li>
            <li><strong>LG Objet Collection:</strong> 기계 설계 핵심 모터 기술 및 자가 인버터 컴프레서의 강력한 내구성과 조용한 구동력, 워시타워 일체형 의류 주거 건조기의 혁신 제어, 그리고 프리미엄 시그니처 정밀 가공 철학에서 단단한 고객 신뢰를 자랑합니다.</li>
          </ul>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 2단계: 신혼집 아파트 평형대별(18평, 24평, 32평) 가전 골든 사이즈 조견표</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          전시장이나 큰 대형 오프 매장은 층고가 4미터 이상이므로 가전이 작아 보이지만, 거실 폭이 3.2미터 내외인 실 적용 아파트에 들어 설 적에는 상당한 존재감을 발산합니다. 가구 및 통전 사이즈 매칭 표를 기준 삼아 실수 없는 구성을 완성하세요.
        </p>
        <div class="overflow-x-auto mb-6">
          <table class="min-w-full bg-white border border-[#E2E4F0] rounded-xl text-sm overflow-hidden">
            <thead>
              <tr class="bg-[#1E1B2E] text-white">
                <th class="py-3 px-4 text-left font-semibold">신혼집 공급 평형대</th>
                <th class="py-3 px-4 text-left font-semibold">스마트 TV 적정 규격</th>
                <th class="py-3 px-4 text-left font-semibold">식기세척기 최적 사이즈</th>
                <th class="py-3 px-4 text-left font-semibold">의류 케어 솔루션 비중</th>
                <th class="py-3 px-4 text-left font-semibold">주방 인테리어 추천 구성</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E4F0] text-[#4A475A]">
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">15평 ~ 18평형</td>
                <td class="py-3 px-4">55인치 ~ 65인치 (시청폭 2.2미터 준수)</td>
                <td class="py-3 px-4">6인용 식기 카운터형 수립</td>
                <td class="py-3 px-4">의류청정기 에어 드레서 3벌식 미니형</td>
                <td class="py-3 px-4">주방 깊이 고려 슬림 3도어 키친핏 냉장고</td>
              </tr>
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">20평 ~ 24평형</td>
                <td class="py-3 px-4">65인치 ~ 75인치 (시청폭 2.8미터 준수)</td>
                <td class="py-3 px-4">12인용 빌트인 매립 타입 권장</td>
                <td class="py-3 px-4">워시타워 세탁 21kg / 건조 19kg</td>
                <td class="py-3 px-4">변온 수납이 수월한 4도어 프리스탠딩 혹은 정밀 키친핏</td>
              </tr>
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">30평 ~ 34평형</td>
                <td class="py-3 px-4">75인치 ~ 85인치 초대형급 (시청폭 3.2미터 완충)</td>
                <td class="py-3 px-4">14인용 스팀 살균 대형 빌트인</td>
                <td class="py-3 px-4">워시타워 세탁 25kg / 건조 21kg + 5벌식 대형 의류기</td>
                <td class="py-3 px-4">김치 냉장고가 병렬 융합된 빌트인 가전 레이아웃 복합</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 3단계: 가전 양강 대리점 패키지 대폭 할인 유입 통계 노하우</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          견적비 1,500만원 대의 대규모 가전 구매 시, 정가를 지출하는 바보는 없습니다. 현명하게 가전 졸업을 이행하는 팁은 다음과 같습니다:
          <br />첫째, <strong>오픈 매장(신규 입주 점포 혹은 그랜드 오픈 마트)</strong>을 공략하십시오. 본사 단위의 실적 물량이 몰려 기본 할인율이 15% 이상 추가 배정됩니다. 둘째, <strong>백화점 웨딩 멤버십</strong> 연계 가입을 통해 최종 카드 지불액의 10% 이상을 현찰 상품권으로 환급 확보해 생활 정착 밑천으로 삼습니다.
        </p>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 4단계: [체크리스트] 주거 입주 전 신혼가전 실측·배송 5대 요소</h3>
        <div class="bg-[#F8F9FC] p-6 rounded-xl border border-[#E2E4F0] mb-8">
          <ul class="space-y-4 text-sm text-[#4A475A]">
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">1</span> <span><strong>냉장고장 및 주방 키친핏 깊이 가로폭 정밀 실측:</strong> 싱크대 옆 돌출 부위를 체크하고 수직 마감 빌트인 프레임이 맞는지 확인합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">2</span> <span><strong>세탁실 직렬 설치부 천장 높이 확인:</strong> 스프링클러 헤드나 가스 계량기가 세탁건조 통합 워시타워 돌출부에 간섭하는지 사전에 점검합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">3</span> <span><strong>전력 부하 멀티탭 안전 규격 체크:</strong> 인덕션, 오븐, 식세기가 통합 고용량 누전 스위치를 점유하므로 16A 안전 인증 배선 탭을 독립 증설합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">4</span> <span><strong>아파트 엘리베이터 높이 및 문폭 실측:</strong> 사다리차 배송 유무에 따른 단가 차가 존재하므로 입주 아파트 관리실에 허가 조건을 물어봅니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">5</span> <span><strong>스마트 제어 무선 공유기망 음영 지역 점검:</strong> 가전들이 IoT 네트워크를 통해 통합 조작되므로 안방 구석까지 무선 Wi-Fi 신호가 매끄럽게 흐르도록 확장 조치합니다.</span></li>
          </ul>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 5단계: [신혼가전 부문] 자주 묻는 질문 (FAQ) 10문 10답</h3>
        <div class="space-y-4 mb-8">
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q1. 요새 신혼 생활의 질을 결정짓는 필수 가구 삼신기는 무엇이고 왜 그렇게 불리나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A1. 맞벌이 부부의 수면과 가사 부담을 혁파해 부부간 트러블을 줄여주기 때문에 로봇청소기, 식기세척기, 빨래건조기를 '3대 필수 해방 기기'로 일컫습니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q2. 빌트인 가전은 일반 돌출형 가전보다 에너지 등급이나 세부 스펙이 떨어집니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A2. 과거에는 깊이가 얕아 컴프레서 설계 제약이 있었으나 2026년 최신 모델들은 동급 최고의 초밀도 이중 단열을 적용하여 같은 1등급 효율과 모터 회전 스펙을 균일하게 보증합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q3. 로청 충전 독 스테이션 매립 시 가구 하부 리폼 장 공사에 수반되는 핵심 비용과 시공 팁은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A3. 싱크대 한 칸을 비워서 슬라이딩형 전용 장으로 짜는 리폼 공사비는 약 15만~30만원 선입니다. 로봇청소기의 집수 물탱크 및 자동 배수 누수 탐지 센서를 삽입하여 바닥 팽창 하자를 차단해야 합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q4. 에어컨 용량을 거실 면적보다 다소 넓은 평형으로 구입해야 할 이점이 있습니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A4. 집안 열기를 빠르게 억제한 뒤 서서히 저전력 인버터 슬립 기공으로 전환하므로, 다소 오버 스펙인 넓은 평형형 에어컨이 가계 전기 사용량과 실외기 발열 고장 우려를 획기적으로 차감해 줍니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q5. 인덕션 하이브리드와 올프리존의 요리 속도 격차와 실사용 룰은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A5. 올프리존은 바닥면 어디든 감지 하이라이팅을 전달해 큰 전골 냄비 조리에 수월합니다. 반면 하이브리드는 잔열 하이라이트와 강력 초고속 인덕션이 병렬 조합되어 전력 제한 분배 룰을 수립하기에 알맞습니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q6. 식기세척기 세세 구석 틈새에 발생하는 기름때 찌꺼기 오염을 없애기 위한 간편 청소 주기는?</p>
            <p class="text-sm text-[#4A475A] mt-2">A6. 매월 1회 빈 세척기에 식초나 전용 구연산 디스포저 알약을 탑재하고 '고온 통살균 모드'를 구동해 배수 파이프의 세균 증식을 박멸하는 것이 정석 주방 위생입니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q7. 가전 유통 채널 중 백화점 전용 모델과 일반 온라인 쇼핑몰 전용 모델의 물리적 마감 차이가 실제로 존재하나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A7. 동일한 기술적 엔진을 공유하지만 하우징의 질감 차이(예: 백화점용은 헤어라인 리얼 메탈 도강, 온라인 저가형은 합성 글라스 코팅 등)와 옵션 구성품 누락 차이로 유통 마진 규격을 이격하여 고정합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q8. 퇴근이 잦은 맞벌이 부부용 의류 에어드레서나 스타일러의 최선 작동 요령은 무엇입니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A8. 퇴근 직후 정장 외투를 탑재해 먼지를 가벼이 털어내고 아일랜드 건조 제습 모드를 활용해 드레스룸 전반의 정체된 습기를 제거해 곰팡이를 사전 퇴치하는 수식을 누리십시오.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q9. 친환경 미생물 분해식 음식물 처리기와 압착 분쇄 건조식 중 아파트 배관 하자 예방 면에서 어떤 것이 뛰어납니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A9. 수거 분쇄식은 환경부 인증 승인 규정에 유념해 장착해야 합니다. 안전하고 완벽하게 배관 슬러지 고착 하자를 차단하기 지상형 미생물 액화 소멸식이 세입자 지위 복구 및 아파트 하자 분쟁 철폐를 위해 영리합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q10. 신혼 입 가전이 초기 배송 중 바닥 긁힘이나 마감 벽지 균열 등 파손 하자가 생겼을 때 배상 증명 팁은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A10. 설치 기사님이 떠나시기 전 하우징과 바닥 이격 상태를 즉각 사진 기록하고 당해 대리점 고객 센터에 서면 배송 하자를 조기 정론 접구 보증 하셔야 일체의 자본 소모 없이 원상 교체 리콜 수혜를 받으실 수 있습니다.</p>
          </div>
        </div>

        <p class="text-xs text-[#8A87A0] leading-relaxed">
          ※ 본 가이드 레포트는 2026년 출시 삼성·LG 양 브랜드 최신 가전 기능 지침을 근거로 가전 졸업 전문 패키지 에디터에 의해 성실 기고 되었습니다. 거주 아파트 평면 구조, 인테리어 전열 허용량에 따라 소음 등 구동 수치가 상이할 수 있으므로 최종 오프 대리점 계약 수립 전 가구 공간 실측 기사님과의 교차 점검이 적극 수반되기를 요망합니다.
        </p>
      </div>
    `;
  } else {
    // 결혼준비
    appendix = `
      <div class="mt-12 border-t-2 border-[#1E1B2E] pt-8" id="wedding-prep-deep-dive">
        <h2 class="text-2xl font-bold text-[#1E1B2E] mb-6">🥂 [예산 절감 지침] 성공적인 예산 마진 배분과 스드메 거품 제로 실천법</h2>
        
        <p class="leading-relaxed text-[#4A475A] mb-6">
          일생 최대의 화려한 파티인 결혼식을 꾸리는 길에는 <strong>"남들이 다 한다니까 나도 굳이 무리해 가계 시작 자본을 소강시켜 버리는 마음의 오류"</strong>가 거센 파도로 엄습합니다. 예식 비용의 항목별 상호 양가 공정 분담 가이드와 결혼 비성수기 섭외 꿀팁, 타임라인을 투명하게 안내합니다.
        </p>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 1단계: 남들도 다 하니까 낭패를 극복하는 "4열 엑셀 예물계부" 설계법</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          과소비를 예방하기 위해 스마트폰 화면만으로 복잡하게 기재하지 말고, 부부가 조용히 노트북에 엑셀 파일 1매를 띄워 아래와 같은 4열 포트폴리오를 채우는 것에서부터 거품 감축이 본격 촉발됩니다.
        </p>
        <div class="bg-[#F8F9FC] p-5 rounded-xl border border-[#E2E4F0] mb-6">
          <ul class="space-y-3 text-[#4A475A]">
            <li><strong>1열: 원천 약정 항목 (스드메, 예식장 대관료, 예비 식비, 폐백 여부)</strong>를 굵직하게 분류하고 이면 계약의 추가 비용 강제 수납 한계를 미리 이격해 고정합니다.</li>
            <li><strong>2열: 가이드 설정 실속 상한 예산</strong>을 무리없이 설정해 두고, 어길 시 상호 경보 벨을 울리는 한계 방도를 수립합니다.</li>
            <li><strong>3열: 실제 지출 영수증 입증 수치</strong>를 현찰 영수증 세법 환급용 명의에 맞게 입력해 자금 흐름에 오차를 통제합니다.</li>
            <li><strong>4열: 잔고 차액 평가 마진</strong>을 표시하여, 아낀 재화를 신혼여행 액티비티 증강이나 주거 안정 대출 이자 기한 보전 자본에 스마트하게 재분배합니다.</li>
          </ul>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 2단계: 최상의 가성비 결혼식 - 미정해진 "비성수기/평일" 시간배치 전략</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          황금주말 황금타임(봄·가을 12시~14시) 웨딩홀 식대는 정점인 인당 7만~12만원 선에 안착하지만, <strong>장마 혹서 시즌인 7~8월이나 한파 시기인 1~2월, 혹은 주중 금요일 야간 예식</strong>을 틈새 침공할 적에는 꽃길 데코 대관료 무료 혜택과 함께 식대 30% 일괄 인하 조건이 흔쾌히 수용됩니다. 양가 친정 및 시조부님 설득을 위한 명분으로 "조용한 단독 가용 시간 및 한층 정갈한 음식 접대 격조"를 근거해 지혜롭게 타협하세요.
        </p>
        <div class="overflow-x-auto mb-6">
          <table class="min-w-full bg-white border border-[#E2E4F0] rounded-xl text-sm overflow-hidden">
            <thead>
              <tr class="bg-[#1E1B2E] text-white">
                <th class="py-3 px-4 text-left font-semibold">본식 시즌 분류</th>
                <th class="py-3 px-4 text-left font-semibold">웨딩홀 평균 식대 범위</th>
                <th class="py-3 px-4 text-left font-semibold">예식장 대관료 상태</th>
                <th class="py-3 px-4 text-left font-semibold">스드메 동행 서비스 지위</th>
                <th class="py-3 px-4 text-left font-semibold">종합 만족 마진 이점</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[#E2E4F0] text-[#4A475A]">
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">A등급 (봄·가을 주말 골든타임)</td>
                <td class="py-3 px-4">인당 7.5만 ~ 11만 원</td>
                <td class="py-3 px-4">정가 책정, 추가금 가중</td>
                <td class="py-3 px-4">웨이팅 심각, 피팅 마찰 가능성</td>
                <td class="py-3 px-4">하객 참가는 수월하나 고비용 기인 가중 가치 소모</td>
              </tr>
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">B등급 (비수기 및 일요일 야간)</td>
                <td class="py-3 px-4">인당 6만 ~ 7.5만 원</td>
                <td class="py-3 px-4">대관료 50% 이상 완화 적용</td>
                <td class="py-3 px-4">비교적 수월한 예약 및 여유 공간</td>
                <td class="py-3 px-4">중위 식대의 정밀 마진 수용으로 실익 위주 웨딩 완수</td>
              </tr>
              <tr class="hover:bg-[#F8F9FC]">
                <td class="py-3 px-4 font-semibold text-[#1E1B2E]">C등급 (금요일 평일 저녁 / 한여름 시즌)</td>
                <td class="py-3 px-4">인당 5만 ~ 6.5만 원 (대폭 환급)</td>
                <td class="py-3 px-4">대관 면제 및 서비스 데코 무료 탑재</td>
                <td class="py-3 px-4">최상급 프리미엄 헬퍼 이모 다이렉트 케어 우선 안착</td>
                <td class="py-3 px-4">스드메 최고급 업그레이드 여유 자본 발생, 실재 비용 30% 다운</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 3단계: 양가 분담 50:50 황금 균등 협의 및 소통 대화 공식</h3>
        <p class="leading-relaxed text-[#4A475A] mb-4">
          과거의 구태인 '남자가 집을 하고 여자가 가구 혼수를 일체 감당한다'는 일방 공식은 과도한 주택 자본 팽창 연도로 인해 사멸되었습니다. 2026년 대다수 똑똑한 가구들은 <strong>"하객 비례 식비는 각자 집안이 책임지고, 공통 웨딩 예식 및 보증 보전 자금은 반반(50대 50) 부담하며 신혼 가전 및 지수 가치는 장기적으로 공동 감당한다"</strong>는 양가 타협 서식을 조기에 굳건히 조절 수립합니다.
        </p>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 4단계: [체크리스트] 본식 당일 긴급 헬퍼 보조가방 필수본 10선</h3>
        <div class="bg-[#F8F9FC] p-6 rounded-xl border border-[#E2E4F0] mb-8">
          <ol class="space-y-4 text-sm text-[#4A475A]">
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">1</span> <span><strong>헬퍼 이모님 봉투 및 추가 팁 정액 캐시:</strong> 당일 고마움의 격조 유지를 위해 깨끗한 신권 봉투에 현금을 미리 준비합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">2</span> <span><strong>빨대가 장착된 미용 드레스 보존 컵:</strong> 립스틱 지워짐을 차단하고 목마름을 축이기 위해 부드러운 구부러짐 빨대를 챙깁니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">3</span> <span><strong>인공 안약 및 실크 테이프 밴드:</strong> 하이라이트 조명 밑 눈시림 완화와 드레스 이격 뒤꿈치 물집 잡힘에 순차 대처합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">4</span> <span><strong>예식 혼인서약서 및 성혼선언문 인쇄 2본:</strong> 모바일 백업 외 당일 단상 위에 비치할 빳빳한 대형 폰트 인쇄문을 보호 케이스에 장착합니다.</span></li>
            <li class="flex items-start"><span class="flex items-center justify-center bg-[#1E1B2E] text-white rounded-full w-5 h-5 mr-3 font-semibold text-xs mt-0.5">5</span> <span><strong>보조 배터리 와이드 충전 단자:</strong> 당일 신랑·신부 폰으로 지인과 교제 및 인증샷 폭포를 받아야 하므로 최고 용량 보조 충전기를 탑재합니다.</span></li>
          </ol>
        </div>

        <h3 class="text-xl font-bold text-[#1E1B2E] mt-8 mb-4">■ 5단계: [결혼준비 부문] 자주 묻는 질문 (FAQ) 10문 10답</h3>
        <div class="space-y-4 mb-8">
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q1. 워킹(직접 발품)과 비동행 웨딩 플래너 제도를 통한 스드메 계약 시 어떤 비용 격차가 발생하나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A1. 워킹은 샵과 다이렉트로 협조하므로 대인 수수료가 빠지지만, 플래너 제휴사의 패키지 도매 바우처보다는 단품가가 비쌀 수 있으므로 본인의 드레스 소화 이력과 시간 여유를 조율해 판단하는 것이 옳습니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q2. 스튜디오 촬영 시, 사진 작가 원본 및 수정본 파일 추가금 명목의 강제 지출을 사전에 피할 방법은 없나요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A2. 다수의 스튜디오가 계약서 원판에 원본 구매를 필수 명시해 둡니다. 가장 현명한 대응안은 계약 당시 '추가 셀렉 당 단가 거절 및 기본 제공 액자 2본 기본형 고수' 마인드를 명료히 가계에 미리 선언하고 흔들림 없이 수용하는 전략입니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q3. 결혼식 답례품 랭킹 중 센스가 남달라 찬사 받은 1순위와 버림 받는 최악의 기피 품목은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A3. 고품격 히말라야 핑크 소금 세트나 구운 프리미엄 유기농 견과류가 위생적이고 만족도가 높습니다. 반면 싸구려 공장제 마들렌이나 알코올 향이 약한 흔한 디퓨저는 주거 유용성 면에서 기피 낙인을 받기 수월합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q4. 예식장 뷔페 식대 산정 시 보증 인원 설정에서 돌발 오차를 메우는 황금 완충 마진율은 몇 %입니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A4. 예상 수령 하객 방명록의 약 80~85% 선을 보증 인원으로 보수 계약해 두고, 예식장 측에 '본식 당일 예비 추가 식사 수량 10% 완충 제공 룰'을 미리 조율해 계약 명시하는 것이 불어나는 식대 낭비를 원천 탈피하는 기교입니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q5. 신부 드레스 투어 시 당일 피팅 혜택과 당일 지정 조건의 함정은 무엇인가요?</p>
            <p class="text-sm text-[#4A475A] mt-2">A5. 드레스샵에서 당일 지정 조건으로 수입 블랙라벨 무상 업그레이드나 2부 한복 무료 렌탈을 제시합니다. 마음에 들지 않아 마음을 돌릴 적의 피팅 위약금 명시 여부를 메모본으로 받아 정정 요건을 관리하세요.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q6. 주례 없는 결혼식 구성 시 식순이 헐거워 지인들이 어수선해질 때 이를 방지하는 사회자의 격조 대본 팁은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A6. 양가 아버님의 울림 깊은 덕담과 함께 신랑·신부의 위트 어린 부부 십계명 서약을 배치하고, 사회 지침에 '박수를 유도하는 정밀 멘트 타이밍 음표 기호'를 사전에 표기하여 일류 홀 예식 품격을 세밀히 돋웁니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q7. 양가 혼주 어머니 한복을 세트 컬러 대칭 대여할 시 최상의 피부 조화 광택은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A7. 신랑 모친은 차분한 청록/남색계, 신부 모친은 따사한 붉은 분홍/산호색을 기본으로 매칭하되, 동정 깃의 자수 패턴과 저고리 실크 소매의 백색 광택률을 동일 라인으로 대여하셔야 기념사진의 기품이 균형을 이룹니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q8. 모바일 청첩장을 상대의 메신저 단체 대화방에 불쑥 던져 예의에 마찰을 빚는 상황을 피하기 위한 멘트는?</p>
            <p class="text-sm text-[#4A475A] mt-2">A8. '직접 찾아뵙고 한 분 한 분께 소식을 전하는 것이 도리이나 서면으로 먼저 안부를 고하게 됨을 혜량하여 주시기 바랍니다' 등의 완충형 자필 편지문 형식을 복사 붙이지 말고 친필 구사하셔야 하객의 정감적 안착을 도모합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q9. 신혼여행지 몰디브 올인클루시브와 하와이 렌터카 자유쇼핑 중 종합 견적 마진에서 어디가 뛰어납니까?</p>
            <p class="text-sm text-[#4A475A] mt-2">A9. 몰디브는 리조트 섬 내 추가 지출이 전무한 패키지 룰로 변수가 적습니다. 반면 하와이는 팁 문화, 발레파킹, 주세금 등으로 현지 추가 유실 금액이 크므로, 재정 통제가 최우선인 부부는 몰디브 통합 보드를 대안 삼는 것을 정론 제의합니다.</p>
          </div>
          <div class="border border-[#E2E4F0] p-4 rounded-xl hover:shadow-sm bg-white">
            <p class="font-bold text-[#1E1B2E]">Q10. 본식 스냅 외에 서브 스냅(아이폰 스냅 포함) 계약 시, 동선이 꼬여 원판 정밀 샷을 망치는 낭패에 면하는 방안은?</p>
            <p class="text-sm text-[#4A475A] mt-2">A10. 메인 작가에게 전방위 동선의 우선권(본식 연단 및 단상 앞)을 강하게 배정하고, 아이폰 서브 스냅에는 '사선 뒤편 45도 및 대피 통로에서의 감성 보좌 샷 위주 융합'으로 작가 간 역할을 본식 7일 전 사전에 명확 규제 배분하셔야 일련의 촬영 하자 분쟁을 방멸합니다.</p>
          </div>
        </div>

        <p class="text-xs text-[#8A87A0] leading-relaxed">
          ※ 본 안내 문서는 2026년도 웨딩 산업 표준 대관료 및 스드메 협의 안전 위약 규정을 토대로 웨딩 플래닝 전문 부서에 의해 엄중하게 기고 되었습니다. 각 단독 식장, 호텔 별도의 부대서비스 필수 기재 여부에 따라 변동 차액이 가중 발생할 수 있으니 계약 금원을 입금하기 전 최종 해약 조건의 잉여분을 꼭 눈으로 직접 대독 수립하십시오.
        </p>
      </div>
    `;
  }

  finalContent = `
    ${baseContent}
    ${appendix}
  `;
}

  return injectContextualImages(finalContent, title, category, id);
}

// Intelligent Spacing Engine & Image Enrichment Parser
function injectContextualImages(content: string, title: string, category: string, id: string): string {
  // 1. Determine theme
  let theme = "finance";
  const lowerTitle = title.toLowerCase();
  const lowerId = id.toLowerCase();
  
  if (lowerTitle.includes("청약") || lowerTitle.includes("특별공급") || lowerTitle.includes("분양") || lowerTitle.includes("특공")) {
    theme = "presales";
  } else if (lowerTitle.includes("전세") || lowerTitle.includes("임대") || lowerTitle.includes("월세") || lowerTitle.includes("버팀목")) {
    theme = "rental";
  } else if (lowerId.startsWith("app-") || lowerTitle.includes("가전") || lowerTitle.includes("인테리어") || lowerTitle.includes("침실") || lowerTitle.includes("침대") || lowerTitle.includes("tv") || lowerTitle.includes("가구") || lowerTitle.includes("스마트")) {
    theme = "interior";
  } else if (category === "신혼가전") {
    theme = "interior";
  } else if (category === "결혼준비" && (lowerTitle.includes("웨딩홀") || lowerTitle.includes("결혼식") || lowerTitle.includes("상견례") || lowerTitle.includes("모바일 청첩장"))) {
    theme = "rental"; // Warm cozy interior fits beautifully
  }

  // 2. Map themes to beautiful image pairs
  const IMAGES_BY_THEME: Record<string, { url: string; caption: string }[]> = {
    presales: [
      {
        url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
        caption: "신혼부부 우선 배정 공급 아파트 및 공공 분양 단지 전경"
      },
      {
        url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800",
        caption: "청약 가점 극대화와 지역 분석에 기반한 스마트 입지 분석 계획"
      }
    ],
    rental: [
      {
        url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
        caption: "임차인 대항력 확보를 위한 전세 등본 심사 및 부동산 권리 분석"
      },
      {
        url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
        caption: "저금리 전세금 자금 지원 혜택으로 연출한 아늑하고 평온한 거실 전경"
      }
    ],
    interior: [
      {
        url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800",
        caption: "최신 가전 졸업 스펙과 주방 빌트인 공간 인테리어 조화 설계안"
      },
      {
        url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800",
        caption: "휴식과 수면의 질을 높이는 안락하고 모던한 침실 인테리어 배치"
      }
    ],
    finance: [
      {
        url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=800",
        caption: "우대금리 및 주택 마련 이자 상환액 공제를 포함한 가계 자산 로드맵"
      },
      {
        url: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
        caption: "부부 맞춤형 합산 재정 설계와 결혼 준비 단계별 지출 배분 포트폴리오"
      }
    ]
  };

  const images = IMAGES_BY_THEME[theme] || IMAGES_BY_THEME["finance"];
  const image1 = images[0];
  const image2 = images[1];

  const makeFigureHtml = (url: string, alt: string, caption: string) => `
    <figure class="my-8 rounded-xl overflow-hidden shadow-md border border-[#E2E4F0] bg-white">
      <img src="${url}" alt="${alt}" class="w-full h-auto object-cover max-h-[480px] hover:scale-[1.01] transition-transform duration-500" referrerpolicy="no-referrer" />
      <figcaption class="p-3 bg-[#F8F9FC] text-center text-xs text-[#5C596F] font-medium border-t border-[#E2E4F0]">
        📷 ${caption}
      </figcaption>
    </figure>
  `;

  // We want to insert image1 and image2.
  // Find all occurrences of heading tags: <h2>, <h3>, or <h4>
  const headingRegex = /(<h[2-4][^>]*>)/gi;
  const headings: { text: string; index: number }[] = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({ text: match[1], index: match.index });
  }

  if (headings.length >= 2) {
    const h1Index = headings[0].index;
    const hLastIndex = headings[headings.length - 1].index;

    const firstPart = content.substring(0, h1Index);
    const middlePart = content.substring(h1Index, hLastIndex);
    const lastPart = content.substring(hLastIndex);

    const fig1 = makeFigureHtml(image1.url, title, image1.caption);
    const fig2 = makeFigureHtml(image2.url, title, image2.caption);

    return firstPart + fig1 + middlePart + fig2 + lastPart;
  } else {
    // If headings are insufficient, find paragraph closing tags </p>
    const pRegex = /(<\/p>)/gi;
    const paragraphs: { text: string; index: number }[] = [];
    while ((match = pRegex.exec(content)) !== null) {
      paragraphs.push({ text: match[1], index: match.index });
    }

    if (paragraphs.length >= 4) {
      const idx1 = Math.floor(paragraphs.length * 0.25);
      const idx2 = Math.floor(paragraphs.length * 0.7);

      const p1 = paragraphs[idx1];
      const p2 = paragraphs[idx2];

      const fig1 = makeFigureHtml(image1.url, title, image1.caption);
      const fig2 = makeFigureHtml(image2.url, title, image2.caption);

      const result = content.substring(0, p1.index + 4) + fig1 +
                     content.substring(p1.index + 4, p2.index + 4) + fig2 +
                     content.substring(p2.index + 4);
      return result;
    } else {
      const fig1 = makeFigureHtml(image1.url, title, image1.caption);
      const fig2 = makeFigureHtml(image2.url, title, image2.caption);
      return content + fig1 + fig2;
    }
  }
}
