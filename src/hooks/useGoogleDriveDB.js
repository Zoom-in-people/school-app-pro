import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 🔥 Google Drive를 DB처럼 쓰는 커스텀 훅
export function useGoogleDriveDB(collectionName, userId) {
  const [data, setData] = useState([]);
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  // 1. 드라이브에서 DB 파일 찾기 및 로드
  useEffect(() => {
    if (!userId || isLoaded.current) return;

    const initDB = async () => {
      const token = sessionStorage.getItem('google_access_token');
      if (!token) return;

      try {
        // '교무수첩 데이터' 폴더 찾기
        const folderId = await getOrCreateFolder('교무수첩 데이터');
        
        // DB 파일 검색
        const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();

        if (result.files && result.files.length > 0) {
          // 파일이 있으면 내용 읽어오기 (media 다운로드)
          const fileId = result.files[0].id;
          setDbFileId(fileId);
          
          const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fullData = await contentRes.json();
          setData(fullData[collectionName] || []); // 해당 컬렉션 데이터만 state에 설정
        } else {
          // 파일이 없으면 빈 파일 생성
          const initialData = { [collectionName]: [] };
          const file = new Blob([JSON.stringify(initialData)], { type: 'application/json' });
          const uploaded = await uploadFileToDrive({ name: DB_FILE_NAME }, folderId, file); // upload함수 수정 필요
          setDbFileId(uploaded.id);
          setData([]);
        }
        isLoaded.current = true;
      } catch (error) {
        console.error("DB Init Error:", error);
      }
    };

    initDB();
  }, [userId, collectionName]);

  // 2. 데이터 저장 (자동 동기화)
  // 데이터가 변경될 때마다 전체 JSON을 다시 업로드합니다.
  const saveDataToDrive = async (newData) => {
    // 화면은 즉시 업데이트 (사용자 경험)
    setData(newData); 

    const token = sessionStorage.getItem('google_access_token');
    if (!token || !dbFileId) return;

    try {
      // 전체 데이터를 다시 읽어서 병합해야 함 (다른 컬렉션 보존)
      const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${dbFileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullData = await contentRes.json();
      
      // 현재 컬렉션 데이터 업데이트
      fullData[collectionName] = newData;

      // 파일 덮어쓰기 (PATCH)
      const file = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
      
      // 업로드 로직 (단순화: 기존 uploadFileToDrive 재활용 불가하므로 직접 fetch)
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${dbFileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: file
      });
      
      // 우측 상단에 "저장됨" 표시를 위한 로직 추가 가능
    } catch (error) {
      console.error("Save Error:", error);
    }
  };

  // CRUD 인터페이스 (useFirestore와 동일하게 유지)
  const add = async (item) => {
    const newItem = { id: Date.now().toString(), ...item };
    const newData = [...data, newItem];
    saveDataToDrive(newData);
    return newItem.id;
  };

  const remove = async (id) => {
    const newData = data.filter(i => i.id !== id);
    saveDataToDrive(newData);
  };

  const update = async (id, fields) => {
    const newData = data.map(i => i.id === id ? { ...i, ...fields } : i);
    saveDataToDrive(newData);
  };

  return { data, add, remove, update };
}