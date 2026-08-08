"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMember, updateMember } from "@/lib/members";
import { uploadImage } from "@/lib/upload";

export default function MyPage() {
  const [memberId, setMemberId] = useState<string | null | undefined>(undefined); // undefined=로딩
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [passportImage, setPassportImage] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("miri-user-id");
    if (!id) {
      setMemberId(null);
      return;
    }
    setMemberId(id);
    getMember(id).then((m) => {
      if (!m) return;
      setName(m.name ?? "");
      setPhone(m.phone ?? "");
      setPassportNumber(m.passportNumber ?? "");
      setPassportExpiry(m.passportExpiry ?? "");
      setPassportImage(m.passportImage);
    });
  }, []);

  const onPickPassport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setUploading(true);
    try {
      setPassportImage(await uploadImage(file, "passports"));
    } catch (err) {
      alert("업로드 실패: " + (err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;
    setSaving(true);
    try {
      await updateMember(memberId, {
        name: name || undefined,
        phone: phone || undefined,
        passportNumber: passportNumber || undefined,
        passportExpiry: passportExpiry || undefined,
        passportImage,
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2500);
    } catch (err) {
      alert("저장 실패: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (memberId === undefined) {
    return <p className="py-20 text-center text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">불러오는 중…</p>;
  }
  if (memberId === null) {
    return (
      <div className="mx-auto w-full max-w-md px-5 py-16 text-center">
        <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">로그인이 필요한 페이지입니다.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-navy px-6 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark">
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="mx-auto w-full max-w-xl px-5" style={{ fontSize: "var(--font-base)" }}>
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm max-[501px]:p-5">
        <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">회원 정보</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 max-[501px]:grid-cols-1">
          <Field label="이름">
            <input className={inp} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="연락처">
            <input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
          </Field>
        </div>

        <h2 className="mt-8 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">여권 정보</h2>
        <p className="mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
          저장해 두면 가예약 신청 시 자동으로 입력됩니다.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 max-[501px]:grid-cols-1">
          <Field label="여권번호">
            <input className={inp} value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} placeholder="M12345678" />
          </Field>
          <Field label="여권 만료일">
            <input type="date" className={inp} value={passportExpiry} onChange={(e) => setPassportExpiry(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">여권 스캔</label>
          <div className="flex items-center gap-4">
            {passportImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={passportImage} alt="여권 스캔" className="h-24 w-32 shrink-0 rounded-lg border border-slate-200 object-cover" />
            ) : (
              <div className="grid h-24 w-32 shrink-0 place-items-center rounded-lg border border-dashed border-slate-300 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
                스캔 미리보기
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">
                {uploading ? "업로드 중…" : passportImage ? "스캔 변경" : "여권 스캔 업로드"}
                <input type="file" accept="image/*" className="hidden" onChange={onPickPassport} disabled={uploading} />
              </label>
              {passportImage && (
                <button type="button" onClick={() => setPassportImage(undefined)} className="w-fit text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-red-500 hover:underline">
                  스캔 제거
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          {savedMsg ? (
            <span className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-emerald-600">✓ 저장되었습니다</span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="rounded-lg bg-navy px-6 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white transition hover:bg-navy-dark disabled:opacity-50"
          >
            {saving ? "저장 중…" : "저장하기"}
          </button>
        </div>
      </div>
    </form>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-4 py-3 text-[1.25em] outline-none focus:border-brand";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">{label}</label>
      {children}
    </div>
  );
}
