import { useEffect, useState } from 'react';
import { LOGO_DARK_URL } from '../constants/branding.js';
import { tossPadding, tossViewportShell } from '../constants/tossLayout.js';

const BG = '#0f0f0f';
const GOLD = '#c9a84c';
const SUB = '#888888';

const shell = {
  minHeight: '100%',
  flex: 1,
  background: BG,
  ...tossViewportShell,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'center',
  ...tossPadding.loading,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Segoe UI", Roboto, sans-serif',
};

/** 세로 공간을 쓰면서 중앙에 큰 로고·글자 배치 */
const mainCol = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: 'min(78dvh, 560px)',
  gap: 'clamp(14px, 3.5vh, 28px)',
  boxSizing: 'border-box',
};

const titleWrap = {
  width: '100%',
  maxWidth: '100%',
  padding: '0 4px',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
};

const title = {
  margin: 0,
  maxWidth: '100%',
  fontSize: 'clamp(15px, 4.6vw, 19px)',
  fontWeight: 700,
  color: GOLD,
  textAlign: 'center',
  lineHeight: 1.45,
  letterSpacing: '-0.02em',
  wordBreak: 'keep-all',
};

const sub = {
  margin: 0,
  fontSize: 'clamp(13px, 3.8vw, 16px)',
  fontWeight: 500,
  color: SUB,
  textAlign: 'center',
  lineHeight: 1.55,
  padding: '0 8px',
  maxWidth: '100%',
  wordBreak: 'keep-all',
};

const pctStyle = {
  margin: 0,
  fontSize: 'clamp(17px, 5.2vw, 24px)',
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.06em',
  color: GOLD,
};

/** 작은 폰에서도 크게: vmin+clamp (원형 마스크와 동일 값으로 맞춤) */
const LOGO_BOX = 'clamp(118px, 36vmin, 168px)';
const LOGO_IMG_CLIP = 'clamp(106px, 32.4vmin, 152px)';

const logoClipShell = {
  position: 'relative',
  width: LOGO_BOX,
  height: LOGO_BOX,
  borderRadius: '50%',
  overflow: 'hidden',
  background: BG,
  flexShrink: 0,
};

function logoGhostStyle(opacity = 0.2) {
  return {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: LOGO_IMG_CLIP,
    height: LOGO_IMG_CLIP,
    objectFit: 'cover',
    objectPosition: 'center',
    opacity,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    pointerEvents: 'none',
  };
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return reduced;
}

function useFakeProgress(enabled, done, initialPct = 1) {
  const [pct, setPct] = useState(1);
  useEffect(() => {
    if (!enabled) return undefined;
    setPct(Math.max(1, Math.min(99, Number(initialPct) || 1)));
    if (done) {
      const id = window.setInterval(() => {
        setPct((prev) => {
          if (prev >= 100) {
            window.clearInterval(id);
            return 100;
          }
          const remain = 100 - prev;
          const step = Math.max(2, Math.ceil(remain * 0.28));
          return Math.min(100, prev + step);
        });
      }, 16);
      return () => window.clearInterval(id);
    }

    const t0 = Date.now();
    const id = window.setInterval(() => {
      const elapsed = (Date.now() - t0) / 1000;
      /**
       * 실제 응답 대기 중에도 멈춘 느낌이 없도록 99%까지 완만히 증가.
       * 완료(done=true) 신호를 받으면 위 분기에서 빠르게 100으로 마무리한다.
       */
      const eased = 99 * (1 - Math.exp(-elapsed / 3.2));
      setPct(Math.min(99, Math.max(1, Math.floor(eased))));
    }, 100);
    return () => window.clearInterval(id);
  }, [enabled, done, initialPct]);
  return pct;
}

function LogoCompleting({ pct, reducedMotion }) {
  const baseImg = {
    width: LOGO_IMG_CLIP,
    height: LOGO_IMG_CLIP,
    objectFit: 'cover',
    objectPosition: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    pointerEvents: 'none',
  };

  if (reducedMotion) {
    return (
      <div style={logoClipShell}>
        <img src={LOGO_DARK_URL} alt="" decoding="async" style={{ ...baseImg, ...logoGhostStyle(1) }} />
      </div>
    );
  }

  const sweepDeg = Math.max(1, (pct / 100) * 360);
  const mask = `conic-gradient(from -90deg, #000 0deg, #000 ${sweepDeg}deg, transparent ${sweepDeg}deg)`;

  const topImg = {
    ...baseImg,
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: `${LOGO_IMG_CLIP} ${LOGO_IMG_CLIP}`,
    maskSize: `${LOGO_IMG_CLIP} ${LOGO_IMG_CLIP}`,
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  };

  return (
    <div style={logoClipShell}>
      <img src={LOGO_DARK_URL} alt="" decoding="async" style={logoGhostStyle(0.22)} aria-hidden />
      <img src={LOGO_DARK_URL} alt="" decoding="async" style={topImg} aria-hidden />
    </div>
  );
}

export default function LoadingScreen({ done = false, initialPct = 1 }) {
  const reducedMotion = usePrefersReducedMotion();
  const pct = useFakeProgress(!reducedMotion, done, initialPct);
  const displayPct = reducedMotion ? null : pct;

  return (
    <div style={shell} role="status" aria-live="polite" aria-busy="true" aria-label="당신의 행운을 가져다줄 네잎클로버를 완성 중입니다. 맞춤 분석 중">
      <div style={mainCol}>
        <LogoCompleting pct={pct} reducedMotion={reducedMotion} />

        {displayPct !== null ? <p style={pctStyle}>{displayPct}%</p> : null}

        <div style={titleWrap}>
          <p style={title}>
            당신의 행운을 가져다줄
            <br />
            네잎클로버를 완성 중입니다!
          </p>
        </div>
        <p style={sub}>
          데이터 기반으로 분석하는 중입니다.
          <br />
          잠시만 기다려주세요.
        </p>
      </div>
    </div>
  );
}
