import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** 샌드박스 등에서 NIC 열람이 막히면 host: true 에서 실패함. LAN 테스트 시 VITE_BIND_ALL=1 */
const bindHost = process.env.VITE_BIND_ALL === '1' ? true : '127.0.0.1';

export default defineConfig({
  plugins: [react()],
  server: {
    host: bindHost,
    /** 5173은 다른 Vite 앱과 자주 겹침 → 이 미니앱 전용으로 5180 고정 */
    port: 5180,
    strictPort: true,
    proxy: {
      '/api': {
        /** fortune-proxy 기본 포트(8790) */
        target: process.env.VITE_FORTUNE_PROXY_TARGET || 'http://127.0.0.1:8790',
        changeOrigin: true,
        /** Claude 응답이 길어질 수 있음 — 프록시 기본 타임아웃(짧음)으로 끊기는 경우 방지 */
        timeout: 180_000,
        proxyTimeout: 180_000,
      },
    },
  },
  preview: {
    host: bindHost,
    port: 4173,
    strictPort: true,
  },
});
