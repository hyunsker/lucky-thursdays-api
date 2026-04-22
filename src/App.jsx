import { useCallback, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { runClaudeUserPrompt } from './services/claudeApi.js';
import { formatKoreanDateLabel, formatTodayKey } from './utils/sajuCalculator.js';
import { buildFortunePrompt, getHourLabel } from './utils/fortunePrompt.js';
import InputScreen from './components/InputScreen.jsx';
import ResultScreen from './components/ResultScreen.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import { mergeFortuneBundleView, normalizeFortuneBundle } from './utils/displayResult.js';
import { AD_GROUP_IDS } from './constants/adIds.js';
import { playFullScreenAd } from './services/adService.js';

/**
 * Claude 응답은 서버(/api/fortune) 경유 호출.
 * 키는 서버 환경변수(ANTHROPIC_API_KEY)로만 관리한다.
 */

function extractJsonText(text) {
  if (!text) throw new Error('EMPTY_RESPONSE');
  let t = text.trim();
  const fenceBlocks = [...t.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const m of fenceBlocks) {
    const inner = m[1].trim();
    const start = inner.indexOf('{');
    const end = inner.lastIndexOf('}');
    if (start !== -1 && end > start) return inner.slice(start, end + 1);
  }
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('NO_JSON');
  return t.slice(start, end + 1);
}

function userFacingFortuneError(e) {
  const msg = e instanceof Error ? e.message : String(e);
  const delayedMessage =
    '실제 데이터를 분석해 오늘의 행운번호를 생성하고 있어요\n분석이 조금 지연되고 있습니다. 잠시 후 다시 시도해 주세요.';
  if (/CONFIG_MISSING_API_URL/i.test(msg)) {
    return '서버 주소 설정이 비어 있어요. 빌드 환경에 VITE_FORTUNE_API_URL=https://<백엔드도메인>/api/fortune 를 추가한 뒤 다시 빌드해 주세요.';
  }
  const isBillingLike = /payment|billing|credit|insufficient|quota|balance/i.test(msg);
  if (/HTTP 401|invalid x-api-key|authentication/i.test(msg)) {
    return '서버 API 키가 올바르지 않거나 만료됐어요. 배포 환경변수 ANTHROPIC_API_KEY 를 다시 저장한 뒤 재배포해 주세요.';
  }
  if (/HTTP 402/i.test(msg) || (/HTTP 403/i.test(msg) && isBillingLike)) {
    return 'Anthropic 결제/권한을 확인해 주세요. 크레딧이 남아도 배포 서버 키가 다른 워크스페이스 키면 같은 오류가 납니다.';
  }
  if (/HTTP 403/i.test(msg)) {
    if (/rate_limit|overloaded|timeout/i.test(msg)) {
      return delayedMessage;
    }
    return '요청 권한이 거부됐어요. 토스 앱에서 호출하는 백엔드 URL과 배포 환경변수(ANTHROPIC_API_KEY)를 다시 확인해 주세요.';
  }
  if (
    /HTTP 429|rate limit|시간 초과|AbortError|408|not_found_error|model:|NO_JSON|JSON|Unexpected token|parse|fetch failed|getaddrinfo|ENOTFOUND|certificate|SSL|TLS|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EADDRINUSE|127\.0\.0\.1:8790|:8790|HTTP 5\d\d|502|500|Failed to fetch|NetworkError|fetch/i.test(
      msg,
    )
  ) {
    return delayedMessage;
  }
  return delayedMessage;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const initialBirth = () => {
  const d = new Date();
  return { year: d.getFullYear() - 25, month: 1, day: 1 };
};

export default function App() {
  const [step, setStep] = useState('input');
  const [birth, setBirth] = useState(initialBirth);
  const [hour, setHour] = useState('unknown');
  const [fortuneBundle, setFortuneBundle] = useState(null);
  const [loadingDone, setLoadingDone] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);

  const validatedBirth = useMemo(() => {
    const { year, month, day } = birth;
    const last = new Date(year, month, 0).getDate();
    const safeDay = Math.min(day, last);
    return { year, month, day: safeDay };
  }, [birth]);

  const displayData = useMemo(() => {
    if (!fortuneBundle) return null;
    try {
      return mergeFortuneBundleView(fortuneBundle);
    } catch {
      return null;
    }
  }, [fortuneBundle]);

  const fetchFortuneBatch = useCallback(
    async (batchIndex) => {
      const { year, month, day } = validatedBirth;
      const todayIso = formatTodayKey();
      const batchKey = `BATCH-${batchIndex}`;
      const seedKey = `${todayIso}|${year}|${month}|${day}|${hour}|${batchKey}`;
      const todayKorean = formatKoreanDateLabel(todayIso);
      const hourLabel = getHourLabel(hour);
      const promptText = buildFortunePrompt({
        year,
        month,
        day,
        hourLabel,
        todayIso,
        todayKorean,
        batchKey,
      });

      const { resultText } = await runClaudeUserPrompt(promptText);

      let parsed;
      try {
        parsed = JSON.parse(resultText.trim());
      } catch (parseErr) {
        try {
          parsed = JSON.parse(extractJsonText(resultText));
        } catch {
          parseErr.resultPreview = resultText.slice(0, 800);
          throw parseErr;
        }
      }
      if (!parsed || typeof parsed !== 'object') throw new Error('INVALID_JSON');
      parsed.todayIso = parsed.todayIso || todayIso;

      const bundle = normalizeFortuneBundle(parsed, todayIso, seedKey);
      if (bundle.shared.source !== 'ai') throw new Error('NON_AI_RESULT_BLOCKED');
      return bundle;
    },
    [validatedBirth, hour],
  );

  const runFortuneFetchOnce = useCallback(async () => {
    flushSync(() => {
      setFortuneBundle(null);
      setLoadingDone(false);
      setStep('loading');
    });

    try {
      const bundle = await fetchFortuneBatch(1);
      setFortuneBundle(bundle);
      setLoadingDone(true);
      await sleep(360);
      setStep('result');
    } catch (e) {
      console.warn('[Fortune] AI 요청 실패:', e);
      setFortuneBundle(null);
      setLoadingDone(true);
      await sleep(260);
      window.alert(userFacingFortuneError(e));
      setStep('input');
    }
  }, [fetchFortuneBatch]);

  const handleSubmit = () => {
    if (submitBusy) return;
    setSubmitBusy(true);
    void (async () => {
      try {
        const adResult = await playFullScreenAd({ adGroupId: AD_GROUP_IDS.interstitial });
        if (adResult.status !== 'shown') {
          window.alert('광고를 확인한 뒤 행운번호 분석을 시작할 수 있어요. 잠시 후 다시 시도해 주세요.');
          return;
        }
        await runFortuneFetchOnce();
      } finally {
        setSubmitBusy(false);
      }
    })();
  };

  const handleShowNextCandidate = useCallback(async () => {
    let moved = false;
    setFortuneBundle((prev) => {
      if (!prev?.candidates?.length) return prev;
      const next = Math.min(prev.activeIndex + 1, prev.candidates.length - 1);
      if (next === prev.activeIndex) return prev;
      moved = true;
      return { ...prev, activeIndex: next };
    });
    if (moved) return;
    window.alert('준비된 5개 번호를 모두 확인했어요. 다시 분석하려면 생년월일을 다시 입력해 주세요.');
  }, []);

  const handleGoToInput = () => {
    setStep('input');
    setFortuneBundle(null);
    setLoadingDone(false);
  };

  const screen =
    step === 'loading' ? (
      <LoadingScreen done={loadingDone} />
    ) : step === 'result' && displayData ? (
      <ResultScreen
        data={displayData}
        onShowNextCandidate={handleShowNextCandidate}
        onGoToInput={handleGoToInput}
      />
    ) : (
      <InputScreen
        birth={birth}
        displayBirth={validatedBirth}
        hour={hour}
        onBirthChange={setBirth}
        onHourChange={setHour}
        onSubmit={handleSubmit}
        submitBusy={submitBusy}
        submitLabel={submitBusy ? '광고 확인 중...' : '행운번호 뽑기'}
      />
    );

  return (
    <div className="app-shell">
      <div key={step} className="app-step">
        {screen}
      </div>
    </div>
  );
}
