import { useEffect, useRef, useState } from 'react';
import { LOGO_DARK_URL } from '../constants/branding.js';
import { tossPadding, tossViewportShell } from '../constants/tossLayout.js';
import { backgrounds, color, ease, fontStack, shadow } from '../constants/uiTheme.js';

const BG = color.bg;
const GOLD = color.gold;
const SUB = color.sub;
const FINISH_MS = 920;

const shell = {
  flex: 1,
  width: '100%',
  minHeight: '100dvh',
  background: backgrounds.shell,
  ...tossViewportShell,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  justifyContent: 'center',
  ...tossPadding.loading,
  fontFamily: fontStack,
};

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
  fontWeight: 600,
  color: GOLD,
  textAlign: 'center',
  lineHeight: 1.52,
  letterSpacing: '-0.018em',
  wordBreak: 'keep-all',
};

const sub = {
  margin: 0,
  fontSize: 'clamp(13px, 3.8vw, 16px)',
  fontWeight: 400,
  color: SUB,
  textAlign: 'center',
  lineHeight: 1.58,
  padding: '0 8px',
  maxWidth: '100%',
  wordBreak: 'keep-all',
  letterSpacing: '0.02em',
};

const pctStyle = {
  margin: 0,
  minHeight: '1.2em',
  fontSize: 'clamp(17px, 5.2vw, 24px)',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.055em',
  color: GOLD,
  fontFeatureSettings: '"tnum"',
  transition: `opacity 0.32s ${ease.soft}`,
};

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
  boxShadow: shadow.logo,
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

/**
 * done 이 켜질 때 이전 %를 유지한 채 100%까지 — 뒤로 떨어지는 현상 방지
 */
function useFakeProgress(enabled, done, initialPct = 1) {
  const base = Math.max(1, Math.min(95, Number(initialPct) || 1));
  const [pct, setPct] = useState(base);
  const pctRef = useRef(base);

  useEffect(() => {
    if (!enabled) return undefined;
    pctRef.current = Math.max(pctRef.current, base);
    let mounted = true;
    let raf = 0;

    const runIdle = () => {
      const t0 = performance.now();
      const begin = base;
      const step = (now) => {
        if (!mounted) return;
        const sec = (now - t0) / 1000;
        const eased = begin + (96 - begin) * (1 - Math.exp(-sec / 2.4));
        const next = Math.max(pctRef.current, Math.min(96, eased));
        pctRef.current = next;
        setPct(next);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const runFinish = () => {
      const startFrom = Math.max(pctRef.current, base);
      pctRef.current = startFrom;
      const t0 = performance.now();
      const step = (now) => {
        if (!mounted) return;
        const t = Math.min(1, (now - t0) / FINISH_MS);
        const easeOut = 1 - (1 - t) * (1 - t);
        const v = startFrom + (100 - startFrom) * easeOut;
        pctRef.current = v;
        setPct(v);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (done) {
      runFinish();
    } else {
      runIdle();
    }

    return () => {
      mounted = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled, done, base]);

  const sweep = Math.min(100, Math.max(0, pct));
  return {
    label: Math.min(100, Math.max(0, Math.floor(sweep))),
    sweep,
  };
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
  const progress = useFakeProgress(!reducedMotion, done, initialPct);
  const displayPct = reducedMotion ? null : progress.label;
  const sweepPct = reducedMotion ? 100 : progress.sweep;

  return (
    <div style={shell} role="status" aria-live="polite" aria-busy="true" aria-label="당신의 행운을 가져다줄 네잎클로버를 완성 중입니다. 맞춤 분석 중">
      <div style={mainCol}>
        <LogoCompleting pct={reducedMotion ? 100 : sweepPct} reducedMotion={reducedMotion} />

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
