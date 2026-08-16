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
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const seconds = String(d.getSeconds()).padStart(2, "0");
      return `${year}. ${month}. ${day} ${hours}:${minutes}:${seconds}`;
    }
  }

  // Parse YYYY-MM-DD or YYYY.MM.DD
  const cleanDate = dateStr.replace(/\./g, "-").trim();
  const parts = cleanDate.split("-");
  if (parts.length >= 3) {
    const year = parts[0];
    const month = parts[1].padStart(2, "0");
    const day = parts[2].padStart(2, "0");

    // Generate deterministic time (hh:mm:ss) from id and date if only date is present
    let seed = 0;
    const strToHash = (id || "") + dateStr;
    for (let i = 0; i < strToHash.length; i++) {
      seed = (seed * 31 + strToHash.charCodeAt(i)) >>> 0;
    }
    const hour = String(9 + (seed % 13)).padStart(2, "0"); // 09:00 ~ 21:00
    const minute = String((seed >> 4) % 60).padStart(2, "0");
    const second = String((seed >> 8) % 60).padStart(2, "0");

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
