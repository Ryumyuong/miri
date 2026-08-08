"use client";

import { useVoyages } from "@/lib/useVoyages";
import { publishedVoyages } from "@/lib/voyage-group";
import CruiseList from "./CruiseList";

export default function CruiseListLive() {
  const { voyages, loading } = useVoyages();
  if (loading) {
    return <p className="py-16 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400" style={{ fontSize: "var(--font-base)" }}>불러오는 중…</p>;
  }
  return <CruiseList voyages={publishedVoyages(voyages)} />;
}
