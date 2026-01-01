import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

export function useGoogleDriveDB(collectionName, userId) {
  const [data, setData] = useState(null); // 로딩 전 null
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  // 1. 초기 로딩
  useEffect(() => {
    if (!userId) { setData([]); return; }
    if (isLoaded.current) return;

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return; // 토큰 없으면 대기

      try {
        const folderId = await getOrCreateFolder('교무수첩 데이터');
        
        // DB 파일 검색
        const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.status === 401) {
            // 토큰 만료 처리 (조용히 넘어가거나 알림)
            return;
        }

        const result = await res.json();

        if (result.files && result.files.length > 0) {
          // 파일이 있으면 읽어오기
          const fileId = result.files[0].id;
          setDbFileId(fileId);
          
          const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fullData = await contentRes.json();
          setData(fullData[collectionName] || []);
        } else {
          // 🔥 [수정됨] 파일이 없으면 새로 생성 (File 객체 사용)
          const initialData = { [collectionName]: [] };
          // Blob 대신 File 객체 사용 -> 파일명이 정확히 전달됨
          const file = new File([JSON.stringify(initialData)], DB_FILE_NAME, { type: 'application/json' });
          
          const uploaded = await uploadFileToDrive(file, folderId);
          setDbFileId(uploaded.id);
          setData([]);
        }
        isLoaded.current = true;
      } catch (error) {
        console.error("DB Init Error:", error);
        // 에러 발생 시 사용자에게 알림 (단, [object Object] 에러는 이제 해결됨)
        if (error.message.includes("JSON")) {
            alert("데이터 파일이 손상되었습니다. 구글 드라이브에서 'school_app_db.json'을 삭제하고 다시 시도해주세요.");
        }
      }
    };

    initDB();
  }, [userId, collectionName]);

  // 2. 저장 (자동 동기화)
  const saveDataToDrive = async (newData) => {
    if (data === null) return; // 로딩 전 저장 방지
    setData(newData); 

    const token = localStorage.getItem('google_access_token');
    if (!token || !dbFileId) return;

    try {
      // 최신 데이터 가져와서 병합
      const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${dbFileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullData = await contentRes.json();
      
      fullData[collectionName] = newData;

      const file = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
      
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${dbFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: file
      });
    } catch (error) {
      console.error("Save Error:", error);
    }
  };

  const add = async (item) => {
    if (data === null) return;
    const newItem = { id: Date.now().toString(), ...item };
    const newData = [...data, newItem];
    saveDataToDrive(newData);
    return newItem.id;
  };

  const remove = async (id) => {
    if (data === null) return;
    const newData = data.filter(i => i.id !== id);
    saveDataToDrive(newData);
  };

  const update = async (id, fields) => {
    if (data === null) return;
    const newData = data.map(i => i.id === id ? { ...i, ...fields } : i);
    saveDataToDrive(newData);
  };

  return { data: data || [], add, remove, update };
}