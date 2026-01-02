import React, { useState, useRef, useEffect } from 'react';
import { Clock, Upload, FileText, Trash2, Image as ImageIcon } from 'lucide-react';
import { uploadFileToDrive } from '../utils/googleDrive';

export default function MyTimetable({ timetableData = [], onAddTimetable, onUpdateTimetable, onDeleteTimetable }) {
  const [fileContent, setFileContent] = useState(null);
  const fileInputRef = useRef(null);

  // DB에서 불러오기
  useEffect(() => {
    if (timetableData && timetableData.length > 0) {
      const saved = timetableData.find(t => t.id === 'main_timetable') || timetableData[0];
      if (saved) setFileContent(saved);
    } else {
      setFileContent(null);
    }
  }, [timetableData]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 토큰 체크
    const token = localStorage.getItem('google_access_token');
    if (!token) {
      alert("구글 로그인 세션이 만료되었습니다. 재로그인 해주세요.");
      return;
    }

    try {
      const folderId = localStorage.getItem('cached_folder_id');
      const uploaded = await uploadFileToDrive(file, folderId);
      
      // 이미지 타입에 따라 미리보기 링크 처리
      // (이미지 파일은 webContentLink 사용 가능)
      const data = {
        id: 'main_timetable',
        url: uploaded.webContentLink, // 다운로드/표시 링크
        viewUrl: uploaded.webViewLink, // 드라이브 뷰어 링크
        fileName: file.name,
        mimeType: file.type
      };

      setFileContent(data);
      
      // DB 저장
      const existing = timetableData.find(t => t.id === 'main_timetable');
      if (existing) onUpdateTimetable('main_timetable', data);
      else onAddTimetable(data);

    } catch (error) {
      console.error(error);
      alert("업로드 실패: 권한을 확인해주세요.");
    }
  };

  const handleDelete = () => {
    if(window.confirm("시간표를 삭제하시겠습니까?")) {
      if (fileContent && fileContent.id) {
        onDeleteTimetable(fileContent.id);
      }
      setFileContent(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Clock className="text-indigo-600"/> 나의 시간표
        </h2>
        <div className="flex gap-2">
          {fileContent && (
            <button onClick={handleDelete} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-red-200 transition">
              <Trash2 size={18}/> 삭제
            </button>
          )}
          <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition">
            <Upload size={18}/> {fileContent ? '시간표 교체' : '이미지 업로드'}
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col relative items-center justify-center p-4">
        {!fileContent ? (
          <div className="text-center text-gray-400">
            <ImageIcon size={48} className="mx-auto mb-2 opacity-50"/>
            <p className="text-lg font-bold">등록된 시간표가 없습니다.</p>
            <p className="text-sm mt-1">우측 상단 버튼을 눌러 시간표 이미지(JPG, PNG 등)를 업로드하세요.</p>
          </div>
        ) : (
          <img 
            src={fileContent.url} 
            alt="My Timetable" 
            className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
          />
        )}
      </div>
    </div>
  );
}