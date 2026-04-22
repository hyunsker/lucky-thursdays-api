import { TossAds } from '@apps-in-toss/web-framework';
import { useCallback, useEffect, useRef, useState } from 'react';
import { tossPadding, tossViewportShell } from '../constants/tossLayout.js';
import { AD_GROUP_IDS } from '../constants/adIds.js';
import { playFullScreenAd } from '../services/adService.js';
import { formatKoreanDateLabel } from '../utils/sajuCalculator.js';
import { shareFortuneContent } from '../utils/shareFortune.js';

const BG = '#0f0f0f';
const CARD = '#1a1a1a';
const BORDER = '#2a2a2a';
const MAIN = '#f0ead6';
const SUB = '#888888';
const HINT = '#555555';
const GOLD = '#c9a84c';
const BTN_TEXT = '#0f0f0f';
const shell = {
  minHeight: '100%',
  background: BG,
  ...tossViewportShell,
  ...tossPadding.result,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Segoe UI", Roboto, sans-serif',
};

const dateHeader = {
  fontSize: 13,
  fontWeight: 500,
  color: SUB,
  textAlign: 'center',
  margin: '0 0 20px',
  letterSpacing: '0.02em',
};

const pageTitle = {
  fontSize: 22,
  fontWeight: 800,
  color: MAIN,
  margin: '0 0 22px',
  textAlign: 'center',
  letterSpacing: '-0.02em',
};

const numberCard = {
  borderRadius: 16,
  padding: '28px 20px 24px',
  textAlign: 'center',
  background: CARD,
  border: `0.5px solid ${BORDER}`,
  marginBottom: 22,
};

const groupText = {
  fontSize: 14,
  fontWeight: 600,
  color: GOLD,
  marginBottom: 10,
  letterSpacing: '0.08em',
};

const digitsText = {
  fontSize: 38,
  fontWeight: 800,
  color: MAIN,
  letterSpacing: '0.2em',
  margin: 0,
  fontVariantNumeric: 'tabular-nums',
};

const drawBadge = {
  display: 'inline-block',
  marginTop: 18,
  padding: '8px 14px',
  fontSize: 11,
  fontWeight: 600,
  color: SUB,
  background: '#141414',
  borderRadius: 16,
  border: `0.5px solid ${BORDER}`,
  letterSpacing: '0.04em',
};

const blockCard = {
  background: CARD,
  borderRadius: 16,
  padding: '22px 20px 24px',
  border: `0.5px solid ${BORDER}`,
  marginBottom: 22,
};


const sectionTitleGold = {
  fontSize: 13,
  fontWeight: 700,
  color: GOLD,
  margin: '0 0 14px',
  letterSpacing: '0.06em',
  textAlign: 'center',
};

const fortuneLine = {
  fontSize: 15,
  color: SUB,
  lineHeight: 1.7,
  margin: '0 0 14px',
};

const twinGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  marginBottom: 22,
};

const twinCard = {
  background: CARD,
  borderRadius: 16,
  padding: '18px 14px',
  border: `0.5px solid ${BORDER}`,
  minHeight: 88,
  boxSizing: 'border-box',
};

const twinLabel = {
  fontSize: 11,
  fontWeight: 700,
  color: HINT,
  margin: '0 0 10px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const twinValue = {
  fontSize: 16,
  fontWeight: 700,
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
  borderRadius: 16,
  border: `1px dashed ${BORDER}`,
  background: '#141414',
  overflow: 'hidden',
  position: 'relative',
};

const unlockBtn = {
  width: '100%',
  minHeight: 48,
  padding: '15px 16px',
  fontSize: 14,
  fontWeight: 700,
  color: BTN_TEXT,
  background: GOLD,
  border: 'none',
  borderRadius: 16,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
};

const shareBtn = {
  width: '100%',
  minHeight: 48,
  padding: '16px 16px',
  fontSize: 15,
  fontWeight: 700,
  color: GOLD,
  background: CARD,
  border: `0.5px solid ${GOLD}`,
  borderRadius: 16,
  cursor: 'pointer',
  marginTop: 8,
};

const redrawBtn = {
  width: '100%',
  minHeight: 48,
  padding: '16px 16px',
  fontSize: 15,
  fontWeight: 700,
  color: BTN_TEXT,
  background: GOLD,
  border: 'none',
  borderRadius: 16,
  cursor: 'pointer',
  marginTop: 14,
};

const footnote = {
  fontSize: 13,
  color: HINT,
  textAlign: 'center',
  margin: '32px 0 0',
  lineHeight: 1.6,
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
  fontWeight: 600,
  color: HINT,
  cursor: 'pointer',
  textDecoration: 'underline',
  textUnderlineOffset: 4,
};

const againOverlayRoot = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  background: 'rgba(15, 15, 15, 0.94)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 32,
  boxSizing: 'border-box',
};

const againOverlayCard = {
  background: CARD,
  borderRadius: 16,
  padding: '36px 28px',
  maxWidth: 320,
  width: '100%',
  textAlign: 'center',
  border: `0.5px solid ${BORDER}`,
};

const againOverlayTitle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: MAIN,
  lineHeight: 1.55,
};

const againOverlayCount = {
  marginTop: 24,
  fontSize: 48,
  fontWeight: 800,
  color: GOLD,
  fontVariantNumeric: 'tabular-nums',
};

const againOverlaySub = {
  marginTop: 14,
  fontSize: 14,
  color: SUB,
};

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
    borderRadius: 16,
    background: '#141414',
    border: `0.5px solid ${GOLD}`,
    color: GOLD,
    fontSize: 13,
    fontWeight: 700,
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
  const bannerListRef = useRef(null);
  const bannerRetryIntervalRef = useRef(null);
  const bannerRenderedRef = useRef(false);

  useEffect(() => {
    setDetailUnlocked(false);
    setAdBusy(null);
  }, [today, sixDigit, source, candidateIndex]);

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

  const startDetailUnlock = useCallback(() => {
    if (detailUnlocked || adBusy !== null) return;

    setAdBusy({ kind: 'detail', label: '광고를 불러오는 중입니다…' });
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
  }, [detailUnlocked, adBusy]);

  const startNextNumberFlow = useCallback(() => {
    if (adBusy !== null) return;

    setAdBusy({ kind: 'next', label: '광고 시청 후 다음 번호를 보여드릴게요' });
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
  }, [adBusy, onShowNextCandidate]);

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
      'max-height 0.7s cubic-bezier(0.4, 0, 0.2, 1), filter 0.55s ease, opacity 0.5s ease, transform 0.55s ease',
    filter: lockedBlur ? 'blur(8px)' : 'blur(0)',
    opacity: lockedBlur ? 0.45 : 1,
    transform: lockedBlur ? 'scale(0.99)' : 'scale(1)',
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
    background: 'linear-gradient(180deg, rgba(15,15,15,0.5) 0%, rgba(15,15,15,0.88) 40%, rgba(15,15,15,0.95) 100%)',
  };

  const detailUnlockLabel = adBusy?.kind === 'detail' ? '광고 준비 중입니다!' : '광고 보고 상세 운세 확인';

  return (
    <div style={shell} className="app-result-scroll">
      {adBusy?.kind === 'next' && (
        <div style={againOverlayRoot} role="dialog" aria-live="polite" aria-label="광고 시청 안내">
          <div style={againOverlayCard}>
            <p style={againOverlayTitle}>광고 시청 후 다음 추천 번호를 볼 수 있어요</p>
            <div style={againOverlayCount}>...</div>
            <p style={againOverlaySub}>{adBusy.label}</p>
          </div>
        </div>
      )}

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
          <p style={{ ...fortuneLine, marginBottom: 0 }}>{analysisReason}</p>
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

      <button type="button" style={shareBtn} onClick={() => void handleShare()}>
        번호 공유하기
      </button>

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

      {typeof onGoToInput === 'function' ? (
        <button type="button" style={textLinkBtn} onClick={onGoToInput}>
          생년월일 다시 입력
        </button>
      ) : null}

      <p style={footnote}>오늘 하루도 행운이 함께하길 바랍니다</p>
    </div>
  );
}
