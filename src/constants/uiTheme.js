/**
 * 앱 전역 UI 토큰 (웜 다크 프리미엄 — 부드러운 명암·큰 블러)
 */

export const fontStack =
  'Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Segoe UI", Roboto, sans-serif';

/** 전체 배경 그라데이션 (패널은 그대로, 공간만 은은하게) */
export const backgrounds = {
  shell:
    'linear-gradient(165deg, #171615 0%, #131211 42%, #0e0e0d 72%, #121110 100%)',
};

export const color = {
  bg: '#121110',
  card: '#1b1a17',
  border: 'rgba(255, 245, 230, 0.09)',
  main: '#ece8df',
  sub: '#9c968d',
  hint: '#6f6a63',
  /** 앱 포인트 컬러 — 너무 회색 띠지 않게 채도·대비 유지 */
  gold: '#cba44e',
  goldMuted: '#9f8238',
  goldHighlight: '#e9daa2',
  btnText: '#141210',
  surface: '#161513',
  /** 포커스 링 · 세컨더리 버튼 테두리 (gold 기준 RGB 203,164,78) */
  goldTint08: 'rgba(203, 164, 78, 0.1)',
  goldTint22: 'rgba(203, 164, 78, 0.28)',
  goldTint42: 'rgba(203, 164, 78, 0.45)',
  focusRing: 'rgba(203, 164, 78, 0.24)',
};

export const radius = {
  card: 18,
  input: 14,
  overlay: 18,
  sm: 12,
  pill: 999,
};

/** 화면 전환·막대 등 공통 이징 */
export const ease = {
  out: 'cubic-bezier(0.33, 1, 0.68, 1)',
  soft: 'cubic-bezier(0.4, 0, 0.2, 1)',
  material: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const shadow = {
  cardRaised:
    '0 20px 50px rgba(0, 0, 0, 0.32), inset 0 1px 0 rgba(255, 252, 245, 0.05)',
  cardRest:
    '0 10px 28px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 252, 245, 0.04)',
  cardInner: 'inset 0 1px 0 rgba(255, 252, 245, 0.055)',
  adCard:
    '0 24px 64px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 252, 245, 0.05), 0 0 0 1px rgba(255, 245, 230, 0.05)',
  goldBar: '0 0 22px rgba(203, 164, 78, 0.28)',
  trackInset: 'inset 0 1px 3px rgba(0,0,0,0.35)',
  logo:
    '0 0 0 1px rgba(203, 164, 78, 0.18), 0 16px 48px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 252, 245, 0.06)',
  primaryBtn:
    '0 1px 0 rgba(255, 255, 255, 0.14) inset, 0 8px 26px rgba(203, 164, 78, 0.22)',
};

export const adOverlay = {
  root: {
    position: 'fixed',
    inset: 0,
    zIndex: 200,
    background: 'rgba(10, 9, 8, 0.82)',
    backdropFilter: 'blur(14px) saturate(1.05)',
    WebkitBackdropFilter: 'blur(14px) saturate(1.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    boxSizing: 'border-box',
  },
  card: (maxWidth = 340) => ({
    width: '100%',
    maxWidth,
    background: `linear-gradient(180deg, ${color.card} 0%, rgba(26, 25, 22, 0.98) 100%)`,
    border: `0.5px solid ${color.border}`,
    borderRadius: radius.overlay,
    padding: '28px 22px',
    textAlign: 'center',
    boxShadow: shadow.adCard,
  }),
  track: {
    width: '100%',
    height: 9,
    marginTop: 20,
    background: 'linear-gradient(180deg, #131211, #191816)',
    border: `0.5px solid ${color.border}`,
    borderRadius: radius.pill,
    overflow: 'hidden',
    boxShadow: shadow.trackInset,
  },
  fill: {
    height: '100%',
    maxWidth: '100%',
    background: `linear-gradient(90deg, ${color.goldMuted} 0%, ${color.gold} 38%, ${color.goldHighlight} 100%)`,
    borderRadius: radius.pill,
    boxShadow: shadow.goldBar,
    transition: `width 360ms ${ease.soft}`,
    willChange: 'width',
  },
};
