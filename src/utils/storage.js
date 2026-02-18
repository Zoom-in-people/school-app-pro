import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// 파일 업로드
export const uploadFileToStorage = async (file, folderName) => {
  if (!file) throw new Error("파일이 없습니다.");
  
  // 파일명 중복 방지를 위해 타임스탬프 추가
  const uniqueName = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `${folderName}/${uniqueName}`);
  
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  
  return {
    name: file.name,
    fullPath: snapshot.ref.fullPath, // 삭제할 때 필요
    url: url
  };
};

// 파일 삭제
export const deleteFileFromStorage = async (fullPath) => {
  if (!fullPath) return;
  const fileRef = ref(storage, fullPath);
  try {
    await deleteObject(fileRef);
  } catch (error) {
    console.error("파일 삭제 실패:", error);
  }
};