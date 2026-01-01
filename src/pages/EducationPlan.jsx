import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader, BookOpen } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js 워커 설정 (필수)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function EducationPlan({ apiKey }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(""); // 진행 상황 메시지
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  // 🔥 PDF 텍스트 추출 함수 (페이지 제한 없음)
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    const totalPages = pdf.numPages; // 전체 페이지 수

    // 🔥 1페이지부터 끝까지 반복
    for (let i = 1; i <= totalPages; i++) {
      setProgress(`${i} / ${totalPages} 페이지 텍스트 추출 중...`);
      
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      
      fullText += `\n--- Page ${i} ---\n${pageText}`;
    }

    return fullText;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!apiKey) return alert("환경설정에서 API 키를 먼저 등록해주세요.");

    setFileName(file.name);
    setLoading(true);
    setAnalysis("");

    try {
      // 1. 텍스트 추출
      const extractedText = await extractTextFromPDF(file);
      
      setProgress("AI가 교육계획서를 분석하고 있습니다... (잠시만 기다려주세요)");

      // 2. Gemini에게 전송
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        너는 베테랑 교사야. 아래 내용은 학교 교육계획서의 전체 내용이야.
        이 내용을 바탕으로 다음 항목들을 정리해서 마크다운 형식으로 알려줘.
        내용이 많으니 핵심 위주로 요약해줘.

        1. **학교 교육 목표 및 비전**: 학교가 추구하는 인재상과 목표
        2. **주요 학사 일정**: 입학식, 방학, 축제, 졸업식 등 핵심 날짜 (월별 정렬)
        3. **중점 교육 활동**: 특색 사업이나 강조하는 프로그램
        4. **평가 계획 요약**: 수행평가/지필평가 비율이나 특징적인 평가 방법
        5. **교사 유의사항**: 선생님들이 특히 챙겨야 할 행정/생활지도 포인트

        ---
        [교육계획서 내용]
        ${extractedText}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAnalysis(response.text());

    } catch (error) {
      console.error(error);
      alert("분석 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[600px]">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold dark:text-white flex items-center justify-center gap-2">
            <BookOpen className="text-indigo-600"/> 교육계획서 분석 (AI)
          </h2>
          <p className="text-gray-500 mt-2">PDF 파일을 올리면 전체 페이지를 분석하여 핵심을 요약해 드립니다.</p>
        </div>

        {/* 파일 업로드 영역 */}
        <div 
          onClick={() => fileInputRef.current.click()}
          className="w-full max-w-xl p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
        >
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Upload className="text-indigo-600 dark:text-indigo-400" size={32}/>
          </div>
          <p className="font-bold text-lg dark:text-gray-200">{fileName || "교육계획서 PDF 업로드"}</p>
          <p className="text-sm text-gray-400 mt-1">클릭하여 파일 선택 (페이지 제한 없음)</p>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/30 rounded-xl w-full max-w-xl animate-pulse">
            <Loader className="animate-spin mx-auto text-indigo-600 mb-3" size={32}/>
            <p className="font-bold text-indigo-600 dark:text-indigo-400">분석 중입니다...</p>
            <p className="text-xs text-gray-500 mt-1">{progress}</p>
          </div>
        )}

        {/* 분석 결과 */}
        {!loading && analysis && (
          <div className="w-full max-w-4xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b pb-4 dark:border-gray-700">
              <CheckCircle className="text-green-500"/>
              <h3 className="text-xl font-bold dark:text-white">분석 결과 요약</h3>
            </div>
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
              {analysis}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}