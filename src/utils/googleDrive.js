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

  const uploadRes = await fetch(G_UPLOAD_API_URL + '&fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });
  const uploadData = await uploadRes.json();

  await fetch(`${G_DRIVE_API_URL}/${uploadData.id}/permissions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'reader', type: 'anyone' })
  });

  const directUrl = `https://drive.google.com/uc?export=view&id=${uploadData.id}`;
  return { url: directUrl, name: file.name, fullPath: uploadData.id };
};

// 🔥 [추가된 부분] 구글 드라이브 파일 삭제 기능
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