import React, { useState, useRef } from 'react';
import { Calendar, Upload, FileText, X } from 'lucide-react';

export default function AcademicSchedule() {
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Calendar className="text-indigo-600"/> 학사일정</h2>
        <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition">
          <Upload size={18}/> 파일 업로드 (PDF/Excel)
        </button>
        <input type="file" ref={fileInputRef} onChange={handleUpload} multiple className="hidden" />
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm overflow-y-auto">
        {files.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <FileText size={48} className="mb-2 opacity-50"/>
            <p>등록된 학사일정 파일이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file, idx) => (
              <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center relative group hover:border-indigo-500 bg-gray-50 dark:bg-gray-700/50 transition">
                <button onClick={() => removeFile(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={16}/></button>
                <FileText size={32} className="text-indigo-500 mb-2"/>
                <span className="text-sm font-bold text-center truncate w-full px-2" title={file.name}>{file.name}</span>
                <span className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}