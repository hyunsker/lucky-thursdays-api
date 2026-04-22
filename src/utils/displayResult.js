import {
  computeFortuneNumbers,
  getElementInfo,
} from './sajuCalculator.js';
import { getBasicFortuneTwoLines, getDetailedFortune } from './fortuneText.js';

const ELEMENT_HANJA = { 목: '木', 화: '火', 토: '土', 금: '金', 수: '水' };

export function elementCharToBadge(fiveElement) {
  const c = String(fiveElement || '').trim().charAt(0);
  const label = ['목', '화', '토', '금', '수'].includes(c) ? c : '토';
  const hanja = ELEMENT_HANJA[label] || '土';
  return {
    label,
    display: `오행 ${label}(${hanja})`,
  };
}

function normalizeSixDigits(s) {
  const digits = String(s ?? '').replace(/\D/g, '').slice(0, 6);
  return digits.padStart(6, '0');
}

function clampGroup(n) {
  const g = Number.parseInt(String(n), 10);
  if (Number.isNaN(g)) return 1;
  return Math.min(5, Math.max(1, g));
}

/** 레거시: 조 한 자리 + 여섯 자리를 이어붙인 7글자 문자열(내부 파싱용만) */
function parseLottery7Field(s) {
  const digits = String(s ?? '').replace(/\D/g, '');
  if (digits.length !== 7) return null;
  const g = Number(digits[0]);
  if (g < 1 || g > 5) return null;
  return { group: g, sixDigit: digits.slice(1, 7) };
}

function sixDigitsFromArray(arr) {
  if (!Array.isArray(arr) || arr.length < 6) return null;
  const out = arr.slice(0, 6).map((n) => {
    const v = Number.parseInt(String(n), 10);
    return Number.isNaN(v) ? 0 : Math.min(9, Math.max(0, v));
  });
  return out.join('');
}

/** YYYY-MM-DD 외 형식(슬래시 등) 보정 */
function coerceTodayIsoString(value, fallbackTodayIso) {
  const t = String(value ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (m) {
    const y = m[1];
    const mo = m[2].padStart(2, '0');
    const d = m[3].padStart(2, '0');
    return `${y}-${mo}-${d}`;
  }
  if (fallbackTodayIso && /^\d{4}-\d{2}-\d{2}$/.test(fallbackTodayIso)) return fallbackTodayIso;
  return null;
}

/**
 * Claude 등에서 받은 JSON → 화면용 단일 구조
 */
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function padCandidatesToFive(candidates, seedKey) {
  const seen = new Set(candidates.map((c) => `${c.group}-${c.sixDigit}`));
  const out = [...candidates];
  let i = 0;
  while (out.length < 5 && i < 200) {
    const h1 = hash32(`${seedKey}|pad|${i}|a`);
    const h2 = hash32(`${seedKey}|pad|${i}|b`);
    const g = (h1 % 5) + 1;
    const d = String(h2 % 1_000_000)
      .padStart(6, '0')
      .slice(0, 6);
    const key = `${g}-${d}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({
        group: g,
        sixDigit: d,
        analysisReason: '같은 사주 흐름에서 차선 조합으로 골랐어요.',
      });
    }
    i += 1;
  }
  return out.slice(0, 5);
}

/**
 * Claude JSON → 공통 운세 + 연금복권 후보 5개 (1회 호출용)
 * @param {unknown} raw
 * @param {string} fallbackTodayIso
 * @param {string} seedKey 생년월일·시간·날짜 등 후보 보강용
 */
export function normalizeFortuneBundle(raw, fallbackTodayIso, seedKey) {
  const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!o || typeof o !== 'object') throw new Error('INVALID_JSON');

  const rows = Array.isArray(o.lotteryCandidates) ? o.lotteryCandidates : [];
  const parsedRows = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const g = clampGroup(row.group ?? row.lottery?.group ?? 1);
    const digits = String(row.sixDigits ?? row.sixDigit ?? '').replace(/\D/g, '').slice(0, 6);
    if (digits.length < 6) continue;
    const sixDigit = digits.padStart(6, '0').slice(0, 6);
    const rank = Number.parseInt(String(row.rank ?? ''), 10);
    const pickReason = String(row.pickReason ?? row.analysisReason ?? '').trim() || null;
    parsedRows.push({
      rank: Number.isFinite(rank) && rank >= 1 && rank <= 5 ? rank : parsedRows.length + 1,
      group: g,
      sixDigit,
      analysisReason: pickReason,
    });
  }

  parsedRows.sort((a, b) => a.rank - b.rank);

  const seen = new Set();
  let candidates = parsedRows.filter((c) => {
    const k = `${c.group}-${c.sixDigit}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (candidates.length === 0) {
    const single = normalizeFortunePayload(o, fallbackTodayIso);
    candidates = [
      {
        rank: 1,
        group: single.group,
        sixDigit: single.sixDigit,
        analysisReason: single.analysisReason,
      },
    ];
  }

  const first = candidates[0];
  const merged = normalizeFortunePayload(
    { ...o, group: first.group, sixDigits: first.sixDigit },
    fallbackTodayIso,
  );

  candidates = candidates.map((c, idx) => ({
    rank: idx + 1,
    group: c.group,
    sixDigit: c.sixDigit,
    analysisReason: c.analysisReason ?? merged.analysisReason,
  }));

  candidates = padCandidatesToFive(candidates, seedKey || 'seed').map((c, i) => ({
    rank: i + 1,
    group: c.group,
    sixDigit: c.sixDigit,
    analysisReason: c.analysisReason,
  }));

  const shared = {
    today: merged.today,
    basicLines: merged.basicLines,
    detail: merged.detail,
    yearStem: merged.yearStem,
    yearBranch: merged.yearBranch,
    elementBadgeText: merged.elementBadgeText,
    yongshin: merged.yongshin,
    fiveElementLabel: merged.fiveElementLabel,
    source: merged.source,
  };

  return { shared, candidates, activeIndex: 0 };
}

export function mergeFortuneBundleView(bundle) {
  if (!bundle?.shared || !Array.isArray(bundle.candidates) || bundle.candidates.length === 0) {
    throw new Error('INVALID_BUNDLE');
  }
  const idx = Math.min(Math.max(0, bundle.activeIndex ?? 0), bundle.candidates.length - 1);
  const c = bundle.candidates[idx];
  return {
    ...bundle.shared,
    group: c.group,
    sixDigit: c.sixDigit,
    analysisReason: c.analysisReason,
    candidateIndex: idx,
    candidateCount: bundle.candidates.length,
  };
}

export function normalizeFortunePayload(raw, fallbackTodayIso) {
  const o = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!o || typeof o !== 'object') throw new Error('INVALID_JSON');

  const yearStem = String(o.yearStem ?? o.year_heavenly_stem ?? o.saju?.yearStem ?? '').trim() || '?';
  const yearBranch = String(o.yearBranch ?? o.year_earthly_branch ?? o.saju?.yearBranch ?? '').trim() || '?';
  const fiveElement = String(o.fiveElement ?? o.five_element ?? o.saju?.fiveElement ?? '토').trim();
  const yongshin = String(o.yongshin ?? o.yong_shin ?? o.saju?.yongshin ?? '').trim() || '균형';

  const from7 = parseLottery7Field(o.lottery7 ?? o.lottery_7 ?? o.sevenDigit);

  const rawGroup = o.group ?? o.lottery?.group;
  const group =
    rawGroup != null && String(rawGroup).trim() !== ''
      ? clampGroup(rawGroup)
      : from7
        ? from7.group
        : 1;

  const fromArr = sixDigitsFromArray(o.sixDigitNumbers ?? o.six_digits);
  let sixDigit;
  if (fromArr) {
    sixDigit = fromArr;
  } else {
    const d = String(o.sixDigits ?? o.six_digit ?? o.lottery?.sixDigits ?? '').replace(/\D/g, '');
    if (d.length >= 6) {
      sixDigit = d.slice(0, 6);
    } else if (d.length > 0) {
      sixDigit = normalizeSixDigits(d);
    } else if (from7) {
      sixDigit = normalizeSixDigits(from7.sixDigit);
    } else {
      sixDigit = normalizeSixDigits('');
    }
  }

  const analysisReason = String(o.analysisReason ?? o.analysis_reason ?? o.reason ?? '').trim() || null;

  let fortuneLine1 = String(o.fortuneLine1 ?? o.fortuneToday?.line1 ?? o.fortune?.line1 ?? '').trim();
  let fortuneLine2 = String(o.fortuneLine2 ?? o.fortuneToday?.line2 ?? o.fortune?.line2 ?? '').trim();
  if (!fortuneLine1) fortuneLine1 = '오늘은 재물 흐름을 가볍게 살펴보기 좋은 날이에요.';
  if (!fortuneLine2) fortuneLine2 = '무리한 지출보다 계획을 한 번 점검해 보세요.';

  const wealthLevelRaw = String(o.wealthLevel ?? o.detail?.wealthLevel ?? '중').trim();
  const wealthLevel = ['상', '중', '하'].includes(wealthLevelRaw) ? wealthLevelRaw : '중';
  const wealthLine = String(o.wealthDetail ?? o.wealth_line ?? o.detail?.wealthLine ?? '').trim() || '오늘은 지출 습관을 한 번 점검해 보세요.';

  const k1 = String(o.keyword1 ?? o.keywords?.[0] ?? '').trim() || '균형';
  const k2 = String(o.keyword2 ?? o.keywords?.[1] ?? '').trim() || '여유';
  const caution = String(o.caution ?? o.detail?.caution ?? '').trim() || '충동적인 지출은 피하세요.';
  const weekly1 = String(o.weekly1 ?? o.weeklyLines?.[0] ?? o.detail?.weeklyLines?.[0] ?? '').trim() || '이번 주는 작은 목표부터 차근차근 이루어 가면 좋아요.';
  const weekly2 = String(o.weekly2 ?? o.weeklyLines?.[1] ?? o.detail?.weeklyLines?.[1] ?? '').trim() || '몸과 마음의 리듬을 맞추면 운도 따라옵니다.';

  const badge = elementCharToBadge(fiveElement);

  const todayRaw = o.todayIso ?? o.today ?? '';
  let today = coerceTodayIsoString(todayRaw, fallbackTodayIso);
  if (!today) {
    if (fallbackTodayIso && /^\d{4}-\d{2}-\d{2}$/.test(fallbackTodayIso)) {
      today = fallbackTodayIso;
    } else {
      throw new Error('MISSING_TODAY');
    }
  }

  return {
    source: 'ai',
    today,
    group,
    sixDigit,
    basicLines: [fortuneLine1, fortuneLine2],
    detail: {
      wealthLevel,
      wealthLine,
      keywords: [k1, k2],
      caution,
      weeklyLines: [weekly1, weekly2],
    },
    yearStem,
    yearBranch,
    fiveElementLabel: badge.label,
    elementBadgeText: badge.display,
    yongshin,
    analysisReason,
  };
}

export function buildFallbackDisplayResult(birthYear, birthMonth, birthDay, hourValue) {
  const computed = computeFortuneNumbers(birthYear, birthMonth, birthDay, hourValue);
  const basicLines = getBasicFortuneTwoLines(computed.elementIndex, computed.today);
  const d = getDetailedFortune(computed.elementIndex, computed.today);
  const el = getElementInfo(computed.elementIndex);

  return {
    source: 'fallback',
    today: computed.today,
    group: computed.group,
    sixDigit: computed.sixDigit,
    basicLines,
    detail: {
      wealthLevel: d.wealthLevel,
      wealthLine: d.wealthLine,
      keywords: d.keywords,
      caution: d.caution,
      weeklyLines: d.weeklyLines,
    },
    yearStem: computed.yearStem,
    yearBranch: computed.yearBranch,
    fiveElementLabel: el.label,
    elementBadgeText: el.display,
    yongshin: null,
    analysisReason: null,
  };
}
