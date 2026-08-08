import { redirect } from "next/navigation";

// 예약 관리 탭은 '운항 일정 운영'으로 통합됨 — 상품 선택 후 승객 명단에서 예약코드(일행)별 관리
export default function AdminReservationsPage() {
  redirect("/admin/voyages");
}
