import { useState, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Send,
  Globe,
  FileCode,
  ShieldCheck,
  Zap,
  X,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface SearchConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPostSlug?: string;
  currentPostTitle?: string;
}

interface IndexingStatusData {
  config: {
    keyConfigured: boolean;
    autoIndexOnPublish: boolean;
    clientEmail: string | null;
    totalSubmissions: number;
    lastPingTime?: string;
  };
  stats: {
    totalPosts: number;
    sitemapUrl: string;
    robotsUrl: string;
    rssUrl: string;
  };
  recentLogs: Array<{
    id: string;
    url: string;
    type: string;
    timestamp: string;
    status: "success" | "warning" | "error";
    message: string;
  }>;
}

export function SearchConsoleModal({
  isOpen,
  onClose,
  currentPostSlug,
  currentPostTitle
}: SearchConsoleModalProps) {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [data, setData] = useState<IndexingStatusData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "logs" | "setup">("overview");
  const [jsonKeyInput, setJsonKeyInput] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/indexing/status");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e: any) {
      console.error("Failed to fetch indexing status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Action: Submit ALL posts to Google Search Console
  const handleSubmitAll = async () => {
    try {
      setActionLoading("all");
      setSuccessMessage(null);
      setErrorMessage(null);

      const res = await fetch("/api/indexing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage(`구글 서치 콘솔에 전체 ${result.submittedCount}개 포스팅 및 사이트맵 색인 등록 요청이 완료되었습니다.`);
        fetchStatus();
      } else {
        setErrorMessage(result.error || "색인 요청 중 오류가 발생했습니다.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "서버 통신 오류가 발생했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Submit Single current post
  const handleSubmitCurrentPost = async () => {
    if (!currentPostSlug) return;
    try {
      setActionLoading("single");
      setSuccessMessage(null);
      setErrorMessage(null);

      const postUrl = `/post/${currentPostSlug}`;
      const res = await fetch("/api/indexing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: postUrl })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage(`현재 글이 구글 서치 콘솔 및 IndexNow에 즉시 제출되었습니다.`);
        fetchStatus();
      } else {
        setErrorMessage(result.error || "개별 색인 요청 실패");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "서버 통신 오류");
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Ping Sitemap
  const handlePingSitemap = async () => {
    try {
      setActionLoading("ping");
      setSuccessMessage(null);
      setErrorMessage(null);

      const res = await fetch("/api/indexing/ping", { method: "POST" });
      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage("구글 및 Bing 검색엔진에 최신 sitemap.xml 핑이 성공적으로 전송되었습니다.");
        fetchStatus();
      } else {
        setErrorMessage(result.error || "사이트맵 핑 실패");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "서버 통신 오류");
    } finally {
      setActionLoading(null);
    }
  };

  // Action: Save Service Account Key
  const handleSaveConfig = async () => {
    if (!jsonKeyInput.trim()) return;
    try {
      setActionLoading("saveKey");
      setSuccessMessage(null);
      setErrorMessage(null);

      const res = await fetch("/api/indexing/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceAccountKey: jsonKeyInput.trim() })
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSuccessMessage("Google Service Account Key가 정상 저장되어 Indexing API가 활성화되었습니다.");
        setJsonKeyInput("");
        fetchStatus();
      } else {
        setErrorMessage(result.error || "올바른 JSON 키 형식이 아닙니다.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "설정 저장 실패");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F5F9] bg-[#FAFAFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E1B2E] text-white flex items-center justify-center shadow-xs">
              <Search className="w-4 h-4 text-[#FFB199]" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#111827] leading-tight">
                구글 서치 콘솔 자동 등록 & 색인 관리
              </h3>
              <p className="text-[12px] text-[#64748B]">
                포스팅 발행 시 구글 검색 로봇(Googlebot) 및 사이트맵에 즉시 반영
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#111827] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#F1F5F9] px-6 bg-white gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 text-[14px] font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === "overview"
                ? "border-[#1E1B2E] text-[#1E1B2E]"
                : "border-transparent text-[#64748B] hover:text-[#111827]"
            }`}
          >
            색인 상태 및 빠른 실행
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 text-[14px] font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === "logs"
                ? "border-[#1E1B2E] text-[#1E1B2E]"
                : "border-transparent text-[#64748B] hover:text-[#111827]"
            }`}
          >
            최근 색인 로그
          </button>
          <button
            onClick={() => setActiveTab("setup")}
            className={`py-3 text-[14px] font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === "setup"
                ? "border-[#1E1B2E] text-[#1E1B2E]"
                : "border-transparent text-[#64748B] hover:text-[#111827]"
            }`}
          >
            API 연동 설정
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notifications */}
          {successMessage && (
            <div className="p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] rounded-xl text-[13px] flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] rounded-xl text-[13px] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Feature Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B] mb-1">
                    <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span>사이트맵 자동 갱신</span>
                  </div>
                  <div className="text-[18px] font-bold text-[#111827]">
                    {data?.stats.totalPosts || 69}편 연동 중
                  </div>
                  <div className="text-[11px] text-[#16A34A] flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>발행 즉시 자동 갱신</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B] mb-1">
                    <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>자동 색인 제출</span>
                  </div>
                  <div className="text-[18px] font-bold text-[#111827]">
                    {data?.config.totalSubmissions || 0}건 요청됨
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    Googlebot & IndexNow 핑
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B] mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>구글 색인 API</span>
                  </div>
                  <div className="text-[15px] font-bold text-[#111827]">
                    {data?.config.keyConfigured ? "공식 API 활성화" : "사이트맵 핑 연동"}
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">
                    {data?.config.keyConfigured ? "Service Account 연동" : "표준 프로토콜 작동"}
                  </div>
                </div>
              </div>

              {/* Action Buttons Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1E1B2E] to-[#2D2744] text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[16px] font-bold">1-Click 서치 콘솔 일괄 제출</h4>
                    <p className="text-[12.5px] text-slate-300 mt-0.5">
                      사이트의 모든 포스팅과 카테고리 URL을 구글 서치 콘솔에 즉시 색인 요청합니다.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={handleSubmitAll}
                    disabled={actionLoading !== null}
                    className="px-4 py-2.5 bg-[#E8745F] hover:bg-[#D6634F] text-white text-[13.5px] font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === "all" ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>전체 글 ({data?.stats.totalPosts || 69}편) 구글 서치 콘솔 색인 제출</span>
                  </button>

                  <button
                    onClick={handlePingSitemap}
                    disabled={actionLoading !== null}
                    className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[13px] font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === "ping" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>사이트맵 Ping 갱신</span>
                  </button>
                </div>
              </div>

              {/* Current Post Quick Submission (If viewing a single post) */}
              {currentPostSlug && (
                <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[11.5px] font-bold text-[#E8745F] uppercase tracking-wider">
                      현재 열람 중인 글
                    </span>
                    <h5 className="text-[14px] font-bold text-[#111827] line-clamp-1">
                      {currentPostTitle || currentPostSlug}
                    </h5>
                  </div>
                  <button
                    onClick={handleSubmitCurrentPost}
                    disabled={actionLoading !== null}
                    className="px-3.5 py-2 bg-[#1E1B2E] hover:bg-[#332D4E] text-white text-[12.5px] font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {actionLoading === "single" ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-[#FFB199]" />
                    )}
                    <span>이 글 즉시 색인 요청</span>
                  </button>
                </div>
              )}

              {/* Verified Links Info */}
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[12.5px] space-y-2">
                <div className="font-bold text-[#1E1B2E]">구글 서치 콘솔 등록 핵심 URL</div>
                <div className="space-y-1 text-[#475569]">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Sitemap URL:</span>
                    <a
                      href="/sitemap.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono text-[11.5px]"
                    >
                      https://virginroad.kr/sitemap.xml
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">RSS Feed URL:</span>
                    <a
                      href="/rss.xml"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#2563EB] hover:underline flex items-center gap-1 font-mono text-[11.5px]"
                    >
                      https://virginroad.kr/rss.xml
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LOGS */}
          {activeTab === "logs" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[13px] text-[#64748B]">
                <span>최근 서치 콘솔 및 색인 요청 내역</span>
                <button
                  onClick={fetchStatus}
                  className="flex items-center gap-1 text-[#1E1B2E] hover:underline font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>새로고침</span>
                </button>
              </div>

              {(!data?.recentLogs || data.recentLogs.length === 0) ? (
                <div className="p-8 text-center text-[#94A3B8] text-[13px] bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                  아직 기록된 색인 요청 로그가 없습니다. [색인 상태 및 빠른 실행] 탭에서 색인을 제출해 보세요.
                </div>
              ) : (
                <div className="divide-y divide-[#F1F5F9] border border-[#E2E8F0] rounded-xl overflow-hidden bg-white max-h-[360px] overflow-y-auto">
                  {data.recentLogs.map((log) => (
                    <div key={log.id} className="p-3.5 text-[12.5px] flex items-start gap-3 hover:bg-[#F8FAFC]">
                      <div className="mt-0.5 shrink-0">
                        {log.status === "success" ? (
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                        ) : log.status === "warning" ? (
                          <Clock className="w-4 h-4 text-[#F59E0B]" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-[#111827] truncate">{log.message}</span>
                          <span className="text-[11px] text-[#94A3B8] shrink-0 tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <div className="text-[11.5px] text-[#64748B] font-mono mt-0.5 truncate">
                          {log.url}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETUP */}
          {activeTab === "setup" && (
            <div className="space-y-4 text-[13px] text-[#475569]">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                <h5 className="font-bold text-[#111827] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                  구글 인덱싱 API (Google Indexing API) 설정 안내
                </h5>
                <p className="text-[12.5px] leading-relaxed">
                  Google Cloud Console에서 서비스 계정(Service Account)을 생성하고 <code className="text-[#BE123C] bg-white px-1 py-0.5 rounded border border-[#E2E8F0]">indexing.googleapis.com</code> 권한 키(JSON)를 등록하면, 포스팅 발행 시 구글 공식 API를 통해 즉시 색인이 요청됩니다.
                </p>
                <div className="text-[12px] text-[#64748B]">
                  * 키가 없어도 표준 sitemap.xml 자동 갱신 및 Ping, IndexNow 프로토콜이 정상 작동합니다.
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-[#1E1B2E]">
                  Google Service Account Key (JSON)
                </label>
                <textarea
                  value={jsonKeyInput}
                  onChange={(e) => setJsonKeyInput(e.target.value)}
                  placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "..."}'
                  rows={5}
                  className="w-full p-3 font-mono text-[12px] border border-[#CBD5E1] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E1B2E]/20 bg-white"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={!jsonKeyInput.trim() || actionLoading !== null}
                className="px-4 py-2 bg-[#1E1B2E] hover:bg-[#332D4E] text-white text-[13px] font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {actionLoading === "saveKey" ? "저장 중..." : "API 키 저장 및 활성화"}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#F1F5F9] bg-[#FAFAFC] flex items-center justify-between text-[12px] text-[#64748B]">
          <span>버진로드 실시간 색인 엔진 (Sitemap & Googlebot Ping)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#1E1B2E] font-semibold rounded-lg transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
