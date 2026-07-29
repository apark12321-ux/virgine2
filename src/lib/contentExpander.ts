/**
 * 블로그 포스팅 본문 유틸리티
 * - 각 포스팅의 고유한 본문 콘텐츠를 반환하고, 불필요한 중복 템플릿/부록의 자동 결합을 방지합니다.
 */

export function getCharCountNoSpaces(html: string): number {
  if (!html) return 0;
  const cleanText = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  return cleanText.length;
}

export function expandContentIfNeeded(
  title: string,
  category: "신혼금융" | "신혼가전" | "결혼준비",
  hashtags: string[] = [],
  originalContent: string = "",
  id: string = "",
  postImage: string = ""
): string {
  if (originalContent && originalContent.trim().length > 50) {
    return originalContent.trim();
  }

  return `
    <p>결혼을 앞둔 신혼부부의 새로운 시작을 축하드립니다. 오늘 다루어볼 핵심 주제는 <strong>"${title}"</strong>입니다.</p>
    <p>버진로드 편집부에서는 신혼부부의 주거 안정과 합리적인 금융 생활을 돕기 위해 정책 기준과 공식 자료에 근거한 실전 정보를 전달해 드립니다.</p>
  `.trim();
}
