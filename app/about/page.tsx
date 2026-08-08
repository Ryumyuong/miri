import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";

export const metadata = {
  title: "회사소개 | 미리크루즈",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader solid />

      <main className="flex-1 overflow-x-hidden pt-52 pb-32 max-[991px]:pt-24 max-[991px]:pb-16">
        <div className="mb-10 text-center max-[991px]:px-5">
          <p className="text-[min(0.9625vw,18.48px)] font-semibold tracking-[0.35em] text-gold max-[991px]:text-[min(2.3983vw,14.3898px)] max-[501px]:text-[2.4757vw]">ABOUT MIRI CRUISE</p>
          <h1 className="mt-3 text-[min(2.0625vw,39.6px)] font-black text-navy max-[991px]:text-[min(4.7966vw,28.7796px)] max-[501px]:text-[4.6602vw]">회사소개</h1>
        </div>

        <div className="mx-auto mt-24 w-full px-5 max-[991px]:mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/about-company.jpg" alt="미리크루즈 회사소개" className="mx-auto block h-auto w-full max-w-[800px]" />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
