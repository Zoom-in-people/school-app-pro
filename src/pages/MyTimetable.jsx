import React, { useRef, useState } from 'react';
import { Upload, Trash2, Clock, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadFileToStorage, deleteFileFromStorage } from '../utils/storage';

export default function MyTimetable({ timetableData = [], onAddTimetable, onUpdateTimetable, onDeleteTimetable }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // DB에 배열 형태로 저장되므로 첫 번째 문서를 현재 시간표로 사용
  const timetable = timetableData && timetableData.length > 0 ? timetableData[0] : null;

  // 🔥 2번 요청: 구글 드라이브 연동 업로드
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      // 새 사진을 올리면 기존 드라이브 사진은 삭제
      if (timetable?.fullPath) {
        await deleteFileFromStorage(timetable.fullPath);
      }

      const uploaded = await uploadFileToStorage(file, 'timetable');
      const newTimetable = {
        url: uploaded.url,
        fullPath: uploaded.fullPath,
        updatedAt: new Date().toISOString()
      };

      if (timetable) onUpdateTimetable(timetable.id, newTimetable);
      else onAddTimetable(newTimetable);
      
    } catch (error) {
      alert("업로드 실패: " + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 🔥 2번 요청: 삭제 버튼 로직 (드라이브에서도 완전 삭제)
  const handleDelete = async () => {
    if (!window.confirm("시간표를 삭제하시겠습니까? (구글 드라이브에서도 완전히 삭제됩니다)")) return;
    
    if (timetable?.fullPath) {
      setUploading(true);
      try {
        await deleteFileFromStorage(timetable.fullPath);
        onDeleteTimetable(timetable.id);
      } catch (error) {
        alert("삭제 실패: " + error.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Clock className="text-indigo-600"/> 나의 시간표</h2>
        <div className="flex gap-2">
          {timetable?.url && (
            <button onClick={handleDelete} disabled={uploading} className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50">
              <Trash2 size={18}/> 삭제
            </button>
          )}
          <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-sm">
            {uploading ? <Loader className="animate-spin" size={18}/> : <Upload size={18}/>} 
            {uploading ? '업로드 중...' : '새 시간표 업로드'}
          </button>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center p-4">
        {timetable?.url ? (
          <img src={timetable.url} alt="Timetable" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
        ) : (
          <div className="text-center text-gray-400 flex flex-col items-center">
            <ImageIcon size={64} className="mb-4 opacity-20 text-indigo-500"/>
            <p className="text-xl font-bold mb-2">등록된 시간표가 없습니다</p>
            <p className="text-sm">우측 상단 버튼을 눌러 시간표 이미지를 업로드하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}