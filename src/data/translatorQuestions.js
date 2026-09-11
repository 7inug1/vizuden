export const TRANSLATOR_QUESTIONS = [
  {
    id: 'background',
    type: 'text',
    heading: '살면서 가장 큰 영향을 준\n경험이나 환경은 무엇인가요?',
    placeholder: '어디서 자랐는지, 어떤 경험이 당신을 만들었는지 자유롭게 써주세요',
    hint: '길게 쓸 필요 없어요 — 떠오르는 것을 솔직하게',
  },
  {
    id: 'direction',
    type: 'text',
    heading: '지금 어떤 방향으로\n나아가고 있나요?',
    placeholder: '어떤 사람으로 불리고 싶은지, 지금 어디로 가고 있는지',
    hint: '현재 하는 일, 추구하는 삶의 방식도 좋아요',
  },
  {
    id: 'trigger',
    type: 'text',
    heading: '스타일을 바꾸고 싶다고\n느낀 계기가 있었나요?',
    placeholder: '특별한 계기, 상황, 혹은 막연한 불편함이라도 괜찮아요',
    hint: '없으면 넘어가도 됩니다',
    optional: true,
  },
  {
    id: 'gap',
    type: 'text',
    heading: '지금 스타일에서\n가장 맞지 않는 부분은?',
    placeholder: '지금 옷차림이 당신을 얼마나 표현하고 있는지, 어떤 부분이 안 맞는지',
    hint: '',
  },
  {
    id: 'reference',
    type: 'text',
    heading: '스타일이 닮고 싶은\n인물이 있나요?',
    placeholder: '인물 이름, 영화 속 캐릭터, 분위기 — 이유도 함께 적어주세요',
    hint: '없으면 넘어가도 됩니다',
    optional: true,
  },
  {
    id: 'brands',
    type: 'text',
    heading: '좋아하거나 관심 있는\n브랜드가 있나요?',
    placeholder: '예: Nike, 무신사 스탠다드, Carhartt — 왜 좋은지도 적어주시면 좋아요',
    hint: '없으면 넘어가도 됩니다',
    optional: true,
  },
  {
    id: 'lifestyle',
    type: 'text',
    heading: '직업과 주로\n있는 환경은?',
    placeholder: '예: 스타트업 개발자, 주로 카페·사무실에 있음',
    hint: '',
  },
  {
    id: 'body',
    type: 'text',
    heading: '키, 몸무게,\n체형을 알려주세요',
    placeholder: '예: 키 178cm, 몸무게 70kg, 어깨가 넓고 하체가 가는 편',
    hint: '맞는 핏을 추천하는 데 필요해요',
  },
];

export const TRANSLATOR_TOTAL = TRANSLATOR_QUESTIONS.length;
