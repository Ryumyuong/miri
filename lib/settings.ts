"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { SiteSettings } from "./types";

const REF = () => doc(db, "settings", "site");

export const defaultSettings: SiteSettings = {
  companyName: "미리크루즈",
  phone: "1644-8868",
  email: "master@aidclub.com",
  address: "서울시 강남구 테헤란로 미리크루즈 본사",
  businessHours: "평일 09:00 ~ 18:00",
};

export async function saveSettings(data: SiteSettings) {
  await setDoc(REF(), data, { merge: true });
}

/** 설정 실시간 구독 (없으면 기본값). */
export function useSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(REF(), (snap) => {
      if (snap.exists()) {
        setSettings({ ...defaultSettings, ...(snap.data() as Partial<SiteSettings>) });
      } else {
        setSettings(defaultSettings);
      }
      setLoading(false);
    });
    return unsub;
  }, []);
  return { settings, loading };
}
