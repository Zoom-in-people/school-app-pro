import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Upload, FileText, X, FileSpreadsheet, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadFileToDrive } from '../utils/googleDrive';

export default function AcademicSchedule({ scheduleData = [], onUpdateSchedule, onAddSchedule, onDeleteSchedule }) {
  const [fileContent, setFileContent] = useState(null);
  const fileInputRef = useRef(null);

  // DB에서 데이터 로드
  useEffect(() => {
    if (scheduleData && scheduleData.length > 0) {
      const savedData = scheduleData.find(item => item.id === 'main_schedule') || scheduleData[0];
      if (savedData) setFileContent(savedData);
    } else {
      setFileContent(null);
    }
  }, [scheduleData]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem('google_access_token');
    if (!token) {
      alert("⚠️ 구글 로그인 세션이 만료되었습니다.\n\n안전한 데이터 저장을 위해 [로그아웃] 후 다시 로그인해주세요.");
      return;
    }

    const fileType = file.name.split('.').pop().toLowerCase();
    
    // 1. 엑셀 처리
    if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const contentData = { 
          id: 'main_schedule',
          type: 'excel', 
          data, 
          fileName: file.name 
        };
        setFileContent(contentData);
        saveToDB(contentData);
      };
      reader.readAsBinaryString(file);
    } 
    // 2. PDF 처리
    else if (fileType === 'pdf') {
      try {
        const folderId = localStorage.getItem('cached_folder_id');
        const uploaded = await uploadFileToDrive(file, folderId);
        
        // 🔥 [수정] webViewLink가 없을 경우 안전하게 처리 (에러 원인 해결)
        let previewUrl;
        
        if (uploaded && uploaded.webViewLink) {
            // webViewLink가 정상적으로 있으면 사용
            previewUrl = uploaded.webViewLink.replace('/view', '/preview');
        } else if (uploaded && uploaded.id) {
            // webViewLink가 없으면 ID로 직접 링크 생성 (안전장치)
            previewUrl = `https://drive.google.com/file/d/${uploaded.id}/preview`;
        } else {
            throw new Error("업로드된 파일 정보를 가져올 수 없습니다.");
        }

        const contentData = {
          id: 'main_schedule',
          type: 'pdf',
          url: previewUrl,
          fileName: file.name
        };
        setFileContent(contentData);
        saveToDB(contentData);

      } catch (error) {
        console.error(error);
        alert(`⚠️ 업로드 실패: ${error.message}\n\n구글 드라이브 권한 문제일 수 있습니다. 재로그인 해보세요.`);
      }
    } else {
      alert("엑셀(.xlsx) 또는 PDF(.pdf) 파일만 지원합니다.");
    }
  };

  const saveToDB = (data) => {
    const existing = scheduleData.find(item => item.id === 'main_schedule');
    if (existing) onUpdateSchedule('main_schedule', data);
    else onAddSchedule(data);
  };

  const handleDelete = () => {
    if (window.confirm("학사일정 파일을 삭제하시겠습니까?")) {
      if (fileContent && fileContent.id) onDeleteSchedule(fileContent.id);
      setFileContent(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Calendar className="text-indigo-600"/> 학사일정
        </h2>
        <div className="flex gap-2">
          {fileContent && (
            <button onClick={handleDelete} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-red-200 transition">
              <Trash2 size={18}/> 삭제
            </button>
          )}
          <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition">
            <Upload size={18}/> {fileContent ? '일정 교체' : '일정 업로드'}
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleUpload} accept=".xlsx, .xls, .pdf" className="hidden" />
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col relative">
        {!fileContent ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <FileText size={40} className="opacity-50"/>
            </div>
            <p className="text-lg font-bold">등록된 학사일정이 없습니다.</p>
            <p className="text-sm mt-2">우측 상단 버튼을 눌러 파일을 업로드하세요.</p>
            <p className="text-xs mt-1 text-gray-400">(엑셀은 표 형태로, PDF는 미리보기로 표시됩니다)</p>
          </div>
        ) : (
          <div className="flex-1 w-full h-full overflow-auto flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between sticky top-0 z-20">
               <div className="flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
                  {fileContent.type === 'excel' ? <FileSpreadsheet size={16} className="text-green-600"/> : <FileText size={16} className="text-red-500"/>}
                  {fileContent.fileName}
               </div>
            </div>

            {fileContent.type === 'excel' && (
              <div className="p-4 w-full">
                <table className="w-full border-collapse text-sm text-left">
                  <tbody>
                    {fileContent.data.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className={`p-3 border-r border-gray-100 dark:border-gray-700 ${rowIndex === 0 ? 'font-bold bg-gray-50 dark:bg-gray-700' : ''}`}>
                            {cell || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {fileContent.type === 'pdf' && (
              <iframe 
                src={fileContent.url} 
                className="w-full h-full flex-1 border-none" 
                title="PDF Preview"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}