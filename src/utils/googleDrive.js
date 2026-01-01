// src/utils/googleDrive.js

const G_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const G_UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

// 🔥 [핵심 수정] 이제 토큰을 localStorage에서 먼저 찾습니다.
const getToken = () => localStorage.getItem('google_access_token') || sessionStorage.getItem('google_access_token');

// 1. 폴더 찾기/만들기
export const getOrCreateFolder = async (folderName, parentId = null) => {
  const token = getToken();
  // 토큰이 없으면 여기서 에러 발생
  if (!token) throw new Error("구글 재로그인이 필요합니다.");

  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;
  
  const searchRes = await fetch(`${G_DRIVE_API_URL}?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (searchRes.status === 401) throw new Error("구글 재로그인이 필요합니다."); // 만료 체크

  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) return searchData.files[0].id;

  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : []
  };

  const createRes = await fetch(G_DRIVE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });
  const createData = await createRes.json();
  return createData.id;
};

// 2. 파일 업로드
export const uploadFileToDrive = async (file, folderId) => {
  const token = getToken();
  if (!token) throw new Error("구글 재로그인이 필요합니다.");

  const metadata = { name: file.name, parents: [folderId] };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const res = await fetch(G_UPLOAD_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  
  if (!res.ok) throw new Error("업로드 실패");
  return await res.json();
};

// 3. 목록 가져오기
export const listFiles = async (folderId) => {
  const token = getToken();
  if (!token) return [];

  const query = `'${folderId}' in parents and trashed=false`;
  const res = await fetch(`${G_DRIVE_API_URL}?q=${encodeURIComponent(query)}&fields=files(id, name, webViewLink, iconLink, mimeType)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  return data.files || [];
};