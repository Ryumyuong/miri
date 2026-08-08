import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

const COL = "members";

async function hash(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type Member = {
  id: string;
  name: string;
  phone?: string;
  engLast?: string; // 영문 성
  engFirst?: string; // 영문 이름
  gender?: string; // 남자 / 여자
  birth?: string; // 생년월일 YYYY-MM-DD
  zip?: string; // 우편번호
  addr1?: string; // 기본주소
  addr2?: string; // 상세주소
  email?: string;
  emailConsent?: boolean; // 이메일 수신 동의
  smsConsent?: boolean; // SMS 수신 동의
  passportNumber?: string;
  passportExpiry?: string;
  passportImage?: string;
  createdAt?: number; // 가입 시각 (ms epoch)
};

function toMember(id: string, d: Record<string, unknown>): Member {
  const s = (k: string) => (d[k] as string | undefined) || undefined;
  return {
    id,
    name: (d.name as string) ?? "",
    phone: s("phone"),
    engLast: s("engLast"),
    engFirst: s("engFirst"),
    gender: s("gender"),
    birth: s("birth"),
    zip: s("zip"),
    addr1: s("addr1"),
    addr2: s("addr2"),
    email: s("email"),
    emailConsent: (d.emailConsent as boolean | undefined) ?? undefined,
    smsConsent: (d.smsConsent as boolean | undefined) ?? undefined,
    passportNumber: s("passportNumber"),
    passportExpiry: s("passportExpiry"),
    passportImage: s("passportImage"),
    createdAt: (d.createdAt as number | undefined) ?? undefined,
  };
}

/** 회원 단건 조회 (없으면 null). */
export async function getMember(id: string): Promise<Member | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return toMember(id, snap.data());
}

/** 전체 회원 목록 (관리자용). */
export async function getMembers(): Promise<Member[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => toMember(d.id, d.data()));
}

/** 회원 삭제 (관리자용). */
export async function deleteMember(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

/** 회원 정보 수정 (이름·연락처·여권 등). undefined 필드는 제외. */
export async function updateMember(
  id: string,
  data: Partial<Omit<Member, "id">>,
): Promise<void> {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
  if (Object.keys(clean).length === 0) return;
  await setDoc(doc(db, COL, id), clean, { merge: true });
}

/** 회원 계정에 여권 정보 저장 (재사용용). */
export async function saveMemberPassport(
  id: string,
  passport: { passportNumber?: string; passportExpiry?: string; passportImage?: string },
): Promise<void> {
  const data = Object.fromEntries(
    Object.entries(passport).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(data).length === 0) return;
  await setDoc(doc(db, COL, id), data, { merge: true });
}

export type SignupInput = {
  id: string;
  pw: string;
  name: string;
  phone?: string;
  engLast?: string;
  engFirst?: string;
  gender?: string;
  birth?: string;
  zip?: string;
  addr1?: string;
  addr2?: string;
  email?: string;
  emailConsent?: boolean;
  smsConsent?: boolean;
};

/** 아이디 사용 가능 여부 (true=사용 가능). */
export async function checkIdAvailable(id: string): Promise<boolean> {
  if (!id) return false;
  const snap = await getDoc(doc(db, COL, id));
  return !snap.exists();
}

/** 회원가입 — 아이디 중복 시 예외. */
export async function signupMember(input: SignupInput): Promise<void> {
  const ref = doc(db, COL, input.id);
  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error("이미 사용 중인 아이디입니다.");
  const { id, pw, ...rest } = input;
  const data = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined && v !== ""));
  await setDoc(ref, {
    ...data,
    pwHash: await hash(pw),
    createdAt: Date.now(),
  });
}

/** 아이디 찾기 — 이름+이메일 일치 회원의 아이디 반환(없으면 null). */
export async function findMemberId(name: string, email: string): Promise<string | null> {
  const snap = await getDocs(query(collection(db, COL), where("name", "==", name), where("email", "==", email)));
  return snap.empty ? null : snap.docs[0].id;
}

/** 비밀번호 찾기 검증 — 아이디+이름+이메일 일치 시 true. */
export async function verifyForReset(id: string, name: string, email: string): Promise<boolean> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return false;
  const d = snap.data();
  return d.name === name && d.email === email;
}

/** 비밀번호 재설정. */
export async function resetPassword(id: string, newPw: string): Promise<void> {
  await setDoc(doc(db, COL, id), { pwHash: await hash(newPw) }, { merge: true });
}

/** 로그인 — 성공 시 회원 정보, 실패 시 null. */
export async function loginMember(
  id: string,
  pw: string,
): Promise<Member | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  const d = snap.data();
  if (d.pwHash !== (await hash(pw))) return null;
  return toMember(id, d);
}
