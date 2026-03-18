import { uploadImageToDrive } from './googleDrive';

export const uploadFileToStorage = async (file, pathPrefix) => {
  // 사용자의 개인 구글 드라이브에 사진을 저장합니다.
  return await uploadImageToDrive(file);
};