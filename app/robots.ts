import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 관리자·API는 색인 제외
      disallow: ["/admin", "/api"],
    },
    sitemap: "https://miricruise.com/sitemap.xml",
    host: "https://miricruise.com",
  };
}
