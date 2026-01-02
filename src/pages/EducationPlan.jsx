import React, { useState } from 'react';
import { Upload, FileText, Loader, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function EducationPlan({ apiKey }) {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!apiKey) {
      alert("API 키가 설정되지 않았습니다. [설정] 메뉴에서 API 키를 먼저 등록해주세요.");
      return;
    }

    setFile(uploadedFile);
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const filePart = await fileToGenerativePart(uploadedFile);

      const prompt = `
        당신은 30년차 베테랑 초등학교 및 고등학교 교사입니다. 
        탁월한 업무 수행 능력과 교육과정 문해력을 갖추고 있어, 어떤 복잡한 교육계획서라도 핵심을 빠르고 정확하게 파악합니다.
        
        [임무]
        첨부된 교육계획서(PDF)를 정밀 분석하여 다음 3가지 항목으로 정리해 주세요.
        내용은 구체적이고 실질적이어야 하며, 선생님들이 바로 참고할 수 있도록 요약하세요.

        1. 🎯 핵심 교육 목표 및 비전 (3줄 요약)
        2. 📅 주요 학사 일정 및 필수 행사 (월별 핵심 사항 정리)
        3. 💡 교육과정 재구성 포인트 및 수업 아이디어 (교과 연계, 창체 활용 등 전문적인 제언 포함)

        [출력 스타일]
        - 전문적인 교육 용어를 적절히 사용하십시오.
        - 가독성 좋게 마크다운 형식으로 작성하십시오.
        - 내용은 너무 짧지 않게, 충분한 정보를 담아주세요.
      `;

      // 🔥 [수정] 요청하신 gemini-2.5-flash 모델 적용
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              filePart 
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Details:", errorData);
        let msg = errorData.error?.message || "알 수 없는 오류";
        // 2.5 버전 호출 시 혹시라도 발생할 수 있는 404 등에 대한 메시지 처리
        if (response.status === 404) msg = "모델을 찾을 수 없습니다. (API 키 권한을 확인해주세요)";
        throw new Error(`API 호출 실패 (${response.status}): ${msg}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("AI가 응답을 생성하지 못했습니다. (내용 정책 등으로 차단됨)");
      }

      const text = data.candidates[0].content.parts[0].text;
      setResult(text);

    } catch (err) {
      console.error(err);
      setError(`${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
        <FileText className="text-indigo-600"/> 교육계획서 분석
      </h2>
      
      {!file ? (
        <label className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition bg-white dark:bg-gray-900">
          <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
            <Upload size={40} className="text-indigo-500"/>
          </div>
          <span className="text-lg font-bold text-gray-700 dark:text-gray-300">교육계획서 PDF 업로드</span>
          <span className="text-sm text-gray-500 mt-2">AI가 내용을 심층 분석하여 핵심을 요약해 드립니다.</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
        </label>
      ) : (
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-indigo-600"/>
              <span className="font-bold text-lg truncate max-w-md">{file.name}</span>
            </div>
            <button onClick={handleDelete} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold transition">
              <Trash2 size={16}/> 다른 파일 올리기
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                <Loader className="animate-spin w-12 h-12 text-indigo-600"/>
                <div>
                  <p className="text-xl font-bold text-indigo-600 animate-pulse">AI가 교육계획서를 분석 중입니다...</p>
                  <p className="text-sm text-gray-500 mt-2">30년차 베테랑 교사의 시각으로 꼼꼼히 살펴보고 있습니다.<br/>잠시만 기다려 주세요.</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center text-red-500 gap-2">
                <AlertCircle size={48}/>
                <p className="font-bold text-lg">오류가 발생했습니다</p>
                <p className="text-sm text-center max-w-md bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>
                <p className="text-xs text-gray-400 mt-2">💡 Tip: API 키가 올바른지 다시 확인해보세요.</p>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle className="text-green-500" size={24}/>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">분석 결과</h3>
                </div>
                <div className="prose dark:prose-invert max-w-none bg-indigo-50/50 dark:bg-gray-700/30 p-8 rounded-2xl border border-indigo-100 dark:border-gray-600">
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-200">
                    {result}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}