import Link from "next/link";
import DashboardCalendar from "@/components/admin/DashboardCalendar";

export default function AdminDashboardPage() {
  return (
    <div>
      <Link
        href="/admin"
        className="mb-6 inline-flex items-center gap-1.5 text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] font-medium text-slate-500 transition hover:text-navy"
      >
        ← 대시보드로 돌아가기
      </Link>
      <DashboardCalendar />
    </div>
  );
}
