import { TossAds } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tossPadding, tossViewportShell } from '../constants/tossLayout.js';
import { AD_GROUP_IDS } from '../constants/adIds.js';
import {
  adOverlay,
  backgrounds,
  color,
  ease,
  fontStack,
  radius,
  shadow,
} from '../constants/uiTheme.js';
import { playFullScreenAd } from '../services/adService.js';
import { formatKoreanDateLabel } from '../utils/sajuCalculator.js';
import { shareFortuneContent } from '../utils/shareFortune.js';

const {
  card: CARD,
  border: BORDER,
  main: MAIN,
  sub: SUB,
  hint: HINT,
  gold: GOLD,
  goldMuted: GOLD_MUTED,
  btnText: BTN_TEXT,
  surface: SURFACE,
} = color;
const shell = {
  flex: 1,
  width: '100%',
  minHeight: '100dvh',
  background: backgrounds.shell,
  ...tossViewportShell,
  ...tossPadding.result,
  fontFamily: fontStack,
  boxSizing: 'border-box',
  overflowY: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const dateHeader = {
  fontSize: 12,
  fontWeight: 500,
  color: SUB,
  textAlign: 'center',
  margin: '0 0 18px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  fontVariantNumeric: 'tabular-nums',
};

const pageTitle = {
  fontSize: 20,
  fontWeight: 700,
  color: MAIN,
  margin: '0 0 20px',
  textAlign: 'center',
  letterSpacing: '-0.022em',
  lineHeight: 1.32,
};

const numberCard = {
  borderRadius: radius.card,
  padding: '30px 22px 26px',
  textAlign: 'center',
  background: `linear-gradient(180deg, rgba(31, 30, 27, 0.98) 0%, ${CARD} 100%)`,
  border: `0.5px solid ${BORDER}`,
  marginBottom: 22,
  boxShadow: shadow.cardRaised,
};

const groupText = {
  fontSize: 14,
  fontWeight: 600,
  color: GOLD,
  marginBottom: 10,
  letterSpacing: '0.1em',
};

const digitsText = {
  fontSize: 38,
  fontWeight: 700,
  color: MAIN,
  letterSpacing: '0.18em',
  margin: 0,
  fontVariantNumeric: 'tabular-nums',
};

const drawBadge = {
  display: 'inline-block',
  marginTop: 18,
  padding: '9px 16px',
  fontSize: 11,
  fontWeight: 500,
  color: SUB,
  background: SURFACE,
  borderRadius: radius.card,
  border: `0.5px solid ${BORDER}`,
  letterSpacing: '0.055em',
  boxShadow: shadow.cardInner,
};

const blockCard = {
  background: `linear-gradient(180deg, rgba(28, 27, 24, 0.92) 0%, ${CARD} 100%)`,
  borderRadius: radius.card,
  padding: '24px 20px 26px',
  border: `0.5px solid ${BORDER}`,
  marginBottom: 22,
  boxShadow: shadow.cardRest,
};

const sectionTitleGold = {
  fontSize: 13,
  fontWeight: 600,
  color: GOLD,
  margin: '0 0 14px',
  letterSpacing: '0.065em',
  textAlign: 'center',
};

const fortuneLine = {
  fontSize: 15,
  color: SUB,
  lineHeight: 1.74,
  margin: '0 0 14px',
  letterSpacing: '0.018em',
  fontWeight: 400,
};

const twinGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 22,
};

const twinCard = {
  background: `linear-gradient(180deg, rgba(26, 25, 22, 0.95) 0%, ${CARD} 100%)`,
  borderRadius: radius.card,
  padding: '20px 16px',
  border: `0.5px solid ${BORDER}`,
  minHeight: 88,
  boxSizing: 'border-box',
  boxShadow: shadow.cardInner,
};

const twinLabel = {
  fontSize: 11,
  fontWeight: 600,
  color: HINT,
  margin: '0 0 10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const twinValue = {
  fontSize: 16,
  fontWeight: 600,
  color: MAIN,
  margin: 0,
  lineHeight: 1.45,
};

const yongshinLine = {
  fontSize: 14,
  color: SUB,
  margin: '0 0 22px',
  lineHeight: 1.65,
  padding: '0 4px',
};

const yongshinStrong = {
  color: GOLD,
  fontWeight: 700,
};

const detailOuter = {
  marginTop: 0,
  marginBottom: 28,
  borderRadius: radius.card,
  border: `1px dashed rgba(255, 245, 230, 0.11)`,
  background: `linear-gradient(180deg, ${SURFACE} 0%, rgba(21, 20, 18, 0.98) 100%)`,
  overflow: 'hidden',
  position: 'relative',
  boxShadow: `${shadow.cardInner}, inset 0 6px 32px rgba(0, 0, 0, 0.06)`,
};

const unlockBtn = {
  width: '100%',
  minHeight: 48,
  padding: '15px 16px',
  fontSize: 14,
  fontWeight: 600,
  color: BTN_TEXT,
  background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_MUTED} 118%)`,
  border: 'none',
  borderRadius: radius.card,
  cursor: 'pointer',
  letterSpacing: '-0.008em',
  boxShadow: shadow.primaryBtn,
  transition: `transform 0.2s ${ease.soft}, opacity 0.2s ${ease.soft}`,
};

/** 세컨더리: 메인 CTA(다른 번호)보다 가벼운 골드 톤 */
const shareBtn = {
  width: '100%',
  minHeight: 46,
  padding: '14px 16px',
  fontSize: 14,
  fontWeight: 500,
  color: GOLD,
  background: color.goldTint08,
  border: `0.5px solid ${color.goldTint22}`,
  borderRadius: radius.card,
  cursor: 'pointer',
  marginTop: 10,
  letterSpacing: '0.02em',
  transition: `border-color 0.22s ${ease.soft}, background 0.22s ${ease.soft}`,
};

const redrawBtn = {
  width: '100%',
  minHeight: 50,
  padding: '16px 16px',
  fontSize: 15,
  fontWeight: 600,
  color: BTN_TEXT,
  background: `linear-gradient(180deg, ${GOLD} 0%, ${GOLD_MUTED} 118%)`,
  border: 'none',
  borderRadius: radius.card,
  cursor: 'pointer',
  marginTop: 0,
  letterSpacing: '-0.008em',
  boxShadow: shadow.primaryBtn,
  transition: `transform 0.2s ${ease.soft}`,
};

const footnote = {
  fontSize: 13,
  color: HINT,
  textAlign: 'center',
  margin: '32px 0 0',
  lineHeight: 1.62,
  letterSpacing: '0.025em',
  fontWeight: 400,
};

const textLinkBtn = {
  display: 'block',
  width: '100%',
  marginTop: 20,
  minHeight: 44,
  padding: '10px 0',
  border: 'none',
  background: 'none',
  fontSize: 13,
  fontWeight: 500,
  color: SUB,
  cursor: 'pointer',
  textDecoration: 'underline',
  textDecorationColor: `${color.goldTint42}`,
  textUnderlineOffset: 5,
};

const againOverlayRoot = adOverlay.root;
/** 스크롤·transform 조상과 무관하게 뷰포트에 붙이기 */
const againOverlayRootPortal = { ...adOverlay.root, zIndex: 10_000 };
const againOverlayCard = { ...adOverlay.card(320), padding: '26px 22px 28px' };
const AD_MODAL_HEADLINE = '결과를 열기 위한 마지막 단계예요';
const againOverlayTitle = {
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: MAIN,
  lineHeight: 1.45,
  letterSpacing: '-0.018em',
};

const againOverlaySub = {
  marginTop: 8,
  fontSize: 13,
  color: SUB,
  lineHeight: 1.48,
  fontWeight: 400,
};

const againOverlayTrack = adOverlay.track;

const inlineAdWrap = {
  marginBottom: 22,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

function DetailBody({ detail }) {
  const row = { marginBottom: 18 };
  const label = { fontSize: 11, fontWeight: 700, color: HINT, marginBottom: 8, letterSpacing: '0.06em' };
  const text = { fontSize: 15, color: SUB, lineHeight: 1.65, margin: 0 };
  const tagWrap = { display: 'flex', gap: 8, flexWrap: 'wrap' };
  const tag = {
    padding: '8px 14px',
    borderRadius: radius.sm,
    background: SURFACE,
    border: `0.5px solid ${color.goldTint22}`,
    color: GOLD,
    fontSize: 13,
    fontWeight: 600,
  };

  return (
    <div style={{ padding: '22px 18px 24px' }}>
      <div style={row}>
        <div style={label}>재물운</div>
        <p style={{ ...text, fontWeight: 800, color: GOLD, marginBottom: 8, fontSize: 16 }}>
          {detail.wealthLevel}
        </p>
        <p style={text}>{detail.wealthLine}</p>
      </div>
      <div style={row}>
        <div style={label}>오늘의 행운 키워드</div>
        <div style={tagWrap}>
          {detail.keywords.map((k) => (
            <span key={k} style={tag}>
              {k}
            </span>
          ))}
        </div>
      </div>
      <div style={row}>
        <div style={label}>조심할 것</div>
        <p style={text}>{detail.caution}</p>
      </div>
      <div style={{ marginBottom: 0 }}>
        <div style={label}>이번 주 총운</div>
        {detail.weeklyLines.map((line, i) => (
          <p key={i} style={{ ...text, marginBottom: i === detail.weeklyLines.length - 1 ? 0 : 12 }}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ResultScreen({ data, onShowNextCandidate, onGoToInput }) {
  const {
    today,
    group,
    sixDigit,
    analysisReason,
    basicLines,
    detail,
    yearStem,
    yearBranch,
    elementBadgeText,
    yongshin,
    source,
    candidateIndex = 0,
    candidateCount = 1,
  } = data;

  const [detailUnlocked, setDetailUnlocked] = useState(false);
  const [adBusy, setAdBusy] = useState(null);
  const [bannerAvailable, setBannerAvailable] = useState(false);
  const [bannerRendered, setBannerRendered] = useState(false);
  const [adProgress, setAdProgress] = useState(10);
  const scrollRootRef = useRef(null);
  const bannerListRef = useRef(null);
  const bannerRetryIntervalRef = useRef(null);
  const bannerRenderedRef = useRef(false);

  useEffect(() => {
    setDetailUnlocked(false);
    setAdBusy(null);
  }, [today, sixDigit, source, candidateIndex]);

  useEffect(() => {
    if (adBusy === null) {
      setAdProgress(10);
      return undefined;
    }
    const timer = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 95) return 95;
        return Math.min(95, prev + 6);
      });
    }, 260);
    return () => clearInterval(timer);
  }, [adBusy]);

  useEffect(() => {
    setBannerRendered(false);
    bannerRenderedRef.current = false;
    let attachSupported = false;
    try {
      attachSupported =
        typeof TossAds?.attachBanner?.isSupported === 'function' && TossAds.attachBanner.isSupported();
    } catch (err) {
      console.info('[Ad] attachBanner 지원 여부 확인 실패:', err);
      setBannerAvailable(false);
      return undefined;
    }
    if (!attachSupported) {
      setBannerAvailable(false);
      return undefined;
    }

    setBannerAvailable(true);

    try {
      const canInit =
        typeof TossAds?.initialize?.isSupported === 'function' && TossAds.initialize.isSupported();
      if (canInit) TossAds.initialize({});
    } catch (err) {
      // 초기화 실패해도 앱 전체를 죽이지 않고 배너 attach 재시도로 복구를 시도한다.
      console.info('[Ad] initialize 실패:', err);
    }

    const cleaners = [];
    const retryTimers = [];
    let disposed = false;

    const markBannerRendered = () => {
      if (bannerRenderedRef.current) return;
      bannerRenderedRef.current = true;
      setBannerRendered(true);
    };

    const attachBannerWithRetry = ({ adGroupId, element, options, label }) => {
      const FAST_RETRY_MS = 900;
      const SLOW_RETRY_MS = 2500;
      const VERIFY_TIMEOUT_MS = 2200;

      const hasRenderedBanner = () => {
        if (!element) return false;
        return (
          Boolean(element.firstElementChild) ||
          element.childElementCount > 0 ||
          element.innerHTML.trim().length > 0 ||
          element.clientHeight > 20
        );
      };

      const run = (attempt) => {
        if (disposed || !element) return;

        try {
          const result = TossAds.attachBanner(adGroupId, element, options);
          if (result?.destroy) {
            const safeDestroy = () => {
              try {
                result.destroy();
              } catch {
                // noop
              }
            };
            cleaners.push(safeDestroy);

            if (hasRenderedBanner()) {
              markBannerRendered();
              return;
            }

            const observer = new MutationObserver(() => {
              if (!disposed && hasRenderedBanner()) {
                markBannerRendered();
                observer.disconnect();
              }
            });
            observer.observe(element, { childList: true, subtree: true });
            cleaners.push(() => observer.disconnect());

            const verifyTimer = setTimeout(() => {
              observer.disconnect();
              if (disposed) return;
              if (hasRenderedBanner()) {
                markBannerRendered();
                return;
              }

              safeDestroy();
              // 결과 화면에 머무는 동안에는 배너가 붙을 때까지 계속 재시도한다.
              const nextDelay = attempt < 6 ? FAST_RETRY_MS : SLOW_RETRY_MS;
              const timer = setTimeout(() => run(attempt + 1), nextDelay);
              retryTimers.push(timer);
            }, VERIFY_TIMEOUT_MS);
            retryTimers.push(verifyTimer);
            return;
          }
        } catch (err) {
          console.info(`[Ad] ${label} attach 실패(${attempt}):`, err);
        }

        const nextDelay = attempt < 6 ? FAST_RETRY_MS : SLOW_RETRY_MS;
        const timer = setTimeout(() => run(attempt + 1), nextDelay);
        retryTimers.push(timer);
      };

      run(1);
    };

    attachBannerWithRetry({
      adGroupId: AD_GROUP_IDS.bannerList,
      element: bannerListRef.current,
      options: {
        variant: 'card',
        tone: 'grey',
        theme: 'dark',
      },
      label: '배너1',
    });

    // 초기 attach 실패/no-fill 시에도 결과 화면에 있는 동안 주기적으로 재시도
    bannerRetryIntervalRef.current = setInterval(() => {
      if (disposed || bannerRenderedRef.current) return;
      attachBannerWithRetry({
        adGroupId: AD_GROUP_IDS.bannerList,
        element: bannerListRef.current,
        options: {
          variant: 'card',
          tone: 'grey',
          theme: 'dark',
        },
        label: '배너1-주기재시도',
      });
    }, 5000);

    return () => {
      disposed = true;
      if (bannerRetryIntervalRef.current) {
        clearInterval(bannerRetryIntervalRef.current);
        bannerRetryIntervalRef.current = null;
      }
      for (const timer of retryTimers) clearTimeout(timer);
      for (const destroy of cleaners) destroy();
    };
  }, [today]);

  const scrollResultToTop = useCallback(() => {
    const el = scrollRootRef.current;
    if (el && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  useLayoutEffect(() => {
    if (adBusy === null) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [adBusy]);

  const startDetailUnlock = useCallback(() => {
    if (detailUnlocked || adBusy !== null) return;

    scrollResultToTop();
    setAdBusy({ kind: 'detail' });
    void (async () => {
      const result = await playFullScreenAd({ adGroupId: AD_GROUP_IDS.rewarded });
      if (result.status !== 'shown') {
        console.info('[Ad] 상세 운세 광고 실패:', result.reason);
        window.alert('광고를 확인한 뒤 상세 운세를 열 수 있어요. 잠시 후 다시 시도해 주세요.');
        setAdBusy(null);
        return;
      }
      setDetailUnlocked(true);
      setAdBusy(null);
    })();
  }, [detailUnlocked, adBusy, scrollResultToTop]);

  const startNextNumberFlow = useCallback(() => {
    if (adBusy !== null) return;

    scrollResultToTop();
    setAdBusy({ kind: 'next' });
    void (async () => {
      const result = await playFullScreenAd({ adGroupId: AD_GROUP_IDS.rewarded });
      if (result.status !== 'shown') {
        console.info('[Ad] 다음 번호 광고 실패:', result.reason);
        setAdBusy(null);
        return;
      }
      if (typeof onShowNextCandidate === 'function') await onShowNextCandidate();
      const scrollContainer = document.querySelector('.app-result-scroll');
      if (scrollContainer && typeof scrollContainer.scrollTo === 'function') {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      setAdBusy(null);
    })();
  }, [adBusy, onShowNextCandidate, scrollResultToTop]);

  const handleShare = useCallback(async () => {
    const url =
      typeof window !== 'undefined' && window.location?.href
        ? window.location.href
        : 'https://toss.im';
    const text = `목요일의 행운 - 오늘 나의 연금복권 행운번호는 ${group}조 ${sixDigit}!`;
    await shareFortuneContent({
      title: '목요일의 행운',
      text: `${text}\n나도 뽑아보기`,
      url,
    });
  }, [group, sixDigit]);

  const lockedBlur = !detailUnlocked;
  const detailInnerStyle = {
    maxHeight: detailUnlocked ? 2000 : 160,
    overflow: 'hidden',
    transition:
      'max-height 0.72s cubic-bezier(0.33, 1, 0.68, 1), filter 0.52s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.48s cubic-bezier(0.4, 0, 0.2, 1), transform 0.52s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: lockedBlur ? 'blur(6px) saturate(0.92)' : 'blur(0)',
    opacity: lockedBlur ? 0.5 : 1,
    transform: lockedBlur ? 'scale(0.993)' : 'scale(1)',
    pointerEvents: lockedBlur ? 'none' : 'auto',
    userSelect: lockedBlur ? 'none' : 'auto',
  };

  const overlayStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: 18,
    background:
      'linear-gradient(180deg, rgba(18, 17, 15, 0.35) 0%, rgba(16, 15, 13, 0.82) 44%, rgba(14, 13, 12, 0.94) 100%)',
  };

  const detailUnlockLabel = adBusy?.kind === 'detail' ? '준비 중…' : '오늘의 재물운 상세 보기 🍀';
  /** 상세·다음 번호 공통 헤드라인만 사용, 부제는 다음 번호일 때만(중복 문구 방지) */
  const adModalSubline = adBusy?.kind === 'next' ? '새 번호를 준비 중이에요.' : null;

  const adBusyModal =
    adBusy !== null && typeof document !== 'undefined' ? (
      <div
        style={againOverlayRootPortal}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label={AD_MODAL_HEADLINE}
      >
        <div style={againOverlayCard}>
          <p style={againOverlayTitle}>{AD_MODAL_HEADLINE}</p>
          {adModalSubline ? <p style={againOverlaySub}>{adModalSubline}</p> : null}
          <div style={againOverlayTrack}>
            <div style={{ ...adOverlay.fill, width: `${adProgress}%` }} />
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div ref={scrollRootRef} style={shell} className="app-result-scroll">
      {adBusyModal ? createPortal(adBusyModal, document.body) : null}

      <p style={dateHeader}>{formatKoreanDateLabel(today)}</p>

      <h2 style={pageTitle}>오늘의 행운번호</h2>

      <div style={numberCard}>
        <div style={groupText}>{group}조</div>
        <p style={digitsText}>{sixDigit}</p>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 12,
            fontWeight: 500,
            color: SUB,
            lineHeight: 1.45,
          }}
        >
          연금복권 형식: 조(1~5) + 여섯 칸(각 0~9)
        </p>
        <div style={drawBadge}>매주 목요일 추첨</div>
      </div>

      {source === 'ai' && analysisReason ? (
        <div style={{ ...blockCard, marginBottom: 22 }}>
          <div style={sectionTitleGold}>번호가 나온 이유</div>
          <p style={{ ...fortuneLine, marginBottom: 0, whiteSpace: 'pre-line' }}>{analysisReason}</p>
        </div>
      ) : null}

      <div style={blockCard}>
        <div style={sectionTitleGold}>오늘의 운세</div>
        {basicLines.map((line, i) => (
          <p key={i} style={{ ...fortuneLine, marginBottom: i === basicLines.length - 1 ? 0 : 14 }}>
            {line}
          </p>
        ))}
      </div>

      {bannerAvailable ? (
        <div style={bannerRendered ? inlineAdWrap : { height: 0, overflow: 'hidden', margin: 0 }}>
          <div ref={bannerListRef} style={{ width: '100%' }} />
        </div>
      ) : null}

      <div style={twinGrid}>
        <div style={twinCard}>
          <p style={twinLabel}>오행</p>
          <p style={twinValue}>{elementBadgeText}</p>
        </div>
        <div style={twinCard}>
          <p style={twinLabel}>년주 · 천간지지</p>
          <p style={twinValue}>
            {yearStem}
            {yearBranch}
          </p>
        </div>
      </div>

      {yongshin ? (
        <p style={yongshinLine}>
          <span style={yongshinStrong}>용신</span> {yongshin} 기운이 도움이 될 수 있어요.
        </p>
      ) : null}

      <div style={sectionTitleGold}>상세 운세</div>
      <div style={detailOuter}>
        <div style={detailInnerStyle}>
          <DetailBody detail={detail} />
        </div>
        {lockedBlur && (
          <div style={overlayStyle}>
            <button
              type="button"
              style={unlockBtn}
              onClick={startDetailUnlock}
              disabled={adBusy !== null}
            >
              {detailUnlockLabel}
            </button>
          </div>
        )}
      </div>

      {candidateCount > 0 ? (
        <button
          type="button"
          style={redrawBtn}
          onClick={startNextNumberFlow}
          disabled={adBusy !== null}
        >
          다른 번호 보기
        </button>
      ) : null}

      <button type="button" style={shareBtn} onClick={() => void handleShare()}>
        번호 공유하기
      </button>

      {typeof onGoToInput === 'function' ? (
        <button type="button" style={textLinkBtn} onClick={onGoToInput}>
          생년월일 다시 입력
        </button>
      ) : null}

      <p style={footnote}>오늘 하루도 행운이 함께하길 바랍니다</p>
    </div>
  );
}
