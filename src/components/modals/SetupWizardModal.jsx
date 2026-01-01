import React from 'react';
import { ExternalLink, HelpCircle, PlayCircle } from 'lucide-react';

export default function SetupWizardModal({ isOpen, onClose, apiKey, setApiKey }) {
  if (!isOpen) return null;

  // 공식 가이드 페이지 (새 창으로 열기)
  const openGuide = () => {
    // 구글 공식 문서 (한글, 스크린샷 포함)
    window.open('https://ai.google.dev/gemini-api/docs/api-key?hl=ko', '_blank');
  };

  // 키 발급 페이지 바로가기
  const openKeyGen = () => {
    window.open('https://aistudio.google.com/app/apikey', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-indigo-900/90 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 transform transition-all">
            <h2 className="text-2xl font-bold mb-3 text-gray-900">환영합니다! 👋</h2>
            
            <div className="mb-6 text-gray-600 leading-relaxed">
                <p>선생님의 업무를 도와줄 <b>교무수첩 Pro</b>입니다.</p>
                <p className="flex flex-wrap items-center gap-1">
                    Gemini API Key를 입력하면 강력한 <b>AI 기능</b>을 사용할 수 있습니다.
                    {/* 가이드 링크 버튼 */}
                    <button 
                        onClick={openGuide}
                        className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition border border-indigo-100"
                        title="발급 방법 가이드 보기"
                    >
                        <HelpCircle size={12} />
                        발급 가이드 보기 (사진 포함)
                    </button>
                </p>
            </div>

            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">
                        API Key 입력
                    </label>
                    <button 
                        onClick={openKeyGen}
                        className="text-xs flex items-center gap-1 text-blue-600 hover:underline font-medium"
                    >
                        <ExternalLink size={12} />
                        키 발급받으러 가기 (Google AI Studio)
                    </button>
                </div>
                
                <input 
                    type="text" 
                    value={apiKey} 
                    onChange={e => setApiKey(e.target.value)} 
                    className="w-full border border-gray-300 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition text-gray-800 placeholder-gray-400" 
                    placeholder="API 키를 복사해서 붙여넣으세요." 
                />
                <p className="mt-2 text-xs text-gray-400">
                    * 입력한 키는 선생님의 브라우저(Local)에만 저장되어 안전합니다.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button 
                    onClick={onClose} 
                    className="flex-1 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md flex justify-center items-center gap-2"
                >
                    <PlayCircle size={20} />
                    시작하기
                </button>
                
                {/* 건너뛰기 버튼 */}
                <button 
                    onClick={onClose} 
                    className="sm:w-auto px-6 py-3.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition border border-transparent hover:border-gray-200"
                >
                    입력 없이 둘러보기
                </button>
            </div>
        </div>
    </div>
  );
}