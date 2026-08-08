import Link from "next/link";
import { GUIDE_TOPICS } from "@/lib/guide-content";

function Icon({ name }: { name: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/icons/guide-grid/${name}.png`} alt="" className="h-7 w-7 object-contain" />
  );
}

export default function GuideGrid() {
  return (
    <div className="grid w-full grid-cols-4 gap-6 px-[max(10.7143%,calc((100%_-_1920px)/2_+_162px))] max-[991px]:grid-cols-2 max-[501px]:grid-cols-1 max-[991px]:gap-4 max-[991px]:px-[4%]" style={{ fontSize: "var(--font-base)" }}>
      {GUIDE_TOPICS.map((g) => (
        <Link
          key={g.slug}
          href={`/guide/${g.slug}`}
          className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(11,42,74,0.35)]"
        >
          <div className="aspect-[16/9] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={g.image}
              alt={g.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
          <div className="flex items-center gap-4 p-6 max-[991px]:flex-col max-[991px]:items-start max-[991px]:gap-3 max-[501px]:p-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 text-navy max-[501px]:h-11 max-[501px]:w-11">
              <Icon name={g.icon} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[min(1.2375vw,23.76px)] max-[991px]:text-[min(3.8543vw,23.1258px)] max-[501px]:text-[4.6808vw] font-bold text-[#0B2A4A]">{g.title}</h3>
              <p className="mt-1 text-[min(0.8855vw,17.0016px)] max-[991px]:text-[min(2.758vw,16.548px)] max-[501px]:text-[3.3495vw] font-medium leading-snug text-[#5A6B7E]">{g.desc}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
