// 빌드 시 사전 렌더링 및 애드센스 기술 검증 게이트.
// Vercel은 dist/ 를 정적 파일로만 서빙하고 server.ts 는 실행하지 않는다.
// 따라서 빌드 마지막에 서버를 띄워 모든 경로의 완성된 SSR HTML을 저장하고,
// 1) 빈 #root 페이지 0건, 2) 404/법적/문의 페이지의 adsbygoogle.js 미노출, 3) ads.txt/robots.txt/icon.svg 존재를 강제 검증한다.
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const SITE_HOST = process.env.PRERENDER_HOST || 'virginroad.kr';
const PORT = 4173 + Math.floor(Math.random() * 500);
const DIST = path.join(process.cwd(), 'dist');
const EXTRA_FILES = [['/data/posts.json', 'data/posts.json']];
const EXTRA_ROUTES = ['/contact', '/tools/power-cost', '/tools/filter-cycle'];

// 애드센스 정책: 404 및 법적/문의/안내 화면에서는 Google 광고 스크립트를 절대 로드하지 않는다.
const NO_AD_ROUTES = new Set([
  '/404',
  '/privacy',
  '/terms',
  '/contact',
  '/policy',
  '/announcement',
]);

const log = (m) => console.log(`[prerender] ${m}`);

function get(route) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port: PORT,
        path: route,
        headers: {
          host: SITE_HOST,
          'x-forwarded-host': SITE_HOST,
          'x-forwarded-proto': 'https',
          'user-agent': 'prerender-snapshot',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () =>
          resolve({
            status: res.statusCode,
            location: res.headers.location,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        );
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
  if (u.search) throw new Error(`사이트맵에 ?쿼리 주소가 있습니다: ${loc}`);
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
  const adLeaks = [];

  try {
    await waitForServer();

    for (const [route, out] of EXTRA_FILES) {
      const r = await get(route);
      if (r.status !== 200) throw new Error(`${route} 응답 ${r.status}`);
      files.set(out, r.body);
    }

    const sitemap = files.get('sitemap.xml') ?? fs.readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
    const routes = [
      ...new Set([
        ...[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
          routeOf(m[1].replace(/&amp;/g, '&'))
        ),
        ...EXTRA_ROUTES,
      ]),
    ];
    if (routes.length < 10) throw new Error(`사이트맵 주소가 너무 적습니다 (${routes.length}개).`);

    for (const route of routes) {
      const r = await get(route);
      if (r.status !== 200) {
        throw new Error(
          `${decodeURIComponent(route)} 가 ${r.status} 로 응답했습니다${r.location ? ` (→ ${decodeURIComponent(r.location)})` : ''}.`
        );
      }
      if (/<div id="root">\s*<\/div>/.test(r.body)) {
        emptyBody.push(decodeURIComponent(route));
      }
      if (NO_AD_ROUTES.has(route) && r.body.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) {
        adLeaks.push(route);
      }
      pages.set(route, r.body);
    }

    const notFound = await get('/__not-found__/__not-found__');
    if (notFound.status !== 404) {
      throw new Error(`존재하지 않는 경로가 404 대신 ${notFound.status} 를 반환했습니다.`);
    }
    if (/<div id="root">\s*<\/div>/.test(notFound.body)) {
      emptyBody.push('/404');
    }
    if (notFound.body.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')) {
      adLeaks.push('/404');
    }
    pages.set('/404', notFound.body);
  } finally {
    server.kill('SIGKILL');
  }

  // Hard verification gates for Google AdSense compliance
  if (emptyBody.length > 0) {
    throw new Error(`빈 <div id="root"></div> 페이지 발견 (${emptyBody.length}건): ${emptyBody.join(', ')}`);
  }
  if (adLeaks.length > 0) {
    throw new Error(`비콘텐츠/404 화면에 adsbygoogle.js 스크립트가 포함됨: ${adLeaks.join(', ')}`);
  }

  // Verify required static files in dist/
  const adsTxtPath = path.join(DIST, 'ads.txt');
  const robotsTxtPath = path.join(DIST, 'robots.txt');
  const iconSvgPath = path.join(DIST, 'icon.svg');
  const sitemapPath = path.join(DIST, 'sitemap.xml');

  if (!fs.existsSync(adsTxtPath) || !fs.readFileSync(adsTxtPath, 'utf8').includes('pub-9552509372228899')) {
    throw new Error('dist/ads.txt 가 누락되었거나 게시자 ID가 일치하지 않습니다.');
  }
  if (!fs.existsSync(robotsTxtPath) || !fs.readFileSync(robotsTxtPath, 'utf8').includes('AdsBot-Google')) {
    throw new Error('dist/robots.txt 가 누락되었거나 AdsBot-Google 허용 규칙이 없습니다.');
  }
  if (!fs.existsSync(iconSvgPath)) {
    throw new Error('dist/icon.svg 가 누락되었습니다.');
  }
  if (!fs.existsSync(sitemapPath)) {
    throw new Error('dist/sitemap.xml 이 누락되었습니다.');
  }

  // Write files after server closes
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

  log(`검증 통과: ${pages.size - 1}개 페이지 + 404.html 생성 (빈 화면 0건, 404/정책 광고 누출 0건, ads.txt·robots.txt·icon.svg 확인 완료)`);
}

main().catch((err) => {
  console.error(`[prerender] 실패: ${err.message}`);
  process.exit(1);
});
