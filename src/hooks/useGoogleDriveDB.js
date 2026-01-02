import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 전역 변수
let saveQueue = Promise.resolve();
let globalInitPromise = null;
let activeLoadingCount = 0;

// 🔥 [수정] enabled 매개변수 추가 (기본값 true)
export function useGoogleDriveDB(collectionName, userId, enabled = true) {
  const [data, setData] = useState(null);
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  const dispatchSaveEvent = (status) => {
    window.dispatchEvent(new CustomEvent('db-save-status', { detail: status }));
  };

  const startLoading = () => {
    if (activeLoadingCount === 0) dispatchSaveEvent('loading');
    activeLoadingCount++;
  };

  const finishLoading = () => {
    activeLoadingCount = Math.max(0, activeLoadingCount - 1);
    if (activeLoadingCount === 0) {
      dispatchSaveEvent('loaded');
    }
  };

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
    // 🔥 [수정] enabled가 false면 로직 수행 안 함
    if (!userId || !enabled) { 
      if (!enabled) setData(null); // 대기 상태일 땐 데이터 null
      return; 
    }
    
    // 이미 로드되었고 파일 ID도 있다면 스킵 (불필요한 재요청 방지)
    if (isLoaded.current && dbFileId) return;

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) {
        console.warn("🔒 토큰 없음");
        return;
      }

      startLoading();

      try {
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
        dispatchSaveEvent('error');
      } finally {
        finishLoading();
      }
    };

    initDB();
  }, [userId, collectionName, enabled]); // 🔥 enabled 의존성 추가

  const saveDataToDrive = async (newData) => {
    setData(newData);

    if (data === null || !dbFileId) return;

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
    const newItemsWithIds = items.map((item, index) => ({
      id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      ...item
    }));
    const newData = [...data, ...newItemsWithIds];
    saveDataToDrive(newData);
    return items.length;
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

  const updateMany = async (updates) => {
    if (data === null) return;
    const newData = data.map(item => {
      const updateItem = updates.find(u => String(u.id) === String(item.id));
      if (updateItem) {
        return { ...item, ...updateItem.fields };
      }
      return item;
    });
    saveDataToDrive(newData);
  };

  const setAll = async (allData) => {
    if (data === null) return;
    saveDataToDrive(allData);
  };

  return { data: data || [], add, addMany, remove, update, updateMany, setAll };
}