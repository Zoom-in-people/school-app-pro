import { useState, useEffect, useRef } from 'react';
import { getOrCreateFolder, uploadFileToDrive } from '../utils/googleDrive';

const DB_FILE_NAME = 'school_app_db.json';

export function useGoogleDriveDB(collectionName, userId) {
  // 🔥 [핵심 1] 초기값을 null로 설정하여 "로딩 중" 상태와 "데이터 없음"을 구분
  const [data, setData] = useState(null);
  const [dbFileId, setDbFileId] = useState(null);
  const isLoaded = useRef(false);

  // 1. 드라이브에서 DB 파일 찾기 및 로드
  useEffect(() => {
    // 유저가 없으면 중단
    if (!userId) {
      setData([]); // 로그아웃 상태면 빈 배열
      return;
    }
    
    // 이미 로드했으면 중단 (중복 호출 방지)
    if (isLoaded.current) return;

    const initDB = async () => {
      // 🔥 [핵심 2] 토큰을 로컬스토리지(localStorage)에서 가져오도록 변경 (새로고침 대응)
      // (useAuth.js도 수정해야 함)
      const token = localStorage.getItem('google_access_token') || sessionStorage.getItem('google_access_token');
      
      if (!token) {
        console.warn("구글 드라이브 토큰이 없습니다. 재로그인이 필요합니다.");
        // 토큰이 없으면 데이터를 비우지 않고 null로 두거나, 에러 처리를 해야 함
        return;
      }

      try {
        const folderId = await getOrCreateFolder('교무수첩 데이터');
        
        const q = `'${folderId}' in parents and name='${DB_FILE_NAME}' and trashed=false`;
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // 🔥 토큰 만료(401) 체크
        if (res.status === 401) {
          alert("구글 연결이 만료되었습니다. 로그아웃 후 다시 로그인해주세요.");
          return;
        }

        const result = await res.json();

        if (result.files && result.files.length > 0) {
          const fileId = result.files[0].id;
          setDbFileId(fileId);
          
          const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const fullData = await contentRes.json();
          // 데이터가 있으면 넣고, 없으면 빈 배열
          setData(fullData[collectionName] || []);
        } else {
          // 파일이 아예 없으면 새로 생성
          const initialData = { [collectionName]: [] };
          const file = new Blob([JSON.stringify(initialData)], { type: 'application/json' });
          const uploaded = await uploadFileToDrive({ name: DB_FILE_NAME }, folderId, file);
          setDbFileId(uploaded.id);
          setData([]);
        }
        isLoaded.current = true;
      } catch (error) {
        console.error("DB Init Error:", error);
        alert("데이터를 불러오는 중 오류가 발생했습니다: " + error.message);
      }
    };

    initDB();
  }, [userId, collectionName]);

  // 2. 데이터 저장
  const saveDataToDrive = async (newData) => {
    // 🔥 [핵심 3] 데이터가 로딩되기도 전에(null 상태) 저장을 시도하면 절대 안됨 (데이터 날림 방지)
    if (data === null) return;

    // 화면 선반영
    setData(newData); 

    const token = localStorage.getItem('google_access_token') || sessionStorage.getItem('google_access_token');
    if (!token || !dbFileId) return;

    try {
      // 최신 전체 데이터를 가져와서 병합
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
      alert("저장 중 오류가 발생했습니다. 네트워크를 확인해주세요.");
    }
  };

  const add = async (item) => {
    if (data === null) return; // 로딩 전 방어
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

  // data가 null이면 빈 배열을 반환하되, 로딩 상태를 알 수 있게 해야 함
  // 여기서는 UI 깨짐 방지를 위해 로딩 중일 땐 빈 배열 반환 (하지만 UI에서 로딩바 처리 추천)
  return { data: data || [], add, remove, update, isLoading: data === null };
}