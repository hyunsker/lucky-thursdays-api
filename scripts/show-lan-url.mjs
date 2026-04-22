import os from 'node:os';

const port = process.env.PORT || '5180';

/** @type {string[]} */
let ips = [];
try {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const n of nets[name] ?? []) {
      if (n.family === 'IPv4' && !n.internal) ips.push(n.address);
    }
  }
} catch {
  ips = [];
}

/** 169.254.x.x 는 링크로컬이라 휴대폰 접속에 보통 쓰이지 않음 */
const preferred = ips.filter((a) => !a.startsWith('169.254.'));
const toShow = preferred.length > 0 ? preferred : ips;

console.log('');
console.log('같은 Wi‑Fi에 연결된 휴대폰 브라우저에서 아래 주소로 접속하세요.');
console.log('(개발 서버: npm run dev 가 켜져 있어야 합니다)');
console.log('');
if (toShow.length === 0) {
  console.log('  이 환경에서는 IP를 자동으로 못 찾을 수 있어요. 터미널에서 확인:');
  console.log('    macOS Wi‑Fi: ipconfig getifaddr en0');
  console.log('    (유선이면 en1 등 인터페이스 이름을 바꿔 보세요.)');
  console.log(`  그 다음 브라우저에 http://<위에서 나온 IP>:${port}`);
} else {
  for (const ip of toShow) {
    console.log(`  http://${ip}:${port}`);
  }
}
console.log('');
console.log('접속이 안 되면: 시스템 설정 → 네트워크 방화벽에서 Node/Vite 허용 여부를 확인하세요.');
console.log('npm run dev 실행 시 터미널에도 "Network" 로 표시된 주소가 나옵니다.');
console.log('');
