import type { Metadata, Viewport } from "next";
import "./globals.css";
import FloatingContact from "@/components/site/FloatingContact";
import NaverAnalytics from "@/components/NaverAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL("https://miricruise.com"),
  title: "미리크루즈 | 바다 위에서 만나는 품격있는 여정",
  description: "미리크루즈가 동행하는 프리미엄 크루즈 여행 예약 서비스",
  verification: {
    google: "ZfcKN_7QvAcnEOMgGJPZa2s86Gkwru-kjin9ZDKhUvE",
    other: {
      "naver-site-verification": "ffc0939d910e8b118a1bf0b90bcbcf1c1c36da51",
    },
  },
  openGraph: {
    title: "미리크루즈 | 바다 위에서 만나는 품격있는 여정",
    description: "미리크루즈가 동행하는 프리미엄 크루즈 여행 예약 서비스",
    url: "https://miricruise.com",
    siteName: "미리크루즈",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "미리크루즈" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "미리크루즈 | 바다 위에서 만나는 품격있는 여정",
    description: "미리크루즈가 동행하는 프리미엄 크루즈 여행 예약 서비스",
    images: ["/og-image.png"],
  },
};

// 모바일이 실제 기기 폭으로 렌더되도록 (누락 시 desktop 폭으로 렌더 → 미디어쿼리·폰트 스케일 안 먹음)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col overflow-x-clip">
        {children}
        <FloatingContact />
        <NaverAnalytics />
      </body>
    </html>
  );
}
