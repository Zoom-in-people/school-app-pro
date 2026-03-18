import { uploadImageToDrive, deleteFileFromDrive } from './googleDrive';

export const uploadFileToStorage = async (file, pathPrefix) => {
  // 사용자의 개인 구글 드라이브에 파일을 저장합니다.
  return await uploadImageToDrive(file);
};

// 🔥 [추가된 부분] 구글 드라이브에서 파일 삭제 처리
export const deleteFileFromStorage = async (fullPath) => {
  return await deleteFileFromDrive(fullPath);
};