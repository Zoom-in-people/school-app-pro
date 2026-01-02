import React, { useState } from 'react';
import { Upload, FileText, Loader, Trash2 } from 'lucide-react';

export default function EducationPlan() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null); 

  const handleUpload = (e) => {
    const uploaded = e.target.files[0];
    if (uploaded) {
      setFile(uploaded);
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        setResult("교육과정 재구성 포인트: \n1. 문해력 강화 수업 (국어-사회 연계)\n2. AI 도구 활용 데이터 분석 (실과-수학 연계)\n3. 생태 환경 프로젝트 (창체)"); 
      }, 3000);
    }
  };

  const handleDelete = () => { setFile(null); setResult(null); setIsAnalyzing(false); };

  return (
    <div className="h-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><FileText className="text-indigo-600"/> 교육계획서 분석</h2>
      
      {!file ? (
        <label className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <Upload size={48} className="text-gray-400 mb-2"/>
          <span className="text-gray-500">PDF 파일을 이곳에 드래그하거나 클릭하여 업로드</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        </label>
      ) : (
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
          <FileText size={48} className="text-indigo-600 mb-4"/>
          <h3 className="text-lg font-bold mb-2">{file.name}</h3>
          
          {isAnalyzing ? (
            <div className="flex flex-col items-center gap-2 text-indigo-600 animate-in fade-in">
              <Loader className="animate-spin"/>
              <span className="font-bold">AI가 교육계획서를 분석 중입니다...</span>
            </div>
          ) : (
            <div className="text-center w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-4 font-bold border border-green-200">✅ 분석 완료</div>
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl text-left text-sm whitespace-pre-wrap border border-gray-200 dark:border-gray-600 leading-relaxed shadow-inner">
                {result}
              </div>
              <button onClick={handleDelete} className="mt-6 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition"><Trash2 size={16}/> 파일 삭제 및 다시 올리기</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}