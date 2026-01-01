import React, { useState } from 'react';
import { Zap, X, Save, Plus } from 'lucide-react';

export default function AiGenModal({ student, onClose, apiKey, onSave, onUpdateStudent }) {
  const [keywords, setKeywords] = useState("");
  const [result, setResult] = useState(student.aiGeneratedText || "");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('input');
  const [newTag, setNewTag] = useState("");

  const handleAddTag = () => {
    if (newTag && !student.tags.includes(newTag)) {
      onUpdateStudent({ ...student, tags: [...student.tags, newTag] });
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    onUpdateStudent({ ...student, tags: student.tags.filter(t => t !== tag) });
  };

  const generateText = async () => {
    if (!keywords.trim() && student.tags.length === 0) return;
    setIsLoading(true);
    try {
      const prompt = `
        당신은 학교 생활기록부 작성 전문가입니다. 
        다음 학생(${student.name})의 특징 키워드와 태그를 바탕으로, 교육적이고 긍정적이며 구체적인 '과목별 세부능력 및 특기사항'을 작성해주세요.
        
        - 학생 태그: ${student.tags.join(', ')}
        - 추가 관찰 키워드: ${keywords}
        
        문체: ~함, ~임 등의 개조식 서술형 어미 사용.
        분량: 3~4문장.
        주의: 학생 이름을 직접 언급하지 말고 생략하거나 지칭을 최소화하세요.
      `;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const data = await response.json();
      if(data.error) throw new Error(data.error.message);
      
      setResult(data.candidates[0].content.parts[0].text);
      setStep('result');
    } catch (e) {
      alert("AI 생성 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-indigo-600 text-white rounded-t-xl">
          <h3 className="font-bold text-lg flex items-center gap-2"><Zap size={20} className="text-yellow-300"/> AI 세특 도우미</h3>
          <button onClick={onClose} className="hover:bg-indigo-500 p-1 rounded transition"><X size={20}/></button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Tags Section */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">학생 특성 태그 (AI가 참고합니다)</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {student.tags.map(tag => (
                <span key={tag} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  #{tag}
                  <X size={12} onClick={() => handleRemoveTag(tag)} className="cursor-pointer hover:text-red-500"/>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 border p-2 rounded text-sm dark:bg-gray-600 dark:border-gray-500 dark:text-white" 
                placeholder="새 태그 추가 (예: 성실함)"
              />
              <button onClick={handleAddTag} className="bg-gray-200 dark:bg-gray-600 px-3 rounded text-sm"><Plus size={16}/></button>
            </div>
          </div>

          <div className="space-y-4">
             {step === 'input' ? (
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   추가 관찰 키워드 입력 <span className="text-red-500">*</span>
                 </label>
                 <textarea 
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="예: 이번 학기 과학 실험 조장, 현미경 조작 능숙..."
                  className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 resize-none dark:text-white"
                 />
               </div>
             ) : (
               <div>
                 <div className="flex justify-between items-end mb-1">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">AI 생성 결과</label>
                 </div>
                 <textarea 
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  className="w-full h-40 p-3 border border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed dark:text-white"
                 />
               </div>
             )}
          </div>
        </div>

        <div className="p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex justify-end gap-3">
          {step === 'input' ? (
             <button 
              onClick={generateText} 
              disabled={isLoading || (!keywords && student.tags.length === 0)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isLoading ? <span className="animate-spin">⌛</span> : '✨ AI 문장 생성하기'}
             </button>
          ) : (
             <>
               <button 
                onClick={() => setStep('input')}
                className="px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 transition"
               >
                 다시 작성
               </button>
               <button 
                onClick={() => onSave(result)}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
               >
                 <Save size={18} /> 저장하고 닫기
               </button>
             </>
          )}
        </div>
      </div>
    </div>
  );
}