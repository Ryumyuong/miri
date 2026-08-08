"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useVoyages } from "@/lib/useVoyages";
import ItineraryEditor from "@/components/admin/ItineraryEditor";

export default function ItineraryEditorPage() {
  const params = useParams();
  const id = String(params.id);
  const { voyages, loading } = useVoyages();
  const v = voyages.find((x) => x.id === id);

  if (loading) {
    return <p className="py-16 text-center text-sm text-slate-400">불러오는 중…</p>;
  }
  if (!v) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-400">일정을 찾을 수 없습니다.</p>
        <Link href="/admin/voyages" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">
          ← 운항 일정 목록
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ItineraryEditor voyage={v} />
    </div>
  );
}
