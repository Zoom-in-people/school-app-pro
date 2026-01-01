import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

// 🔥 [핵심 1] 전역 변수로 저장 상태 관리 (여러 훅이 공유함)
// isSaving: 지금 누군가 저장 중인가?
// saveQueue: 저장하려고 기다리는 줄
let isSaving = false;
let saveQueue = Promise.resolve();

export function useGoogleDriveDB(collectionName, userId) {
  const [data, setData] = useState(null);
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  // 1. 초기 데이터 로드
  useEffect(() => {
    if (!userId) { setData([]); return; }
    if (isLoaded.current) return;

    const initDB = async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) {
        console.warn("🔒 토큰 없음");
        return;
      }

      try {
        const folderId = await getOrCreateFolder('교무수첩 데이터');
        
        const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error(`검색 실패: ${res.status}`);

        const result = await res.json();
        let fileId;

        if (result.files && result.files.length > 0) {
          // 파일이 있으면 읽어오기
          fileId = result.files[0].id;
          const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fullData = await contentRes.json();
          setData(fullData[collectionName] || []);
        } else {
          // 파일이 없으면 새로 생성 (빈 객체 {})
          console.log("📂 새 DB 파일 생성");
          const initialData = {};
          const file = new File([JSON.stringify(initialData)], DB_FILE_NAME, { type: 'application/json' });
          const uploaded = await uploadFileToDrive(file, folderId);
          fileId = uploaded.id;
          setData([]);
        }
        
        setDbFileId(fileId);
        isLoaded.current = true;
      } catch (error) {
        console.error("🚨 DB Load Error:", error);
      }
    };

    initDB();
  }, [userId, collectionName]);

  // 2. 안전한 저장 함수 (줄 세우기 적용)
  const saveDataToDrive = async (newData) => {
    // 화면은 즉시 반영
    setData(newData);

    if (data === null || !dbFileId) return;

    // 🔥 [핵심 2] 모든 저장을 줄 세워서(Queue) 순차적으로 처리
    saveQueue = saveQueue.then(async () => {
      const token = localStorage.getItem('google_access_token');
      if (!token) return;

      try {
        console.log(`💾 저장 시작: ${collectionName}...`);
        
        // 1. 최신 파일 내용 가져오기 (가장 중요)
        const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${dbFileId}?alt=media`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!contentRes.ok) {
           console.error("❌ 저장 중 파일 읽기 실패. 저장을 중단합니다.");
           return; 
        }

        const fullData = await contentRes.json();
        
        // 2. 데이터가 유효한지 체크 (빈 깡통이면 덮어쓰지 않음)
        if (!fullData || typeof fullData !== 'object') {
           console.error("❌ 파일 내용이 손상되었습니다. 덮어쓰기 방지.");
           return;
        }

        // 3. 내 데이터 병합
        fullData[collectionName] = newData;

        // 4. 업로드
        const file = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
        
        const updateRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${dbFileId}?uploadType=media`, {
          method: 'PATCH',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json' 
          },
          body: file
        });

        if (updateRes.ok) {
           console.log(`✅ 저장 완료: ${collectionName}`);
        } else {
           console.error(`❌ 저장 실패: ${updateRes.status}`);
        }

      } catch (error) {
        console.error("🚨 Save Queue Error:", error);
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