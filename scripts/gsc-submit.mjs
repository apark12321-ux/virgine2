// 배포가 끝난 직후 구글 서치 콘솔에 사이트맵을 다시 제출한다.
// 새 글이 발행(=배포)될 때마다 실행되어 구글이 최신 sitemap.xml 을 바로 읽어 가게 한다.
//
// 필요한 환경변수
//   GSC_SERVICE_ACCOUNT_JSON  서비스 계정 키(JSON 전체, 또는 base64). 없으면 아무것도 하지 않고 끝낸다.
//   GSC_SITE                  서치 콘솔 속성. 도메인 속성은 "sc-domain:example.kr" 형태.
//   SITEMAP_URL               제출할 사이트맵 주소.
//
// 외부 패키지 없이 Node 18+ 기본 기능만 쓴다.
import crypto from 'node:crypto';

const { GSC_SERVICE_ACCOUNT_JSON, GSC_SITE, SITEMAP_URL } = process.env;
const log = (m) => console.log(`[gsc-submit] ${m}`);

if (!GSC_SITE || !SITEMAP_URL) {
  log('GSC_SITE 또는 SITEMAP_URL 이 없어 건너뜁니다.');
  process.exit(0);
}
if (!GSC_SERVICE_ACCOUNT_JSON) {
  log('GSC_SERVICE_ACCOUNT_JSON 시크릿이 아직 등록되지 않아 건너뜁니다.');
  process.exit(0);
}

const b64url = (v) => Buffer.from(v).toString('base64url');

function parseKey(raw) {
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  const key = JSON.parse(text);
  if (!key.client_email || !key.private_key) throw new Error('서비스 계정 키에 client_email / private_key 가 없습니다.');
  return key;
}

async function getAccessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const unsigned =
    b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) +
    '.' +
    b64url(
      JSON.stringify({
        iss: key.client_email,
        scope: 'https://www.googleapis.com/auth/webmasters',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 600,
      })
    );
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(key.private_key).toString('base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) throw new Error(`토큰 발급 실패 (${res.status}): ${body.error_description || body.error || ''}`);
  return body.access_token;
}

async function main() {
  // 1) 방금 배포된 사이트맵이 실제로 열리는지 먼저 확인
  const live = await fetch(SITEMAP_URL, { headers: { 'cache-control': 'no-cache' } });
  const xml = live.ok ? await live.text() : '';
  const urlCount = (xml.match(/<loc>/g) || []).length;
  if (!live.ok || urlCount === 0) throw new Error(`사이트맵을 읽을 수 없습니다: ${SITEMAP_URL} (HTTP ${live.status}, URL ${urlCount}개)`);
  log(`사이트맵 확인: ${SITEMAP_URL} (URL ${urlCount}개)`);

  // 2) 서치 콘솔에 제출
  const key = parseKey(GSC_SERVICE_ACCOUNT_JSON);
  const token = await getAccessToken(key);
  const endpoint =
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(GSC_SITE)}` +
    `/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
  const put = await fetch(endpoint, { method: 'PUT', headers: { authorization: `Bearer ${token}` } });
  if (!put.ok) {
    const detail = await put.text();
    const hint =
      put.status === 403
        ? ` → 서치 콘솔 "${GSC_SITE}" 속성의 [설정 > 사용자 및 권한]에 ${key.client_email} 을 '소유자' 또는 '전체' 권한으로 추가했는지, Google Cloud에서 Search Console API를 켰는지 확인하세요.`
        : '';
    throw new Error(`사이트맵 제출 실패 (HTTP ${put.status})${hint}\n${detail.slice(0, 400)}`);
  }
  log(`제출 완료: ${GSC_SITE} ← ${SITEMAP_URL}`);

  // 3) 서치 콘솔이 기록한 상태를 참고용으로 출력
  const get = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` } });
  if (get.ok) {
    const info = await get.json();
    log(`서치 콘솔 기록: 마지막 제출 ${info.lastSubmitted || '-'}, 대기 중 ${info.isPending ? '예' : '아니오'}, 오류 ${info.errors ?? 0}, 경고 ${info.warnings ?? 0}`);
  }
}

main().catch((err) => {
  // 워크플로 실행 기록에 빨간색으로 남도록 실패 코드로 끝낸다 (사이트 배포에는 영향 없음).
  console.error(`[gsc-submit] ${err.message}`);
  process.exit(1);
});
