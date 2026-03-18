import React, { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// 선생님의 기존 파이어베이스 열쇠 (옛날 집 문 열기용)
const firebaseConfig = {
  apiKey: "AIzaSyCXoBZXNhJREag3cz0wpaUCLRJVkcGDLis",
  authDomain: "school-app-pro-e5660.firebaseapp.com",
  projectId: "school-app-pro-e5660",
  storageBucket: "school-app-pro-e5660.firebasestorage.app",
  messagingSenderId: "904262447588",
  appId: "1:904262447588:web:6b91d7e66b15feb3e797f1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function DataMigration({ onClose }) {
  const [status, setStatus] = useState("대기 중...");

  const handleMigration = async () => {
    const driveToken = localStorage.getItem('google_access_token');
    const fileId = localStorage.getItem('cached_file_id');
    
    if (!driveToken || !fileId) {
      return alert("뒷배경에 있는 메인 화면에서 구글 로그인이 된 상태여야 합니다!");
    }

    try {
      setStatus("파이어베이스(기존 DB) 로그인 창을 띄우는 중...");
      const result = await signInWithPopup(auth, provider);
      const userId = result.user.uid;
      
      setStatus(`데이터를 싹 긁어오는 중입니다... (계정: ${result.user.email})`);
      
      const allData = {};
      
      // 1. 교무수첩 가져오기
      const handbooksSnap = await getDocs(collection(db, `users/${userId}/handbooks`));
      const handbooks = handbooksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      allData['handbooks'] = handbooks;

      // 2. 각 수첩별 데이터 싹쓸이
      const subCollections = [
        'students_homeroom', 'students_subject', 'consultations', 'todos',
        'attendance', 'events', 'lesson_groups', 'meeting_logs',
        'my_timetable', 'class_photos', 'academic_schedule', 'education_plans'
      ];

      for (const hb of handbooks) {
        for (const sub of subCollections) {
          const colName = `${sub}_${hb.id}`;
          const snap = await getDocs(collection(db, `users/${userId}/${colName}`));
          const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (docs.length > 0) {
            allData[colName] = docs;
          }
        }
      }

      setStatus("구글 드라이브로 이삿짐을 통째로 옮기는 중...");

      // 3. 로컬 스토리지에 세팅
      localStorage.setItem('school_app_local_db', JSON.stringify(allData));
      
      // 4. 구글 드라이브 파일 덮어쓰기
      const file = new Blob([JSON.stringify(allData)], { type: 'application/json' });
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${driveToken}` },
        body: file
      });
      
      setStatus("✅ 성공! 구글 드라이브로 이사 완료!");
      alert("소중한 데이터가 완벽하게 복구되었습니다!\n이제 확인을 누르시면 화면이 새로고침되며 데이터가 나타납니다.");
      window.location.reload();
      
    } catch (error) {
      console.error(error);
      setStatus("❌ 에러 발생: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-indigo-600 mb-4">🚀 기존 데이터 복구하기</h2>
        <p className="text-gray-600 mb-6 text-sm leading-relaxed">
          파이어베이스에 보관된 선생님의 소중한 데이터를<br/>
          새로운 구글 드라이브 시스템으로 1초 만에 이사합니다.<br/>
          <span className="text-red-500 font-bold mt-2 inline-block">※ 버튼 클릭 후 나오는 창에서 동일한 구글 계정으로 로그인해주세요.</span>
        </p>
        <button 
          onClick={handleMigration}
          className="bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl w-full hover:bg-indigo-700 transition shadow-lg animate-pulse"
        >
          데이터 이사 시작 (클릭)
        </button>
        <p className="mt-4 text-sm font-bold text-red-500">{status}</p>
        <button onClick={onClose} className="mt-4 text-xs text-gray-400 underline hover:text-gray-600">닫기</button>
      </div>
    </div>
  );
}