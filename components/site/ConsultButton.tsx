"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import ConsultForm from "./ConsultForm";

/** 상담문의 버튼 — 클릭 시 문의 작성 모달을 엽니다.
 *  모달은 portal 로 body 에 렌더해 sticky 사이드바 등 스태킹 컨텍스트에 갇히지 않게 한다. */
export default function ConsultButton({
  className,
  children,
  voyageTitle,
}: {
  className?: string;
  children: React.ReactNode;
  voyageTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <ConsultForm voyageTitle={voyageTitle} onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
}
