목요일의 행운 — 토스 미니앱 (공유용 패키지)

포함 내용
- src/, api/, public/ — 소스
- cloudflare-worker/src/, wrangler.toml — Cloudflare Worker (Claude 프록시)
- dist/web/ — Vite 프로덕션 웹 번들
- lucky-thursdays.ait — 있으면 최근 빌드 산출물

제외 (보안)
- .env, node_modules — 포함하지 않음. .env.example 참고.

운세 API
- 클라이언트는 VITE_FORTUNE_API_URL (빌드 시 주입)로 Worker /api/fortune 호출
- Worker는 ANTHROPIC_API_KEY 시크릿으로 Anthropic API 호출

빌드
- npm install && npm run build && npm run build:ait

최근 수정 (간헐 오류 완화)
- VITE_FORTUNE_API_URL이 있으면 그 URL만 사용 (잘못된 /api/fortune 폴백 제거)
- 429/502/503/504/408 응답 시 동일 엔드포인트 1회 재시도
