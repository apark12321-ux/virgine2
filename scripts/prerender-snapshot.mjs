// 빌드 시 사전 렌더링.
// Vercel은 dist/ 를 정적 파일로만 서빙하고 server.ts 는 실행하지 않는다. 그래서 빌드 마지막에
// 서버를 잠깐 띄워 각 페이지의 완성된 HTML(본문·제목·대표 주소 포함)을 받아 dist/ 에 파일로 저장한다.
// 검색엔진과 애드센스 심사 봇은 자바스크립트 실행 없이 이 파일을 그대로 읽는다.
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const SITE_HOST = process.env.PRERENDER_HOST || 'virginroad.kr';
const PORT = 4173 + Math.floor(Math.random() * 500);
const DIST = path.join(process.cwd(), 'dist');
const EXTRA_FILES = [['/data/posts.json', 'data/posts.json']]; // [요청 경로, dist 안 저장 경로]
const EXTRA_ROUTES = []; // 사이트맵에 없어도 만들어 둘 페이지

const log = (m) => console.log(`[prerender] ${m}`);

function get(route) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: '127.0.0.1', port: PORT, path: route, headers: { host: SITE_HOST, 'x-forwarded-host': SITE_HOST, 'x-forwarded-proto': 'https', 'user-agent': 'prerender-snapshot' } },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body: Buffer.concat(chunks).toString('utf8') }));
      }
    );
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error(`timeout ${route}`)));
    req.end();
  });
}

async function waitForServer() {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await get('/robots.txt');
      if (r.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('서버가 60초 안에 뜨지 않았습니다.');
}

const routeOf = (loc) => {
  const u = new URL(loc);
  if (u.host !== SITE_HOST) throw new Error(`사이트맵에 다른 도메인 주소가 있습니다: ${loc}`);
  if (u.search) throw new Error(`사이트맵에 ?쿼리 주소가 있습니다(정적 페이지로 만들 수 없음): ${loc}`);
  return u.pathname;
};

async function main() {
  const server = spawn(process.execPath, ['dist/server.cjs'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT), PRERENDER_SNAPSHOT: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  const pages = new Map();
  const files = new Map();
  const emptyBody = [];
  try {
    await waitForServer();

    for (const [route, out] of EXTRA_FILES) {
      const r = await get(route);
      if (r.status !== 200) throw new Error(`${route} 응답 ${r.status}`);
      files.set(out, r.body);
    }

    // 사이트맵에 실린 주소가 곧 만들 페이지 목록이다.
    // (EXTRA_FILES 에 sitemap.xml 이 있으면 서버가 방금 만든 최신 사이트맵을, 없으면 빌드가 만들어 둔 파일을 쓴다.)
    const sitemap = files.get('sitemap.xml') ?? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    const routes = [...new Set([...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => routeOf(m[1].replace(/&amp;/g, '&'))), ...EXTRA_ROUTES])];
    if (routes.length < 5) throw new Error(`사이트맵 주소가 너무 적습니다 (${routes.length}개).`);

    for (const route of routes) {
      const r = await get(route);
      if (r.status !== 200) throw new Error(`${decodeURIComponent(route)} 가 ${r.status} 로 응답했습니다${r.location ? ` (→ ${decodeURIComponent(r.location)})` : ''}. 사이트맵 주소와 실제 글 주소가 다릅니다.`);
      if (/<div id="root">\s*<\/div>/.test(r.body)) {
        // 글 페이지는 본문이 반드시 있어야 한다. 그 밖의 페이지(약관 등)는 제목·대표 주소만 들어가도 통과시키되 알려 준다.
        if (route.startsWith('/post/')) throw new Error(`${decodeURIComponent(route)} 의 본문이 비어 있습니다.`);
        emptyBody.push(decodeURIComponent(route));
      }
      pages.set(route, r.body);
    }

    const notFound = await get('/__not-found__/__not-found__');
    pages.set('/404', notFound.body.replace(/<meta\s+name="robots"[^>]*>/gi, '').replace('</head>', '  <meta name="robots" content="noindex, follow" />\n</head>'));
  } finally {
    server.kill('SIGKILL');
  }

  // 서버가 dist/index.html 을 템플릿으로 읽으므로, 파일 쓰기는 서버를 내린 뒤 한꺼번에 한다.
  for (const [out, body] of files) {
    fs.mkdirSync(path.dirname(path.join(DIST, out)), { recursive: true });
    fs.writeFileSync(path.join(DIST, out), body);
  }
  for (const [route, html] of pages) {
    if (route === '/404') {
      fs.writeFileSync(path.join(DIST, '404.html'), html);
      continue;
    }
    const dir = path.join(DIST, decodeURIComponent(route));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
  }
  log(`${pages.size - 1}개 페이지 + 404.html 생성${files.size ? `, 데이터 파일 ${files.size}개` : ''}`);
  if (emptyBody.length) log(`본문 없이 제목·대표 주소만 들어간 페이지: ${emptyBody.join(', ')}`);
}

main().catch((err) => {
  console.error(`[prerender] 실패: ${err.message}`);
  process.exit(1);
});
