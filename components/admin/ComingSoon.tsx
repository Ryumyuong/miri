/** 아직 구현 전인 섹션용 자리표시자. 캡쳐를 받으면 실제 화면으로 교체합니다. */
export default function ComingSoon({ name }: { name: string }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
      <p className="text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw]">🚧</p>
      <p className="mt-3 text-[min(1.1vw,21.12px)] max-[991px]:text-[min(3.4262vw,20.5572px)] max-[501px]:text-[4.1609vw] font-semibold text-slate-700">
        “{name}” 화면 준비 중
      </p>
      <p className="mt-1 text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] text-slate-400">
        이 섹션의 캡쳐를 보내주시면 디자인대로 채워드릴게요.
      </p>
    </div>
  );
}
