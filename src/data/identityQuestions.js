// Identity 질문 데이터
// 새 question 타입: prescription-confirm, dynamic-identity

export const UNIT_SUBOPTIONS = {
  hair: {
    heading: '지금 헤어스타일을 가장 잘 설명하는 건?',
    type: 'radio',
    hasOther: true,
    options: [
      '투블록 (옆머리 짧고 윗머리 있는)',
      '가르마 스타일 (옆·가운데 가르마)',
      '펌 (웨이브·볼륨 있는)',
      '올백·포마드 (뒤로 넘긴)',
      '짧게 민 편 (버즈컷·투블록 아님)',
      '기를 중이거나 중간 길이',
      '기타',
    ],
  },
  grm: {
    heading: '지금 관리하고 있는 것은?',
    type: 'checkbox',
    hasOther: true,
    options: ['스킨케어', '수염 정리', '향수', '눈썹 정리', '아무것도 안 함', '기타'],
  },
  top: {
    heading: '상의에서 자주 겪는 문제는?',
    type: 'checkbox',
    hasOther: true,
    options: ['어깨가 남음', '허리 품이 남음', '기장이 짧음', '기장이 긺', '사이즈가 일정 않음', '기타'],
  },
  bottom: {
    heading: '하의에서 자주 겪는 문제는?',
    type: 'checkbox',
    hasOther: true,
    options: ['허벅지 여유가 부족함', '허리가 남음', '기장이 짧음', '핏이 애매함', '기타'],
  },
  shoes: {
    heading: '가장 자주 신는 신발 종류는?',
    type: 'radio',
    hasOther: true,
    options: ['스니커즈', '로퍼·슬립온', '더비·옥스퍼드', '부츠', '샌들', '기타'],
  },
  coord: {
    heading: '코디 조합에서 가장 자주 막히는 건?',
    type: 'checkbox',
    hasOther: true,
    options: ['상하의 색 매칭', '아우터 연결', '신발 선택', '액세서리 포인트', '기타'],
  },
  acc: {
    heading: '액세서리 관련 고민은?',
    type: 'checkbox',
    hasOther: true,
    options: ['뭘 해야 할지 모름', '사도 잘 안 씀', '어디서 사야 할지 모름', '지금도 잘 활용 중', '기타'],
  },
};

export const QUESTIONS = [
  // Block 1: 신체 데이터
  {
    id: 'height',
    type: 'text',
    inputType: 'number',
    heading: '키는\n어떻게 되세요?',
    hint: '핏과 비율 조언에 반영됩니다.',
    placeholder: '175',
    unit: 'cm',
  },
  {
    id: 'weight',
    type: 'text',
    inputType: 'number',
    heading: '몸무게는\n어떻게 되세요?',
    hint: '체형 분석과 사이즈 추천에 활용됩니다.',
    placeholder: '70',
    unit: 'kg',
  },
  {
    id: 'age',
    type: 'text',
    inputType: 'number',
    heading: '몇 년생이세요?',
    hint: '스타일 맥락을 파악하는 데 도움이 됩니다.',
    placeholder: '1995',
    unit: '년생',
  },
  {
    id: 'gender',
    type: 'radio',
    heading: '성별은\n어떻게 되세요?',
    hint: '스타일 조언의 방향을 맞추기 위해 사용됩니다.',
    autoAdvance: true,
    options: [
      { id: 'male', label: '남성' },
      { id: 'female', label: '여성' },
      { id: 'other', label: '기타 / 답하고 싶지 않음' },
    ],
  },
  {
    id: 'body',
    type: 'checkbox',
    heading: '옷 입을 때\n신경 쓰이는 체형 부분이 있나요?',
    hint: '내가 느끼는 기준으로 골라주세요. 복수 선택 가능.',
    optional: true,
    hasOther: true,
    options: [
      { id: 'shoulder', label: '어깨', subOptions: [
        { id: 'shoulder_wide', label: '넓은 편' },
        { id: 'shoulder_narrow', label: '좁은 편' },
      ]},
      { id: 'torso', label: '상체 길이', subOptions: [
        { id: 'torso_long', label: '긴 편' },
        { id: 'torso_short', label: '짧은 편' },
      ]},
      { id: 'belly', label: '배·허리', subOptions: [
        { id: 'belly_out', label: '나온 편' },
        { id: 'belly_slim', label: '얇아서 옷이 뜨는 편' },
      ]},
      { id: 'body_type', label: '전체 체형', subOptions: [
        { id: 'slim', label: '마른 편' },
        { id: 'big', label: '체격 있는 편' },
      ]},
      { id: 'thigh', label: '허벅지가 두꺼운 편' },
      { id: 'leg_short', label: '다리가 짧은 편' },
      { id: 'none', label: '특별히 없음' },
      { id: 'other', label: '기타' },
    ],
  },

  // Block 2: 현재 옷장 상태
  {
    id: 'discard',
    type: 'radio',
    heading: '옷장에서 실제로\n자주 입는 비율은?',
    hint: '1년 기준으로 생각해주세요.',
    autoAdvance: true,
    options: [
      { id: '0_20', label: '0~20% — 거의 안 입는다' },
      { id: '20_40', label: '20~40% — 일부만 자주 입는다' },
      { id: '40_60', label: '40~60% — 절반 정도 입는다' },
      { id: '60_80', label: '60~80% — 꽤 많이 입는 편이다' },
      { id: '80_100', label: '80~100% — 대부분 잘 입는다' },
    ],
  },
  {
    id: 'fitpic',
    type: 'fitpic',
    heading: '지금 자주 입는 핏 사진을\n첨부해주실 수 있나요?',
    hint: '전신이 보이는 사진 1~3장이 가장 좋습니다. 거울 셀카, 출근룩, 주말룩처럼 실제로 자주 입는 모습이면 충분합니다.',
    optional: true,
    maxFiles: 3,
  },

  // Block 3: Gap 측정
  {
    id: 'gap',
    type: 'radio',
    heading: '지금 모습과 이상향,\n얼마나 가깝다고 느끼나요?',
    hint: '솔직하게 선택해주세요.',
    autoAdvance: true,
    options: [
      { id: 'close', label: '꽤 가까움 — 거의 완성에 가깝다' },
      { id: 'somewhat', label: '어느 정도 — 방향은 맞는데 디테일이 부족하다' },
      { id: 'far', label: '꽤 멈 — 아직 많이 부족하다' },
      { id: 'very_far', label: '매우 멈 — 어디서 시작해야 할지 모른다' },
    ],
  },
  {
    id: 'gap-reason',
    type: 'checkbox',
    heading: '이상향과 멀어진\n이유는 무엇인가요?',
    hint: '해당하는 것을 모두 선택하세요.',
    optional: true,
    options: [
      { id: 'no_money', label: '예산이 부족해서' },
      { id: 'no_knowledge', label: '뭘 사야 할지 몰라서' },
      { id: 'no_time', label: '쇼핑할 시간이 없어서' },
      { id: 'no_body', label: '체형 때문에 원하는 옷을 못 입어서' },
      { id: 'bought_wrong', label: '사놓고 안 어울려서' },
      { id: 'no_coord', label: '코디를 어떻게 해야 할지 몰라서' },
      { id: 'other', label: '기타' },
    ],
    hasOther: true,
  },

  // Block 4: 구현 단위 현황
  {
    id: 'units',
    type: 'checkbox',
    heading: '지금 가장 개선하고 싶은\n스타일 요소는?',
    hint: '해당하는 것을 모두 선택하세요. 선택한 항목에 대해 세부 질문이 이어집니다.',
    options: [
      { id: 'hair', label: '헤어스타일' },
      { id: 'grm', label: '그루밍 (피부·수염·향수 등)' },
      { id: 'top', label: '상의' },
      { id: 'bottom', label: '하의' },
      { id: 'shoes', label: '신발' },
      { id: 'coord', label: '코디 조합' },
      { id: 'acc', label: '액세서리' },
      { id: 'other', label: '기타' },
    ],
    hasOther: true,
  },
  {
    id: 'units-direction',
    type: 'text',
    heading: '선택한 요소들을\n어떻게 바꾸고 싶나요?',
    hint: '방향, 레퍼런스, 막연한 느낌이라도 괜찮습니다.',
    placeholder: '예) 헤어는 좀 더 단정하게 바꾸고 싶고, 상의는 어깨 라인이 딱 맞는 걸 찾고 싶어요.',
    optional: true,
  },
  {
    id: 'units-detail',
    type: 'dynamic-identity',
    heading: '선택한 요소에 대해\n조금 더 알려주세요',
    hint: '현재 상태를 구체적으로 파악합니다.',
    optional: true,
  },

  // Block 5: 예산 및 우선순위
  {
    id: 'budget-monthly',
    type: 'radio',
    heading: '의류에 평소\n한 달 얼마나 쓰나요?',
    hint: '지금 지출 습관을 파악합니다.',
    autoAdvance: true,
    options: [
      { id: 'under_50', label: '5만원 미만' },
      { id: '50_100', label: '5~10만원' },
      { id: '100_200', label: '10~20만원' },
      { id: '200_300', label: '20~30만원' },
      { id: 'over_300', label: '30만원 이상' },
    ],
  },
  {
    id: 'budget-initial',
    type: 'radio',
    heading: '지금 스타일 변화를\n시작하는 데 쓸 수 있는 예산은?',
    hint: '실행 계획 수립에 가장 직접적으로 반영됩니다.',
    autoAdvance: true,
    options: [
      { id: 'under_100', label: '10만원 미만' },
      { id: '100_300', label: '10~30만원' },
      { id: '300_500', label: '30~50만원' },
      { id: '500_1000', label: '50~100만원' },
      { id: 'over_1000', label: '100만원 이상' },
    ],
  },
  {
    id: 'budget-actual',
    type: 'text',
    inputType: 'number',
    heading: '실제로는 얼마까지\n바로 쓸 수 있나요?',
    hint: '대략적인 실제 금액을 적어주세요. 예를 들어 헤어는 5~15만원 내외, 유니클로 기준 상·하의는 10~15만원 정도가 들 수 있습니다.',
    placeholder: '15',
    unit: '만원',
  },
  {
    id: 'priority',
    type: 'checkbox',
    heading: '어떤 변화를\n먼저 체감하고 싶나요?',
    hint: '가장 원하는 것을 선택하세요. 복수 선택 가능.',
    options: [
      { id: 'impression', label: '거울 봤을 때 인상이 달라지는 것' },
      { id: 'fit', label: '옷이 몸에 맞아 보이는 것' },
      { id: 'coord', label: '코디가 매일 자연스럽게 되는 것' },
      { id: 'grm', label: '그루밍이 습관이 되는 것' },
      { id: 'criteria', label: '쇼핑할 때 기준이 생기는 것' },
      { id: 'overall', label: '전체적으로 스타일이 올라가는 것' },
    ],
  },
  {
    id: 'timeline',
    type: 'radio',
    heading: '어느 시점까지\n변화를 만들고 싶나요?',
    hint: '현실적인 계획 수립에 활용됩니다.',
    autoAdvance: true,
    options: [
      { id: 'asap', label: '지금 당장 (이번 달 안에)' },
      { id: 'month3', label: '3개월 안에' },
      { id: 'month6', label: '6개월 안에' },
      { id: 'no_rush', label: '천천히 — 기한 없이 꾸준히' },
    ],
  },

  // 마지막: 자유 메모
  {
    id: 'confirm-detail',
    type: 'text',
    heading: '보고서에 꼭 반영됐으면\n하는 게 있나요?',
    hint: '스타일 방향의 변화, 특별히 신경 쓰이는 것, 혹은 AI에게 전하고 싶은 말 무엇이든 괜찮습니다.',
    placeholder: '예) 요즘 체중이 늘어서 핏이 전보다 안 맞아요. 그 부분도 봐주셨으면 해요.',
    optional: true,
  },
];

export const IDENTITY_TOTAL = QUESTIONS.length;
