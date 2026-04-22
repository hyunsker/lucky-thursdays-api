/** 천간: 갑을병정무기경신임계 */
export const HEAVENLY_STEMS = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

/** 지지: 자축인묘진사오미신유술해 */
export const EARTHLY_BRANCHES = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

/** 시진 라벨 (지지 기준) */
export const HOUR_OPTIONS = [
  { value: '0', label: '자시 (23~01시)' },
  { value: '1', label: '축시 (01~03시)' },
  { value: '2', label: '인시 (03~05시)' },
  { value: '3', label: '묘시 (05~07시)' },
  { value: '4', label: '진시 (07~09시)' },
  { value: '5', label: '사시 (09~11시)' },
  { value: '6', label: '오시 (11~13시)' },
  { value: '7', label: '미시 (13~15시)' },
  { value: '8', label: '신시 (15~17시)' },
  { value: '9', label: '유시 (17~19시)' },
  { value: '10', label: '술시 (19~21시)' },
  { value: '11', label: '해시 (21~23시)' },
  { value: 'unknown', label: '모름' },
];

/** 목=0 화=1 토=2 금=3 수=4 */
const STEM_ELEMENT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];

/** 지지 → 오행 인덱스 */
const BRANCH_ELEMENT = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];

const ELEMENT_NAMES = [
  { key: 'wood', hanja: '木', label: '목' },
  { key: 'fire', hanja: '火', label: '화' },
  { key: 'earth', hanja: '土', label: '토' },
  { key: 'metal', hanja: '金', label: '금' },
  { key: 'water', hanja: '水', label: '수' },
];

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 양력 연도 → 년주 천간·지지 인덱스 (1984=갑자 기준 일반 공식: (year-4) mod)
 */
export function getYearPillar(year) {
  const stem = ((year - 4) % 10 + 10) % 10;
  const branch = ((year - 4) % 12 + 12) % 12;
  return { stem, branch };
}

export function getStemBranchLabels(year) {
  const { stem, branch } = getYearPillar(year);
  return {
    stemChar: HEAVENLY_STEMS[stem],
    branchChar: EARTHLY_BRANCHES[branch],
    stem,
    branch,
  };
}

/** 천간+지지 기반 대표 오행 (0~4) */
export function getDominantElementIndex(stemIndex, branchIndex) {
  const se = STEM_ELEMENT[stemIndex];
  const be = BRANCH_ELEMENT[branchIndex];
  return (se * 3 + be * 2) % 5;
}

export function getElementInfo(elementIndex) {
  const e = ELEMENT_NAMES[elementIndex];
  return {
    ...e,
    index: elementIndex,
    display: `오행 ${e.label}(${e.hanja})`,
  };
}

function formatTodayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 연금복권 스타일: 조 1~5, 6자리
 * 동일 생년월일·시간·당일 날짜 → 항상 동일 결과
 */
export function computeFortuneNumbers(birthYear, birthMonth, birthDay, hourValue) {
  const today = formatTodayKey();
  const { stem, branch } = getYearPillar(birthYear);
  const elementIndex = getDominantElementIndex(stem, branch);

  const hourPart = hourValue === 'unknown' ? 'x' : String(hourValue);
  const seedBase = [
    birthYear,
    birthMonth,
    birthDay,
    hourPart,
    today,
    stem,
    branch,
    elementIndex,
  ].join('|');

  const h1 = hash32(seedBase);
  const h2 = hash32(`${seedBase}|lotto`);

  const group = (h1 % 5) + 1;
  const sixDigit = h2 % 1_000_000;

  return {
    group,
    sixDigit: String(sixDigit).padStart(6, '0'),
    elementIndex,
    today,
    yearStem: HEAVENLY_STEMS[stem],
    yearBranch: EARTHLY_BRANCHES[branch],
  };
}

/** YYYY-MM-DD → "2026년 4월 2일 목요일" (로컬 달력 기준) */
export function formatKoreanDateLabel(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${y}년 ${m}월 ${d}일 ${weekdays[date.getDay()]}`;
}

export { formatTodayKey };
