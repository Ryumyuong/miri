/**
 * HTML 본문의 텍스트 속 URL(https://… · www.…)을 파란색 링크로 바꿉니다.
 * 태그 안(속성)과 이미 <a> 안에 있는 텍스트는 건드리지 않습니다.
 */
const URL_RE = /((?:https?:\/\/|www\.)[^\s<]+[^\s<.,;:!?'")\]])/g;

const LINK_CLASS = "text-[#2563EB] underline underline-offset-2 break-all hover:text-[#1D4ED8]";

export function linkify(html: string): string {
  let inAnchor = 0;
  return html
    .split(/(<[^>]*>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        if (/^<a[\s>]/i.test(part)) inAnchor++;
        else if (/^<\/a>/i.test(part)) inAnchor = Math.max(0, inAnchor - 1);
        return part;
      }
      if (inAnchor) return part;
      return part.replace(URL_RE, (url) => {
        const href = url.startsWith("www.") ? `https://${url}` : url;
        return `<a href="${href.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer" class="${LINK_CLASS}">${url}</a>`;
      });
    })
    .join("");
}
