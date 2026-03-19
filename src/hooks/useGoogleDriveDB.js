import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';
// 🔥 Firebase 관련 모듈 호출
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const DB_FILE_NAME = 'school_app_db.json';

// 메모리 전역 상태
let globalFullData = {};
let isGlobalLoaded = false;
let globalInitPromise = null;
let syncTimer = null;
let needsSync = false;
let isFetching = false; 
let currentUserId = null; // 현재 유저 아이디 추적

const dispatchSaveEvent = (status) => window.dispatchEvent(new CustomEvent('db-save-status', { detail: status }));
const broadcastDataUpdate = () => window.dispatchEvent(new Event('db-data-updated'));

// 🔥 커스텀 파이어베이스 가져오기
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

// 🔥 2번 요청: 필요할 때만 1회성으로 읽어오기 (onSnapshot 폐기 및 getDoc 사용)
export const fetchLatestFromCloud = async () => {
  if (isFetching || needsSync) return;
  isFetching = true;
  
  try {
    const db = getCustomFirebaseDb();
    const localTime = Number(localStorage.getItem('db_last_modified')) || 0;

    // --- [Firebase 모드] ---
    if (db && currentUserId) {
      const docRef = doc(db, "users", currentUserId, "school_app", "data");
      const docSnap = await getDoc(docRef); // 1회성 읽기 (비용 최적화: 문서 1개 = 1읽기)
      
      if (docSnap.exists()) {
        const fbData = docSnap.data();
        const fbTime = fbData.lastModified || 0;
        
        if (fbTime > localTime) {
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
      } else {
        // 🔥 1번 요청: Firebase에 데이터가 없으면 현재 로컬/드라이브의 최신 데이터를 최초 업로드(마이그레이션)
        if (Object.keys(globalFullData).length > 0) {
           await setDoc(docRef, { ...globalFullData, lastModified: Date.now() });
        }
      }
    } 
    // --- [Google Drive 모드] ---
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

// 클라우드 저장 (백그라운드)
const syncToCloud = async () => {
  if (!needsSync) return;
  needsSync = false;
  dispatchSaveEvent('saving');
  
  const db = getCustomFirebaseDb();
  const now = Date.now();
  
  // --- [Firebase 저장] ---
  if (db && currentUserId) {
    try {
      const docRef = doc(db, "users", currentUserId, "school_app", "data");
      await setDoc(docRef, { ...globalFullData, lastModified: now }); // 단일 문서로 덮어쓰기 (1 쓰기 비용)
      localStorage.setItem('db_last_modified', now.toString());
      dispatchSaveEvent('saved');
    } catch(e) {
      needsSync = true; dispatchSaveEvent('error');
    }
  } 
  // --- [Google Drive 저장] ---
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

// 🔥 4번 요청: 인터넷 창을 닫아버리거나 화면을 숨길 때 무조건 즉시 자동 저장
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && needsSync) {
      if (syncTimer) clearTimeout(syncTimer);
      syncToCloud(); // 탭 닫힐 때 Firebase로 전송
    } else if (document.visibilityState === 'visible') {
      fetchLatestFromCloud(); // 화면 켤 때 최신 정보 읽기
    }
  });
  // 혹시 모를 누락을 대비한 30초 주기적 1회성 확인
  setInterval(fetchLatestFromCloud, 30000);
}

const scheduleSync = () => {
  needsSync = true;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(syncToCloud, 2000); // 2초 조작 없으면 저장
};

export function useGoogleDriveDB(collectionName, userId, enabled = true) {
  const [data, setData] = useState([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!userId || !enabled) {
      if (!enabled) setData([]);
      return;
    }
    
    currentUserId = userId; // 유저 아이디 세팅

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

            if (result.files && result.files.length > 0) fileId = result.files[0].id;
            else {
              const file = new File([JSON.stringify(globalFullData)], DB_FILE_NAME, { type: 'application/json' });
              const uploaded = await uploadFileToDrive(file, folderId);
              fileId = uploaded.id;
            }
            localStorage.setItem('cached_file_id', fileId);
          }

          await fetchLatestFromCloud(); // 접속 시 최신화
          
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