import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * appName 은 앱인토스 콘솔에서 만든 미니앱 이름과 반드시 동일해야 합니다.
 * 콘솔과 다르면 intoss:// 스킴·샌드박스 테스트가 깨집니다.
 */
export default defineConfig({
  appName: 'lucky-thursdays',
  brand: {
    displayName: '목요일의 행운',
    primaryColor: '#3182F6',
    /** 공통 내비게이션 바 로고 — 상대경로 불가. public/branding/clover-icon-light-600.png 와 동일 자산 */
    icon: 'https://lucky-thursdays.private-apps.tossmini.com/branding/clover-icon-light-600.png',
  },
  permissions: [],
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
  },
  web: {
    host: 'localhost',
    port: 5180,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  webViewProps: {
    type: 'partner',
    bounces: true,
  },
  outdir: 'dist',
});
