export interface Persona {
  name: string;
  role: string;
  avatar: string;
  badge: string;
  message: string;
}

export interface GeoSource {
  agency: string;
  region: string;
  basis: string;
  trustIndex: string;
  urlLabel?: string;
  url?: string;
}

export interface AeoFaq {
  q: string;
  a: string;
}

export interface PostExtra {
  persona: Persona;
  geoSource: GeoSource;
  aeoFaq: AeoFaq[];
  adsName: string;
  adsKeyword: string;
}

export const POST_EXTRA_MAP: Record<string, PostExtra> = {
  "fin-39": {
    persona: {
      name: "버진로드",
      role: "신혼 내집마련 실전 팁",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=120",
      badge: "실전팁",
      message: "디딤돌대출 우대금리를 0.1%p라도 더 챙기려면 전자계약과 청약통장 서류를 계약 전 미리 준비해 두는 것이 핵심입니다."
    },
    geoSource: {
      agency: "주택도시기금 (HUG)",
      region: "전국",
      basis: "2026년 주택도시기금 대출 운용 기준",
      trustIndex: "주택도시기금 공식 기준"
    },
    aeoFaq: [
      {
        q: "청약통장 우대금리는 배우자 명의 통장도 합산해 적용받을 수 있나요?",
        a: "아닙니다. 주 대출 신청자 본인 명의의 청약저축 납입 회차 및 가입 기간만 인정됩니다. 부부 중 청약 가입 기간이 더 길고 납입 회차가 많은 분이 주 대출 신청자로 진행하시는 것을 권장합니다."
      },
      {
        q: "부동산 전자계약 우대금리는 어떻게 받나요?",
        a: "국토교통부 부동산거래 전자계약시스템(irds.kr)을 통해 계약을 체결하면 대출 신청 시 전자계약 번호를 입력하여 0.1%p 우대금리를 적용받을 수 있습니다."
      },
      {
        q: "자산 심사 기준을 초과하면 디딤돌대출이 완전히 거절되나요?",
        a: "순자산 기준(2026년 기준 5.11억 원)을 초과할 경우 대출 승인이 제한되거나, 실행 이후 초과가 확인되면 가산금리가 부과될 수 있습니다. 대출 신청 전 자산 항목을 꼼꼼히 점검해야 합니다."
      }
    ],
    adsName: "주택도시기금 내집마련 디딤돌대출 모의 계산",
    adsKeyword: "디딤돌대출 우대금리 조건"
  },
  "fin-38": {
    persona: {
      name: "버진로드",
      role: "신혼 청약 실전 팁",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=120",
      badge: "청약팁",
      message: "맞벌이 부부라면 2026년 개편된 소득 기준과 부부 중복 청약 규정을 잘 활용하면 당첨 확률을 크게 높일 수 있습니다."
    },
    geoSource: {
      agency: "한국부동산원 청약홈(Applyhome)",
      region: "수도권 및 전국",
      basis: "주택공급에 관한 규칙 (2026년 기준)",
      trustIndex: "청약홈 공식 공시 규정"
    },
    aeoFaq: [
      {
        q: "부부가 동일 단지에 동시 청약해서 둘 다 당첨되면 어떻게 처리되나요?",
        a: "2026년 개편 규칙에 따라 중복 당첨 시 '접수 일시가 빠른 명의자'의 당첨만 인정되며 늦게 접수한 청약은 자동 무효 처리됩니다. 따라서 부부가 동시에 동일 단지에 안전하게 청약할 수 있습니다."
      },
      {
        q: "배우자의 청약통장 가입 기간 점수도 청약 가점에 반영되나요?",
        a: "네, 본인의 청약 가점 계산 시 배우자 청약통장 가입 기간의 50%(최대 3점까지)를 가산점으로 더할 수 있어 부부 합산 시 청약 가점을 더 높일 수 있습니다."
      }
    ],
    adsName: "청약홈 신혼부부 가점 모의 진단 서비스",
    adsKeyword: "신혼부부 특별공급 청약 가점"
  },
  "fin-41": {
    persona: {
      name: "버진로드",
      role: "가계 재무 실전 팁",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=120",
      badge: "재무팁",
      message: "신생아 특례와 일반 디딤돌 사이에서 우대금리 기간과 이후 변동 폭을 꼼꼼히 따져보고 결정하세요."
    },
    geoSource: {
      agency: "한국주택금융공사(HF) / 주택도시보증공사(HUG)",
      region: "전국",
      basis: "정책자금 대출 운용 기준",
      trustIndex: "주택금융공사 공식 가이드라인"
    },
    aeoFaq: [
      {
        q: "출생일 기준 2년 이내 조건에 입양 자녀도 포함되나요?",
        a: "네, 입양 자녀 역시 입양일 기준으로 동일하게 적용됩니다. 혼인 신고 여부와 상관없이 출산 및 입양 자녀가 있다면 우대금리 혜택을 받으실 수 있습니다."
      },
      {
        q: "중도상환수수료는 어떻게 계산되나요?",
        a: "디딤돌대출 등 정책 자금 대출은 3년 이내 상환 시 남은 기간에 따라 최대 1.2% 범위에서 슬라이딩 방식으로 중도상환수수료가 차등 부과됩니다."
      }
    ],
    adsName: "신혼부부 주택담보대출 금리 비교 조회",
    adsKeyword: "신생아 특례 디딤돌 대출"
  },
  "fin-43": {
    persona: {
      name: "버진로드",
      role: "공공임대 실전 팁",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120",
      badge: "임대팁",
      message: "공공임대는 소득 및 자산 기준 검증이 매우 꼼꼼하므로, 서류 발급 시 건강보험 보수월액을 사전에 확인하는 것이 필수입니다."
    },
    geoSource: {
      agency: "LH 한국토지주택공사 / SH 서울주택도시공사",
      region: "전국",
      basis: "2026년 공공주택 입주자 모집 계획",
      trustIndex: "LH 청약플러스 공식 모집공고"
    },
    aeoFaq: [
      {
        q: "공공임대에 살다가 일반 분양주택에 당첨되면 퇴거해야 하나요?",
        a: "네, 계약 기간 중이라도 분양권을 취득하거나 주택을 소유하게 되면 차기 임대차 계약 갱신 시점에 퇴거 의무가 발생합니다."
      },
      {
        q: "소득 기준 산정 시 상여금이나 성과급도 모두 포함되나요?",
        a: "네, 국민건강보험공단의 보수월액 및 국세청 근로소득 원천징수 대상이 되는 모든 수당과 상여금이 합산되어 소득 심사를 받게 됩니다."
      }
    ],
    adsName: "전국 공공임대 주택 입주 자격 진단",
    adsKeyword: "신혼부부 행복주택 공공임대"
  },
  "fin-44": {
    persona: {
      name: "버진로드",
      role: "청년·신혼 주거 팁",
      avatar: "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?auto=format&fit=crop&q=80&w=120",
      badge: "주거팁",
      message: "2026년부터 상시 신청으로 전환된 월세 지원 제도의 핵심 자격 조건을 꼼꼼히 확인하고 혜택을 놓치지 마세요."
    },
    geoSource: {
      agency: "보건복지부 / 국토교통부 (복지로)",
      region: "전국",
      basis: "2026년 청년 및 신혼부부 주거 지원 지침",
      trustIndex: "복지로 공식 안내"
    },
    aeoFaq: [
      {
        q: "보증금 5,000만 원에 월세 65만 원인 계약도 지원이 가능한가요?",
        a: "네, 보증금 5,000만 원 이하 및 월세 70만 원 이하 조건에 모두 부합하므로 소득 요건을 충족하면 월 최대 20만 원의 주거비 지원을 받으실 수 있습니다."
      },
      {
        q: "부부 중 한 명만 연령 요건(만 19~34세)에 맞아도 신청할 수 있나요?",
        a: "네, 부부 중 1인이라도 연령 요건을 충족하고 무주택 독립 가구 기준에 맞다면 주거지 행정복지센터나 복지로 모바일을 통해 신청이 가능합니다."
      }
    ],
    adsName: "주거 바우처 및 월세 지원 자격 확인",
    adsKeyword: "청년 월세 지원 정책"
  },
  "fin-01": {
    persona: {
      name: "버진로드",
      role: "대출 비교 실전 팁",
      avatar: "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&q=80&w=120",
      badge: "대출팁",
      message: "디딤돌, 보금자리론, 신생아특례 중 내 집 마련 자금 구조에 꼭 맞는 정책 대출을 한눈에 비교해 보세요."
    },
    geoSource: {
      agency: "한국주택금융공사(HF) / 주택도시보증공사(HUG)",
      region: "전국",
      basis: "주택도시기금 대출 업무 기준",
      trustIndex: "한국주택금융공사 공시"
    },
    aeoFaq: [
      {
        q: "디딤돌대출 한도가 부족할 때 보금자리론을 중복으로 받을 수 있나요?",
        a: "동일 주택에 대해 디딤돌대출과 보금자리론을 동시 중복 실행하는 것은 불가능하며, 디딤돌대출 실행 후 부족분은 LTV 70% 범위 내에서 시중은행 대출 등을 조합하셔야 합니다."
      }
    ],
    adsName: "신혼부부 주택구입자금 대출 상품 한도 조회",
    adsKeyword: "신혼부부 대출 비교"
  },
  "app-12": {
    persona: {
      name: "버진로드",
      role: "신혼가전 견적 팁",
      avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=120",
      badge: "가전팁",
      message: "매장에서 풀 패키지로 한 번에 계약하기보다, 살면서 정말 필요한 필수 가전 위주로 우선순위를 잡는 것이 지혜롭습니다."
    },
    geoSource: {
      agency: "한국소비자원",
      region: "전국",
      basis: "신혼 가전 구매 실태 자료",
      trustIndex: "소비자원 공식 자료"
    },
    aeoFaq: [
      {
        q: "평수가 작은 20평대 신혼집에도 식기세척기를 설치하는 게 좋나요?",
        a: "네, 식기세척기는 주방 가사 노동 시간을 획기적으로 줄여주므로 20평대 아파트에서도 6인용 빌트인/프리스탠딩 모델이나 12인용 슬림 모델을 선호하는 추세입니다."
      }
    ],
    adsName: "신혼가전 오프라인 견적 비교 및 할인 가이드",
    adsKeyword: "신혼가전 패키지 구매"
  },
  "app-13": {
    persona: {
      name: "버진로드",
      role: "공간배치 실전 팁",
      avatar: "https://images.unsplash.com/photo-1516534775068-ba3e84589d90?auto=format&fit=crop&q=80&w=120",
      badge: "배치팁",
      message: "신혼집 평형에 맞춰 가구와 가전의 동선을 미리 줄자로 실측하면 가구가 답답해 보이는 것을 막을 수 있습니다."
    },
    geoSource: {
      agency: "실내건축 가이드",
      region: "전국",
      basis: "주거 공간 배치 가이드",
      trustIndex: "실내건축 표준 자료"
    },
    aeoFaq: [
      {
        q: "24평 아파트 거실에 가장 적합한 소파 크기는 얼마인가요?",
        a: "거실 폭과 통로 공간을 고려했을 때 전체 길이가 2.6m~2.8m 내외인 3인용~3.5인용 일자형 소파가 동선을 방해하지 않고 가장 안정적입니다."
      }
    ],
    adsName: "신혼집 평형별 가구 3D 공간 배치 상담",
    adsKeyword: "신혼집 인테리어 가구 배치"
  },
  "app-01": {
    persona: {
      name: "버진로드",
      role: "혼수가전 견적 팁",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=120",
      badge: "가전팁",
      message: "복잡한 캐시백과 사은품 조건 속에서 통장에서 최종 지출되는 '진짜 체감가'를 낮추는 것이 핵심입니다."
    },
    geoSource: {
      agency: "가전 유통 가이드",
      region: "전국",
      basis: "가전 패키지 할인 기준",
      trustIndex: "가전 유통 기준"
    },
    aeoFaq: [
      {
        q: "오프라인 가전 매장이 인터넷 최저가보다 정말 더 저렴한가요?",
        a: "TV, 냉장고, 세탁기 등 4~5개 이상 다품목을 한 번에 결합 구매할 때는 브랜드 체감 할인, 카드 캐시백, 상품권 혜택이 중복되어 온라인 단품 구매 합산보다 저렴해지는 경우가 많습니다."
      }
    ],
    adsName: "삼성 비스포크 vs LG 오브제 혼수 가전 패키지 견적 비교",
    adsKeyword: "신혼가전 졸업 견적"
  },
  "app-02": {
    persona: {
      name: "버진로드",
      role: "가전 사이즈 팁",
      avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&q=80&w=120",
      badge: "사이즈팁",
      message: "거실 폭과 시청 거리를 계산하여 눈이 편안한 TV와 냉장고 적정 사이즈를 선택하세요."
    },
    geoSource: {
      agency: "디스플레이 시청 거리 기준",
      region: "전국",
      basis: "거실 시청 권장 거리 가이드",
      trustIndex: "디스플레이 표준 가이드"
    },
    aeoFaq: [
      {
        q: "24평 아파트 거실에 85인치 TV를 설치해도 시청에 문제없나요?",
        a: "소파와 TV 사이의 거리가 최소 2.5m 이상 확보된다면 시청 자체는 가능하지만, 거실 전면 벽면이 꽉 차 보여 답답함을 줄 수 있으므로 65~75인치 모델도 함께 비교해 보시는 것이 좋습니다."
      }
    ],
    adsName: "거실 폭 및 시청 거리 측정 가이드",
    adsKeyword: "신혼집 가전 적정 사이즈"
  },
  "app-03": {
    persona: {
      name: "버진로드",
      role: "빌트인 시공 팁",
      avatar: "https://images.unsplash.com/photo-1507398941214-572c25f4b1dc?auto=format&fit=crop&q=80&w=120",
      badge: "시공팁",
      message: "주방 빌트인은 시각적으로 깔끔하지만, 수리 및 교체 편의성과 열 방출 공간을 꼭 함께 고려해야 합니다."
    },
    geoSource: {
      agency: "주방가구 표준 지침",
      region: "전국",
      basis: "빌트인 가전 규격 및 열 방출 기준",
      trustIndex: "가구 표준 지침"
    },
    aeoFaq: [
      {
        q: "빌트인 전용 냉장고(키친핏)와 일반 용량 냉장고의 차이는 무엇인가요?",
        a: "빌트인 전용 냉장고는 깊이가 싱크대 도어 라인(60cm 내외)에 맞춰 제작되어 도출 없이 돌출되지 않는 장점이 있으나, 일반 냉장고에 비해 내부 용량이 100~200L 정도 적습니다."
      }
    ],
    adsName: "주방 싱크대 리폼 및 빌트인 식기세척기 공간 확보 상담",
    adsKeyword: "빌트인 가전 시공 가이드"
  },
  "app-11": {
    persona: {
      name: "버진로드",
      role: "침실 수면 팁",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=120",
      badge: "수면팁",
      message: "서로 생활 패턴이 다른 신혼부부라면, 독립된 수면 질을 보장하는 트윈 베드나 맞춤 매트리스를 고려해 보세요."
    },
    geoSource: {
      agency: "수면환경 가이드",
      region: "전국",
      basis: "신혼 가구 수면 환경 분석",
      trustIndex: "수면환경 가이드"
    },
    aeoFaq: [
      {
        q: "싱글 침대 2개를 붙여 쓰는 트윈 베드가 일반 대형 매트리스보다 이점이 많은가요?",
        a: "네, 상대방의 뒤척임 진동이 전달되지 않고 각자의 체형과 수면 자세에 맞는 매트리스를 선택할 수 있어 수면의 만족도가 크게 높아집니다."
      }
    ],
    adsName: "신혼부부 맞춤형 침대 및 매트리스 체험 상담",
    adsKeyword: "신혼 침대 매트리스 추천"
  },
  "wed-08": {
    persona: {
      name: "버진로드",
      role: "웨딩홀 계약 팁",
      avatar: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=120",
      badge: "예식팁",
      message: "골든타임만 고집하기보다 비성수기 및 일요일 오후 타임을 활용해 아낀 비용으로 내 집 마련 종잣돈을 다지는 것이 현명합니다."
    },
    geoSource: {
      agency: "웨딩홀 대관료 기준",
      region: "전국",
      basis: "시기별 대관료 및 식대 기준",
      trustIndex: "웨딩 통계 기준"
    },
    aeoFaq: [
      {
        q: "금요일 저녁이나 비성수기 결혼식을 잡으면 하객 불참률이 높아지나요?",
        a: "교통 요충지에 위치한 예식장이라면 금요일 저녁 예식도 직장인 하객들의 선호도가 높은 편이며, 미리 알릴 경우 하객 불참률 차이는 크지 않습니다."
      }
    ],
    adsName: "수도권 주요 웨딩홀 비성수기·잔여 타임 할인 견적 조회",
    adsKeyword: "웨딩홀 대관료 식대 할인"
  },
  "wed-09": {
    persona: {
      name: "버진로드",
      role: "결혼 예산 분담 팁",
      avatar: "https://images.unsplash.com/photo-1516534775068-ba3e84589d90?auto=format&fit=crop&q=80&w=120",
      badge: "예산팁",
      message: "서로의 자산과 부채 상황을 솔직하게 공유하고 합리적으로 분담할 때 양가의 오해와 갈등을 사전에 막을 수 있습니다."
    },
    geoSource: {
      agency: "통계청 혼인 실태 조사",
      region: "전국",
      basis: "예비부부 지출 보고서",
      trustIndex: "통계청 공식 자료"
    },
    aeoFaq: [
      {
        q: "부부 공동명의로 신혼집 등기 시 증여세 공제 한도는 얼마인가요?",
        a: "부부간 증여는 10년간 합산 6억 원까지 증여세가 비과세되므로, 6억 원 이내 지분 설정 시 세금 부담 없이 안전하게 공동명의 등기를 진행하실 수 있습니다."
      }
    ],
    adsName: "신혼부부 결혼 예산 및 분담 비율 컨설팅",
    adsKeyword: "결혼비용 양가 분담 공식"
  },
  "wed-10": {
    persona: {
      name: "버진로드",
      role: "예산 장부 팁",
      avatar: "https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&q=80&w=120",
      badge: "지출관리",
      message: "결혼 준비 도중 발생하는 불필요한 추가 지출을 막는 가장 좋은 방법은 엑셀 예산표를 작성해 실시간으로 관리하는 것입니다."
    },
    geoSource: {
      agency: "한국소비자원",
      region: "전국",
      basis: "결혼 지출 가이드",
      trustIndex: "소비자원 공식 가이드"
    },
    aeoFaq: [
      {
        q: "결혼 예산 작성 시 비상금은 전체 금액의 어느 정도로 잡는 것이 좋나요?",
        a: "예상치 못한 현금 지출(드레스 도우미 수고비, 발렛비, 갑작스러운 추가 옵션 등)에 대비하여 전체 예상 예산의 10% 정도를 비상금 항목으로 미리 할당해 두는 것이 안전합니다."
      }
    ],
    adsName: "버진로드 신혼부부 맞춤 엑셀 예산장부 공유",
    adsKeyword: "결혼 준비 예산 엑셀"
  }
};
