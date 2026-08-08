import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import TravelTerms from "@/components/site/TravelTerms";

export const metadata = {
  title: "해외여행약관 | 미리크루즈",
};

export default function TravelTermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#eef1f6]">
      <SiteHeader solid />
      <main className="flex-1 pt-52 pb-52 max-[991px]:pt-16 max-[991px]:pb-16" style={{ fontSize: "var(--font-base)" }}>
        <div className="mb-10 text-center">
          <p className="text-[min(0.9625vw,18.48px)] max-[991px]:text-[min(2.9979vw,17.9874px)] max-[501px]:text-[3.6407vw] font-semibold tracking-[0.35em] text-gold">TRAVEL TERMS</p>
          <h1 className="mt-3 text-[min(2.0625vw,39.6px)] max-[991px]:text-[min(6.4241vw,38.5446px)] max-[501px]:text-[7.8017vw] font-black text-navy">해외여행약관</h1>
        </div>
        <TravelTerms />
      </main>
      <SiteFooter />
    </div>
  );
}
