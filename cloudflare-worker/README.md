# Lucky Thursdays Cloudflare Worker

Worker 이름은 `wrangler.toml`의 **`lucky-thursdays`** (토스 `appName`과 맞춤).  
Deploy once, then set `VITE_FORTUNE_API_URL` in the miniapp build env.

## 1) Login and install

**반드시 이 폴더의 `wrangler.toml`을 쓰려면** 아래처럼 `cloudflare-worker` 안에서 실행하거나, 프로젝트 루트에서 `npm run worker:*` 를 쓰세요.

```bash
cd "/Users/hyunsker/토스미니앱/cloudflare-worker"
npm install
npm run login
```

## 2) Set secrets

```bash
npm run secret
```

(루트에서: `npm run worker:secret`)

Optional:

```bash
npx wrangler secret put ANTHROPIC_MODEL
```

## 3) Deploy

```bash
npm run deploy
```

(루트에서: `npm run worker:deploy`)

Copy the worker URL:

`https://lucky-thursdays.<subdomain>.workers.dev/api/fortune` (배포 후 터미널에 나오는 주소를 그대로 쓰면 됨)

## 4) Use in miniapp build

Set this in `/Users/hyunsker/토스미니앱/.env` before `npm run build:ait`:

```env
VITE_FORTUNE_API_URL=https://lucky-thursdays.<subdomain>.workers.dev/api/fortune
```
