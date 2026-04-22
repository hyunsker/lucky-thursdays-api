import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
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
    host: true,
    port: 4173,
    strictPort: true,
  },
});
