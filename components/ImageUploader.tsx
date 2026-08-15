"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/upload";

/** 업로드 규격 (storage.rules 와 일치) */
const MAX_IMAGE_MB = 100;
const MAX_VIDEO_MB = 500;
// 개수 안내는 업로더 모드에 따라 달라진다 — 단일 업로더에 "개수 제한 없음"이 뜨면 안 됨
const countSpec = (multiple?: boolean, video?: boolean) =>
  multiple ? "개수 제한 없음" : `1${video ? "개" : "장"}만 등록 (새로 올리면 교체됩니다)`;
export const UPLOAD_SPEC = `JPG · PNG · WEBP · GIF / 파일당 최대 ${MAX_IMAGE_MB}MB`;
const VIDEO_SPEC = `MP4 · MOV · WEBM · MKV / 파일당 최대 ${MAX_VIDEO_MB}MB`;

type SingleProps = {
  multiple?: false;
  value?: string;
  onChange: (v: string | undefined) => void;
};
type MultiProps = {
  multiple: true;
  value: string[];
  onChange: (v: string[]) => void;
};
type Props = (SingleProps | MultiProps) & {
  dir?: string; // Storage 폴더
  label?: string; // 안내 라벨(드롭존 안 문구)
  className?: string;
  video?: boolean; // true면 영상 파일 업로드 모드
  /** 드롭존 안내문 글자 크기 — 관리자 모달처럼 고정 px 스케일을 쓰는 곳에서 넘긴다.
   *  미지정 시 사이트 기본(vw) 크기. */
  textClass?: string;
};

const DEFAULT_TEXT =
  "text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw]";

export default function ImageUploader(props: Props) {
  const {
    dir = "uploads",
    label = "이미지를 끌어다 놓거나 클릭하여 업로드",
    className = "",
    textClass = DEFAULT_TEXT,
  } = props;
  const items = props.multiple ? props.value ?? [] : props.value ? [props.value] : [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (fileList: FileList | null) => {
    const all = Array.from(fileList ?? []);
    if (all.length === 0) return;
    const kind = props.video ? "video/" : "image/";
    const images = all.filter((f) => f.type.startsWith(kind));
    if (images.length === 0) {
      setError(`${props.video ? "영상" : "이미지"} 파일만 업로드할 수 있습니다.`);
      return;
    }
    const maxMb = props.video ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    const tooBig = images.find((f) => f.size > maxMb * 1024 * 1024);
    if (tooBig) {
      setError(`파일당 최대 ${maxMb}MB까지 업로드할 수 있습니다. (${tooBig.name})`);
      return;
    }
    setError("");
    setUploading(true);
    try {
      const urls = await Promise.all(images.map((f) => uploadImage(f, dir)));
      if (props.multiple) props.onChange([...(props.value ?? []), ...urls]);
      else props.onChange(urls[urls.length - 1]);
    } catch (e) {
      setError("업로드 실패: " + (e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (i: number) => {
    if (props.multiple) props.onChange(props.value.filter((_, idx) => idx !== i));
    else props.onChange(undefined);
  };

  // 순서 변경 (다중 모드)
  const moveAt = (i: number, dir: -1 | 1) => {
    if (!props.multiple) return;
    const j = i + dir;
    if (j < 0 || j >= props.value.length) return;
    const arr = [...props.value];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    props.onChange(arr);
  };

  return (
    <div className={className}>
      {items.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {items.map((url, i) => (
            <div key={url} className="relative">
              {props.video ? (
                <video src={url} className="h-20 w-28 rounded-lg border border-slate-200 object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={`이미지 ${i + 1}`} className="h-20 w-28 rounded-lg border border-slate-200 object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="삭제"
                className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] text-white shadow"
              >
                ✕
              </button>
              {props.multiple && items.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between rounded-b-lg bg-black/50 px-1 py-0.5 text-[min(0.77vw,14.784px)] max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.9126vw] text-white">
                  <button type="button" onClick={() => moveAt(i, -1)} disabled={i === 0} className="px-1 disabled:opacity-30" aria-label="앞으로">◀</button>
                  <span className="text-[0.9em] font-semibold">{i + 1}</span>
                  <button type="button" onClick={() => moveAt(i, 1)} disabled={i === items.length - 1} className="px-1 disabled:opacity-30" aria-label="뒤로">▶</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-5 text-center transition ${textClass} ${
          dragOver ? "border-brand bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        }`}
      >
        <span className="text-[1.35em]">{uploading ? "⏳" : "⬆"}</span>
        <p className="font-semibold text-slate-600">
          {uploading ? "업로드 중…" : props.multiple ? `${label}${items.length ? " (추가)" : ""}` : items.length ? "이미지 변경 — 끌어다 놓거나 클릭" : label}
        </p>
        <p className="text-[0.86em] text-slate-400">
          {props.video ? VIDEO_SPEC : UPLOAD_SPEC} · {countSpec(props.multiple, props.video)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={props.video ? "video/*" : "image/*"}
          multiple={props.multiple}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={uploading}
        />
      </div>

      {error && <p className="mt-1 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-medium text-red-500">{error}</p>}
    </div>
  );
}
