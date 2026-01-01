import React, { useState, useRef } from 'react';
import { Calendar, RefreshCw, FilePlus } from 'lucide-react';

export default function AcademicSchedule({ apiKey }) {
  const [imgData, setImgData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedEvents, setExtractedEvents] = useState([]);
  const fileInputRef = useRef(null);

  const handleUpload = (e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setImgData(reader.result); analyzeImage(reader.result); }; reader.readAsDataURL(file); } };
  const analyzeImage = async (base64Image) => {
    setIsAnalyzing(true);
    try {
      const base64Data = base64Image.split(',')[1];
      const prompt = `이 학사일정 이미지에서 날짜와 행사명을 추출해줘. JSON 형식으로 반환해줘: [{"date": "YYYY-MM-DD", "title": "행사명"}] 날짜는 2026년을 기준으로 해줘.`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [ { text: prompt }, { inline_data: { mime_type: "image/jpeg", data: base64Data } } ] }] }) });
      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const jsonMatch = text.match(/\[.*\]/s);
      if (jsonMatch) { setExtractedEvents(JSON.parse(jsonMatch[0])); }
    } catch (e) { console.error(e); setExtractedEvents([{ date: "2026-03-02", title: "입학식 (예시)" }]); } finally { setIsAnalyzing(false); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 min-h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Calendar className="text-indigo-500"/> 학사일정 분석</h3><div className="flex gap-2"><button onClick={() => fileInputRef.current.click()} className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 dark:text-white dark:hover:bg-gray-700"><RefreshCw size={18}/> {imgData ? "다시 업로드" : "이미지 업로드"}</button><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload}/></div></div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8"><div className="border rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative min-h-[400px]">{imgData ? (<img src={imgData} alt="Schedule" className="max-w-full max-h-[500px] object-contain"/>) : (<div className="text-gray-400 text-center"><FilePlus size={48} className="mx-auto mb-2"/><p>학사일정 표 이미지를 업로드하세요</p></div>)}</div><div className="border rounded-xl p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800/50"><h4 className="font-bold mb-4 dark:text-white">📅 분석 결과</h4><ul className="space-y-2">{extractedEvents.map((evt, idx) => (<li key={idx} className="bg-white dark:bg-gray-700 p-3 rounded shadow-sm flex justify-between"><span className="font-bold text-indigo-600">{evt.date}</span><span className="dark:text-white">{evt.title}</span></li>))}</ul></div></div>
    </div>
  );
}