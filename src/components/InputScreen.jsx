import { useState } from 'react';
import { LOGO_DARK_URL } from '../constants/branding.js';
import { tossPadding, tossViewportShell } from '../constants/tossLayout.js';

const BG = '#0f0f0f';
const CARD = '#1a1a1a';
const BORDER = '#2a2a2a';
const MAIN = '#f0ead6';
const SUB = '#888888';
const HINT = '#555555';
const GOLD = '#c9a84c';
const BTN_TEXT = '#0f0f0f';

/** value는 saju 로직과 동일 (0~11, unknown) */
const HOUR_SELECT_OPTIONS = [
  { value: 'unknown', label: '모름' },
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
];

function buildYears() {
  const now = new Date().getFullYear();
  const list = [];
  for (let y = now; y >= 1940; y -= 1) list.push(y);
  return list;
}

const YEARS = buildYears();
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const shell = {
  minHeight: '100%',
  background: BG,
  ...tossViewportShell,
  ...tossPadding.input,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  overflowY: 'auto',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Segoe UI", Roboto, sans-serif',
};

const logoWrap = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: 16,
};

const logoImg = {
  width: 52,
  height: 52,
  objectFit: 'contain',
  display: 'block',
  userSelect: 'none',
  WebkitUserSelect: 'none',
};

const card = {
  background: CARD,
  borderRadius: 16,
  padding: '28px 22px 32px',
  border: `0.5px solid ${BORDER}`,
};

const title = {
  fontSize: 28,
  fontWeight: 800,
  color: MAIN,
  margin: '0 0 12px',
  letterSpacing: '-0.02em',
  textAlign: 'center',
  lineHeight: 1.25,
};

const subtitle = {
  fontSize: 13,
  color: SUB,
  margin: '0 0 28px',
  lineHeight: 1.6,
  textAlign: 'center',
};

const label = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: HINT,
  marginBottom: 10,
  letterSpacing: '0.02em',
};

const BIRTH_GAP = 6;
const BIRTH_MONTH_W = 96;
const BIRTH_DAY_W = 96;

const row = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  gap: BIRTH_GAP,
  marginBottom: 24,
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const birthWrapYear = {
  flex: '1 1 0%',
  minWidth: 112,
  maxWidth: '100%',
  overflow: 'visible',
};

const birthWrapMonth = {
  flex: `0 0 ${BIRTH_MONTH_W}px`,
  width: BIRTH_MONTH_W,
  minWidth: BIRTH_MONTH_W,
  maxWidth: BIRTH_MONTH_W,
  overflow: 'visible',
};

const birthWrapDay = {
  flex: `0 0 ${BIRTH_DAY_W}px`,
  width: BIRTH_DAY_W,
  minWidth: BIRTH_DAY_W,
  maxWidth: BIRTH_DAY_W,
  overflow: 'visible',
};

const selectWrap = {
  position: 'relative',
  width: '100%',
  background: CARD,
  border: `0.5px solid ${BORDER}`,
  borderRadius: 16,
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  overflow: 'visible',
  boxSizing: 'border-box',
};

const selectWrapFocus = {
  borderColor: GOLD,
  boxShadow: `0 0 0 1px ${GOLD}`,
};

const selectBase = {
  display: 'block',
  width: '100%',
  minWidth: '100%',
  padding: '14px 34px 14px 10px',
  fontSize: 15,
  lineHeight: 1.35,
  borderRadius: 16,
  border: 'none',
  background: 'transparent',
  color: MAIN,
  boxSizing: 'border-box',
  WebkitAppearance: 'none',
  appearance: 'none',
  cursor: 'pointer',
  outline: 'none',
  whiteSpace: 'nowrap',
  overflow: 'visible',
  textOverflow: 'clip',
};

const chevron = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
  color: GOLD,
  fontSize: 9,
  lineHeight: 1,
  opacity: 0.95,
  width: 14,
  textAlign: 'center',
};

const btn = {
  width: '100%',
  marginTop: 8,
  minHeight: 48,
  padding: '17px 16px',
  fontSize: 16,
  fontWeight: 700,
  color: BTN_TEXT,
  background: GOLD,
  border: 'none',
  borderRadius: 16,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
};

const BIRTH_WRAP = {
  year: birthWrapYear,
  month: birthWrapMonth,
  day: birthWrapDay,
};

function SelectField({ value, onChange, ariaLabel, children, focused, onFocus, onBlur, birthColumn }) {
  const wrapExtra = birthColumn ? BIRTH_WRAP[birthColumn] : { width: '100%', overflow: 'visible' };
  return (
    <div style={{ ...selectWrap, ...wrapExtra, ...(focused ? selectWrapFocus : {}) }}>
      <select
        style={selectBase}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        aria-label={ariaLabel}
      >
        {children}
      </select>
      <span style={chevron} aria-hidden>
        ▼
      </span>
    </div>
  );
}

export default function InputScreen({
  birth,
  displayBirth,
  hour,
  onBirthChange,
  onHourChange,
  onSubmit,
  submitBusy = false,
  submitLabel = '행운번호 뽑기',
}) {
  const [focusKey, setFocusKey] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  const b = displayBirth ?? birth;
  const maxDay = new Date(b.year, b.month, 0).getDate();
  const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

  const setFocus = (k) => () => setFocusKey(k);
  const clearFocus = () => setFocusKey(null);

  return (
    <div style={shell}>
      <div style={logoWrap}>
        <img
          src={LOGO_DARK_URL}
          alt="목요일의 행운"
          width={52}
          height={52}
          style={logoImg}
          decoding="async"
        />
      </div>
      <div style={card}>
        <h1 style={title}>목요일의 행운</h1>
        <p style={subtitle}>사주로 보는 나만의 연금복권 행운번호</p>

        <form onSubmit={handleSubmit}>
          <span style={label}>생년월일</span>
          <div className="input-birth-row" style={row}>
            <SelectField
              birthColumn="year"
              ariaLabel="출생 연도"
              value={b.year}
              focused={focusKey === 'y'}
              onFocus={setFocus('y')}
              onBlur={clearFocus}
              onChange={(e) => {
                const y = Number(e.target.value);
                const last = new Date(y, b.month, 0).getDate();
                onBirthChange({ ...birth, year: y, day: Math.min(birth.day, last) });
              }}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </SelectField>
            <SelectField
              birthColumn="month"
              ariaLabel="출생 월"
              value={b.month}
              focused={focusKey === 'm'}
              onFocus={setFocus('m')}
              onBlur={clearFocus}
              onChange={(e) =>
                onBirthChange({
                  ...birth,
                  month: Number(e.target.value),
                  day: Math.min(birth.day, new Date(birth.year, Number(e.target.value), 0).getDate()),
                })
              }
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </SelectField>
            <SelectField
              birthColumn="day"
              ariaLabel="출생 일"
              value={b.day}
              focused={focusKey === 'd'}
              onFocus={setFocus('d')}
              onBlur={clearFocus}
              onChange={(e) => onBirthChange({ ...birth, day: Number(e.target.value) })}
            >
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </SelectField>
          </div>

          <span style={label}>태어난 시간</span>
          <div style={{ marginBottom: 28, width: '100%' }}>
            <SelectField
              ariaLabel="태어난 시간대"
              value={hour}
              focused={focusKey === 'h'}
              onFocus={setFocus('h')}
              onBlur={clearFocus}
              onChange={(e) => onHourChange(e.target.value)}
            >
              {HOUR_SELECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </SelectField>
          </div>

          <button type="submit" style={btn} disabled={submitBusy}>
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
