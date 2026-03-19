import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 전역 상태 (모든 데이터가 메모리에 올려짐)
let globalFullData = {};
let isGlobalLoaded = false;
let globalInitPromise = null;
let syncTimer = null;
let needsSync = false;
let isFetching = false; // 🔥 추가: 중복 다운로드 방지

const dispatchSaveEvent = (status) => window.dispatchEvent(new CustomEvent('db-save-status', { detail: status }));
const broadcastDataUpdate = () => window.dispatchEvent(new Event('db-data-updated'));

// 🔥 추가: 구글 드라이브에서 최신 데이터인지 검사하고 다운로드하는 전용 함수
export const fetchLatestFromDrive = async () => {
  // 내가 지금 저장할 게 있거나 이미 가져오고 있는 중이면 충돌 방지를 위해 패스
  if (isFetching || needsSync) return; 

  const token = localStorage.getItem('google_access_token');
  const fileId = localStorage.getItem('cached_file_id');
  if (!token || !fileId) return;

  isFetching = true;
  try {
    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime`, { headers: { Authorization: `Bearer ${token}` } });
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const driveTime = new Date(metaData.modifiedTime).getTime();
      const localTime = Number(localStorage.getItem('db_last_modified')) || 0;

      // 드라이브의 시간이 로컬 시간보다 최신이면 무조건 다운로드
      if (driveTime > localTime) {
        dispatchSaveEvent('loading');
        const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
        if (contentRes.ok) {
          const fetchedData = await contentRes.json();
          globalFullData = fetchedData || {};
          
          localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
          localStorage.setItem('db_last_modified', driveTime.toString());
          isGlobalLoaded = true;
          
          // 🔥 모든 컴포넌트에게 새 데이터가 왔다고 방송 (새로고침 효과)
          broadcastDataUpdate();
          dispatchSaveEvent('loaded');
        }
      }
    }
  } catch (e) {
    console.error("Drive sync error", e);
  } finally {
    isFetching = false;
  }
};

// 3초간 조작이 없으면 알아서 백그라운드 저장
const syncToDrive = async () => {
  if (!needsSync) return;
  const token = localStorage.getItem('google_access_token');
  const fileId = localStorage.getItem('cached_file_id');
  if (!token || !fileId) return;

  needsSync = false;
  dispatchSaveEvent('saving');
  try {
    const file = new Blob([JSON.stringify(globalFullData)], { type: 'application/json' });
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=modifiedTime`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: file,
      keepalive: true
    });
    
    if (res.ok) {
      const metaData = await res.json();
      if (metaData.modifiedTime) {
        localStorage.setItem('db_last_modified', new Date(metaData.modifiedTime).getTime().toString());
      }
      dispatchSaveEvent('saved');
    } else {
      needsSync = true;
      dispatchSaveEvent('error');
    }
  } catch (e) { 
    needsSync = true;
    dispatchSaveEvent('error'); 
  }
};

// 🔥 수정: 브라우저/화면 상태 변화 감지 및 자동 동기화 로직
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    // 1. 화면을 끌 때 (홈버튼 누를 때) -> 강제 저장 진행
    if (document.visibilityState === 'hidden' && needsSync) {
      if (syncTimer) clearTimeout(syncTimer);
      syncToDrive();
    } 
    // 2. 화면을 켤 때 -> 최신 데이터가 있는지 강제 검사
    else if (document.visibilityState === 'visible') {
      fetchLatestFromDrive();
    }
  });

  // 3. 앱을 계속 켜두더라도 30초마다 자동으로 최신화 검사 (폴링)
  setInterval(fetchLatestFromDrive, 30000);
}

const scheduleSync = () => {
  needsSync = true;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(syncToDrive, 2000); 
};

export function useGoogleDriveDB(collectionName, userId, enabled = true) {
  const [data, setData] = useState([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!userId || !enabled) {
      if (!enabled) setData([]);
      return;
    }

    const handleDataUpdated = () => {
      setData(globalFullData[collectionName] || []);
    };
    window.addEventListener('db-data-updated', handleDataUpdated);

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return;

      if (!isGlobalLoaded) {
        const localData = localStorage.getItem('school_app_local_db');
        if (localData) {
          try { 
            globalFullData = JSON.parse(localData); 
            isGlobalLoaded = true; 
            handleDataUpdated();
          } catch(e) {}
        }
      } else {
        handleDataUpdated();
      }

      if (!globalInitPromise) {
        globalInitPromise = (async () => {
          dispatchSaveEvent('loading');
          
          let folderId = localStorage.getItem('cached_folder_id');
          let fileId = localStorage.getItem('cached_file_id');

          if (!folderId) {
            folderId = await getOrCreateFolder('교무수첩 데이터');
            localStorage.setItem('cached_folder_id', folderId);
          }

          if (!fileId) {
            const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,modifiedTime)`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();

            if (result.files && result.files.length > 0) {
              fileId = result.files[0].id;
            } else {
              const file = new File([JSON.stringify(globalFullData)], DB_FILE_NAME, { type: 'application/json' });
              const uploaded = await uploadFileToDrive(file, folderId);
              fileId = uploaded.id;
            }
            localStorage.setItem('cached_file_id', fileId);
          }

          // 🔥 초기 구동 시에도 무조건 최신 데이터 검사
          await fetchLatestFromDrive();
          
          dispatchSaveEvent('loaded');
          if (needsSync) syncToDrive(); 
        })();
      }

      await globalInitPromise;
      isInitialized.current = true;
    };

    initDB();

    return () => window.removeEventListener('db-data-updated', handleDataUpdated);
  }, [userId, collectionName, enabled]);

  const updateLocalAndSync = (newData) => {
    setData(newData);
    globalFullData[collectionName] = newData;
    localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
    localStorage.setItem('db_last_modified', Date.now().toString()); 
    
    broadcastDataUpdate(); 
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