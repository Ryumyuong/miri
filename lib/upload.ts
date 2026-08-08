import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

/**
 * 이미지 파일을 Firebase Storage 에 업로드하고 다운로드 URL 을 반환합니다.
 * @param file  업로드할 파일
 * @param dir   저장 폴더 (기본: "voyages")
 */
export async function uploadImage(file: File, dir = "voyages"): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  // 충돌 방지를 위해 타임스탬프 + 랜덤 토큰으로 파일명 구성
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const path = `${dir}/${token}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return getDownloadURL(storageRef);
}
