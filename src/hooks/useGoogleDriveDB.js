import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const DB_FILE_NAME = 'school_app_db.json';

let globalFullData = {};
let isGlobalLoaded = false;
let globalInitPromise = null;
let syncTimer = null;
let needsSync = false;
let isFetching = false; 
let currentUserId = null; 

const dispatchSaveEvent = (status) => window.dispatchEvent(new CustomEvent('db-save-status', { detail: status }));
const broadcastDataUpdate = () => window.dispatchEvent(new Event('db-data-updated'));

const getCustomFirebaseDb = () => {
  const configStr = localStorage.getItem('custom_firebase_config');
  if (!configStr) return null;
  try {
    const config = new Function("return " + configStr)();
    if (!config.projectId) return null;
    let app;
    const apps = getApps();
    const customApp = apps.find(a => a.name === "CustomApp");
    if (!customApp) app = initializeApp(config, "CustomApp");
    else app = customApp;
    return getFirestore(app);
  } catch (e) { return null; }
};

// 🔥 사이드바에서 사용할 '수동 드라이브 백업' 함수 외부 공개
export const backupToGoogleDrive = async () => {
  const token = localStorage.getItem('google_access_token');
  const fileId = localStorage.getItem('cached_file_id');
  if (!token || !fileId) return { success: false, message: "구글 드라이브 연결 정보가 없습니다." };
  
  try {
    const file = new Blob([JSON.stringify(globalFullData)], { type: 'application/json' });
    const res = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=modifiedTime`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: file
    });
    if (res.ok) {
       return { success: true, message: "구글 드라이브에 안전하게 수동 백업되었습니다!" };
    }
    return { success: false, message: "백업 실패: 서버 응답 오류" };
  } catch (e) {
    return { success: false, message: "백업 에러: " + e.message };
  }
};

export const fetchLatestFromCloud = async () => {
  if (isFetching || needsSync) return;
  isFetching = true;
  
  try {
    const db = getCustomFirebaseDb();
    const localTime = Number(localStorage.getItem('db_last_modified')) || 0;

    // 🔥 1. 파이어베이스가 있다면 무조건 파이어베이스가 최우선 (드라이브 무시)
    if (db && currentUserId) {
      const docRef = doc(db, "users", currentUserId, "school_app", "data");
      const docSnap = await getDoc(docRef); 
      
      if (docSnap.exists()) {
        const fbData = docSnap.data();
        const fbTime = fbData.lastModified || 0;
        
        if (!isGlobalLoaded || fbTime > localTime) {
          dispatchSaveEvent('loading');
          const pureData = { ...fbData };
          delete pureData.lastModified; 
          globalFullData = pureData;
          localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
          localStorage.setItem('db_last_modified', fbTime.toString());
          isGlobalLoaded = true;
          broadcastDataUpdate();
          dispatchSaveEvent('loaded');
        }
      }
    } 
    // 🔥 2. 파이어베이스가 없다면 기본 구글 드라이브 로딩
    else {
      const token = localStorage.getItem('google_access_token');
      const fileId = localStorage.getItem('cached_file_id');
      if (token && fileId) {
         const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=modifiedTime`, { headers: { Authorization: `Bearer ${token}` } });
         if (metaRes.ok) {
             const metaData = await metaRes.json();
             const driveTime = new Date(metaData.modifiedTime).getTime();
             if (driveTime > localTime) {
                 dispatchSaveEvent('loading');
                 const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
                 if (contentRes.ok) {
                     globalFullData = await contentRes.json() || {};
                     localStorage.setItem('school_app_local_db', JSON.stringify(globalFullData));
                     localStorage.setItem('db_last_modified', driveTime.toString());
                     isGlobalLoaded = true;
                     broadcastDataUpdate();
                     dispatchSaveEvent('loaded');
                 }
             }
         }
      }
    }
  } catch (e) { console.error("Cloud fetch error", e); }
  finally { isFetching = false; }
};

const syncToCloud = async () => {
  if (!needsSync) return;
  needsSync = false;
  dispatchSaveEvent('saving');
  
  const db = getCustomFirebaseDb();
  const now = Date.now();
  
  // 🔥 1. 파이어베이스 설정이 있으면 파이어베이스에만 자동 저장 (드라이브 자동저장 안 함)
  if (db && currentUserId) {
    try {
      const docRef = doc(db, "users", currentUserId, "school_app", "data");
      await setDoc(docRef, { ...globalFullData, lastModified: now }); 
      localStorage.setItem('db_last_modified', now.toString());
      dispatchSaveEvent('saved');
    } catch(e) {
      needsSync = true; dispatchSaveEvent('error');
    }
  } 
  // 🔥 2. 파이어베이스가 없으면 구글 드라이브에 자동 저장
  else {
    const token = localStorage.getItem('google_access_token');
    const fileId = localStorage.getItem('cached_file_id');
    if (!token || !fileId) { needsSync = true; return; }
    
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
      } else { needsSync = true; dispatchSaveEvent('error'); }
    } catch(e) { needsSync = true; dispatchSaveEvent('error'); }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && needsSync) {
      if (syncTimer) clearTimeout(syncTimer);
      syncToCloud(); 
    } else if (document.visibilityState === 'visible') {
      fetchLatestFromCloud(); 
    }
  });
  setInterval(fetchLatestFromCloud, 30000);
}

const scheduleSync = () => {
  needsSync = true;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(syncToCloud, 2000); 
};

export function useGoogleDriveDB(collectionName, userId, enabled = true) {
  const [data, setData] = useState([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!userId || !enabled) {
      if (!enabled) setData([]);
      return;
    }
    
    currentUserId = userId; 

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

          // 🔥 스마트폰을 위해 구글 드라이브에서 파이어베이스 설정 비밀 편지 읽어오기
          if (token && folderId) {
            try {
              const q = `'${folderId}' in parents and name='firebase_config.json' and trashed=false`;
              const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
              const result = await res.json();
              if (result.files && result.files.length > 0) {
                const configRes = await fetch(`https://www.googleapis.com/drive/v3/files/${result.files[0].id}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
                if (configRes.ok) {
                  const configText = await configRes.text();
                  if (configText.trim() === '') localStorage.removeItem('custom_firebase_config');
                  else localStorage.setItem('custom_firebase_config', configText);
                }
              }
            } catch(e) { console.error("Config sync error", e); }
          }

          // 드라이브 DB 파일 확인 및 생성 (백업용 공간 확보)
          if (!fileId) {
            const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,modifiedTime)`, { headers: { Authorization: `Bearer ${token}` } });
            const result = await res.json();

            if (result.files && result.files.length > 0) fileId = result.files[0].id;
            else {
              const file = new File([JSON.stringify(globalFullData)], DB_FILE_NAME, { type: 'application/json' });
              const uploaded = await uploadFileToDrive(file, folderId);
              fileId = uploaded.id;
            }
            localStorage.setItem('cached_file_id', fileId);
          }

          await fetchLatestFromCloud(); 
          
          dispatchSaveEvent('loaded');
          if (needsSync) syncToCloud(); 
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