/**
 * Vercel Serverless: 배포 시 이 파일을 그대로 사용할 수 있습니다.
 * 프로젝트 루트에 Vercel 프로젝트를 연결하고 환경변수 ANTHROPIC_API_KEY 를 설정하세요.
 */
import { runAnthropicUserPrompt } from '../lib/anthropicMessages.mjs';

function tossCorsHeaders(origin) {
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
    hostname.endsWith('.vercel.app');
  if (!allowed) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const cors = tossCorsHeaders(typeof origin === 'string' ? origin : '');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, cors);
    res.end();
    return;
  }

  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString('utf8');
    const json = JSON.parse(raw || '{}');
    const userPrompt = json.userPrompt;
    if (!userPrompt || typeof userPrompt !== 'string') {
      res.writeHead(400, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'userPrompt 가 필요합니다.' }));
      return;
    }

    const apiKey = String(process.env.ANTHROPIC_API_KEY ?? process.env.VITE_ANTHROPIC_API_KEY ?? '').trim();
    if (!apiKey) {
      res.writeHead(500, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: '서버에 ANTHROPIC_API_KEY 가 설정되지 않았습니다.' }));
      return;
    }

    const { resultText, model } = await runAnthropicUserPrompt({
      apiKey,
      userPrompt,
      model: process.env.ANTHROPIC_MODEL,
    });
    res.writeHead(200, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ resultText, model }));
  } catch (e) {
    let msg = e instanceof Error ? e.message : String(e);
    const c = e && typeof e === 'object' && 'cause' in e ? e.cause : undefined;
    if (c instanceof Error && c.message) msg = `${msg} · ${c.message}`;
    else if (c != null && String(c).trim()) msg = `${msg} · ${String(c)}`;
    const upstreamStatus =
      e && typeof e === 'object' && Number.isInteger(e.httpStatus) ? Number(e.httpStatus) : 502;
    const errorType =
      e && typeof e === 'object' ? String(e?.data?.error?.type ?? '').trim() : '';
    const statusCode = upstreamStatus >= 400 && upstreamStatus <= 599 ? upstreamStatus : 502;
    res.writeHead(statusCode, { ...cors, 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        error: msg,
        upstreamStatus: statusCode,
        errorType: errorType || undefined,
      }),
    );
  }
}
