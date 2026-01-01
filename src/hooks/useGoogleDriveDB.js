import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 전역 변수 (중복 실행 방지 및 로딩 상태 동기화)
let saveQueue = Promise.resolve();
let globalInitPromise = null;

// 🔥 [핵심] 로딩 중인 작업 개수를 세는 전역 변수
let activeLoadingCount = 0;

export function useGoogleDriveDB(collectionName, userId) {
  const [data, setData] = useState(null);
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  // 이벤트 발송 헬퍼
  const dispatchSaveEvent = (status) => {
    window.dispatchEvent(new CustomEvent('db-save-status', { detail: status }));
  };

  // 🔥 로딩 상태 관리 헬퍼 함수
  const startLoading = () => {
    if (activeLoadingCount === 0) dispatchSaveEvent('loading');
    activeLoadingCount++;
  };

  const finishLoading = () => {
    activeLoadingCount = Math.max(0, activeLoadingCount - 1);
    // 모든 로딩이 끝났을 때만 'loaded' 신호 발송
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
    if (!userId) { setData([]); return; }
    if (isLoaded.current) return;

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) {
        console.warn("🔒 토큰 없음");
        return;
      }

      // 🔥 로딩 시작 카운트 증가
      startLoading();

      try {
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
        // 🔥 로딩 종료 카운트 감소 (성공하든 실패하든 무조건 실행)
        finishLoading();
      }
    };

    initDB();
  }, [userId, collectionName]);

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

  // 일괄 업데이트 함수
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

  return { data: data || [], add, addMany, remove, update, updateMany };
}