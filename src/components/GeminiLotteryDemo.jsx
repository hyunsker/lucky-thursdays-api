/**
 * Claude + 연금복권(조 + 여섯 자리) 응답 연동 최소 예시.
 * App.jsx 대신 쓰려면: import ClaudeLotteryDemo from './components/GeminiLotteryDemo.jsx';
 */
import { useState } from 'react';
import { runClaudeUserPrompt } from '../services/claudeApi.js';
import { formatKoreanDateLabel, formatTodayKey } from '../utils/sajuCalculator.js';
import { buildFortunePrompt, getHourLabel } from '../utils/fortunePrompt.js';
import { normalizeFortunePayload } from '../utils/displayResult.js';

const box = { padding: 24, maxWidth: 420, margin: '0 auto', fontFamily: 'system-ui, sans-serif' };
const row = { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' };
const btn = {
  padding: '10px 16px',
  fontWeight: 700,
  borderRadius: 10,
  border: 'none',
  background: '#3182f6',
  color: '#fff',
  cursor: 'pointer',
};

export default function GeminiLotteryDemo() {
  const [year, setYear] = useState(1998);
  const [month, setMonth] = useState(5);
  const [day, setDay] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const todayIso = formatTodayKey();
      const todayKorean = formatKoreanDateLabel(todayIso);
      const hourLabel = getHourLabel('unknown');
      const promptText = buildFortunePrompt({ year, month, day, hourLabel, todayIso, todayKorean });
      const { resultText } = await runClaudeUserPrompt(promptText);
      let parsed;
      try {
        parsed = JSON.parse(resultText);
      } catch {
        const t = resultText.trim();
        const start = t.indexOf('{');
        const end = t.lastIndexOf('}');
        if (start === -1 || end <= start) throw new Error('NO_JSON');
        parsed = JSON.parse(t.slice(start, end + 1));
      }
      parsed.todayIso = parsed.todayIso || todayIso;
      const res = normalizeFortunePayload(parsed, todayIso);
      setData(res);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={box}>
      <h2 style={{ marginTop: 0 }}>사주 → Claude 연금복권 (데모)</h2>
      <form onSubmit={handleSubmit}>
        <div style={row}>
          <label>
            년
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ marginLeft: 8, width: 88 }}
            />
          </label>
          <label>
            월
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ marginLeft: 8, width: 56 }}
            />
          </label>
          <label>
            일
            <input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              style={{ marginLeft: 8, width: 56 }}
            />
          </label>
        </div>
        <button type="submit" style={btn} disabled={loading}>
          {loading ? '불러오는 중…' : '번호 받기'}
        </button>
      </form>

      {error ? (
        <p style={{ color: '#c00', marginTop: 16 }} role="alert">
          {error}
        </p>
      ) : null}

      {data ? (
        <div style={{ marginTop: 20, padding: 16, background: '#f4f6f8', borderRadius: 12 }}>
          <p style={{ margin: '0 0 8px', fontWeight: 800 }}>
            {data.group}조 · 여섯 자리 {data.sixDigit}
          </p>
          <p style={{ margin: '0 0 8px', fontSize: 13, color: '#555' }}>
            조(1~5)와 6칸 번호는 서로 다른 항목입니다.
          </p>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>{data.analysisReason || '(분석 문구 없음)'}</p>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#666' }}>출처: {data.source}</p>
        </div>
      ) : null}
    </div>
  );
}
