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
// 🔥 다른 기기에서 가져온 최신 데이터를 화면에 즉각 반영하기 위한 방송(Broadcast) 이벤트
const broadcastDataUpdate = () => window.dispatchEvent(new Event('db-data-updated'));

// 3초간 조작이 없으면 알아서 백그라운드 저장
const syncToDrive = async () => {
  if (!needsSync) return;
  const token = localStorage.getItem('google_access_token');
  const fileId = localStorage.getItem('cached_file_id');
  if (!token || !fileId) return;

  dispatchSaveEvent('saving');
  try {
    const file = new Blob([JSON.stringify(globalFullData)], { type: 'application/json' });
    // 🔥 업데이트 시 modifiedTime도 응답받도록 fields 추가
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=modifiedTime`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: file
    });
    
    if (res.ok) {
      const metaData = await res.json();
      if (metaData.modifiedTime) {
        // 내가 방금 올린 파일의 정확한 수정 시간을 로컬에 기록 (불필요한 재다운로드 방지)
        localStorage.setItem('db_last_modified', new Date(metaData.modifiedTime).getTime().toString());
      }
      dispatchSaveEvent('saved');
      needsSync = false;
    } else {
      dispatchSaveEvent('error');
    }
  } catch (e) { 
    dispatchSaveEvent('error'); 
  }
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

    // 🔥 새 데이터가 도착했다는 방송을 들으면 내 상태를 업데이트함
    const handleDataUpdated = () => {
      setData(globalFullData[collectionName] || []);
    };
    window.addEventListener('db-data-updated', handleDataUpdated);

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return;

      // 1. 빠른 로컬 데이터 로드 (일단 화면을 띄워줌)
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

          // 🔥 2. 완벽한 동기화: 로컬 시간과 구글 드라이브 시간을 비교
          try {
            // 용량이 큰 전체 파일 대신 '최종 수정 시간' 정보만 0.1초 만에 가져옴
            const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime`, { headers: { Authorization: `Bearer ${token}` } });
            if (metaRes.ok) {
              const metaData = await metaRes.json();
              const driveTime = new Date(metaData.modifiedTime).getTime();
              const localTime = Number(localStorage.getItem('db_last_modified')) || 0;

              // 구글 드라이브(다른 기기에서 수정한 것)가 더 최신일 경우에만 다운로드 진행
              if (driveTime > localTime || !isGlobalLoaded) {
                const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
                if (contentRes.ok) {
                  const fetchedData = await contentRes.json();
                  globalFullData = fetchedData || {};
                  
                  // 로컬 업데이트 및 시간 동기화
                  localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
                  localStorage.setItem('db_last_modified', driveTime.toString());
                  isGlobalLoaded = true;
                  
                  // 🔥 다운로드 완료 후 모든 화면에 "새로고침 하라!" 방송 송출
                  broadcastDataUpdate();
                }
              }
            }
          } catch(e) { console.error("Drive sync error", e); }
          
          dispatchSaveEvent('loaded');
          if (needsSync) syncToDrive(); 
        })();
      }

      await globalInitPromise;
      isInitialized.current = true;
    };

    initDB();

    // 컴포넌트가 사라질 때 이벤트 리스너 정리
    return () => window.removeEventListener('db-data-updated', handleDataUpdated);
  }, [userId, collectionName, enabled]);

  // 데이터 수정 시 로컬 즉각 반영 + 방송 + 2초 뒤 구글 드라이브 동기화 예약
  const updateLocalAndSync = (newData) => {
    setData(newData);
    globalFullData[collectionName] = newData;
    localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
    localStorage.setItem('db_last_modified', Date.now().toString()); // 내 폰이 최신이 됨
    
    broadcastDataUpdate(); // 사이드바, 대시보드 등 다른 위젯들도 즉시 반영되도록 방송
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