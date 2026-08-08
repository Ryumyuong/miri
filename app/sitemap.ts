import type { MetadataRoute } from "next";
import { GUIDE_TOPICS } from "@/lib/guide-content";

const BASE = "https://miricruise.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const page = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly" | "yearly",
  ): MetadataRoute.Sitemap[number] => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    page("/", 1, "daily"),
    page("/cruises", 0.9, "daily"),
    page("/prime", 0.8, "weekly"),
    page("/guide", 0.7, "weekly"),
    page("/reviews", 0.7, "weekly"),
    page("/about", 0.6, "monthly"),
    page("/faq", 0.6, "monthly"),
    page("/reservation", 0.5, "monthly"),
    page("/terms", 0.3, "yearly"),
    page("/privacy", 0.3, "yearly"),
    page("/travel-terms", 0.3, "yearly"),
    page("/insurance-terms", 0.3, "yearly"),
    // 크루즈 가이드 상세 (정적 슬러그)
    ...GUIDE_TOPICS.map((t) => page(`/guide/${t.slug}`, 0.6, "monthly")),
  ];
}
