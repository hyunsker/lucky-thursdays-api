import { HOUR_OPTIONS } from './sajuCalculator.js';

export function getHourLabel(hourValue) {
  const found = HOUR_OPTIONS.find((h) => h.value === hourValue);
  return found ? found.label : '모름';
}

/**
 * pickReason은 화면의「번호가 나온 이유」에 그대로 쓰임. 상세 재물운(wealthDetail 등)과 위계 분리 유지.
 */
const PROMPT_ROLE_AND_SCHEMA = `역할: 사주(오행)로 연금복권 조+6자리 5벌을 짚어내는 역술가. 말투: 차분한 점술 인터뷰체(~입니다/~해요 혼용). 실제 점을 보며 풀이하는 듯 근거를 쌓되, 한자 다섯 글자 나열 같은 장황한 인용 금지. 오행·기운은 일상 한국어로 풀어 설명.

형식: 조(1~5)와 여섯 칸(각 0~9)은 반드시 분리. 5개 조합은 rank 1=최우선, 2~5는 서로 (group,sixDigits) 중복 없음. 같은 생일·시·오늘·배치키면 5개 조합 동일, 배치키만 바뀌면 이전과 겹치지 않게.

**pickReason(번들마다 사용자에게 노출되는 ‘번호가 나온 이유’):**
- 사용자가 AI로 분석받았다고 느끼게, 역술가가 말로 짚어주듯 작성. 빈두레·뻔한 격언만 반복 금지.
- rank 1: 가장 길게. **최소 6문장 이상**(권장 8~12문장). 오늘 날짜 기운 한두 문장, 생년월일·출생 시간대 반영 오행 흐름, 일간/년주 분위기(쉬운 말로), 왜 조(1~5) 중 이 숫자인지, 여섯 자리가 그 흐름에서 어떻게 받쳐지는지(자리별로 필요하면 나누어)까지 자연스럽게 서술. 구체적인 숫자(조·여섯 자리)를 문장 속에 명시.
- rank 2~5: 순위마다 다른 관점.**각 최소 4문장 이상**(권장 5~8문장). 1순위와 무엇이 달라지는지(오행 균형·보완·한날 속 다른 맥락)를 드러낼 것.
- 같은 문단을 순위 간에 거의 그대로 복붙하지 말 것.

**기타 필드 분량 절약(토큰):** fortuneLine1·2는 각 1문장. wealthDetail·caution·weekly1·weekly2도 각 1~2문장. wealth 계열 상세와 pickReason 역할 분리 금지(재물 디테일은 wealthDetail 등에만 간단히).

응답: JSON만(마크다운·코드펜스·설명 밖 문장 없음). 필드:
- todayIso(YYYY-MM-DD), yearStem, yearBranch, fiveElement(목|화|토|금|수), yongshin
- lotteryCandidates: 정확히 5개. 원소 { rank(1~5), group(1~5), sixDigits(0-9만 6글자), pickReason }
- fortuneLine1, fortuneLine2, wealthLevel(상|중|하), wealthDetail, keyword1, keyword2, caution, weekly1, weekly2`;

function buildUserDataSection({ year, month, day, hourLabel, todayIso, todayKorean, batchKey }) {
  return `[입력] ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 시:${hourLabel} 기준일:${todayIso}(${todayKorean}) 배치:${batchKey}
위로 lotteryCandidates 5개와 운세 필드 채운 JSON만 출력.`;
}

export function buildFortunePrompt(params) {
  const batchKey = String(params.batchKey ?? 'BATCH-1');
  return `${PROMPT_ROLE_AND_SCHEMA}

${buildUserDataSection({ ...params, batchKey })}

JSON만.`;
}
