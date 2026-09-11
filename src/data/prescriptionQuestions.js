export const CHAPTERS = [
  { id: 'me',       label: '나' },
  { id: 'life',     label: '일상' },
  { id: 'struggle', label: '고민' },
  { id: 'taste',    label: '취향' },
  { id: 'body',     label: '신체' },
  { id: 'hair',     label: '헤어' },
  { id: 'outro',    label: '마무리' },
];

export const QUESTIONS = [
  // ── 그룹 1: 인상 & 자기 인식 & 레퍼런스 ──────────────────────
  {
    id: 'direction',
    chapter: 'me',

    type: 'checkbox',
    heading: '입고 나갔을 때\n어떤 말을 듣고 싶나요?',
    hint: '실제로 듣고 싶은 말을 골라주세요 — 최대 2개',
    hasOther: true,
    max: 2,
    options: [
      { id: 'clean_trusty', label: '딱 봐도 단정하고 깔끔하다' },
      { id: 'effortless_stylish', label: '노력한 티 없이 감각 있다' },
      { id: 'confident_strong', label: '자신감 있어 보인다' },
      { id: 'intellectual_refined', label: '세련되고 지적이다' },
      { id: 'approachable_warm', label: '편안하고 자연스럽다' },
      { id: 'energetic_dynamic', label: '활동적이고 에너지 넘친다' },
      { id: 'other', label: '기타' },
    ],
  },
  {
    id: 'selfPerception',
    chapter: 'me',

    type: 'radio',
    heading: '지금 내 스타일을\n솔직하게 표현하면?',
    hint: '있는 그대로 골라주세요',
    hasOther: true,
    options: [
      { id: 'no_style', label: '아직 내 스타일이 없다' },
      { id: 'basic_no_impact', label: '기본은 하는데 임팩트가 없다' },
      { id: 'has_direction', label: '나름의 방향은 있다' },
      { id: 'well_dressed', label: '꽤 잘 입는 편이다' },
      { id: 'other', label: '기타' },
    ],
  },
  {
    id: 'reference',
    chapter: 'me',

    type: 'checkbox',
    heading: '스타일 참고는\n어떻게 하는 편인가요?',
    hint: '해당되는 것을 모두 골라주세요',
    optional: true,
    hasOther: true,
    options: [
      { id: 'celebrity', label: '특정 연예인이나 셀럽을 참고한다' },
      { id: 'brand_lookbook', label: '브랜드 룩북이나 모델 착장을 본다' },
      { id: 'saved_mood', label: '핀터레스트나 인스타에 무드를 저장해둔다' },
      { id: 'vague_vibe', label: '구체적 인물은 없고 막연한 분위기만 있다' },
      { id: 'no_reference', label: '딱히 참고하는 것은 없다' },
      { id: 'other', label: '기타' },
    ],
  },
  {
    id: 'referenceDetail',
    chapter: 'me',

    type: 'text',
    heading: '추구미 인물이나\n분위기가 있나요?',
    placeholder: '인물, 영화 속 장면, 분위기 등 자유롭게 적어보세요',
    hint: '선택 사항 — 처방 방향을 잡는 데 가장 빠른 힌트예요',
    optional: true,
    suggestions: [
      {
        gender: 'male',
        label: '박서준·정해인',
        info: '힘 준 티 없이 자연스럽게 잘 입는 느낌. 기본기가 탄탄하고 어디서나 보기 좋은 스타일.',
        fill: '박서준·정해인처럼 자연스럽고 깔끔하게 잘 입는 느낌. 힘 준 티 없이 보기 좋고, 기본에 충실한 스타일.',
      },
      {
        gender: 'male',
        label: '다니엘 크레이그',
        info: '단단하고 정제된 분위기. 핏이 정확하고 군더더기 없이 딱 떨어지는 스타일.',
        fill: '다니엘 크레이그처럼 단단하고 정제된 분위기. 핏이 정확하고 군더더기 없이 딱 떨어지는 스타일.',
      },
      {
        gender: 'male',
        label: '류준열·공유',
        info: '조용하고 여유 있는 무드. 과하지 않고 자기만의 색이 있는, 오래 봐도 질리지 않는 스타일.',
        fill: '류준열·공유처럼 조용하고 여유 있는 무드. 과하지 않고 자기만의 색이 있는, 오래 봐도 질리지 않는 스타일.',
      },
      {
        gender: 'male',
        label: '티모시 샬라메',
        info: '가늘고 선명한 실루엣. 패셔너블하고 개성 있는, 일반적이지 않은 스타일.',
        fill: '티모시 샬라메처럼 가늘고 선명한 실루엣. 패셔너블하고 개성 있는, 일반적이지 않은 스타일.',
      },
      {
        gender: 'female',
        label: '젠데이아·로제',
        info: '대담하지만 과하지 않은 스타일. 트렌드를 자기 방식으로 소화하는, 개성이 뚜렷한 분위기.',
        fill: '젠데이아·로제처럼 대담하지만 과하지 않은 스타일. 트렌드를 자기 방식으로 소화하는, 개성이 뚜렷한 분위기.',
      },
      {
        gender: 'female',
        label: '오드리 헵번 무드',
        info: '시간이 지나도 촌스럽지 않은 클래식함. 과장 없이 단아하고, 품격 있는 스타일.',
        fill: '오드리 헵번 무드처럼 시간이 지나도 촌스럽지 않은 클래식함. 과장 없이 단아하고 품격 있는 스타일.',
      },
      {
        gender: 'female',
        label: '오스카 드 라 렌타 무드',
        info: '여성스럽고 우아한 클래식. 화려하지만 절제된, 품위 있는 스타일.',
        fill: '오스카 드 라 렌타 무드처럼 여성스럽고 우아한 클래식. 화려하지만 절제된, 품위 있는 스타일.',
      },
      {
        gender: 'female',
        label: '에밀리 라타이코프스키',
        info: '자신감 있고 자유로운 분위기. 섹시하지만 힘이 있는, 자기 몸을 아는 스타일.',
        fill: '에밀리 라타이코프스키처럼 자신감 있고 자유로운 분위기. 섹시하지만 힘이 있는, 자기 몸을 아는 스타일.',
      },
    ],
  },

  // ── 그룹 2: 라이프스타일 & 직업 & 맥락 ───────────────────────
  {
    id: 'lifestyle',
    chapter: 'life',

    type: 'checkbox',
    heading: '주로 어떤 상황에서\n입고 나가나요?',
    hint: '주요한 것 최대 3개',
    max: 3,
    hasOther: true,
    options: [
      { id: 'work', label: '직장 출퇴근' },
      { id: 'weekend', label: '일상 모임·약속' },
      { id: 'date', label: '데이트' },
      { id: 'workout', label: '운동' },
      { id: 'event', label: '특별한 자리 (행사·결혼식 등)' },
      { id: 'travel', label: '여행·출장' },
      { id: 'other', label: '기타' },
    ],
  },
  {
    id: 'job',
    chapter: 'life',

    type: 'radio',
    heading: '어떤 일을\n하고 계세요?',
    hint: '가장 가까운 상황을 골라주세요',
    hasOther: true,
    options: [
      { id: 'student',      label: '학생 / 취업·이직 준비 중' },
      { id: 'office',       label: '사무직 / 일반 직장인' },
      { id: 'creative',     label: '크리에이티브·미디어·디자인 계열' },
      { id: 'professional', label: '전문직 (의료·법률·금융·컨설팅)' },
      { id: 'frontline',    label: '대면 업무 중심 (서비스·영업·강의·상담)' },
      { id: 'freelance',    label: '자영업·프리랜서 (내 이름으로 일함)' },
      { id: 'uniform',      label: '유니폼·작업복 착용 (사복만 코디 필요)' },
      { id: 'none',         label: '현재 직업·학업 없음' },
      { id: 'other',        label: '기타' },
    ],
  },
  {
    id: 'workDressCode',
    chapter: 'life',

    type: 'radio',
    heading: '직장(또는 학교)의\n분위기는?',
    hint: '가장 가까운 환경을 골라주세요',
    optional: true,
    hasOther: true,
    options: [
      { id: 'formal',       label: '정장·비즈니스 캐주얼이 기본' },
      { id: 'smart_casual', label: '캐주얼이지만 어느 정도 격식을 갖춘다' },
      { id: 'free',         label: '완전 자유 (스타트업·크리에이티브·재택)' },
      { id: 'uniform',      label: '유니폼·작업복 착용 (사복 코디만 필요)' },
      { id: 'na',           label: '해당 없음 (직장·학교 없음)' },
      { id: 'other',        label: '기타' },
    ],
  },
  {
    id: 'lifePeriod',
    chapter: 'life',

    type: 'checkbox',
    heading: '요즘 어떤 상황에서\n제일 잘 입고 싶나요?',
    hint: '어디에 쓸 처방인지 알려주세요 — 최대 2개',
    max: 2,
    hasOther: true,
    options: [
      { id: 'daily',   label: '일상 외출·만남' },
      { id: 'career',  label: '직장·면접·비즈니스 자리' },
      { id: 'network', label: '사람 많이 만나는 자리·네트워킹' },
      { id: 'date',    label: '데이트·소개팅' },
      { id: 'event',   label: '특별한 행사 (결혼식·파티·기념일)' },
      { id: 'other',   label: '기타' },
    ],
  },

  // ── 그룹 3: 막히는 점 & 원하는 변화 & 서사 ───────────────────
  {
    id: 'blockers',
    chapter: 'struggle',

    type: 'checkbox',
    heading: '지금 스타일에서 가장 자주\n막히거나 아쉬운 점은?',
    hint: '핵심적인 것 최대 3개',
    max: 3,
    hasOther: true,
    options: [
      { id: 'no_start', label: '관심은 있지만 어디서 어떻게 시작할지 모르겠다' },
      { id: 'shopping', label: '뭘 사야 할지 기준이 없다' },
      { id: 'coord',    label: '코디 조합이 어렵다 — 있는 옷인데 잘 못 입는다' },
      { id: 'gap',      label: '레퍼런스는 있는데, 내가 입으면 그 느낌이 안 난다' },
      { id: 'unused',   label: '사놓고도 잘 안 입게 된다 — 옷장이 따로 논다' },
      { id: 'body',     label: '체형 때문에 원하는 느낌이 잘 안 나온다' },
      { id: 'hair',     label: '헤어가 전체 인상을 못 살리는 것 같다' },
      { id: 'other',    label: '기타' },
    ],
  },
  {
    id: 'desiredChange',
    chapter: 'struggle',

    type: 'checkbox',
    heading: '어떤 변화를 가장 먼저\n체감하고 싶나요?',
    hint: '가장 중요한 것 최대 2개',
    max: 2,
    hasOther: true,
    options: [
      { id: 'identity',      label: '나만의 스타일이 생기는 것' },
      { id: 'impression',    label: '처음 만나는 사람에게 좋은 인상을 남기는 것' },
      { id: 'easy_coord',    label: '코디가 매일 고민 없이 되는 것' },
      { id: 'shopping_rule', label: '쇼핑할 때 흔들리지 않는 기준이 생기는 것' },
      { id: 'closet_use',    label: '새로 사지 않고 지금 옷장을 더 잘 쓰는 것' },
      { id: 'body_fit',      label: '체형이 더 좋아 보이게 입는 것' },
      { id: 'grooming',      label: '헤어와 그루밍이 인상을 완성하는 것' },
      { id: 'other',         label: '기타' },
    ],
  },
  {
    id: 'fashionMotivation',
    chapter: 'struggle',

    type: 'radio',
    heading: '지금 처방전을 받으러\n온 계기가 있나요?',
    hint: '가장 가까운 것을 골라주세요',
    hasOther: true,
    options: [
      { id: 'curious',     label: '그냥 궁금해서' },
      { id: 'need_change', label: '이미지 변화가 필요한 시기라서' },
      { id: 'outdated',    label: '지금 스타일이 오래됐다는 느낌이 들어서' },
      { id: 'event',       label: '중요한 자리·이벤트가 있어서 (취업·이직·소개팅·행사)' },
      { id: 'other',       label: '기타' },
    ],
  },

  // ── 그룹 4: 색상 & 패턴 ──────────────────────────────────────
  {
    id: 'colorPref',
    chapter: 'taste',

    type: 'radio',
    heading: '색상 처방은\n어떻게 받고 싶나요?',
    hint: '가장 가까운 것을 골라주세요',
    hasOther: true,
    options: [
      { id: 'refine_current', label: '지금 쓰는 색상 범위 안에서 잘 조합하는 법을 알고 싶다' },
      { id: 'add_color',      label: '새로운 색상도 써보고 싶다 — 어떻게 시작할지 모르겠다' },
      { id: 'focus_fit',      label: '색상보다 핏·소재·실루엣에 집중해줬으면 한다' },
      { id: 'no_color',       label: '아직 내 컬러가 없다 — 기본부터 잡아줬으면 한다' },
      { id: 'other',          label: '기타' },
    ],
  },
  {
    id: 'skinTone',
    chapter: 'taste',

    type: 'radio',
    heading: '피부톤이\n어떤 편인가요?',
    hint: '모르면 밝기만 알아도 됩니다 — 색상 조합에 반영됩니다',
    autoAdvance: true,
    options: [
      { id: 'bright',  label: '피부가 밝은 편 — 흰 편, 환한 피부' },
      { id: 'medium',  label: '중간 — 딱히 밝지도 어둡지도 않다' },
      { id: 'dark',    label: '피부가 어두운 편 — 탄 편, 구릿빛이 도는 편' },
      { id: 'warm',    label: '웜톤 — 황금빛·노란빛 기운이 있다' },
      { id: 'cool',    label: '쿨톤 — 핑크빛·차가운 기운이 있다' },
      { id: 'unknown', label: '잘 모르겠다' },
    ],
  },
  {
    id: 'styleAvoid',
    chapter: 'taste',

    type: 'checkbox',
    heading: '절대 하고 싶지 않은\n스타일이나 색상이 있나요?',
    hint: '선택 사항 — 처방에서 이 방향은 절대 건드리지 않아요',
    optional: true,
    hasOther: true,
    options: [
      { id: 'oversized',        label: '오버사이즈·빅 실루엣',    sub: '크고 처지는 핏, 빅 숄더, 드롭 숄더 등' },
      { id: 'slim_tight',       label: '슬림·타이트 핏',          sub: '몸에 딱 붙는 스키니, 슬림핏 등' },
      { id: 'streetwear',       label: '스트릿·힙합 감성',        sub: '그래픽 후드, 배기팬츠, 빅 로고 등' },
      { id: 'classic_formal',   label: '클래식·포멀 감성',         sub: '수트, 드레스셔츠, 슬랙스 조합 등' },
      { id: 'military',         label: '군복·밀리터리·워크웨어',   sub: '카고팬츠, 필드재킷, 부츠 조합 등' },
      { id: 'loud_color',       label: '화려한 원색·그래픽·패턴',  sub: '비비드 컬러, 꽃무늬, 타이다이 등' },
      { id: 'big_logo',         label: '큰 로고·브랜드 노출',      sub: '겉으로 드러나는 과한 브랜딩' },
      { id: 'other',            label: '기타' },
    ],
  },
  {
    id: 'brands',
    chapter: 'taste',

    type: 'checkbox',
    heading: '평소 주로 어떤\n계열의 브랜드를 입나요?',
    hint: '선택 사항 — 해당하는 계열을 모두 골라주세요',
    optional: true,
    hasOther: true,
    options: [
      { id: 'spa_basic',            label: 'SPA·베이직',           sub: '유니클로 · 자라 · H&M · COS · 무신사 스탠다드' },
      { id: 'korean_casual',        label: '국내 캐주얼·스트리트',  sub: '커버낫 · 디스이즈네버댓 · 마르디 · 아더에러' },
      { id: 'streetwear',           label: '해외 스트리트웨어',     sub: '슈프림 · 스투시 · 나이키 · 아디다스 · 팔라스' },
      { id: 'sports_outdoor',       label: '스포츠·아웃도어',       sub: '뉴발란스 · 아크테릭스 · 살로몬 · 노스페이스' },
      { id: 'contemporary_minimal', label: '미니멀·컨템포러리',     sub: '아크네 · A.P.C. · 르메르 · 마르지엘라 · 아미' },
      { id: 'designer_wear',        label: '디자이너',              sub: '우영미 · 렉토 · 앤더슨벨 · 준지 · 이자벨마랑' },
      { id: 'luxury_designer',      label: '하이엔드·럭셔리',       sub: '생로랑 · 발렌시아가 · 보테가 · 구찌 · 셀린느' },
      { id: 'other',                label: '기타' },
    ],
  },
  {
    id: 'brandDetail',
    chapter: 'taste',

    type: 'checkbox',
    heading: '구체적으로 어떤\n브랜드를 입나요?',
    hint: '해당하는 브랜드를 모두 골라주세요',
    optional: true,
    hasOther: true,
    dependsOn: { questionId: 'brands' },
    optionGroups: {
      spa_basic: [
        { id: 'uniqlo',      label: '유니클로' },
        { id: 'zara',        label: '자라' },
        { id: 'hm',          label: 'H&M' },
        { id: 'cos',         label: 'COS' },
        { id: 'musinsa_std', label: '무신사 스탠다드' },
        { id: 'gu',          label: 'GU' },
        { id: 'gap',         label: 'GAP' },
      ],
      korean_casual: [
        { id: 'covernat',    label: '커버낫' },
        { id: 'diit',        label: '디스이즈네버댓' },
        { id: 'mardi',       label: '마르디 메르크르디' },
        { id: 'ader',        label: '아더에러' },
        { id: 'sportyrich',  label: '스포티앤리치' },
        { id: 'mmlg',        label: 'MMLG' },
        { id: 'nounenoun',   label: '노운' },
      ],
      streetwear: [
        { id: 'supreme',     label: '슈프림' },
        { id: 'stussy',      label: '스투시' },
        { id: 'nike',        label: '나이키' },
        { id: 'adidas',      label: '아디다스' },
        { id: 'palace',      label: '팔라스' },
        { id: 'newera',      label: '뉴에라' },
        { id: 'carhartt',    label: '카하트' },
      ],
      sports_outdoor: [
        { id: 'new_balance', label: '뉴발란스' },
        { id: 'arcteryx',    label: '아크테릭스' },
        { id: 'salomon',     label: '살로몬' },
        { id: 'northface',   label: '노스페이스' },
        { id: 'patagonia',   label: '파타고니아' },
        { id: 'columbia',    label: '컬럼비아' },
        { id: 'and_wander',  label: 'and wander' },
      ],
      contemporary_minimal: [
        { id: 'acne',        label: '아크네 스튜디오' },
        { id: 'apc',         label: 'A.P.C.' },
        { id: 'lemaire',     label: '르메르' },
        { id: 'margiela',    label: '마르지엘라' },
        { id: 'toteme',      label: '토템' },
        { id: 'ami',         label: '아미' },
        { id: 'nanushka',    label: '나누슈카' },
      ],
      designer_wear: [
        { id: 'wooyoungmi',  label: '우영미' },
        { id: 'recto',       label: '렉토' },
        { id: 'andersonbell',label: '앤더슨벨' },
        { id: 'juunj',       label: '준지' },
        { id: '99is',        label: '99%IS' },
        { id: 'isabel',      label: '이자벨마랑' },
        { id: 'kitsune',     label: '메종키츠네' },
      ],
      luxury_designer: [
        { id: 'saint_laurent', label: '생로랑' },
        { id: 'balenciaga',    label: '발렌시아가' },
        { id: 'bottega',       label: '보테가 베네타' },
        { id: 'gucci',         label: '구찌' },
        { id: 'loewe',         label: '로에베' },
        { id: 'celine',        label: '셀린느' },
        { id: 'dior',          label: '디올' },
      ],
    },
    options: [],
  },

  // ── 그룹 5: 쇼핑 ─────────────────────────────────────────────
  {
    id: 'shopWhere',
    chapter: 'taste',

    type: 'checkbox',
    heading: '주로 어디서\n쇼핑하나요?',
    hint: '해당되는 채널을 모두 골라주세요',
    hasOther: true,
    options: [
      { id: 'domestic_platform', label: '국내 패션 플랫폼',    sub: '무신사 · 29CM · W컨셉 · EQL' },
      { id: 'brand_direct',      label: '특정 브랜드 위주로 구매', sub: '브랜드 공홈 · 앱 · 인스타그램 · 네이버 스토어' },
      { id: 'offline',           label: '오프라인 매장·편집샵', sub: '쇼룸 · 편집샵 · 로드숍' },
      { id: 'dept_spa',          label: '백화점·SPA 브랜드 매장', sub: '백화점 · 아울렛 · 유니클로 같은 SPA' },
      { id: 'overseas_editorial',label: '해외 편집샵·직구',     sub: 'SSENSE · END. · MATCHES · Farfetch' },
      { id: 'resale',            label: '중고·리셀 플랫폼',     sub: '번개장터 · 당근 · Fruitsfamily · KREAM' },
      { id: 'other',             label: '기타' },
    ],
  },
  {
    id: 'shopWhereDetail',
    chapter: 'taste',

    type: 'checkbox',
    heading: '구체적으로 어디를\n주로 보나요?',
    hint: '해당되는 곳을 모두 골라주세요',
    optional: true,
    hasOther: true,
    dependsOn: { questionId: 'shopWhere' },
    optionGroups: {
      domestic_platform: [
        { id: 'musinsa',        label: '무신사' },
        { id: '29cm',           label: '29CM' },
        { id: 'wconcept',       label: 'W컨셉' },
        { id: 'eql',            label: 'EQL' },
        { id: 'hago',           label: 'HAGO' },
      ],
      brand_direct: [
        { id: 'brand_official',  label: '브랜드 공홈' },
        { id: 'brand_app',       label: '브랜드 앱' },
        { id: 'instagram_order', label: '인스타그램·네이버 스토어' },
      ],
      offline: [
        { id: 'showroom',    label: '쇼룸' },
        { id: 'select_shop', label: '편집샵' },
        { id: 'road_shop',   label: '로드숍·동네 매장' },
      ],
      dept_spa: [
        { id: 'dept',   label: '백화점' },
        { id: 'outlet', label: '아울렛' },
        { id: 'spa',    label: 'SPA 브랜드 매장' },
      ],
      overseas_editorial: [
        { id: 'ssense',   label: 'SSENSE' },
        { id: 'end',      label: 'END. Clothing' },
        { id: 'matches',  label: 'MATCHES' },
        { id: 'farfetch', label: 'Farfetch' },
      ],
      resale: [
        { id: 'bunjang',      label: '번개장터' },
        { id: 'karrot',       label: '당근' },
        { id: 'fruitsfamily', label: 'Fruitsfamily' },
        { id: 'kream',        label: 'KREAM' },
      ],
    },
    options: [],
  },


  // ── 그룹 6: 신체 정보 ────────────────────────────────────────
  {
    // companion: weight shown beside on same screen
    id: 'height',
    chapter: 'body',

    companion: 'weight',
    type: 'text',
    inputType: 'number',
    heading: '신체 정보를\n알려주세요',
    placeholder: '178',
    unit: 'cm',
    hint: '핏, 비율, 체형 분석에 반영됩니다',
  },
  {
    id: 'weight',
    chapter: 'body',

    isCompanion: true,
    type: 'text',
    inputType: 'number',
    heading: '몸무게는\n어떻게 되세요?',
    placeholder: '73',
    unit: 'kg',
    hint: '체형과 실루엣 해석에 반영됩니다',
  },
  {
    // companion: bodyConcern shown below on same screen
    id: 'bodyType',
    chapter: 'body',

    type: 'checkbox',
    heading: '체형이 어떤 편인가요?',
    hint: '해당되는 것 최대 2개 — 조합도 가능합니다',
    max: 2,
    hasOther: true,
    options: [
      { id: 'slim',              label: '마른 편' },
      { id: 'normal',            label: '두드러지는 특징 없는 중간 체형' },
      { id: 'athletic',          label: '탄탄한 편 (근육질)' },
      { id: 'inverted_triangle', label: '역삼각형 (어깨 넓고 하체 얇은 편)' },
      { id: 'belly',             label: '배가 나온 편' },
      { id: 'big',               label: '체격 있는 편' },
      { id: 'other',             label: '기타' },
    ],
  },
  {
    id: 'bodyConcern',
    chapter: 'body',

    type: 'checkbox',
    heading: '옷으로 커버하거나\n살리고 싶은 부분이 있나요?',
    hint: '해당되는 것을 모두 골라주세요',
    hasOther: true,
    options: [
      { id: 'belly_waist',     label: '배·허리 라인이 신경 쓰인다' },
      { id: 'narrow_shoulder', label: '어깨가 좁아 보인다 — 더 넓어 보이고 싶다' },
      { id: 'wide_shoulder',   label: '어깨가 넓어 보인다 — 덜 부각되고 싶다' },
      { id: 'lower_fit',       label: '하체 핏이 잘 안 맞는다 (허벅지·엉덩이 여유)' },
      { id: 'leg_length',      label: '다리가 길어 보이고 싶다' },
      { id: 'balance',         label: '상하체 균형이 안 맞는 느낌이다' },
      { id: 'none',            label: '없음' },
      { id: 'other',           label: '기타' },
    ],
  },

  // ── 여성 체형 (female 전용) ───────────────────────────────────
  {
    // companion: bodyConcernFemale shown below on same screen (여성 전용)
    id: 'bodyTypeFemale',
    chapter: 'body',

    dependsOn: { questionId: 'gender', anyOf: ['female'] },
    type: 'checkbox',
    heading: '체형이 어떤 편인가요?',
    hint: '해당되는 것 최대 2개 — 조합도 가능합니다',
    max: 2,
    hasOther: true,
    options: [
      { id: 'hourglass',         label: '모래시계형 — 허리가 잘록하고 어깨·힙 폭이 비슷한 편' },
      { id: 'pear',              label: '하체 발달형 — 하체가 상체보다 넓은 편' },
      { id: 'apple',             label: '복부 발달형 — 복부에 볼륨이 있는 편' },
      { id: 'inverted_triangle', label: '역삼각형 — 어깨가 넓고 하체가 얇은 편' },
      { id: 'rectangle',         label: '직선형 — 전체적으로 굴곡이 적은 편' },
      { id: 'other',             label: '기타' },
    ],
  },
  {
    id: 'bodyConcernFemale',
    chapter: 'body',

    dependsOn: { questionId: 'gender', anyOf: ['female'] },
    type: 'checkbox',
    heading: '옷으로 커버하거나\n살리고 싶은 부분이 있나요?',
    hint: '해당되는 것을 모두 골라주세요',
    hasOther: true,
    options: [
      { id: 'chest_volume', label: '상체 볼륨 (가슴)이 덜 부각되었으면 한다' },
      { id: 'shoulder',     label: '어깨가 덜 넓어 보이고 싶다' },
      { id: 'arm',          label: '팔뚝이 덜 굵어 보이고 싶다' },
      { id: 'waist',        label: '허리 라인을 살리고 싶다' },
      { id: 'belly',        label: '배·복부 라인을 커버하고 싶다' },
      { id: 'hip_thigh',    label: '엉덩이·허벅지를 커버하고 싶다' },
      { id: 'leg_length',   label: '다리가 길어 보이고 싶다' },
      { id: 'none',         label: '없음' },
      { id: 'other',        label: '기타' },
    ],
  },
  {
    id: 'exposureComfort',
    chapter: 'body',

    dependsOn: { questionId: 'gender', anyOf: ['female'] },
    type: 'radio',
    heading: '노출은 어느 정도가\n편한가요?',
    hint: '스타일 방향과 아이템 추천에 반영됩니다',
    autoAdvance: true,
    options: [
      { id: 'covered',  label: '최대한 가리는 게 좋다' },
      { id: 'casual',   label: '일상적인 정도 (반팔·반바지 정도)' },
      { id: 'moderate', label: '어느 정도 노출은 괜찮다 (어깨·등·복부)' },
      { id: 'open',     label: '노출 있는 스타일도 즐긴다' },
      { id: 'depends',  label: '상황에 따라 다르다' },
    ],
  },
  {
    id: 'heelPreference',
    chapter: 'body',

    dependsOn: { questionId: 'gender', anyOf: ['female'] },
    type: 'radio',
    heading: '굽 높이는\n어느 정도가 좋나요?',
    hint: '슈즈 추천 방향에 반영됩니다',
    autoAdvance: true,
    options: [
      { id: 'flat',   label: '플랫 — 굽 없는 스타일' },
      { id: 'low',    label: '낮은 굽 (2~4cm)' },
      { id: 'mid',    label: '중간 굽 (5~7cm)' },
      { id: 'high',   label: '높은 굽 (8cm 이상)' },
      { id: 'varies', label: '상황에 따라 다르다' },
    ],
  },
  {
    id: 'birthdate',
    chapter: 'body',

    type: 'birthdate',
    heading: '생년월일을\n알려주세요',
    hint: '나이에 맞게 처방 방향을 조정합니다. 월·일은 선택 사항입니다.',
  },

  // ── 그룹 7: 헤어 & 그루밍 ────────────────────────────────────
  {
    // companion: hairWant shown below
    id: 'hairStyle',
    chapter: 'hair',

    type: 'radio',
    heading: '지금 헤어스타일을\n가장 잘 설명하는 건?',
    hint: '가장 가까운 것을 골라주세요',
    autoAdvance: true,
    hasOther: true,
    options: [
      { id: 'two_block', label: '투블록' },
      { id: 'parting',   label: '가르마 스타일' },
      { id: 'perm',      label: '펌 (웨이브·볼륨·뽀글이 포함)' },
      { id: 'all_back',  label: '올백·포마드' },
      { id: 'buzz',      label: '짧게 민 편 (버즈컷)' },
      { id: 'growing',   label: '기르는 중·중간 길이' },
      { id: 'other',     label: '기타' },
    ],
  },
  {
    id: 'hairWant',
    chapter: 'hair',

    type: 'radio',
    heading: '헤어는 바꾸고\n싶은 게 있나요?',
    hint: '가장 가까운 것을 골라주세요',
    hasOther: true,
    optional: true,
    options: [
      { id: 'maintain', label: '지금 스타일 유지하고 싶다 — 관리법만 알고 싶다' },
      { id: 'refine',   label: '조금 다듬고 싶다 — 방향은 비슷하게' },
      { id: 'unsure',   label: '바꾸고 싶은데 뭘 해야 할지 모르겠다' },
      { id: 'other',    label: '기타' },
    ],
  },
  {
    id: 'grooming',
    chapter: 'hair',

    type: 'checkbox',
    heading: '지금 하고 있는\n관리가 있나요?',
    hint: '해당되는 것을 모두 골라주세요',
    hasOther: true,
    options: [
      { id: 'skincare',     label: '스킨케어' },
      { id: 'beard',        label: '수염 정리' },
      { id: 'hair_styling', label: '헤어 스타일링 제품 (왁스·젤·스프레이)' },
      { id: 'eyebrow',      label: '눈썹 정리' },
      { id: 'nails',        label: '손톱 관리' },
      { id: 'fragrance',    label: '향수 사용' },
      { id: 'body_care',    label: '바디로션·보습 케어' },
      { id: 'teeth',        label: '치아 관리' },
      { id: 'nothing',      label: '아무것도 안 함' },
      { id: 'other',        label: '기타' },
    ],
  },

  // ── 여성 헤어 & 뷰티 (female 전용) ───────────────────────────
  {
    // companion: hairWantFemale shown below — 여성 전용
    id: 'hairStyleFemale',
    chapter: 'hair',

    dependsOn: { questionId: 'gender', anyOf: ['female'] },
    type: 'radio',
    heading: '지금 헤어스타일을\n가장 잘 설명하는 건?',
    hint: '가장 가까운 것을 골라주세요',
    autoAdvance: true,
    hasOther: true,
    options: [
      { id: 'short',     label: '숏컷 — 귀 위아래 길이' },
      { id: 'bob',       label: '보브 — 턱~어깨 사이 길이' },
      { id: 'medium',    label: '미디엄 — 쇄골 정도 길이' },
      { id: 'long',      label: '롱 — 쇄골 아래로 긴 편' },
      { id: 'wave_perm', label: '웨이브·펌이 있는 편' },
      { id: 'other',     label: '기타' },
    ],
  },
  {
    id: 'hairWantFemale',
    chapter: 'hair',

    dependsOn: { questionId: 'gender', anyOf: ['female'] },
    type: 'radio',
    heading: '헤어는 바꾸고\n싶은 게 있나요?',
    hint: '가장 가까운 것을 골라주세요',
    hasOther: true,
    optional: true,
    options: [
      { id: 'maintain', label: '지금 스타일 유지하고 싶다 — 관리법만 알고 싶다' },
      { id: 'refine',   label: '조금 다듬고 싶다 — 방향은 비슷하게' },
      { id: 'unsure',   label: '바꾸고 싶은데 뭘 해야 할지 모르겠다' },
      { id: 'other',    label: '기타' },
    ],
  },
  {
    id: 'groomingFemale',
    chapter: 'hair',

    dependsOn: { questionId: 'gender', anyOf: ['female'] },
    type: 'checkbox',
    heading: '지금 꾸준히\n하고 있는 관리는?',
    hint: '해당되는 것을 모두 골라주세요',
    hasOther: true,
    options: [
      { id: 'skincare',  label: '스킨케어' },
      { id: 'makeup',    label: '메이크업 (평소 루틴)' },
      { id: 'hair_tool', label: '헤어 도구 (드라이어·고데기·롤 등)' },
      { id: 'perfume',   label: '향수' },
      { id: 'nail',      label: '네일 케어' },
      { id: 'body_care', label: '바디로션·보습 케어' },
      { id: 'teeth',     label: '치아 관리' },
      { id: 'nothing',   label: '아무것도 안 함' },
      { id: 'other',     label: '기타' },
    ],
  },

  // ── 그룹 8: 변화 개방도 ──────────────────────────────────────
  {
    id: 'openOutfit',
    chapter: 'outro',

    type: 'radio',
    heading: '지금 스타일에서\n얼마나 바꾸고 싶나요?',
    hint: '솔직하게 고를수록 처방이 맞아떨어져요',
    autoAdvance: true,
    options: [
      { id: 'full',   label: '완전히 새로 시작하고 싶다' },
      { id: 'refine', label: '큰 방향은 유지하되, 레벨업하고 싶다' },
      { id: 'listen', label: '참고는 하고 싶지만 크게 바꾸긴 부담스럽다' },
      { id: 'keep',   label: '지금 스타일은 유지하고 디테일만 다듬고 싶다' },
    ],
  },
  {
    id: 'signatureKeep',
    chapter: 'outro',

    type: 'checkbox',
    heading: '절대 바꾸고 싶지 않은\n스타일 요소가 있나요?',
    hint: '선택 사항 — 고른 항목은 처방에서 절대 건드리지 않아요',
    optional: true,
    hasOther: true,
    options: [
      { id: 'all_black',    label: '올블랙·무채색 위주 코디' },
      { id: 'loose_fit',    label: '루즈·오버사이즈 핏' },
      { id: 'slim_fit',     label: '슬림·타이트 핏' },
      { id: 'sneakers',     label: '스니커즈' },
      { id: 'hat',          label: '모자 착용' },
      { id: 'glasses',      label: '안경 착용' },
      { id: 'keep_hair',    label: '지금 헤어스타일 유지' },
      { id: 'denim',        label: '데님 항상 포함' },
    ],
  },

  // ── 그룹 9: 예산 ─────────────────────────────────────────────
  {
    id: 'budget',
    chapter: 'outro',

    type: 'radio',
    heading: '스타일에\n쓸 수 있는 예산은?',
    hint: '가장 가까운 구간을 골라주세요',
    autoAdvance: true,
    options: [
      { id: 'under_10', label: '10만원 미만' },
      { id: '10_30',    label: '10~30만원' },
      { id: '30_50',    label: '30~50만원' },
      { id: '50_100',   label: '50~100만원' },
      { id: '100_300',  label: '100~300만원' },
      { id: 'over_300', label: '300만원 이상' },
    ],
  },

  // ── 그룹 10: 착장 & 마무리 ───────────────────────────────────
  {
    id: 'fitpic',
    chapter: 'outro',

    type: 'fitpic',
    heading: '지금 입은 모습\n사진을 올려주세요',
    hint: '전신이 나오는 정면 사진이 가장 정확합니다. 정면+측면 조합을 추천해요. 자연광·실내 조명 모두 가능, 1~3장.',
    optional: true,
    maxFiles: 3,
  },
  {
    id: 'finalNote',
    chapter: 'outro',

    type: 'text',
    heading: '이번 처방전에 꼭 반영됐으면 하는 점이 있나요?',
    placeholder: '칩을 눌러 시작하거나 직접 입력해주세요.',
    hint: '선택 사항 — 상황이나 고민을 구체적으로 적을수록 처방이 달라집니다.',
    optional: true,
    suggestions: [
      {
        label: '내 스타일이 뭔지 잘 모르겠어요',
        fill: '지금 입는 것들이 나를 잘 표현하는 건지 모르겠어요. 뭘 사도 어딘가 어색한 느낌이 있고, 기준 자체가 없는 것 같아요. 기준부터 잡아주세요.',
      },
      {
        label: '뭔가 달라지고 싶은 시점인 것 같아요',
        fill: '요즘 뭔가 달라져야 할 것 같다는 느낌이 있어요. 이미지나 인상을 바꾸고 싶은데 어디서 어떻게 시작해야 할지 모르겠어요.',
      },
      {
        label: '기준 없이 그냥 사입던 것 같아요',
        fill: '지금까지 눈에 띄는 걸 사거나 그냥 아무거나 집어 입었던 것 같아요. 처음으로 제대로 된 기준을 만들고 싶어요.',
      },
      {
        label: '살이 쪄서 뭘 입어도 자신이 없어요',
        fill: '체중이 많이 늘었어요. 지금 체형에서 최대한 좋아 보일 수 있는 핏 기준을 잡아주세요.',
      },
      {
        label: '소개팅 있을 때마다 막막해요',
        fill: '소개팅이나 데이트 자리에서 잘 입고 싶은데 매번 막막해요. 그 자리용 방향도 함께 봐주세요.',
      },
    ],
  },
];

export const PRESCRIPTION_TOTAL = QUESTIONS.length;
