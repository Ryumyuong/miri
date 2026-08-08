import Link from "next/link";

/** 다크 네이비 푸터: 로고·연락처 / 링크 컬럼 / 정책·저작권. */

export default function SiteFooter() {
  return (
    <footer className="bg-[#0a0e17] py-24 text-slate-400" style={{ fontSize: "var(--font-base)" }}>
      <div className="flex w-full flex-wrap justify-between gap-10 px-[max(7.4074%,calc((100%_-_1920px)/2_+_112px))] max-[991px]:flex-col max-[991px]:gap-8">
        {/* 좌측 그룹: 로고+연락처 */}
        <div className="flex flex-wrap gap-16">
          {/* 로고 + 연락처 */}
          <div className="min-w-[14rem]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-white.png" alt="미리크루즈" className="h-7 w-auto" />
            <p className="mt-6 text-[min(1.7407vw,33.4214px)] max-[991px]:text-[min(5.4218vw,32.5308px)] max-[501px]:text-[6.5845vw] font-bold text-white">1644-8868</p>
          </div>
        </div>

        {/* 우측 그룹: 정책 + 저작권 */}
        <div className="flex min-w-[16rem] flex-col items-end justify-between max-[991px]:min-w-0 max-[991px]:items-start max-[991px]:gap-3">
          <div className="flex flex-wrap items-center gap-3 text-[min(0.9515vw,18.2688px)] max-[991px]:text-[min(2.25vw,13.5px)] font-semibold text-white/80 max-[501px]:flex-col max-[501px]:items-start max-[501px]:gap-1.5">
            {/* 1줄: 이용약관 | 개인정보취급방침 */}
            <div className="flex items-center gap-3">
              <Link href="/terms" className="hover:text-white">
                이용약관
              </Link>
              <span className="text-white/30">|</span>
              <Link href="/privacy" className="hover:text-white">
                개인정보취급방침
              </Link>
            </div>
            {/* 그룹 구분자 (접은 화면에선 줄바꿈되므로 숨김) */}
            <span className="text-white/30 max-[501px]:hidden">|</span>
            {/* 2줄: 해외여행약관 | 해외여행보험약관 | 사업자정보 */}
            <div className="flex items-center gap-3">
              <Link href="/travel-terms" className="hover:text-white">
                해외여행약관
              </Link>
              <span className="text-white/30">|</span>
              <Link href="/insurance-terms" className="hover:text-white">
                해외여행보험약관
              </Link>
              <span className="text-white/30">|</span>
              <Link href="/about" className="hover:text-white">
                사업자정보
              </Link>
            </div>
          </div>
          <p className="mt-8 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] font-normal text-white/40 max-[991px]:mt-0">
            © 2026 미리크루즈 MIRI CRUISE. All rights reserved.
          </p>
        </div>
      </div>

      {/* 사업자 정보 */}
      <div className="mt-12 w-full border-t border-white/10 px-[max(7.4074%,calc((100%_-_1920px)/2_+_112px))] pt-8 text-[min(0.825vw,15.84px)] max-[991px]:text-[min(2.5695vw,15.417px)] max-[501px]:text-[3.1206vw] leading-[1.9] text-white">
        <p>서울시 금천구 가산디지털1로 168 우림라이온스밸리 B동 1311호 <span className="text-white/40">|</span> 부산광역시 연제구 중앙대로 1066(연산동)</p>
        <p>대표이사 : 조중래 <span className="text-white/40">|</span> TEL : 1644-8868 <span className="text-white/40">|</span> FAX : 051) 441-2131</p>
        <p>사업자등록번호 : 604-81-04641 <span className="text-white/40">|</span> 방문판매업 : 제 2009-부산연제 28호 <span className="text-white/40">|</span> 통신판매업 : 제 2009-부산연제 111호 <span className="text-white/40">|</span> 대부업등록번호 : 2019-부산연제구-13016</p>
        <p>선불식 할부거래업 등록번호 : 부산-2010-3호</p>
      </div>
    </footer>
  );
}
