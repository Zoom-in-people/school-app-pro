const G_DRIVE_API_URL = 'https://www.googleapis.com/drive/v3/files';
const G_UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

const getToken = () => localStorage.getItem('google_access_token');

export const getOrCreateFolder = async (folderName, parentId = null) => {
  const token = getToken();
  if (!token) throw new Error("로그인 만료");

  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;
  
  const searchRes = await fetch(`${G_DRIVE_API_URL}?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } });
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) return searchData.files[0].id;

  const createRes = await fetch(G_DRIVE_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] })
  });
  const createData = await createRes.json();
  return createData.id;
};

export const uploadFileToDrive = async (file, folderId) => {
  const token = getToken();
  const metadata = { name: file.name, parents: [folderId] };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  const res = await fetch(G_UPLOAD_API_URL, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
  return await res.json();
};

export const uploadImageToDrive = async (file) => {
  const token = getToken();
  if (!token) throw new Error("토큰 없음");

  let folderId = localStorage.getItem('cached_folder_id');
  if (!folderId) {
    folderId = await getOrCreateFolder('교무수첩 데이터');
    localStorage.setItem('cached_folder_id', folderId);
  }

  const metadata = { name: file.name, parents: [folderId] };
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', file);

  // 1. 파일 업로드
  const uploadRes = await fetch(G_UPLOAD_API_URL + '&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const uploadData = await uploadRes.json();

  // 2. 권한을 누구나 볼 수 있도록 허용
  await fetch(`${G_DRIVE_API_URL}/${uploadData.id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  // 🔥 3. 구글 드라이브 정책 우회: 안전한 이미지 전용 CDN 링크(thumbnailLink) 가져오기
  const metaRes = await fetch(`${G_DRIVE_API_URL}/${uploadData.id}?fields=thumbnailLink`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const metaData = await metaRes.json();

  // thumbnailLink 끝에 붙은 해상도 제한 파라미터(=s220 등)를 잘라내어 원본 크기로 만듭니다.
  let directUrl = metaData.thumbnailLink;
  if (directUrl && directUrl.includes('=')) {
    directUrl = directUrl.split('=')[0]; 
  } else {
    // 만약 못 가져왔을 경우를 대비한 최후의 기본 주소
    directUrl = `https://drive.google.com/uc?export=view&id=${uploadData.id}`;
  }

  return { url: directUrl, name: file.name, fullPath: uploadData.id };
};

export const deleteFileFromDrive = async (fileId) => {
  const token = getToken();
  if (!token || !fileId) return;
  
  try {
    await fetch(`${G_DRIVE_API_URL}/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (error) {
    console.error("파일 삭제 실패:", error);
  }
};
