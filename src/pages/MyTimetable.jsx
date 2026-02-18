import React, { useState, useRef, useEffect } from 'react';
import { Clock, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { uploadFileToStorage, deleteFileFromStorage } from '../utils/storage';

export default function MyTimetable({ timetableData = [], onAddTimetable, onUpdateTimetable, onDeleteTimetable }) {
  const [fileContent, setFileContent] = useState(null);
  const fileInputRef = useRef(null);

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

    try {
      const uploaded = await uploadFileToStorage(file, 'timetables');
      const data = {
        id: 'main_timetable',
        url: uploaded.url,
        fullPath: uploaded.fullPath,
        fileName: uploaded.name
      };
      setFileContent(data);
      
      const existing = timetableData.find(t => t.id === 'main_timetable');
      if (existing) onUpdateTimetable('main_timetable', data);
      else onAddTimetable(data);
    } catch (error) {
      alert("업로드 실패: " + error.message);
    }
  };

  const handleDelete = async () => {
    if(window.confirm("삭제하시겠습니까?")) {
      if (fileContent) {
        if (fileContent.fullPath) await deleteFileFromStorage(fileContent.fullPath);
        if (fileContent.id) onDeleteTimetable(fileContent.id);
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
          {fileContent && <button onClick={handleDelete} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold flex gap-2"><Trash2 size={18}/> 삭제</button>}
          <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex gap-2"><Upload size={18}/> {fileContent ? '교체' : '업로드'}</button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleUpload} accept="image/*" className="hidden" />
      </div>
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-center p-4">
        {!fileContent ? <div className="text-center text-gray-400"><ImageIcon size={48} className="mx-auto mb-2 opacity-50"/><p>등록된 시간표가 없습니다.</p></div> : <img src={fileContent.url} alt="Timetable" className="max-w-full max-h-full object-contain rounded-lg"/>}
      </div>
    </div>
  );
}