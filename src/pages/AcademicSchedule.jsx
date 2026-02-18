import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Upload, FileText, FileSpreadsheet, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadFileToStorage, deleteFileFromStorage } from '../utils/storage';

export default function AcademicSchedule({ scheduleData = [], onUpdateSchedule, onAddSchedule, onDeleteSchedule }) {
  const [fileContent, setFileContent] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (scheduleData?.length > 0) {
      const savedData = scheduleData.find(item => item.id === 'main_schedule') || scheduleData[0];
      if (savedData) setFileContent(savedData);
    } else setFileContent(null);
  }, [scheduleData]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileType = file.name.split('.').pop().toLowerCase();
    
    if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const contentData = { id: 'main_schedule', type: 'excel', data, fileName: file.name };
        setFileContent(contentData);
        saveToDB(contentData);
      };
      reader.readAsBinaryString(file);
    } else if (fileType === 'pdf') {
      try {
        const uploaded = await uploadFileToStorage(file, 'schedules');
        const contentData = { id: 'main_schedule', type: 'pdf', url: uploaded.url, fullPath: uploaded.fullPath, fileName: file.name };
        setFileContent(contentData);
        saveToDB(contentData);
      } catch (error) { alert("업로드 실패: " + error.message); }
    } else { alert("엑셀(.xlsx) 또는 PDF 파일만 지원합니다."); }
  };

  const saveToDB = (data) => {
    const existing = scheduleData.find(item => item.id === 'main_schedule');
    if (existing) onUpdateSchedule('main_schedule', data);
    else onAddSchedule(data);
  };

  const handleDelete = async () => {
    if (window.confirm("삭제하시겠습니까?")) {
      if (fileContent?.fullPath) await deleteFileFromStorage(fileContent.fullPath);
      if (fileContent?.id) onDeleteSchedule(fileContent.id);
      setFileContent(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Calendar className="text-indigo-600"/> 학사일정</h2>
        <div className="flex gap-2">
          {fileContent && <button onClick={handleDelete} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl font-bold flex gap-2"><Trash2 size={18}/> 삭제</button>}
          <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex gap-2"><Upload size={18}/> {fileContent ? '교체' : '업로드'}</button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".xlsx, .xls, .pdf" className="hidden" />
      </div>
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col relative">
        {!fileContent ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10"><FileText size={40} className="opacity-50 mb-4"/><p>등록된 일정이 없습니다.</p></div>
        ) : (
          <div className="flex-1 w-full h-full overflow-auto flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
               {fileContent.type === 'excel' ? <FileSpreadsheet size={16} className="text-green-600"/> : <FileText size={16} className="text-red-500"/>} {fileContent.fileName}
            </div>
            {fileContent.type === 'excel' && (
              <div className="p-4"><table className="w-full border-collapse text-sm text-left"><tbody>{fileContent.data.map((row, i) => <tr key={i} className="border-b dark:border-gray-700">{row.map((cell, j) => <td key={j} className="p-3 border-r dark:border-gray-700">{cell}</td>)}</tr>)}</tbody></table></div>
            )}
            {fileContent.type === 'pdf' && <iframe src={fileContent.url} className="w-full h-full flex-1 border-none" title="PDF Preview"/>}
          </div>
        )}
      </div>
    </div>
  );
}