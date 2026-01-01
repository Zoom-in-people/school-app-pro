import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 🔥 [핵심] 여러 훅이 공유하는 전역 변수 (교통 정리용)
// 앱이 실행되는 동안 딱 한 번만 파일을 찾도록 함
let globalDbFileId = null;
let globalInitPromise = null;
let lastUserId = null;

export function useGoogleDriveDB(collectionName, userId) {
  const [data, setData] = useState(null); // 로딩 전 null
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    // 1. 유저 없으면 초기화
    if (!userId) {
      setData([]);
      return;
    }

    // 2. 유저가 바뀌면 캐시 초기화 (로그아웃 후 다른 계정 로그인 대응)
    if (lastUserId !== userId) {
      globalDbFileId = null;
      globalInitPromise = null;
      lastUserId = userId;
    }

    // 3. 이미 로딩했으면 중단
    if (isLoaded.current) return;

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return;

      try {
        // 🔥 [핵심 로직] 이미 파일을 찾은 기록이 있으면 그것을 사용 (중복 생성 방지)
        if (globalDbFileId) {
          setDbFileId(globalDbFileId);
          await loadData(globalDbFileId, token);
          isLoaded.current = true;
          return;
        }

        // 🔥 [핵심 로직] 누군가 찾고 있는 중이라면, 끝날 때까지 대기
        if (!globalInitPromise) {
          globalInitPromise = (async () => {
            const folderId = await getOrCreateFolder('교무수첩 데이터');
            
            const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
            const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.status === 401) throw new Error("AUTH_ERROR");

            const result = await res.json();
            let fileId;

            if (result.files && result.files.length > 0) {
              // 파일이 있으면 첫 번째 것 사용
              fileId = result.files[0].id;
            } else {
              // 파일이 없으면 새로 생성 (딱 한 번만 실행됨)
              const initialData = {};
              const file = new File([JSON.stringify(initialData)], DB_FILE_NAME, { type: 'application/json' });
              const uploaded = await uploadFileToDrive(file, folderId);
              fileId = uploaded.id;
            }
            return fileId;
          })();
        }

        // 기다렸다가 결과(파일ID) 받기
        const fileId = await globalInitPromise;
        globalDbFileId = fileId; // 전역 변수에 저장
        setDbFileId(fileId);
        
        // 데이터 읽어오기
        await loadData(fileId, token);
        isLoaded.current = true;

      } catch (error) {
        console.error("DB Init Error:", error);
        if (error.message === "AUTH_ERROR") {
          // 토큰 만료 시 조용히 넘어가거나 처리
        }
      }
    };

    // 데이터 로드 헬퍼 함수
    const loadData = async (fileId, token) => {
      try {
        const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fullData = await contentRes.json();
        setData(fullData[collectionName] || []);
      } catch (e) {
        // JSON 파싱 에러 등 발생 시 빈 배열 처리
        console.error("Load Data Error", e);
        setData([]);
      }
    };

    initDB();
  }, [userId, collectionName]);

  // 저장 로직 (기존과 동일하되 안전장치 강화)
  const saveDataToDrive = async (newData) => {
    if (data === null || !dbFileId) return;
    setData(newData);

    const token = localStorage.getItem('google_access_token');
    if (!token) return;

    try {
      // 최신 데이터 병합
      const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${dbFileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullData = await contentRes.json();
      
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
    } catch (error) {
      console.error("Save Error:", error);
    }
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