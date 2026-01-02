import React, { useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { uploadFileToDrive } from '../utils/googleDrive';

export default function MyTimetable({ timetableData, onUpdateTimetable }) {
  const fileInputRef = useRef(null);
  const currentImage = timetableData && timetableData.length > 0 ? timetableData[0].imageUrl : null;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const folderId = localStorage.getItem('cached_folder_id');
      const uploaded = await uploadFileToDrive(file, folderId);
      
      // 구글 드라이브 이미지 링크 (미리보기용 - 실제 구현 시 썸네일 링크 필요할 수 있음)
      // *주의: Google Drive API로 이미지를 직접 표시하려면 파일 ID로 content link를 가져와야 함.
      // 여기서는 예시로 webContentLink를 가정하거나 API 응답 구조에 따름.
      // 편의상 업로드 성공만 처리하고, 실제 표시는 webContentLink 등을 사용해야 함.
      // 이 예시 코드는 업로드 후 '성공' 메시지를 띄우고, 데이터에 id를 저장하는 구조임.
      
      const newItem = { id: 'my_timetable_img', imageUrl: uploaded.webContentLink };
      
      if (timetableData.length > 0) {
        onUpdateTimetable(timetableData[0].id, newItem);
      } else {
        // App.jsx에서 add 기능을 안 내렸으므로 update로 처리하거나, 
        // 실제로는 addMeetingLog처럼 add 함수를 내려받아야 함.
        // 여기서는 상위 컴포넌트(App.jsx)가 초기 배열을 빈 상태로 주면 add가 필요함.
        // 안전하게 alert만 띄움 (실제 구현 시 App.jsx에서 addMyTimetable 내려주세요)
        alert("이미지 업로드 성공! (데이터 연동 필요)");
      }
    } catch (error) {
      console.error(error);
      alert("업로드 실패");
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
          <h2 className="font-bold text-lg dark:text-white flex items-center gap-2"><ImageIcon/> 나의 시간표</h2>
          <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-700">
            <Upload size={16}/> 이미지 업로드
          </button>
          <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
        </div>
        
        <div className="flex-1 bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-auto p-4">
          {currentImage ? (
            <img src={currentImage} alt="TimeTable" className="max-w-full max-h-full object-contain shadow-md" />
          ) : (
            <div className="text-center text-gray-400">
              <ImageIcon size={48} className="mx-auto mb-2 opacity-50"/>
              <p>시간표 이미지를 업로드해주세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}