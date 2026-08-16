import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateReadTime(content: string): string {
  const charactersPerMinute = 500;
  // Remove HTML tags if any (basic check)
  const plainText = content.replace(/<[^>]*>/g, "");
  const minutes = Math.ceil(plainText.length / charactersPerMinute);
  return `${minutes}분`;
}

/**
 * 포스트 날짜와 시, 분, 초를 YYYY. MM. DD HH:mm:ss 형식으로 포맷팅
 */
export function formatPostDateTime(dateStr: string, id?: string): string {
  if (!dateStr) return "";

  // Check if dateStr already has time component (e.g. ISO format or includes ":")
  if (dateStr.includes(":") || dateStr.includes("T")) {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"));
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}. ${month}. ${day} ${hours}:${minutes}:${seconds}`;
    }
    const match = dateStr.match(/^(\d{4})[.-](\d{2})[.-](\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?/);
    if (match) {
      return `${match[1]}. ${match[2]}. ${match[3]} ${match[4]}:${match[5]}:${match[6] || "00"}`;
    }
  }

  // Parse YYYY-MM-DD or YYYY.MM.DD
  const cleanDate = dateStr.replace(/\./g, "-").trim();
  const parts = cleanDate.split("-");
  if (parts.length >= 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");

    // Generate deterministic positive time (hh:mm:ss) from id and date if only date is present
    let seed = 0;
    const strToHash = (id || "") + dateStr;
    for (let i = 0; i < strToHash.length; i++) {
      seed = ((seed << 5) - seed + strToHash.charCodeAt(i)) | 0;
    }
    const positiveSeed = Math.abs(seed);
    const hour = String(9 + (positiveSeed % 13)).padStart(2, "0"); // 09:00 ~ 21:00
    const minute = String(Math.floor(positiveSeed / 13) % 60).padStart(2, "0");
    const second = String(Math.floor(positiveSeed / 780) % 60).padStart(2, "0");

    return `${year}. ${month}. ${day} ${hour}:${minute}:${second}`;
  }

  return dateStr;
}

/**
 * 제목을 URL 친화적 slug로 변환.
 * - 영문/한글/숫자/하이픈만 남김 (한글 그대로 유지)
 * - 공백 → 하이픈
 * - 특수문자 제거
 * - 연속 하이픈 정리
 * - 최대 80자 (너무 긴 URL 방지)
 */
export function slugify(title: string): string {
  if (!title) return "";
  return title
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\uAC00-\uD7A3\-]/g, "") // 영숫자, 한글, 하이픈만
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 25)
    .replace(/-+$/g, ""); // slice 후 끝에 하이픈 남으면 제거
}

/**
 * HTML 태그를 제거하고 일반 텍스트만 반환.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * 게시글의 날짜 문자열(YYYY-MM-DD, YYYY. MM. DD, ISO 등)을 파싱하여 정렬용 밀리초 타임스탬프로 안전하게 변환
 */
export function parsePostTimestamp(dateStr: string, id?: string): number {
  if (!dateStr) return 0;

  // 1. ISO 또는 시:분 형식이 포함된 경우
  if (dateStr.includes("T") || dateStr.includes(":")) {
    const d = new Date(dateStr.includes("T") ? dateStr : dateStr.replace(" ", "T"));
    if (!isNaN(d.getTime())) {
      return d.getTime();
    }
  }

  // 2. YYYY-MM-DD, YYYY.MM.DD, YYYY. MM. DD 등 표준 일자 파싱
  const clean = dateStr.replace(/\./g, "-").replace(/\s+/g, "").trim();
  const parts = clean.split("-").map(p => parseInt(p, 10));
  if (parts.length >= 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    const year = parts[0];
    const month = parts[1] - 1;
    const day = parts[2];

    let extraSeconds = 0;
    if (id) {
      let seed = 0;
      const strToHash = id + dateStr;
      for (let i = 0; i < strToHash.length; i++) {
        seed = ((seed << 5) - seed + strToHash.charCodeAt(i)) | 0;
      }
      const positiveSeed = Math.abs(seed);
      const hour = 9 + (positiveSeed % 13);
      const minute = Math.floor(positiveSeed / 13) % 60;
      const second = Math.floor(positiveSeed / 780) % 60;
      extraSeconds = (hour * 3600 + minute * 60 + second);
    }

    return new Date(year, month, day).getTime() + extraSeconds * 1000;
  }

  const fallback = new Date(dateStr).getTime();
  return isNaN(fallback) ? 0 : fallback;
}
