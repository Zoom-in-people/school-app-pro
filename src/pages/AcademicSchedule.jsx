import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Upload, FileText, X, FileSpreadsheet, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { uploadFileToDrive } from '../utils/googleDrive'; // Drive 업로드 유틸

export default function AcademicSchedule({ scheduleData = [], onUpdateSchedule, onAddSchedule, onDeleteSchedule }) {
  const [fileContent, setFileContent] = useState(null); // { type: 'excel' | 'pdf', data: ..., url: ..., fileName: ... }
  const fileInputRef = useRef(null);

  // 🔥 [핵심] DB에서 데이터가 로드되면 화면에 표시
  useEffect(() => {
    if (scheduleData && scheduleData.length > 0) {
      // 가장 최근 파일 하나만 사용 (id='main_schedule'로 관리할 예정)
      const savedData = scheduleData.find(item => item.id === 'main_schedule') || scheduleData[0];
      if (savedData) {
        setFileContent(savedData);
      }
    } else {
      setFileContent(null);
    }
  }, [scheduleData]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    
    // 1. 엑셀 파일 처리
    if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        const contentData = { 
          id: 'main_schedule', // 고정 ID 사용하여 덮어쓰기 유도
          type: 'excel', 
          data, 
          fileName: file.name 
        };

        // 로컬 상태 업데이트 + DB 저장
        setFileContent(contentData);
        saveToDB(contentData);
      };
      reader.readAsBinaryString(file);
    } 
    // 2. PDF 파일 처리 (Drive 업로드 후 링크 저장)
    else if (fileType === 'pdf') {
      try {
        const folderId = localStorage.getItem('cached_folder_id');
        const uploaded = await uploadFileToDrive(file, folderId);
        
        // Drive 뷰어 링크를 임베드용 프리뷰 링크로 변환
        // 예: .../view -> .../preview
        const previewUrl = uploaded.webViewLink.replace('/view', '/preview');

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
        alert("PDF 업로드 실패: 구글 드라이브 권한을 확인해주세요.");
      }
    } else {
      alert("엑셀(.xlsx) 또는 PDF(.pdf) 파일만 지원합니다.");
    }
  };

  const saveToDB = (data) => {
    // 기존 데이터가 있으면 업데이트, 없으면 추가
    const existing = scheduleData.find(item => item.id === 'main_schedule');
    if (existing) {
      onUpdateSchedule('main_schedule', data);
    } else {
      onAddSchedule(data);
    }
  };

  const handleDelete = () => {
    if (window.confirm("학사일정 파일을 삭제하시겠습니까?")) {
      if (fileContent && fileContent.id) {
        onDeleteSchedule(fileContent.id);
      }
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
          {/* 이미 파일이 있으면 '교체', 없으면 '업로드' */}
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
            {/* 파일명 헤더 */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between sticky top-0 z-20">
               <div className="flex items-center gap-2 font-bold text-sm text-gray-700 dark:text-gray-200">
                  {fileContent.type === 'excel' ? <FileSpreadsheet size={16} className="text-green-600"/> : <FileText size={16} className="text-red-500"/>}
                  {fileContent.fileName}
               </div>
            </div>

            {/* 1. 엑셀 뷰어 */}
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

            {/* 2. PDF 뷰어 */}
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