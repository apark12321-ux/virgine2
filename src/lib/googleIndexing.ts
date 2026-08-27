import fs from "fs";
import path from "path";
import crypto from "crypto";

const INDEXING_LOG_FILE = path.join(process.cwd(), "google-indexing-log.json");
const INDEXING_CONFIG_FILE = path.join(process.cwd(), "google-indexing-config.json");
const DEFAULT_BASE_URL = "https://virginroad.kr";

export interface IndexingLogEntry {
  id: string;
  url: string;
  type: "URL_UPDATED" | "SITEMAP_PING" | "INDEXNOW";
  timestamp: string; // ISO string
  status: "success" | "warning" | "error";
  message: string;
  details?: any;
}

export interface GoogleServiceAccountKey {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

export interface IndexingConfig {
  serviceAccountKey?: GoogleServiceAccountKey;
  keyConfigured: boolean;
  autoIndexOnPublish: boolean;
  indexNowApiKey?: string;
  lastPingTime?: string;
  totalSubmissions: number;
}

// 1. Helper: Read & Write Logs
export function getIndexingLogs(): IndexingLogEntry[] {
  try {
    if (fs.existsSync(INDEXING_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(INDEXING_LOG_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to read indexing logs:", err);
  }
  return [];
}

export function saveIndexingLog(entry: Omit<IndexingLogEntry, "id">): IndexingLogEntry {
  try {
    const logs = getIndexingLogs();
    const newEntry: IndexingLogEntry = {
      id: "idx-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      ...entry
    };
    logs.unshift(newEntry);
    // Keep last 150 entries
    const trimmed = logs.slice(0, 150);
    fs.writeFileSync(INDEXING_LOG_FILE, JSON.stringify(trimmed, null, 2), "utf-8");
    return newEntry;
  } catch (err) {
    console.error("Failed to save indexing log:", err);
    return {
      id: "err-" + Date.now(),
      ...entry
    };
  }
}

// 2. Helper: Read & Write Config
export function getIndexingConfig(): IndexingConfig {
  let envKey: GoogleServiceAccountKey | undefined = undefined;
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      envKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    } catch {
      // Not JSON or raw string
    }
  } else if (process.env.GOOGLE_INDEXING_KEY) {
    try {
      envKey = JSON.parse(process.env.GOOGLE_INDEXING_KEY);
    } catch {
      // Not JSON
    }
  }

  let fileConfig: Partial<IndexingConfig> = {};
  try {
    if (fs.existsSync(INDEXING_CONFIG_FILE)) {
      fileConfig = JSON.parse(fs.readFileSync(INDEXING_CONFIG_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to read indexing config:", err);
  }

  const saKey = fileConfig.serviceAccountKey || envKey;
  return {
    serviceAccountKey: saKey,
    keyConfigured: Boolean(saKey && saKey.client_email && saKey.private_key),
    autoIndexOnPublish: fileConfig.autoIndexOnPublish !== false,
    indexNowApiKey: fileConfig.indexNowApiKey || "virginroad-indexnow-key",
    lastPingTime: fileConfig.lastPingTime,
    totalSubmissions: fileConfig.totalSubmissions || 0
  };
}

export function saveIndexingConfig(partial: Partial<IndexingConfig>): IndexingConfig {
  try {
    const current = getIndexingConfig();
    const updated = { ...current, ...partial };
    fs.writeFileSync(INDEXING_CONFIG_FILE, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("Failed to save indexing config:", err);
    return getIndexingConfig();
  }
}

// 3. Native Node.js JWT Generation for Google Indexing API
function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === "string" ? Buffer.from(str, "utf-8") : str;
  return buf.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function getGoogleAccessToken(saKey: GoogleServiceAccountKey): Promise<string> {
  if (!saKey.client_email || !saKey.private_key) {
    throw new Error("Service Account Key missing client_email or private_key");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: saKey.client_email,
    scope: "https://www.googleapis.com/auth/indexing https://www.googleapis.com/auth/webmasters",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(saKey.private_key);
  const encodedSignature = base64UrlEncode(signature);
  const jwt = `${signingInput}.${encodedSignature}`;

  // Exchange JWT for OAuth2 Token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    }).toString()
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Google OAuth Token exchange failed (${tokenRes.status}): ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

// 4. Google Indexing API: Submit single URL notification
export async function notifyGoogleIndexingApi(url: string, saKey: GoogleServiceAccountKey, actionType: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED") {
  const token = await getGoogleAccessToken(saKey);
  const res = await fetch("https://indexing.googleapis.com/v3/urlNotifications:publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      url: url,
      type: actionType
    })
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Google Indexing API Error (${res.status}): ${JSON.stringify(body)}`);
  }

  return body;
}

// 5. Ping Google Search Console / Googlebot Sitemap endpoint
export async function pingGoogleSearchConsoleSitemap(baseUrl: string = DEFAULT_BASE_URL) {
  const sitemapUrl = `${baseUrl.replace(/\/+$/, "")}/sitemap.xml`;
  const pingEndpoints = [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
  ];

  const results: { endpoint: string; status: number; ok: boolean }[] = [];

  for (const ep of pingEndpoints) {
    try {
      const res = await fetch(ep, { method: "GET", headers: { "User-Agent": "VirginRoad-Bot/1.0" } });
      results.push({ endpoint: ep, status: res.status, ok: res.ok });
    } catch (err: any) {
      results.push({ endpoint: ep, status: 0, ok: false });
    }
  }

  saveIndexingLog({
    url: sitemapUrl,
    type: "SITEMAP_PING",
    timestamp: new Date().toISOString(),
    status: results.some(r => r.ok) ? "success" : "warning",
    message: `Google & Bing Sitemap Ping 완료 (Sitemap: ${sitemapUrl})`,
    details: results
  });

  return results;
}

// 6. IndexNow Submission (Bing, Yandex, Naver etc.)
export async function submitToIndexNow(urls: string[], baseUrl: string = DEFAULT_BASE_URL) {
  const host = new URL(baseUrl).hostname;
  const key = "virginroad-indexnow-key";
  const endpoint = "https://api.indexnow.org/indexnow";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: host,
        key: key,
        keyLocation: `${baseUrl.replace(/\/+$/, "")}/${key}.txt`,
        urlList: urls
      })
    });

    const isOk = res.ok || res.status === 200 || res.status === 202;
    saveIndexingLog({
      url: urls.length === 1 ? urls[0] : `${urls.length}개 URL`,
      type: "INDEXNOW",
      timestamp: new Date().toISOString(),
      status: isOk ? "success" : "warning",
      message: `IndexNow 색인 제출 완료 (Status: ${res.status}, 대상: ${urls.length}건)`,
      details: { status: res.status, urlCount: urls.length }
    });

    return { ok: isOk, status: res.status };
  } catch (err: any) {
    saveIndexingLog({
      url: urls.length === 1 ? urls[0] : `${urls.length}개 URL`,
      type: "INDEXNOW",
      timestamp: new Date().toISOString(),
      status: "warning",
      message: `IndexNow 요청 실패: ${err.message}`,
      details: { error: err.message }
    });
    return { ok: false, error: err.message };
  }
}

// 7. Master Function: Submit single or multiple post URLs to Search Console & Indexing API
export async function submitUrlsToSearchConsole(
  urls: string[],
  baseUrl: string = DEFAULT_BASE_URL
): Promise<{
  success: boolean;
  submittedCount: number;
  googleApiResults: any[];
  sitemapPingResults: any[];
  indexNowResult: any;
  message: string;
}> {
  const config = getIndexingConfig();
  const validUrls = urls.map(u => (u.startsWith("http") ? u : `${baseUrl.replace(/\/+$/, "")}${u.startsWith("/") ? "" : "/"}${u}`));

  const googleApiResults: any[] = [];
  
  // A. If Google Service Account Key is configured, use Google Indexing API directly
  if (config.keyConfigured && config.serviceAccountKey) {
    for (const u of validUrls) {
      try {
        const res = await notifyGoogleIndexingApi(u, config.serviceAccountKey, "URL_UPDATED");
        googleApiResults.push({ url: u, status: "success", data: res });
        saveIndexingLog({
          url: u,
          type: "URL_UPDATED",
          timestamp: new Date().toISOString(),
          status: "success",
          message: `구글 색인 API (Indexing API) 등록 성공: ${u}`,
          details: res
        });
      } catch (err: any) {
        googleApiResults.push({ url: u, status: "error", error: err.message });
        saveIndexingLog({
          url: u,
          type: "URL_UPDATED",
          timestamp: new Date().toISOString(),
          status: "error",
          message: `구글 색인 API 오류: ${err.message}`,
          details: { error: err.message }
        });
      }
    }
  }

  // B. Search Console Sitemap Ping
  const sitemapPingResults = await pingGoogleSearchConsoleSitemap(baseUrl);

  // C. IndexNow Submission
  const indexNowResult = await submitToIndexNow(validUrls, baseUrl);

  // Update total submissions count
  const updatedTotal = (config.totalSubmissions || 0) + validUrls.length;
  saveIndexingConfig({
    totalSubmissions: updatedTotal,
    lastPingTime: new Date().toISOString()
  });

  return {
    success: true,
    submittedCount: validUrls.length,
    googleApiResults,
    sitemapPingResults,
    indexNowResult,
    message: `${validUrls.length}개 URL에 대한 구글 서치 콘솔 사이트맵 핑 및 색인 요청이 완료되었습니다.`
  };
}
