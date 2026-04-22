const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const FALLBACK_MODELS = [
  'claude-haiku-4-5-20251001',
  'claude-3-5-haiku-latest',
  'claude-sonnet-4-6',
  'claude-3-5-sonnet-latest',
];

function corsHeaders(origin) {
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  let hostname = '';
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return {};
  }
  const isPrivateLan =
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname);
  const allowed =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    isPrivateLan ||
    hostname.endsWith('.apps.tossmini.com') ||
    hostname.endsWith('.private-apps.tossmini.com') ||
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.workers.dev');
  if (!allowed) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function extractText(data) {
  const blocks = data?.content;
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b?.type === 'text' && typeof b?.text === 'string')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

async function runAnthropic({ apiKey, userPrompt, model }) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: model || DEFAULT_MODEL,
      max_tokens: 8192,
      system:
        '사용자 메시지가 JSON을 요구하면, 마크다운·코드펜스(```)·앞뒤 설명 없이 JSON 객체 텍스트만 출력한다. 다른 서술은 쓰지 않는다.',
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      `HTTP ${response.status} ${response.statusText}\n${JSON.stringify(data?.error ?? data, null, 2)}`,
    );
    err.httpStatus = response.status;
    err.data = data;
    throw err;
  }
  const resultText = extractText(data);
  if (!resultText) {
    const err = new Error('Claude 응답에 텍스트 블록이 없습니다.');
    err.httpStatus = 502;
    err.data = data;
    throw err;
  }
  return { resultText, model: model || DEFAULT_MODEL };
}

function normalizeModelList(model) {
  const first = String(model || DEFAULT_MODEL).trim();
  const list = [first, ...FALLBACK_MODELS].filter(Boolean);
  return [...new Set(list)];
}

async function runAnthropicWithFallback({ apiKey, userPrompt, model }) {
  const models = normalizeModelList(model);
  let lastError = null;

  for (let i = 0; i < models.length; i += 1) {
    const m = models[i];
    try {
      return await runAnthropic({ apiKey, userPrompt, model: m });
    } catch (e) {
      lastError = e;
      const status = Number.isInteger(e?.httpStatus) ? e.httpStatus : 0;
      const type = String(e?.data?.error?.type || '').toLowerCase();
      const msg = String(e?.data?.error?.message || '').toLowerCase();
      const isForbidden =
        status === 403 &&
        (type === 'forbidden' ||
          msg.includes('not allowed') ||
          msg.includes('model') ||
          msg.includes('permission') ||
          msg.includes('access'));

      // 모델 권한 이슈로 보이면 다음 모델로 재시도
      if (isForbidden && i < models.length - 1) continue;
      throw e;
    }
  }

  throw lastError ?? new Error('Anthropic 요청 실패');
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    const cors = corsHeaders(origin);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST') return new Response(null, { status: 405, headers: cors });

    const url = new URL(req.url);
    if (url.pathname !== '/api/fortune') return new Response(null, { status: 404, headers: cors });

    try {
      const json = await req.json().catch(() => ({}));
      const userPrompt = json?.userPrompt;
      if (!userPrompt || typeof userPrompt !== 'string') {
        return Response.json({ error: 'userPrompt 가 필요합니다.' }, { status: 400, headers: cors });
      }

      const apiKey = String(env.ANTHROPIC_API_KEY || '').trim();
      if (!apiKey) {
        return Response.json(
          { error: '서버에 ANTHROPIC_API_KEY 가 설정되지 않았습니다.' },
          { status: 500, headers: cors },
        );
      }

      const { resultText, model } = await runAnthropicWithFallback({
        apiKey,
        userPrompt,
        model: String(env.ANTHROPIC_MODEL || '').trim(),
      });
      return Response.json({ resultText, model }, { status: 200, headers: cors });
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      const upstreamStatus = Number.isInteger(e?.httpStatus) ? e.httpStatus : 502;
      return Response.json(
        {
          error,
          upstreamStatus,
          errorType: e?.data?.error?.type || undefined,
        },
        { status: upstreamStatus >= 400 && upstreamStatus <= 599 ? upstreamStatus : 502, headers: cors },
      );
    }
  },
};
