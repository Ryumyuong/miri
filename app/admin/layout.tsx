import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminGate, { AdminLogout } from "@/components/admin/AdminGate";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#F5F7F9] pb-56 pt-20 text-[16px] max-[991px]:pb-16 max-[991px]:pt-10 max-[991px]:!text-[13px]">
      <div className="mx-auto w-full max-w-[1800px] max-[991px]:px-4">
        {/* 로그인해야 관리자 화면 노출 (미로그인 시 회원 로그인으로 이동 — 관리자 화면 깜빡임 없음) */}
        <AdminGate>
          {/* 상단 로고 */}
          <div className="mb-12 flex justify-center max-[991px]:mb-6">
            <BrandLogo variant="admin" href="/admin" />
          </div>

          {/* 카드 컨테이너 (sticky 사이드바를 위해 overflow-hidden 제거 — 조상이 클립하면 sticky 무효) */}
          <div className="rounded-2xl bg-white shadow-sm">
            {/* 헤더 바 */}
            <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5 max-[991px]:px-4">
              <Link
                href="/"
                className="text-[min(0.9944vw,19.0925px)] max-[991px]:text-[min(3.0972vw,18.5832px)] max-[501px]:text-[3.7613vw] font-medium text-[#1E4D8B] transition hover:opacity-80"
              >
                ← 홈으로 돌아가기
              </Link>
              <AdminLogout />
            </div>

            {/* 본문: 사이드바 + 페이지 */}
            <div className="flex gap-7 px-8 py-8 max-[991px]:flex-col max-[991px]:gap-4 max-[991px]:px-4 max-[991px]:py-4">
              <AdminSidebar />
              <main className="min-w-0 flex-1">{children}</main>
            </div>
          </div>
        </AdminGate>
      </div>
    </div>
  );
}
