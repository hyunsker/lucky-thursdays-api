/**
 * 앱 콘솔용 “실 UI” 캡처 (픽셀 = 브라우저 렌더)
 *
 * 전제: `npm run build` (vite) 후 `npm run preview -- --port 4173` 가 떠 있어야 함.
 * ※ `npm run build:ait` 직후에는 dist가 web/하위로 바뀌어 preview 404가 날 수 있음 →
 *    캡처 전 `npm run build` 를 한 번 더 실행할 것.
 *
 * 사용: npm i -D puppeteer 를 본인 Mac에서 한 뒤
 *   node scripts/capture-store-screens.mjs
 */
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '../docs/preview-screenshots');
const base = 'http://127.0.0.1:4173';

const shots = [
  { file: '01-input.png', url: `${base}/?shot=input`, fullPage: false, w: 390, h: 844 },
  { file: '02-loading.png', url: `${base}/?shot=loading`, fullPage: false, w: 390, h: 844 },
  { file: '03-result.png', url: `${base}/?shot=result`, fullPage: true, w: 390, h: 844 },
];

const chromePath =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let puppeteer;
try {
  ({ default: puppeteer } = await import('puppeteer'));
} catch {
  // eslint-disable-next-line no-console
  console.error('puppeteer 모듈이 없습니다. 로컬 터미널에서: npm i -D puppeteer');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath: chromePath,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});
const page = await browser.newPage();
for (const s of shots) {
  await page.setViewport({ width: s.w, height: s.h, deviceScaleFactor: 2 });
  await page.goto(s.url, { waitUntil: 'networkidle2', timeout: 60_000 });
  await new Promise((r) => setTimeout(r, 500));
  const buf = await page.screenshot({ type: 'png', fullPage: s.fullPage });
  await writeFile(join(outDir, s.file), buf);
  // eslint-disable-next-line no-console
  console.log('wrote', s.file, buf.length, 'bytes');
}
await browser.close();
