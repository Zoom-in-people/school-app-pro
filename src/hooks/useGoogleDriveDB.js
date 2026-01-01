import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 전역 변수 (중복 실행 방지)
let isSaving = false;
let saveQueue = Promise.resolve();
let globalInitPromise = null;

export function useGoogleDriveDB(collectionName, userId) {
  const [data, setData] = useState(null);
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  // ID 유효성 체크 헬퍼
  const checkIdExists = async (id, token) => {
    try {
      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,trashed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const info = await res.json();
        return !info.trashed; // 휴지통에 없으면 유효
      }
      return false;
    } catch { return false; }
  };

  useEffect(() => {
    if (!userId) { setData([]); return; }
    if (isLoaded.current) return;

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) {
        console.warn("🔒 토큰 없음");
        return;
      }

      // 🔥 [핵심] 동시에 여러 기능이 초기화를 요청해도 딱 한 번만 실행 (싱글톤)
      if (!globalInitPromise) {
        globalInitPromise = (async () => {
          let folderId = localStorage.getItem('cached_folder_id');
          let fileId = localStorage.getItem('cached_file_id');
          
          // 1. 기억해둔 ID가 유효한지 확인 (직통 연결)
          const isFolderValid = folderId ? await checkIdExists(folderId, token) : false;
          const isFileValid = fileId ? await checkIdExists(fileId, token) : false;

          // 2. 폴더가 없거나 유효하지 않으면 검색/생성
          if (!isFolderValid) {
            console.log("📂 폴더 검색/생성 중...");
            folderId = await getOrCreateFolder('교무수첩 데이터');
            localStorage.setItem('cached_folder_id', folderId); // 주소 기억
          }

          // 3. 파일이 없거나 유효하지 않으면 검색/생성
          if (!isFileValid) {
            console.log("📄 파일 검색 중...");
            // 폴더 안에서 파일 검색
            const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();

            if (result.files && result.files.length > 0) {
              fileId = result.files[0].id;
              console.log("📄 기존 파일 발견:", fileId);
            } else {
              console.log("✨ 새 DB 파일 생성");
              const initialData = {};
              const file = new File([JSON.stringify(initialData)], DB_FILE_NAME, { type: 'application/json' });
              const uploaded = await uploadFileToDrive(file, folderId);
              fileId = uploaded.id;
            }
            localStorage.setItem('cached_file_id', fileId); // 주소 기억
          }

          return fileId;
        })();
      }

      try {
        const fileId = await globalInitPromise;
        setDbFileId(fileId);

        // 데이터 읽기
        const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if(contentRes.ok) {
           const fullData = await contentRes.json();
           setData(fullData[collectionName] || []);
        } else {
           setData([]);
        }
        
        isLoaded.current = true;

      } catch (error) {
        console.error("🚨 DB Init Error:", error);
        globalInitPromise = null; // 에러 나면 다음 시도 허용
      }
    };

    initDB();
  }, [userId, collectionName]);

  // 저장 로직 (줄 세우기 유지)
  const saveDataToDrive = async (newData) => {
    setData(newData); // 화면 즉시 반영

    if (data === null || !dbFileId) return;

    saveQueue = saveQueue.then(async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return;

      try {
        // 최신 데이터 가져오기
        const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${dbFileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!contentRes.ok) return;

        const fullData = await contentRes.json();
        
        if (!fullData || typeof fullData !== 'object') return;

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
        
        console.log(`✅ 저장 완료 (${collectionName})`);

      } catch (error) {
        console.error("🚨 Save Error:", error);
      }
    });
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