import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 전역 변수 (중복 실행 및 저장 충돌 방지)
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
        return !info.trashed;
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

      // 초기화 로직 (싱글톤 패턴)
      if (!globalInitPromise) {
        globalInitPromise = (async () => {
          let folderId = localStorage.getItem('cached_folder_id');
          let fileId = localStorage.getItem('cached_file_id');
          
          const isFolderValid = folderId ? await checkIdExists(folderId, token) : false;
          const isFileValid = fileId ? await checkIdExists(fileId, token) : false;

          if (!isFolderValid) {
            folderId = await getOrCreateFolder('교무수첩 데이터');
            localStorage.setItem('cached_folder_id', folderId);
          }

          if (!isFileValid) {
            const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();

            if (result.files && result.files.length > 0) {
              fileId = result.files[0].id;
            } else {
              const initialData = {};
              const file = new File([JSON.stringify(initialData)], DB_FILE_NAME, { type: 'application/json' });
              const uploaded = await uploadFileToDrive(file, folderId);
              fileId = uploaded.id;
            }
            localStorage.setItem('cached_file_id', fileId);
          }

          return fileId;
        })();
      }

      try {
        const fileId = await globalInitPromise;
        setDbFileId(fileId);

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
        globalInitPromise = null;
      }
    };

    initDB();
  }, [userId, collectionName]);

  // 🔥 [추가] 저장 상태를 알리는 이벤트 발송 함수
  const dispatchSaveEvent = (status) => {
    window.dispatchEvent(new CustomEvent('db-save-status', { detail: status }));
  };

  // 안전한 저장 함수 (Queue 적용)
  const saveDataToDrive = async (newData) => {
    setData(newData); // 화면 즉시 반영

    if (data === null || !dbFileId) return;

    // 🔥 [추가] 저장 시작 알림
    dispatchSaveEvent('saving');

    saveQueue = saveQueue.then(async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return;

      try {
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
        
        // 🔥 [추가] 저장 완료 알림
        dispatchSaveEvent('saved');

      } catch (error) {
        console.error("🚨 Save Error:", error);
        dispatchSaveEvent('error');
      }
    });
  };

  const add = async (item) => {
    if (data === null) return;
    const newItem = { id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, ...item };
    const newData = [...data, newItem];
    saveDataToDrive(newData);
    return newItem.id;
  };

  const addMany = async (items) => {
    if (data === null) return;

    const filteredItems = items.filter(newItem => {
      const isDuplicate = data.some(existing => 
        existing.grade == newItem.grade &&
        existing.class == newItem.class &&
        existing.number == newItem.number &&
        existing.name === newItem.name
      );
      return !isDuplicate;
    });

    if (filteredItems.length === 0) return 0;

    const newItemsWithIds = filteredItems.map((item, index) => ({
      id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      ...item
    }));

    const newData = [...data, ...newItemsWithIds];
    saveDataToDrive(newData);
    return filteredItems.length;
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

  return { data: data || [], add, addMany, remove, update };
}