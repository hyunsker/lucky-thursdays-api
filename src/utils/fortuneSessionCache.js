const STORAGE_PREFIX = 'lucky-thursdays-fortune:v1';

/** 오늘·생년월일·태어난 시간이 같으면 같은 저장소 키 */
export function buildFortuneCacheKey({ todayIso, year, month, day, hour }) {
  return `${STORAGE_PREFIX}:${todayIso}:${year}:${month}:${day}:${hour}`;
}

export function readFortuneCache(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFortuneCache(storageKey, bundle) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(bundle));
  } catch {
    /* quota / private mode */
  }
}
