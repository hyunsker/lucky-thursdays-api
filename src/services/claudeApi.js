const FETCH_TIMEOUT_MS = Number.parseInt(String(import.meta.env.VITE_API_TIMEOUT_MS ?? '').trim(), 10) || 120_000;
const FORTUNE_API_PATH = '/api/fortune';
const CONFIGURED_API_URL = String(import.meta.env.VITE_FORTUNE_API_URL ?? '').trim();
const CONFIGURED_FALLBACK_URLS = String(import.meta.env.VITE_FORTUNE_API_FALLBACK_URLS ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
/** 워커/업스트림 일시 장애 시 1회 재시도 */
const TRANSIENT_HTTP = new Set([408, 429, 502, 503, 504]);

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

function buildEndpointCandidates() {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLoopback = host === 'localhost' || host === '127.0.0.1';
  /** 사설망 IP(휴대폰 테스트 등). localhost 가 아님 — 127.0.0.1 로 요청하면 기기 자기 자신이라 실패함 */
  const isLanIp =
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);

  /**
   * 빌드에 VITE_FORTUNE_API_URL 이 박혀 있으면 그 주소만 쓴다.
   * (토스·프로덕션에서 상대 경로 /api/fortune 으로 폴백하면 403 등이 나와 간헐 실패처럼 보임)
   */
  if (CONFIGURED_API_URL) {
    return [...new Set([CONFIGURED_API_URL, ...CONFIGURED_FALLBACK_URLS])];
  }

  const list = [];
  /**
   * PC에서만: Vite 프록시보다 루프백 직접 연결이 안정적인 경우가 많음.
   * 휴대폰 등: 같은 호스트로만 요청 (상대 경로 /api → Vite가 8790으로 넘김).
   */
  if (isLoopback) {
    list.push('http://127.0.0.1:8790/api/fortune');
  }
  list.push(FORTUNE_API_PATH);
  if (isLanIp && !isLoopback) {
    list.push(`http://${host}:8790/api/fortune`);
  }

  return [...new Set([...list, ...CONFIGURED_FALLBACK_URLS])];
}

function isTossMiniappHost(hostname) {
  const h = String(hostname ?? '').trim();
  return h.endsWith('.apps.tossmini.com') || h.endsWith('.private-apps.tossmini.com');
}

function isTransientNetworkError(e) {
  if (!e || typeof e !== 'object') return false;
  if (e.name === 'TypeError' && /fetch|network|load failed/i.test(String(e.message))) return true;
  return e.name === 'NetworkError';
}

function isLikelyCloudflareEdgeBlock(status, data, endpoint) {
  if (status !== 403) return false;
  const body = JSON.stringify(data ?? '').toLowerCase();
  return (
    /error code:\s*1010|1010|access denied|forbidden/i.test(body) ||
    /\.workers\.dev/i.test(String(endpoint))
  );
}

/**
 * 앱 서버(/api/fortune) 경유 호출.
 * @param {string} userPrompt
 * @returns {Promise<{ resultText: string, model: string }>}
 */
export async function runClaudeUserPrompt(userPrompt) {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  if (!CONFIGURED_API_URL && isTossMiniappHost(host)) {
    const err = new Error('CONFIG_MISSING_API_URL');
    err.code = 'CONFIG_MISSING_API_URL';
    throw err;
  }

  const init = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userPrompt }),
  };

  const endpoints = buildEndpointCandidates();
  let lastError;
  for (let endpointIndex = 0; endpointIndex < endpoints.length; endpointIndex += 1) {
    const endpoint = endpoints[endpointIndex];
    let response;
    let lastAbortOrNetwork;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await fetchWithTimeout(endpoint, init);
        lastAbortOrNetwork = undefined;
        const data = await response.json().catch(() => ({}));
        if (response.ok && typeof data?.resultText === 'string' && data.resultText.trim()) {
          return {
            resultText: data.resultText.trim(),
            model: String(data?.model ?? '').trim() || 'server-proxy',
          };
        }

        if (!response.ok && TRANSIENT_HTTP.has(response.status) && attempt === 0) {
          console.warn(`[Claude] ${endpoint} HTTP ${response.status} — 2초 후 1회 재시도`);
          await sleep(2000);
          continue;
        }

        // 일부 사용자 환경에서 workers.dev 엣지(1010) 차단이 발생할 수 있어 다음 엔드포인트로 우회
        if (!response.ok && isLikelyCloudflareEdgeBlock(response.status, data, endpoint)) {
          const edgeErr = new Error(
            `HTTP ${response.status} 엣지 차단 감지 (${endpoint})\n${JSON.stringify(data?.error ?? data, null, 2)}`,
          );
          edgeErr.httpStatus = response.status;
          edgeErr.data = data;
          lastError = edgeErr;
          break;
        }

        const apiErr = new Error(
          `HTTP ${response.status} ${response.statusText} (${endpoint})\n${JSON.stringify(data?.error ?? data, null, 2) || '서버 응답 파싱 실패'}`,
        );
        apiErr.httpStatus = response.status;
        apiErr.data = data;
        lastError = apiErr;
        break;
      } catch (e) {
        lastAbortOrNetwork = e;
        const canRetry =
          attempt === 0 && (e?.name === 'AbortError' || isTransientNetworkError(e));
        if (canRetry) {
          console.warn(`[Claude] ${endpoint} 일시 오류/시간 초과 — 2초 후 1회 재시도`);
          await sleep(2000);
          continue;
        }
        if (e?.name === 'AbortError') {
          const t = new Error(`Fortune API 요청 시간 초과(${FETCH_TIMEOUT_MS / 1000}초): ${endpoint}`);
          t.httpStatus = 408;
          lastError = t;
        } else {
          lastError = e;
        }
      }
    }
    if (lastAbortOrNetwork) lastError = lastAbortOrNetwork;
  }
  throw lastError ?? new Error('Claude 요청 실패');
}
