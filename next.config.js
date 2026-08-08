/** @type {import('next').NextConfig} */
const nextConfig = {
  // 개발 중 cloudflare 터널(trycloudflare.com)에서 /_next dev 리소스 접근 허용
  allowedDevOrigins: ["*.trycloudflare.com"],
  // 배포용 최소 실행 번들(.next/standalone/server.js) 생성 — node server.js 로 구동
  output: "standalone",
};

module.exports = nextConfig;
