const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const FETCH_TIMEOUT_MS = 90_000;
/**
 * 출력 토큰 상한. 너무 낮으면 JSON 중간 잘림 → 파싱 오류.
 * 기본 2048은 5후보+짧은 문장 기준 안전선; 잘리면 ANTHROPIC_MAX_TOKENS=3072 등.
 */
/** 장문 pickReason(JSON 5건) 깨짐 방지 — 필요 시 ENV로 조정 */
const MAX_OUTPUT_TOKENS = Number.parseInt(String(process.env.ANTHROPIC_MAX_TOKENS ?? '').trim(), 10) || 3072;

/** 기본값 — 비용 최적화를 위해 Haiku 우선 */
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const MODEL_FALLBACK_CHAIN = [
  'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-latest',
  'claude-sonnet-4-6',
  'claude-3-5-sonnet-latest',
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

function extractTextFromResponse(data) {
  const blocks = data?.content;
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b?.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function isRateLimited(response) {
  return response.status === 429;
}

function parseRetryAfterMs(response) {
  const h = response.headers?.get?.('retry-after');
  if (!h) return 5000;
  const sec = Number.parseInt(h, 10);
  if (!Number.isNaN(sec)) return Math.min(sec * 1000, 120_000);
  return 5000;
}

function resolveModelChain(explicit) {
  const e = String(explicit ?? '').trim();
  const out = [];
  if (e) out.push(e);
  for (const m of MODEL_FALLBACK_CHAIN) {
    if (!out.includes(m)) out.push(m);
  }
  if (out.length === 0) return [...MODEL_FALLBACK_CHAIN];
  return out;
}

function shouldRetryWithNextModel(response, data) {
  if (response.status === 404) return true;
  const err = data?.error;
  if (err?.type === 'not_found_error') return true;
  const msg = JSON.stringify(err ?? data ?? '').toLowerCase();
  if (response.status === 400 && /model/i.test(msg)) return true;
  // 계정/워크스페이스별 모델 권한 차이로 403이 날 때 다음 모델로 우회
  if (response.status === 403 && /(model|not allowed|forbidden|permission|access)/i.test(msg)) return true;
  return false;
}

function isTransientServerError(status) {
  return status === 502 || status === 503 || status === 529;
}

/**
 * @param {{ apiKey: string; userPrompt: string; model?: string }} opts
 */
export async function runAnthropicUserPrompt(opts) {
  const { apiKey, userPrompt } = opts;
  const explicit = String(opts.model ?? process.env.ANTHROPIC_MODEL ?? '').trim();
  const chain = resolveModelChain(explicit || DEFAULT_MODEL);

  let lastThrown;
  for (let mi = 0; mi < chain.length; mi += 1) {
    const model = chain[mi];
    const body = {
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system:
        '요청이 JSON이면 마크다운·코드펜스·앞뒤 말 없이 JSON 객체만 출력.',
      messages: [{ role: 'user', content: userPrompt }],
    };

    const init = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    };

    const runOnce = async () => {
      let response = await fetchWithTimeout(ANTHROPIC_MESSAGES_URL, init);
      let data = await response.json().catch(() => ({}));

      if (isRateLimited(response)) {
        const waitMs = parseRetryAfterMs(response);
        await sleep(waitMs);
        response = await fetchWithTimeout(ANTHROPIC_MESSAGES_URL, init);
        data = await response.json().catch(() => ({}));
      }

      if (isTransientServerError(response.status)) {
        await sleep(2500);
        response = await fetchWithTimeout(ANTHROPIC_MESSAGES_URL, init);
        data = await response.json().catch(() => ({}));
      }

      return { response, data };
    };

    try {
      let { response, data } = await runOnce();

      if (response.ok) {
        const resultText = extractTextFromResponse(data);
        if (resultText) return { resultText, model };
        const err = new Error('Claude 응답에 텍스트 블록이 없습니다.');
        err.data = data;
        throw err;
      }

      if (shouldRetryWithNextModel(response, data) && mi < chain.length - 1) {
        console.warn(`[anthropic] model ${model} 실패 — 폴백 시도: ${chain[mi + 1]}`);
        const modelErr = new Error(
          `HTTP ${response.status}\n${JSON.stringify(data?.error ?? data, null, 2)}`,
        );
        modelErr.httpStatus = response.status;
        modelErr.data = data;
        lastThrown = modelErr;
        continue;
      }

      if (isRateLimited(response)) {
        const err429 = new Error(`HTTP 429 Too Many Requests\n${JSON.stringify(data?.error ?? data, null, 2)}`);
        err429.httpStatus = 429;
        err429.data = data;
        throw err429;
      }

      const apiErr = new Error(
        `HTTP ${response.status} ${response.statusText}\n${JSON.stringify(data?.error ?? data, null, 2)}`,
      );
      apiErr.httpStatus = response.status;
      apiErr.data = data;
      throw apiErr;
    } catch (e) {
      if (e?.name === 'AbortError') throw e;
      lastThrown = e;
      throw e;
    }
  }

  throw lastThrown ?? new Error('Claude 요청 실패');
}
