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
  const retryMessage = '현재 요청이 많아 다시 시도해 주세요.';
  if (/CONFIG_MISSING_API_URL/i.test(msg)) {
    return retryMessage;
  }
  const isBillingLike = /payment|billing|credit|insufficient|quota|balance/i.test(msg);
  if (/HTTP 401|invalid x-api-key|authentication/i.test(msg)) {
    return retryMessage;
  }
  if (/HTTP 402/i.test(msg) || (/HTTP 403/i.test(msg) && isBillingLike)) {
    return retryMessage;
  }
  if (/HTTP 403/i.test(msg)) {
    return retryMessage;
  }
  if (
    /HTTP 429|rate limit|시간 초과|AbortError|408|not_found_error|model:|NO_JSON|JSON|Unexpected token|parse|fetch failed|getaddrinfo|ENOTFOUND|certificate|SSL|TLS|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EADDRINUSE|127\.0\.0\.1:8790|:8790|HTTP 5\d\d|502|500|Failed to fetch|NetworkError|fetch/i.test(
      msg,
    )
  ) {
    return retryMessage;
  }
  return retryMessage;
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
  const [loadingStartPct, setLoadingStartPct] = useState(68);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');

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

  const buildLocalSimilarCandidates = useCallback((bundle) => {
    const existing = bundle?.candidates ?? [];
    if (!existing.length) return [];
    const seen = new Set(existing.map((c) => `${c.group}-${c.sixDigit}`));
    const out = [];

    for (const base of existing) {
      const d = String(base.sixDigit ?? '').padStart(6, '0').slice(0, 6);
      const rotated = `${d.slice(1)}${d[0]}`;
      const swapped = `${d[1]}${d[0]}${d.slice(2)}`;
      const variants = [rotated, swapped];
      for (const sixDigit of variants) {
        const key = `${base.group}-${sixDigit}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          rank: existing.length + out.length + 1,
          group: base.group,
          sixDigit,
          analysisReason: '같은 사주 흐름에서 숫자 배열만 조정한 유사 조합이에요.',
        });
        if (out.length >= 5) return out;
      }
    }
    return out;
  }, []);

  const handleSubmit = () => {
    if (submitBusy) return;
    setSubmitError('');
    setSubmitBusy(true);
    void (async () => {
      const bundlePromise = fetchFortuneBatch(1)
        .then((bundle) => ({ ok: true, bundle }))
        .catch((error) => ({ ok: false, error }));
      try {
        const adResult = await playFullScreenAd({ adGroupId: AD_GROUP_IDS.interstitial });
        if (adResult.status !== 'shown') {
          setSubmitError('현재 요청이 많아 다시 시도해 주세요.');
          return;
        }

        flushSync(() => {
          setFortuneBundle(null);
          setLoadingDone(false);
          setLoadingStartPct(68);
          setStep('loading');
        });

        const bundled = await bundlePromise;
        if (!bundled.ok) throw bundled.error;
        const bundle = bundled.bundle;
        setFortuneBundle(bundle);
        setLoadingDone(true);
        await sleep(220);
        setStep('result');
      } catch (e) {
        console.warn('[Fortune] AI 요청 실패:', e);
        setFortuneBundle(null);
        setLoadingDone(false);
        setStep('input');
        setSubmitError(userFacingFortuneError(e));
      } finally {
        setSubmitBusy(false);
      }
    })();
  };

  const handleShowNextCandidate = useCallback(async () => {
    let moved = false;
    let expanded = false;
    setFortuneBundle((prev) => {
      if (!prev?.candidates?.length) return prev;
      const next = Math.min(prev.activeIndex + 1, prev.candidates.length - 1);
      if (next === prev.activeIndex) return prev;
      moved = true;
      return { ...prev, activeIndex: next };
    });
    if (moved) return;
    setFortuneBundle((prev) => {
      if (!prev?.candidates?.length) return prev;
      const extras = buildLocalSimilarCandidates(prev);
      if (!extras.length) return prev;
      expanded = true;
      const merged = [...prev.candidates, ...extras.map((c, idx) => ({ ...c, rank: prev.candidates.length + idx + 1 }))];
      return { ...prev, candidates: merged, activeIndex: prev.activeIndex + 1 };
    });
    if (!expanded) {
      window.alert('현재 요청이 많아 다시 시도해 주세요.');
    }
  }, [buildLocalSimilarCandidates]);

  const handleGoToInput = () => {
    setStep('input');
    setFortuneBundle(null);
    setLoadingDone(false);
  };

  const screen =
    step === 'loading' ? (
      <LoadingScreen done={loadingDone} initialPct={loadingStartPct} />
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
        onRetry={handleSubmit}
        submitBusy={submitBusy}
        submitLabel={submitBusy ? '광고 시청 후 결과를 보여드릴게요!' : '행운번호 뽑기'}
        submitError={submitError}
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
