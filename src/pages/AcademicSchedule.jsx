import React, { useState, useRef } from 'react';
import { Calendar, Upload, FileText, X, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx'; // 엑셀 파싱용

export default function AcademicSchedule() {
  const [fileContent, setFileContent] = useState(null); // { type: 'excel' | 'pdf', data: ... }
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === 'xlsx' || fileType === 'xls') {
      // 엑셀 파일 처리
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // 엑셀 데이터를 JSON 배열(2차원 배열)로 변환
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        setFileContent({ type: 'excel', data });
      };
      reader.readAsBinaryString(file);
    } else if (fileType === 'pdf') {
      // PDF 파일 처리
      const url = URL.createObjectURL(file);
      setFileContent({ type: 'pdf', url });
    } else {
      alert("엑셀(.xlsx) 또는 PDF(.pdf) 파일만 지원합니다.");
    }
  };

  const clearFile = () => {
    setFileContent(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
          <Calendar className="text-indigo-600"/> 학사일정
        </h2>
        <div className="flex gap-2">
          {fileContent && (
            <button onClick={clearFile} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-red-200 transition">
              <X size={18}/> 파일 닫기
            </button>
          )}
          <button onClick={() => fileInputRef.current.click()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold hover:bg-indigo-700 transition">
            <Upload size={18}/> 일정 업로드 (PDF/엑셀)
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
          <div className="flex-1 w-full h-full overflow-auto">
            {/* 1. 엑셀 뷰어 */}
            {fileContent.type === 'excel' && (
              <div className="p-4 w-full">
                <div className="mb-4 p-2 bg-green-50 text-green-800 rounded-lg flex items-center gap-2 font-bold text-sm sticky top-0">
                  <FileSpreadsheet size={16}/> {fileName}
                </div>
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
                className="w-full h-full border-none" 
                title="PDF Preview"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}