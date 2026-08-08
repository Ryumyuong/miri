"use client";

import { useState } from "react";
import type { Voyage, Review } from "@/lib/types";
import { addReview, updateReview } from "@/lib/reviews";
import ImageUploader from "@/components/ImageUploader";
import { useVoyages } from "@/lib/useVoyages";
import { groupVoyages, upcomingVoyages } from "@/lib/voyage-group";

export default function ReviewForm({
  voyage,
  initial,
  onClose,
  onSubmitted,
}: {
  voyage?: Voyage;
  initial?: Review; // 지정 시 수정 모드
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [travelDate, setTravelDate] = useState(initial?.travelDate ?? "");
  const [voyageId, setVoyageId] = useState(initial?.voyageId ?? voyage?.id ?? "");
  const { voyages } = useVoyages();
  // 크루즈 일정/예약 페이지와 동일하게 상품 묶음(그룹) 단위로 선택
  const groups = groupVoyages(upcomingVoyages(voyages)).sort((a, b) =>
    (a.rep.region + a.rep.title).localeCompare(b.rep.region + b.rep.title),
  );
  const selectedVoyage = voyages.find((v) => v.id === voyageId) ?? voyage;
  const groupsByRegion = groups.reduce<Record<string, typeof groups>>((acc, g) => {
    (acc[g.rep.region] ??= []).push(g);
    return acc;
  }, {});
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [content, setContent] = useState(initial?.content ?? "");
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [consentPrivacy, setConsentPrivacy] = useState<boolean | null>(initial ? true : null);
  const [consentPromo, setConsentPromo] = useState<boolean | null>(initial?.consentPromo ?? null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author || !title || !content) return;
    if (!voyageId) {
      alert("여행지(크루즈 상품)를 선택해 주세요.");
      return;
    }
    if (consentPrivacy !== true) {
      alert("개인정보 수집·이용에 동의하셔야 후기를 등록할 수 있습니다.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        author,
        title,
        content,
        rating,
        phone: phone || undefined,
        travelDate: travelDate || undefined,
        travelDest: selectedVoyage?.title || initial?.travelDest || undefined,
        date: travelDate || initial?.date || new Date().toISOString().slice(0, 10),
        region: selectedVoyage?.region || initial?.region || "",
        ship: selectedVoyage?.shipName || initial?.ship || "",
        category: selectedVoyage?.region || initial?.category || "",
        images: images.length ? images : undefined,
        imageUrl: images[0],
        voyageId: voyageId || undefined,
        consentPrivacy: true,
        consentPromo: consentPromo === true,
      };
      if (initial) {
        await updateReview(initial.id, payload);
      } else {
        await addReview({
          ...payload,
          userId: (typeof window !== "undefined" && localStorage.getItem("miri-user-id")) || undefined,
        });
      }
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      alert("후기 등록 실패: " + (err as Error).message);
      setSaving(false);
    }
  };

  if (done) {
    return (
      <Overlay onClose={onClose}>
        <div className="py-8 text-center">
          <p className="text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw]">✅</p>
          <h2 className="mt-3 text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">후기가 등록되었습니다</h2>
          <p className="mt-2 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-500">소중한 후기 감사합니다.</p>
          <button onClick={onClose} className="mt-6 rounded-lg bg-navy px-6 py-3 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-white hover:bg-navy-dark">
            확인
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={submit}>
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-navy">{initial ? "여행후기 수정" : "여행후기 작성"}</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {/* 여행자 정보 확인 */}
        <SectionTitle>여행자 정보 확인</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="여행일자"><input type="date" className={inp} value={travelDate} onChange={(e) => setTravelDate(e.target.value)} /></Field>
          <Field label="여행지 (크루즈 상품)" required>
            <select className={inp} value={voyageId} onChange={(e) => setVoyageId(e.target.value)} required>
              <option value="">크루즈 상품을 선택하세요</option>
              {Object.entries(groupsByRegion).map(([region, gs]) => (
                <optgroup key={region} label={region}>
                  {gs.map((g) => (
                    <option key={g.rep.id} value={g.rep.id}>{g.rep.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="성함 (또는 닉네임)" required><input className={inp} value={author} onChange={(e) => setAuthor(e.target.value)} required /></Field>
          <Field label="연락처"><input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" /></Field>
        </div>

        {/* 후기 내용 */}
        <SectionTitle className="mt-6">후기 내용</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="제목" full required><input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
          <Field label="별점" full>
            <div className="flex gap-1 text-[min(1.65vw,31.68px)] max-[991px]:text-[min(5.1393vw,30.8358px)] max-[501px]:text-[6.2414vw]">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className={n <= rating ? "text-gold" : "text-slate-300"}>★</button>
              ))}
            </div>
          </Field>
          <Field label="내용" full required><textarea className={inp} rows={5} value={content} onChange={(e) => setContent(e.target.value)} required placeholder="여행 후기를 자유롭게 작성해 주세요." /></Field>
          <Field label="사진 (여러 장)" full>
            <ImageUploader multiple value={images} onChange={setImages} dir="reviews" label="후기 사진을 끌어다 놓거나 클릭하여 업로드" />
          </Field>
        </div>

        {/* 개인정보 및 마케팅 활용 취급방침 */}
        <SectionTitle className="mt-6">개인정보(처리) 및 마케팅활용 취급방침</SectionTitle>
        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] leading-relaxed text-slate-500">
          <p>아래 동의합니다 체크박스에 체크하면 개인정보 수집 및 마케팅 동의에 대해 동의한 것으로 간주합니다.</p>
          <Policy title="개인정보 수집 및 이용 목적">미리크루즈상품 여행후기 콘텐츠 제작 및 홍보, 회사의 홍보물(온라인·오프라인) 제작 및 게시</Policy>
          <Policy title="수집하는 개인정보의 항목">
            - 성명(또는 닉네임), 연락처, 사진, 영상, 음성(인터뷰 내용 포함), 여행후기 내용(글·영상·이미지 등)<br />
            - 기타 여행후기 작성 시 자발적으로 제공한 정보<br />※ 민감한 정보는 수집하지 않습니다.
          </Policy>
          <Policy title="개인정보 보유 및 이용 기간">동의일로부터 홍보 목적 달성 시까지. 단, 관련 법령에 따라 보존할 필요가 있는 경우 해당 기간 동안 보관. ※ 이용자는 언제든지 동의를 철회할 수 있으며, 철회 시 해당 자료는 즉시 또는 지체없이 사용이 중단됩니다.</Policy>
          <Policy title="홍보매체 사용 범위">동의하신 여행후기는 회사 공식 홈페이지 및 SNS채널, 온라인광고, 영상콘텐츠, 뉴스레터, 인쇄홍보물(브로셔·포스터·현수막 등), 보도자료 및 언론 홍보 콘텐츠를 통해 활용될 수 있습니다. ※ 편집 과정에서 일부 내용이 수정·가공될 수 있습니다.</Policy>
          <Policy title="동의 거부 권리 및 불이익 안내">이용자는 개인정보 수집·이용 및 홍보활용에 대한 동의를 거부할 권리가 있으며, 동의하지 않더라도 여행상품 이용에는 어떠한 불이익도 없습니다. 다만, 여행후기 홍보 콘텐츠로의 활용은 제한될 수 있습니다.</Policy>
          <p className="mt-3 font-medium text-slate-600">본인은 위 내용을 충분히 이해했으며, 미리크루즈상품 여행후기를 홍보매체에 활용하는 것에 동의합니다.</p>
        </div>

        {/* 동의 */}
        <div className="mt-4 flex flex-col gap-2">
          <ConsentRow label="개인정보 수집·이용 동의" required value={consentPrivacy} onChange={setConsentPrivacy} />
          <ConsentRow label="여행후기(사진·영상·글 등) 홍보 활용 동의" value={consentPromo} onChange={setConsentPromo} />
        </div>

        <p className="mt-3 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-slate-400">
          동의 일자: {new Date().toISOString().slice(0, 10)} · 서명: <b className="text-slate-600">{author || "성함을 입력하세요"}</b>
        </p>

        <div className="sticky bottom-0 z-10 -mx-6 mt-6 flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-slate-600 hover:bg-slate-50">취소</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-navy px-5 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold text-white hover:bg-navy-dark disabled:opacity-50">
            {saving ? "저장 중…" : initial ? "수정 완료" : "후기 등록"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" style={{ fontSize: "var(--font-base)" }} onClick={onClose}>
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white px-6 pt-6 pb-0 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-3 flex items-center gap-2 ${className}`}>
      <span className="h-4 w-1 rounded bg-brand" />
      <h3 className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-bold text-navy">{children}</h3>
    </div>
  );
}

function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="font-bold text-slate-600">{title}</p>
      <p className="mt-0.5">{children}</p>
    </div>
  );
}

function ConsentRow({
  label, required, value, onChange,
}: {
  label: string; required?: boolean; value: boolean | null; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-2.5 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]">
      <span className="font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-1.5">
          <input type="radio" checked={value === true} onChange={() => onChange(true)} className="accent-brand" /> 동의함
        </label>
        <label className="flex cursor-pointer items-center gap-1.5">
          <input type="radio" checked={value === false} onChange={() => onChange(false)} className="accent-slate-400" /> 동의하지않음
        </label>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg border border-slate-200 px-3 py-2 text-[1.25em] outline-none focus:border-brand";

function Field({ label, full, required, children }: { label: string; full?: boolean; required?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-semibold text-slate-500">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
