import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 전역 상태 (모든 데이터가 메모리에 올려짐)
let globalFullData = {};
let isGlobalLoaded = false;
let globalInitPromise = null;
let syncTimer = null;
let needsSync = false;

const dispatchSaveEvent = (status) => window.dispatchEvent(new CustomEvent('db-save-status', { detail: status }));

// 3초간 조작이 없으면 알아서 백그라운드 저장
const syncToDrive = async () => {
  if (!needsSync) return;
  const token = localStorage.getItem('google_access_token');
  const fileId = localStorage.getItem('cached_file_id');
  if (!token || !fileId) return;

  dispatchSaveEvent('saving');
  try {
    const file = new Blob([JSON.stringify(globalFullData)], { type: 'application/json' });
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: file
    });
    if (res.ok) {
      dispatchSaveEvent('saved');
      needsSync = false;
    } else dispatchSaveEvent('error');
  } catch (e) { dispatchSaveEvent('error'); }
};

const scheduleSync = () => {
  needsSync = true;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(syncToDrive, 2000); // 2초 디바운스
};

export function useGoogleDriveDB(collectionName, userId, enabled = true) {
  const [data, setData] = useState([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!userId || !enabled) {
      if (!enabled) setData([]);
      return;
    }

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return;

      if (!globalInitPromise) {
        globalInitPromise = (async () => {
          dispatchSaveEvent('loading');
          
          // 1. 빛의 속도: 로컬 스토리지 데이터 먼저 로드
          const localData = localStorage.getItem('school_app_local_db');
          if (localData) {
            try { globalFullData = JSON.parse(localData); isGlobalLoaded = true; } catch(e) {}
          }

          // 2. 백그라운드 구글 드라이브 연동
          let folderId = localStorage.getItem('cached_folder_id');
          let fileId = localStorage.getItem('cached_file_id');

          if (!folderId) {
            folderId = await getOrCreateFolder('교무수첩 데이터');
            localStorage.setItem('cached_folder_id', folderId);
          }

          if (!fileId) {
            const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();

            if (result.files && result.files.length > 0) fileId = result.files[0].id;
            else {
              const file = new File([JSON.stringify(globalFullData)], DB_FILE_NAME, { type: 'application/json' });
              const uploaded = await uploadFileToDrive(file, folderId);
              fileId = uploaded.id;
            }
            localStorage.setItem('cached_file_id', fileId);
          }

          // 3. 최신 데이터 다운로드 (다른 기기에서 수정한 것 동기화)
          const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
          if (contentRes.ok) {
            const fetchedData = await contentRes.json();
            globalFullData = fetchedData || {};
            localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
          }
          
          isGlobalLoaded = true;
          dispatchSaveEvent('loaded');
          if (needsSync) syncToDrive(); 
        })();
      }

      await globalInitPromise;
      setData(globalFullData[collectionName] || []);
      isInitialized.current = true;
    };

    initDB();
  }, [userId, collectionName, enabled]);

  // 데이터 수정 시 로컬 0초 즉각 반영 + 2초 뒤 구글 드라이브 동기화 예약
  const updateLocalAndSync = (newData) => {
    setData(newData);
    globalFullData[collectionName] = newData;
    localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
    scheduleSync();
  };

  const add = async (item) => {
    const newItem = { id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, ...item };
    updateLocalAndSync([...data, newItem]);
    return newItem.id;
  };

  const addMany = async (items) => {
    const newItems = items.map((item, idx) => ({ id: `${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 9)}`, ...item }));
    updateLocalAndSync([...data, ...newItems]);
  };

  const remove = async (id) => updateLocalAndSync(data.filter(i => i.id !== id));
  const update = async (id, fields) => updateLocalAndSync(data.map(i => i.id === id ? { ...i, ...fields } : i));
  
  const updateMany = async (updates) => {
    updateLocalAndSync(data.map(item => {
      const u = updates.find(x => String(x.id) === String(item.id));
      return u ? { ...item, ...u.fields } : item;
    }));
  };

  const setAll = async (allData) => updateLocalAndSync(allData);

  return { data, add, addMany, remove, update, updateMany, setAll };
}