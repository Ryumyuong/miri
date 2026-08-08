"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/lib/types";
import { useSettings, saveSettings } from "@/lib/settings";

export default function SettingsForm() {
  const { settings, loading } = useSettings();
  const [f, setF] = useState<SiteSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 최초 로드 시 폼 초기화
  useEffect(() => {
    if (!loading) setF(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const set = (k: keyof SiteSettings, v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings(f);
      setSaved(true);
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw] font-bold text-slate-800">시스템 설정</h1>
        <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
          사이트 기본 정보를 설정합니다
        </p>
      </div>

      <form onSubmit={save} className="max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
        <Field label="회사명">
          <input className={inp} value={f.companyName} onChange={(e) => set("companyName", e.target.value)} />
        </Field>
        <Field label="대표 전화">
          <input className={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="이메일">
          <input className={inp} value={f.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="주소">
          <input className={inp} value={f.address} onChange={(e) => set("address", e.target.value)} />
        </Field>
        <Field label="운영 시간">
          <input className={inp} value={f.businessHours} onChange={(e) => set("businessHours", e.target.value)} />
        </Field>

        <div className="mt-6 flex items-center gap-3">
          <button type="submit" disabled={saving} className="rounded-lg bg-navy px-6 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark disabled:opacity-50">
            {saving ? "저장 중…" : "저장"}
          </button>
          {saved && <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-medium text-emerald-600">✓ 저장되었습니다</span>}
        </div>
      </form>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-[1.25em] outline-none focus:border-brand";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
