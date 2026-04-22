#!/usr/bin/env node
/**
 * 로컬 개발용: Anthropic API 프록시 (키는 서버 환경변수만).
 * npm run dev:full 과 함께 실행됩니다.
 *
 * cwd와 무관하게 프로젝트 루트의 .env 를 읽습니다 (어디서 node 를 실행해도 키 인식).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import http from 'node:http';
import { runAnthropicUserPrompt } from '../lib/anthropicMessages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const hasApiKey = String(process.env.ANTHROPIC_API_KEY ?? process.env.VITE_ANTHROPIC_API_KEY ?? '').trim();
if (!hasApiKey) {
  console.warn(
    '[fortune-proxy] API 키 없음: 프로젝트 루트(목요일의-행운)의 .env 에 ANTHROPIC_API_KEY= 또는 VITE_ANTHROPIC_API_KEY= 를 넣은 뒤 이 서버를 다시 실행하세요.',
  );
}

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

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  const cors = tossCorsHeaders(typeof origin === 'string' ? origin : '');

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/fortune') {
    res.writeHead(404, cors);
    res.end();
    return;
  }

  let raw = '';
  req.on('data', (c) => {
    raw += c;
  });
  req.on('end', async () => {
    try {
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
  });
});

/** 기본 8790 — 8787·8788 등은 다른 로컬 앱과 충돌하기 쉬움 */
const PORT = Number(process.env.FORTUNE_PROXY_PORT || 8790);
/** 외부에서만 127.0.0.1 이 필요하면 FORTUNE_PROXY_HOST=127.0.0.1 */
const LISTEN_HOST = process.env.FORTUNE_PROXY_HOST || '0.0.0.0';
server.listen(PORT, LISTEN_HOST, () => {
  console.log(`[fortune-proxy] http://127.0.0.1:${PORT}/api/fortune (listen ${LISTEN_HOST}:${PORT})`);
});
