/** 오행별 재물운 중심 문구 (index 0~4 = 목화토금수) */
const POOLS = [
  [
    '오늘은 금전적인 흐름이 조용히 자라나는 날입니다. 작은 지출을 줄이면 마음까지 가벼워져요.',
    '재물운은 인연과 함께 움직입니다. 주변의 좋은 정보가 작은 이득으로 이어질 수 있어요.',
    '오늘은 계획보다 실행이 재물운을 살립니다. 미뤄둔 정리 한 가지만 해도 보람이 생겨요.',
    '목(木)의 기운처럼 뿌리를 다지는 하루예요. 장기적인 저축·학습에 마음을 두면 좋아요.',
    '작은 행운이 쌓여 큰 결실로 이어질 수 있는 날입니다. 과소비만 조심하면 흐름이 좋아요.',
  ],
  [
    '오늘은 금전적인 에너지가 활발해지는 날입니다. 기회가 스쳐 지나가니 놓치지 마세요.',
    '화(火)의 기운처럼 속도가 붙는 하루예요. 단, 충동 소비는 잠시 식혔다가 결정해 보세요.',
    '재물운은 당신의 열정과 비례합니다. 관심 있는 일에 시간을 쓰면 보상이 따라올 수 있어요.',
    '오늘은 소액이라도 움직이는 돈에 행운이 붙기 쉬워요. 영수증·포인트 정리도 이득이 될 수 있어요.',
    '밝은 마음이 재물의 문을 열어줍니다. 긍정적인 소비와 자기계발이 조화를 이루면 좋아요.',
  ],
  [
    '토(土)의 기운처럼 안정이 재물운의 핵심입니다. 고정 지출을 점검하면 여유가 생겨요.',
    '오늘은 꾸준함이 곧 재물운입니다. 작은 저축 습관이 미래의 든든한 밑천이 됩니다.',
    '현실적인 선택이 행운을 부릅니다. 필요와 욕구를 나누어 적으면 지갑이 편안해져요.',
    '재물운은 집·생활 기반에서 올라옵니다. 생활비 예산을 한 번만 다시 잡아도 마음이 안정돼요.',
    '오늘은 받는 것보다 지키는 것이 이득인 날입니다. 약속된 지출만 지켜도 만족스러운 하루예요.',
  ],
  [
    '금(金)의 기운처럼 단단한 결정이 재물운을 지켜줍니다. 우선순위를 정하면 돈이 덜 새어요.',
    '오늘은 정리·정돈이 재물운을 높입니다. 미사용 구독·자동이체를 확인해 보세요.',
    '재물운은 원칙에서 나옵니다. 스스로 정한 소비 규칙을 지키면 자신감이 쌓여요.',
    '작은 금전적 판단이 모여 큰 차이를 만듭니다. 비교 구매 한 번이 만족도를 올려줄 수 있어요.',
    '오늘은 신중함이 행운을 키웁니다. 큰 지출은 하루 밤 자고 나서 다시 생각해 보세요.',
  ],
  [
    '수(水)의 기운처럼 흐름을 타면 재물운이 부드럽습니다. 유연한 일정이 기회를 부릅니다.',
    '오늘은 금전적인 흐름이 원활한 날입니다. 작은 행운이 쌓여 큰 결실로 이어질 수 있어요.',
    '재물운은 정보와 함께 움직입니다. 궁금했던 금융 상식을 하나만 찾아봐도 좋은 날이에요.',
    '지출을 줄이기보다 낭비를 줄이면 여유가 넓어집니다. 오늘은 ‘한 번 더 고민’이 답이에요.',
    '마음의 여유가 지갑의 여유로 이어집니다. 짧은 산책 후 소비 결정을 하면 후회가 줄어들어요.',
  ],
];

function hashPick(str, modulo) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h % modulo;
}

export function pickFortuneText(elementIndex, todayKey) {
  const pool = POOLS[elementIndex % 5];
  const idx = hashPick(`${elementIndex}|${todayKey}`, pool.length);
  return pool[idx];
}

/** 기본 운세 2줄 (서로 다른 풀 인덱스) */
export function getBasicFortuneTwoLines(elementIndex, todayKey) {
  const pool = POOLS[elementIndex % 5];
  const i0 = hashPick(`${elementIndex}|${todayKey}|b0`, pool.length);
  let i1 = hashPick(`${elementIndex}|${todayKey}|b1`, pool.length);
  if (i1 === i0) i1 = (i1 + 1) % pool.length;
  return [pool[i0], pool[i1]];
}

const WEALTH_HIGH = [
  '들어오는 소식이 생기기 쉬운 날이에요. 작은 수입·환급·포인트를 챙기면 기분까지 좋아져요.',
  '재물의 기운이 위로 올라와 있어요. 미뤄둔 정산이나 청구를 처리하기 좋습니다.',
  '노력한 만큼 인정받기 쉬운 흐름이에요. 부수입·용돈·보상이 기대될 수 있어요.',
];
const WEALTH_MID = [
  '큰 변동보다 유지·정돈에 행운이 있어요. 지출 구조를 한 번만 점검해도 만족스러워요.',
  '평온한 재물운이에요. 급하게 결정하기보다 하루만 더 비교해 보는 게 이득입니다.',
  '꾸준함이 빛을 보는 날이에요. 작은 저축·자동이체 설정도 의미가 있어요.',
];
const WEALTH_LOW = [
  '지갑이 가벼워질 수 있는 날이에요. 필수 지출만 남기고 나머지는 내일로 미뤄 보세요.',
  '유혹이 많아질 수 있어요. 장바구니에 담기만 하고 하루 뒤에 결제하는 습관이 도움이 됩니다.',
  '예상 밖 지출에 대비하면 마음이 편해져요. 비상금·한도를 먼저 확인해 두세요.',
];

const KEYWORD_PAIRS = [
  ['결단력', '새로운 시작'],
  ['인내', '정리'],
  ['소통', '기회'],
  ['균형', '여유'],
  ['집중', '실천'],
  ['신뢰', '협력'],
  ['계획', '안정'],
  ['유연함', '휴식'],
  ['도전', '성장'],
  ['세심함', '확인'],
];

const CAUTIONS = [
  '충동적인 지출은 피하세요.',
  '늦은 밤 쇼핑 결제는 내일로 미루면 좋아요.',
  '말로 약속한 금액은 메모해 두세요.',
  '할인에 끌려 불필요한 구매를 하지 않도록 주의하세요.',
  'SNS 광고 링크는 한 번 더 고민한 뒤 열어보세요.',
];

const WEEKLY_LINES_A = [
  '이번 주는 시작이 반입니다. 월요일에 작은 목표 하나만 정해 두면 주말까지 흐름이 이어져요.',
  '한 주의 중반에 집중력이 올라가요. 중요한 연락·정리는 수·목요일에 잡아 보세요.',
  '주 초반에 마음을 다잡으면 주말에 여유가 생깁니다. 일찍 자는 하루가 큰 도움이 돼요.',
];
const WEEKLY_LINES_B = [
  '주말 전 작은 성취가 다음 주 운을 띄워 줍니다. 미뤄둔 한 가지를 끝내보세요.',
  '주중 작은 칭찬이 큰 에너지로 돌아와요. 주변에 고마움을 한 마디 전해 보세요.',
  '이번 주는 ‘덜 하기’가 전략일 수 있어요. 필수만 남기면 오히려 결과가 좋아져요.',
];

/**
 * 상세 운세 (동일 element + 날짜면 항상 동일)
 */
export function getDetailedFortune(elementIndex, todayKey) {
  const seed = `${elementIndex}|${todayKey}|detail`;
  const w = hashPick(`${seed}|wealth`, 3);
  const wealthLevel = w === 0 ? '상' : w === 1 ? '중' : '하';
  const wealthPool = w === 0 ? WEALTH_HIGH : w === 1 ? WEALTH_MID : WEALTH_LOW;
  const wealthLine = wealthPool[hashPick(`${seed}|wl`, wealthPool.length)];

  const keywords = KEYWORD_PAIRS[hashPick(`${seed}|kw`, KEYWORD_PAIRS.length)];

  const caution = CAUTIONS[hashPick(`${seed}|c`, CAUTIONS.length)];
  const weekly1 = WEEKLY_LINES_A[hashPick(`${seed}|w1`, WEEKLY_LINES_A.length)];
  const weekly2 = WEEKLY_LINES_B[hashPick(`${seed}|w2`, WEEKLY_LINES_B.length)];

  return {
    wealthLevel,
    wealthLine,
    keywords,
    caution,
    weeklyLines: [weekly1, weekly2],
  };
}
