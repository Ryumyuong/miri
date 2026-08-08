"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const adminNav = [
  { href: "/admin", label: "대시보드", icon: "/admin-icons/dashboard.png" },
  { href: "/admin/voyages", label: "운항 일정 운영", icon: "/admin-icons/voyages.png" },
  { href: "/admin/itinerary", label: "여행 일정 관리", icon: "/admin-icons/itinerary.png" },
  { href: "/admin/prime", label: "프라임 상품 관리", icon: "/admin-icons/voyages.png" },
  { href: "/admin/ports", label: "관광정보 카드 관리", icon: "/admin-icons/ports.png" },
  { href: "/admin/ships", label: "선박 카드 관리", icon: "/admin-icons/ships.png" },
  { href: "/admin/payments", label: "결제 관리", icon: "/admin-icons/payments.png" },
  { href: "/admin/consults", label: "상담 관리", icon: "/admin-icons/consults.png" },
  { href: "/admin/reviews", label: "후기 관리", icon: "/admin-icons/consults.png" },
  { href: "/admin/members", label: "회원 관리", icon: "/admin-icons/consults.png" },
  { href: "/admin/alerts", label: "알림 현황", icon: "/admin-icons/alerts.png" },
  { href: "/admin/settings", label: "시스템 설정", icon: "/admin-icons/settings.png" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 pr-5 max-[991px]:w-full max-[991px]:border-b max-[991px]:border-r-0 max-[991px]:pb-3 max-[991px]:pr-0">
      {/* 데스크톱: 스크롤 시 메뉴가 따라오도록 sticky. 모바일(가로 스크롤 바)은 static */}
      <div className="sticky top-8 max-[991px]:static max-[991px]:top-auto">
      <div className="mb-5 border-b border-slate-200 pb-4 max-[991px]:hidden">
        <p className="text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-bold text-slate-800">관리자</p>
        <p className="text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">미리크루즈</p>
      </div>
      <nav className="flex flex-col gap-1 max-[991px]:flex-row max-[991px]:gap-2 max-[991px]:overflow-x-auto max-[991px]:pb-1 [&::-webkit-scrollbar]:hidden">
        {adminNav.map((item) => {
          // 일정 편집 경로(/admin/voyages/[id]/itinerary)는 '여행 일정 관리' 탭으로 취급
          const onItineraryEdit =
            pathname.startsWith("/admin/voyages/") && pathname.endsWith("/itinerary");
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : item.href === "/admin/itinerary"
                ? pathname.startsWith("/admin/itinerary") || onItineraryEdit
                : item.href === "/admin/voyages"
                  ? pathname.startsWith("/admin/voyages") && !onItineraryEdit
                  : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] transition max-[991px]:shrink-0 max-[991px]:whitespace-nowrap ${
                active
                  ? "bg-[#1E4D8B] font-semibold text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                width={18}
                height={18}
                className={`h-[18px] w-[18px] shrink-0 ${active ? "brightness-0 invert" : ""}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
      </div>
    </aside>
  );
}
